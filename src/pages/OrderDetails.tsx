import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextLoader from "@/components/TextLoader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Truck, Package, HelpCircle, ChevronRight, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF, OrderData, InvoiceResult } from "@/lib/invoiceGenerator";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";
import ReviewDialog from "@/components/ReviewDialog";
import { ORDER_STATUS_CONFIG, getStatusConfig } from "@/lib/orderStatus";

interface OrderItem {
    id: string;
    shoe_id: string;
    quantity: number;
    size: number;
    color: string;
    price: number;
    shoe?: {
        name: string;
        brand: string;
        image_url: string | null;
    };
}

interface Order {
    id: string;
    order_code: string | null;
    created_at: string | null;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    tax: number;
    discount_code: string | null;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    apartment: string | null;
    city: string;
    postal_code: string;
    payment_method: string | null;
    order_items: OrderItem[];
}

const OrderDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const { addToCart } = useCart();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceResult | null>(null);

    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItemToReview, setSelectedItemToReview] = useState<OrderItem | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please login to view order details");
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!user || !id) return;

            try {
                const { data, error } = await supabase
                    .from("orders")
                    .select(
                        `
            id,
            order_code,
            created_at,
            status,
            total,
            subtotal,
            shipping_cost,
            tax,
            discount_code,
            first_name,
            last_name,
            email,
            phone,
            address,
            apartment,
            city,
            postal_code,
            payment_method,
            order_items (
              id,
              shoe_id,
              quantity,
              size,
              color,
              price,
              shoes:shoe_id (
                name,
                brand,
                image_url
              )
            )
          `
                    )
                    .eq("id", id)
                    .eq("user_id", user.id)
                    .single();

                if (error) throw error;

                // Transform data
                const transformedOrder = {
                    ...data,
                    order_items: data.order_items.map((item: any) => ({
                        ...item,
                        shoe: item.shoes,
                    })),
                };

                setOrder(transformedOrder);
            } catch (error: any) {
                console.error("Error fetching order details:", error);
                toast.error("Failed to load order details");
                navigate("/order-history");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrderDetails();
        }
    }, [user, id, navigate]);

    const handleBuyAgainItem = async (item: OrderItem) => {
        if (!item.shoe) return;
        try {
            await addToCart({
                shoeId: item.shoe_id,
                name: item.shoe.name,
                brand: item.shoe.brand,
                price: item.price,
                size: item.size,
                color: item.color,
                image: item.shoe.image_url || "",
                quantity: 1, // Default to 1 for generic "Buy Again"
            });
            toast.success("Item added to cart!");
            navigate("/cart");
        } catch (error) {
            console.error("Error adding item to cart:", error);
            toast.error("Failed to add item to cart");
        }
    };

    const handleViewInvoice = async () => {
        if (!order) return;

        setIsGeneratingInvoice(true);
        const orderData: OrderData = {
            orderCode: order.order_code || "N/A",
            createdAt: order.created_at || new Date().toISOString(),
            status: order.status,
            firstName: order.first_name,
            lastName: order.last_name,
            email: order.email,
            phone: order.phone,
            address: order.address,
            apartment: order.apartment || undefined,
            city: order.city,
            postalCode: order.postal_code,
            items: order.order_items.map((item) => ({
                name: item.shoe?.name || "Product",
                brand: item.shoe?.brand || "Brand",
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                color: item.color,
                imageUrl: item.shoe?.image_url,
            })),
            subtotal: order.subtotal,
            shippingCost: order.shipping_cost,
            // tax: order.tax, // Removed from interface
            discountCode: order.discount_code || undefined,
            discountAmount: order.subtotal + order.shipping_cost - order.total, // Added calculation
            total: order.total,
            paymentMethod: order.payment_method || undefined,
        };

        try {
            if (invoiceData) {
                invoiceData.cleanup();
            }
            const result = await generateInvoicePDF(orderData);
            setInvoiceData(result);
            setInvoiceModalOpen(true);
        } catch (error) {
            toast.error("Failed to generate invoice");
        } finally {
            setIsGeneratingInvoice(false);
        }
    };

    const handleCloseInvoiceModal = () => {
        setInvoiceModalOpen(false);
        setTimeout(() => {
            if (invoiceData) {
                invoiceData.cleanup();
                setInvoiceData(null);
            }
        }, 500);
    };

    const handleWriteReview = (item: OrderItem) => {
        setSelectedItemToReview(item);
        setReviewModalOpen(true);
    };

    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancelOrder = async () => {
        if (!order) return;

        // Confirm cancellation
        if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
            return;
        }

        setIsCancelling(true);
        try {
            const { error } = await supabase.rpc('cancel_order' as any, { p_order_id: order.id });

            if (error) throw error;

            toast.success("Order cancelled successfully");
            // Refresh order details
            window.location.reload();
        } catch (error: any) {
            console.error("Error cancelling order:", error);
            toast.error(error.message || "Failed to cancel order");
        } finally {
            setIsCancelling(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#f9fafb] text-foreground flex flex-col font-sans">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-12">
                    <div className="flex items-center justify-center h-64">
                        <TextLoader className="text-2xl" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) return null;

    const orderedDate = order.created_at
        ? new Date(order.created_at)
        : new Date();

    const formattedDate = orderedDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const deliveryDate = new Date(orderedDate);
    deliveryDate.setDate(deliveryDate.getDate() + 5); // Mock delivery date
    const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    // Helper to determine timeline state
    const getTimelineStepStatus = (stepIndex: number, currentStatus: string) => {
        // Steps: 0: Placed, 1: Processing, 2: Shipped, 3: Delivered
        const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];

        // Handle cancelled specifically
        if (currentStatus === 'cancelled') {
            if (stepIndex === 0) return 'completed'; // Order Placed is done
            if (stepIndex === 1) return 'cancelled'; // Replaced Processing with Cancelled in UI
            return 'inactive';
        }

        const currentIndex = statusOrder.indexOf(currentStatus);
        // If status not found (e.g. 'confirmed'), map it
        const normalizedIndex = currentIndex === -1
            ? (currentStatus === 'confirmed' ? 1 : 0)
            : currentIndex;

        if (stepIndex < normalizedIndex) return 'completed';
        if (stepIndex === normalizedIndex) return 'current';
        return 'inactive';
    };

    return (
        <div className="min-h-screen bg-[#f9fafb] text-foreground flex flex-col font-sans">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-8 max-w-6xl">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link to="/" className="hover:text-foreground">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link to="/order-history" className="hover:text-foreground">Orders</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium">Order #{order.order_code}</span>
                </div>

                {/* Header Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-end">
                    <div className="lg:col-span-2">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">
                                    ORDER #{order.order_code}
                                </h1>
                                <p className="text-muted-foreground">
                                    Placed on {formattedDate}
                                </p>
                            </div>

                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm tracking-wide self-start md:self-center ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                <div className={`rounded-full p-0.5 ${statusConfig.iconColor.replace('text-', 'bg-').replace('600', '600')} text-white`}>
                                    <StatusIcon className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                                {statusConfig.label.toUpperCase()}
                            </div>
                        </div>
                        <hr className="border-gray-200" />
                    </div>
                    <div className="hidden lg:flex items-center justify-end pb-1 pr-1">
                        <Button
                            variant="ghost"
                            onClick={handleViewInvoice}
                            disabled={isGeneratingInvoice}
                            className="p-0 h-auto font-bold text-sm underline hover:bg-transparent hover:text-foreground"
                        >
                            {isGeneratingInvoice ? "Generating..." : "View Invoice"}
                        </Button>

                        {order.status === 'pending' && (
                            <Button
                                variant="outline"
                                onClick={handleCancelOrder}
                                disabled={isCancelling}
                                className="ml-4 h-auto font-bold text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            >
                                {isCancelling ? "Cancelling..." : "Cancel Order"}
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN (2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Delivery Details Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                            <div className="flex items-center gap-2 font-bold mb-6">
                                <Truck className="w-5 h-5 text-red-500 fill-red-500/10" />
                                <span className="text-lg">Delivery Details</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Delivery Date</h4>
                                    {order.status === 'cancelled' ? (
                                        <p className="text-lg font-bold text-red-500">Order Cancelled</p>
                                    ) : order.status === 'delivered' ? (
                                        <>
                                            <p className="text-lg font-bold">{formattedDeliveryDate}</p>
                                            <p className="text-sm text-green-600 font-medium">Arrived at 2:30 PM (Simulated)</p>
                                        </>
                                    ) : (
                                        <p className="text-lg font-bold">Estimated: Pending Approval</p>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Shipping Address</h4>
                                    <p className="font-bold">{order.first_name} {order.last_name}</p>
                                    <p className="text-muted-foreground">{order.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Items in Order */}
                        <div>
                            <h2 className="font-bold text-xl mb-4">Items in Order ({order.order_items.length})</h2>
                            <div className="space-y-4">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6">
                                        {/* Product Image */}
                                        <div className="w-full md:w-32 h-32 bg-gray-50 rounded-lg p-2 flex items-center justify-center flex-shrink-0">
                                            {item.shoe?.image_url ? (
                                                <img
                                                    src={item.shoe.image_url}
                                                    alt={item.shoe.name}
                                                    className="w-full h-full object-contain mix-blend-multiply"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-200 rounded" />
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-grow">
                                            <div className="flex flex-col md:flex-row md:justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{item.shoe?.brand}</p>
                                                    <Link to={`/product/${item.shoe_id}`} className="font-black text-xl hover:underline block mb-2">{item.shoe?.name}</Link>
                                                    <div className="text-sm text-muted-foreground space-x-4">
                                                        <span>Size: <span className="font-medium text-foreground">{item.size}</span></span>
                                                        <span>Qty: <span className="font-medium text-foreground">{item.quantity}</span></span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 md:mt-0">
                                                    <span className="font-bold text-lg">Rs.{item.price.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleWriteReview(item)}
                                                    className="p-0 h-auto font-bold text-sm underline hover:bg-transparent text-[#EF233C] hover:text-[#D90429]"
                                                >
                                                    WRITE REVIEW
                                                </Button>
                                                {order.status !== 'pending' && (
                                                    <Button
                                                        onClick={() => handleBuyAgainItem(item)}
                                                        className="bg-[#EF233C] hover:bg-black text-white font-bold h-10 px-4 rounded-lg transition-colors text-sm uppercase"
                                                    >
                                                        BUY AGAIN
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (1/3 width) - Sticky Sidebar */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Order Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-lg mb-6">Order Status</h3>
                            <div className="relative pl-3 space-y-8">
                                <div className="absolute left-[30px] top-2 bottom-2 w-0.5 bg-gray-100" />

                                {order.status === 'cancelled' ? (
                                    <>
                                        {/* Cancelled State Timeline */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-[11px] top-1.5 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,35,60,0.2)] z-10" />
                                            <h4 className="font-bold text-sm text-black">Cancelled</h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">Order has been cancelled.</p>
                                        </div>
                                        <div className="relative pl-8">
                                            <div className="absolute left-[13px] top-1.5 w-3 h-3 rounded-full bg-black z-10" />
                                            <h4 className="font-bold text-sm text-gray-500">Order Placed</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">{formattedDate}, 10:15 AM</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Standard Timeline */}
                                        {/* Step 4: Delivered */}
                                        <div className="relative pl-8">
                                            <div className={`absolute left-[11px] top-1.5 w-4 h-4 rounded-full border-2 z-10 
                                                ${getTimelineStepStatus(3, order.status) === 'current' || getTimelineStepStatus(3, order.status) === 'completed'
                                                    ? 'bg-green-500 border-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]'
                                                    : 'bg-white border-gray-200'}`}
                                            />
                                            <h4 className={`font-bold text-sm ${getTimelineStepStatus(3, order.status) !== 'inactive' ? 'text-black' : 'text-gray-400'}`}>Delivered</h4>
                                            {getTimelineStepStatus(3, order.status) !== 'inactive' && (
                                                <p className="text-xs text-gray-500 mt-0.5">Package delivered to recipient.</p>
                                            )}
                                        </div>

                                        {/* Step 3: Shipped */}
                                        <div className="relative pl-8">
                                            <div className={`absolute left-[13px] top-1.5 w-3 h-3 rounded-full z-10 
                                                ${getTimelineStepStatus(2, order.status) !== 'inactive' ? 'bg-purple-500' : 'bg-gray-200'}`}
                                            />
                                            <h4 className={`font-bold text-sm ${getTimelineStepStatus(2, order.status) !== 'inactive' ? 'text-black' : 'text-gray-400'}`}>Shipped</h4>
                                        </div>

                                        {/* Step 2: Processing */}
                                        <div className="relative pl-8">
                                            <div className={`absolute left-[13px] top-1.5 w-3 h-3 rounded-full z-10 
                                                ${getTimelineStepStatus(1, order.status) !== 'inactive' ? 'bg-blue-500' : 'bg-gray-200'}`}
                                            />
                                            <h4 className={`font-bold text-sm ${getTimelineStepStatus(1, order.status) !== 'inactive' ? 'text-black' : 'text-gray-400'}`}>Processing</h4>
                                        </div>

                                        {/* Step 1: Placed */}
                                        <div className="relative pl-8">
                                            <div className="absolute left-[13px] top-1.5 w-3 h-3 rounded-full bg-black z-10" />
                                            <h4 className="font-bold text-sm text-black">Order Placed</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-lg mb-6">Order Summary</h3>
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({order.order_items.length} items)</span>
                                    <span className="font-medium text-foreground">Rs.{order.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Shipping</span>
                                    <span className="font-medium text-foreground">{order.shipping_cost === 0 ? "Free" : `Rs.${order.shipping_cost}`}</span>
                                </div>

                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <span className="font-bold text-base">Total</span>
                                <span className="font-black text-2xl">Rs.{order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                </div>

            </main >

            <InvoicePreviewModal
                isOpen={invoiceModalOpen}
                onClose={handleCloseInvoiceModal}
                blobUrl={invoiceData?.blobUrl || null}
                onDownload={invoiceData?.download || (() => { })}
                orderCode={order.order_code || "N/A"}
            />

            {
                selectedItemToReview && user && (
                    <ReviewDialog
                        isOpen={reviewModalOpen}
                        onClose={() => setReviewModalOpen(false)}
                        shoeId={selectedItemToReview.shoe_id}
                        userId={user.id}
                    />
                )
            }
        </div >
    );
};

export default OrderDetails;

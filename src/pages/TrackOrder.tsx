import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextLoader from "@/components/TextLoader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Truck, Package, HelpCircle, ChevronRight, MapPin, Clock, Activity } from "lucide-react";
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
    updated_at: string | null; // Added updated_at
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

const TrackOrder = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const { addToCart } = useCart();
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceResult | null>(null);
    // Removed local lastUpdated state in favor of order.updated_at logic

    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedItemToReview, setSelectedItemToReview] = useState<OrderItem | null>(null);

    const [isCancelling, setIsCancelling] = useState(false);

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
            updated_at,
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

                if (error || !data) throw error || new Error("Order not found");

                // Transform data
                const transformedOrder: Order = {
                    ...(data as any),
                    order_items: (data as any).order_items.map((item: any) => ({
                        ...item,
                        shoe: item.shoes,
                    })),
                };

                setOrder(transformedOrder);
            } catch (error: any) {
                console.error("Error fetching order details:", error);
                toast.error("Failed to load tracking details");
                navigate("/order-history");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrderDetails();
        }
    }, [user, id, navigate]);

    // Real-time subscription for order status updates
    useEffect(() => {
        if (!id) return;

        console.log("Subscribing to order updates for:", id);
        const channel = supabase
            .channel('order-status-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${id}`,
                },
                (payload) => {
                    console.log("Received order update:", payload);
                    if (payload.new && payload.new.status) {
                        setOrder((prev) => prev ? { ...prev, status: payload.new.status, updated_at: new Date().toISOString() } : null);
                        toast.info(`Order status updated to: ${payload.new.status.toUpperCase()}`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const formatLastUpdated = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (date.toDateString() === today.toDateString()) {
            return `Today ${timeStr}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday ${timeStr}`;
        } else {
            return `${date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} ${timeStr}`;
        }
    };

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
            // No reload needed as subscription will handle it, but for safety we can refetch or just let subscription do it. 
            // Actually, let's manually update locally to be instant
            setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">
                                    TRACK ORDER #{order.order_code}
                                </h1>
                                <p className="text-muted-foreground">
                                    Placed on {formattedDate}
                                </p>
                            </div>

                            {/* REMOVED ORIGINAL STATUS BADGE HERE */}
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

                        {/* LIVE STATUS CARD - NEW ADDITION */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 overflow-hidden relative">
                            {/* Animated background gradient or accent */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${statusConfig.bgColor.replace('bg-', 'bg-')}`} />

                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="relative flex h-4 w-4">
                                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig.dotColor} opacity-75`}></span>
                                            )}
                                            <span className={`relative inline-flex rounded-full h-4 w-4 ${statusConfig.dotColor} shadow-sm border border-white/20`}></span>
                                        </div>
                                        <span className={`font-black text-sm uppercase tracking-widest ${statusConfig.textColor}`}>
                                            Current Status
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black mt-2 mb-1">{statusConfig.label}</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Last updated: {order.updated_at ? formatLastUpdated(order.updated_at) : formatLastUpdated(order.created_at)}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                    <StatusIcon className="w-6 h-6" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* Horizontal Order Timeline */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-8">
                            <h3 className="font-bold text-lg mb-8">Order Status</h3>
                            <div className="w-full">
                                <div className="w-full px-2 md:px-4"> {/* Added horizontal padding for mobile */}
                                    <div className="relative flex justify-between items-center mb-10 md:mb-8"> {/* Adjusted margin */}
                                        {/* Connecting Line Background */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0" />

                                        {/* Connecting Line Progress */}
                                        <div
                                            className="absolute top-1/2 left-0 h-1 bg-green-500 -translate-y-1/2 z-0 transition-all duration-1000 ease-in-out"
                                            style={{
                                                width: order.status === 'delivered' ? '100%' :
                                                    order.status === 'shipped' ? '83%' :
                                                        ['pending', 'processing', 'confirmed'].includes(order.status) ? '50%' : '0%'
                                            }}
                                        />

                                        {/* Step 1: Placed */}
                                        <div className="relative z-10 flex flex-col items-center group">
                                            <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-colors duration-300
                                                ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status)
                                                    ? 'bg-green-500 border-green-500 text-white shadow-[0_0_0_2px_rgba(34,197,94,0.1)] md:shadow-[0_0_0_4px_rgba(34,197,94,0.1)]'
                                                    : 'bg-white border-gray-200 text-gray-400'}`}
                                            >
                                                <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className={`absolute top-8 md:top-12 text-[10px] md:text-sm font-bold whitespace-nowrap transition-colors duration-300 mt-1
                                                ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'text-black' : 'text-gray-400'}
                                                left-0 md:left-1/2 md:-translate-x-1/2 text-left md:text-center`}>
                                                Placed
                                            </span>
                                            <span className="absolute top-12 md:top-20 text-[9px] md:text-[11px] text-gray-500 whitespace-nowrap font-medium mt-1 left-0 md:left-1/2 md:-translate-x-1/2 text-left md:text-center">
                                                {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>

                                        {/* Step 2: Processing */}
                                        <div className="relative z-10 flex flex-col items-center group">
                                            <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-colors duration-300
                                                ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status)
                                                    ? 'bg-green-500 border-green-500 text-white shadow-[0_0_0_2px_rgba(34,197,94,0.1)] md:shadow-[0_0_0_4px_rgba(34,197,94,0.1)]'
                                                    : 'bg-white border-gray-200 text-gray-400'}`}
                                            >
                                                {['pending', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                                                    <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`absolute top-8 md:top-12 text-[10px] md:text-sm font-bold whitespace-nowrap transition-colors duration-300 mt-1
                                                ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'text-black' : 'text-gray-400'}
                                                left-1/2 -translate-x-1/2 text-center`}>
                                                Processing
                                            </span>
                                            {['pending', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                                                <span className="absolute top-12 md:top-20 text-[9px] md:text-[11px] text-gray-500 whitespace-nowrap font-medium mt-1 left-1/2 -translate-x-1/2 text-center">
                                                    {new Date(order.created_at || new Date()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Step 3: Shipped */}
                                        <div className="relative z-10 flex flex-col items-center group">
                                            <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-colors duration-300
                                                ${['shipped', 'delivered'].includes(order.status)
                                                    ? 'bg-green-500 border-green-500 text-white shadow-[0_0_0_2px_rgba(34,197,94,0.1)] md:shadow-[0_0_0_4px_rgba(34,197,94,0.1)]'
                                                    : 'bg-white border-gray-200 text-gray-400'}`}
                                            >
                                                {['shipped', 'delivered'].includes(order.status) && (
                                                    <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`absolute top-8 md:top-12 text-[10px] md:text-sm font-bold whitespace-nowrap transition-colors duration-300 mt-1
                                                ${['shipped', 'delivered'].includes(order.status) ? 'text-black' : 'text-gray-400'}
                                                left-1/2 -translate-x-1/2 text-center`}>
                                                Shipped
                                            </span>
                                            {order.status === 'shipped' && order.updated_at && (
                                                <span className="absolute top-12 md:top-20 text-[9px] md:text-[11px] text-gray-500 whitespace-nowrap font-medium mt-1 left-1/2 -translate-x-1/2 text-center">
                                                    {new Date(order.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>

                                        {/* Step 4: Delivered */}
                                        <div className="relative z-10 flex flex-col items-center group">
                                            <div className={`w-6 h-6 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 md:border-4 transition-colors duration-300
                                                ${order.status === 'delivered'
                                                    ? 'bg-green-500 border-green-500 text-white shadow-[0_0_0_2px_rgba(34,197,94,0.1)] md:shadow-[0_0_0_4px_rgba(34,197,94,0.1)]'
                                                    : 'bg-white border-gray-200 text-gray-400'}`}
                                            >
                                                {order.status === 'delivered' && (
                                                    <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`absolute top-8 md:top-12 text-[10px] md:text-sm font-bold whitespace-nowrap transition-colors duration-300 mt-1
                                                ${order.status === 'delivered' ? 'text-black' : 'text-gray-400'}
                                                right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 text-right md:text-center`}>
                                                Delivered
                                            </span>
                                            {order.status === 'delivered' && (
                                                <span className="absolute top-12 md:top-20 text-[9px] md:text-[11px] text-green-600 whitespace-nowrap font-medium mt-1 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 text-right md:text-center">
                                                    {new Date(order.updated_at || new Date()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

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
                                            <p className="text-lg font-bold">{order.updated_at ? new Date(order.updated_at).toLocaleDateString() : formattedDeliveryDate}</p>
                                            <p className="text-sm text-green-600 font-medium">{order.updated_at ? new Date(order.updated_at).toLocaleTimeString() : "Arrived"}</p>
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
                                {order.subtotal + order.shipping_cost - order.total > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount {order.discount_code ? `(${order.discount_code})` : ''}</span>
                                        <span className="font-medium">-Rs.{(order.subtotal + order.shipping_cost - order.total).toLocaleString()}</span>
                                    </div>
                                )}

                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                <span className="font-bold text-base">Total</span>
                                <span className="font-black text-2xl">Rs.{order.total.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Mobile Actions - Bottom of page */}
                        <div className="lg:hidden flex flex-col gap-4 mt-8 pt-6 border-t border-gray-100">
                            <Button
                                onClick={handleViewInvoice}
                                disabled={isGeneratingInvoice}
                                className="w-full py-6 text-base font-black rounded-xl bg-black hover:bg-gray-800 text-white shadow-md transition-all duration-300 uppercase tracking-wide"
                            >
                                {isGeneratingInvoice ? "Generating..." : "View Invoice"}
                            </Button>

                            {order.status === 'pending' && (
                                <Button
                                    variant="outline"
                                    onClick={handleCancelOrder}
                                    disabled={isCancelling}
                                    className="w-full py-6 text-base font-black rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 uppercase tracking-wide"
                                >
                                    {isCancelling ? "Cancelling..." : "Cancel Order"}
                                </Button>
                            )}
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

export default TrackOrder;

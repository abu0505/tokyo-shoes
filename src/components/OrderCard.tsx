import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Truck, FileText } from "lucide-react";
import { generateInvoicePDF, OrderData, InvoiceResult } from "@/lib/invoiceGenerator";
import { toast } from "sonner";
import InvoicePreviewModal from "./InvoicePreviewModal";
import { getStatusConfig } from "@/lib/orderStatus";

export interface OrderItem {
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

export interface Order {
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

interface OrderCardProps {
    order: Order;
    onBuyAgain: () => void;
}

const OrderCard = ({ order, onBuyAgain }: OrderCardProps) => {
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceResult | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);

    // Get status config
    const statusConfig = getStatusConfig(order.status);

    // Status flags
    const isCancelled = order.status === 'cancelled';
    const isShipped = order.status === 'shipped';
    const isDelivered = order.status === 'delivered';
    const isProcessing = order.status === 'processing' || order.status === 'confirmed';

    // Format date
    const formattedDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })
        : "Date unknown";

    const handleViewInvoice = async () => {
        setIsGenerating(true);
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
            // tax: order.tax, // Removed
            discountCode: order.discount_code || undefined,
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
            setIsGenerating(false);
        }
    };

    const handleCloseModal = () => {
        setInvoiceModalOpen(false);
        // Clean up blob URL after a short delay to ensure modal close animation finishes
        setTimeout(() => {
            if (invoiceData) {
                invoiceData.cleanup();
                setInvoiceData(null);
            }
        }, 500);
    };

    const handleTrackOrder = () => {
        // Logic for tracking
        toast.info("Tracking functionality coming soon!");
    };

    return (
        <>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                {/* Top Row: Order ID + Status | View Invoice */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold tracking-tight">
                            Order #{order.order_code || "N/A"}
                        </h3>
                        <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.iconColor.replace('text-', 'bg-')}`} />
                            {statusConfig.label.toUpperCase()}
                        </div>
                    </div>

                    {/* View Invoice Link (Only if delivered) */}
                    {isDelivered && (
                        <button
                            onClick={handleViewInvoice}
                            disabled={isGenerating}
                            className="text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed group underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground"
                        >
                            {isGenerating ? (
                                <div className="w-3 h-3 border-2 border-t-transparent border-muted-foreground rounded-full animate-spin" />
                            ) : (
                                <FileText className="w-4 h-4" />
                            )}
                            {isGenerating ? "Loading..." : "View Invoice"}
                        </button>
                    )}
                </div>

                {/* Sub-header: Date • Price */}
                <div className="text-sm text-muted-foreground mb-6 font-medium">
                    {formattedDate} • <span className="text-foreground font-bold">Rs.{order.total.toFixed(2)}</span>
                </div>

                {/* Content Row: Images | Buttons */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    {/* Product Images List */}
                    <div className="flex flex-wrap gap-4">
                        {order.order_items.map((item) => (
                            <Link
                                to={`/product/${item.shoe_id}`}
                                key={item.id}
                                className="w-28 h-28 flex items-center justify-center p-2 transition-opacity hover:opacity-80"
                            >
                                {item.shoe?.image_url ? (
                                    <img
                                        src={item.shoe.image_url}
                                        alt={item.shoe.name}
                                        className="w-full h-full rounded-xl object-contain mix-blend-multiply"
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-muted rounded" />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {isShipped && (
                            <Button
                                onClick={handleTrackOrder}
                                variant="outline"
                                className="flex-1 md:flex-none font-bold rounded-lg h-10 border-gray-200 gap-2"
                            >
                                <Truck className="h-4 w-4" />
                                Track Order
                            </Button>
                        )}
                        {!isCancelled && !isShipped && !isDelivered && (
                            <Button
                                variant="outline"
                                className="flex-1 md:flex-none font-bold rounded-lg h-10 border-gray-200"
                                asChild
                            >
                                <Link to={`/order/${order.id}`}>
                                    View Details
                                </Link>
                            </Button>
                        )}

                        {/* Always show Buy Again for all history items as requested */}
                        <Button
                            onClick={onBuyAgain}
                            className="flex-1 md:flex-none font-bold rounded-lg h-10 bg-[#EF233C] text-white hover:bg-black transition-colors"
                        >
                            Buy Again
                        </Button>
                    </div>
                </div>
            </div>

            <InvoicePreviewModal
                isOpen={invoiceModalOpen}
                onClose={handleCloseModal}
                blobUrl={invoiceData?.blobUrl || null}
                onDownload={invoiceData?.download || (() => { })}
                orderCode={order.order_code || "N/A"}
            />
        </>
    );
};

export default OrderCard;

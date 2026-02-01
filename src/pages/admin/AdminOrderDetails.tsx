import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Printer,
    RefreshCw,
    MapPin,
    CreditCard,
    User,
    Package,
    Copy,
    Ruler,
    Phone,
    Pencil,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    useAdminOrderDetails,
    useUpdateAdminOrderStatus,
    OrderStatus,
} from '@/hooks/useAdminOrderDetails';
import { Separator } from '@/components/ui/separator';
import { formatPrice, formatDate } from '@/lib/format';
import { getRandomColor } from '@/lib/colors';
import { toast } from 'sonner';
import { generateInvoicePDF, OrderData, InvoiceResult } from '@/lib/invoiceGenerator';
import InvoicePreviewModal from '@/components/InvoicePreviewModal';
import TextLoader from '@/components/TextLoader';
import EditOrderDialog from '@/components/admin/EditOrderDialog';

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'shipped', label: 'Shipped', color: 'bg-blue-500' },
    { value: 'delivered', label: 'Delivered', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

const getStatusBadgeClasses = (status: string) => {
    switch (status) {
        case 'pending':
            return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case 'shipped':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'delivered':
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'cancelled':
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        default:
            return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
};

const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const AdminOrderDetails = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { data: order, isLoading, error } = useAdminOrderDetails(orderId);

    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceResult | null>(null);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Handle print invoice
    const handlePrintInvoice = async () => {
        if (!order) return;

        setIsGeneratingInvoice(true);
        const orderData: OrderData = {
            orderCode: order.order_code || 'N/A',
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
                name: item.shoe?.name || 'Product',
                brand: item.shoe?.brand || 'Brand',
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
        } catch (err) {
            toast.error('Failed to generate invoice');
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

    // Copy tracking number
    const handleCopyTracking = () => {
        const trackingNumber = `TKY-${order?.order_code?.replace('ORD-', '') || '000000'}-JP`;
        navigator.clipboard.writeText(trackingNumber);
        toast.success('Tracking number copied!');
    };

    // Error state
    if (error) {
        toast.error('Order not found');
        navigate('/admin/orders');
        return null;
    }

    // Format order date
    const formattedDate = order?.created_at
        ? new Date(order.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        : '';

    return (
        <AdminLayout
            header={
                <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex flex-col justify-center">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">Orders Management</h2>
                        <p className="text-xs text-muted-foreground">Manage and track customer orders</p>
                    </div>
                </header>
            }
        >
            <div className="space-y-6">
                {/* Order Header */}
                <div className="mb-6 flex items-center justify-between">
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-black text-black tracking-tight">
                                        #{order?.order_code || orderId?.slice(0, 8).toUpperCase()}
                                    </h1>
                                    <Badge
                                        variant="outline"
                                        className={`font-bold uppercase text-xs border ${getStatusBadgeClasses(order?.status || '')}`}
                                    >
                                        <span className="mr-1.5">●</span>
                                        {order?.status}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground text-sm">{formattedDate}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={handlePrintInvoice}
                                disabled={isGeneratingInvoice || isLoading}
                                className="border-border text-foreground hover:bg-black hover:text-white transition-colors"
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {isGeneratingInvoice ? <TextLoader text="Generating" /> : 'Print Invoice'}
                            </Button>
                        </>
                    )}
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Order Items */}
                    <div className="lg:col-span-2">
                        <Card className="bg-white border border-[#e6dbdc] rounded-2xl shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
                                <CardTitle className="text-foreground font-bold text-base">Order Items</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {isLoading ? (
                                    <div className="space-y-6">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="flex gap-4">
                                                <Skeleton className="h-20 w-20 rounded-lg" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-5 w-48" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <div className="text-right space-y-2">
                                                    <Skeleton className="h-4 w-16" />
                                                    <Skeleton className="h-5 w-20" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {order?.order_items.map((item, index) => (
                                            <div key={item.id} className="space-y-6">
                                                <div className="flex gap-4">
                                                    {/* Product Image */}
                                                    <div className="h-20 w-20 bg-secondary/50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-border">
                                                        {item.shoe?.image_url ? (
                                                            <img
                                                                src={item.shoe.image_url}
                                                                alt={item.shoe.name}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Package className="h-8 w-8 text-muted-foreground" />
                                                        )}
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                            {item.shoe?.brand || 'Brand'}
                                                        </p>
                                                        <h3 className="font-bold text-foreground truncate text-lg">
                                                            {item.shoe?.name || 'Unknown Product'}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1 text-sm font-medium text-foreground">
                                                            <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>Size: {item.size}</span>
                                                            <span className="text-muted-foreground mx-1">|</span>
                                                            <span>QTY: {item.quantity}</span>
                                                        </div>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right flex-shrink-0 flex flex-col justify-center">
                                                        <p className="text-sm text-muted-foreground">Price</p>
                                                        <p className="font-bold text-foreground text-lg">{formatPrice(item.price)}</p>
                                                    </div>
                                                </div>
                                                {index < (order?.order_items.length || 0) - 1 && <Separator />}
                                            </div>
                                        ))}

                                        {/* Order Summary */}
                                        <div className="pt-6 border-t border-border space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span className="text-foreground font-medium">{formatPrice(order?.subtotal || 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping ({order?.shipping_method || 'Standard'})</span>
                                                <span className="text-foreground font-medium">{formatPrice(order?.shipping_cost || 0)}</span>
                                            </div>

                                            <div className="flex justify-between pt-3 border-t border-border">
                                                <span className="font-bold text-foreground">Grand Total</span>
                                                <span className="font-black text-xl text-black">{formatPrice(order?.total || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Customer & Shipping Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Customer Card */}
                        <Card className="bg-white border border-[#e6dbdc] rounded-2xl shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="text-foreground font-bold text-base">Customer</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-48" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarFallback className={`font-bold text-sm ${getRandomColor(order?.email || '')}`}>
                                                    {getInitials(order?.first_name || '', order?.last_name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-foreground">
                                                    {order?.first_name} {order?.last_name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    {order?.email}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Phone className="h-3 w-3" />
                                                    {order?.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Orders</p>
                                                <p className="text-xl font-bold text-foreground">{order?.customer_total_orders || 0}</p>
                                            </div>
                                            <div className="h-8 w-[1px] bg-border mx-2"></div>
                                            <div className="text-center flex-1">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Lifetime Value</p>
                                                <p className="text-xl font-bold text-foreground">{formatPrice(order?.customer_lifetime_value || 0)}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Shipping Address Card */}
                        <Card className="bg-white border border-[#e6dbdc] rounded-2xl shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="text-foreground font-bold text-base">Shipping Address</CardTitle>
                                <div className="flex items-center gap-2">
                                    {!isLoading && order && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => setIsEditModalOpen(true)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-4 w-40" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                            <div>
                                                <p className="font-bold text-foreground">{order?.first_name} {order?.last_name}</p>
                                                <p className="text-sm text-muted-foreground">{order?.address}</p>
                                                {order?.apartment && <p className="text-sm text-muted-foreground">{order?.apartment}</p>}
                                                <p className="text-sm text-muted-foreground">{order?.city}, {order?.postal_code}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Invoice Preview Modal */}
            <InvoicePreviewModal
                isOpen={invoiceModalOpen}
                onClose={handleCloseInvoiceModal}
                blobUrl={invoiceData?.blobUrl || null}
                onDownload={invoiceData?.download || (() => { })}
                orderCode={order?.order_code || 'N/A'}
            />

            {/* Edit Order Modal */}
            {order && (
                <EditOrderDialog
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    order={order}
                />
            )}
        </AdminLayout>
    );
};

export default AdminOrderDetails;

import { Clock, Package, Truck, CheckCircle, XCircle, LucideIcon } from 'lucide-react';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderStatusConfig {
    label: string;
    bgColor: string;
    textColor: string;
    iconColor: string; // For the text/icon color
    dotColor: string; // For the solid background color (e.g. bg-yellow-800)
    icon: LucideIcon;
    description: string;
}

export const ORDER_STATUS_CONFIG: Record<string, OrderStatusConfig> = {
    pending: {
        label: "Order Placed",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
        iconColor: "text-yellow-800",
        dotColor: "bg-yellow-800",
        icon: Clock,
        description: "We've received your order and are verifying details."
    },
    processing: {
        label: "Processing",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        iconColor: "text-blue-800",
        dotColor: "bg-blue-800",
        icon: Package,
        description: "Your items are being packed and prepared for dispatch."
    },
    shipped: {
        label: "Shipped",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800",
        iconColor: "text-purple-800",
        dotColor: "bg-purple-800",
        icon: Truck,
        description: "Your package is on the way."
    },
    delivered: {
        label: "Delivered",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        iconColor: "text-green-800",
        dotColor: "bg-green-800",
        icon: CheckCircle,
        description: "Package delivered successfully."
    },
    cancelled: {
        label: "Cancelled",
        bgColor: "bg-red-100",
        textColor: "text-red-800",
        iconColor: "text-red-800",
        dotColor: "bg-red-800",
        icon: XCircle,
        description: "This order has been cancelled and will not be shipped."
    }
};

// Map database statuses to our config keys if they differ
// Assuming db statuses are: pending, payment_verified (-> processing), shipped, delivered, cancelled
// Adjust as needed based on actual DB values found in src/pages/admin/Orders.tsx (pending, shipped, delivered, cancelled)
export const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();

    // Map specific DB statuses to our 5 main states
    if (normalizedStatus === 'confirmed') return ORDER_STATUS_CONFIG['processing'];
    if (normalizedStatus === 'awaiting_confirmation') return ORDER_STATUS_CONFIG['pending'];

    // Default fallback
    return ORDER_STATUS_CONFIG[normalizedStatus] || ORDER_STATUS_CONFIG['pending'];
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// Types for joined data
export type OrderStatus = 'pending' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItemWithShoe {
    id: string;
    order_id: string;
    shoe_id: string;
    quantity: number;
    size: number;
    color: string;
    price: number;
    created_at: string | null;
    shoe: {
        id: string;
        name: string;
        brand: string;
        image_url: string | null;
    } | null;
}

export interface AdminOrderDetail {
    id: string;
    order_code: string | null;
    created_at: string | null;
    status: string;
    total: number;
    subtotal: number;
    shipping_cost: number;
    shipping_method: string;
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
    user_id: string;
    order_items: OrderItemWithShoe[];
    // Customer stats (calculated)
    customer_total_orders?: number;
    customer_lifetime_value?: number;
}

// Fetch single order with deep joins
const fetchOrderDetails = async (orderId: string): Promise<AdminOrderDetail> => {
    // Fetch the order with order items and shoes
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                id,
                order_id,
                shoe_id,
                quantity,
                size,
                color,
                price,
                created_at,
                shoes:shoe_id (
                    id,
                    name,
                    brand,
                    image_url
                )
            )
        `)
        .eq('id', orderId)
        .single();

    if (orderError) {
        throw orderError;
    }

    if (!order) {
        throw new Error('Order not found');
    }

    // Get customer stats (total orders and lifetime value)
    const { data: customerOrders, error: statsError } = await supabase
        .from('orders')
        .select('total')
        .eq('user_id', order.user_id);

    let customerTotalOrders = 0;
    let customerLifetimeValue = 0;

    if (!statsError && customerOrders) {
        customerTotalOrders = customerOrders.length;
        customerLifetimeValue = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    }

    // Transform the data
    const transformedOrder: AdminOrderDetail = {
        ...order,
        order_items: (order.order_items || []).map((item: any) => ({
            ...item,
            shoe: item.shoes || null,
        })),
        customer_total_orders: customerTotalOrders,
        customer_lifetime_value: customerLifetimeValue,
    };

    return transformedOrder;
};

// Update order status
const updateOrderStatus = async ({
    orderId,
    status,
}: {
    orderId: string;
    status: OrderStatus;
}) => {
    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        throw error;
    }

    return { orderId, status };
};

// Hook to fetch order details
export const useAdminOrderDetails = (orderId: string | undefined) => {
    return useQuery({
        queryKey: ['admin-order-details', orderId],
        queryFn: () => fetchOrderDetails(orderId!),
        enabled: !!orderId,
    });
};

// Hook to update order status (with optimistic updates)
export const useUpdateAdminOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateOrderStatus,
        onMutate: async ({ orderId, status }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['admin-order-details', orderId] });

            // Snapshot the previous value
            const previousOrder = queryClient.getQueryData<AdminOrderDetail>(['admin-order-details', orderId]);

            // Optimistically update to the new value
            if (previousOrder) {
                queryClient.setQueryData(['admin-order-details', orderId], {
                    ...previousOrder,
                    status,
                });
            }

            return { previousOrder };
        },
        onSuccess: ({ orderId, status }) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-order-stats'] });
            toast.success(`Order status updated to ${status}`);
        },
        onError: (error: Error, { orderId }, context) => {
            // Rollback to previous value on error
            if (context?.previousOrder) {
                queryClient.setQueryData(['admin-order-details', orderId], context.previousOrder);
            }
            toast.error(`Failed to update status: ${error.message}`);
        },
    });
};

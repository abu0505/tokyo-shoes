import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CartItem {
    id: string; // Unique ID for the cart entry (e.g. shoeId + size + color)
    shoeId: string;
    name: string;
    price: number;
    image?: string;
    quantity: number;
    size: number;
    color?: string;
    brand?: string;
    maxQuantity?: number; // Optional: to limit based on stock
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    subtotal: number;
    couponDetails: { code: string; type: 'percentage' | 'fixed_amount'; value: number } | null;
    setCouponDetails: (coupon: { code: string; type: 'percentage' | 'fixed_amount'; value: number } | null) => void;
    removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [couponDetails, setCouponDetails] = useState<{ code: string; type: 'percentage' | 'fixed_amount'; value: number } | null>(() => {
        const saved = localStorage.getItem('appliedCoupon');
        return saved ? JSON.parse(saved) : null;
    });
    const [isLoading, setIsLoading] = useState(true);

    // Persist coupon to localStorage
    useEffect(() => {
        if (couponDetails) {
            localStorage.setItem('appliedCoupon', JSON.stringify(couponDetails));
        } else {
            localStorage.removeItem('appliedCoupon');
        }
    }, [couponDetails]);

    // Fetch cart items when user changes
    useEffect(() => {
        const fetchCart = async () => {
            if (!user) {
                setCartItems([]);
                setIsLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .rpc('get_cart_with_stock', { p_user_id: user.id });

                if (error) throw error;

                const itemsWithStock: CartItem[] = (data || []).map(item => ({
                    id: item.id,
                    shoeId: item.shoe_id,
                    name: item.shoe_name || 'Unknown Shoe',
                    price: item.shoe_price || 0,
                    image: item.shoe_image,
                    searchImage: item.shoe_image,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                    brand: item.brand,
                    maxQuantity: item.stock_quantity || 0
                }));

                setCartItems(itemsWithStock);

            } catch (error) {
                console.error('Error fetching cart:', error);
                toast.error('Failed to load cart');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCart();
    }, [user]);

    const addToCart = useCallback(async (newItem: Omit<CartItem, 'id'>) => {
        if (!user) {
            toast.error('Please login to add items to cart');
            return;
        }

        try {
            // First check the current stock for this item
            const { data: stockData, error: stockError } = await supabase
                .from('shoe_sizes')
                .select('quantity')
                .eq('shoe_id', newItem.shoeId)
                .eq('size', newItem.size)
                .single();

            if (stockError) {
                console.error("Error checking stock:", stockError);
                // Proceed with caution or block? Better to block if we are strict.
            }

            const availableStock = stockData ? stockData.quantity : 0;

            // Check if item already exists
            const { data: existingItem, error: fetchError } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', user.id)
                .eq('shoe_id', newItem.shoeId)
                .eq('size', newItem.size)
                .eq('color', newItem.color || 'Default')
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            let newQuantity = newItem.quantity;
            if (existingItem) {
                newQuantity += existingItem.quantity;
            }

            // Validation: Check if potential new quantity exceeds stock
            if (newQuantity > availableStock) {
                toast.error(`Sorry, only ${availableStock} items left in stock`);
                return;
            }

            if (existingItem) {
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (error) throw error;

                setCartItems(prev => prev.map(item =>
                    item.id === existingItem.id ? { ...item, quantity: newQuantity, maxQuantity: availableStock } : item
                ));
                toast.success(`Updated quantity for ${newItem.name}`);

            } else {
                const { data, error } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        shoe_id: newItem.shoeId,
                        quantity: newItem.quantity,
                        size: newItem.size,
                        color: newItem.color || 'Default',
                        brand: newItem.brand
                    })
                    .select('id')
                    .single();

                if (error) throw error;

                const newCartItem: CartItem = {
                    ...newItem,
                    id: data.id,
                    maxQuantity: availableStock
                };

                setCartItems(prev => [...prev, newCartItem]);
                toast.success(`Added ${newItem.name} to cart`);
            }

        } catch (error: any) {
            console.error('Error adding to cart:', error);
            toast.error(error.message || 'Failed to add item to cart');
        }
    }, [user]);

    const removeFromCart = useCallback(async (id: string) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setCartItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove item');
        }
    }, [user]);

    const updateQuantity = useCallback(async (id: string, quantity: number) => {
        if (!user) return;

        const newQuantity = Math.max(1, quantity);

        // Find current item to check stock limit
        const currentItem = cartItems.find(item => item.id === id);
        if (currentItem && currentItem.maxQuantity !== undefined && newQuantity > currentItem.maxQuantity) {
            toast.error(`Sorry, only ${currentItem.maxQuantity} items left in stock`);
            return;
        }

        // Optimistic update
        const previousItems = [...cartItems];
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));

        try {
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Failed to update quantity');
            // Revert state on error
            setCartItems(previousItems);
        }
    }, [user, cartItems]);

    const removeCoupon = useCallback(() => {
        setCouponDetails(null);
    }, []);

    const clearCart = useCallback(async () => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;

            setCartItems([]);
            setCouponDetails(null);
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        }
    }, [user]);

    const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

    const subtotal = useMemo(() => cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cartItems]);

    const value = useMemo(() => ({
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        subtotal,
        couponDetails,
        setCouponDetails,
        removeCoupon
    }), [cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, subtotal, couponDetails, removeCoupon]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

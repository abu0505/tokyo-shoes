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
                    .from('cart_items')
                    .select('*, shoes(name, price, image_url, brand)')
                    .eq('user_id', user.id);

                if (error) throw error;

                // Transform database response to CartItem shape
                const items: CartItem[] = data.map(item => ({
                    id: item.id,
                    shoeId: item.shoe_id,
                    name: item.shoes?.name || 'Unknown Shoe',
                    price: item.shoes?.price || 0,
                    image: item.shoes?.image_url,
                    searchImage: item.shoes?.image_url,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                    brand: item.shoes?.brand || item.brand // Fallback to item.brand if shoe brand missing
                }));

                setCartItems(items);
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
            // Check if item already exists (optimistic update could be done here but simpler to query/insert)
            // We use the unique constraint on (user_id, shoe_id, size, color) to handle upserts safely if we want,
            // but standard pattern is check existence or use upsert with conflict

            const { data: existingItem, error: fetchError } = await supabase
                .from('cart_items')
                .select('id, quantity')
                .eq('user_id', user.id)
                .eq('shoe_id', newItem.shoeId)
                .eq('size', newItem.size)
                .eq('color', newItem.color || 'Default')
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is row not found
                throw fetchError;
            }

            if (existingItem) {
                const newQuantity = existingItem.quantity + newItem.quantity;
                const { error } = await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('id', existingItem.id);

                if (error) throw error;

                setCartItems(prev => prev.map(item =>
                    item.id === existingItem.id ? { ...item, quantity: newQuantity } : item
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
                        brand: newItem.brand // Storing brand partly redundant if in shoes table, but harmless
                    })
                    .select('id') // We need the new ID
                    .single();

                if (error) throw error;

                // Optimistically adding to state with the new ID
                // But wait, we need the DB ID. The insert returns it.
                // We construct the full item for state
                const newCartItem: CartItem = {
                    ...newItem,
                    id: data.id
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
            // toast.success('Removed from cart'); // Optional, removed to be less noisy or kept? UI usually handles visual removal nicely
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove item');
        }
    }, [user]);

    const updateQuantity = useCallback(async (id: string, quantity: number) => {
        if (!user) return;

        const newQuantity = Math.max(1, quantity);

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
                .eq('user_id', user.id); // Delete all for this user

            if (error) throw error;

            setCartItems([]);
            setCouponDetails(null); // Clear coupon when cart is cleared
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

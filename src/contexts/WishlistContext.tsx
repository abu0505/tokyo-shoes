import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WishlistContextType {
  wishlistIds: string[];
  isLoading: boolean;
  addToWishlist: (shoeId: string, shoeName?: string) => Promise<void>;
  removeFromWishlist: (shoeId: string, shoeName?: string) => Promise<void>;
  toggleWishlist: (shoeId: string, shoeName?: string) => Promise<void>;
  isInWishlist: (shoeId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch wishlist from Supabase or LocalStorage
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      // Load from LocalStorage for guests
      const stored = localStorage.getItem('wishlist_storage');
      if (stored) {
        try {
          setWishlistIds(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing wishlist from local storage', e);
          setWishlistIds([]);
        }
      } else {
        setWishlistIds([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wishlists')
        .select('shoe_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistIds([]);
      } else {
        setWishlistIds(data?.map(item => item.shoe_id) || []);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setWishlistIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (shoeId: string, shoeName?: string) => {
    // Optimistic update
    setWishlistIds(prev => {
      const newIds = [...prev, shoeId];
      if (!user) {
        localStorage.setItem('wishlist_storage', JSON.stringify(newIds));
      }
      return newIds;
    });

    if (!user) {
      toast.success(shoeName ? `Added ${shoeName} to wishlist` : 'Added to wishlist');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          shoe_id: shoeId
        });

      if (error) {
        // Rollback on error
        setWishlistIds(prev => prev.filter(id => id !== shoeId));
        if (error.code === '23505') {
          // Already exists, just ignore
          return;
        }
        console.error('Error adding to wishlist:', error);
        toast.error('Failed to add to wishlist');
      } else {
        toast.success(shoeName ? `Added ${shoeName} to wishlist` : 'Added to wishlist');
      }
    } catch (err) {
      setWishlistIds(prev => prev.filter(id => id !== shoeId));
      console.error('Error adding to wishlist:', err);
      toast.error('Failed to add to wishlist');
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (shoeId: string, shoeName?: string) => {
    // Optimistic update
    setWishlistIds(prev => {
      const newIds = prev.filter(id => id !== shoeId);
      if (!user) {
        localStorage.setItem('wishlist_storage', JSON.stringify(newIds));
      }
      return newIds;
    });

    if (!user) {
      toast.success(shoeName ? `Removed ${shoeName} from wishlist` : 'Removed from wishlist');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('shoe_id', shoeId);

      if (error) {
        // Rollback on error
        setWishlistIds(prev => [...prev, shoeId]);
        console.error('Error removing from wishlist:', error);
        toast.error('Failed to remove from wishlist');
      } else {
        toast.success(shoeName ? `Removed ${shoeName} from wishlist` : 'Removed from wishlist');
      }
    } catch (err) {
      setWishlistIds(prev => [...prev, shoeId]);
      console.error('Error removing from wishlist:', err);
      toast.error('Failed to remove from wishlist');
    }
  }, [user]);

  const toggleWishlist = useCallback(async (shoeId: string, shoeName?: string) => {
    if (wishlistIds.includes(shoeId)) {
      await removeFromWishlist(shoeId, shoeName);
    } else {
      await addToWishlist(shoeId, shoeName);
    }
  }, [wishlistIds, addToWishlist, removeFromWishlist]);

  const isInWishlist = useCallback((shoeId: string) => {
    return wishlistIds.includes(shoeId);
  }, [wishlistIds]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    wishlistIds,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist
  }), [wishlistIds, isLoading, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist]);

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

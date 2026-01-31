import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const MAX_ITEMS = 6;

export const useRecentlyViewed = () => {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load items
  useEffect(() => {
    const loadItems = async () => {
      if (user) {
        // Load from Supabase for logged-in users
        try {
          const { data, error } = await supabase
            .from('recently_viewed')
            .select('shoe_id')
            .eq('user_id', user.id)
            .order('viewed_at', { ascending: false })
            .limit(MAX_ITEMS);

          if (error) {
            console.error('Error loading recently viewed from DB:', error);
            return;
          }

          if (data) {
            setRecentlyViewed(data.map(item => item.shoe_id));
          }
        } catch (error) {
          console.error('Error in loadItems:', error);
        }
      } else {
        // Load from LocalStorage for guests
        const stored = localStorage.getItem('recently_viewed_storage');
        if (stored) {
          try {
            setRecentlyViewed(JSON.parse(stored));
          } catch (e) {
            console.error('Error parsing recently viewed from local storage', e);
            setRecentlyViewed([]);
          }
        } else {
          setRecentlyViewed([]);
        }
      }
    };

    loadItems();
  }, [user]);

  const addToRecentlyViewed = useCallback(async (shoeId: string) => {
    // Optimistic update
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== shoeId);
      const newIds = [shoeId, ...filtered].slice(0, MAX_ITEMS);

      if (!user) {
        localStorage.setItem('recently_viewed_storage', JSON.stringify(newIds));
      }
      return newIds;
    });

    if (!user) return;

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('recently_viewed')
        .upsert({
          user_id: user.id,
          shoe_id: shoeId,
          viewed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,shoe_id'
        });

      if (error) {
        console.error('Error adding to recently viewed DB:', error);
      }
    } catch (error) {
      console.error('Error in addToRecentlyViewed DB:', error);
    }
  }, [user]);

  const removeFromRecentlyViewed = useCallback(async (shoeId: string) => {
    // Optimistic update
    setRecentlyViewed((prev) => {
      const newIds = prev.filter((id) => id !== shoeId);
      if (!user) {
        localStorage.setItem('recently_viewed_storage', JSON.stringify(newIds));
      }
      return newIds;
    });

    if (!user) return;

    // Remove from Supabase
    try {
      const { error } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id)
        .eq('shoe_id', shoeId);

      if (error) {
        console.error('Error removing from recently viewed DB:', error);
      }
    } catch (error) {
      console.error('Error in removeFromRecentlyViewed DB:', error);
    }
  }, [user]);

  const clearRecentlyViewed = useCallback(async () => {
    // Optimistic update
    setRecentlyViewed([]);

    if (!user) {
      localStorage.removeItem('recently_viewed_storage');
      return;
    }

    // Clear from Supabase
    try {
      const { error } = await supabase
        .from('recently_viewed')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing recently viewed DB:', error);
      }
    } catch (error) {
      console.error('Error in clearRecentlyViewed DB:', error);
    }
  }, [user]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
  };
};

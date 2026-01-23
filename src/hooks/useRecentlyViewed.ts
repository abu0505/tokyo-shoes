import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

const BASE_STORAGE_KEY = 'tokyo_recently_viewed';
const MAX_ITEMS = 6;

export const useRecentlyViewed = () => {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Get user-specific storage key
  const getStorageKey = useCallback(() => {
    return user ? `${BASE_STORAGE_KEY}_${user.id}` : `${BASE_STORAGE_KEY}_guest`;
  }, [user]);

  // Load from localStorage on mount or when user changes
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      } else {
        setRecentlyViewed([]);
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
      setRecentlyViewed([]);
    }
  }, [getStorageKey]);

  // Save to localStorage whenever it changes
  const updateStorage = useCallback((items: string[]) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  }, [getStorageKey]);

  const addToRecentlyViewed = useCallback((shoeId: string) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter((id) => id !== shoeId);
      // Add to the beginning
      const updated = [shoeId, ...filtered].slice(0, MAX_ITEMS);
      updateStorage(updated);
      return updated;
    });
  }, [updateStorage]);

  const removeFromRecentlyViewed = useCallback((shoeId: string) => {
    setRecentlyViewed((prev) => {
      const updated = prev.filter((id) => id !== shoeId);
      updateStorage(updated);
      return updated;
    });
  }, [updateStorage]);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    try {
      const storageKey = getStorageKey();
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  }, [getStorageKey]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
  };
};

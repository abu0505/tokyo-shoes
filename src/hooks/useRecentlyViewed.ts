import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tokyo_recently_viewed';
const MAX_ITEMS = 6;

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }, []);

  // Save to localStorage whenever it changes
  const updateStorage = (items: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  };

  const addToRecentlyViewed = (shoeId: string) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter((id) => id !== shoeId);
      // Add to the beginning
      const updated = [shoeId, ...filtered].slice(0, MAX_ITEMS);
      updateStorage(updated);
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
  };
};

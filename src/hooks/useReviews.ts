import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  shoe_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export const useReviews = (shoeId?: string) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [stats, setStats] = useState<ReviewStats>({ averageRating: 0, totalReviews: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!shoeId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('shoe_id', shoeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      setReviews(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setStats({
          averageRating: avg,
          totalReviews: data.length
        });
      } else {
        setStats({ averageRating: 0, totalReviews: 0 });
      }

      // Find user's review
      if (user) {
        const myReview = data?.find(r => r.user_id === user.id) || null;
        setUserReview(myReview);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shoeId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    userReview,
    stats,
    isLoading,
    refetch: fetchReviews
  };
};

// Hook to get average ratings for multiple shoes (for catalog)
export const useShoeRatings = (shoeIds: string[]) => {
  const [ratings, setRatings] = useState<Record<string, ReviewStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      if (shoeIds.length === 0) {
        setRatings({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('reviews')
          .select('shoe_id, rating')
          .in('shoe_id', shoeIds);

        if (error) {
          console.error('Error fetching ratings:', error);
          return;
        }

        // Group by shoe_id and calculate averages
        const grouped: Record<string, number[]> = {};
        data?.forEach(r => {
          if (!grouped[r.shoe_id]) {
            grouped[r.shoe_id] = [];
          }
          grouped[r.shoe_id].push(r.rating);
        });

        const result: Record<string, ReviewStats> = {};
        Object.entries(grouped).forEach(([shoeId, ratingsList]) => {
          result[shoeId] = {
            averageRating: ratingsList.reduce((a, b) => a + b, 0) / ratingsList.length,
            totalReviews: ratingsList.length
          };
        });

        setRatings(result);
      } catch (err) {
        console.error('Error fetching ratings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatings();
  }, [shoeIds.join(',')]);

  return { ratings, isLoading };
};

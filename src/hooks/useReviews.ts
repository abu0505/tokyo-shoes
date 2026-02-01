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

      // Fetch reviews from public view for privacy (no user_id exposed)
      const { data, error } = await supabase
        .from('reviews_public' as any)
        .select('id, shoe_id, rating, comment, created_at')
        .eq('shoe_id', shoeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }

      // Map to include reviewer_username (already in view)
      const mappedReviews = ((data as any[]) || []).map(r => ({
        id: r.id,
        shoe_id: r.shoe_id,
        user_id: '', // Hidden for privacy
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at
      }));

      setReviews(mappedReviews);

      // Calculate stats
      if (data && data.length > 0) {
        const avg = (data as any[]).reduce((sum, r) => sum + r.rating, 0) / data.length;
        setStats({
          averageRating: avg,
          totalReviews: data.length
        });
      } else {
        setStats({ averageRating: 0, totalReviews: 0 });
      }

      // Find user's own review from the base table (RLS allows users to see their own)
      if (user) {
        const { data: myReviewData } = await supabase
          .from('reviews')
          .select('*')
          .eq('shoe_id', shoeId)
          .eq('user_id', user.id)
          .single();

        setUserReview(myReviewData || null);
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
        // Use public view for ratings (no user_id needed)
        const { data, error } = await supabase
          .from('reviews_public' as any)
          .select('shoe_id, rating')
          .in('shoe_id', shoeIds);

        if (error) {
          console.error('Error fetching ratings:', error);
          return;
        }

        // Group by shoe_id and calculate averages
        const grouped: Record<string, number[]> = {};
        (data as any[])?.forEach(r => {
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

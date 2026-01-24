import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import StarRating from './StarRating';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_username: string | null;
}

interface ReviewListProps {
  shoeId: string;
  refreshTrigger?: number;
}

const ReviewList = ({ shoeId, refreshTrigger }: ReviewListProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReviewId, setUserReviewId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);

      // Use the public view that masks user_id for privacy
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews_public')
        .select('*')
        .eq('shoe_id', shoeId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setReviews([]);
        return;
      }

      setReviews(reviewsData || []);

      // Fetch user's own review ID separately (RLS allows viewing own reviews)
      if (user) {
        const { data: userReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('shoe_id', shoeId)
          .eq('user_id', user.id)
          .single();
        
        setUserReviewId(userReview?.id || null);
      }
    } catch (err) {
      console.error('Error in fetchReviews:', err);
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [shoeId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  const handleDelete = async (reviewId: string) => {
    if (!user) return;

    setDeletingId(reviewId);
    try {
      // Delete from the base reviews table (RLS ensures only own reviews)
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} size="md" />
          <span className="font-bold text-lg">
            {averageRating.toFixed(1)}
          </span>
        </div>
        <span className="text-muted-foreground">
          ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-secondary/30 border border-foreground/10 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {review.reviewer_username || 'Anonymous'}
                    </span>
                    {userReviewId === review.id && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at || new Date()), { addSuffix: true })}
                  </span>
                  {userReviewId === review.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === review.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/80 mt-2">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewList;

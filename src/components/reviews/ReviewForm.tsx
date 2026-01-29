import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import StarRating from './StarRating';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  shoeId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ shoeId, existingReview, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null); // null = loading
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setCanReview(false);
        return;
      }

      // If already reviewed (and passed as prop), they can edit
      if (existingReview) {
        setCanReview(true);
        return;
      }

      setCheckingEligibility(true);
      try {
        // Check if user has a delivered order for this shoe
        // We need to join orders and order_items
        // Assuming relationship is set up, or we can do it manually if needed
        // But for now, let's try a direct query approach ensuring we respect RLS

        // Since Supabase structure usually allows querying through foreign keys:
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            order_items!inner(shoe_id)
          `)
          .eq('user_id', user.id)
          .eq('status', 'Delivered')
          .eq('order_items.shoe_id', shoeId)
          .limit(1);

        if (error) {
          console.error('Error checking review eligibility:', error);
          setCanReview(false);
        } else {
          setCanReview(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setCanReview(false);
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [user, shoeId, existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to leave a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({
            rating,
            comment: comment.trim() || null
          })
          .eq('id', existingReview.id);

        if (error) throw error;
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert({
            shoe_id: shoeId,
            user_id: user.id,
            rating,
            comment: comment.trim() || null
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('You have already reviewed this product');
            return;
          }
          throw error;
        }
        toast.success('Review submitted successfully!');
      }

      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-secondary/50 border border-foreground/10 rounded-lg p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Please login to leave a review
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.href = '/auth'}
        >
          Login to Review
        </Button>
      </div>
    );
  }

  if (checkingEligibility) {
    return (
      <div className="bg-secondary/50 border border-foreground/10 rounded-lg p-6 text-center flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (canReview === false && !existingReview) {
    return (
      <div className="bg-secondary/50 border border-foreground/10 rounded-lg p-6 text-center">
        <p className="font-bold mb-2">Verified Purchasers Only</p>
        <p className="text-muted-foreground text-sm">
          You can only review this product after you have purchased it and it has been delivered.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-secondary/50 border border-foreground/10 rounded-lg p-6">
      <h4 className="font-bold mb-4">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h4>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Rating</label>
        <StarRating
          rating={rating}
          size="lg"
          interactive
          onRatingChange={setRating}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="resize-none"
          rows={4}
          maxLength={1000}
        />
        <span className="text-xs text-muted-foreground mt-1">
          {comment.length}/1000 characters
        </span>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : existingReview ? (
          'Update Review'
        ) : (
          'Submit Review'
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;

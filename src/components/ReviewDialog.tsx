import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    shoeId: string;
    userId: string;
    onReviewSubmitted?: () => void;
}

const ReviewDialog = ({ isOpen, onClose, shoeId, userId, onReviewSubmitted }: ReviewDialogProps) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [canReview, setCanReview] = useState<boolean | null>(null);

    useEffect(() => {
        const checkEligibility = async () => {
            if (!userId || !shoeId) return;

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        status,
                        order_items!inner(shoe_id)
                    `)
                    .eq('user_id', userId)
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
            }
        };

        checkEligibility();
    }, [userId, shoeId]);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    user_id: userId,
                    shoe_id: shoeId,
                    rating: rating,
                    comment: reviewText.trim() || null
                });

            if (error) throw error;

            toast.success("Review submitted successfully!");
            if (onReviewSubmitted) onReviewSubmitted();
            handleClose();
        } catch (error: any) {
            console.error("Error submitting review:", error);
            if (error?.code === '23505') {
                toast.error("You have already reviewed this product");
            } else {
                toast.error("Failed to submit review");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset form after a slight delay to allow closing animation
        setTimeout(() => {
            setRating(0);
            setReviewText("");
        }, 300);
    };

    if (canReview === false) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md bg-white text-foreground p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight text-destructive">Unable to Review</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">
                        You can only review this product after your order has been delivered.
                    </p>
                    <Button onClick={handleClose} variant="outline" className="mt-4 w-full border-black">
                        Close
                    </Button>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md bg-white text-foreground p-0 gap-0 overflow-hidden">
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold uppercase tracking-tight">Write a Review</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Rating Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Your Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="focus:outline-none transition-colors"
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                                ? "fill-[#fab005] text-[#fab005]"
                                                : "text-gray-300 fill-transparent"
                                                }`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold block">Your Review (Optional)</label>
                            <Textarea
                                placeholder="Share your experience with this product..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                className="min-h-[120px] resize-none border-gray-200 focus:border-black focus:ring-0 rounded-none bg-white p-3"
                                maxLength={1000}
                            />
                            <p className="text-xs text-muted-foreground text-right">
                                {reviewText.length}/1000 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            variant="outline"
                            className="w-full bg-transparent border-black text-black hover:bg-black hover:text-white font-bold rounded-none h-12 text-base uppercase tracking-widest transition-colors"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Review"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewDialog;

import React, { useState, useEffect } from 'react';
import { Heart, Eye, X, Check, Trash, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shoe, isNewArrival } from '@/types/shoe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import StarRating from '@/components/StarRating';
import { motion, useMotionValue, useTransform, PanInfo, animate } from 'framer-motion';
import { toast } from 'sonner';

interface ShoeCardMobileProps {
  shoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  isInWishlist?: boolean;
  onQuickView?: (shoe: Shoe) => void;
  rating?: number;
  totalReviews?: number;
  showRemoveButton?: boolean;
  mode?: 'catalog' | 'wishlist';
  showSwipeHint?: boolean;
}

const SWIPE_HINT_KEY = 'tokyo-shoes-swipe-hint-shown';

const ShoeCardMobile = React.memo(({
  shoe,
  onWishlistClick,
  isInWishlist = false,
  onQuickView,
  rating,
  totalReviews,
  showRemoveButton = false,
  mode = 'catalog',
  showSwipeHint = false
}: ShoeCardMobileProps) => {
  const navigate = useNavigate();
  const isNew = isNewArrival(shoe);
  const isSoldOut = shoe.status === 'sold_out';
  const [showHint, setShowHint] = useState(false);

  // Check if this is the first card and hint hasn't been shown
  useEffect(() => {
    if (showSwipeHint) {
      const hintShown = localStorage.getItem(SWIPE_HINT_KEY);
      if (!hintShown) {
        setShowHint(true);
        // Auto-hide after 4 seconds
        const timer = setTimeout(() => {
          setShowHint(false);
          localStorage.setItem(SWIPE_HINT_KEY, 'true');
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [showSwipeHint]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem(SWIPE_HINT_KEY, 'true');
  };

  // Swipe logic - much lighter feel
  const x = useMotionValue(0);
  const SWIPE_THRESHOLD = 60; // Reduced from 100
  
  // Opacity transforms - start showing feedback earlier
  const opacityRight = useTransform(x, [30, SWIPE_THRESHOLD], [0, 1]);
  const opacityLeft = useTransform(x, [-30, -SWIPE_THRESHOLD], [0, 1]);
  
  // Scale effect for visual feedback
  const scale = useTransform(
    x,
    [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    [0.98, 1, 0.98]
  );

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    // Don't navigate if we just dragged
    if (Math.abs(x.get()) > 5) return;
    navigate(`/product/${shoe.id}`);
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeDistance = Math.abs(info.offset.x);
    
    if (swipeDistance > SWIPE_THRESHOLD) {
      if (mode === 'catalog') {
        // In catalog: ANY direction adds to wishlist
        if (isSoldOut) {
          toast.error('This item is sold out');
        } else if (isInWishlist) {
          toast.info(`${shoe.name} is already in your wishlist`);
        } else {
          onWishlistClick(shoe);
        }
      } else if (mode === 'wishlist') {
        // In wishlist: ANY direction removes from wishlist
        onWishlistClick(shoe);
      }
    }
    
    // Animate back to center with spring
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  };

  // Determine indicator content based on mode
  const getLeftIndicator = () => {
    if (mode === 'wishlist') {
      return (
        <motion.div style={{ opacity: opacityLeft }} className="flex items-center gap-2 text-red-600 font-bold bg-red-100/90 px-3 py-2 rounded-full z-10">
          <Trash className="w-5 h-5" />
          <span className="text-sm">Remove</span>
        </motion.div>
      );
    }
    // Catalog mode - show add on left too
    return (
      <motion.div style={{ opacity: opacityLeft }} className="flex items-center gap-2 text-green-600 font-bold bg-green-100/90 px-3 py-2 rounded-full z-10">
        <Check className="w-5 h-5" />
        <span className="text-sm">Add</span>
      </motion.div>
    );
  };

  const getRightIndicator = () => {
    if (mode === 'wishlist') {
      return (
        <motion.div style={{ opacity: opacityRight }} className="flex items-center gap-2 text-red-600 font-bold bg-red-100/90 px-3 py-2 rounded-full z-10">
          <span className="text-sm">Remove</span>
          <Trash className="w-5 h-5" />
        </motion.div>
      );
    }
    // Catalog mode
    return (
      <motion.div style={{ opacity: opacityRight }} className="flex items-center gap-2 text-green-600 font-bold bg-green-100/90 px-3 py-2 rounded-full z-10">
        <span className="text-sm">Add</span>
        <Check className="w-5 h-5" />
      </motion.div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Swipe Hint Overlay */}
      {showHint && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center rounded-lg"
          onClick={dismissHint}
        >
          <div className="flex flex-col items-center gap-3 px-4 text-center">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ x: [-10, 10, -10] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </motion.div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <motion.div
                animate={{ x: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <p className="text-white font-bold text-sm">
              {mode === 'catalog' 
                ? 'Swipe to add to wishlist' 
                : 'Swipe to remove from wishlist'}
            </p>
            <p className="text-white/60 text-xs">Tap to dismiss</p>
          </div>
        </motion.div>
      )}

      {/* Background Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        {getRightIndicator()}
        {getLeftIndicator()}
      </div>

      <motion.div
        drag="x"
        dragElastic={0.7}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        style={{ x, scale }}
        whileTap={{ cursor: 'grabbing' }}
        className={`group relative bg-secondary/30 border-[0.5px] border-border overflow-hidden transition-colors cursor-grab active:cursor-grabbing active:bg-secondary flex min-h-[140px] items-center z-20 rounded-lg ${isSoldOut ? 'opacity-60' : ''}`}
      >
        {/* Image Container - Left Side */}
        <div className="relative w-[140px] h-[140px] flex-shrink-0 overflow-hidden bg-secondary">
          <img
            src={shoe.image}
            alt={shoe.name}
            className="w-full h-full object-cover"
            draggable={false}
            loading="lazy"
            decoding="async"
          />

          {/* NEW Badge */}
          {isNew && (
            <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-600 text-white font-bold px-2 py-0.5 text-[10px]">
              NEW
            </Badge>
          )}

          {/* Wishlist Button on Image */}
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistClick(shoe);
            }}
            disabled={isSoldOut && !showRemoveButton}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full border border-foreground/50 transition-all ${isInWishlist
              ? 'bg-accent text-accent-foreground hover:bg-accent/90'
              : 'bg-background/80'
              }`}
          >
            {showRemoveButton ? (
              <X className="h-4 w-4" />
            ) : (
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
            )}
          </Button>
        </div>

        {/* Info Container - Right Side */}
        <div className="flex-1 self-stretch p-3 flex flex-col justify-between min-w-0">
          {/* Top Section */}
          <div>
            {/* Brand */}
            <p className="text-[10px] text-muted-foreground font-bold tracking-wide mb-0.5">
              {shoe.brand.toUpperCase()}
            </p>

            {/* Name */}
            <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1">
              {shoe.name}
            </h3>

            {/* Rating */}
            {totalReviews && totalReviews > 0 && (
              <div className="mb-1">
                <StarRating rating={rating || 0} totalReviews={totalReviews} size="sm" />
              </div>
            )}

            {/* Sizes Preview */}
            <div className="flex flex-col gap-1 py-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Ruler className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold tracking-wide">Size</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {shoe.sizes.slice(0, 4).map((size) => (
                  <span
                    key={size}
                    className="text-xs bg-background/80 px-1.5 py-0.5 font-bold border border-foreground/10"
                  >
                    {size}
                  </span>
                ))}
                {shoe.sizes.length > 4 && (
                  <span className="text-xs bg-background/80 px-1.5 py-0.5 font-bold border border-foreground/10">
                    +{shoe.sizes.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section - Price & Status */}
          <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
            <p className="text-lg font-black">
              {formatPrice(shoe.price)}
            </p>
            {isSoldOut ? (
              <span className="text-[10px] font-bold text-red-600">
                Out of Stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* Quick View Button - Right Edge */}
        {onQuickView && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(shoe);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 border border-foreground/30 rounded-full"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </div>
  );
});

ShoeCardMobile.displayName = 'ShoeCardMobile';

export default ShoeCardMobile;

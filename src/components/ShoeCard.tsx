import React from 'react';
import { Heart, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shoe, isNewArrival } from '@/types/shoe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOptimizedImageUrl } from '@/lib/imageOptimizer';
import { formatPrice } from '@/lib/format';
import StarRating from '@/components/StarRating';

import { useImageBrightness } from '@/hooks/useImageBrightness';

interface ShoeCardProps {
  shoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  isInWishlist?: boolean;
  onQuickView?: (shoe: Shoe) => void;
  rating?: number;
  totalReviews?: number;
  showRemoveButton?: boolean;
}

const ShoeCard = React.memo(({
  shoe,
  onWishlistClick,
  isInWishlist = false,
  onQuickView,
  rating,
  totalReviews,
  showRemoveButton = false
}: ShoeCardProps) => {
  const navigate = useNavigate();
  const isNew = isNewArrival(shoe);
  const isSoldOut = shoe.status === 'sold_out';

  // Detect brightness at top-right corner (approx 90% x, 10% y)
  // We use the optimized image url logic internally in the hook by passing the raw url, 
  // but to be safe and consistent with what's rendered, let's pass the raw shoe.image. 
  // The hook does its own loading.
  const isDarkBg = useImageBrightness(shoe.image, { x: 0.9, y: 0.1 });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the wishlist button
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/product/${shoe.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-secondary/30 border-2 border-foreground overflow-hidden transition-all duration-300 cursor-pointer hover:tokyo-shadow hover:-translate-y-1 hover:translate-x-1 h-full flex flex-col ${isSoldOut ? 'opacity-60' : ''
        }`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={getOptimizedImageUrl(shoe.image, 400)}
          alt={shoe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-red-600 hover:bg-red-600 text-white font-bold px-3 py-1 text-xs justify-center">
              NEW
            </Badge>
          )}

        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex flex-col gap-2">
          {/* Wishlist Button */}
          <Button
            size="icon"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistClick(shoe);
            }}
            disabled={isSoldOut && !showRemoveButton}
            className={`w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/30 backdrop-blur-md transition-all shadow-lg ${isInWishlist
              ? 'bg-red-500/30 hover:bg-red-500/50 text-red-600'
              : `bg-white/20 hover:bg-white/40 ${isDarkBg ? 'text-white' : 'text-black'}`
              }`}
          >
            {showRemoveButton ? (
              <X className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            )}
          </Button>

          {/* Quick View Button */}
          {onQuickView && (
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(shoe);
              }}
              className={`hidden md:flex w-12 h-12 rounded-full border border-white/30 bg-white/20 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-lg hover:bg-white/40 ${isDarkBg
                ? 'text-white'
                : 'text-black'
                }`}
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 md:p-5 flex flex-col flex-1">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] md:text-sm text-muted-foreground font-bold tracking-wide">
            {shoe.brand.toUpperCase()}
          </p>
          {totalReviews && totalReviews > 0 && (
            <StarRating rating={rating || 0} totalReviews={totalReviews} size="sm" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm md:text-2xl font-bold mb-2 leading-tight line-clamp-2">
          {shoe.name}
        </h3>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1 mb-2 md:mb-4">
          {shoe.sizes.slice(0, 5).map((size) => (
            <span
              key={size}
              className="text-[10px] md:text-xs bg-secondary px-1.5 py-0.5 md:px-2 md:py-1 font-medium"
            >
              {size}
            </span>
          ))}
          {shoe.sizes.length > 5 && (
            <span className="text-[10px] md:text-xs bg-secondary px-1.5 py-0.5 md:px-2 md:py-1 font-medium">
              +{shoe.sizes.length - 5}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-border bg-white mt-auto">
          <p className="text-base md:text-2xl font-black">
            {formatPrice(shoe.price)}
          </p>
          {isSoldOut ? (
            <span className="text-xs md:text-sm font-bold text-red-600">
              Out of Stock
            </span>
          ) : (
            <span className="flex items-center gap-1 md:gap-1.5 text-xs md:text-sm font-medium text-green-600">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500"></span>
              In Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ShoeCard.displayName = 'ShoeCard';

export default ShoeCard;

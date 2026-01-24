import { Heart, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shoe, isNewArrival } from '@/types/shoe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import StarRating from '@/components/StarRating';

interface ShoeCardMobileProps {
  shoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  isInWishlist?: boolean;
  onQuickView?: (shoe: Shoe) => void;
  rating?: number;
  totalReviews?: number;
  showRemoveButton?: boolean;
}

const ShoeCardMobile = ({
  shoe,
  onWishlistClick,
  isInWishlist = false,
  onQuickView,
  rating,
  totalReviews,
  showRemoveButton = false
}: ShoeCardMobileProps) => {
  const navigate = useNavigate();
  const isNew = isNewArrival(shoe);
  const isSoldOut = shoe.status === 'sold_out';

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/product/${shoe.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-card border-2 border-foreground overflow-hidden transition-all cursor-pointer active:bg-secondary flex h-[140px] ${isSoldOut ? 'opacity-60' : ''}`}
    >
      {/* Image Container - Left Side */}
      <div className="relative w-[140px] h-full flex-shrink-0 overflow-hidden bg-secondary">
        <img
          src={shoe.image}
          alt={shoe.name}
          className="w-full h-full object-cover"
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
            ? 'bg-accent text-accent-foreground'
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
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
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
          <div className="flex flex-wrap gap-1">
            {shoe.sizes.slice(0, 4).map((size) => (
              <span
                key={size}
                className="text-[10px] bg-secondary px-1.5 py-0.5 font-medium"
              >
                {size}
              </span>
            ))}
            {shoe.sizes.length > 4 && (
              <span className="text-[10px] bg-secondary px-1.5 py-0.5 font-medium">
                +{shoe.sizes.length - 4}
              </span>
            )}
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
    </div>
  );
};

export default ShoeCardMobile;

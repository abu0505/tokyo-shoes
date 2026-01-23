import { Heart, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shoe, isNewArrival } from '@/types/shoe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import StarRating from '@/components/StarRating';

interface ShoeCardProps {
  shoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  isInWishlist?: boolean;
  onQuickView?: (shoe: Shoe) => void;
  rating?: number;
  totalReviews?: number;
  showRemoveButton?: boolean;
}

const ShoeCard = ({
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking the wishlist button
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/product/${shoe.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-card border-2 border-foreground overflow-hidden transition-all cursor-pointer hover:tokyo-shadow hover:-translate-y-1 hover:translate-x-1 h-full flex flex-col ${isSoldOut ? 'opacity-60' : ''
        }`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={shoe.image}
          alt={shoe.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {/* Wishlist Button */}
          <Button
            size="icon"
            variant="secondary"
            onClick={() => onWishlistClick(shoe)}
            disabled={isSoldOut && !showRemoveButton}
            className={`w-12 h-12 rounded-full border-2 border-foreground transition-all ${isInWishlist
              ? 'bg-accent text-accent-foreground hover:bg-accent/90'
              : 'bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            {showRemoveButton ? (
              <X className="h-5 w-5" />
            ) : (
              <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
            )}
          </Button>

          {/* Quick View Button */}
          {onQuickView && (
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onQuickView(shoe)}
              className="w-12 h-12 rounded-full border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-all opacity-0 group-hover:opacity-100"
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground font-bold tracking-wide">
            {shoe.brand.toUpperCase()}
          </p>
          {totalReviews && totalReviews > 0 && (
            <StarRating rating={rating || 0} totalReviews={totalReviews} size="sm" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-2xl font-bold mb-2 leading-tight line-clamp-2">
          {shoe.name}
        </h3>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1 mb-4">
          {shoe.sizes.slice(0, 5).map((size) => (
            <span
              key={size}
              className="text-xs bg-secondary px-2 py-1 font-medium"
            >
              {size}
            </span>
          ))}
          {shoe.sizes.length > 5 && (
            <span className="text-xs bg-secondary px-2 py-1 font-medium">
              +{shoe.sizes.length - 5}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t border-border bg-white mt-auto">
          <p className="text-2xl font-black">
            {formatPrice(shoe.price)}
          </p>
          {isSoldOut ? (
            <span className="text-sm font-bold text-red-600">
              Out of Stock
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              In Stock
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoeCard;

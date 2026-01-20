import { Heart } from 'lucide-react';
import { Shoe, isNewArrival } from '@/types/shoe';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ShoeCardProps {
  shoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  isInWishlist?: boolean;
}

const ShoeCard = ({ shoe, onWishlistClick, isInWishlist = false }: ShoeCardProps) => {
  const isNew = isNewArrival(shoe);
  const isSoldOut = shoe.status === 'sold_out';

  return (
    <div 
      className={`group relative bg-card border-2 border-foreground overflow-hidden transition-all hover:tokyo-shadow hover:-translate-y-1 hover:translate-x-1 ${
        isSoldOut ? 'opacity-60' : ''
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
            <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1 text-xs">
              NEW
            </Badge>
          )}
          {isSoldOut && (
            <Badge variant="secondary" className="bg-foreground text-background font-bold px-3 py-1 text-xs">
              SOLD OUT
            </Badge>
          )}
        </div>
        
        {/* Wishlist Button */}
        <Button
          size="icon"
          variant="secondary"
          onClick={() => onWishlistClick(shoe)}
          disabled={isSoldOut}
          className={`absolute top-4 right-4 w-12 h-12 rounded-full border-2 border-foreground transition-all ${
            isInWishlist 
              ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
              : 'bg-background hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
        </Button>
      </div>
      
      {/* Info */}
      <div className="p-5">
        {/* Brand */}
        <p className="text-sm text-muted-foreground font-bold tracking-wide mb-1">
          {shoe.brand.toUpperCase()}
        </p>
        
        {/* Name */}
        <h3 className="text-lg font-bold mb-3 leading-tight line-clamp-2">
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
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black">
            ₱{shoe.price.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShoeCard;

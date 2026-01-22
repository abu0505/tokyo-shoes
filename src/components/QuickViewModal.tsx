import { Link } from 'react-router-dom';
import { X, Heart, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { isNewArrival } from '@/types/shoe';
import { DbShoe } from '@/types/database';

interface QuickViewModalProps {
  shoe: DbShoe | null;
  open: boolean;
  onClose: () => void;
  onWishlistClick?: (shoe: DbShoe) => void;
  isInWishlist?: boolean;
}

const QuickViewModal = ({ 
  shoe, 
  open, 
  onClose, 
  onWishlistClick, 
  isInWishlist = false 
}: QuickViewModalProps) => {
  if (!shoe) return null;

  const isNew = shoe.created_at && isNewArrival({
    id: shoe.id,
    name: shoe.name,
    brand: shoe.brand,
    price: shoe.price,
    image: shoe.image_url || '',
    sizes: shoe.sizes,
    status: shoe.status,
    createdAt: new Date(shoe.created_at),
  });
  const isSoldOut = shoe.status === 'sold_out';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-2 border-foreground p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-secondary">
            <img
              src={shoe.image_url || '/placeholder.svg'}
              alt={shoe.name}
              className="w-full h-full object-cover"
            />
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isNew && (
                <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">
                  NEW
                </Badge>
              )}
              {isSoldOut && (
                <Badge variant="secondary" className="bg-foreground text-background font-bold px-3 py-1">
                  SOLD OUT
                </Badge>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col">
            <DialogHeader className="mb-4 text-left">
              <p className="text-sm text-muted-foreground font-bold tracking-widest">
                {shoe.brand.toUpperCase()}
              </p>
              <DialogTitle className="text-2xl font-black leading-tight">
                {shoe.name}
              </DialogTitle>
            </DialogHeader>

            {/* Price */}
            <p className="text-3xl font-black mb-6">
              {formatPrice(shoe.price)}
            </p>

            {/* Sizes */}
            <div className="mb-6">
              <h4 className="font-bold text-sm tracking-wide mb-3">AVAILABLE SIZES (EU)</h4>
              <div className="flex flex-wrap gap-2">
                {shoe.sizes.map((size) => (
                  <span
                    key={size}
                    className="w-10 h-10 flex items-center justify-center border-2 border-foreground text-sm font-bold"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <span className={`font-bold ${isSoldOut ? 'text-destructive' : 'text-green-600'}`}>
                {isSoldOut ? '● Sold Out' : '● In Stock'}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-auto space-y-3">
              <Link
                to={`/product/${shoe.id}`}
                onClick={onClose}
                className="block"
              >
                <Button className="w-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold h-12">
                  <Eye className="mr-2 h-4 w-4" />
                  VIEW FULL DETAILS
                </Button>
              </Link>

              {onWishlistClick && (
                <Button
                  variant="outline"
                  onClick={() => onWishlistClick(shoe)}
                  disabled={isSoldOut}
                  className={`w-full border-2 font-bold h-12 ${
                    isInWishlist
                      ? 'border-accent bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground'
                      : 'border-foreground hover:bg-foreground hover:text-background'
                  }`}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
                  {isInWishlist ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;

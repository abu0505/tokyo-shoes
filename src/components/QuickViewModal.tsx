import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { DbShoe } from '@/types/database';
import StarRating from '@/components/StarRating';

interface QuickViewModalProps {
  shoe: DbShoe | null;
  open: boolean;
  onClose: () => void;
  onWishlistClick?: (shoe: DbShoe) => void;
  isInWishlist?: boolean;
  rating?: number;
  totalReviews?: number;
}

const QuickViewModal = ({
  shoe,
  open,
  onClose,
  onWishlistClick,
  isInWishlist = false,
  rating,
  totalReviews
}: QuickViewModalProps) => {
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  if (!shoe) return null;

  const isSoldOut = shoe.status === 'sold_out';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-white text-gray-900 [&>button]:hidden">
        <div className="grid md:grid-cols-2 min-h-[400px]">
          {/* Image - Full height and width */}
          <div className="relative bg-gray-100 flex items-center justify-center">
            <img
              src={shoe.image_url || '/placeholder.svg'}
              alt={shoe.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col relative h-full">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center z-10"
            >
              <X className="h-4 w-4 text-gray-700" />
            </button>

            {/* Brand & Rating */}
            <div className="flex items-center justify-between mb-2 pr-10">
              <p className="text-sm text-emerald-600 font-bold tracking-widest">
                {shoe.brand.toUpperCase()}
              </p>
              {totalReviews && totalReviews > 0 && (
                <StarRating rating={rating || 0} totalReviews={totalReviews} size="md" />
              )}
            </div>

            {/* Name */}
            <h2 className="text-[2.5rem] font-black leading-tight mb-6 text-gray-900 pr-10">
              {shoe.name}
            </h2>

            {/* Size Selection */}
            <div className="mb-6">
              <h4 className="font-bold text-xs tracking-wider mb-3 text-gray-500">SELECT SIZE</h4>
              <div className="flex flex-wrap gap-2">
                {shoe.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => !isSoldOut && setSelectedSize(size)}
                    disabled={isSoldOut}
                    className={`w-12 h-10 border text-sm font-bold transition-all rounded ${selectedSize === size
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-500'
                      } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Stock */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 mb-6">
              <p className="text-3xl font-black text-gray-900">
                {formatPrice(shoe.price)}
              </p>
              {isSoldOut ? (
                <span className="text-sm font-bold text-red-600">
                  Out of Stock
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  In Stock
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto flex gap-3">
              <Link
                to={`/product/${shoe.id}`}
                onClick={onClose}
                className="flex-1"
              >
                <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-lg">
                  View Full Details
                </Button>
              </Link>

              {onWishlistClick && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onWishlistClick(shoe)}
                  disabled={isSoldOut}
                  className={`h-12 w-12 rounded-lg border-2 ${isInWishlist
                    ? 'border-red-500 bg-red-50 text-red-500 hover:bg-red-100'
                    : 'border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                    }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
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

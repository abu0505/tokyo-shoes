import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockShoes, isNewArrival, Shoe } from '@/types/shoe';
import { formatPrice } from '@/lib/format';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageZoom from '@/components/ImageZoom';
import RelatedProducts from '@/components/RelatedProducts';
import WhatsAppButton from '@/components/WhatsAppButton';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const { addToRecentlyViewed } = useRecentlyViewed();

  const shoe = mockShoes.find((s) => s.id === id);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track recently viewed
  useEffect(() => {
    if (shoe) {
      addToRecentlyViewed(shoe.id);
    }
  }, [shoe?.id]);

  if (!shoe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-6">🔍</p>
          <h2 className="text-3xl font-bold mb-4">SHOE NOT FOUND</h2>
          <p className="text-muted-foreground mb-8">
            The shoe you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            onClick={() => navigate('/')}
            className="bg-foreground text-background hover:bg-foreground/90 px-8 py-6 font-bold"
          >
            BACK TO CATALOG
          </Button>
        </div>
      </div>
    );
  }

  const isNew = isNewArrival(shoe);
  const isSoldOut = shoe.status === 'sold_out';

  const handleWishlistClick = () => {
    setIsWishlisted(!isWishlisted);
    if (isWishlisted) {
      setWishlistIds((prev) => prev.filter((wid) => wid !== shoe.id));
    } else {
      setWishlistIds((prev) => [...prev, shoe.id]);
    }
    toast.success(
      isWishlisted 
        ? `Removed ${shoe.name} from wishlist` 
        : `Added ${shoe.name} to wishlist`
    );
  };

  const handleRelatedWishlistClick = (relatedShoe: Shoe) => {
    if (wishlistIds.includes(relatedShoe.id)) {
      setWishlistIds((prev) => prev.filter((wid) => wid !== relatedShoe.id));
      toast.success(`Removed ${relatedShoe.name} from wishlist`);
    } else {
      setWishlistIds((prev) => [...prev, relatedShoe.id]);
      toast.success(`Added ${relatedShoe.name} to wishlist`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: shoe.name,
        text: `Check out ${shoe.name} at TOKYO!`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleVisitStore = () => {
    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }
    toast.success(`Great choice! Visit our store to try ${shoe.name} in size ${selectedSize}`);
  };

  return (
    <motion.div 
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      
      <motion.main 
        className="container py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 -ml-4 font-bold hover:bg-transparent hover:text-accent group"
        >
          <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
          BACK TO CATALOG
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Section with Zoom */}
          <div className="relative">
            <div className="aspect-square overflow-hidden border-2 border-foreground bg-secondary">
              <ImageZoom
                src={shoe.image}
                alt={shoe.name}
                className="w-full h-full"
              />
            </div>
            
            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-none">
              {isNew && (
                <Badge className="bg-accent text-accent-foreground font-bold px-4 py-2 text-sm">
                  NEW ARRIVAL
                </Badge>
              )}
              {isSoldOut && (
                <Badge variant="secondary" className="bg-foreground text-background font-bold px-4 py-2 text-sm">
                  SOLD OUT
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={handleWishlistClick}
                className={`w-12 h-12 rounded-full border-2 border-foreground transition-all ${
                  isWishlisted 
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleShare}
                className="w-12 h-12 rounded-full border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-all"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Brand & Name */}
            <p className="text-sm text-muted-foreground font-bold tracking-widest mb-2">
              {shoe.brand.toUpperCase()}
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
              {shoe.name}
            </h1>

            {/* Price */}
            <p className="text-4xl font-black mb-8">
              {formatPrice(shoe.price)}
            </p>

            {/* Size Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm tracking-wide">SELECT SIZE (EU)</h3>
                {selectedSize && (
                  <span className="text-sm text-accent font-medium">
                    Size {selectedSize} selected
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {shoe.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => !isSoldOut && setSelectedSize(size)}
                    disabled={isSoldOut}
                    className={`w-14 h-14 border-2 font-bold text-lg transition-all ${
                      selectedSize === size
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-foreground hover:border-accent hover:text-accent'
                    } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleVisitStore}
              disabled={isSoldOut}
              className={`w-full py-8 text-lg font-bold mb-8 transition-all ${
                isSoldOut 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-foreground text-background hover:bg-accent hover:text-accent-foreground tokyo-shadow hover:-translate-y-1 hover:translate-x-1'
              }`}
            >
              {isSoldOut ? 'SOLD OUT' : 'VISIT STORE TO PURCHASE'}
            </Button>

            {/* Store Info */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center p-4 bg-secondary border border-foreground/10">
                <Truck className="h-6 w-6 mb-2 text-accent" />
                <span className="text-xs font-medium text-center">IN-STORE PICKUP</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-secondary border border-foreground/10">
                <Shield className="h-6 w-6 mb-2 text-accent" />
                <span className="text-xs font-medium text-center">AUTHENTIC GUARANTEED</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-secondary border border-foreground/10">
                <RotateCcw className="h-6 w-6 mb-2 text-accent" />
                <span className="text-xs font-medium text-center">EASY RETURNS</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t-2 border-foreground/10 pt-6">
              <h3 className="font-bold text-sm tracking-wide mb-4">PRODUCT DETAILS</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex justify-between">
                  <span>Brand</span>
                  <span className="font-medium text-foreground">{shoe.brand}</span>
                </li>
                <li className="flex justify-between">
                  <span>Style</span>
                  <span className="font-medium text-foreground">{shoe.name}</span>
                </li>
                <li className="flex justify-between">
                  <span>Available Sizes</span>
                  <span className="font-medium text-foreground">{shoe.sizes.length} sizes</span>
                </li>
                <li className="flex justify-between">
                  <span>Status</span>
                  <span className={`font-medium ${isSoldOut ? 'text-destructive' : 'text-green-500'}`}>
                    {isSoldOut ? 'Sold Out' : 'In Stock'}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Related Products Section */}
      <RelatedProducts
        currentShoe={shoe}
        onWishlistClick={handleRelatedWishlistClick}
        wishlistIds={wishlistIds}
      />

      <Footer />

      {/* WhatsApp Floating Button */}
      <WhatsAppButton shoe={shoe} selectedSize={selectedSize} />
    </motion.div>
  );
};

export default ProductDetail;

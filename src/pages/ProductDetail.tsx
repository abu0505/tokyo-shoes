import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isNewArrival, Shoe } from '@/types/shoe';
import { formatPrice } from '@/lib/format';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import ProductImageZoomV2 from '@/components/ProductImageZoomV2';
import RelatedProducts from '@/components/RelatedProducts';
import WhatsAppButton from '@/components/WhatsAppButton';

import SizeGuideModal from '@/components/SizeGuideModal';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import StarRating from '@/components/StarRating';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useWishlist } from '@/contexts/WishlistContext';
import { useReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const { wishlistIds, toggleWishlist, isInWishlist } = useWishlist();
  const { stats: reviewStats, refetch: refetchReviews } = useReviews(id);

  const { data: shoe, isLoading } = useQuery({
    queryKey: ['shoe', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('shoes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching shoe:', error);
        return null;
      }

      const dbShoe = data as DbShoe;
      return {
        id: dbShoe.id,
        name: dbShoe.name,
        brand: dbShoe.brand,
        price: dbShoe.price,
        image: dbShoe.image_url || '',
        sizes: dbShoe.sizes,
        status: dbShoe.status,
        createdAt: new Date(dbShoe.created_at)
      } as Shoe;
    },
    enabled: !!id,
  });

  const isWishlisted = shoe ? isInWishlist(shoe.id) : false;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Track recently viewed
  useEffect(() => {
    if (shoe) {
      addToRecentlyViewed(shoe.id);
    }
  }, [shoe?.id, addToRecentlyViewed]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }

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
    toggleWishlist(shoe.id, shoe.name);
  };

  const handleRelatedWishlistClick = (relatedShoe: Shoe) => {
    toggleWishlist(relatedShoe.id, relatedShoe.name);
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

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />

      <motion.main
        className="container py-6 md:py-8 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 md:mb-6 -ml-2 md:-ml-4 font-bold hover:bg-transparent hover:text-accent group text-sm md:text-base"
        >
          <ArrowLeft className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:-translate-x-1" />
          BACK
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {/* Image Section with Zoom */}
          <div className="relative">
            <div className="aspect-square border-2 border-foreground bg-secondary">
              <ProductImageZoomV2
                src={shoe.image}
                alt={shoe.name}
                className="w-full h-full"
              />
            </div>

            {/* Badges */}
            <div className="absolute top-3 md:top-6 left-3 md:left-6 flex flex-col gap-2 pointer-events-none">
              {isNew && (
                <Badge className="bg-accent text-accent-foreground font-bold px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
                  NEW ARRIVAL
                </Badge>
              )}
              {isSoldOut && (
                <Badge variant="secondary" className="bg-foreground text-background font-bold px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
                  SOLD OUT
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-3 md:top-6 right-3 md:right-6 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={handleWishlistClick}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground transition-all ${isWishlisted
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-background hover:bg-accent hover:text-accent-foreground'
                  }`}
              >
                <Heart className={`h-4 w-4 md:h-5 md:w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={handleShare}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-all"
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Brand & Name & Rating */}
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <p className="text-xs md:text-sm text-muted-foreground font-bold tracking-widest">
                {shoe.brand.toUpperCase()}
              </p>
              {reviewStats.totalReviews > 0 && (
                <StarRating
                  rating={reviewStats.averageRating}
                  totalReviews={reviewStats.totalReviews}
                  size="sm"
                />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 leading-tight">
              {shoe.name}
            </h1>

            {/* Size Selection */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="font-bold text-xs md:text-sm tracking-wide">SELECT SIZE (EU)</h3>
                <SizeGuideModal />
              </div>
              {selectedSize && (
                <p className="text-xs md:text-sm text-accent font-medium mb-2 md:mb-3">
                  Size {selectedSize} selected
                </p>
              )}
              <div className="grid grid-cols-6 md:grid-cols-8 lg:flex lg:flex-wrap gap-2 md:gap-3">
                {shoe.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => !isSoldOut && setSelectedSize(size)}
                    disabled={isSoldOut}
                    className={`w-full lg:w-10 h-9 md:h-10 border-2 font-bold text-sm md:text-lg transition-all ${selectedSize === size
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-foreground hover:border-accent hover:text-accent'
                      } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <p className="text-3xl md:text-4xl font-black mb-6 md:mb-8">
              {formatPrice(shoe.price)}
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6 md:mb-8">
              <Button
                onClick={handleWishlistClick}
                disabled={isSoldOut}
                className={`flex-1 h-12 md:h-14 text-sm md:text-lg font-bold transition-all ${isWishlisted
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : isSoldOut
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-background hover:bg-accent hover:text-accent-foreground tokyo-shadow hover:-translate-y-1 hover:translate-x-1'
                  }`}
              >
                <Heart className={`mr-2 h-4 w-4 md:h-5 md:w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                {isSoldOut ? 'SOLD OUT' : isWishlisted ? 'SAVED' : 'ADD TO WISHLIST'}
              </Button>
            </div>

            {/* Store Info */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="flex flex-col items-center p-3 md:p-4 bg-secondary border border-foreground/10">
                <Truck className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 text-accent" />
                <span className="text-[10px] md:text-xs font-medium text-center">IN-STORE PICKUP</span>
              </div>
              <div className="flex flex-col items-center p-3 md:p-4 bg-secondary border border-foreground/10">
                <Shield className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 text-accent" />
                <span className="text-[10px] md:text-xs font-medium text-center">AUTHENTIC</span>
              </div>
              <div className="flex flex-col items-center p-3 md:p-4 bg-secondary border border-foreground/10">
                <RotateCcw className="h-5 w-5 md:h-6 md:w-6 mb-1.5 md:mb-2 text-accent" />
                <span className="text-[10px] md:text-xs font-medium text-center">EASY RETURNS</span>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t-2 border-foreground/10 pt-4 md:pt-6">
              <h3 className="font-bold text-xs md:text-sm tracking-wide mb-3 md:mb-4">PRODUCT DETAILS</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
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

        {/* Reviews Section */}
        <section className="mt-12 md:mt-16 border-t-2 border-foreground/10 pt-8 md:pt-12">
          <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8">CUSTOMER REVIEWS</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <ReviewList
                shoeId={shoe.id}
                refreshTrigger={reviewRefreshTrigger}
              />
            </div>
            <div className="order-1 lg:order-2">
              <ReviewForm
                shoeId={shoe.id}
                onReviewSubmitted={() => {
                  setReviewRefreshTrigger(prev => prev + 1);
                  refetchReviews();
                }}
              />
            </div>
          </div>
        </section>
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

      {/* Back to Top Button */}
      <BackToTopButton />
    </motion.div>
  );
};

export default ProductDetail;

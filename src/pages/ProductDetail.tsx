import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
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
import TextLoader from '@/components/TextLoader';


import SizeGuideModal from '@/components/SizeGuideModal';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import StarRating from '@/components/StarRating';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe, DbShoeSize } from '@/types/database';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // State for carousel

  const { addToRecentlyViewed } = useRecentlyViewed();
  const { wishlistIds, toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { stats: reviewStats, refetch: refetchReviews } = useReviews(id);

  const { data: shoe, isLoading } = useQuery({
    queryKey: ['shoe', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('shoes')
        .select('*, shoe_sizes(size, quantity)')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching shoe:', error);
        return null;
      }

      // Type assertion for the joined data
      const dbShoe = data as DbShoe & { shoe_sizes: DbShoeSize[] };

      // Map inventory: Size -> Quantity
      const inventory: { [size: number]: number } = {};

      if (dbShoe.shoe_sizes && Array.isArray(dbShoe.shoe_sizes)) {
        dbShoe.shoe_sizes.forEach((item: any) => {
          inventory[item.size] = item.quantity;
        });
      }


      return {
        id: dbShoe.id,
        name: dbShoe.name,
        brand: dbShoe.brand,
        price: dbShoe.price,
        image: dbShoe.image_url || '',
        additionalImages: dbShoe.additional_images || [], // Map additional images
        sizes: dbShoe.sizes,
        status: dbShoe.status,
        createdAt: new Date(dbShoe.created_at),
        inventory
      } as Shoe;
    },
    enabled: !!id,
  });

  const isWishlisted = shoe ? isInWishlist(shoe.id) : false;
  const isNew = shoe ? isNewArrival(shoe) : false;
  const isSoldOut = shoe ? shoe.status === 'sold_out' : false;

  // Combine main image and additional images for the carousel
  const allImages = shoe
    ? [shoe.image, ...(shoe.additionalImages || [])].filter(Boolean)
    : [];

  const currentImage = allImages[currentImageIndex] || '';

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

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

  // Reset image index when shoe changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  // Preload all images for better performance
  useEffect(() => {
    if (allImages.length > 0) {
      allImages.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [allImages]);


  const handleWishlistClick = () => {
    if (shoe) {
      toggleWishlist(shoe.id, shoe.name);
    }
  };

  const handleRelatedWishlistClick = (relatedShoe: Shoe) => {
    toggleWishlist(relatedShoe.id, relatedShoe.name);
  };

  const handleAddToCart = () => {
    if (!shoe) return;
    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }

    // Check stock
    const quantity = shoe.inventory?.[selectedSize] ?? 0;
    if (quantity <= 0) {
      toast.error('This size is out of stock');
      return;
    }

    addToCart({
      shoeId: shoe.id,
      name: shoe.name,
      price: shoe.price,
      image: shoe.image,
      quantity: 1,
      size: selectedSize,
      color: 'Default',
      brand: shoe.brand
    });
  };

  const handleShare = async () => {
    if (!shoe) return;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <TextLoader className="text-2xl" />
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

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Helmet>
        <title>{shoe.name} | Tokyo Shoes</title>
        <meta name="description" content={`Buy ${shoe.name} for ${formatPrice(shoe.price)}. ${shoe.brand} - Available now at Tokyo Shoes.`} />
        <meta property="og:title" content={`${shoe.name} | Tokyo Shoes`} />
        <meta property="og:description" content={`Buy ${shoe.name} for ${formatPrice(shoe.price)} at Tokyo Shoes.`} />
        <meta property="og:image" content={shoe.image} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": shoe.name,
            "image": shoe.image,
            "description": `Buy ${shoe.name} - ${shoe.brand}`,
            "brand": {
              "@type": "Brand",
              "name": shoe.brand
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": "INR",
              "price": shoe.price,
              "availability": isSoldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <motion.main
        className="container py-5 md:py-5 px-4"
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
          {/* Image Section with Gallery */}
          <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
            {/* Thumbnails - Desktop Only */}
            <div className="hidden md:flex flex-col gap-4 w-14 lg:w-16 shrink-0 h-fit max-h-[600px] overflow-y-auto pr-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative aspect-square w-full rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === idx
                    ? 'border-black opacity-100 ring-1 ring-black'
                    : 'border-transparent opacity-70 hover:opacity-100 hover:border-gray-300'
                    }`}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Image Display */}
            <div className="relative group flex-1">
              <div className="aspect-square border-2 border-foreground bg-secondary relative rounded-lg">
                {/* Animated Image Transition */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                  >
                    <ProductImageZoomV2
                      src={currentImage}
                      alt={`${shoe.name} - View ${currentImageIndex + 1}`}
                      className="w-full h-full"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Mobile Carousel Controls */}
                <div className="md:hidden">
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage();
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage();
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black p-2 rounded-full shadow-md z-10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Pagination Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {allImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex(idx);
                            }}
                            className={`w-2 h-2 rounded-full transition-all shadow-sm ${currentImageIndex === idx ? 'bg-black w-4' : 'bg-white/70 hover:bg-white'
                              }`}
                            aria-label={`Go to image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-3 md:top-6 left-3 md:left-6 flex flex-col gap-2 pointer-events-none z-20">
                {isNew && (
                  <Badge className="bg-accent text-accent-foreground font-bold px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
                    NEW ARRIVAL
                  </Badge>
                )}
              </div>

              {/* Action Buttons (Wishlist/Share) */}
              <div className="absolute top-3 md:top-6 right-3 md:right-6 flex flex-col gap-2 z-20">
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
                <p className="text-xs md:text-sm text-foreground font-bold mb-2 md:mb-3">
                  Size {selectedSize} selected
                </p>
              )}
              <div className="grid grid-cols-6 md:grid-cols-8 lg:flex lg:flex-wrap gap-2 md:gap-3">
                {shoe.sizes.map((size) => {
                  const quantity = shoe.inventory?.[size] ?? 0;
                  const isSizeOutOfStock = quantity <= 0;

                  return (
                    <button
                      key={size}
                      onClick={() => !isSoldOut && setSelectedSize(size)}
                      disabled={isSoldOut}
                      className={`w-full lg:w-10 h-9 md:h-10 border-2 font-bold text-sm md:text-lg transition-all ${selectedSize === size
                        ? 'border-black bg-black text-white'
                        : 'border-foreground hover:border-black hover:text-black'
                        } ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isSizeOutOfStock && selectedSize !== size ? 'bg-secondary text-muted-foreground' : ''}`}
                      title={isSizeOutOfStock ? "Out of Stock" : `${quantity} left`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {/* Out of Stock Message */}
              {selectedSize && (shoe.inventory?.[selectedSize] ?? 0) <= 0 && (
                <p className="text-red-600 font-bold text-sm mt-3 animate-pulse">
                  ⚠️ Size {selectedSize} is currently out of stock
                </p>
              )}
            </div>

            {/* Price */}
            <p className="text-3xl md:text-4xl font-black mb-6 md:mb-8">
              {formatPrice(shoe.price)}
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-6 md:mb-8">
              <Button
                onClick={handleAddToCart}
                disabled={isSoldOut || (selectedSize !== null && (shoe.inventory?.[selectedSize] ?? 0) <= 0)}
                className={`flex-1 h-12 md:h-14 text-sm md:text-lg font-bold transition-all ${isSoldOut || (selectedSize !== null && (shoe.inventory?.[selectedSize] ?? 0) <= 0)
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 tokyo-shadow hover:-translate-y-1 hover:translate-x-1'
                  }`}
              >
                <ShoppingCart className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                {isSoldOut ? 'SOLD OUT' : (selectedSize !== null && (shoe.inventory?.[selectedSize] ?? 0) <= 0) ? 'OUT OF STOCK' : 'ADD TO CART'}
              </Button>
              <Button
                onClick={handleWishlistClick}
                variant="outline"
                className={`flex-1 h-12 md:h-14 text-sm md:text-lg font-bold transition-all border-2 border-foreground ${isWishlisted
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive'
                  : 'bg-background text-foreground hover:bg-black hover:text-accent-foreground'
                  }`}
              >
                <Heart className={`mr-2 h-4 w-4 md:h-5 md:w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'SAVED' : 'WISHLIST'}
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

      {/* Back to Top Button */}
      <BackToTopButton />
    </motion.div>
  );
};

export default ProductDetail;

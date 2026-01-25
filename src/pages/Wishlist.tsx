import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shoe } from '@/types/shoe';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import ShoeCard from '@/components/ShoeCard';
import ShoeCardMobile from '@/components/ShoeCardMobile';
import QuickViewModal from '@/components/QuickViewModal';
import { useShoeRatings } from '@/hooks/useReviews';
import { useIsMobile } from '@/hooks/use-mobile';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [quickViewShoe, setQuickViewShoe] = useState<DbShoe | null>(null);
  const isMobile = useIsMobile();
  
  // Local state to prevent flicker on removal
  const [displayedShoes, setDisplayedShoes] = useState<Shoe[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: wishlistShoes = [], isLoading } = useQuery({
    queryKey: ['wishlist-shoes', wishlistIds.slice().sort().join(',')], // Stable key
    queryFn: async () => {
      if (wishlistIds.length === 0) return [];

      const { data, error } = await supabase
        .from('shoes')
        .select('*')
        .in('id', wishlistIds);

      if (error) throw error;

      return (data as DbShoe[]).map(shoe => ({
        id: shoe.id,
        name: shoe.name,
        brand: shoe.brand,
        price: shoe.price,
        image: shoe.image_url || '',
        sizes: shoe.sizes,
        status: shoe.status,
        createdAt: new Date(shoe.created_at)
      })) as Shoe[];
    },
    enabled: wishlistIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });

  // Sync displayed shoes when fetch completes or wishlist becomes empty
  useEffect(() => {
    if (wishlistShoes.length > 0 || wishlistIds.length === 0) {
      setDisplayedShoes(wishlistShoes);
    }
  }, [wishlistShoes, wishlistIds.length]);

  // Get shoe IDs for rating fetch
  const shoeIds = useMemo(() => displayedShoes.map(s => s.id), [displayedShoes]);
  const { ratings } = useShoeRatings(shoeIds);

  const handleRemoveFromWishlist = (shoe: Shoe) => {
    // Immediately remove from displayed list (no flicker)
    setDisplayedShoes(prev => prev.filter(s => s.id !== shoe.id));
    // Then sync with database
    removeFromWishlist(shoe.id, shoe.name);
  };

  // Convert Shoe to DbShoe format for QuickViewModal
  const handleQuickView = (shoe: Shoe) => {
    const dbShoe: DbShoe = {
      id: shoe.id,
      name: shoe.name,
      brand: shoe.brand,
      price: shoe.price,
      image_url: shoe.image,
      sizes: shoe.sizes,
      status: shoe.status,
      created_at: shoe.createdAt.toISOString()
    };
    setQuickViewShoe(dbShoe);
  };

  const handleQuickViewWishlist = (dbShoe: DbShoe) => {
    const shoe: Shoe = {
      id: dbShoe.id,
      name: dbShoe.name,
      brand: dbShoe.brand,
      price: dbShoe.price,
      image: dbShoe.image_url || '',
      sizes: dbShoe.sizes,
      status: dbShoe.status,
      createdAt: new Date(dbShoe.created_at),
    };
    handleRemoveFromWishlist(shoe);
  };

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 md:py-12 px-1.5">
        {/* Page Header */}
        <div className="mb-8 md:mb-12 px-3">
          <h1 className="text-3xl md:text-5xl font-black mb-1 md:mb-2">My Collection</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your saved shoes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-12">
          {/* Saved Shoes Count */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-2 md:p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-destructive fill-destructive" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold">{displayedShoes.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-tight">Saved Shoes</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-2 md:p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-base md:text-lg font-bold truncate max-w-full sm:max-w-[120px] md:max-w-none">{user?.email?.split('@')[0] || 'Guest'}</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-tight">Member</p>
            </div>
          </div>

          {/* Join Date */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-3 md:p-4 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-center sm:text-left">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-base md:text-lg font-bold">{formattedDate}</p>
              <p className="text-xs md:text-sm text-muted-foreground leading-tight">Joined</p>
            </div>
          </div>
        </div>

        {/* Login prompt for guests */}
        {!user && (
          <div className="text-center py-6 md:py-8 mb-6 md:mb-8 bg-secondary/30 border border-foreground/10 rounded-xl">
            <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
              Login to save your wishlist across devices
            </p>
            <Link
              to="/auth"
              className="inline-block bg-accent text-accent-foreground font-bold px-5 md:px-6 py-2.5 md:py-3 text-sm md:text-base hover:bg-accent/90 transition-colors"
            >
              LOGIN
            </Link>
          </div>
        )}

        {/* Wishlist Items */}
        {displayedShoes.length === 0 ? (
          <div className="text-center py-16 md:py-20">
            <Heart className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 text-muted-foreground" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">No saved shoes yet</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8">
              Start adding shoes to your collection by clicking the heart icon
            </p>
            <Link
              to="/"
              className="inline-block bg-accent text-background font-bold px-6 md:px-8 py-3 md:py-4 text-sm md:text-base hover:bg-accent/90 transition-colors"
            >
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          <div className={isMobile
            ? "flex flex-col gap-1.5"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          }>
            <AnimatePresence mode="popLayout">
              {displayedShoes.map((shoe, index) => (
                <motion.div
                  key={shoe.id}
                  layout
                  layoutId={shoe.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.03, type: 'spring', stiffness: 500, damping: 30 }}
                  className="h-full"
                >
                  {isMobile ? (
                    <ShoeCardMobile
                      shoe={shoe}
                      onWishlistClick={handleRemoveFromWishlist}
                      isInWishlist={true}
                      onQuickView={handleQuickView}
                      rating={ratings[shoe.id]?.averageRating}
                      totalReviews={ratings[shoe.id]?.totalReviews}
                      showRemoveButton={true}
                      mode="wishlist"
                      showSwipeHint={index === 0}
                    />
                  ) : (
                    <ShoeCard
                      shoe={shoe}
                      onWishlistClick={handleRemoveFromWishlist}
                      isInWishlist={true}
                      onQuickView={handleQuickView}
                      rating={ratings[shoe.id]?.averageRating}
                      totalReviews={ratings[shoe.id]?.totalReviews}
                      showRemoveButton={true}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
      <BackToTopButton />

      {/* Quick View Modal */}
      <QuickViewModal
        shoe={quickViewShoe}
        open={!!quickViewShoe}
        onClose={() => setQuickViewShoe(null)}
        onWishlistClick={handleQuickViewWishlist}
        isInWishlist={true}
        rating={quickViewShoe ? ratings[quickViewShoe.id]?.averageRating : undefined}
        totalReviews={quickViewShoe ? ratings[quickViewShoe.id]?.totalReviews : undefined}
      />
    </div>
  );
};

export default Wishlist;

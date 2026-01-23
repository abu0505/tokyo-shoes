import { useState, useMemo } from 'react';
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
import QuickViewModal from '@/components/QuickViewModal';
import { useShoeRatings } from '@/hooks/useReviews';

const Wishlist = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const [quickViewShoe, setQuickViewShoe] = useState<DbShoe | null>(null);

  const { data: wishlistShoes = [], isLoading } = useQuery({
    queryKey: ['wishlist-shoes', wishlistIds],
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
  });

  // Get shoe IDs for rating fetch
  const shoeIds = useMemo(() => wishlistShoes.map(s => s.id), [wishlistShoes]);
  const { ratings } = useShoeRatings(shoeIds);

  const handleRemoveFromWishlist = (shoe: Shoe) => {
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
      created_at: shoe.createdAt.toISOString(),
      updated_at: null
    };
    setQuickViewShoe(dbShoe);
  };

  const handleQuickViewWishlist = (dbShoe: DbShoe) => {
    // For wishlist page, clicking heart in modal should remove it
    // But QuickViewModal usually toggles. 
    // If it's in wishlist (which it is), it will call this.
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

      <main className="container py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black italic mb-2">My Collection</h1>
          <p className="text-muted-foreground">Your saved shoes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Saved Shoes Count */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{wishlistShoes.length}</p>
              <p className="text-sm text-muted-foreground">Saved Shoes</p>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{user?.email?.split('@')[0] || 'Guest'}</p>
              <p className="text-sm text-muted-foreground">Member</p>
            </div>
          </div>

          {/* Join Date */}
          <div className="bg-secondary/50 border border-foreground/10 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">Joined</p>
            </div>
          </div>
        </div>

        {/* Login prompt for guests */}
        {!user && (
          <div className="text-center py-8 mb-8 bg-secondary/30 border border-foreground/10 rounded-xl">
            <p className="text-muted-foreground mb-4">
              Login to save your wishlist across devices
            </p>
            <Link
              to="/auth"
              className="inline-block bg-accent text-accent-foreground font-bold px-6 py-3 hover:bg-accent/90 transition-colors"
            >
              LOGIN
            </Link>
          </div>
        )}

        {/* Wishlist Items */}
        {wishlistShoes.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No saved shoes yet</h2>
            <p className="text-muted-foreground mb-8">
              Start adding shoes to your collection by clicking the heart icon
            </p>
            <Link
              to="/"
              className="inline-block bg-accent text-background font-bold px-8 py-4 hover:bg-accent/90 transition-colors"
            >
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistShoes.map((shoe, index) => (
                <motion.div
                  key={shoe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="h-full"
                >
                  <ShoeCard
                    shoe={shoe}
                    onWishlistClick={handleRemoveFromWishlist}
                    isInWishlist={true}
                    onQuickView={handleQuickView}
                    rating={ratings[shoe.id]?.averageRating}
                    totalReviews={ratings[shoe.id]?.totalReviews}
                    showRemoveButton={true}
                  />
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

import { useState, useEffect } from 'react';
import { mockShoes, Shoe } from '@/types/shoe';
import { formatPrice } from '@/lib/format';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { Link } from 'react-router-dom';
import { Heart, Calendar, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/contexts/WishlistContext';

const Wishlist = () => {
  const { user } = useAuth();
  const { wishlistIds, removeFromWishlist } = useWishlist();

  const wishlistShoes = wishlistIds
    .map(id => mockShoes.find(shoe => shoe.id === id))
    .filter(Boolean) as Shoe[];

  const handleRemoveFromWishlist = (shoe: Shoe) => {
    removeFromWishlist(shoe.id, shoe.name);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlistShoes.map((shoe, index) => (
                <motion.div
                  key={shoe.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <div className="bg-secondary/30 border border-foreground/10 rounded-xl overflow-hidden">
                    {/* Time Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                        Saved {formatTimeAgo(new Date(Date.now() - Math.random() * 86400000 * 7))}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFromWishlist(shoe)}
                      className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Image */}
                    <Link to={`/product/${shoe.id}`}>
                      <div className="aspect-square bg-gradient-to-br from-secondary to-secondary/50 p-4 flex items-center justify-center">
                        <img
                          src={shoe.image}
                          alt={shoe.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-red-500 font-bold mb-1">
                        {shoe.brand.toUpperCase()}
                      </p>
                      <h3 className="font-bold text-sm mb-1 line-clamp-1">{shoe.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        ◇ Size: {shoe.sizes.join(', ')}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{formatPrice(shoe.price)}</p>
                        <span className={`text-xs font-medium flex items-center gap-1 ${shoe.status === 'sold_out' ? 'text-red-500' : 'text-emerald-500'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${shoe.status === 'sold_out' ? 'bg-red-500' : 'bg-emerald-500'
                            }`}></span>
                          {shoe.status === 'sold_out' ? 'Sold Out' : 'In Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
      <BackToTopButton />
    </div>
  );
};

export default Wishlist;

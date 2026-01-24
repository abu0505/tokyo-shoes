import { useState, useMemo } from 'react';
import { Shoe } from '@/types/shoe';
import { DbShoe } from '@/types/database';
import ShoeCard from './ShoeCard';
import QuickViewModal from './QuickViewModal';
import { useShoeRatings } from '@/hooks/useReviews';

interface ShoeCatalogProps {
  shoes: Shoe[];
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const ShoeCatalog = ({ shoes, onWishlistClick, wishlistIds }: ShoeCatalogProps) => {
  const [quickViewShoe, setQuickViewShoe] = useState<DbShoe | null>(null);

  // Get shoe IDs for rating fetch
  const shoeIds = useMemo(() => shoes.map(s => s.id), [shoes]);
  const { ratings } = useShoeRatings(shoeIds);

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
    // Convert back to Shoe format for wishlist handler
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
    onWishlistClick(shoe);
  };

  if (shoes.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-6xl mb-6">👟</p>
          <h3 className="text-2xl font-bold mb-4">NO KICKS FOUND</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search for something different.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-8 bg-background">
        <div className="container">
          {/* Results count */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground font-medium">
              SHOWING <span className="text-foreground font-bold">{shoes.length}</span> RESULTS
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {shoes.map((shoe, index) => (
              <div
                key={shoe.id}
                className="animate-fade-in h-full"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ShoeCard
                  shoe={shoe}
                  onWishlistClick={onWishlistClick}
                  isInWishlist={wishlistIds.includes(shoe.id)}
                  onQuickView={handleQuickView}
                  rating={ratings[shoe.id]?.averageRating}
                  totalReviews={ratings[shoe.id]?.totalReviews}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        shoe={quickViewShoe}
        open={!!quickViewShoe}
        onClose={() => setQuickViewShoe(null)}
        onWishlistClick={handleQuickViewWishlist}
        isInWishlist={quickViewShoe ? wishlistIds.includes(quickViewShoe.id) : false}
        rating={quickViewShoe ? ratings[quickViewShoe.id]?.averageRating : undefined}
        totalReviews={quickViewShoe ? ratings[quickViewShoe.id]?.totalReviews : undefined}
      />
    </>
  );
};

export default ShoeCatalog;

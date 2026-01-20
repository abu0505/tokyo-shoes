import { Shoe } from '@/types/shoe';
import ShoeCard from './ShoeCard';

interface ShoeCatalogProps {
  shoes: Shoe[];
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const ShoeCatalog = ({ shoes, onWishlistClick, wishlistIds }: ShoeCatalogProps) => {
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
    <section className="py-12 bg-background">
      <div className="container">
        {/* Results count */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-muted-foreground font-medium">
            SHOWING <span className="text-foreground font-bold">{shoes.length}</span> RESULTS
          </p>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shoes.map((shoe, index) => (
            <div 
              key={shoe.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <ShoeCard
                shoe={shoe}
                onWishlistClick={onWishlistClick}
                isInWishlist={wishlistIds.includes(shoe.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShoeCatalog;

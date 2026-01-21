import { mockShoes, Shoe } from '@/types/shoe';
import ShoeCard from './ShoeCard';

interface RecentlyViewedProps {
  recentlyViewedIds: string[];
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const RecentlyViewed = ({ recentlyViewedIds, onWishlistClick, wishlistIds }: RecentlyViewedProps) => {
  // Get shoe objects from IDs
  const recentlyViewedShoes = recentlyViewedIds
    .map((id) => mockShoes.find((shoe) => shoe.id === id))
    .filter((shoe): shoe is Shoe => shoe !== undefined);

  if (recentlyViewedShoes.length === 0) return null;

  return (
    <section className="py-16 bg-secondary">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight">
            RECENTLY VIEWED
          </h2>
          <span className="text-sm text-muted-foreground">
            {recentlyViewedShoes.length} items
          </span>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {recentlyViewedShoes.map((shoe) => (
            <div key={shoe.id} className="min-w-[280px] max-w-[280px]">
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

export default RecentlyViewed;

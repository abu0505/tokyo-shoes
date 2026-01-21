import { Shoe, mockShoes } from '@/types/shoe';
import ShoeCard from './ShoeCard';

interface RelatedProductsProps {
  currentShoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const RelatedProducts = ({ currentShoe, onWishlistClick, wishlistIds }: RelatedProductsProps) => {
  // Get shoes from the same brand, excluding the current shoe
  const sameBrandShoes = mockShoes.filter(
    (shoe) => shoe.brand === currentShoe.brand && shoe.id !== currentShoe.id
  );

  // If we have less than 4 from the same brand, fill with popular shoes from other brands
  let relatedShoes = [...sameBrandShoes];
  
  if (relatedShoes.length < 4) {
    const otherBrandShoes = mockShoes.filter(
      (shoe) => shoe.brand !== currentShoe.brand && shoe.id !== currentShoe.id
    );
    // Sort by status (in_stock first) and add to fill up to 4
    const additionalShoes = otherBrandShoes
      .sort((a, b) => (a.status === 'in_stock' ? -1 : 1))
      .slice(0, 4 - relatedShoes.length);
    relatedShoes = [...relatedShoes, ...additionalShoes];
  }

  // Limit to 4 shoes
  relatedShoes = relatedShoes.slice(0, 4);

  if (relatedShoes.length === 0) return null;

  return (
    <section className="py-16 border-t-2 border-foreground/10">
      <div className="container">
        <h2 className="text-3xl font-black mb-8 tracking-tight">
          YOU MAY ALSO LIKE
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedShoes.map((shoe) => (
            <ShoeCard
              key={shoe.id}
              shoe={shoe}
              onWishlistClick={onWishlistClick}
              isInWishlist={wishlistIds.includes(shoe.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;

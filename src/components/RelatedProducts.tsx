import { useQuery } from '@tanstack/react-query';
import { Shoe } from '@/types/shoe';
import ShoeCard from './ShoeCard';
import ShoeCardMobile from './ShoeCardMobile';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import { useIsMobile } from '@/hooks/use-mobile';

interface RelatedProductsProps {
  currentShoe: Shoe;
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const RelatedProducts = ({ currentShoe, onWishlistClick, wishlistIds }: RelatedProductsProps) => {
  const isMobile = useIsMobile();

  const { data: relatedShoes = [] } = useQuery({
    queryKey: ['related-shoes', currentShoe.id, currentShoe.brand],
    queryFn: async () => {
      // 1. Fetch sales from same brand
      const { data: sameBrandData, error: sameBrandError } = await supabase
        .from('shoes')
        .select('*')
        .eq('brand', currentShoe.brand)
        .neq('id', currentShoe.id)
        .limit(4);

      if (sameBrandError) throw sameBrandError;

      let combinedShoes: DbShoe[] = sameBrandData || [];

      // 2. If less than 4, fetch others to fill
      if (combinedShoes.length < 4) {
        const { data: otherData, error: otherError } = await supabase
          .from('shoes')
          .select('*')
          .neq('brand', currentShoe.brand)
          .neq('id', currentShoe.id)
          .order('status', { ascending: true }) // In stock first (text sort but 'in_stock' < 'sold_out')
          .limit(4 - combinedShoes.length);

        if (!otherError && otherData) {
          combinedShoes = [...combinedShoes, ...otherData];
        }
      }

      // Map to Shoe interface
      return combinedShoes.map(shoe => ({
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
    enabled: !!currentShoe.id,
  });

  if (relatedShoes.length === 0) return null;

  return (
    <section className="py-10 md:py-16 border-t-2 border-foreground/10">
      <div className="container px-4">
        <h2 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 tracking-tight">
          YOU MAY ALSO LIKE
        </h2>

        {isMobile ? (
          // Mobile: Horizontal scrolling
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
            {relatedShoes.map((shoe) => (
              <div key={shoe.id} className="min-w-[260px] max-w-[260px] flex-shrink-0">
                <ShoeCard
                  shoe={shoe}
                  onWishlistClick={onWishlistClick}
                  isInWishlist={wishlistIds.includes(shoe.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Grid
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
        )}
      </div>
    </section>
  );
};

export default RelatedProducts;

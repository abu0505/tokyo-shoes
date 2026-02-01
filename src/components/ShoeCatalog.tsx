import { useState, useMemo, useEffect } from 'react';
import { Shoe } from '@/types/shoe';
import { DbShoe } from '@/types/database';
import ShoeCard from './ShoeCard';
import ShoeCardMobile from './ShoeCardMobile';
import QuickViewModal from './QuickViewModal';
import { useShoeRatings } from '@/hooks/useReviews';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ShoeCatalogProps {
  shoes: Shoe[];
  onWishlistClick: (shoe: Shoe) => void;
  wishlistIds: string[];
}

const ITEMS_PER_PAGE = 10;

const ShoeCatalog = ({ shoes, onWishlistClick, wishlistIds }: ShoeCatalogProps) => {
  const [quickViewShoe, setQuickViewShoe] = useState<DbShoe | null>(null);
  const isMobile = useIsMobile();

  // Get shoe IDs for rating fetch
  const shoeIds = useMemo(() => shoes.map(s => s.id), [shoes]);
  const { ratings } = useShoeRatings(shoeIds);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when shoes (filters) change
  useEffect(() => {
    setCurrentPage(1);
  }, [shoes]);

  // Calculate pages
  const totalPages = Math.ceil(shoes.length / ITEMS_PER_PAGE);

  // Get visible shoes
  const visibleShoes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return shoes.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [shoes, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of catalog
    const catalogElement = document.getElementById('catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first, last, current, and siblings
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
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
      updated_at: shoe.createdAt.toISOString()
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
        <div className="container px-1">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <p className="text-sm px-3 text-muted-foreground font-medium">
              SHOWING <span className="text-foreground font-bold">{visibleShoes.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(currentPage * ITEMS_PER_PAGE, shoes.length)} of {shoes.length}</span> RESULTS
            </p>
          </div>

          {/* Grid - Single column on mobile, 3 on tablet, 4 on desktop */}
          <div className={isMobile
            ? "flex flex-col gap-1.5"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          }>
            {visibleShoes.map((shoe, index) => (
              <div
                key={shoe.id}
                className="animate-fade-in h-full"
                style={{ animationDelay: `${(index % 10) * 0.05}s` }}
              >
                {isMobile ? (
                  <ShoeCardMobile
                    shoe={shoe}
                    onWishlistClick={onWishlistClick}
                    isInWishlist={wishlistIds.includes(shoe.id)}
                    onQuickView={handleQuickView}
                    rating={ratings[shoe.id]?.averageRating}
                    totalReviews={ratings[shoe.id]?.totalReviews}
                    mode="catalog"
                    showSwipeHint={index === 0 && currentPage === 1}
                  />
                ) : (
                  <ShoeCard
                    shoe={shoe}
                    onWishlistClick={onWishlistClick}
                    isInWishlist={wishlistIds.includes(shoe.id)}
                    onQuickView={handleQuickView}
                    rating={ratings[shoe.id]?.averageRating}
                    totalReviews={ratings[shoe.id]?.totalReviews}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page as number);
                          }}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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

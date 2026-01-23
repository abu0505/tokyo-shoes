import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FilterBar, { SortOption } from '@/components/FilterBar';
import ShoeCatalog from '@/components/ShoeCatalog';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { mockShoes, getUniqueBrands, getUniqueSizes, getPriceRange, Shoe } from '@/types/shoe';
import { useWishlist } from '@/contexts/WishlistContext';

const Index = () => {
  const catalogRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Price range from data
  const { min: minPrice, max: maxPrice } = getPriceRange(mockShoes);
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice]);

  // Wishlist from context (synced with database)
  const { wishlistIds, toggleWishlist } = useWishlist();

  // Computed values
  const availableBrands = useMemo(() => getUniqueBrands(mockShoes), []);
  const availableSizes = useMemo(() => getUniqueSizes(mockShoes), []);

  // Filter and sort logic
  const filteredShoes = useMemo(() => {
    let result = mockShoes.filter((shoe) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        shoe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shoe.brand.toLowerCase().includes(searchQuery.toLowerCase());

      // Brand filter
      const matchesBrand =
        selectedBrands.length === 0 ||
        selectedBrands.includes(shoe.brand);

      // Size filter
      const matchesSize =
        selectedSizes.length === 0 ||
        shoe.sizes.some(size => selectedSizes.includes(size));

      // Price filter
      const matchesPrice =
        shoe.price >= priceRange[0] && shoe.price <= priceRange[1];

      return matchesSearch && matchesBrand && matchesSize && matchesPrice;
    });

    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'price-low':
        result = result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result = result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  }, [searchQuery, selectedBrands, selectedSizes, priceRange, sortOption]);

  // Handlers
  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleSizeToggle = (size: number) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedSizes([]);
    setPriceRange([minPrice, maxPrice]);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedBrands.length > 0 ||
    selectedSizes.length > 0 ||
    priceRange[0] !== minPrice ||
    priceRange[1] !== maxPrice;

  const handleWishlistClick = (shoe: Shoe) => {
    toggleWishlist(shoe.id, shoe.name);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      <HeroSection onBrowseClick={scrollToCatalog} />

      <motion.div
        ref={catalogRef}
        id="catalog"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedBrands={selectedBrands}
          onBrandToggle={handleBrandToggle}
          availableBrands={availableBrands}
          selectedSizes={selectedSizes}
          onSizeToggle={handleSizeToggle}
          availableSizes={availableSizes}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        <ShoeCatalog
          shoes={filteredShoes}
          onWishlistClick={handleWishlistClick}
          wishlistIds={wishlistIds}
        />
      </motion.div>

      <Footer />
      <BackToTopButton />
    </motion.div>
  );
};

export default Index;

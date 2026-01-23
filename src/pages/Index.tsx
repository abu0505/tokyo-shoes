import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FilterBar, { SortOption } from '@/components/FilterBar';
import ShoeCatalog from '@/components/ShoeCatalog';
import Footer from '@/components/Footer';
import BackToTopButton from '@/components/BackToTopButton';
import { getUniqueBrands, getUniqueSizes, getPriceRange, Shoe } from '@/types/shoe';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';

const Index = () => {
  const catalogRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Fetch shoes from Supabase
  const { data: shoes = [] } = useQuery({
    queryKey: ['catalog-shoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DbShoe to Shoe interface
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
  });

  // Price range from data
  // Recalculate based on real data, defaulting to 0-1000 if empty to avoid issues
  const { min: minPrice, max: maxPrice } = useMemo(() => {
    if (shoes.length === 0) return { min: 0, max: 1000 };
    return getPriceRange(shoes);
  }, [shoes]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);

  // Update price range state when data loads
  useMemo(() => {
    if (shoes.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice]); // Effectively runs when price stats change

  // Wishlist from context (synced with database)
  const { wishlistIds, toggleWishlist } = useWishlist();

  // Computed values
  const availableBrands = useMemo(() => getUniqueBrands(shoes), [shoes]);
  const availableSizes = useMemo(() => getUniqueSizes(shoes), [shoes]);

  // Filter and sort logic
  const filteredShoes = useMemo(() => {
    let result = shoes.filter((shoe) => {
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
  }, [shoes, searchQuery, selectedBrands, selectedSizes, priceRange, sortOption]);

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

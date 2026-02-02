import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
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

import PullToRefresh from '@/components/PullToRefresh';

const Index = () => {
  const catalogRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Fetch shoes from Supabase
  const { data: shoes = [], refetch } = useQuery({
    queryKey: ['catalog-shoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shoes')
        .select('id, name, brand, price, image_url, sizes, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DbShoe to Shoe interface
      return (data as DbShoe[]).map(shoe => ({
        id: shoe.id,
        name: shoe.name,
        brand: shoe.brand,
        price: shoe.price,
        image: shoe.image_url || '',
        additionalImages: shoe.additional_images || [],
        sizes: shoe.sizes,
        status: shoe.status,
        createdAt: new Date(shoe.created_at),
        updatedAt: shoe.updated_at ? new Date(shoe.updated_at) : undefined
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

  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash === '#catalog' && catalogRef.current) {
      // Small timeout to ensure render
      setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [pathname, hash]);

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
      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <div>
          <Helmet>
            <title>Tokyo Shoes | Premium Sneaker Collection</title>
            <meta name="description" content="Discover exclusive, authentic sneakers at Tokyo Shoes. Shop the latest drops from Nike, Jordan, Adidas, and more." />
            <meta property="og:title" content="Tokyo Shoes | Premium Sneaker Collection" />
            <meta property="og:description" content="Discover exclusive, authentic sneakers at Tokyo Shoes." />
            <meta property="og:image" content="/hero-img.png" />
            <meta property="og:type" content="website" />
          </Helmet>
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
        </div>
      </PullToRefresh>
    </motion.div>
  );
};

export default Index;

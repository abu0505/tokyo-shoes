import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;
  availableBrands: string[];
  selectedSizes: number[];
  onSizeToggle: (size: number) => void;
  availableSizes: number[];
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedBrands,
  onBrandToggle,
  availableBrands,
  selectedSizes,
  onSizeToggle,
  availableSizes,
  priceRange,
  onPriceChange,
  minPrice,
  maxPrice,
  onClearFilters,
  hasActiveFilters,
  sortOption,
  onSortChange,
}: FilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    'newest': 'Newest First',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    'name-asc': 'A-Z (Name)',
  };

  return (
    <div className="bg-secondary py-4 md:py-6 top-0 z-40">
      <div className="container px-4">
        {/* Mobile: Stacked layout, Desktop: Horizontal */}
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Top Row: Title and Search (Mobile: Row, Desktop: Row distributed) */}
          <div className="flex flex-row items-center justify-between gap-3 md:gap-8 md:flex-1">
            {/* Title */}
            <div className="text-left shrink-0">
              <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter">The Catalog</h1>
              <p className="hidden md:block text-sm text-muted-foreground font-medium">Browse our curated collection</p>
            </div>

            {/* Search Bar - Flexible width */}
            <div className="relative flex-1 md:max-w-[400px]">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 md:h-5 w-4 md:w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 md:pl-12 pr-8 md:pr-10 py-2.5 md:py-3 h-auto text-sm md:text-base border-2 border-foreground bg-background focus-visible:ring-accent w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 md:h-5 w-4 md:w-5" />
                </button>
              )}
            </div>

            {/* Desktop: Sort & Filter moved here? No, let's keep previous structure but adapted */}
          </div>

          {/* Controls Row (Sort & Filter) */}
          <div className="flex gap-2 md:gap-4 md:justify-end shrink-0">
            {/* Wraps sort/filter/clear */}
            <div className="flex gap-2 w-full md:w-auto">
              {/* Sort Dropdown */}


              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 md:flex-none border-2 border-foreground px-4 md:px-6 py-2.5 md:py-3 font-bold text-sm"
              >
                FILTERS {hasActiveFilters && `(${selectedBrands.length + selectedSizes.length + (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0)})`}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={onClearFilters}
                  className="text-accent hover:text-accent/80 font-bold px-2 md:px-4 text-sm"
                >
                  CLEAR
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 pt-4 md:pt-6 mt-4 border-t-2 border-foreground/10 animate-fade-in">
            {/* Sort Filter */}
            <div>
              <h3 className="font-bold text-xs md:text-sm mb-2 md:mb-3 tracking-wide">SORT BY</h3>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                  <Badge
                    key={value}
                    variant={sortOption === value ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all ${sortOption === value
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'border-2 border-foreground hover:bg-foreground hover:text-background'
                      }`}
                    onClick={() => onSortChange(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Brand Filter */}
            <div>
              <h3 className="font-bold text-xs md:text-sm mb-2 md:mb-3 tracking-wide">BRAND</h3>
              <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-[120px] overflow-y-auto scrollbar-hide">
                {availableBrands.map((brand) => (
                  <Badge
                    key={brand}
                    variant={selectedBrands.includes(brand) ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-all ${selectedBrands.includes(brand)
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'border-2 border-foreground hover:bg-foreground hover:text-background'
                      }`}
                    onClick={() => onBrandToggle(brand)}
                  >
                    {brand}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="font-bold text-xs md:text-sm mb-2 md:mb-3 tracking-wide">SIZE (EU)</h3>
              <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-[120px] overflow-y-auto scrollbar-hide">
                {availableSizes.map((size) => (
                  <Badge
                    key={size}
                    variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                    className={`cursor-pointer w-10 md:w-12 h-8 md:h-10 flex items-center justify-center text-xs md:text-sm font-medium transition-all ${selectedSizes.includes(size)
                      ? 'bg-foreground text-background hover:bg-foreground/90'
                      : 'border-2 border-foreground hover:bg-foreground hover:text-background'
                      }`}
                    onClick={() => onSizeToggle(size)}
                  >
                    {size}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div>
              <h3 className="font-bold text-xs md:text-sm mb-2 md:mb-3 tracking-wide">PRICE RANGE</h3>
              <div className="px-1 md:px-2">
                <Slider
                  value={[priceRange[1]]}
                  min={minPrice}
                  max={maxPrice}
                  step={500}
                  onValueChange={(value) => onPriceChange([minPrice, value[0]])}
                  className="mb-3 md:mb-4"
                  data-testid="price-slider"
                />
                <div className="flex justify-between text-xs md:text-sm font-medium">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;

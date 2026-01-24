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
    <div className="bg-secondary py-6 top-0 z-40">
      <div className="container">
        {/* Search Bar and Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side - Title */}
          <div className="text-left w-full md:w-auto">
            <h1 className="text-3xl font-black uppercase tracking-tighter">The Catalog</h1>
            <p className="text-sm text-muted-foreground font-medium">Browse our curated collection</p>
          </div>

          {/* Right Side - Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-[20rem]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by brand or style..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg border-2 border-foreground bg-background focus-visible:ring-accent w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortOption} onValueChange={(val) => onSortChange(val as SortOption)}>
              <SelectTrigger className="w-full sm:w-[150px] border-2 border-foreground py-6 font-bold">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">A-Z (Name)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-2 border-foreground px-6 py-6 font-bold w-full sm:w-auto"
            >
              FILTERS {hasActiveFilters && `(${selectedBrands.length + selectedSizes.length + (priceRange[0] !== minPrice || priceRange[1] !== maxPrice ? 1 : 0)})`}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={onClearFilters}
                className="text-accent hover:text-accent/80 font-bold"
              >
                CLEAR ALL
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid md:grid-cols-3 gap-8 pt-6 border-t-2 border-foreground/10 animate-fade-in">
            {/* Brand Filter */}
            <div>
              <h3 className="font-bold text-sm mb-3 tracking-wide">BRAND</h3>
              <div className="flex flex-wrap gap-2">
                {availableBrands.map((brand) => (
                  <Badge
                    key={brand}
                    variant={selectedBrands.includes(brand) ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all ${selectedBrands.includes(brand)
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
              <h3 className="font-bold text-sm mb-3 tracking-wide">SIZE (EU)</h3>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <Badge
                    key={size}
                    variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                    className={`cursor-pointer w-12 h-10 flex items-center justify-center text-sm font-medium transition-all ${selectedSizes.includes(size)
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
              <h3 className="font-bold text-sm mb-3 tracking-wide">PRICE RANGE</h3>
              <div className="px-2">
                <Slider
                  value={[priceRange[1]]}
                  min={minPrice}
                  max={maxPrice}
                  step={500}
                  onValueChange={(value) => onPriceChange([minPrice, value[0]])}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm font-medium">
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

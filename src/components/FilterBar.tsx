import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

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
}: FilterBarProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (price: number) => `₱${price.toLocaleString()}`;

  return (
    <div className="bg-secondary py-6 sticky top-0 z-40">
      <div className="container">
        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by brand or style..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-foreground bg-background focus-visible:ring-accent"
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
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-2 border-foreground px-6 py-6 font-bold"
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
                    className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all ${
                      selectedBrands.includes(brand)
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
                    className={`cursor-pointer w-12 h-10 flex items-center justify-center text-sm font-medium transition-all ${
                      selectedSizes.includes(size)
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
                  value={priceRange}
                  min={minPrice}
                  max={maxPrice}
                  step={500}
                  onValueChange={(value) => onPriceChange(value as [number, number])}
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

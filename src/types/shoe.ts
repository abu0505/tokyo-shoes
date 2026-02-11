export interface Shoe {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number; // Original price before discount (if applicable)
  image: string;
  additionalImages?: string[];
  thumbnailUrl?: string;
  sizes: number[];
  status: 'in_stock' | 'sold_out';
  createdAt: Date;
  updatedAt?: Date;
  inventory?: { [size: number]: number };
}

export interface WishlistItem {
  id: string;
  userId: string;
  shoeId: string;
  addedAt: Date;
}

// Empty array - products should be added via admin panel
// export const mockShoes: Shoe[] = [];

// Helper to check if shoe is new (added within last 7 days)
export const isNewArrival = (shoe: Shoe): boolean => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return shoe.createdAt > sevenDaysAgo;
};

// Get unique brands from shoes
export const getUniqueBrands = (shoes: Shoe[]): string[] => {
  return [...new Set(shoes.map(shoe => shoe.brand))].sort();
};

// Get unique sizes from shoes
export const getUniqueSizes = (shoes: Shoe[]): number[] => {
  const allSizes = shoes.flatMap(shoe => shoe.sizes);
  return [...new Set(allSizes)].sort((a, b) => a - b);
};

// Get price range from shoes
export const getPriceRange = (shoes: Shoe[]): { min: number; max: number } => {
  const prices = shoes.map(shoe => shoe.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
};

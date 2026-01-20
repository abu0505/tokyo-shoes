export interface Shoe {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  sizes: number[];
  status: 'in_stock' | 'sold_out';
  createdAt: Date;
}

export interface WishlistItem {
  id: string;
  userId: string;
  shoeId: string;
  addedAt: Date;
}

// Mock data for Phase 1
export const mockShoes: Shoe[] = [
  {
    id: '1',
    name: 'Air Jordan 1 Retro High',
    brand: 'Nike',
    price: 18500,
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=600&fit=crop',
    sizes: [40, 41, 42, 43, 44, 45],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago - NEW
  },
  {
    id: '2',
    name: 'Yeezy Boost 350 V2',
    brand: 'Adidas',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&h=600&fit=crop',
    sizes: [40, 41, 42, 43],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago - NEW
  },
  {
    id: '3',
    name: 'RS-X Reinvention',
    brand: 'Puma',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop',
    sizes: [39, 40, 41, 42, 43, 44],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  },
  {
    id: '4',
    name: 'Classic Leather',
    brand: 'Reebok',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop',
    sizes: [41, 42, 43, 44, 45],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    name: 'Air Force 1 Low',
    brand: 'Nike',
    price: 11000,
    image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=600&fit=crop',
    sizes: [40, 41, 42, 43, 44],
    status: 'sold_out',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    name: 'Old Skool',
    brand: 'Vans',
    price: 6500,
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=600&fit=crop',
    sizes: [38, 39, 40, 41, 42, 43, 44, 45],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago - NEW
  },
  {
    id: '7',
    name: 'Chuck Taylor All Star',
    brand: 'Converse',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1463100099107-aa0980c362e6?w=600&h=600&fit=crop',
    sizes: [37, 38, 39, 40, 41, 42, 43],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    id: '8',
    name: 'Ultraboost 22',
    brand: 'Adidas',
    price: 19000,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
    sizes: [41, 42, 43, 44, 45, 46],
    status: 'in_stock',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago - NEW
  },
];

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

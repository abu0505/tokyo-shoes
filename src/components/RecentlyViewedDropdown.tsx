import { Eye, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockShoes } from '@/types/shoe';
import { formatPrice } from '@/lib/format';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RecentlyViewedDropdownProps {
  recentlyViewedIds: string[];
}

const RecentlyViewedDropdown = ({ recentlyViewedIds }: RecentlyViewedDropdownProps) => {
  const recentShoes = recentlyViewedIds
    .slice(0, 4)
    .map(id => mockShoes.find(shoe => shoe.id === id))
    .filter(Boolean);

  if (recentShoes.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 hover:bg-accent/10 rounded-lg transition-colors group">
          <Eye className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-accent text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {recentShoes.length}
          </span>
          <span className="sr-only">Recently viewed</span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border-2 border-foreground bg-background" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b-2 border-foreground flex items-center justify-between">
          <span className="text-sm font-bold tracking-wide">RECENTLY VIEWED</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recentShoes.map((shoe) => (
            <Link
              key={shoe!.id}
              to={`/product/${shoe!.id}`}
              className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-muted last:border-b-0"
            >
              <img
                src={shoe!.image}
                alt={shoe!.name}
                className="w-14 h-14 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{shoe!.name}</p>
                <p className="text-xs text-muted-foreground">{shoe!.brand}</p>
                <p className="text-sm font-bold text-accent mt-1">
                  {formatPrice(shoe!.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Link
          to="/#catalog"
          className="block p-3 text-center text-sm font-bold border-t-2 border-foreground hover:bg-accent hover:text-background transition-colors"
        >
          VIEW ALL PRODUCTS →
        </Link>
      </PopoverContent>
    </Popover>
  );
};

export default RecentlyViewedDropdown;

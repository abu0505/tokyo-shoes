import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import RecentlyViewedDropdown from './RecentlyViewedDropdown';

const Header = () => {
  const { recentlyViewed } = useRecentlyViewed();

  return (
    <header className="bg-background border-b-2 border-foreground py-4 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">TOKYO</span>
          <span className="text-accent text-2xl font-black">•</span>
        </a>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#catalog" className="text-sm font-bold tracking-wide hover:text-accent transition-colors">
            CATALOG
          </a>
          <a href="#" className="text-sm font-bold tracking-wide hover:text-accent transition-colors">
            NEW ARRIVALS
          </a>
          <a href="#" className="text-sm font-bold tracking-wide hover:text-accent transition-colors">
            BRANDS
          </a>
        </nav>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-4">
          {/* Recently Viewed Dropdown */}
          <RecentlyViewedDropdown recentlyViewedIds={recentlyViewed} />
          
          {/* Auth Buttons - Coming in Phase 3 */}
          <button className="text-sm font-bold tracking-wide hover:text-accent transition-colors">
            LOGIN
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

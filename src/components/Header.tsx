import { Link, useNavigate } from 'react-router-dom';
import { Eye, User, LogOut } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/hooks/useAuth';
import RecentlyViewedDropdown from './RecentlyViewedDropdown';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

const Header = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#catalog');
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-md border-b-2 border-foreground py-4 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tighter">TOKYO</span>
          <span className="text-accent text-2xl font-black">•</span>
        </Link>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a 
            href="#catalog" 
            onClick={scrollToCatalog}
            className="text-sm font-bold tracking-wide hover:text-accent transition-colors"
          >
            CATALOG
          </a>
          <Link 
            to="/?filter=new" 
            className="text-sm font-bold tracking-wide hover:text-accent transition-colors"
          >
            NEW ARRIVALS
          </Link>
          <Link 
            to="/?filter=brands" 
            className="text-sm font-bold tracking-wide hover:text-accent transition-colors"
          >
            BRANDS
          </Link>
        </nav>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Recently Viewed Dropdown with better icon */}
          {recentlyViewed.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <RecentlyViewedDropdown recentlyViewedIds={recentlyViewed} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recently Viewed</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {/* Auth Section */}
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="font-bold border-2 border-foreground">
                    ADMIN
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="font-bold"
              >
                <LogOut className="h-4 w-4 mr-1" />
                LOGOUT
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-bold">
                <User className="h-4 w-4 mr-1" />
                LOGIN
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
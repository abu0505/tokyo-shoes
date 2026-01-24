import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Heart, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/contexts/WishlistContext';
import RecentlyViewedDropdown from './RecentlyViewedDropdown';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

const Header = () => {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed } = useRecentlyViewed();
  const { user, isAdmin, signOut } = useAuth();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const wishlistCount = wishlistIds.length;

  const handleLogout = async () => {
    await signOut();
    clearRecentlyViewed();
    setMobileMenuOpen(false);
    toast.success('Logged out successfully');
  };

  const scrollToCatalog = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#catalog');
    }
  };

  return (
    <header className="bg-background/80 backdrop-blur-md backdrop-saturate-150 border-b-2 border-foreground py-3 md:py-4 sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Tokyo Shoes" className="h-8 md:h-[46px] w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-6">
            <a
              href="#catalog"
              onClick={scrollToCatalog}
              className="text-sm font-bold tracking-wide hover:text-accent transition-colors"
            >
              CATALOG
            </a>
            <Link
              to="/contact"
              className="text-sm font-bold tracking-wide hover:text-accent transition-colors"
            >
              CONTACT US
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Recently Viewed Dropdown */}
            {recentlyViewed.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <RecentlyViewedDropdown
                      recentlyViewedIds={recentlyViewed}
                      onRemoveItem={removeFromRecentlyViewed}
                      onClearAll={clearRecentlyViewed}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recently Viewed</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Wishlist Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/wishlist" className="relative">
                  <button className="relative p-2 hover:text-accent rounded-lg transition-colors group flex items-center gap-1.5">
                    <Heart className="w-5 h-5" />
                    <span className="text-xs font-bold tracking-wide">WISHLIST</span>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>My Wishlist</p>
              </TooltipContent>
            </Tooltip>

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="font-bold"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  LOGOUT
                </Button>
                {isAdmin && (
                  <Link to="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="font-bold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      MANAGE
                    </Button>
                  </Link>
                )}
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

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-2">
          {/* Wishlist Icon */}
          <Link to="/wishlist" className="relative p-2">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Recently Viewed - Mobile */}
          {recentlyViewed.length > 0 && (
            <RecentlyViewedDropdown
              recentlyViewedIds={recentlyViewed}
              onRemoveItem={removeFromRecentlyViewed}
              onClearAll={clearRecentlyViewed}
            />
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-l-2 border-foreground">
              <SheetHeader className="border-b border-foreground/10 pb-4 mb-4">
                <SheetTitle className="text-left font-black">MENU</SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col gap-4">
                <a
                  href="#catalog"
                  onClick={scrollToCatalog}
                  className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2"
                >
                  CATALOG
                </a>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2"
                >
                  CONTACT US
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 flex items-center gap-2"
                >
                  <Heart className="w-5 h-5" />
                  WISHLIST
                  {wishlistCount > 0 && (
                    <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <div className="border-t border-foreground/10 pt-4 mt-2">
                  {user ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-3">
                        {user.email}
                      </p>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-2 text-lg font-bold tracking-wide hover:text-accent transition-colors py-2"
                        >
                          <Settings className="w-5 h-5" />
                          MANAGE
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        LOGOUT
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-lg font-bold tracking-wide hover:text-accent transition-colors py-2"
                    >
                      <User className="w-5 h-5" />
                      LOGIN
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;

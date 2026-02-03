import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Heart, Settings, Menu, Footprints, MessageCircle, ShoppingCart, ChevronDown, Clock, Package } from 'lucide-react';
import { useState } from 'react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { getRandomColor } from '@/lib/colors';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { toast } from 'sonner';


const Header = () => {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed } = useRecentlyViewed();
  const { user, isAdmin, signOut } = useAuth();
  const { wishlistIds } = useWishlist();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const wishlistCount = wishlistIds.length;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };


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
    <>
      <header className="bg-background/60 backdrop-blur-md backdrop-saturate-150 border-b border-foreground/20 py-3 md:py-4 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="container flex items-center justify-between relative min-h-[46px] px-5">
          {/* Left: Catalog & Recent (Desktop) */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-start">
            <a
              href="#catalog"
              onClick={scrollToCatalog}
              className="group flex items-center gap-1.5 text-sm font-bold tracking-wide hover:text-accent transition-colors"
            >
              <Footprints className="w-4 h-4" />
              CATALOG
            </a>

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
          </div>

          {/* Center: Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Tokyo Shoes" className="h-8 md:h-[46px] w-auto" />
            </Link>
          </div>

          {/* Mobile Logo (Visible only on mobile, since absolute one might overlap or behave oddly on small screens if not handled) */}
          <div className="md:hidden">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Tokyo Shoes" className="h-8 w-auto" />
            </Link>
          </div>


          {/* Right: Icons & Account (Desktop) */}
          <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
            {/* Contact Link */}
            <Link to="/contact">
              <Button variant="ghost" className="font-bold hover:bg-transparent hover:text-accent">
                Contact Us
              </Button>
            </Link>

            {/* Wishlist Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/wishlist" className="relative">
                  <button className="relative p-2 hover:text-accent rounded-lg transition-colors">
                    <Heart className="w-5 h-5" />
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

            {/* Cart Button - Only for logged in users */}
            {user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/cart" className="relative">
                    <button className="relative p-2 hover:text-accent rounded-lg transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Shopping Cart</p>
                </TooltipContent>
              </Tooltip>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-transparent active:bg-transparent focus:ring-0 focus-visible:ring-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || "User"} />
                      <AvatarFallback className={`font-bold text-base ${user?.email ? getRandomColor(user.email) : 'bg-muted'}`}>
                        {getInitials(user?.user_metadata?.full_name || user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer focus:bg-black focus:text-white transition-colors">
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>

                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer focus:bg-black focus:text-white transition-colors">
                        <Settings className="h-4 w-4" />
                        Manage
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="flex items-center gap-2 cursor-pointer focus:bg-black focus:text-white transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      Contact
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/order-history" className="flex items-center gap-2 cursor-pointer focus:bg-black focus:text-white transition-colors">
                      <Package className="h-4 w-4" />
                      Order History
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive-foreground">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                  <div className="px-2 py-1.5 text-xs font-medium truncate">
                    {user.user_metadata?.full_name || user.email}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" state={{ from: location }}>
                  <Button variant="outline" className="font-bold border-2 border-black bg-transparent text-black hover:bg-black hover:text-white transition-colors">
                    Login
                  </Button>
                </Link>
                <Link to="/auth" state={{ view: 'signup', from: location }}>
                  <Button className="font-bold bg-black text-white hover:bg-black/90">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
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
              <SheetContent side="right" className="w-[280px] bg-background/60 backdrop-blur-md border-l border-foreground/20">
                <SheetHeader className="border-b border-foreground/10 pb-4 mb-4">
                  <SheetTitle className="text-left font-black">MENU</SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-4">
                  <a
                    href="#catalog"
                    onClick={scrollToCatalog}
                    className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 flex items-center gap-2"
                  >
                    <Footprints className="w-5 h-5" />
                    CATALOG
                  </a>
                  <Link
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 flex items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
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
                  {user && (
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 flex items-center gap-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      CART
                      {cartCount > 0 && (
                        <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {user && (
                    <Link
                      to="/order-history"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-bold tracking-wide hover:text-accent transition-colors py-2 flex items-center gap-2"
                    >
                      <Package className="w-5 h-5" />
                      ORDER HISTORY
                    </Link>
                  )}

                  <div className="border-t border-foreground/10 pt-4 mt-2">
                    {user ? (
                      <>
                        <p className="text-sm text-foreground/70 font-semibold mb-3">
                          {user.user_metadata?.full_name || user.email}
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
                        state={{ from: location }}
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
    </>
  );
};

export default Header;


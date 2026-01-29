import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShoppingBag, LogOut, ArrowLeft, Menu, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import TextLoader from '@/components/TextLoader';

interface AdminLayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

const AdminLayout = ({ children, header }: AdminLayoutProps) => {
  const { user, isAdmin, isLoading, isAdminLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Wait for both auth and admin check to complete
  const stillLoading = isLoading || isAdminLoading;

  useEffect(() => {
    if (!stillLoading && !user) {
      navigate('/auth', { state: { from: location.pathname } });
    } else if (!stillLoading && user && !isAdmin) {
      toast.error('You do not have admin access');
      navigate('/');
    }
  }, [user, isAdmin, stillLoading, navigate, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: Package, label: 'Orders' },
    { path: '/admin/inventory', icon: ShoppingBag, label: 'Inventory' },
  ];

  if (stillLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <TextLoader text="Loading" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border">
        <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
          <img src="/logo.png" alt="Tokyo Shoes" className="h-[46px] w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <p className="text-xs font-bold text-muted-foreground mb-4 tracking-widest px-6">
          ADMIN PANEL
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/admin' && location.pathname === '/admin');
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors ${isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/10'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div className="py-4 border-t border-border">
        <p className="text-xs text-muted-foreground mb-1 px-6">Shop Owner</p>
        <p className="font-bold truncate mb-4 px-6">{user?.email}</p>
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-foreground hover:bg-accent/10 hover:text-foreground mb-1 px-6 rounded-none h-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Website
          </Button>
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors px-6 rounded-none h-12"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-secondary flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden border-b border-border p-4 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r border-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <img src="/logo.png" alt="Tokyo Shoes" className="h-8 w-auto" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-background border-r border-border text-foreground flex-col">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {header}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6 flex-1 bg-secondary/30"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLayout;

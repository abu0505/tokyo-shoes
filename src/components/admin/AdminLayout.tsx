import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin, isLoading, isAdminLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
  ];

  if (stillLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border text-foreground flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
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
          <Link to="/">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default AdminLayout;

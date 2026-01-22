import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { state: { from: location.pathname } });
    } else if (!isLoading && user && !isAdmin) {
      toast.error('You do not have admin access');
      navigate('/');
    }
  }, [user, isAdmin, isLoading, navigate, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
  ];

  if (isLoading) {
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-background flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-background/20">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter">TOKYO</span>
            <span className="text-accent text-2xl font-black">.</span>
            <span className="text-sm font-bold text-background/60">Style</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="text-xs font-bold text-background/50 mb-4 tracking-widest">
            ADMIN PANEL
          </p>
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/admin' && location.pathname === '/admin');
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'hover:bg-background/10'
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
        <div className="p-4 border-t border-background/20">
          <p className="text-xs text-background/50 mb-1">Shop Owner</p>
          <p className="font-bold truncate mb-4">{user?.email}</p>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-background hover:bg-background/10 hover:text-background"
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

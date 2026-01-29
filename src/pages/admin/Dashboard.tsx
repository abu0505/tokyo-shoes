import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Package, CheckCircle, XCircle, IndianRupee, Clock, Plus, ShoppingBag, Archive } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import { formatPrice, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import TextLoader from '@/components/TextLoader';

const AdminDashboard = () => {
  // Fetch all shoes for dashboard stats and recent activity
  const { data: shoes = [], isLoading } = useQuery({
    queryKey: ['admin-dashboard-shoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shoes')
        .select('*');

      if (error) throw error;
      return data as DbShoe[];
    },
  });

  // Calculate dashboard stats
  const totalInventory = shoes.length;
  const inStockCount = shoes.filter(shoe => shoe.status === 'in_stock').length;
  const soldOutCount = shoes.filter(shoe => shoe.status === 'sold_out').length;
  const totalValue = shoes.reduce((sum, shoe) => sum + shoe.price, 0);

  // Recent activity (last 10 changed shoes)
  /*
     Sort items by updated_at (or created_at if null) descending.
     Determine activity type:
     - If updated_at is close to created_at (within 60s) -> "added"
     - If status is 'sold_out' and updated recently -> "marked sold out"? 
       (Hard to differentiate edit vs status change without logs, but we can verify requirement:
       "recent activity should store last 10 product also when admin edit any product or mark the product out of stock then it should update that also in the recent activity."
       Since we just have updated_at, any change bumps it. We display the current status.
       We can infer "Newly Added" vs "Updated".
  */

  /*
     Sort items by updated_at (or created_at if updated_at is null) descending.
  */

  const recentActivity = [...shoes]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, 10);

  const getActivityType = (shoe: DbShoe) => {
    // If updated_at exists and is different from created_at (by more than 60s), it's an update
    if (shoe.updated_at) {
      const created = new Date(shoe.created_at).getTime();
      const updated = new Date(shoe.updated_at).getTime();
      if (updated - created > 60000) { // 1 minute buffer
        if (shoe.status === 'sold_out') return 'Marked Sold Out';
        if (shoe.status === 'in_stock') return 'Updated';
      }
    }
    return 'New Arrival';
  };

  const statCards = [
    {
      title: 'Total Inventory',
      value: totalInventory,
      description: 'Total number of unique shoe models.',
      icon: ShoppingBag,
      color: 'text-foreground',
    },
    {
      title: 'In Stock',
      value: inStockCount,
      description: 'Shoes currently available for purchase.',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Sold Out',
      value: soldOutCount,
      description: 'Shoes that are currently out of stock.',
      icon: Archive,
      color: 'text-red-600',
    },
    {
      title: 'Total Value',
      value: formatPrice(totalValue),
      description: 'Estimated total value of current inventory.',
      icon: IndianRupee,
      color: 'text-foreground',
      isLarge: true,
    },
  ];

  return (
    <AdminLayout
      header={
        <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">Dashboard Overview</h2>
            <p className="text-xs text-muted-foreground">Monitor your inventory at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/inventory">
              <button className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all shadow-md shadow-accent/30">
                <Plus className="h-5 w-5" />
                Add Shoe
              </button>
            </Link>
          </div>
        </header>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white border border-border p-6 rounded-2xl shadow-sm transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </h3>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>

              <p className={`text-4xl font-black ${card.isLarge ? 'text-black' : 'text-foreground'}`}>
                {isLoading ? <TextLoader text="" className="inline-flex min-w-0" showDots={true} /> : card.value}
              </p>

              <p className="text-xs text-muted-foreground mt-2">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="bg-white border border-border rounded-2xl shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-2 px-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-black">Recent Activity</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 px-2">
            Last 10 updates to the inventory.
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <TextLoader />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-medium">No recent activity to display.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity will appear here when you add or update inventory.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((shoe, index) => (
                <motion.div
                  key={shoe.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-neutral-50/50 border-b border-border last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  {/* Shoe Image */}
                  {shoe.image_url ? (
                    <img
                      src={shoe.image_url}
                      alt={shoe.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg">
                      📦
                    </div>
                  )}

                  {/* Shoe Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{shoe.name}</p>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">
                        {getActivityType(shoe)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{shoe.brand}</p>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatPrice(shoe.price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(shoe.updated_at || shoe.created_at))}
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`px-3 py-1 text-xs font-bold rounded-full ${shoe.status === 'in_stock'
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : 'bg-red-500/10 text-red-600 border border-red-500/20'
                      }`}
                  >
                    {shoe.status === 'in_stock' ? 'In Stock' : 'Sold Out'}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

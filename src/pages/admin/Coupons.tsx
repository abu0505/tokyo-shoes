
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Ticket, ShoppingBag, ArrowUpRight } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import TextLoader from '@/components/TextLoader';
import { motion } from 'framer-motion';
import CouponTable from '@/components/admin/CouponTable';
import CreateCouponModal from '@/components/admin/CreateCouponModal';

import { Tables } from '@/types/database';

const AdminCoupons = () => {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Fetch coupons to calculate stats
    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['admin-coupons'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Tables<'coupons'>[];
        },
    });

    // Calculate stats
    const activeCoupons = coupons.filter(c => c.is_active).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.times_used || 0), 0);

    // Estimated Revenue Saved (Approximate logic: Fixed Amount * Uses. % is ignored for now as we don't have order linkage readily available in this query)
    const revenueSaved = coupons.reduce((sum, c) => {
        if (c.discount_type === 'fixed_amount') {
            return sum + (c.discount_value * (c.times_used || 0));
        }
        return sum;
    }, 0);

    const stats = [
        {
            title: 'Active Coupons',
            value: activeCoupons,
            icon: Ticket,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            trend: '+1', // Placeholder
        },
        {
            title: 'Total Redemptions',
            value: totalRedemptions.toLocaleString(),
            icon: ShoppingBag,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            trend: '+5%', // Placeholder
        },
        {
            title: 'Revenue Saved (Est.)',
            value: `₹${revenueSaved.toLocaleString()}`,
            icon: Ticket, // Changing icon if needed
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
            trend: '+8% YTD', // Placeholder
        }
    ];

    return (
        <AdminLayout
            header={
                <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">Coupon Manager</h2>
                        <p className="text-xs text-muted-foreground">Manage discounts and promotional campaigns.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="h-10 px-4 flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold shadow-md shadow-red-200"
                    >
                        <Plus className="h-4 w-4" />
                        Create New Coupon
                    </Button>
                </header>
            }
        >
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between h-32"
                        >
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-green-50 text-green-600 flex items-center gap-1`}>
                                    <ArrowUpRight className="h-3 w-3" />
                                    {stat.trend}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-black text-gray-900">
                                    {isLoading ? <TextLoader text="" showDots={true} /> : stat.value}
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Coupons Table */}
                <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
                    <CouponTable coupons={coupons} isLoading={isLoading} />
                </div>
            </div>

            <CreateCouponModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </AdminLayout>
    );
};

export default AdminCoupons;


import { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2, Copy, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TextLoader from '@/components/TextLoader';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface CouponTableProps {
    coupons: any[]; // Using any for now, ideally DbCoupon
    isLoading: boolean;
}

const CouponTable = ({ coupons, isLoading }: CouponTableProps) => {
    const queryClient = useQueryClient();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success('Coupon code copied!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        const toastId = toast.loading('Deleting coupon...');
        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', deleteId);

            if (error) throw error;

            toast.success('Coupon deleted successfully', { id: toastId });
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon', { id: toastId });
        } finally {
            setDeleteId(null);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update would be better, but invalidation is safe
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (coupon: any) => {
        if (!coupon.is_active) return 'bg-red-100 text-red-600 border-red-200'; // Disabled

        const now = new Date();
        const start = coupon.starts_at ? new Date(coupon.starts_at) : null;
        const end = coupon.expires_at ? new Date(coupon.expires_at) : null;

        if (end && now > end) return 'bg-gray-100 text-gray-500 border-gray-200'; // Expired
        if (start && now < start) return 'bg-yellow-100 text-yellow-600 border-yellow-200'; // Scheduled

        return 'bg-green-100 text-green-600 border-green-200'; // Active
    };

    const getStatusText = (coupon: any) => {
        if (!coupon.is_active) return 'Disabled';

        const now = new Date();
        const start = coupon.starts_at ? new Date(coupon.starts_at) : null;
        const end = coupon.expires_at ? new Date(coupon.expires_at) : null;

        if (end && now > end) return 'Expired';
        if (start && now < start) return 'Scheduled';

        return 'Active';
    };

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <TextLoader />
            </div>
        );
    }

    if (coupons.length === 0) {
        return (
            <div className="p-12 text-center text-muted-foreground">
                <p>No coupons found. Create your first campaign!</p>
            </div>
        );
    }

    return (
        <>

            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50">
                        <TableHead className="w-[120px] font-bold text-xs uppercase text-muted-foreground">Code</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">Type</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">Value</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">Usage</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">Expiry Date</TableHead>
                        <TableHead className="font-bold text-xs uppercase text-muted-foreground">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {coupons.map((coupon) => (
                        <TableRow key={coupon.id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm font-bold">
                                        {coupon.code}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:bg-transparent"
                                        onClick={() => copyToClipboard(coupon.id, coupon.code)}
                                    >
                                        {copiedId === coupon.id ? (
                                            <Check className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm capitalize text-muted-foreground">
                                {coupon.discount_type.replace('_', ' ')}
                            </TableCell>
                            <TableCell className="font-bold text-red-500">
                                {coupon.discount_type === 'percentage'
                                    ? `${coupon.discount_value}% OFF`
                                    : `₹${coupon.discount_value} OFF`
                                }
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">
                                        {coupon.times_used} <span className="text-muted-foreground">used</span>
                                    </span>
                                    {coupon.usage_limit_total && (
                                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min((coupon.times_used / coupon.usage_limit_total) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}
                                    {coupon.usage_limit_total && (
                                        <span className="text-[10px] text-muted-foreground">Limit: {coupon.usage_limit_total}</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {coupon.expires_at
                                    ? format(new Date(coupon.expires_at), 'MMM dd, yyyy')
                                    : <span className="text-xs">No Expiry</span>
                                }
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(coupon)}`}>
                                        {getStatusText(coupon)}
                                    </span>
                                    <Switch
                                        checked={coupon.is_active}
                                        onCheckedChange={() => toggleStatus(coupon.id, coupon.is_active)}
                                        className="scale-75"
                                    />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteId(coupon.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the coupon
                            and remove it from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CouponTable;

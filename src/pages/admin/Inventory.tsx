import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuSeparator,
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
import AdminLayout from '@/components/admin/AdminLayout';
import AddShoeModal from '@/components/admin/AddShoeModal';
import TextLoader from '@/components/TextLoader';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';
import { useAdminInventory } from '@/hooks/useAdminInventory';

const PAGE_SIZE = 10;

const Inventory = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShoe, setEditingShoe] = useState<DbShoe | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Fetch shoes with pagination
  const { data: inventoryData, isLoading, isFetching } = useAdminInventory({
    page,
    pageSize: PAGE_SIZE,
  });

  const shoes = inventoryData?.shoes || [];
  const totalCount = inventoryData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const startItem = (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, totalCount);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'in_stock' | 'sold_out' }) => {
      const { error } = await supabase
        .from('shoes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shoes'] });
      toast.success('Status updated');
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shoes'] });
      toast.success('Shoe deleted');
      setDeleteConfirmId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  const handleToggleStatus = (shoe: DbShoe) => {
    const newStatus = shoe.status === 'in_stock' ? 'sold_out' : 'in_stock';
    updateStatusMutation.mutate({ id: shoe.id, status: newStatus });
  };

  return (
    <AdminLayout
      header={
        <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">Inventory Management</h2>
            <p className="text-xs text-muted-foreground">View and manage your shoe inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-all shadow-md shadow-accent/30"
            >
              <Plus className="h-5 w-5" />
              Add Shoe
            </button>
          </div>
        </header>
      }
    >
      <div className="space-y-6">

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-neutral-50/50 hover:bg-neutral-50/50">
                <TableHead className="font-bold">Name</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Price</TableHead>
                <TableHead className="font-bold">Sizes</TableHead>
                <TableHead className="font-bold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <TextLoader />
                  </TableCell>
                </TableRow>
              ) : shoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No shoes in inventory. Add your first shoe!
                  </TableCell>
                </TableRow>
              ) : (
                shoes.map((shoe, index) => (
                  <motion.tr
                    key={shoe.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                    className="border-b border-border hover:bg-neutral-50/50 transition-colors"
                    style={{ display: 'table-row' }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {shoe.image_url ? (
                          <img
                            src={shoe.image_url}
                            alt={shoe.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">{shoe.brand}</p>
                          <p className="font-bold">{shoe.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shoe.status === 'in_stock' ? 'default' : 'secondary'}
                        className={
                          shoe.status === 'in_stock'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 whitespace-nowrap'
                            : 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10 whitespace-nowrap'
                        }
                      >
                        {shoe.status === 'in_stock' ? 'In Stock' : 'Sold Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatPrice(shoe.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-0.5">
                        {shoe.sizes.slice(0, 4).map((size) => (
                          <span
                            key={size}
                            className="text-xs bg-secondary px-1.5 py-0.5 rounded"
                          >
                            {size}
                          </span>
                        ))}
                        {shoe.sizes.length > 4 && (
                          <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                            +{shoe.sizes.length - 4}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              handleToggleStatus(shoe);
                            }}
                            className="flex items-center gap-2 cursor-pointer group focus:bg-transparent focus:text-foreground"
                          >
                            <div className="pointer-events-none">
                              <Switch
                                checked={shoe.status === 'in_stock'}
                                className="data-[state=checked]:bg-red-400"
                              />
                            </div>
                            <span>
                              {shoe.status === 'in_stock' ? 'Mark as Sold Out' : 'Mark as In Stock'}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingShoe(shoe)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Shoe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-accent-foreground"
                            onClick={() => setDeleteConfirmId(shoe.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/50">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{startItem}-{endItem}</span> of{' '}
                <span className="font-bold text-foreground">{totalCount}</span> items
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="border-foreground/20"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="border-foreground/20"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <AddShoeModal
        open={isAddModalOpen || !!editingShoe}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingShoe(null);
        }}
        shoe={editingShoe}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Delete Shoe?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the shoe from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Inventory;

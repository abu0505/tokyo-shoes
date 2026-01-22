import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreVertical, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import { formatPrice } from '@/lib/format';
import { toast } from 'sonner';

const Inventory = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShoe, setEditingShoe] = useState<DbShoe | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch shoes
  const { data: shoes = [], isLoading } = useQuery({
    queryKey: ['admin-shoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shoes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DbShoe[];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'in_stock' | 'sold_out' }) => {
      const { error } = await supabase
        .from('shoes')
        .update({ status })
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              View, add, edit, and delete shoe inventory.
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Shoe
          </Button>
        </div>

        {/* Table */}
        <div className="border-2 border-foreground bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-foreground hover:bg-transparent">
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
                    Loading...
                  </TableCell>
                </TableRow>
              ) : shoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No shoes in inventory. Add your first shoe!
                  </TableCell>
                </TableRow>
              ) : (
                shoes.map((shoe) => (
                  <TableRow key={shoe.id} className="border-b border-muted">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {shoe.image_url ? (
                          <img
                            src={shoe.image_url}
                            alt={shoe.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            📦
                          </div>
                        )}
                        <div>
                          <p className="font-bold">{shoe.name}</p>
                          <p className="text-sm text-muted-foreground">{shoe.brand}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={shoe.status === 'in_stock' ? 'default' : 'secondary'}
                        className={
                          shoe.status === 'in_stock'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }
                      >
                        {shoe.status === 'in_stock' ? 'In Stock' : 'Sold Out'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {formatPrice(shoe.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {shoe.sizes.slice(0, 4).map((size) => (
                          <span
                            key={size}
                            className="text-xs bg-secondary px-2 py-0.5 rounded"
                          >
                            {size}
                          </span>
                        ))}
                        {shoe.sizes.length > 4 && (
                          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
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
                          <DropdownMenuItem onClick={() => handleToggleStatus(shoe)}>
                            {shoe.status === 'in_stock' ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark as Sold Out
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as In Stock
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingShoe(shoe)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Shoe
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteConfirmId(shoe.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
        <AlertDialogContent className="border-2 border-foreground">
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

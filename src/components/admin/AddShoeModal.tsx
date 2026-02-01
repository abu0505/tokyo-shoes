import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DbShoe } from '@/types/database';
import { toast } from 'sonner';
import TextLoader from '../TextLoader';
import { ShoeWithSizes } from '@/hooks/useAdminInventory';
import imageCompression from 'browser-image-compression';

const shoeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().min(1, 'Price must be greater than 0'),
  status: z.enum(['in_stock', 'sold_out']),
  variants: z.array(
    z.object({
      size: z.number().min(1).max(50),
      quantity: z.number().min(0),
    })
  ).min(1, 'At least one size variant is required'),
});

type ShoeFormData = z.infer<typeof shoeSchema>;

interface AddShoeModalProps {
  open: boolean;
  onClose: () => void;
  shoe?: ShoeWithSizes | null;
}

const AddShoeModal = ({ open, onClose, shoe }: AddShoeModalProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(shoe?.image_url || null);
  const [isUploading, setIsUploading] = useState(false);

  const isEditing = !!shoe;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ShoeFormData>({
    resolver: zodResolver(shoeSchema),
    defaultValues: {
      name: shoe?.name || '',
      brand: shoe?.brand || '',
      price: shoe?.price || 0,
      status: (shoe?.status as 'in_stock' | 'sold_out') || 'in_stock',
      variants: shoe?.shoe_sizes?.map(s => ({ size: s.size, quantity: s.quantity || 0 })) || [{ size: 0, quantity: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants"
  });

  // Reset form when shoe changes or modal opens
  useEffect(() => {
    if (open) {
      if (shoe) {
        reset({
          name: shoe.name,
          brand: shoe.brand,
          price: shoe.price,
          status: shoe.status as 'in_stock' | 'sold_out',
          variants: shoe.shoe_sizes && shoe.shoe_sizes.length > 0
            ? shoe.shoe_sizes.map(s => ({ size: s.size, quantity: s.quantity || 0 }))
            : [{ size: 0, quantity: 0 }],
        });
        setImagePreview(shoe.image_url);
      } else {
        reset({
          name: '',
          brand: '',
          price: 0,
          status: 'in_stock',
          variants: [{ size: 0, quantity: 0 }],
        });
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [shoe, open, reset]);

  // Image validation constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  const validateImageFile = (file: File): string | null => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be smaller than 5MB';
    }

    // Validate MIME type (not just extension)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, and WebP images are allowed';
    }

    return null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        // Reset the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    // Re-validate before upload (defense in depth)
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    // Compression
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
      fileType: "image/webp"
    };

    let fileToUpload = file;
    try {
      console.log(`Original size: ${file.size / 1024 / 1024} MB`);
      fileToUpload = await imageCompression(file, options);
      console.log(`Compressed size: ${fileToUpload.size / 1024 / 1024} MB`);
    } catch (error) {
      console.warn("Compression failed, falling back to original:", error);
    }

    // Use MIME type to determine extension (not filename)
    // Force webp extension if compressed, otherwise fallback
    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : (MIME_TO_EXT[fileToUpload.type] || 'jpg');
    // Use crypto.randomUUID for secure, unpredictable filenames
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `shoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('shoe-images')
      .upload(filePath, fileToUpload, {
        contentType: fileToUpload.type, // Explicitly set content type
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('shoe-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ShoeFormData) => {
      setIsUploading(true);

      let imageUrl = shoe?.image_url || null;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Initial sizes array for the shoes table (will be updated by trigger later, but good to have initial state)
      // Actually, my plan said I should rely on the trigger. 
      // But the trigger runs ON CHANGE of shoe_sizes.
      // So I can insert empty sizes array first, then insert shoe_sizes, which will trigger the update.
      // Or I can calculate it here for the initial insert to avoiding a flicker if I wanted, but the trigger is safer.
      // However, strict constraint: "Do NOT remove the sizes column from the shoes table".
      // The trigger handles the sync. So I can send whatever or empty array to `shoes` table initially.
      // BUT, `sizes` is often NOT NULL. Let's check schema. `sizes` is `numeric[]`. It might be nullable or default empty.
      // The schema I saw in `database.ts` says `sizes: number[]`.

      // Let's create the parent shoe row first.
      const shoeData = {
        name: data.name,
        brand: data.brand,
        price: data.price,
        // Status should be calculated based on quantities, but let's trust the logic/user input for now or let the trigger override it.
        // Actually, trigger will update status too.

        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      let shoeId = shoe?.id;

      if (isEditing && shoeId) {
        const { error } = await supabase
          .from('shoes')
          .update(shoeData)
          .eq('id', shoeId);

        if (error) throw error;
      } else {
        const { data: newShoe, error } = await supabase
          .from('shoes')
          .insert([{ ...shoeData, sizes: [] }]) // Initialize with empty sizes, trigger will populate
          .select('id')
          .single();

        if (error) throw error;
        shoeId = newShoe.id;
      }

      if (!shoeId) throw new Error("Failed to get shoe ID");

      // Now handle shoe_sizes
      // First, delete existing
      const { error: deleteError } = await supabase
        .from('shoe_sizes')
        .delete()
        .eq('shoe_id', shoeId);

      if (deleteError) throw deleteError;

      // Filter out invalid variants
      const validVariants = data.variants.filter(v => v.size > 0);

      if (validVariants.length > 0) {
        const { error: insertError } = await supabase
          .from('shoe_sizes')
          .insert(
            validVariants.map(v => ({
              shoe_id: shoeId!, // asserted because we entered the check
              size: v.size,
              quantity: v.quantity
            }))
          );

        if (insertError) throw insertError;
      }

      // Cleanup old image if existing one was replaced
      if (isEditing && imageFile && shoe?.image_url) {
        try {
          const oldUrl = shoe.image_url;
          // Extract path assuming standard Supabase URL structure
          // Public URL: .../storage/v1/object/public/shoe-images/path/to/file
          // Bucket: shoe-images
          // We need just 'path/to/file'
          const path = oldUrl.split('/shoe-images/')[1];
          if (path) {
            const { error: removeError } = await supabase.storage
              .from('shoe-images')
              .remove([decodeURIComponent(path)]);

            if (removeError) {
              console.error('Failed to remove old image:', removeError);
            } else {
              console.log('Old image removed successfully');
            }
          }
        } catch (err) {
          console.error('Error cleaning up old image:', err);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shoes'] });
      queryClient.invalidateQueries({ queryKey: ['shoes'] });
      toast.success(isEditing ? 'Shoe updated' : 'Shoe added');
      handleClose();
    },
    onError: (error) => {
      toast.error('Failed to save: ' + error.message);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleClose = () => {
    reset();
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };

  const onSubmit = (data: ShoeFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* Increased width to accommodate new inputs */}
      <DialogContent className="max-w-[85vw] md:max-w-4xl max-h-[85vh] overflow-y-auto border border-border shadow-lg scrollbar-hide">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">
            {isEditing ? 'Edit Shoe' : 'Add a New Shoe'}
          </DialogTitle>
          {!isEditing && (
            <p className="text-muted-foreground text-sm">
              Fill out the form below to add a new shoe to the inventory.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Image Upload */}
          <div className="md:col-span-5 flex flex-col space-y-2 h-full">
            <Label className="font-bold text-sm tracking-wide">SHOE IMAGE</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors relative flex-grow min-h-[300px] flex flex-col items-center justify-center bg-muted/20"
            >
              {imagePreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-[400px] object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">
                    Click or drag to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, or WEBP (max 5MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Right Column: Input Fields */}
          <div className="md:col-span-7 flex flex-col space-y-6">

            {/* Name & Brand */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-bold text-sm tracking-wide">
                  NAME
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Air Jordan 1"
                  className="border border-border focus:border-accent"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand" className="font-bold text-sm tracking-wide">
                  BRAND
                </Label>
                <Input
                  id="brand"
                  placeholder="e.g., Nike"
                  className="border border-border focus:border-accent"
                  {...register('brand')}
                />
                {errors.brand && (
                  <p className="text-sm text-destructive">{errors.brand.message}</p>
                )}
              </div>
            </div>

            {/* Price & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="font-bold text-sm tracking-wide">
                  PRICE (₹)
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 18500"
                  className="border border-border focus:border-accent"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm tracking-wide">STATUS</Label>
                <Select
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value as 'in_stock' | 'sold_out')}
                >
                  <SelectTrigger className="border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="sold_out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock Manager */}
            <div className="space-y-3 border rounded-lg p-4 bg-secondary/10">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-bold text-sm tracking-wide uppercase">Stock & Sizes</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ size: 0, quantity: 0 })}
                  className="h-8 gap-1 text-xs font-bold"
                >
                  <Plus className="h-3 w-3" />
                  Add Variant
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Size</Label>
                      <Input
                        type="number"
                        placeholder="Size"
                        className="h-9"
                        {...register(`variants.${index}.size`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="h-9"
                        {...register(`variants.${index}.quantity`, { valueAsNumber: true })}
                      />
                    </div>
                    <div className="flex-none pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-transparent"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1 && index === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {errors.variants && (
                <p className="text-sm text-destructive mt-2">{errors.variants.message}</p>
              )}
              {errors.variants?.root && (
                <p className="text-sm text-destructive mt-2">{errors.variants.root.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-6 gap-3 pt-4 mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="col-span-2 border border-border font-bold hover:bg-black hover:text-white transition-colors"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || isUploading}
                className="col-span-4 bg-accent text-accent-foreground hover:bg-accent/90 font-bold"
              >
                {saveMutation.isPending || isUploading
                  ? <TextLoader text="Uploading..." isWhite />
                  : isEditing
                    ? 'Update Shoe'
                    : 'Add Shoe'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddShoeModal;

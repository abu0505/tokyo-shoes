import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X } from 'lucide-react';
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

const shoeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().min(1, 'Price must be greater than 0'),
  status: z.enum(['in_stock', 'sold_out']),
  sizes: z.string().min(1, 'At least one size is required'),
});

type ShoeFormData = z.infer<typeof shoeSchema>;

interface AddShoeModalProps {
  open: boolean;
  onClose: () => void;
  shoe?: DbShoe | null;
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
      sizes: shoe?.sizes?.join(',') || '',
    },
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
          sizes: shoe.sizes.join(','),
        });
        setImagePreview(shoe.image_url);
      } else {
        reset({
          name: '',
          brand: '',
          price: 0,
          status: 'in_stock',
          sizes: '',
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

    // Use MIME type to determine extension (not filename)
    const fileExt = MIME_TO_EXT[file.type] || 'jpg';
    // Use crypto.randomUUID for secure, unpredictable filenames
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `shoes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('shoe-images')
      .upload(filePath, file, {
        contentType: file.type, // Explicitly set content type
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

      const sizes = data.sizes
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(s => !isNaN(s) && s >= 1 && s <= 50); // Validate range (1-50 for US/EU sizes)

      // Validate sizes array has valid entries
      if (sizes.length === 0 && data.sizes.trim() !== '') {
        toast.error('Invalid sizes. Please enter numbers between 1 and 50.');
        return;
      }

      const shoeData = {
        name: data.name,
        brand: data.brand,
        price: data.price,
        status: data.status,
        sizes,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && shoe) {
        const { error } = await supabase
          .from('shoes')
          .update(shoeData)
          .eq('id', shoe.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shoes')
          .insert([shoeData]);

        if (error) throw error;
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
      <DialogContent className="max-w-[75vw] max-h-[80vh] overflow-y-auto border border-border shadow-lg">
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

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Image Upload */}
          <div className="sm:col-span-6 flex flex-col space-y-2">
            <Label className="font-bold text-sm tracking-wide">SHOE IMAGE</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors relative flex-1 flex flex-col items-center justify-center bg-muted/20"
            >
              {imagePreview ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain rounded"
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
          <div className="sm:col-span-6 flex flex-col">
            <div className="space-y-6">
              {/* Name & Brand Row */}
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

              {/* Price & Status Row */}
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

              {/* Sizes */}
              <div className="space-y-2">
                <Label htmlFor="sizes" className="font-bold text-sm tracking-wide">
                  SIZES
                </Label>
                <Input
                  id="sizes"
                  placeholder="e.g., 8,9,10,11"
                  className="border border-border focus:border-accent"
                  {...register('sizes')}
                />
                <p className="text-xs text-muted-foreground">
                  Enter available sizes, separated by commas.
                </p>
                {errors.sizes && (
                  <p className="text-sm text-destructive">{errors.sizes.message}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-6 gap-3 pt-6">
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
                  ? <TextLoader text="Saving" isWhite />
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

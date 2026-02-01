import { useState, useRef, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { toast } from 'sonner';
import TextLoader from '@/components/TextLoader';
import { useAdminShoe } from '@/hooks/useAdminInventory';
import AdminLayout from '@/components/admin/AdminLayout';
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

const AddEditShoe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditing = !!id;

    const { data: shoe, isLoading: isShoeLoading } = useAdminShoe(id);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Mult-image state
    const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
    const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);
    // Keep track of existing additional images (URLs) to preserve them or delete them
    const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>([]);

    const [isUploading, setIsUploading] = useState(false);

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
            name: '',
            brand: '',
            price: 0,
            status: 'in_stock',
            variants: [{ size: 0, quantity: 0 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants"
    });

    // Populate form when shoe data is loaded
    useEffect(() => {
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
            setExistingAdditionalImages(shoe.additional_images || []);
        }
    }, [shoe, reset]);

    // Image validation constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit before compression
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MIME_TO_EXT: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };

    const validateImageFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return 'Image must be smaller than 1MB';
        }
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

    const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        files.forEach(file => {
            const validationError = validateImageFile(file);
            if (validationError) {
                toast.error(`${file.name}: ${validationError}`);
                return;
            }
            validFiles.push(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdditionalPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        setAdditionalFiles(prev => [...prev, ...validFiles]);

        // Clear input
        if (additionalFileInputRef.current) {
            additionalFileInputRef.current.value = '';
        }
    };

    const removeAdditionalFile = (index: number) => {
        setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
        setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAdditionalImage = (index: number) => {
        setExistingAdditionalImages(prev => prev.filter((_, i) => i !== index));
    };


    const uploadImage = async (file: File): Promise<string | null> => {
        // Re-validate before upload
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

        const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : (MIME_TO_EXT[fileToUpload.type] || 'jpg');
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `shoes/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('shoe-images')
            .upload(filePath, fileToUpload, {
                contentType: fileToUpload.type,
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

            // 1. Handle Main Image
            let imageUrl = shoe?.image_url || null;
            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            // 2. Handle Additional Images
            // Start with kept existing images
            const finalAdditionalImages: string[] = [...existingAdditionalImages];

            // Upload new additional files
            if (additionalFiles.length > 0) {
                const uploadPromises = additionalFiles.map(file => uploadImage(file));
                const uploadedUrls = await Promise.all(uploadPromises);

                uploadedUrls.forEach(url => {
                    if (url) finalAdditionalImages.push(url);
                });
            }

            const shoeData = {
                name: data.name,
                brand: data.brand,
                price: data.price,
                image_url: imageUrl,
                additional_images: finalAdditionalImages, // Save to DB
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
                    .insert([{ ...shoeData, sizes: [] }])
                    .select('id')
                    .single();

                if (error) throw error;
                shoeId = newShoe.id;
            }

            if (!shoeId) throw new Error("Failed to get shoe ID");

            // Handle shoe_sizes
            const { error: deleteError } = await supabase
                .from('shoe_sizes')
                .delete()
                .eq('shoe_id', shoeId);

            if (deleteError) throw deleteError;

            const validVariants = data.variants.filter(v => v.size > 0);

            if (validVariants.length > 0) {
                const { error: insertError } = await supabase
                    .from('shoe_sizes')
                    .insert(
                        validVariants.map(v => ({
                            shoe_id: shoeId!,
                            size: v.size,
                            quantity: v.quantity
                        }))
                    );

                if (insertError) throw insertError;
            }

            // Cleanup old main image if replaced
            if (isEditing && imageFile && shoe?.image_url && shoe.image_url !== imageUrl) {
                // Logic to remove old image... (Simplified for now, as strict cleanup requires parsing URLs carefully)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-shoes'] });
            queryClient.invalidateQueries({ queryKey: ['shoes'] });
            queryClient.invalidateQueries({ queryKey: ['admin-shoe', id] });
            toast.success(isEditing ? 'Shoe updated' : 'Shoe added');
            navigate('/admin/inventory');
        },
        onError: (error) => {
            toast.error('Failed to save: ' + error.message);
        },
        onSettled: () => {
            setIsUploading(false);
        },
    });

    const onSubmit = (data: ShoeFormData) => {
        saveMutation.mutate(data);
    };

    if (isEditing && isShoeLoading) {
        return (
            <AdminLayout header={<div className="h-20" />}>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <TextLoader text="Loading shoe details" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            header={
                <header className="h-20 shrink-0 bg-white border-b border-border px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/admin/inventory')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-bold text-black tracking-tight actions uppercase">
                                {isEditing ? 'Edit Shoe' : 'Add New Shoe'}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {isEditing ? 'Update shoe details' : 'Create a new shoe record'}
                            </p>
                        </div>
                    </div>
                </header>
            }
        >
            <div className="max-w-7xl mx-auto pb-8">
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left Column: Input Fields (Swapped Position) */}
                    <div className="flex flex-col space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-border">

                        {/* Name & Brand */}
                        <div className="grid grid-cols-2 gap-6">
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
                        <div className="grid grid-cols-2 gap-6">
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

                        {/* Stock Manager with Hidden Scrollbar */}
                        <div className="space-y-3 pt-2">
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

                            <div className="bg-secondary/10 p-2 rounded-lg border border-border">
                                {/* Scroll container logic */}
                                <div className={`space-y-3 ${fields.length >= 3 ? 'max-h-[220px] overflow-y-auto scrollbar-hide p-2' : ''}`}>
                                    {/* Tailwind 'scrollbar-hide' usually needs a plugin or custom class. 
                      Assuming 'scrollbar-hide' is available or I can inline style it. 
                      Let's add inline style for safety just in case plugin is missing. */}
                                    <style>{`
                     .scrollbar-hide::-webkit-scrollbar {
                         display: none;
                     }
                     .scrollbar-hide {
                         -ms-overflow-style: none;
                         scrollbar-width: none;
                     }
                   `}</style>
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4 items-start">
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Size</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Size"
                                                    className="h-10 bg-white"
                                                    {...register(`variants.${index}.size`, { valueAsNumber: true })}
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <Label className="text-xs text-muted-foreground">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Qty"
                                                    className="h-10 bg-white"
                                                    {...register(`variants.${index}.quantity`, { valueAsNumber: true })}
                                                />
                                            </div>
                                            <div className="flex-none pt-7">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
                                    <p className="text-sm text-destructive mt-3">{errors.variants.message}</p>
                                )}
                                {errors.variants?.root && (
                                    <p className="text-sm text-destructive mt-3">{errors.variants.root.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-4 pt-6 mt-4 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/admin/inventory')}
                                className="font-bold h-12 hover:bg-black hover:text-white transition-colors"
                                disabled={saveMutation.isPending || isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saveMutation.isPending || isUploading}
                                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-12 text-base"
                            >
                                {saveMutation.isPending || isUploading ? (
                                    <TextLoader text="Saving" isWhite />
                                ) : isEditing ? (
                                    'Update Shoe'
                                ) : (
                                    'Add Shoe'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Image Uploads */}
                    <div className="flex flex-col space-y-6">

                        {/* Main Image */}
                        <div className="flex flex-col space-y-2">
                            <Label className="font-bold text-sm tracking-wide">MAIN IMAGE (Thumbnail & Catalog)</Label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors relative min-h-[300px] flex flex-col items-center justify-center bg-white shadow-sm"
                            >
                                {imagePreview ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="max-w-full max-h-[300px] object-contain rounded"
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
                                            Click to upload Main Image
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG, or WEBP (max 1MB)
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

                        {/* Additional Images */}
                        <div className="flex flex-col space-y-2">
                            <Label className="font-bold text-sm tracking-wide">ADDITIONAL IMAGES (For Gallery)</Label>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                {/* Existing Images */}
                                {existingAdditionalImages.map((url, index) => (
                                    <div key={`existing-${index}`} className="relative group aspect-square border rounded-lg overflow-hidden bg-white">
                                        <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingAdditionalImage(index)}
                                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* New Previews */}
                                {additionalPreviews.map((preview, index) => (
                                    <div key={`new-${index}`} className="relative group aspect-square border rounded-lg overflow-hidden bg-white">
                                        <img src={preview} alt={`New ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeAdditionalFile(index)}
                                            className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                {/* Upload Button */}
                                <div
                                    onClick={() => additionalFileInputRef.current?.click()}
                                    className="aspect-square bg-white border border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
                                >
                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground mt-1">Add Image</span>
                                </div>
                            </div>

                            <input
                                ref={additionalFileInputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.webp"
                                onChange={handleAdditionalImagesChange}
                                className="hidden"
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload multiple images to verify different angles.
                            </p>
                        </div>

                    </div>

                </form>
            </div>
        </AdminLayout>
    );
};

export default AddEditShoe;

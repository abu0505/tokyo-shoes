import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Package, MapPin, Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getRandomColor } from '@/lib/colors';
import Header from '@/components/Header';
import { Database } from '@/types/database';

type Address = Database['public']['Tables']['saved_addresses']['Row'];

const profileSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters').optional().or(z.literal('')),
    email: z.string().email(),
});

const addressSchema = z.object({
    address: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    postal_code: z.string().min(4, 'Postal code is required'),
    phone: z.string().min(10, 'Phone number is required'),
    country: z.string().default('USA'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

const Profile = () => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab] = useState<'account' | 'orders' | 'addresses'>('account');

    useEffect(() => {
        if (!isAuthLoading && !user) {
            navigate('/auth');
        }
    }, [user, isAuthLoading, navigate]);

    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const { data: addresses, isLoading: isAddressesLoading } = useQuery({
        queryKey: ['saved_addresses', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from('saved_addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('last_used', { ascending: false });

            if (error) throw error;
            return data as Address[];
        },
        enabled: !!user?.id,
    });

    const defaultAddress = addresses?.[0];

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.user_metadata?.first_name || '',
            last_name: user?.user_metadata?.last_name || '',
            phone: '',
            email: user?.email || '',
        },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            address: '',
            city: '',
            postal_code: '',
            phone: '',
            country: 'USA',
        }
    });

    useEffect(() => {
        if (profile) {
            form.reset({
                first_name: profile.first_name || user?.user_metadata?.first_name || '',
                last_name: profile.last_name || user?.user_metadata?.last_name || '',
                phone: profile.phone || '',
                email: user?.email || '',
            });
        }
    }, [profile, user, form]);

    useEffect(() => {
        if (addresses && addresses.length > 0) {
            const defaultAddr = addresses[0];
            addressForm.reset({
                address: defaultAddr.address,
                city: defaultAddr.city,
                postal_code: defaultAddr.postal_code,
                phone: defaultAddr.phone,
                country: 'USA',
            });
        }
    }, [addresses, addressForm]);

    const updateProfileMutation = useMutation({
        mutationFn: async (values: ProfileFormValues) => {
            if (!user?.id) throw new Error('No user');

            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    phone: values.phone,
                })
                .eq('id', user.id);

            if (error) throw error;
            return values;
        },
        onSuccess: () => {
            toast.success('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
        },
        onError: (error) => {
            toast.error(`Error updating profile: ${error.message}`);
        },
    });

    const updateAddressMutation = useMutation({
        mutationFn: async (values: AddressFormValues) => {
            if (!user?.id) throw new Error('No user');

            // Check if address exists
            const existingAddress = addresses?.[0];

            if (existingAddress) {
                const { error } = await supabase
                    .from('saved_addresses')
                    .update({
                        address: values.address,
                        city: values.city,
                        postal_code: values.postal_code,
                        phone: values.phone,
                    })
                    .eq('id', existingAddress.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('saved_addresses')
                    .insert({
                        user_id: user.id,
                        address: values.address,
                        city: values.city,
                        postal_code: values.postal_code,
                        phone: values.phone,
                        is_default: true,
                    });
                if (error) throw error;
            }
            return values;
        },
        onSuccess: () => {
            toast.success('Shipping address updated successfully');
            queryClient.invalidateQueries({ queryKey: ['saved_addresses', user?.id] });
        },
        onError: (error) => {
            toast.error(`Error updating address: ${error.message}`);
        },
    });

    if (isAuthLoading || isLoading || isAddressesLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gray-200/50">
            <Helmet>
                <title>My Profile | Tokyo Shoes</title>
            </Helmet>
            <Header />
            <div className="container mx-auto py-12 px-4 md:px-6">
                <div className="max-w-4xl mx-auto">
                    {activeTab === 'account' && (
                        <div className="space-y-8">
                            {/* Centered Avatar and Name */}
                            <div className="flex flex-col items-center justify-center mb-10">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                                        <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} className='object-cover' />
                                        <AvatarFallback className={`text-4xl text-white ${getRandomColor(user?.email || '')}`}>
                                            {getInitials(profile?.first_name ? `${profile.first_name} ${profile.last_name}` : (user?.user_metadata?.full_name || user?.email))}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <h2 className="text-3xl font-black mt-6 tracking-tight text-foreground uppercase">
                                    {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : (user?.user_metadata?.full_name || 'Setup Your Profile')}
                                </h2>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest">MEMBER SINCE {new Date(user?.created_at || Date.now()).getFullYear()}</span>
                                </div>
                            </div>

                            <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                                <CardHeader className='border-b-2 border-black bg-gray-50'>
                                    <div className='flex justify-between items-center'>
                                        <div className='flex items-center gap-3'>
                                            <div className="w-2 h-6 bg-red-500" />
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">Personal Information</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <FormField
                                                    control={form.control}
                                                    name="first_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>First Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} disabled className="border-2 border-black rounded-none h-12 font-bold bg-gray-100 cursor-not-allowed opacity-70" placeholder="Enter first name" />
                                                            </FormControl>
                                                            <FormMessage className="text-red-500 font-bold italic" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="last_name"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Last Name</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} disabled className="border-2 border-black rounded-none h-12 font-bold bg-gray-100 cursor-not-allowed opacity-70" placeholder="Enter last name" />
                                                            </FormControl>
                                                            <FormMessage className="text-red-500 font-bold italic" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Email Address</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                                        <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                                                                        <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
                                                                    </svg>
                                                                </span>
                                                                <Input {...field} disabled className="border-2 border-black rounded-none h-12 font-bold bg-gray-100 pl-12 cursor-not-allowed opacity-70" />
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-black">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                                        <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
                                                                    </svg>
                                                                </span>
                                                                <Input {...field} className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500 transition-colors pl-12" placeholder="+12 345 678 910" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage className="text-red-500 font-bold italic" />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={updateProfileMutation.isPending}
                                                    className="bg-black hover:bg-gray-800 text-white font-black uppercase tracking-widest h-14 px-10 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                >
                                                    {updateProfileMutation.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                                                    Save Changes
                                                </Button>
                                            </div>

                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            {/* Shipping Address - Edit Form */}
                            <Card className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden">
                                <CardHeader className='border-b-2 border-black bg-gray-50'>
                                    <div className='flex justify-between items-center'>
                                        <div className='flex items-center gap-3'>
                                            <div className="w-2 h-6 bg-red-500" />
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">Shipping Address</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Form {...addressForm}>
                                        <form onSubmit={addressForm.handleSubmit((data) => updateAddressMutation.mutate(data))} className="space-y-8">
                                            <div>
                                                <FormField
                                                    control={addressForm.control}
                                                    name="address"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Street Address</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500 transition-colors" placeholder="123 Street Name" />
                                                            </FormControl>
                                                            <FormMessage className="text-red-500 font-bold italic" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className='grid grid-cols-2 gap-8'>
                                                <FormField
                                                    control={addressForm.control}
                                                    name="city"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>City</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500 transition-colors" placeholder="City" />
                                                            </FormControl>
                                                            <FormMessage className="text-red-500 font-bold italic" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={addressForm.control}
                                                    name="postal_code"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Postal Code</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500 transition-colors" placeholder="ZIP Code" />
                                                            </FormControl>
                                                            <FormMessage className="text-red-500 font-bold italic" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={addressForm.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='text-xs font-black text-black uppercase tracking-widest'>Phone</FormLabel>
                                                        <FormControl>
                                                            <Input {...field} className="border-2 border-black rounded-none h-12 font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-red-500 transition-colors" placeholder="Phone for delivery" />
                                                        </FormControl>
                                                        <FormMessage className="text-red-500 font-bold italic" />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex justify-end pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={updateAddressMutation.isPending}
                                                    className="bg-black hover:bg-gray-800 text-white font-black uppercase tracking-widest h-14 px-10 rounded-none border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                                >
                                                    {updateAddressMutation.isPending && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                                                    Update Address
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="flex flex-col items-center justify-center min-h-[500px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                            <div className="h-20 w-20 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center mb-6">
                                <Package className="h-10 w-10 text-black" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-black">Order History</h3>
                            <p className="text-gray-600 font-bold max-w-sm mb-10 text-sm leading-relaxed">
                                View your past orders and check their status. You can track your shipments here.
                            </p>
                            <Button
                                onClick={() => navigate('/order-history')}
                                className="bg-black text-white font-black uppercase tracking-widest h-14 px-12 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:bg-gray-800"
                            >
                                View My Orders
                            </Button>
                        </div>
                    )}

                    {activeTab === 'addresses' && (
                        <div className="flex flex-col items-center justify-center min-h-[500px] bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                            <div className="h-20 w-20 bg-gray-100 border-2 border-black rounded-full flex items-center justify-center mb-6">
                                <MapPin className="h-10 w-10 text-black" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-black">Manage Addresses</h3>
                            <p className="text-gray-600 font-bold max-w-sm text-sm leading-relaxed">
                                Save your shipping and billing addresses for a faster checkout experience.
                            </p>
                            <div className="mt-10 inline-block px-8 py-3 bg-red-500 text-white text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                                Coming Soon
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper component for Chevron
const ChevronDown = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
)

export default Profile;

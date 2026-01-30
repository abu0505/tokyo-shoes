
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw, X, ArrowRight, CalendarIcon, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema
const formSchema = z.object({
    name: z.string().optional(),
    code: z.string().min(3, "Code must be at least 3 characters").regex(/^[A-Z0-9]+$/, "Code must be alphanumeric and uppercase"),
    discount_type: z.enum(["percentage", "fixed_amount"]),
    discount_value: z.coerce.number().min(0, "Value must be 0 or greater"),
    active_dates: z.boolean().default(false), // Logic toggle for advanced settings
    starts_at: z.date().optional().nullable(),
    expires_at: z.date().optional().nullable(),
    usage_limit_total: z.coerce.number().min(1, "Usage limit must be at least 1").optional().nullable(),
}).refine(data => {
    if (data.discount_type === 'percentage' && data.discount_value > 100) {
        return false;
    }
    return true;
}, {
    message: "Percentage cannot be greater than 100",
    path: ["discount_value"]
}).refine(data => {
    if (data.starts_at && data.expires_at) {
        return data.starts_at < data.expires_at;
    }
    return true;
}, {
    message: "Expiry date must be after start date",
    path: ["expires_at"]
});

interface CreateCouponModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CreateCouponModal = ({ open, onOpenChange }: CreateCouponModalProps) => {
    const queryClient = useQueryClient();
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            code: "",
            discount_type: "percentage",
            discount_value: 0,
            active_dates: false,
            starts_at: undefined,
            expires_at: undefined,
            usage_limit_total: undefined,
        },
    });

    // Reset form when modal opens to ensure clean state and defaults
    useEffect(() => {
        if (open) {
            form.reset({
                name: "",
                code: "",
                discount_type: "percentage",
                discount_value: 0,
                active_dates: false,
                starts_at: undefined,
                expires_at: undefined,
                usage_limit_total: undefined,
            });
            setAdvancedOpen(false);
        }
    }, [open, form]);

    const watchCode = form.watch("code");
    const watchType = form.watch("discount_type");
    const watchValue = form.watch("discount_value");

    const generateCode = () => {
        const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
        form.setValue("code", randomString);
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Unpack advanced settings
            const starts_at = advancedOpen && values.starts_at ? values.starts_at.toISOString() : new Date().toISOString();
            // Default to now if not set, but user flow implies "Schedule start/end dates". If disabled, maybe start now? 
            // Actually, "Active Status" isn't in the new UI explicitly, but "Schedule" is advanced. 
            // We'll assume if Advanced is off, it's immediately active indefinite.

            const payload = {
                code: values.code,
                name: values.name || null,
                discount_type: values.discount_type,
                discount_value: values.discount_value,
                starts_at: starts_at,
                expires_at: advancedOpen && values.expires_at ? values.expires_at.toISOString() : null,
                usage_limit_total: advancedOpen ? (values.usage_limit_total || null) : null,
                is_active: true // Default to true as per "Publish" action implies
            };

            const { error } = await supabase.from('coupons').insert(payload);

            if (error) {
                if (error.code === '23505') {
                    form.setError('code', { message: 'Coupon code already exists' });
                    return;
                }
                throw error;
            }

            toast.success('Coupon published successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error('Error creating coupon:', error);
            toast.error('Failed to create coupon');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[900px] p-0 overflow-hidden bg-white gap-0 border-none shadow-2xl sm:rounded-3xl">
                <div className="flex flex-col md:flex-row min-h-[600px] h-[85vh]">

                    {/* LEFT SIDE: Live Preview */}
                    <div className="md:w-5/12 bg-[url('/grid-pattern.png')] bg-gray-200/50 p-8 flex flex-col items-center justify-center relative border-r border-border/50 h-full">
                        <div className="absolute top-6 left-6 text-xs font-bold text-muted-foreground tracking-widest uppercase opacity-50">
                            Live Preview
                        </div>

                        {/* Coupon Card Preview */}
                        <div className="w-full max-w-[280px] bg-white rounded-3xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 relative">


                            {/* Top Section */}
                            <div className="bg-white p-6 pb-8 relative text-center">
                                <div className="flex justify-between items-center w-full mb-6">
                                    <span className="font-bold text-xs tracking-widest uppercase">Tokyo Shoes</span>
                                    <Ticket className="h-5 w-5 text-black" />
                                </div>

                                {/* Dynamic Content */}
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Discount</p>
                                    <h2 className="text-5xl font-black text-red-500 tracking-tighter">
                                        {watchType === 'percentage' ? `${watchValue || 0}%` : `₹${watchValue || 0}`}
                                    </h2>
                                    <p className="text-xs font-medium text-gray-400">Valid on Sneakers</p>
                                </div>

                                {/* Decorative Side Cuts */}
                                <div className="absolute -left-2 top-[70%] w-4 h-4 bg-gray-200/50 rounded-full"></div>
                                <div className="absolute -right-2 top-[70%] w-4 h-4 bg-gray-200/50 rounded-full"></div>
                            </div>

                            {/* Bottom Section (Dark) */}
                            <div className="bg-[#1a1a1a] p-6 pt-8 text-center text-white relative">
                                {/* Dashed Line Divider */}
                                <div className="absolute top-0 left-4 right-4 border-t-2 border-dashed border-gray-600/50"></div>
                                <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-300 rounded-full"></div>

                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Coupon Code</p>
                                <p className="text-2xl font-mono font-bold tracking-widest mb-4 uppercase">
                                    {watchCode || 'SUMMER24'}
                                </p>

                                {/* Barcode Visual */}
                                <div className="h-8 w-3/4 mx-auto bg-transparent flex justify-between items-end opacity-50">
                                    {[...Array(20)].map((_, i) => (
                                        <div key={i} className="bg-white" style={{
                                            width: Math.random() > 0.5 ? '2px' : '4px',
                                            height: `${Math.random() * 100}%`
                                        }}></div>
                                    ))}
                                </div>
                                <p className="text-[8px] text-gray-600 mt-1 font-mono">2393-2949-3910</p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Form */}
                    <div className="md:w-7/12 p-8 bg-white relative h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">


                        <div className="mb-4">
                            <h2 className="text-2xl font-black tracking-tight mb-1">Create New Coupon</h2>
                            <p className="text-sm text-gray-500">Configure details for your promotional campaign.</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                {/* Internal Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-700">Internal Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. Summer Flash Sale 2024"
                                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-all py-6 rounded-lg"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            <p className="text-[10px] text-gray-400">Visible only to admins.</p>
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Coupon Code */}
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-700">Coupon Code</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            placeholder="SUMMER24"
                                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all py-6 rounded-lg pr-10 font-mono uppercase"
                                                            {...field}
                                                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={generateCode}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Discount Value with Toggle */}
                                    <FormField
                                        control={form.control}
                                        name="discount_value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-wider text-gray-700">Discount Value</FormLabel>
                                                <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden p-1 gap-2">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            onKeyDown={(e) => {
                                                                if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className="border-none shadow-none bg-transparent focus-visible:ring-0 flex-1 py-4 font-bold text-lg"
                                                            placeholder="0"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <div className="flex bg-white rounded-md border border-gray-200 shadow-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => form.setValue('discount_type', 'percentage')}
                                                            className={`w-10 flex items-center justify-center text-sm font-bold transition-colors ${watchType === 'percentage' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'} rounded-l-md`}
                                                        >
                                                            %
                                                        </button>
                                                        <div className="w-[1px] bg-gray-200"></div>
                                                        <button
                                                            type="button"
                                                            onClick={() => form.setValue('discount_type', 'fixed_amount')}
                                                            className={`w-10 flex items-center justify-center text-sm font-bold transition-colors ${watchType === 'fixed_amount' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'} rounded-r-md`}
                                                        >
                                                            ₹
                                                        </button>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Advanced Settings Toggle Section */}
                                <div className="border border-gray-100 bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900">Advanced Settings</h4>
                                            <p className="text-xs text-gray-500">Schedule start/end dates and usage limits</p>
                                        </div>
                                        <Switch
                                            checked={advancedOpen}
                                            onCheckedChange={setAdvancedOpen}
                                        />
                                    </div>

                                    {advancedOpen && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                            <FormField
                                                control={form.control}
                                                name="starts_at"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs">Start Date</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full pl-3 text-left font-normal h-10 border-gray-200 bg-gray-50/50",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "PPP")
                                                                        ) : (
                                                                            <span>Pick a date</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value || undefined}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="expires_at"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel className="text-xs">End Date</FormLabel>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-full pl-3 text-left font-normal h-10 border-gray-200 bg-gray-50/50",
                                                                            !field.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {field.value ? (
                                                                            format(field.value, "PPP")
                                                                        ) : (
                                                                            <span>Pick a date</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={field.value || undefined}
                                                                    onSelect={field.onChange}
                                                                    disabled={(date) =>
                                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                                    }
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="usage_limit_total"
                                                render={({ field }) => (
                                                    <FormItem className="col-span-2">
                                                        <FormLabel className="text-xs">Usage Limit</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                                                                        e.preventDefault();
                                                                    }
                                                                }}
                                                                placeholder="∞"
                                                                className="text-xs"
                                                                {...field}
                                                                value={field.value ?? ''}
                                                                onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>


                                <div className="flex justify-between items-center pt-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="text-gray-500 hover:text-white font-bold"
                                        onClick={() => onOpenChange(false)}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-black hover:bg-gray-900 text-white font-bold h-12 px-8 rounded-lg shadow-xl shadow-gray-200"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        PUBLISH COUPON
                                        {form.formState.isSubmitting ? (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CreateCouponModal;

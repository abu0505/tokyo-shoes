import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, User, MessageSquare, Ruler } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'),
  size: z.string().optional(),
  message: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface OrderInquiryModalProps {
  shoeId: string;
  shoeName: string;
  sizes: number[];
  trigger?: React.ReactNode;
}

const OrderInquiryModal = ({ shoeId, shoeName, sizes, trigger }: OrderInquiryModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('order_inquiries').insert([
        {
          name: data.name,
          phone: data.phone,
          shoe_id: shoeId,
          size: data.size ? parseInt(data.size) : null,
          message: data.message || null,
        },
      ]);

      if (error) throw error;

      toast.success('Your inquiry has been sent! We\'ll contact you soon.');
      reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Error submitting inquiry:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-2 border-foreground font-bold hover:bg-foreground hover:text-background"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            INQUIRE NOW
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md border-2 border-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Order Inquiry</DialogTitle>
          <p className="text-muted-foreground text-sm">
            Interested in <span className="font-bold text-foreground">{shoeName}</span>?
            Fill out this form and we'll contact you shortly.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="inquiry-name" className="font-bold text-sm tracking-wide">
              FULL NAME *
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="inquiry-name"
                placeholder="Enter your name"
                className="pl-10 border-2 border-foreground focus:border-accent"
                {...register('name')}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="inquiry-phone" className="font-bold text-sm tracking-wide">
              PHONE NUMBER *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="inquiry-phone"
                placeholder="+91 98765 43210"
                className="pl-10 border-2 border-foreground focus:border-accent"
                {...register('phone')}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label className="font-bold text-sm tracking-wide">
              PREFERRED SIZE
            </Label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={watch('size') || ''}
                onValueChange={(value) => setValue('size', value)}
              >
                <SelectTrigger className="pl-10 border-2 border-foreground">
                  <SelectValue placeholder="Select a size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      EU {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="inquiry-message" className="font-bold text-sm tracking-wide">
              MESSAGE (OPTIONAL)
            </Label>
            <Textarea
              id="inquiry-message"
              placeholder="Any additional details or questions..."
              className="border-2 border-foreground focus:border-accent resize-none"
              rows={3}
              {...register('message')}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground font-bold h-12"
          >
            {isSubmitting ? 'Sending...' : 'SEND INQUIRY'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderInquiryModal;

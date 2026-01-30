
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CouponType = 'percentage' | 'fixed_amount';

export interface ValidatedCoupon {
    code: string;
    discountType: CouponType;
    discountValue: number;
    discountAmount: number; // Calculated amount based on current subtotal
}

export const useCoupon = () => {
    const [isValidating, setIsValidating] = useState(false);

    const validateCoupon = async (code: string, subtotal: number): Promise<ValidatedCoupon | null> => {
        if (!code || !code.trim()) return null;

        setIsValidating(true);
        try {
            // Normalize code
            const normalizedCode = code.trim().toUpperCase();

            // Fetch coupon from DB
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', normalizedCode)
                .maybeSingle();

            if (error) {
                console.error('Error fetching coupon:', error);
                toast.error('Failed to validate coupon');
                return null;
            }

            if (!coupon) {
                toast.error('Invalid coupon code');
                return null;
            }

            // Check active status
            if (coupon.is_active === false) {
                toast.error('This coupon is no longer active');
                return null;
            }

            const now = new Date();

            // Check start date
            if (coupon.starts_at && new Date(coupon.starts_at) > now) {
                toast.error('This coupon is not yet active');
                return null;
            }

            // Check expiry date
            if (coupon.expires_at && new Date(coupon.expires_at) < now) {
                toast.error('This coupon has expired');
                return null;
            }

            // Check usage limit
            if (coupon.usage_limit_total !== null && (coupon.times_used || 0) >= coupon.usage_limit_total) {
                toast.error('This coupon usage limit has been reached');
                return null;
            }

            // Check min spend amount
            if (coupon.min_spend_amount !== null && subtotal < coupon.min_spend_amount) {
                toast.error(`Minimum spend of ₹${coupon.min_spend_amount} required`);
                return null;
            }

            // Calculate discount amount
            let discountAmount = 0;
            if (coupon.discount_type === 'percentage') {
                discountAmount = (subtotal * coupon.discount_value) / 100;
            } else {
                discountAmount = coupon.discount_value;
            }

            // Ensure discount doesn't exceed subtotal
            if (discountAmount > subtotal) {
                discountAmount = subtotal;
            }

            return {
                code: coupon.code,
                discountType: coupon.discount_type as CouponType,
                discountValue: coupon.discount_value,
                discountAmount: discountAmount
            };

        } catch (err) {
            console.error('Unexpected error validating coupon:', err);
            toast.error('Something went wrong validating the coupon');
            return null;
        } finally {
            setIsValidating(false);
        }
    };

    return {
        validateCoupon,
        isValidating
    };
};

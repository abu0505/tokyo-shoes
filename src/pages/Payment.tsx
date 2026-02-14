import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Lock, ChevronRight, CreditCard, HelpCircle, Truck } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextLoader from "@/components/TextLoader";

interface LocationState {
    shippingInfo: {
        email: string;
        emailNewsletter: boolean;
        firstName: string;
        lastName: string;
        address: string;
        apartment: string;
        city: string;
        postalCode: string;
        phone: string;
        shippingMethod: "standard" | "express";
    };
    couponDetails: {
        code: string;
        type: 'percentage' | 'fixed_amount';
        value: number;
    } | null;
}

type PaymentMethod = "card" | "cod";

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { cartItems, subtotal, clearCart, removeCoupon } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get shipping info from location state
    const locationState = location.state as LocationState | null;
    const shippingInfo = locationState?.shippingInfo;
    const couponDetails = locationState?.couponDetails;

    // Payment form state
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [cardName, setCardName] = useState("");
    const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true);
    const [savePaymentMethod, setSavePaymentMethod] = useState(false);

    // Calculate totals
    const shippingCost = shippingInfo?.shippingMethod === "express" ? 15 : 0;
    // Tax removed

    // Discount logic
    const discountAmount = couponDetails ? (
        couponDetails.type === 'percentage'
            ? (subtotal * couponDetails.value) / 100
            : Math.min(couponDetails.value, subtotal)
    ) : 0;

    const total = subtotal + shippingCost - discountAmount;

    // Redirect if no shipping info or empty cart
    useEffect(() => {
        if (!shippingInfo && cartItems.length > 0) {
            toast.error("Please complete shipping information first");
            navigate("/checkout");
        } else if (cartItems.length === 0) {
            navigate("/cart");
        }
    }, [shippingInfo, cartItems.length, navigate]);

    // Handle card number change with validation
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Check for alphabets
        if (/[a-zA-Z]/.test(value)) {
            toast.error("Card number must contain only numbers");
            return;
        }

        // Allow only numbers and spaces
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || "";
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            setCardNumber(parts.join(" "));
        } else {
            setCardNumber(value);
        }
    };

    // Format expiry date
    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

        // Prevent entering a month greater than 12
        if (v.length >= 2) {
            const month = parseInt(v.substring(0, 2));
            if (month > 12 || month === 0) {
                toast.error("Please enter a valid month (01-12)");
                return v.substring(0, 1);
            }
        }

        if (v.length >= 2) {
            return v.substring(0, 2) + " / " + v.substring(2, 4);
        }
        return v;
    };

    // Handle name change with validation
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Check for numbers
        if (/\d/.test(value)) {
            toast.error("Name must contain only alphabets");
            return;
        }

        setCardName(value);
    };

    // Luhn algorithm to validate card number
    const isValidLuhn = (number: string): boolean => {
        const digits = number.replace(/\s/g, "").split("").reverse().map(Number);
        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            let digit = digits[i];
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    };

    // Get card brand from number
    const getCardBrand = (number: string) => {
        const cleaned = number.replace(/\s/g, "");
        if (cleaned.startsWith("4")) return "Visa";
        if (/^5[1-5]/.test(cleaned)) return "Mastercard";
        if (/^3[47]/.test(cleaned)) return "Amex";
        if (/^6(?:011|5)/.test(cleaned)) return "Discover";
        if (/^(?:2131|1800|35)/.test(cleaned)) return "JCB";
        return "Card";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login to complete your order");
            navigate("/auth");
            return;
        }

        if (!shippingInfo) {
            toast.error("Please complete shipping information first");
            navigate("/checkout");
            return;
        }

        if (cartItems.length === 0) {
            toast.error("Your cart is empty");
            navigate("/cart");
            return;
        }

        if (paymentMethod === "card") {
            if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
                toast.error("Please fill in all card details");
                return;
            }
            const cleanedCardNumber = cardNumber.replace(/\s/g, "");
            if (cleanedCardNumber.length < 16) {
                toast.error("Please enter a valid 16-digit card number");
                return;
            }

            // Luhn algorithm check
            if (!isValidLuhn(cleanedCardNumber)) {
                toast.error("Invalid card number. Please check and try again.");
                return;
            }

            // CVV length validation
            if (cardCvv.length < 3) {
                toast.error("CVV must be at least 3 digits");
                return;
            }

            // Validate Expiry Date
            const [expMonth, expYear] = cardExpiry.split(" / ");
            if (!expMonth || !expYear) {
                toast.error("Invalid expiration date format");
                return;
            }

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            const currentYear = parseInt(currentDate.getFullYear().toString().slice(-2)); // Last 2 digits
            const inputMonth = parseInt(expMonth);
            const inputYear = parseInt(expYear);

            if (inputYear < currentYear || (inputYear === currentYear && inputMonth < currentMonth)) {
                toast.error("Card has expired");
                return;
            }

            if (inputMonth < 1 || inputMonth > 12) {
                toast.error("Invalid expiration month");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            // Prepare payload for RPC
            const rpcPayload = {
                p_user_id: user.id,
                p_payment_method: paymentMethod,
                p_shipping_address: {
                    email: shippingInfo.email,
                    firstName: shippingInfo.firstName,
                    lastName: shippingInfo.lastName,
                    address: shippingInfo.address,
                    apartment: shippingInfo.apartment || null,
                    city: shippingInfo.city,
                    postalCode: shippingInfo.postalCode,
                    phone: shippingInfo.phone,
                    shippingMethod: shippingInfo.shippingMethod,
                    emailNewsletter: shippingInfo.emailNewsletter,
                    // shippingCost is passed as separate arg, but keeping it here for consistency if needed in future
                },
                p_items: cartItems.map(item => ({
                    shoeId: item.shoeId,
                    size: item.size,
                    quantity: item.quantity,
                    color: item.color || "Default",
                    price: item.price
                })),
                p_subtotal: subtotal,
                p_shipping_cost: shippingCost,
                p_total: total,
                p_discount_code: couponDetails?.code || null
            };

            // Call the RPC function
            const { data: orderId, error: rpcError } = await supabase.rpc('process_order', rpcPayload);

            if (rpcError) throw rpcError;

            // Save payment method if requested
            if (savePaymentMethod && paymentMethod === "card") {
                const cardLastFour = cardNumber.replace(/\s/g, "").slice(-4);
                const cardBrand = getCardBrand(cardNumber);

                await supabase.from("saved_payment_methods").insert({
                    user_id: user.id,
                    payment_type: "card",
                    card_last_four: cardLastFour,
                    card_brand: cardBrand,
                    card_expiry: cardExpiry.replace(/\s/g, ""),
                    cardholder_name: cardName,
                    is_default: true,
                });
            }

            // Save address for future use or update last_used if exists
            try {
                // Check if address already exists (check address, city, postal_code match)
                const { data: existingAddresses } = await supabase
                    .from("saved_addresses")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("address", shippingInfo.address)
                    .eq("city", shippingInfo.city)
                    .eq("postal_code", shippingInfo.postalCode)
                    .limit(1);

                if (existingAddresses && existingAddresses.length > 0) {
                    // Update last_used timestamp
                    await supabase
                        .from("saved_addresses")
                        .update({
                            last_used: new Date().toISOString(),
                            phone: shippingInfo.phone,
                            postal_code: shippingInfo.postalCode
                        })
                        .eq("id", existingAddresses[0].id);
                } else {
                    // Insert new address
                    await supabase.from("saved_addresses").insert({
                        user_id: user.id,
                        address: shippingInfo.address,
                        apartment: shippingInfo.apartment || null,
                        city: shippingInfo.city,
                        postal_code: shippingInfo.postalCode,
                        phone: shippingInfo.phone,
                        is_default: false,
                        last_used: new Date().toISOString(),
                    });
                }
            } catch (addressError) {
                // Don't block order completion if address saving fails
                console.error("Error saving address:", addressError);
            }

            // Clear the coupon explicitly
            removeCoupon();

            // Clear the cart
            await clearCart();

            toast.success("Order placed successfully! 🎉");
            navigate("/");
        } catch (error: any) {
            console.error("Error creating order:", error);
            // Handle specific RPC errors (e.g. stock, coupon)
            const errorMessage = error.message || "Failed to place order. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state if no shipping info yet
    if (!shippingInfo) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-12 text-center">
                    <div className="flex justify-center">
                        <TextLoader text="Redirecting" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Header />

            <main className="flex-grow">
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
                        {/* Left Side - Payment Form */}
                        <div className="flex-1 bg-secondary/40 px-4 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
                            <div className="max-w-xl mx-auto lg:ml-auto">
                                {/* Breadcrumb */}
                                <nav className="flex items-center gap-2 text-sm mb-8 flex-wrap">
                                    <Link to="/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                                        Cart
                                    </Link>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <Link to="/checkout" state={{ couponDetails }} className="text-muted-foreground hover:text-foreground transition-colors">
                                        Information
                                    </Link>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-accent font-bold">Payment</span>
                                </nav>

                                {/* Payment Method Selection */}
                                <section className="mb-8">
                                    <h2 className="text-xl font-black tracking-tight mb-6">Payment Method</h2>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {/* Card Option */}
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("card")}
                                            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === "card"
                                                ? "border-accent bg-accent/5"
                                                : "border-border bg-background hover:border-accent/50"
                                                }`}
                                        >
                                            {paymentMethod === "card" && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={`w-10 h-7 rounded flex items-center justify-center mb-2 ${paymentMethod === "card" ? "bg-accent" : "bg-muted"
                                                }`}>
                                                <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-white" : "text-muted-foreground"}`} />
                                            </div>
                                            <span className="text-sm font-bold">Card</span>
                                        </button>

                                        {/* COD Option */}
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cod")}
                                            className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === "cod"
                                                ? "border-accent bg-accent/5"
                                                : "border-border bg-background hover:border-accent/50"
                                                }`}
                                        >
                                            {paymentMethod === "cod" && (
                                                <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className={`w-10 h-7 rounded flex items-center justify-center mb-2 ${paymentMethod === "cod" ? "bg-accent" : "bg-muted"
                                                }`}>
                                                <Truck className={`w-5 h-5 ${paymentMethod === "cod" ? "text-white" : "text-muted-foreground"}`} />
                                            </div>
                                            <span className="text-sm font-bold">COD</span>
                                        </button>
                                    </div>

                                    {/* Card Form */}
                                    {paymentMethod === "card" && (
                                        <div className="space-y-4">
                                            {/* Card Number */}
                                            <div>
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                                                    Card Number
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        type="text"
                                                        placeholder="0000 0000 0000 0000"
                                                        value={cardNumber}
                                                        onChange={handleCardNumberChange}
                                                        maxLength={19}
                                                        className="rounded-2xl py-6 px-5 bg-background border-border focus-visible:ring-accent pr-12"
                                                        required
                                                    />
                                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                </div>
                                            </div>

                                            {/* Expiry and CVV */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                                                        Expiration (MM/YY)
                                                    </Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="MM / YY"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                                        maxLength={7}
                                                        className="rounded-2xl py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                                                        Security Code
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="text"
                                                            placeholder="CVV"
                                                            value={cardCvv}
                                                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                                            maxLength={3}
                                                            className="rounded-2xl py-6 px-5 bg-background border-border focus-visible:ring-accent pr-12"
                                                            required
                                                        />
                                                        <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Name on Card */}
                                            <div>
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 block">
                                                    Name on Card
                                                </Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. John Doe"
                                                    value={cardName}
                                                    onChange={handleNameChange}
                                                    className="rounded-2xl py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* COD Notice */}
                                    {paymentMethod === "cod" && (
                                        <div className="bg-background rounded-2xl p-6 border border-border text-center">
                                            <div className="flex justify-center mb-3">
                                                <Truck className="w-8 h-8 text-accent" />
                                            </div>
                                            <p className="text-foreground font-bold mb-2">
                                                Cash on Delivery
                                            </p>
                                            <p className="text-muted-foreground text-sm mb-1">
                                                Pay with cash when your order is delivered to your doorstep.
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Please keep exact change ready for a smooth delivery experience.
                                            </p>
                                        </div>
                                    )}
                                </section>

                                {/* Billing Address Checkbox */}
                                <section className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="billingAddress"
                                            checked={billingAddressSameAsShipping}
                                            onCheckedChange={(checked) => setBillingAddressSameAsShipping(!!checked)}
                                            className="rounded-full border-accent data-[state=checked]:bg-accent"
                                        />
                                        <Label htmlFor="billingAddress" className="text-sm font-medium cursor-pointer">
                                            Billing address is same as shipping
                                        </Label>
                                    </div>
                                </section>

                                {/* Save Payment Method Checkbox */}
                                {paymentMethod === "card" && (
                                    <section className="mb-8">
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="savePayment"
                                                checked={savePaymentMethod}
                                                onCheckedChange={(checked) => setSavePaymentMethod(!!checked)}
                                                className="rounded-full"
                                            />
                                            <Label htmlFor="savePayment" className="text-sm text-muted-foreground cursor-pointer">
                                                Save payment method for future purchases
                                            </Label>
                                        </div>
                                    </section>
                                )}

                                {/* Pay Button */}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-7 text-base font-black rounded-full bg-accent hover:bg-black text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    {isSubmitting ? <TextLoader text="Processing" className="text-accent-foreground" isWhite /> : paymentMethod === "cod" ? `PLACE ORDER ₹${total.toFixed(2)} →` : `PAY ₹${total.toFixed(2)} →`}
                                </Button>

                                {/* Security Badge */}
                                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                                    <Lock className="w-3 h-3" />
                                    <span>Payments are secure and encrypted</span>
                                </div>

                                {/* Return Link */}
                                <div className="mt-6 text-center">
                                    <Link
                                        to="/checkout"
                                        state={{ couponDetails }}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Return to information
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Order Summary (White Background) */}
                        <div className="lg:w-[450px] xl:w-[500px] bg-background border-l border-border px-4 md:px-8 lg:px-8 py-8 lg:py-12">
                            <div className="max-w-md mx-auto lg:mx-0 lg:sticky lg:top-28">
                                <h2 className="text-lg font-black tracking-tight mb-6 uppercase">ORDER SUMMARY</h2>
                                {/* Cart Items */}
                                <div className="space-y-4 mb-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="relative w-24 h-24 bg-secondary/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain rounded-xl p-1"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {item.brand && <p className="text-xs text-muted-foreground font-bold mb-1">{item.brand}</p>}
                                                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Size {item.size} {item.color && item.color !== "Default" ? `/ ${item.color}` : ""} | Quantity {item.quantity}
                                                </p>
                                            </div>
                                            <span className="font-bold text-sm flex-shrink-0">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>


                                {/* Price Breakdown */}
                                <div className="space-y-3 py-4 border-t border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className={`font-bold ${shippingCost === 0 ? "text-green-600" : ""}`}>
                                            {shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`}
                                        </span>
                                    </div>

                                    {couponDetails && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span className="font-bold">Discount ({couponDetails.code})</span>
                                            <span className="font-bold">-₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Total */}
                                <div className="flex justify-between items-end pt-4 border-t border-border">
                                    <span className="text-lg font-bold">Total</span>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground mr-2">INR</span>
                                        <span className="text-2xl font-black">₹{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Secure Checkout Badge */}
                                <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
                                    <Lock className="w-3 h-3" />
                                    <span className="font-bold">Secure Checkout</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default Payment;

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useCoupon } from "@/hooks/useCoupon";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Lock, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressSelector from "@/components/AddressSelector";
import type { SavedAddress } from "@/components/AddressCard";
import TextLoader from "@/components/TextLoader";

interface ShippingInfo {
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
}

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { cartItems, subtotal, couponDetails, setCouponDetails, removeCoupon } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [showAddressForm, setShowAddressForm] = useState(false);

    const [promoInput, setPromoInput] = useState("");
    const { validateCoupon, isValidating } = useCoupon();

    const [formData, setFormData] = useState<ShippingInfo>({
        email: user?.email || "",
        emailNewsletter: false,
        firstName: user?.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
        address: "",
        apartment: "",
        city: "",
        postalCode: "",
        phone: "",
        shippingMethod: "standard",
    });

    // Fetch saved addresses on mount
    useEffect(() => {
        const fetchSavedAddresses = async () => {
            if (!user) {
                setIsLoadingAddresses(false);
                setShowAddressForm(true);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("saved_addresses")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("last_used", { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setSavedAddresses(data as SavedAddress[]);
                    setShowAddressForm(false);
                } else {
                    setShowAddressForm(true);
                }
            } catch (error) {
                console.error("Error fetching saved addresses:", error);
                setShowAddressForm(true);
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchSavedAddresses();
    }, [user]);

    // Update form data when user loads (in case of direct navigation or refresh)
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || prev.email,
                firstName: user.user_metadata?.full_name?.split(' ')[0] || prev.firstName,
                lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || prev.lastName,
            }));
        }
    }, [user]);

    // Calculate totals
    const shippingCost = formData.shippingMethod === "express" ? 15 : (subtotal > 200 ? 0 : 0);
    // Tax removed

    // Discount logic
    const discountAmount = couponDetails ? (
        couponDetails.type === 'percentage'
            ? (subtotal * couponDetails.value) / 100
            : Math.min(couponDetails.value, subtotal)
    ) : 0;

    const total = subtotal + shippingCost - discountAmount;

    // Handle coupon application
    const handleApplyCoupon = async () => {
        if (!promoInput.trim()) return;

        const result = await validateCoupon(promoInput, subtotal);

        if (result) {
            setCouponDetails({
                code: result.code,
                type: result.discountType,
                value: result.discountValue
            });
            setPromoInput("");
            toast.success(`Coupon ${result.code} applied!`);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        toast.success("Coupon removed");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Postal code validation
        if (name === "postalCode") {
            // Check if value contains any non-numeric characters
            if (/[^0-9]/.test(value)) {
                toast.error("Postal code must contain only numbers");
                return;
            }
            // Limit to 6 digits
            if (value.length > 6) return;
        }

        // Phone validation
        if (name === "phone") {
            // Check if value contains any non-numeric characters
            if (/[^0-9]/.test(value)) {
                toast.error("Phone number must contain only numbers");
                return;
            }
            // Limit to 10 digits
            if (value.length > 10) return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle saved address selection
    const handleAddressSelect = (address: SavedAddress | null) => {
        if (address) {
            setFormData(prev => ({
                ...prev,
                address: address.address,
                apartment: address.apartment || "",
                city: address.city,
                postalCode: address.postal_code,
                phone: address.phone,
            }));
            setShowAddressForm(true);
        }
    };

    // Verify inventory on mount
    const [stockIssues, setStockIssues] = useState<Record<string, { type: 'sold_out' | 'insufficient', available: number, name: string }>>({});
    const [isValidatingStock, setIsValidatingStock] = useState(true);

    useEffect(() => {
        const validateInventory = async () => {
            if (cartItems.length === 0) {
                setIsValidatingStock(false);
                return;
            }

            setIsValidatingStock(true);
            const issues: Record<string, { type: 'sold_out' | 'insufficient', available: number, name: string }> = {};

            try {
                // Check stock for all items
                const promises = cartItems.map(async (item) => {
                    const { data } = await supabase
                        .from('shoe_sizes')
                        .select('quantity')
                        .eq('shoe_id', item.shoeId)
                        .eq('size', item.size)
                        .single();

                    const available = data ? data.quantity : 0;

                    if (available === 0) {
                        issues[item.id] = { type: 'sold_out', available: 0, name: item.name };
                    } else if (available < item.quantity) {
                        issues[item.id] = { type: 'insufficient', available, name: item.name };
                    }
                });

                await Promise.all(promises);

                if (Object.keys(issues).length > 0) {
                    setStockIssues(issues);
                    toast.error("Some items in your cart are no longer available or have insufficient stock.");
                } else {
                    setStockIssues({});
                }

            } catch (error) {
                console.error("Error validating inventory:", error);
            } finally {
                setIsValidatingStock(false);
            }
        };

        validateInventory();
    }, [cartItems]);

    // Handle "Add New Address" click
    const handleAddNewAddress = () => {
        setFormData(prev => ({
            ...prev,
            address: "",
            apartment: "",
            city: "",
            postalCode: "",
            phone: "",
        }));
        setShowAddressForm(true);
    };

    // Handle delete saved address
    const handleDeleteAddress = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const { error } = await supabase
                .from("saved_addresses")
                .delete()
                .eq("id", id);

            if (error) throw error;

            setSavedAddresses(prev => prev.filter(addr => addr.id !== id));
            toast.success("Address deleted successfully");
        } catch (error) {
            console.error("Error deleting address:", error);
            toast.error("Failed to delete address");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please login to complete your order");
            navigate("/auth");
            return;
        }

        if (cartItems.length === 0) {
            toast.error("Your cart is empty");
            navigate("/cart");
            return;
        }

        // Block if stock issues exist
        if (Object.keys(stockIssues).length > 0 || isValidatingStock) {
            toast.error("Please remove or update out-of-stock items before proceeding.");
            return;
        }

        // Validate required fields
        if (!formData.firstName || !formData.lastName || !formData.address ||
            !formData.city || !formData.postalCode || !formData.phone || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Navigate to payment page with shipping info
        navigate("/payment", {
            state: {
                shippingInfo: formData,
                couponDetails: couponDetails, // Pass from context
            },
        });
    };

    const OrderSummary = ({ className }: { className?: string }) => (
        <div className={className}>
            <h2 className="text-lg font-black tracking-tight mb-6 uppercase">ORDER SUMMARY</h2>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
                {cartItems.map((item) => {
                    const issue = stockIssues[item.id];
                    return (
                        <div key={item.id} className={`flex gap-4 ${issue ? 'opacity-70' : ''}`}>
                            <div className="relative w-24 h-24 bg-secondary/30 rounded-xl flex items-center justify-center flex-shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-contain rounded-xl p-1"
                                />
                                {issue && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                            {issue.type === 'sold_out' ? 'Sold Out' : `Only ${issue.available} Left`}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {item.brand && <p className="text-xs text-muted-foreground font-bold mb-1">{item.brand}</p>}
                                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                    Size {item.size} {item.color && item.color !== "Default" ? `/ ${item.color}` : ""} | Quantity {item.quantity}
                                </p>
                                {issue && (
                                    <p className="text-xs text-red-600 font-bold mt-1">
                                        {issue.type === 'sold_out'
                                            ? "Item is currently out of stock."
                                            : `Please reduce quantity to ${issue.available}.`}
                                    </p>
                                )}
                            </div>
                            <span className="font-bold text-sm flex-shrink-0">
                                ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Discount Code */}
            <div className="space-y-4 mb-6">
                {couponDetails ? (
                    <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-green-700">Coupon Applied</span>
                            <span className="text-xs text-green-600 font-mono">{couponDetails.code}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className="text-green-700 hover:text-green-800 hover:bg-green-500/20 h-8 w-8 p-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Discount code"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                            disabled={isValidating}
                            className="flex-1 rounded-full py-5 px-5 bg-secondary/30 border-border focus-visible:ring-accent"
                        />
                        <Button
                            type="button"
                            disabled={!promoInput.trim() || isValidating}
                            onClick={handleApplyCoupon}
                            className="rounded-full px-6 font-bold transition-all duration-200"
                        >
                            {isValidating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Apply"}
                        </Button>
                    </div>
                )}
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
    );

    // Redirect if cart is empty
    if (cartItems.length === 0 && !isSubmitting) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-black mb-4">YOUR CART IS EMPTY</h1>
                    <p className="text-muted-foreground mb-8">Add some items to your cart before checking out.</p>
                    <Link to="/#catalog">
                        <Button size="lg" className="font-bold">
                            START SHOPPING
                        </Button>
                    </Link>
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
                        {/* Left Side - Form (Darker Background) */}
                        <div className="flex-1 bg-secondary/80 px-3 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
                            <div className="max-w-xl mx-auto lg:ml-auto">
                                {/* Breadcrumb */}
                                <nav className="flex items-center gap-2 text-sm mb-8 flex-wrap">
                                    <Link to="/cart" className="text-accent font-bold hover:underline">
                                        Cart
                                    </Link>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-bold">Information</span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Payment</span>
                                </nav>

                                {/* Contact Information */}
                                <section className="mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-black tracking-tight">Contact Information</h2>
                                        {!user && (
                                            <Link to="/auth" className="text-accent text-sm font-bold hover:underline">
                                                Log in
                                            </Link>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder="Email address"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                            required
                                        />

                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="newsletter"
                                                checked={formData.emailNewsletter}
                                                onCheckedChange={(checked) =>
                                                    setFormData((prev) => ({ ...prev, emailNewsletter: !!checked }))
                                                }
                                                className="rounded-full"
                                            />
                                            <Label htmlFor="newsletter" className="text-sm text-muted-foreground cursor-pointer">
                                                Email me with news and offers
                                            </Label>
                                        </div>
                                    </div>
                                </section>

                                {/* Mobile Order Summary - Visible only on mobile, before Shipping Address */}
                                <OrderSummary className="lg:hidden mb-12 bg-background p-6 rounded-3xl border border-border shadow-sm" />

                                {/* Shipping Address */}
                                <section className="mb-8">
                                    <h2 className="text-xl font-black tracking-tight mb-4">Shipping Address</h2>

                                    {/* Loading State */}
                                    {isLoadingAddresses && (
                                        <div className="space-y-3">
                                            <div className="h-24 bg-secondary/50 rounded-2xl animate-pulse" />
                                            <div className="h-24 bg-secondary/50 rounded-2xl animate-pulse" />
                                        </div>
                                    )}

                                    {/* Address Selector (for returning users) */}
                                    {!isLoadingAddresses && savedAddresses.length > 0 && !showAddressForm && (
                                        <AddressSelector
                                            addresses={savedAddresses}
                                            onAddressSelect={handleAddressSelect}
                                            onAddNewClick={handleAddNewAddress}
                                            onDelete={handleDeleteAddress}
                                        />
                                    )}

                                    {/* Address Form (for new users or when adding new address) */}
                                    {!isLoadingAddresses && (savedAddresses.length === 0 || showAddressForm) && (
                                        <div className="space-y-4">
                                            {/* Show back button if user has saved addresses but chose to add new */}
                                            {savedAddresses.length > 0 && showAddressForm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddressForm(false)}
                                                    className="flex items-center gap-2 text-sm font-bold text-accent hover:underline mb-2"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Back to saved addresses
                                                </button>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input
                                                    type="text"
                                                    name="firstName"
                                                    placeholder="First name"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                                <Input
                                                    type="text"
                                                    name="lastName"
                                                    placeholder="Last name"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                            </div>

                                            <Input
                                                type="text"
                                                name="address"
                                                placeholder="Address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                required
                                            />

                                            <Input
                                                type="text"
                                                name="apartment"
                                                placeholder="Apartment, suite, etc. (optional)"
                                                value={formData.apartment}
                                                onChange={handleInputChange}
                                                className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                            />

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <Input
                                                    type="text"
                                                    name="city"
                                                    placeholder="City"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                                <Input
                                                    type="text"
                                                    name="postalCode"
                                                    placeholder="Postal code"
                                                    value={formData.postalCode}
                                                    onChange={handleInputChange}
                                                    maxLength={6}
                                                    className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Input
                                                    type="tel"
                                                    name="phone"
                                                    placeholder="Phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    maxLength={10}
                                                    className="rounded-full py-6 px-5 bg-background border-border focus-visible:ring-accent"
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground mt-2 ml-2">For delivery updates</p>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                {/* Shipping Method */}
                                <section className="mb-8">
                                    <h2 className="text-xl font-black tracking-tight mb-4">Shipping Method</h2>

                                    <RadioGroup
                                        value={formData.shippingMethod}
                                        onValueChange={(value: "standard" | "express") =>
                                            setFormData((prev) => ({ ...prev, shippingMethod: value }))
                                        }
                                        className="space-y-3"
                                    >
                                        <Label
                                            htmlFor="standard"
                                            className={`flex items-center justify-between p-4 bg-background rounded-full border border-border hover:border-accent/50 transition-colors cursor-pointer ${formData.shippingMethod === 'standard' ? 'border-accent' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="standard" id="standard" className="text-accent" />
                                                <div className="cursor-pointer">
                                                    <span className="font-bold block">
                                                        Standard Shipping
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">5-7 Business Days</p>
                                                </div>
                                            </div>
                                            <span className="font-bold text-green-600">Free</span>
                                        </Label>

                                        <Label
                                            htmlFor="express"
                                            className={`flex items-center justify-between p-4 bg-background rounded-full border border-border hover:border-accent/50 transition-colors cursor-pointer ${formData.shippingMethod === 'express' ? 'border-accent' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <RadioGroupItem value="express" id="express" className="text-accent" />
                                                <div className="cursor-pointer">
                                                    <span className="font-bold block">
                                                        Express Shipping
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">1-2 Business Days</p>
                                                </div>
                                            </div>
                                            <span className="font-bold">₹15.00</span>
                                        </Label>
                                    </RadioGroup>
                                </section>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                                    <Link
                                        to="/cart"
                                        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors order-2 sm:order-1"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Return to cart
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full sm:w-auto px-8 py-6 text-base font-black rounded-full bg-accent hover:bg-black text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 order-1 sm:order-2"
                                    >
                                        {isSubmitting ? <TextLoader text="Processing" className="text-accent-foreground" isWhite /> : "CONTINUE TO PAYMENT"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Order Summary (White Background) - Hidden on mobile */}
                        <div className="hidden lg:block lg:w-[450px] xl:w-[500px] bg-background border-l border-border px-3 md:px-8 lg:px-8 py-8 lg:py-12">
                            <OrderSummary className="max-w-md mx-auto lg:mx-0 lg:sticky lg:top-28" />
                        </div>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
};

export default Checkout;

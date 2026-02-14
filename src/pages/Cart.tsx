import { useCart } from "@/contexts/CartContext";
import { useCoupon } from "@/hooks/useCoupon";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Minus, Plus, X, ArrowRight, Lock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Cart = () => {
    const { cartItems, removeFromCart, updateQuantity, subtotal, cartCount, couponDetails, setCouponDetails, removeCoupon } = useCart();
    const [itemToRemove, setItemToRemove] = useState<string | null>(null);

    const handleRemoveClick = (id: string) => {
        setItemToRemove(id);
    };

    const confirmRemove = () => {
        if (itemToRemove) {
            removeFromCart(itemToRemove);
            setItemToRemove(null);
            toast.info("Item removed from cart");
        }
    };

    const [promoInput, setPromoInput] = useState("");
    const { validateCoupon, isValidating } = useCoupon();


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
            setPromoInput(""); // Clear input on success
            toast.success(`Coupon ${result.code} applied!`);
        }
    };

    const handleRemoveCoupon = () => {
        removeCoupon();
        toast.success("Coupon removed");
    };

    // Static values for now as per design mockup/requirements
    const shipping = subtotal > 200 ? 0 : 15;
    // Tax removed as per request

    const discountAmount = couponDetails ? (
        couponDetails.type === 'percentage'
            ? (subtotal * couponDetails.value) / 100
            : Math.min(couponDetails.value, subtotal)
    ) : 0;

    const total = subtotal + shipping - discountAmount;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            <Header />

            <main className="flex-grow container mx-auto px-3 md:px-4 py-8 md:py-12">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link to="/" className="hover:text-foreground">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium">Cart</span>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Page Title */}
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
                            YOUR CART ({cartCount})
                        </h1>
                        <div className="flex justify-between items-center">
                            <p className="text-muted-foreground font-medium">
                                Free shipping on orders over ₹200
                            </p>
                            <Link to="/#catalog" className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent hidden lg:block">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-20 bg-accent/5 rounded-3xl border border-border">
                            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                            <p className="text-muted-foreground mb-8">Looks like you haven't added any kicks yet.</p>
                            <Link to="/#catalog">
                                <Button size="lg" className="font-bold tracking-wide">
                                    START SHOPPING
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
                            {/* Left Column: Cart Items */}
                            <div className="flex-1 space-y-4 sm:space-y-6">
                                {/* Continue Shopping Link for Desktop (optional, as per design it's on right usually, but design shows it top right relative to title or items) */}
                                <div className="flex justify-end lg:hidden">
                                    <Link to="/#catalog" className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-accent">
                                        Continue Shopping
                                    </Link>
                                </div>

                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex flex-row gap-4 sm:gap-6 p-4 sm:p-6 mb-4 bg-secondary/30 sm:bg-secondary/10 rounded-3xl border border-border/50 group relative transition-all duration-300 hover:border-foreground/20">
                                        {/* Product Image */}
                                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-secondary/50 sm:bg-secondary/30 rounded-2xl sm:rounded-3xl flex items-center justify-center p-2 flex-shrink-0">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-contain rounded-xl filter drop-shadow-md group-hover:drop-shadow-lg transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="flex justify-between items-start">
                                                <div className="pr-6 sm:pr-0">
                                                    {item.brand && (
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground font-bold mb-0.5 sm:mb-1 uppercase tracking-wide">{item.brand}</p>
                                                    )}
                                                    <h3 className="text-base sm:text-lg font-bold leading-tight mb-0.5 sm:mb-1 line-clamp-2">{item.name}</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                                        Size: {item.size}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveClick(item.id)}
                                                    className="absolute top-4 right-4 sm:relative sm:top-auto sm:right-auto text-muted-foreground hover:text-destructive transition-colors p-1"
                                                >
                                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            </div>

                                            <div className="flex justify-between items-end mt-2 sm:mt-4">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2 sm:gap-3 bg-secondary/60 sm:bg-secondary/50 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 border border-border">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 hover:text-accent disabled:opacity-50 font-bold"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" strokeWidth={3} />
                                                    </button>
                                                    <span className="font-bold text-xs sm:text-sm w-3 sm:w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 hover:text-accent font-bold"
                                                    >
                                                        <Plus className="w-3 h-3" strokeWidth={3} />
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <div className="text-base sm:text-xl font-black tracking-tight">
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="lg:w-[400px] flex-shrink-0">
                                <div className="sticky top-24 bg-secondary backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-border/50">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-black tracking-tighter">Order Summary</h2>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span className="text-muted-foreground">Estimated Shipping</span>
                                            <span className={`font-bold ${shipping === 0 ? 'text-green-500' : ''}`}>
                                                {shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}
                                            </span>
                                        </div>

                                        {couponDetails && (
                                            <div className="flex justify-between text-sm font-medium text-green-600">
                                                <span className="flex items-center gap-2">
                                                    Discount ({couponDetails.code})
                                                    <button onClick={handleRemoveCoupon} className="text-destructive hover:text-red-700">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                                <span>-₹{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="h-px bg-border/50 my-2"></div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-lg font-bold">Total</span>
                                            <span className="text-2xl md:text-3xl font-black tracking-tighter">₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    {/* Promo Code moved below Summary */}
                                    <div className="relative mb-6">
                                        <Input
                                            placeholder="Discount code"
                                            value={promoInput}
                                            onChange={(e) => setPromoInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                            disabled={!!couponDetails}
                                            className="bg-background border-border rounded-full py-6 pl-6 pr-12 font-medium focus-visible:ring-accent disabled:opacity-50"
                                        />
                                        <button
                                            disabled={!promoInput.trim() || !!couponDetails || isValidating}
                                            onClick={handleApplyCoupon}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground text-background p-2 rounded-full enabled:hover:bg-accent enabled:hover:text-accent-foreground transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isValidating ? <div className="w-4 h-4 rounded-full border-2 border-background border-t-transparent animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    <Link to="/checkout" state={{ couponDetails }}>
                                        <Button className="w-full text-lg font-black h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-accent hover:text-accent-foreground hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                                            PROCEED TO CHECKOUT
                                        </Button>
                                    </Link>

                                    <div className="flex justify-center items-center gap-2 mt-4 text-xs font-bold text-muted-foreground">
                                        <Lock className="w-3 h-3" />
                                        Secure Checkout
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            <AlertDialog open={!!itemToRemove} onOpenChange={(open) => !open && setItemToRemove(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove from cart?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this item from your cart?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>No</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Cart;

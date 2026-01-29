import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderCard, { Order, OrderItem } from "@/components/OrderCard";
import TextLoader from "@/components/TextLoader";
import { ShoppingBag, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OrderHistory = () => {
    const navigate = useNavigate();
    const { user, isLoading: authLoading } = useAuth();
    const { addToCart } = useCart();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState("30_days");

    const filterOptions = [
        { label: "7 Days", value: "7_days" },
        { label: "30 Days", value: "30_days" },
        { label: "6 Months", value: "6_months" },
        { label: "1 Year", value: "1_year" },
    ];

    const getStartDate = (filter: string) => {
        const date = new Date();
        if (filter === "7_days") date.setDate(date.getDate() - 7);
        else if (filter === "30_days") date.setDate(date.getDate() - 30);
        else if (filter === "6_months") date.setMonth(date.getMonth() - 6);
        else if (filter === "1_year") date.setFullYear(date.getFullYear() - 1);
        return date.toISOString();
    };

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please login to view your order history");
            navigate("/auth");
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;

            try {
                const startDate = getStartDate(selectedFilter);
                const { data, error } = await supabase
                    .from("orders")
                    .select(
                        `
            id,
            order_code,
            created_at,
            status,
            total,
            subtotal,
            shipping_cost,
            tax,
            discount_code,
            first_name,
            last_name,
            email,
            phone,
            address,
            apartment,
            city,
            postal_code,
            payment_method,
            order_items (
              id,
              shoe_id,
              quantity,
              size,
              color,
              price,
              shoes:shoe_id (
                name,
                brand,
                image_url
              )
            )
          `
                    )
                    .eq("user_id", user.id)
                    .gte("created_at", startDate)
                    .order("created_at", { ascending: false });

                if (error) throw error;

                // Transform the data to match our interface
                const transformedOrders = (data || []).map((order: any) => ({
                    ...order,
                    order_items: order.order_items.map((item: any) => ({
                        ...item,
                        shoe: item.shoes,
                    })),
                }));

                setOrders(transformedOrders);
            } catch (error: any) {
                console.error("Error fetching orders:", error);
                toast.error("Failed to load order history");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user, selectedFilter]);

    const handleBuyAgain = async (order: Order) => {
        try {
            for (const item of order.order_items) {
                if (item.shoe) {
                    await addToCart({
                        shoeId: item.shoe_id,
                        name: item.shoe.name,
                        brand: item.shoe.brand,
                        price: item.price,
                        size: item.size,
                        color: item.color,
                        image: item.shoe.image_url || "",
                        quantity: item.quantity,
                    });
                }
            }
            toast.success("Items added to cart!");
            navigate("/cart");
        } catch (error) {
            console.error("Error adding items to cart:", error);
            toast.error("Failed to add items to cart");
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-[#f9fafb] text-foreground flex flex-col font-sans">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-12">
                    <div className="flex items-center justify-center h-64">
                        <TextLoader className="text-2xl" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f9fafb] text-foreground flex flex-col font-sans">
            <Header />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl">
                {/* Page Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                            ORDER HISTORY
                        </h1>
                        <p className="text-muted-foreground">
                            View and manage your past purchases.
                        </p>
                    </div>

                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white border-gray-200">
                                {filterOptions.find(opt => opt.value === selectedFilter)?.label || "Last 30 days"}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {filterOptions.map((option) => (
                                <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => setSelectedFilter(option.value)}
                                >
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">No orders yet</h2>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            You haven't placed any orders yet. Start shopping to see your
                            orders here!
                        </p>
                        <Button
                            onClick={() => navigate("/")}
                            className="rounded-none px-8 py-6 font-bold bg-accent hover:bg-black text-accent-foreground uppercase tracking-widest"
                        >
                            Start Shopping
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onBuyAgain={() => handleBuyAgain(order)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default OrderHistory;

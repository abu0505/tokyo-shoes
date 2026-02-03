import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartProvider } from "@/contexts/CartContext";
import { Suspense, lazy, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import TextLoader from "@/components/TextLoader";

const Index = lazy(() => import("./pages/Index"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const AddEditShoe = lazy(() => import("./pages/admin/AddEditShoe"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Payment = lazy(() => import("./pages/Payment"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));


import { HelmetProvider } from 'react-helmet-async';

import ProtectedRoute from "./components/ProtectedRoute";

import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "./components/ErrorFallback";
import ScrollToTop from "./components/ScrollToTop";


const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        window.location.href = "/update-password";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error, info) => {
            console.error("Uncaught error:", error, info);
          }}
        >
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <WishlistProvider>
                <CartProvider>
                  <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center"><TextLoader text="Loading Tokyo Shoes" /></div>}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/update-password" element={<UpdatePassword />} />

                      {/* User Protected Routes */}
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      } />
                      <Route path="/wishlist" element={
                        <ProtectedRoute>
                          <Wishlist />
                        </ProtectedRoute>
                      } />
                      <Route path="/order-history" element={
                        <ProtectedRoute>
                          <OrderHistory />
                        </ProtectedRoute>
                      } />

                      {/* Admin Protected Routes */}
                      <Route path="/admin" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/orders" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminOrders />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/orders/:orderId" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminOrderDetails />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/coupons" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AdminCoupons />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/inventory" element={
                        <ProtectedRoute requireAdmin={true}>
                          <Inventory />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/inventory/add" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AddEditShoe />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/inventory/edit/:id" element={
                        <ProtectedRoute requireAdmin={true}>
                          <AddEditShoe />
                        </ProtectedRoute>
                      } />

                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/payment" element={<Payment />} />
                      <Route path="/order/:id" element={<OrderDetails />} />
                      <Route path="/track-order/:id" element={<TrackOrder />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </CartProvider>
              </WishlistProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ErrorBoundary>
      </QueryClientProvider>
      <SpeedInsights />
    </HelmetProvider>
  );
};

export default App;

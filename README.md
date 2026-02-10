# Tokyo Shoes Collection 👟

A premium e-commerce platform tailored for sneaker enthusiasts, built with modern web technologies to provide a seamless and immersive shopping experience.

## ✨ Key Features

### 🛍️ User Experience
-   **Immersive Product Catalog**: Browse a curated collection of sneakers with advanced filtering, sorting, and search capabilities.
-   **Detailed Product Pages**: High-quality image galleries with zoom, customer reviews, size guides, and related products.
-   **Social Sharing**: Easily share detailed product links with friends via social media or clipboard.
-   **Smart Wishlist**: Save your favorite kicks for later with a single click.
-   **Seamless Checkout**: Secure and user-friendly checkout process with address management and coupon code support.
-   **Real-time Order Tracking**: Track your order status from placement to delivery with a visual timeline and status updates.
-   **Invoice Generation**: Download professional PDF invoices for your orders instantly.
-   **Order Management**: Cancel orders within the allowed window directly from the tracking page.
-   **Secure Authentication**: Robust user accounts with login, registration, and password management.

### 🛠️ Admin Dashboard
-   **Product Management**: Add, edit, and manage sneaker inventory, including sizes, prices, and images.
-   **Order Oversight**: View and manage customer orders and statuses.
-   **Coupon Management**: Create and manage discount codes for promotions.

## 🚀 Tech Stack

-   **Frontend**: [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions)
-   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
-   **Forms**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
-   **Utilities**: `jspdf` (Invoices), `lucide-react` (Icons), `sonner` (Toasts)

## 🛠️ Getting Started

Follow these steps to run the project locally:

1.  **Clone the repository**
    ```bash
    git clone <YOUR_GIT_URL>
    cd tokyo-shoes-collection
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    -   Ensure you have your Supabase credentials configured in functionality (managed via `src/integrations/supabase/client.ts`).

4.  **Start the development server**
    ```bash
    npm run dev
    ```

5.  **Open the app**
    -   Visit `http://localhost:8080` (or the port shown in your terminal) to view the application.

## 📦 Deployment

This project is optimized for deployment on platforms like Vercel or Netlify.
Build the project for production:

```bash
npm run build
```

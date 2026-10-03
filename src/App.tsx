import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/app-layout.tsx";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const ShopPage = lazy(() => import("./pages/shop/page.tsx"));
const ProductPage = lazy(() => import("./pages/product/page.tsx"));
const CartPage = lazy(() => import("./pages/cart/page.tsx"));
const CheckoutPage = lazy(() => import("./pages/checkout/page.tsx"));
const OrderConfirmPage = lazy(() => import("./pages/checkout/confirm.tsx"));
const ProfilePage = lazy(() => import("./pages/profile/page.tsx"));
const WishlistPage = lazy(() => import("./pages/wishlist/page.tsx"));
const AdminPage = lazy(() => import("./pages/admin/page.tsx"));
const SearchPage = lazy(() => import("./pages/search/page.tsx"));
const AboutPage = lazy(() => import("./pages/about/page.tsx"));

function PageLoader() {
  return (
    <div className="min-h-screen pt-24 px-4 space-y-4 max-w-7xl mx-auto">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4]" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route
              path="/shop"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ShopPage />
                </Suspense>
              }
            />
            <Route
              path="/product/:slug"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProductPage />
                </Suspense>
              }
            />
            <Route
              path="/cart"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CartPage />
                </Suspense>
              }
            />
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CheckoutPage />
                </Suspense>
              }
            />
            <Route
              path="/order/confirm"
              element={
                <Suspense fallback={<PageLoader />}>
                  <OrderConfirmPage />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProfilePage />
                </Suspense>
              }
            />
            <Route
              path="/wishlist"
              element={
                <Suspense fallback={<PageLoader />}>
                  <WishlistPage />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminPage />
                </Suspense>
              }
            />
            <Route
              path="/search"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SearchPage />
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AboutPage />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}

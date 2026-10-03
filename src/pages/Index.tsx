import HeroSection from "./home/_components/hero-section.tsx";
import ProductSection from "./home/_components/product-section.tsx";
import CategorySection from "./home/_components/category-section.tsx";
import TestimonialsSection from "./home/_components/testimonials-section.tsx";
import GallerySection from "./home/_components/gallery-section.tsx";
import PromoBanner from "./home/_components/promo-banner.tsx";
import { Sparkles, TrendingUp, Star } from "lucide-react";

export default function Index() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <ProductSection
        title="FEATURED"
        subtitle="Editor's picks"
        type="featured"
        href="/shop?featured=true"
        icon={<Star className="w-4 h-4 text-primary" />}
      />
      <PromoBanner />
      <ProductSection
        title="TRENDING"
        subtitle="Most popular"
        type="trending"
        href="/shop?trending=true"
        icon={<TrendingUp className="w-4 h-4 text-primary" />}
      />
      <ProductSection
        title="NEW ARRIVALS"
        subtitle="Just dropped"
        type="newArrivals"
        href="/shop?new=true"
        icon={<Sparkles className="w-4 h-4 text-primary" />}
      />
      <GallerySection />
      <TestimonialsSection />
    </>
  );
}

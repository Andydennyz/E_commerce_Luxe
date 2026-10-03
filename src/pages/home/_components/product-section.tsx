import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import ProductCard from "@/components/product-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ArrowRight, Flame } from "lucide-react";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  type: "featured" | "trending" | "newArrivals";
  href: string;
  icon?: React.ReactNode;
}

// Sub-components for each query type so hooks are called unconditionally
function FeaturedProducts({ inView }: { inView: boolean }) {
  const products = useQuery(api.products.getFeatured);
  return <ProductGrid products={products} inView={inView} />;
}

function TrendingProducts({ inView }: { inView: boolean }) {
  const products = useQuery(api.products.getTrending);
  return <ProductGrid products={products} inView={inView} />;
}

function NewArrivalsProducts({ inView }: { inView: boolean }) {
  const products = useQuery(api.products.getNewArrivals);
  return <ProductGrid products={products} inView={inView} />;
}

function ProductGrid({ products, inView }: { products: Doc<"products">[] | undefined; inView: boolean }) {
  if (!products) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[3/4] rounded-md" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Products coming soon. Check back later!</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.slice(0, 8).map((product, i) => (
        <motion.div
          key={product._id}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: i * 0.08 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}

export default function ProductSection({ title, subtitle, type, href, icon }: ProductSectionProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="flex items-end justify-between mb-10"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            {icon ?? <Flame className="w-4 h-4 text-primary" />}
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              {subtitle}
            </span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {title}
          </h2>
        </div>
        <Link
          to={href}
          className="hidden md:flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>

      {type === "featured" && <FeaturedProducts inView={inView} />}
      {type === "trending" && <TrendingProducts inView={inView} />}
      {type === "newArrivals" && <NewArrivalsProducts inView={inView} />}

      <div className="mt-8 text-center md:hidden">
        <Link
          to={href}
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-primary border border-primary/40 px-6 py-3 rounded-sm hover:bg-primary hover:text-primary-foreground transition-all"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

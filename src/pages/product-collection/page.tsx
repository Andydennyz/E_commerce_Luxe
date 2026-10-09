import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import ProductCard from "@/components/product-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Sparkles, Star, TrendingUp } from "lucide-react";

const collections = {
  featured: {
    eyebrow: "Handpicked for you",
    title: "Featured",
    description: "Explore the pieces our team loves most.",
    icon: Star,
  },
  trending: {
    eyebrow: "Most popular",
    title: "Trending",
    description: "Discover the styles everyone is talking about.",
    icon: TrendingUp,
  },
  newArrival: {
    eyebrow: "Just dropped",
    title: "New Arrivals",
    description: "Shop the latest additions to PD Stores.",
    icon: Sparkles,
  },
} as const;

type Collection = keyof typeof collections;

export default function ProductCollectionPage({
  collection,
}: {
  collection: Collection;
}) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.products.list,
    {
      featured: collection === "featured" ? true : undefined,
      trending: collection === "trending" ? true : undefined,
      newArrival: collection === "newArrival" ? true : undefined,
    },
    { initialNumItems: 12 },
  );
  const content = collections[collection];
  const Icon = content.icon;
  const isLoading = status === "LoadingFirstPage";

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <header className="border-b border-border/50 bg-card/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-primary" />
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              {content.eyebrow}
            </p>
          </div>
          <h1
            className="text-4xl md:text-5xl font-black uppercase mb-3"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {content.title}
          </h1>
          <p className="text-muted-foreground">{content.description}</p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[3/4] rounded-md" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Products coming soon. Check back later!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {results.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            {status !== "Exhausted" && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => loadMore(12)}
                  disabled={status === "LoadingMore"}
                  className="border border-primary/40 px-6 py-3 rounded-sm text-sm uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
                >
                  {status === "LoadingMore" ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

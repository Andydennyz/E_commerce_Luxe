import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Layers3 } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const gradients = [
  "from-primary/50 via-primary/10 to-transparent",
  "from-accent/50 via-accent/10 to-transparent",
  "from-[oklch(0.72_0.2_330)]/50 via-[oklch(0.72_0.2_330)]/10 to-transparent",
  "from-[oklch(0.7_0.18_190)]/50 via-[oklch(0.7_0.18_190)]/10 to-transparent",
];

export default function CollectionsPage() {
  const categories = useQuery(api.categories.list);

  return (
    <main className="min-h-screen pt-28 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-2">
            Find your style
          </p>
          <h1
            className="text-3xl md:text-5xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Collections
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Browse every collection and discover pieces curated for you.
          </p>
        </header>

        {categories === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[4/3] rounded-md" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 border border-border/50 rounded-md bg-card/30">
            <Layers3 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No collections yet</h2>
            <p className="text-muted-foreground">
              New collections will appear here as soon as they are added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category, index) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.06, 0.36) }}
              >
                <Link
                  to={`/shop?categoryId=${encodeURIComponent(category._id)}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-md border border-border/40 bg-card/40 p-5 md:p-7 transition-all hover:border-primary/50 hover:shadow-[0_0_35px_rgba(168,85,247,0.2)]"
                >
                  {(category.images?.[0] || category.image) && (
                    <img
                      src={category.images?.[0] || category.image}
                      alt={category.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${gradients[index % gradients.length]}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      {category.description || "Explore the collection"}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <h2
                        className="text-xl md:text-2xl font-black uppercase"
                        style={{ fontFamily: "Orbitron, sans-serif" }}
                      >
                        {category.name}
                      </h2>
                      <ArrowRight className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1" />
                    </div>
                    {category.images && category.images.length > 1 && (
                      <div className="flex gap-1.5 mt-2">
                        {category.images
                          .slice(1, 4)
                          .map((image, imageIndex) => (
                            <img
                              key={`${image}-${imageIndex}`}
                              src={image}
                              alt={`${category.name} alternate view ${imageIndex + 1}`}
                              className="w-10 h-10 rounded-sm border border-border/60 object-cover"
                              loading="lazy"
                            />
                          ))}
                        {category.images.length > 4 && (
                          <span className="flex w-10 h-10 items-center justify-center rounded-sm border border-border/60 bg-background/70 text-xs font-semibold">
                            +{category.images.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 border border-primary/40 px-6 py-3 text-sm uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Shop all products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

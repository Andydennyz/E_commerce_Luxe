import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const categoryStyles = [
  {
    color: "from-primary/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
  },
  {
    color: "from-[oklch(0.72_0.2_330)]/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]",
  },
  {
    color: "from-accent/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(96,165,250,0.4)]",
  },
  {
    color: "from-primary/30 to-accent/30",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
  },
];

export default function CategorySection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const categories = useQuery(api.categories.list);

  return (
    <section ref={ref} className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          Browse by category
        </span>
        <h2
          className="text-3xl md:text-4xl font-black uppercase mt-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          SHOP THE COLLECTION
        </h2>
      </motion.div>

      {categories === undefined ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] rounded-md" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-muted-foreground">
          New collections are coming soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((cat, i) => {
            const style = categoryStyles[i % categoryStyles.length];
            return (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link
                  to={`/shop?categoryId=${encodeURIComponent(cat._id)}`}
                  className={`group relative overflow-hidden rounded-md aspect-[2/3] flex flex-col justify-end p-4 md:p-6 border border-border/30 transition-all duration-400 ${style.glow}`}
                >
                  {(cat.images?.[0] || cat.image) && (
                    <img
                      src={cat.images?.[0] || cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${style.color} opacity-70 group-hover:opacity-90 transition-opacity duration-300`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
                      {cat.description || "Explore the collection"}
                    </p>
                    <h3
                      className="text-lg md:text-xl font-black uppercase text-foreground"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {cat.name}
                    </h3>
                    {cat.images && cat.images.length > 1 && (
                      <div className="flex gap-1.5 mt-2">
                        {cat.images.slice(1, 4).map((image, imageIndex) => (
                          <img
                            key={`${image}-${imageIndex}`}
                            src={image}
                            alt={`${cat.name} alternate view ${imageIndex + 1}`}
                            className="w-9 h-9 rounded-sm border border-border/60 object-cover"
                            loading="lazy"
                          />
                        ))}
                        {cat.images.length > 4 && (
                          <span className="flex w-9 h-9 items-center justify-center rounded-sm border border-border/60 bg-background/70 text-xs font-semibold">
                            +{cat.images.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}

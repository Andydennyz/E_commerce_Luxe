import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";

const categories = [
  {
    name: "Jackets",
    slug: "jackets",
    description: "Cyberpunk outerwear",
    image: "https://images.unsplash.com/photo-1765915759044-b3d0410b4210?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "from-primary/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
  },
  {
    name: "Dresses",
    slug: "dresses",
    description: "Futuristic elegance",
    image: "https://images.unsplash.com/photo-1608687087357-845abfade367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "from-[oklch(0.72_0.2_330)]/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]",
  },
  {
    name: "Streetwear",
    slug: "streetwear",
    description: "Urban future vibes",
    image: "https://images.unsplash.com/photo-1620215175664-cb9a6f5b6103?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "from-accent/40 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_rgba(96,165,250,0.4)]",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Complete the look",
    image: "https://images.unsplash.com/photo-1544869705-6d44403ee284?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    color: "from-primary/30 to-accent/30",
    glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]",
  },
];

export default function CategorySection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Link
              to={`/shop?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-md aspect-[2/3] flex flex-col justify-end p-4 md:p-6 border border-border/30 transition-all duration-400 ${cat.glow}`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} opacity-70 group-hover:opacity-90 transition-opacity duration-300`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

              <div className="relative z-10">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
                  {cat.description}
                </p>
                <h3
                  className="text-lg md:text-xl font-black uppercase text-foreground"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {cat.name}
                </h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

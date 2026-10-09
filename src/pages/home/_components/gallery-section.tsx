import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import NeonButton from "@/components/neon-button.tsx";

const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1777146536285-e70e21c953eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    span: "col-span-1 row-span-2",
  },
  {
    url: "https://images.unsplash.com/photo-1770236512224-794bda74b28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://images.unsplash.com/photo-1608687087357-845abfade367?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://images.unsplash.com/photo-1770335435091-75e3f07cd5e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    span: "col-span-1 row-span-1",
  },
  {
    url: "https://images.unsplash.com/photo-1620215175664-cb9a6f5b6103?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600",
    span: "col-span-1 row-span-1",
  },
];

export default function GallerySection() {
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
          @pdstores
        </span>
        <h2
          className="text-3xl md:text-4xl font-black uppercase mt-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          STYLE GALLERY
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[200px]">
        {galleryImages.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`group relative overflow-hidden rounded-md cursor-pointer ${img.span}`}
          >
            <img
              src={img.url}
              alt={`Gallery ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-xs uppercase tracking-widest text-foreground font-semibold">
                View Collection
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link to="/collections">
          <NeonButton variant="ghost">
            Explore Full Collection <ArrowRight className="w-4 h-4" />
          </NeonButton>
        </Link>
      </div>
    </section>
  );
}

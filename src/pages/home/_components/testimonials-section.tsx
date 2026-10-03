import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";
import GlassCard from "@/components/glass-card.tsx";

const testimonials = [
  {
    name: "Alex Chen",
    role: "Fashion Influencer",
    avatar: "https://images.unsplash.com/photo-1580428180098-24b353d7e9d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120",
    review: "PD STORES is redefining streetwear. The quality is insane and the neon aesthetic is exactly what I've been looking for.",
    rating: 5,
  },
  {
    name: "Maya Storm",
    role: "Artist & Designer",
    avatar: "https://images.unsplash.com/photo-1777146536285-e70e21c953eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120",
    review: "Every piece I've ordered has been perfect. The packaging itself is a work of art. This brand gets it.",
    rating: 5,
  },
  {
    name: "Jordan Ray",
    role: "Cyberpunk Enthusiast",
    avatar: "https://images.unsplash.com/photo-1608687087371-2950241246f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=120",
    review: "Finally a fashion brand that speaks to the future. Unique designs, premium materials, fast shipping.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-20 px-4 md:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <span className="text-xs uppercase tracking-[0.3em] text-[oklch(0.72_0.2_330)] font-semibold">
          What they say
        </span>
        <h2
          className="text-3xl md:text-4xl font-black uppercase mt-2"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          COMMUNITY VOICES
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <GlassCard glow="purple" className="p-6 h-full flex flex-col gap-4">
              <Quote className="w-6 h-6 text-primary/50" />
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">{t.review}</p>
              <div className="flex mb-2">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-primary/30"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

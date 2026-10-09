import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import NeonButton from "@/components/neon-button.tsx";

function getISOWeek(date: Date) {
  const thursday = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  thursday.setUTCDate(
    thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7),
  );

  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  return (
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604_800_000)
  );
}

const heroImages = [
  "https://images.unsplash.com/photo-1777146536285-e70e21c953eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "https://images.unsplash.com/photo-1770236512224-794bda74b28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
  "https://images.unsplash.com/photo-1770335435091-75e3f07cd5e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
];

// Pre-compute particle positions once (stable across renders)
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left: `${(i * 6.25 + 3) % 100}%`,
  top: `${(i * 13 + 7) % 100}%`,
  color: i % 3 === 0 ? "oklch(0.65 0.28 300)" : i % 3 === 1 ? "oklch(0.62 0.22 240)" : "oklch(0.72 0.2 330)",
  duration: 3 + (i % 4),
  delay: (i * 0.4) % 5,
}));

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 180]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax Background */}
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <img
          src={heroImages[0]}
          alt="Hero fashion"
          className="w-full h-full object-cover object-center scale-110"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Animated particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{ left: p.left, top: p.top, backgroundColor: p.color }}
            animate={{ y: [0, -30, 0], opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* Neon grid lines */}
      <div className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(oklch(0.65 0.28 300) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.28 300) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pt-24"
      >
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex items-center gap-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              New Collection {currentTime.getFullYear()}
            </span>
          </motion.div>
          <time
            dateTime={currentTime.toISOString()}
            className="block -mt-4 mb-6 text-xs uppercase tracking-widest text-muted-foreground"
          >
            {currentTime.toLocaleDateString(undefined, { month: "long" })} ·{" "}
            Week {getISOWeek(currentTime)} ·{" "}
            {currentTime.toLocaleDateString(undefined, { weekday: "long" })}{" "}
            {currentTime.getDate()}{" "}
            ·{" "}
            {currentTime.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </time>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            <span className="block text-foreground">WEAR</span>
            <span className="block bg-gradient-to-r from-primary via-accent to-[oklch(0.72_0.2_330)] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.5)]">
              THE
            </span>
            <span className="block text-foreground">FUTURE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
          >
            Where cyberpunk aesthetics meet luxury fashion. Explore our curated
            collections designed for those who live in the future.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/shop">
              <NeonButton size="lg" variant="purple">
                Shop Now <ArrowRight className="w-5 h-5" />
              </NeonButton>
            </Link>
            <Link to="/shop?new=true">
              <NeonButton size="lg" variant="ghost">
                New Arrivals <Sparkles className="w-5 h-5" />
              </NeonButton>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex gap-8 mt-12"
          >
            {[
              { value: "500+", label: "Products" },
              { value: "10K+", label: "Customers" },
              { value: "4.9★", label: "Rating" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-black text-primary"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Side images */}
      <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:flex flex-col gap-2 z-10 pointer-events-none overflow-hidden">
        {heroImages.slice(1).map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 + i * 0.2 }}
            className="flex-1 relative overflow-hidden"
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/20" />
          </motion.div>
        ))}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
        />
      </motion.div>
    </section>
  );
}

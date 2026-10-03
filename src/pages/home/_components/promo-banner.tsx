import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import NeonButton from "@/components/neon-button.tsx";

export default function PromoBanner() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="py-12 px-4 md:px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.7 }}
        className="relative overflow-hidden rounded-md border border-primary/30 shadow-[0_0_60px_rgba(168,85,247,0.1)]"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/10 to-[oklch(0.72_0.2_330)]/20" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(45deg, oklch(0.65 0.28 300) 1px, transparent 1px), linear-gradient(-45deg, oklch(0.65 0.28 300) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="relative z-10 py-16 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2 font-semibold">
              Limited Time Offer
            </p>
            <h2
              className="text-4xl md:text-5xl font-black uppercase"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              <span className="text-foreground">UP TO </span>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
                40% OFF
              </span>
            </h2>
            <p className="text-muted-foreground mt-2">
              On selected items from our Cyber Collection. Use code{" "}
              <span className="text-primary font-bold">CYBER40</span>
            </p>
          </div>
          <Link to="/shop">
            <NeonButton size="lg" variant="purple">
              Shop the Sale
            </NeonButton>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

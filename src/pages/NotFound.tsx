import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Home, ShoppingBag, Search } from "lucide-react";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative px-4 space-y-8">
        {/* Glitchy 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <h1
            className="text-[120px] md:text-[180px] font-black leading-none select-none"
            style={{
              fontFamily: "Orbitron, sans-serif",
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
              filter: "drop-shadow(0 0 40px rgba(168,85,247,0.4))",
            }}
          >
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-2xl font-black uppercase tracking-widest" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
            This page has drifted into the void. Check the URL or navigate back to safety.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:border-primary hover:text-primary transition-all"
          >
            <ShoppingBag className="w-4 h-4" /> Shop
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:border-primary hover:text-primary transition-all"
          >
            <Search className="w-4 h-4" /> Search
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

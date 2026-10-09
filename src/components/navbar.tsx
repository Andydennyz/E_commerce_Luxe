import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Heart,
  Search,
  Menu,
  X,
  Zap,
  LayoutDashboard,
  UserRound,
} from "lucide-react";
import { Authenticated } from "convex/react";
import { cn } from "@/lib/utils.ts";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Featured", href: "/featured" },
  { label: "Trending", href: "/trending" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { items: cartItems } = useGuestCart();
  const cartCount =
    cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-primary/20 shadow-[0_4px_30px_rgba(168,85,247,0.1)]"
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Zap
                className="w-6 h-6 text-primary group-hover:text-accent transition-colors"
                fill="currentColor"
              />
              <span
                className="text-xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary via-accent to-[oklch(0.72_0.2_330)] bg-clip-text text-transparent"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                PD STORES
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <Link
                to="/search"
                className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/wishlist"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Wishlist"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <Link
                to="/cart"
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>

              <Authenticated>
                <Link
                  to="/dashboard"
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Your dashboard"
                  aria-label="Your dashboard"
                >
                  <UserRound className="w-5 h-5" />
                </Link>
              </Authenticated>

              <Link
                to="/admin"
                className="p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Admin Dashboard"
                aria-label="Admin dashboard"
              >
                <LayoutDashboard className="w-5 h-5" />
              </Link>

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div className="md:hidden grid grid-cols-3 gap-x-3 gap-y-1 pb-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border/50 bg-background/98 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-xl flex items-start justify-center pt-32 px-4"
            onClick={(e) =>
              e.target === e.currentTarget && setSearchOpen(false)
            }
          >
            <motion.form
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              onSubmit={handleSearch}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full bg-card/80 border border-primary/40 rounded-sm px-6 py-4 text-lg text-foreground placeholder-muted-foreground outline-none focus:border-primary focus:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <Search className="w-5 h-5 text-primary" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="mt-4 text-muted-foreground hover:text-foreground text-sm uppercase tracking-widest cursor-pointer"
              >
                Press ESC to close
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

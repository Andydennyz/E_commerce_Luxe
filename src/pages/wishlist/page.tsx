import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { toast } from "sonner";
import NeonButton from "@/components/neon-button.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { cn } from "@/lib/utils.ts";
import { useState } from "react";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";

function WishlistContent() {
  const wishlist = useQuery(api.wishlist.getWishlist);
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const recordCartAddition = useMutation(api.userActivity.recordCartAddition);
  const { addItem } = useGuestCart();
  const [movingId, setMovingId] = useState<string | null>(null);

  if (wishlist === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-md" />
        ))}
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 space-y-6"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Wishlist is Empty
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Browse the shop and heart the items you love to save them here
          </p>
        </div>
        <Link to="/shop">
          <NeonButton size="lg">
            <ShoppingCart className="w-5 h-5" /> Browse Shop
          </NeonButton>
        </Link>
      </motion.div>
    );
  }

  const handleRemove = async (productId: (typeof wishlist)[0]["productId"]) => {
    try {
      await toggleWishlist({ productId });
      toast.success("Removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const handleMoveToCart = async (item: (typeof wishlist)[0]) => {
    if (!item.product) return;
    setMovingId(item._id);
    try {
      const size = item.product.sizes[0] ?? "M";
      const color = item.product.colors[0] ?? "Default";
      await recordCartAddition({
        productId: item.product._id,
        quantity: 1,
        size,
        color,
      });
      addItem(
        item.product,
        1,
        size,
        color,
      );
    } catch (error) {
      console.error("Failed to add wishlist product to cart:", error);
      toast.error("Failed to add product to cart");
      setMovingId(null);
      return;
    }

    try {
      await toggleWishlist({ productId: item.product._id });
      toast.success("Moved to cart!");
    } catch (error) {
      console.error("Failed to remove moved product from wishlist:", error);
      toast.error("Product added to cart but could not be removed from wishlist");
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-6">
        {wishlist.length} saved item{wishlist.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence initial={false}>
          {wishlist.map((item, i) =>
            item.product ? (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
              >
                <GlassCard className={cn("overflow-hidden group transition-opacity", movingId === item._id && "opacity-50")}>
                  {/* Image */}
                  <Link to={`/product/${item.product.slug}`} className="block relative overflow-hidden aspect-[4/3]">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {item.product.newArrival && (
                      <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-sm">
                        New
                      </span>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/product/${item.product.slug}`}>
                          <h3 className="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors">
                            {item.product.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-base font-black text-primary">
                            Ksh {item.product.price.toFixed(2)}
                          </span>
                          {item.product.comparePrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              Ksh {item.product.comparePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.product.stock > 0 ? (
                            <span className="text-accent">In stock</span>
                          ) : (
                            <span className="text-destructive">Out of stock</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-sm hover:bg-destructive/10"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        disabled={movingId === item._id || item.product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {movingId === item._id ? "Moving..." : "Move to Cart"}
                      </button>
                      <Link
                        to={`/product/${item.product.slug}`}
                        className="p-2 border border-border rounded-sm text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
            My Wishlist
          </h1>
        </div>
        <AuthLoading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-md" />)}
          </div>
        </AuthLoading>
        <Authenticated>
          <WishlistContent />
        </Authenticated>
        <Unauthenticated>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                Sign In to View Wishlist
              </h2>
              <p className="text-muted-foreground">Your saved items are waiting for you</p>
            </div>
            <SignInButton className="px-8 py-4 bg-primary text-primary-foreground rounded-sm font-bold uppercase tracking-widest hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all cursor-pointer text-sm" />
          </motion.div>
        </Unauthenticated>
      </div>
    </div>
  );
}

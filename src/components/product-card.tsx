import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Heart, ShoppingCart, Eye, Star } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";
import { useRequireAuth } from "@/hooks/use-require-auth.ts";

interface ProductCardProps {
  product: Doc<"products">;
  className?: string;
}

function WishlistButton({ productId }: { productId: Doc<"products">["_id"] }) {
  const isWishlisted = useQuery(api.wishlist.isInWishlist, { productId });
  const toggle = useMutation(api.wishlist.toggleWishlist);
  const { requireAuth } = useRequireAuth();

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await requireAuth("add items to your wishlist"))) return;
    try {
      const added = await toggle({ productId });
      toast.success(added ? "Added to wishlist" : "Removed from wishlist");
    } catch {
      toast.error("Sign in to use wishlist");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "p-2 rounded-sm backdrop-blur-md border transition-all duration-200 cursor-pointer",
        isWishlisted
          ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          : "bg-card/60 border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50",
      )}
    >
      <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
    </button>
  );
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useGuestCart();
  const { requireAuth } = useRequireAuth();
  const recordCartAddition = useMutation(api.userActivity.recordCartAddition);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await requireAuth("add items to your cart"))) return;
    try {
      const size = product.sizes[0] ?? "M";
      const color = product.colors[0] ?? "Default";
      await recordCartAddition({ productId: product._id, quantity: 1, size, color });
      addItem(product, 1, size, color);
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add this item to your cart");
    }
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("group relative", className)}
    >
      <Link to={`/product/${product.slug}`}>
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-md aspect-[3/4] bg-secondary">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.newArrival && (
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground rounded-sm shadow-[0_0_10px_rgba(96,165,250,0.5)]">
                New
              </span>
            )}
            {discount > 0 && (
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest bg-[oklch(0.72_0.2_330)] text-white rounded-sm">
                -{discount}%
              </span>
            )}
          </div>

          {/* Actions - appear on hover */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
            <WishlistButton productId={product._id} />
            <Link
              to={`/product/${product.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-sm bg-card/60 backdrop-blur-md border border-border/50 text-muted-foreground hover:text-accent hover:border-accent/50 transition-all"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>

          {/* Add to cart button */}
          <div className="absolute bottom-3 left-3 right-3 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full py-2.5 bg-primary/90 text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-sm backdrop-blur-md flex items-center justify-center gap-2 hover:bg-primary hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="pt-3 pb-1 space-y-1">
          <div className="flex items-center gap-1">
            {product.rating ? (
              <>
                <Star className="w-3 h-3 fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" />
                <span className="text-xs text-muted-foreground">
                  {product.rating} ({product.reviewCount})
                </span>
              </>
            ) : null}
          </div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">
              Ksh {product.price.toFixed(2)}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-muted-foreground line-through">
                Ksh {product.comparePrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

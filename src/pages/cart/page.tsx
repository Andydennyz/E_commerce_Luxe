import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus, Minus, ShoppingBag, ArrowRight,
  Tag, X, CheckCircle, ShoppingCart, Heart,
} from "lucide-react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { toast } from "sonner";
import NeonButton from "@/components/neon-button.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useState } from "react";
import { cn } from "@/lib/utils.ts";

const VALID_COUPONS: Record<string, { label: string; pct: number }> = {
  CYBER40: { label: "CYBER40", pct: 0.1 },
  PD20:    { label: "PD20",    pct: 0.2 },
};
const DELIVERY_FEE = 9.99;
const FREE_SHIPPING_THRESHOLD = 50;

function CartContent() {
  const cartItems = useQuery(api.cart.getCart);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeFromCart);
  const toggleWishlist = useMutation(api.wishlist.toggleWishlist);
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ label: string; pct: number } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (cartItems === undefined) {
    return (
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-md" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-md" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 space-y-6"
      >
        <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Cart is Empty
          </h2>
          <p className="text-muted-foreground">Add some futuristic fashion to get started</p>
        </div>
        <Link to="/shop">
          <NeonButton size="lg">
            <ShoppingCart className="w-5 h-5" /> Browse Shop
          </NeonButton>
        </Link>
      </motion.div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price ?? 0) * item.quantity, 0);
  const couponDiscount = appliedCoupon ? subtotal * appliedCoupon.pct : 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal - couponDiscount + shippingFee;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      setAppliedCoupon(VALID_COUPONS[code]);
      toast.success(`Coupon applied! ${VALID_COUPONS[code].pct * 100}% off`);
    } else {
      toast.error("Invalid coupon code");
    }
  };

  const handleRemove = async (cartItemId: string) => {
    setRemovingId(cartItemId);
    try {
      await removeItem({ cartItemId: cartItemId as Parameters<typeof removeItem>[0]["cartItemId"] });
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToWishlist = async (item: (typeof cartItems)[0]) => {
    if (!item.product) return;
    try {
      await toggleWishlist({ productId: item.product._id });
      await removeItem({ cartItemId: item._id });
      toast.success("Moved to wishlist");
    } catch {
      toast.error("Failed to move item");
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 items-start">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-3">
        {/* Free shipping progress */}
        <div className="p-4 rounded-md bg-card/60 border border-border/50 space-y-2">
          {subtotal >= FREE_SHIPPING_THRESHOLD ? (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span className="text-accent font-semibold">You qualify for free shipping!</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add <span className="text-primary font-bold">Ksh {amountToFreeShipping.toFixed(2)}</span> more for free shipping
            </p>
          )}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${shippingProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Items */}
        <AnimatePresence initial={false}>
          {cartItems.map((item, i) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <GlassCard className={cn("p-4 transition-opacity", removingId === item._id && "opacity-50")}>
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/product/${item.product?.slug ?? ""}`} className="shrink-0">
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-sm overflow-hidden bg-secondary">
                      <img
                        src={item.product?.images[0] ?? ""}
                        alt={item.product?.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Link to={`/product/${item.product?.slug ?? ""}`}>
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
                        {item.product?.name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Size: <span className="text-foreground font-medium">{item.size}</span></span>
                      <span>Color: <span className="text-foreground font-medium">{item.color}</span></span>
                    </div>
                    <p className="text-base font-black text-primary">
                      Ksh {((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </p>
                    {item.product?.comparePrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        Ksh {(item.product.comparePrice * item.quantity).toFixed(2)}
                      </p>
                    )}

                    {/* Bottom actions */}
                    <div className="flex items-center gap-3 pt-1">
                      {/* Qty controls */}
                      <div className="flex items-center border border-border rounded-sm">
                        <button
                          onClick={() => updateQuantity({ cartItemId: item._id, quantity: item.quantity - 1 })}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity({ cartItemId: item._id, quantity: item.quantity + 1 })}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Save for later */}
                      <button
                        onClick={() => handleMoveToWishlist(item)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Heart className="w-3 h-3" /> Save
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemove(item._id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Order Summary */}
      <div className="space-y-4 lg:sticky lg:top-24">
        <GlassCard glow="purple" className="p-6 space-y-5">
          <h2
            className="text-lg font-black uppercase tracking-widest"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Order Summary
          </h2>

          {/* Line items */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({cartItems.length} item{cartItems.length !== 1 ? "s" : ""})</span>
              <span>Ksh {subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-[oklch(0.72_0.2_330)]">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {appliedCoupon.label} ({appliedCoupon.pct * 100}% off)
                </span>
                <span>-Ksh {couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className={cn(shippingFee === 0 ? "text-accent font-semibold" : "")}>
                {shippingFee === 0 ? "FREE" : `Ksh ${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-3 border-t border-border/50 flex justify-between font-black text-lg">
              <span>Total</span>
              <span className="text-primary">Ksh {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon input */}
          {!appliedCoupon ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Promo Code</p>
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Enter code"
                  className="flex-1 bg-secondary border border-border px-3 py-2 text-sm rounded-sm outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-secondary border border-border rounded-sm text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">Try: CYBER40 or PD20</p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-sm">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">{appliedCoupon.label}</span>
                <span className="text-muted-foreground">applied</span>
              </div>
              <button
                onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}
                className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-3">
            <NeonButton
              fullWidth
              size="lg"
              onClick={() => navigate("/checkout")}
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </NeonButton>
            <Link to="/shop" className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors py-1">
              ← Continue Shopping
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-border/40">
            {["Secure Checkout", "Free Returns", "24/7 Support"].map((label) => (
              <span key={label} className="text-[10px] text-muted-foreground">{label}</span>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <h1
            className="text-3xl font-black uppercase"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Shopping Cart
          </h1>
        </div>
        <AuthLoading>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-md" />)}
            </div>
            <Skeleton className="h-72 rounded-md" />
          </div>
        </AuthLoading>
        <Authenticated>
          <CartContent />
        </Authenticated>
        <Unauthenticated>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 space-y-6"
          >
            <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                Sign In to View Cart
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

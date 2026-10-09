import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Minus, ShoppingBag, ArrowRight,
  Tag, X, CheckCircle, ShoppingCart, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import NeonButton from "@/components/neon-button.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils.ts";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";
import { useRequireAuth } from "@/hooks/use-require-auth.ts";

const VALID_COUPONS: Record<string, { label: string; pct: number }> = {
  CYBER40: { label: "CYBER40", pct: 0.1 },
  PD20:    { label: "PD20",    pct: 0.2 },
};
const DELIVERY_FEE = 9.99;
const FREE_SHIPPING_THRESHOLD = 50;
const PENDING_PROMO_KEY = "pd-stores-pending-promo";

interface SharedCartLine {
  productId: string;
  quantity: number;
  size: string;
  color: string;
  customAttributes?: { name: string; value: string }[];
}

function isSharedCartLine(item: unknown): item is SharedCartLine {
  if (typeof item !== "object" || item === null) return false;
  const line = item as Record<string, unknown>;
  if (
    typeof line.productId !== "string" ||
    line.productId.length > 128 ||
    !/^[A-Za-z0-9]+$/.test(line.productId) ||
    !Number.isInteger(line.quantity) ||
    (line.quantity as number) < 1 ||
    (line.quantity as number) > 99 ||
    typeof line.size !== "string" ||
    line.size.length > 100 ||
    typeof line.color !== "string" ||
    line.color.length > 100
  ) {
    return false;
  }
  return (
    line.customAttributes === undefined ||
    (Array.isArray(line.customAttributes) &&
      line.customAttributes.length <= 5 &&
      line.customAttributes.every((attribute: unknown) => {
        if (typeof attribute !== "object" || attribute === null) return false;
        const value = attribute as Record<string, unknown>;
        return (
          typeof value.name === "string" &&
          value.name.trim().length > 0 &&
          value.name.length <= 40 &&
          typeof value.value === "string" &&
          value.value.trim().length > 0 &&
          value.value.length <= 100
        );
      }))
  );
}

function parseSharedCart(value: string | null): SharedCartLine[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 30) {
      return null;
    }
    return parsed.every(isSharedCartLine) ? parsed : null;
  } catch {
    return null;
  }
}

function CartContent() {
  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
  } = useGuestCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const ensureReferralCode = useMutation(api.referrals.ensureMyReferralCode);
  const referralInfo = useQuery(
    api.referrals.getMyReferralInfo,
    isAuthenticated ? {} : "skip",
  );
  const sharedCartParam = searchParams.get("items");
  const sharedCartItems = parseSharedCart(sharedCartParam);
  const sharedProducts = useQuery(
    api.products.getByIds,
    isAuthenticated && sharedCartItems
      ? { ids: sharedCartItems.map((item) => item.productId as Id<"products">) }
      : "skip",
  );
  const importedShareRef = useRef<string | null>(null);
  const initialPromo =
    new URLSearchParams(window.location.search).get("promo") ??
    window.sessionStorage.getItem(PENDING_PROMO_KEY) ??
    "";

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    label: string;
    pct: number;
    referral: boolean;
  } | null>(null);
  const [pendingReferralCode, setPendingReferralCode] = useState(initialPromo);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const referralCheck = useQuery(
    api.referrals.checkCode,
    pendingReferralCode &&
      isAuthenticated &&
      !VALID_COUPONS[pendingReferralCode.trim().toUpperCase()]
      ? { code: pendingReferralCode }
      : "skip",
  );

  useEffect(() => {
    if (!sharedCartParam) return;
    if (!sharedCartItems) {
      toast.error("This shared cart link is invalid or too large.");
      setSearchParams((current) => {
        const updated = new URLSearchParams(current);
        updated.delete("items");
        return updated;
      }, { replace: true });
      return;
    }
    if (!isAuthenticated || sharedProducts === undefined) return;
    if (importedShareRef.current === sharedCartParam) return;

    importedShareRef.current = sharedCartParam;
    let importedCount = 0;
    sharedCartItems.forEach((item, index) => {
      const product = sharedProducts[index];
      if (!product) return;
      addItem(
        product,
        item.quantity,
        item.size,
        item.color,
        item.customAttributes,
      );
      importedCount += 1;
    });
    if (importedCount > 0) {
      toast.success(`${importedCount} shared cart item${importedCount === 1 ? "" : "s"} added`);
    }
    if (importedCount < sharedCartItems.length) {
      toast.error("The products in this shared cart are no longer available.");
    }
    setSearchParams((current) => {
      const updated = new URLSearchParams(current);
      updated.delete("items");
      return updated;
    }, { replace: true });
  }, [
    addItem,
    isAuthenticated,
    setSearchParams,
    sharedCartItems,
    sharedCartParam,
    sharedProducts,
  ]);

  useEffect(() => {
    if (!pendingReferralCode) return;
    const legacyCoupon =
      VALID_COUPONS[pendingReferralCode.trim().toUpperCase()];
    if (legacyCoupon) {
      setAppliedCoupon({ ...legacyCoupon, referral: false });
      setCouponInput(pendingReferralCode);
      setPendingReferralCode("");
      window.sessionStorage.removeItem(PENDING_PROMO_KEY);
      return;
    }
    if (referralCheck === undefined) return;
    setCouponInput(pendingReferralCode);
    window.sessionStorage.removeItem(PENDING_PROMO_KEY);
    if (referralCheck.valid) {
      setAppliedCoupon({
        label: pendingReferralCode,
        pct: referralCheck.discountPercent / 100,
        referral: true,
      });
    } else {
      setAppliedCoupon(null);
      toast.error(referralCheck.reason);
      setPendingReferralCode("");
    }
  }, [pendingReferralCode, referralCheck]);

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
            {sharedCartParam ? "Shared Cart" : "Cart is Empty"}
          </h2>
          <p className="text-muted-foreground">
            {sharedCartParam
              ? "Sign in to add the shared items and apply the referral discount."
              : "Add some futuristic fashion to get started"}
          </p>
        </div>
        {sharedCartParam && sharedCartItems && (
          <NeonButton
            size="lg"
            disabled={isAuthenticated && sharedProducts === undefined}
            onClick={async () => {
              await requireAuth("add shared items to your cart");
            }}
          >
            {isAuthenticated
              ? sharedProducts === undefined
                ? "Loading Shared Cart..."
                : "Add Shared Items"
              : "Sign In to Add Shared Items"}
          </NeonButton>
        )}
        <Link to="/shop">
          <NeonButton size="lg">
            <ShoppingCart className="w-5 h-5" /> Browse Shop
          </NeonButton>
        </Link>
      </motion.div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const referralIsValid =
    appliedCoupon?.referral === true && referralCheck?.valid === true;
  const couponDiscount =
    appliedCoupon && (!appliedCoupon.referral || referralIsValid)
      ? Math.round(subtotal * appliedCoupon.pct * 100) / 100
      : 0;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal - couponDiscount + shippingFee;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast.error("Enter a promo code first.");
      return;
    }
    if (!isAuthenticated) {
      window.sessionStorage.setItem(PENDING_PROMO_KEY, code);
      await requireAuth("use a promo code");
      return;
    }
    if (!(await requireAuth("use a promo code"))) return;
    if (VALID_COUPONS[code]) {
      setPendingReferralCode("");
      window.sessionStorage.removeItem(PENDING_PROMO_KEY);
      setAppliedCoupon({ ...VALID_COUPONS[code], referral: false });
      toast.success(`Coupon applied! ${VALID_COUPONS[code].pct * 100}% off`);
    } else {
      setAppliedCoupon(null);
      setPendingReferralCode(code);
    }
  };

  const handleShareCart = async () => {
    if (!(await requireAuth("share your cart"))) return;
    if (referralInfo === undefined) {
      toast.info("Please wait while your referral code loads.");
      return;
    }
    if (referralInfo?.redeemed) {
      toast.error("Your one-time referral code has already been used.");
      return;
    }
    if (cartItems.length > 30) {
      toast.error("A shared cart can contain at most 30 different items.");
      return;
    }
    try {
      const code = await ensureReferralCode({});
      const params = new URLSearchParams();
      params.set(
        "items",
        JSON.stringify(
          cartItems.map(({ productId, quantity, size, color, customAttributes }) => ({
            productId,
            quantity,
            size,
            color,
            ...(customAttributes ? { customAttributes } : {}),
          })),
        ),
      );
      params.set("promo", code);
      const link = `${window.location.origin}/cart?${params.toString()}`;
      if (link.length > 7000) {
        toast.error("This cart is too large to share as a link.");
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: "Shared Luxe cart",
          text: "Here is my cart, with 10% off your first order.",
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
        toast.success("Cart link with your 10% referral discount copied!");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Unable to create or copy shared cart link:", error);
      toast.error("Unable to share this cart. Please try again.");
    }
  };

  const handleRemove = (localId: string) => {
    setRemovingId(localId);
    removeItem(localId);
    setRemovingId(null);
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
              key={item.localId}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
            >
              <GlassCard className={cn("p-4 transition-opacity", removingId === item.localId && "opacity-50")}>
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/product/${item.product.slug}`} className="shrink-0">
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-sm overflow-hidden bg-secondary">
                      <img
                        src={item.product.images[0] ?? ""}
                        alt={item.product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <Link to={`/product/${item.product.slug}`}>
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {item.size !== "Custom" && (
                        <span>Size: <span className="text-foreground font-medium">{item.size}</span></span>
                      )}
                      {item.color !== "Custom" && (
                        <span>Color: <span className="text-foreground font-medium">{item.color}</span></span>
                      )}
                      {item.customAttributes?.map((attribute) => (
                        <span key={attribute.name}>
                          {attribute.name}: <span className="text-foreground font-medium">{attribute.value}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-base font-black text-primary">
                      Ksh {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    {item.product.comparePrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        Ksh {(item.product.comparePrice * item.quantity).toFixed(2)}
                      </p>
                    )}

                    {/* Bottom actions */}
                    <div className="flex items-center gap-3 pt-1">
                      {/* Qty controls */}
                      <div className="flex items-center border border-border rounded-sm">
                        <button
                          onClick={async () => {
                            if (await requireAuth("change your cart")) {
                              updateQuantity(item.localId, item.quantity - 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={async () => {
                            if (await requireAuth("change your cart")) {
                              updateQuantity(item.localId, item.quantity + 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={async () => {
                          if (await requireAuth("change your cart")) {
                            handleRemove(item.localId);
                          }
                        }}
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
          <div className="flex items-center justify-between gap-3">
            <h2
              className="text-lg font-black uppercase tracking-widest"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Order Summary
            </h2>
            <button
              type="button"
              onClick={handleShareCart}
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary hover:text-accent transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share Cart
            </button>
          </div>

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
                  onChange={(e) => {
                    const value = e.target.value;
                    setCouponInput(value);
                    if (!isAuthenticated) {
                      if (value.trim()) {
                        window.sessionStorage.setItem(
                          PENDING_PROMO_KEY,
                          value.trim().toUpperCase(),
                        );
                      } else {
                        window.sessionStorage.removeItem(PENDING_PROMO_KEY);
                      }
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                  placeholder="Enter code"
                  className="flex-1 bg-secondary border border-border px-3 py-2 text-sm rounded-sm outline-none focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-secondary border border-border rounded-sm text-xs font-bold uppercase tracking-widest hover:border-primary hover:text-primary transition-all cursor-pointer whitespace-nowrap"
                >
                  Apply
                </button>
              </div>
              {pendingReferralCode && !isAuthenticated && (
                <p className="text-[10px] text-muted-foreground">
                  Sign in to verify and apply this referral code.
                </p>
              )}
              {!pendingReferralCode && !appliedCoupon && (
                <p className="text-[10px] text-muted-foreground">
                  Have a referral code? It gives a new customer 10% off.
                </p>
              )}
            </div>
          ) : (
            <>
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-sm">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">{appliedCoupon.label}</span>
                <span className="text-muted-foreground">applied</span>
              </div>
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setPendingReferralCode("");
                  setCouponInput("");
                  window.sessionStorage.removeItem(PENDING_PROMO_KEY);
                  setSearchParams((current) => {
                    const updated = new URLSearchParams(current);
                    updated.delete("promo");
                    return updated;
                  }, { replace: true });
                }}
                className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                aria-label="Remove promo code"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {appliedCoupon.referral && referralIsValid && (
              <p className="text-[10px] text-accent">
                10% off your first order. This referral code can be used once.
              </p>
            )}
            </>
          )}

          <div className="space-y-3">
            <NeonButton
              fullWidth
              size="lg"
              onClick={async () => {
                if (appliedCoupon?.referral && !referralIsValid) {
                  toast.error(referralCheck?.reason ?? "Please wait while your referral code is checked.");
                  return;
                }
                if (await requireAuth("check out")) {
                  const promoCode = appliedCoupon?.label;
                  navigate(
                    promoCode
                      ? `/checkout?promo=${encodeURIComponent(promoCode)}`
                      : "/checkout",
                  );
                }
              }}
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
        <CartContent />
      </div>
    </div>
  );
}

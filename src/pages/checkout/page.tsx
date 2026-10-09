import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import NeonButton from "@/components/neon-button.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Smartphone, CreditCard, ArrowRight, CheckCircle2, XCircle, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useGuestCart } from "@/components/providers/guest-cart.tsx";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

const DELIVERY_FEE = 9.99;
const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 20; // ~80 seconds

// ---------------------------------------------------------------------------
// M-Pesa status modal
// ---------------------------------------------------------------------------

type MpesaStatus = "waiting" | "success" | "failed" | "timeout";

function MpesaStatusModal({
  status,
  phone,
  amount,
  receiptNumber,
  onRetry,
  onClose,
}: {
  status: MpesaStatus;
  phone: string;
  amount: number;
  receiptNumber?: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-sm"
      >
        <GlassCard glow="purple" className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === "waiting" && (
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
            )}
            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <CheckCircle2 className="w-20 h-20 text-green-400" />
              </motion.div>
            )}
            {(status === "failed" || status === "timeout") && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <XCircle className="w-20 h-20 text-destructive" />
              </motion.div>
            )}
          </div>

          {/* Text */}
          {status === "waiting" && (
            <>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Check Your Phone
                </h2>
                <p className="text-sm text-muted-foreground">
                  An M-Pesa STK Push has been sent to
                </p>
                <p className="text-primary font-bold mt-1">{phone}</p>
              </div>
              <div className="bg-secondary/50 rounded-sm p-4 space-y-1 text-sm">
                <p className="text-muted-foreground">Amount to pay</p>
                <p className="text-2xl font-black text-primary" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Ksh {amount.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Loader2 className="w-3 h-3 animate-spin" />
                Waiting for payment confirmation...
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest mb-2 text-green-400" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Payment Received!
                </h2>
                <p className="text-sm text-muted-foreground">Your order has been confirmed.</p>
                {receiptNumber && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Receipt: <span className="text-foreground font-mono">{receiptNumber}</span>
                  </p>
                )}
              </div>
              <NeonButton onClick={onClose} fullWidth>
                View Order <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </>
          )}

          {status === "failed" && (
            <>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest mb-2 text-destructive" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Payment Failed
                </h2>
                <p className="text-sm text-muted-foreground">
                  The payment was cancelled or declined. Please try again.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <NeonButton onClick={onRetry} fullWidth>
                  Try Again
                </NeonButton>
                <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            </>
          )}

          {status === "timeout" && (
            <>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Request Timed Out
                </h2>
                <p className="text-sm text-muted-foreground">
                  No response received. If you completed the payment, your order will update shortly.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <NeonButton onClick={onRetry} fullWidth>
                  Try Again
                </NeonButton>
                <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Go Back
                </button>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout form
// ---------------------------------------------------------------------------

function CheckoutContent() {
  const { items: cartItems, clearCart } = useGuestCart();
  const createOrder = useMutation(api.orders.createOrder);
  const initiateStkPush = useAction(api.mpesa.initiateStkPush);
  const queryStkStatus = useAction(api.mpesa.queryStkStatus);
  const initializePaystack = useAction(api.paystack.initializeTransaction);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const promoCode = searchParams.get("promo")?.trim().toUpperCase() || undefined;
  const isReferralPromo =
    !!promoCode && promoCode !== "CYBER40" && promoCode !== "PD20";
  const referralCheck = useQuery(
    api.referrals.checkCode,
    isReferralPromo && promoCode ? { code: promoCode } : "skip",
  );

  const [form, setForm] = useState({
    fullName: "", phone: "", location: "", destination: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paystack">("mpesa");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // M-Pesa status modal state
  const [mpesaModal, setMpesaModal] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("waiting");
  const [currentOrderId, setCurrentOrderId] = useState<Id<"orders"> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Captured order total (used in modals after cart is cleared)
  const [capturedTotal, setCapturedTotal] = useState(0);

  const subtotal = (cartItems ?? []).reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );
  const promoPercent =
    promoCode === "CYBER40"
      ? 0.1
      : promoCode === "PD20"
        ? 0.2
        : referralCheck?.valid
          ? referralCheck.discountPercent / 100
          : 0;
  const promoDiscount = Math.round(subtotal * promoPercent * 100) / 100;
  const total = subtotal - promoDiscount + DELIVERY_FEE;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ---------------------------------------------------------------------------
  // M-Pesa Polling
  // ---------------------------------------------------------------------------
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  };

  const startPolling = (reqId: string) => {
    stopPolling();
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > POLL_MAX_ATTEMPTS) {
        stopPolling();
        setMpesaStatus("timeout");
        return;
      }
      try {
        const result = await queryStkStatus({ checkoutRequestId: reqId });
        if (result.resultCode === "0") {
          stopPolling();
          setMpesaStatus("success");
          return;
        }
        const failCodes = ["1032", "1037", "1", "17", "2001"];
        if (failCodes.includes(result.resultCode)) {
          stopPolling();
          setMpesaStatus("failed");
          return;
        }
      } catch {
        // Ignore transient errors and keep polling
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartItems || cartItems.length === 0) { toast.error("Your cart is empty"); return; }
    for (const [key, val] of Object.entries(form)) {
      if (!val) { toast.error(`Please fill in ${key}`); return; }
    }
    if (paymentMethod === "paystack" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address for Paystack");
      return;
    }

    const items = (cartItems ?? []).map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
      ...(item.customAttributes ? { customAttributes: item.customAttributes } : {}),
    }));

    setLoading(true);

    try {
      const order = await createOrder({
        paymentMethod,
        shippingAddress: form,
        items,
        ...(promoCode ? { promoCode } : {}),
      });
      setCurrentOrderId(order.orderId);
      setCapturedTotal(order.total);

      if (paymentMethod === "paystack") {
        const result = await initializePaystack({
          orderId: order.orderId,
          email: email.trim(),
          amount: order.total,
          callbackUrl: `${window.location.origin}/order/confirm?orderId=${encodeURIComponent(order.orderId)}`,
        });
        await clearCart();
        window.location.assign(result.authorizationUrl);
        return;
      }

      const result = await initiateStkPush({
        orderId: order.orderId,
        phone: form.phone,
        amount: order.total,
      });
      setMpesaStatus("waiting");
      setMpesaModal(true);
      startPolling(result.checkoutRequestId);
      await clearCart();
      setLoading(false);
      return;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaModalClose = () => {
    stopPolling();
    setMpesaModal(false);
    if (mpesaStatus === "success" && currentOrderId) {
      navigate(`/order/confirm?orderId=${currentOrderId}`);
    }
  };

  const handleMpesaRetry = () => {
    stopPolling();
    setMpesaModal(false);
    setMpesaStatus("waiting");
  };

  return (
    <>
      <AnimatePresence>
        {mpesaModal && (
          <MpesaStatusModal
            status={mpesaStatus}
            phone={form.phone}
            amount={capturedTotal}
            onRetry={handleMpesaRetry}
            onClose={handleMpesaModalClose}
          />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <GlassCard className="p-6">
              <h2
                className="text-lg font-black uppercase tracking-widest mb-5"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Shipping Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "fullName", label: "Full Name", placeholder: "John Smith", col: 2 },
                  { name: "phone", label: "Phone Number", placeholder: "+254 7XX XXX XXX" },
                  { name: "location", label: "Location", placeholder: "Nairobi" },
                  { name: "destination", label: "Shipping Destination", placeholder: "Building, estate, or delivery point", col: 2 },
                ].map(({ name, label, placeholder, col }) => (
                  <div key={name} className={cn(col === 2 ? "md:col-span-2" : "")}>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                      {label}
                    </label>
                    <input
                      name={name}
                      value={form[name as keyof typeof form]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
                    />
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Payment */}
            <GlassCard className="p-6">
              <h2
                className="text-lg font-black uppercase tracking-widest mb-5"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Payment Method
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={paymentMethod === "mpesa"}
                  onClick={() => setPaymentMethod("mpesa")}
                  className={cn(
                    "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                    paymentMethod === "mpesa"
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/40 border-border hover:border-primary/30",
                  )}
                >
                  <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <span className="font-bold text-primary mb-1 block">M-Pesa</span>
                    <span className="text-xs text-muted-foreground">Send an STK Push to your phone.</span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={paymentMethod === "paystack"}
                  onClick={() => setPaymentMethod("paystack")}
                  className={cn(
                    "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                    paymentMethod === "paystack"
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/40 border-border hover:border-primary/30",
                  )}
                >
                  <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">
                    <span className="font-bold text-primary mb-1 block">Paystack</span>
                    <span className="text-xs text-muted-foreground">Pay securely by card or other available methods.</span>
                  </span>
                </button>
              </div>
              {paymentMethod === "paystack" && (
                <div className="mt-4">
                  <label htmlFor="payment-email" className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
                    Email Address
                  </label>
                  <input
                    id="payment-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    You’ll be redirected to Paystack to complete your payment.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Summary */}
          <div>
            <GlassCard glow="purple" className="p-6 space-y-4 sticky top-24">
              <h2
                className="text-lg font-black uppercase tracking-widest"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                Order Summary
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(cartItems ?? []).map((item) => (
                  <div key={item.localId} className="flex gap-3 items-center">
                    <img
                      src={item.product.images[0] ?? ""}
                      alt=""
                      className="w-12 h-14 object-cover rounded-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.size !== "Custom" ? `Size ${item.size}` : null,
                          item.color !== "Custom" ? `Color ${item.color}` : null,
                          ...(item.customAttributes ?? []).map(
                            (attribute) => `${attribute.name}: ${attribute.value}`,
                          ),
                          `x${item.quantity}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-primary">
                      Ksh {(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-border/50 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Ksh {subtotal.toFixed(2)}</span>
                </div>
                {promoCode && promoPercent > 0 && (
                  <div className="flex justify-between text-[oklch(0.72_0.2_330)]">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {promoCode} ({promoPercent * 100}% off)
                    </span>
                    <span>-Ksh {promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>Ksh {DELIVERY_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">Ksh {total.toFixed(2)}</span>
                </div>
              </div>
              {isReferralPromo && referralCheck && !referralCheck.valid && (
                <p className="text-xs text-destructive" role="alert">
                  {referralCheck.reason}
                </p>
              )}
              <NeonButton
                type="submit"
                fullWidth
                disabled={loading || (isReferralPromo && referralCheck?.valid !== true)}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {paymentMethod === "mpesa" ? "Sending prompt..." : "Preparing payment..."}
                  </>
                ) : (
                  <>
                    {paymentMethod === "mpesa" ? (
                      <>Pay with M-Pesa <Smartphone className="w-4 h-4" /></>
                    ) : (
                      <>Continue to Paystack <CreditCard className="w-4 h-4" /></>
                    )}
                  </>
                )}
              </NeonButton>
            </GlassCard>
          </div>
        </div>
      </form>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1
          className="text-3xl font-black uppercase mb-8"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          Checkout
        </h1>
        <AuthLoading>
          <Skeleton className="h-96 w-full" />
        </AuthLoading>
        <Authenticated>
          <CheckoutContent />
        </Authenticated>
        <Unauthenticated>
          <div className="max-w-lg mx-auto text-center space-y-5 py-16">
            <h2 className="text-2xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Sign In to Checkout
            </h2>
            <p className="text-muted-foreground">
              Sign in to place an order and complete your purchase.
            </p>
            <SignInButton className="mx-auto" />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}

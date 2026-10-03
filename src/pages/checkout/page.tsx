import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import NeonButton from "@/components/neon-button.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { CreditCard, Smartphone, Package, ArrowRight, CheckCircle2, XCircle, Loader2, Phone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useAuth } from "@/hooks/use-auth.ts";

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
// Paystack status modal
// ---------------------------------------------------------------------------

function PaystackModal({
  authorizationUrl,
  onVerify,
  onClose,
  verifying,
}: {
  authorizationUrl: string;
  onVerify: () => void;
  onClose: () => void;
  verifying: boolean;
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
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center bg-primary/10">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-2" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Complete Payment
            </h2>
            <p className="text-sm text-muted-foreground">
              Click the button below to open the secure Paystack payment page. After completing your payment, return here and click "I've Paid".
            </p>
          </div>
          <a
            href={authorizationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-sm bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Pay with Paystack <ExternalLink className="w-4 h-4" />
          </a>
          <NeonButton onClick={onVerify} fullWidth disabled={verifying}>
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                I&apos;ve Paid <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </NeonButton>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout form
// ---------------------------------------------------------------------------

function CheckoutContent() {
  const { user } = useAuth();
  const cartItems = useQuery(api.cart.getCart);
  const createOrder = useMutation(api.orders.createOrder);
  const clearCart = useMutation(api.cart.clearCart);
  const initiateStkPush = useAction(api.mpesa.initiateStkPush);
  const queryStkStatus = useAction(api.mpesa.queryStkStatus);
  const initializePaystack = useAction(api.paystack.initializeTransaction);
  const verifyPaystack = useAction(api.paystack.verifyTransaction);
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "mpesa" | "paystack" | "cod">("mpesa");
  const [form, setForm] = useState({
    fullName: "", phone: "", address: "", city: "", country: "", postalCode: "",
  });
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // M-Pesa status modal state
  const [mpesaModal, setMpesaModal] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("waiting");
  const [currentOrderId, setCurrentOrderId] = useState<Id<"orders"> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  // Captured order total (used in modals after cart is cleared)
  const [capturedTotal, setCapturedTotal] = useState(0);

  // Paystack modal state
  const [paystackModal, setPaystackModal] = useState(false);
  const [paystackAuthUrl, setPaystackAuthUrl] = useState("");
  const [paystackReference, setPaystackReference] = useState("");
  const [paystackVerifying, setPaystackVerifying] = useState(false);

  const subtotal = (cartItems ?? []).reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );
  const total = subtotal + DELIVERY_FEE;

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
  // Paystack verify
  // ---------------------------------------------------------------------------
  const handlePaystackVerify = async () => {
    if (!paystackReference || !currentOrderId) return;
    setPaystackVerifying(true);
    try {
      const result = await verifyPaystack({ reference: paystackReference });
      if (result.status === "success") {
        setPaystackModal(false);
        toast.success("Payment confirmed!");
        navigate(`/order/confirm?orderId=${currentOrderId}`);
      } else {
        toast.error("Payment not confirmed yet. Please complete the payment and try again.");
      }
    } catch {
      toast.error("Could not verify payment. Please try again.");
    } finally {
      setPaystackVerifying(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartItems || cartItems.length === 0) { toast.error("Your cart is empty"); return; }
    for (const [key, val] of Object.entries(form)) {
      if (!val) { toast.error(`Please fill in ${key}`); return; }
    }

    const items = (cartItems ?? []).map((item) => ({
      productId: item.productId,
      productName: item.product?.name ?? "",
      productImage: item.product?.images[0] ?? "",
      price: item.product?.price ?? 0,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    }));

    setLoading(true);

    try {
      // --- M-Pesa ---
      if (paymentMethod === "mpesa") {
        const phone = mpesaPhone || form.phone;
        if (!phone) { toast.error("Please enter your M-Pesa phone number"); setLoading(false); return; }

        const orderId = await createOrder({
          subtotal,
          deliveryFee: DELIVERY_FEE,
          discount: 0,
          total,
          paymentMethod: "mpesa",
          shippingAddress: form,
          items,
        });

        setCurrentOrderId(orderId);
        setCapturedTotal(total);

        const result = await initiateStkPush({ orderId, phone, amount: total });
        setMpesaStatus("waiting");
        setMpesaModal(true);
        startPolling(result.checkoutRequestId);
        await clearCart();
        setLoading(false);
        return;
      }

      // --- Paystack ---
      if (paymentMethod === "paystack") {
        const email = user?.profile.email ?? "";
        if (!email) { toast.error("Your account email is required for Paystack payment"); setLoading(false); return; }

        const orderId = await createOrder({
          subtotal,
          deliveryFee: DELIVERY_FEE,
          discount: 0,
          total,
          paymentMethod: "paystack",
          shippingAddress: form,
          items,
        });

        setCurrentOrderId(orderId);

        const callbackUrl = `${window.location.origin}/order/confirm?orderId=${orderId}`;
        const result = await initializePaystack({ orderId, email, amount: total, callbackUrl });

        setPaystackAuthUrl(result.authorizationUrl);
        setPaystackReference(result.reference);
        setPaystackModal(true);
        await clearCart();
        setLoading(false);
        return;
      }

      // --- COD / Stripe ---
      const orderId = await createOrder({
        subtotal,
        deliveryFee: DELIVERY_FEE,
        discount: 0,
        total,
        paymentMethod,
        shippingAddress: form,
        items,
      });
      await clearCart();
      navigate(`/order/confirm?orderId=${orderId}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order. Please try again.");
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
            phone={mpesaPhone || form.phone}
            amount={capturedTotal}
            onRetry={handleMpesaRetry}
            onClose={handleMpesaModalClose}
          />
        )}
        {paystackModal && (
          <PaystackModal
            authorizationUrl={paystackAuthUrl}
            onVerify={handlePaystackVerify}
            onClose={() => setPaystackModal(false)}
            verifying={paystackVerifying}
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
                  { name: "address", label: "Address", placeholder: "123 Cyber Street", col: 2 },
                  { name: "city", label: "City", placeholder: "Nairobi" },
                  { name: "country", label: "Country", placeholder: "Kenya" },
                  { name: "postalCode", label: "Postal Code", placeholder: "00100" },
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "mpesa" as const, icon: Smartphone, label: "M-Pesa", sub: "STK Push" },
                  { id: "paystack" as const, icon: CreditCard, label: "Paystack", sub: "Card / Bank" },
                  { id: "stripe" as const, icon: CreditCard, label: "Credit Card", sub: "Powered by Stripe" },
                  { id: "cod" as const, icon: Package, label: "Cash on Delivery", sub: "Pay on arrival" },
                ].map(({ id, icon: Icon, label, sub }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={cn(
                      "p-4 rounded-sm border-2 text-left transition-all cursor-pointer",
                      paymentMethod === id
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "border-border hover:border-border/80",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 mb-2",
                        paymentMethod === id ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </button>
                ))}
              </div>

              {/* M-Pesa extra field */}
              <AnimatePresence>
                {paymentMethod === "mpesa" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-sm p-4">
                        <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-bold text-primary mb-1">How M-Pesa STK Push works</p>
                          <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-xs">
                            <li>Enter your Safaricom M-Pesa number below</li>
                            <li>Click "Place Order" — a payment prompt will appear on your phone</li>
                            <li>Enter your M-Pesa PIN to confirm</li>
                            <li>Your order is automatically confirmed on success</li>
                          </ol>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Phone className="w-3 h-3" />
                          M-Pesa Phone Number
                          <span className="text-muted-foreground/50">(leave blank to use shipping phone)</span>
                        </label>
                        <input
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="e.g. 0712 345 678 or 254712345678"
                          className="w-full bg-secondary border border-border rounded-sm px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Paystack info */}
              <AnimatePresence>
                {paymentMethod === "paystack" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5">
                      <div className="flex items-start gap-3 bg-primary/10 border border-primary/30 rounded-sm p-4">
                        <CreditCard className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-bold text-primary mb-1">How Paystack works</p>
                          <ol className="text-muted-foreground space-y-1 list-decimal list-inside text-xs">
                            <li>Click "Pay with Paystack" — you'll be redirected to the secure payment page</li>
                            <li>Pay with your card, bank transfer, or mobile money</li>
                            <li>Return here and click "I've Paid" to confirm your order</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {paymentMethod === "stripe" && (
                <p className="mt-4 text-xs text-muted-foreground border border-border/50 rounded-sm p-3">
                  Stripe payment integration will be configured with your Stripe keys.
                </p>
              )}
              {paymentMethod === "cod" && (
                <p className="mt-4 text-xs text-muted-foreground border border-border/50 rounded-sm p-3">
                  Pay in cash when your order is delivered to your door.
                </p>
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
                  <div key={item._id} className="flex gap-3 items-center">
                    <img
                      src={item.product?.images[0] ?? ""}
                      alt=""
                      className="w-12 h-14 object-cover rounded-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.size} · {item.color} · x{item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-primary">
                      Ksh {((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t border-border/50 pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Ksh {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>Ksh {DELIVERY_FEE.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">Ksh {total.toFixed(2)}</span>
                </div>
              </div>
              {paymentMethod === "mpesa" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-sm p-3">
                  <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" />
                  M-Pesa STK Push will be sent to your phone
                </div>
              )}
              {paymentMethod === "paystack" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-sm p-3">
                  <CreditCard className="w-3.5 h-3.5 text-primary shrink-0" />
                  You'll be redirected to Paystack to complete payment
                </div>
              )}
              <NeonButton type="submit" fullWidth disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {paymentMethod === "paystack" ? "Preparing..." : "Sending prompt..."}
                  </>
                ) : paymentMethod === "mpesa" ? (
                  <>
                    Pay with M-Pesa <Smartphone className="w-4 h-4" />
                  </>
                ) : paymentMethod === "paystack" ? (
                  <>
                    Continue to Paystack <ExternalLink className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Place Order <ArrowRight className="w-4 h-4" />
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
        <Authenticated>
          <CheckoutContent />
        </Authenticated>
        <Unauthenticated>
          <div className="text-center py-20">
            <h2 className="text-xl font-bold mb-4">Sign in to checkout</h2>
            <SignInButton className="px-8 py-3 bg-primary text-primary-foreground rounded-sm font-bold uppercase tracking-widest" />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}



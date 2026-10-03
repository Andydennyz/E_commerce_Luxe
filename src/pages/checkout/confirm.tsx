import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAction } from "convex/react";
import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { api } from "@/convex/_generated/api.js";
import NeonButton from "@/components/neon-button.tsx";

export default function OrderConfirmPage() {
  const verifyTransaction = useAction(api.paystack.verifyTransaction);
  const reference = new URLSearchParams(window.location.search).get("reference");
  const [verification, setVerification] = useState<"checking" | "success" | "failed" | "none">(
    reference ? "checking" : "none",
  );

  useEffect(() => {
    if (!reference) return;
    let active = true;
    void verifyTransaction({ reference })
      .then((result) => {
        if (active) setVerification(result.status === "success" ? "success" : "failed");
      })
      .catch((error: unknown) => {
        console.error("Paystack return verification failed:", error);
        if (active) setVerification("failed");
      });
    return () => {
      active = false;
    };
  }, [reference, verifyTransaction]);

  const heading =
    verification === "checking"
      ? "VERIFYING PAYMENT..."
      : verification === "success"
        ? "PAYMENT CONFIRMED!"
        : verification === "failed"
          ? "PAYMENT NOT CONFIRMED"
          : "ORDER PLACED!";

  return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.7, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
        >
          <CheckCircle className="w-12 h-12 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-black uppercase mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent" style={{ fontFamily: "Orbitron, sans-serif" }}>
          {heading}
        </h1>
        <p className="text-muted-foreground mb-3">
          {verification === "checking"
            ? "We’re confirming your Paystack payment. Please wait."
            : verification === "success"
              ? "Your Paystack payment is confirmed and your order is being processed."
              : verification === "failed"
                ? "We couldn’t confirm this Paystack payment. If you completed it, contact us with your order reference."
                : "Your order has been received. Keep your order reference for any questions."}
        </p>
        <p className="font-mono text-xs text-muted-foreground mb-6">
          Order reference: {new URLSearchParams(window.location.search).get("orderId") ?? "unavailable"}
        </p>
        <div className="flex justify-center">
          <Link to="/shop">
            <NeonButton>
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </NeonButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

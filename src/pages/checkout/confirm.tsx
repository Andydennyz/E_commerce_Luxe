import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import NeonButton from "@/components/neon-button.tsx";

export default function OrderConfirmPage() {
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
          ORDER PLACED!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your order has been confirmed. We'll send you updates as it progresses.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/profile">
            <NeonButton variant="ghost">
              <Package className="w-4 h-4" /> Track Order
            </NeonButton>
          </Link>
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

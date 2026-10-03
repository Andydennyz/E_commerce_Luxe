import { cn } from "@/lib/utils.ts";
import { motion } from "motion/react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type NeonButtonVariant = "purple" | "blue" | "pink" | "ghost";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NeonButtonVariant;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const variantStyles: Record<NeonButtonVariant, string> = {
  purple:
    "bg-primary text-primary-foreground border border-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)]",
  blue: "bg-accent text-accent-foreground border border-accent/50 shadow-[0_0_20px_rgba(96,165,250,0.4)] hover:shadow-[0_0_35px_rgba(96,165,250,0.7)]",
  pink: "bg-[oklch(0.72_0.2_330)] text-white border border-[oklch(0.72_0.2_330)]/50 shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(236,72,153,0.7)]",
  ghost:
    "bg-transparent text-foreground border border-border hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = "purple", size = "md", fullWidth, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-sm font-semibold uppercase tracking-widest transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...(props as Parameters<typeof motion.button>[0])}
      >
        {children}
      </motion.button>
    );
  },
);
NeonButton.displayName = "NeonButton";

export default NeonButton;

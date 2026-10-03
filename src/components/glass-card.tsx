import { cn } from "@/lib/utils.ts";
import type { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "purple" | "blue" | "pink" | "none";
}

export default function GlassCard({ className, glow = "none", children, ...props }: GlassCardProps) {
  const glowStyles = {
    purple: "border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.15)]",
    blue: "border-accent/30 shadow-[0_0_30px_rgba(96,165,250,0.15)]",
    pink: "border-[oklch(0.72_0.2_330)]/30 shadow-[0_0_30px_rgba(236,72,153,0.15)]",
    none: "border-border/50",
  };

  return (
    <div
      className={cn(
        "relative rounded-md border backdrop-blur-md bg-card/60",
        glowStyles[glow],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

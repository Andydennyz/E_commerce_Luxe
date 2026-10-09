import { Link } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  AtSign,
  MessageCircle,
  Users,
  PlayCircle,
  Video,
  ShoppingBag,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/use-require-auth.ts";
import { api } from "@/convex/_generated/api.js";

const SOCIAL_ICONS = {
  Instagram: AtSign,
  Facebook: Users,
  YouTube: PlayCircle,
  X: Zap,
  TikTok: Video,
  LinkedIn: ShoppingBag,
  Pinterest: Globe,
  WhatsApp: MessageCircle,
} as const;

const footerLinks = {
  Shop: [
    { label: "Featured", href: "/featured" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Trending", href: "/trending" },
    { label: "Collections", href: "/collections" },
    { label: "Sale", href: "/shop?sale=true" },
  ],
  Support: [
    { label: "FAQ", href: "/faq" },
    { label: "Shipping", href: "/shipping" },
    { label: "Returns", href: "/returns" },
    { label: "Contact", href: "/contact" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const { requireAuth } = useRequireAuth();
  const socialLinks = useQuery(api.about.listSocialLinks);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await requireAuth("subscribe"))) return;
    if (email) {
      toast.success("Subscribed! Welcome to the future of fashion.");
      setEmail("");
    }
  };

  return (
    <footer className="bg-card/40 border-t border-border/50 mt-auto">
      {/* Newsletter */}
      <div className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3
                className="text-2xl font-bold uppercase tracking-widest text-primary mb-1"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                JOIN THE FUTURE
              </h3>
              <p className="text-muted-foreground text-sm">
                Subscribe for exclusive drops, early access, and neon deals.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full md:w-auto gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 md:w-72 bg-secondary border border-border focus:border-primary px-4 py-3 text-sm rounded-sm outline-none transition-all text-foreground placeholder-muted-foreground"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-sm text-sm font-semibold uppercase tracking-widest flex items-center gap-2 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all cursor-pointer"
              >
                Subscribe <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" fill="currentColor" />
              <span
                className="text-xl font-black uppercase tracking-[0.2em] bg-gradient-to-r from-primary via-accent to-[oklch(0.72_0.2_330)] bg-clip-text text-transparent"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                PD STORES
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              The future of fashion. Where cyberpunk aesthetics meet luxury streetwear.
            </p>
            <div className="flex gap-4">
              {(socialLinks ?? [])
                .filter((link) => link.active)
                .map((link) => {
                  const Icon = SOCIAL_ICONS[link.platform];
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit PD Stores on ${link.platform}`}
                      className="w-9 h-9 rounded-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PD STORES. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Designed for the future. Built with ❤ for fashion.
          </p>
        </div>
      </div>
    </footer>
  );
}

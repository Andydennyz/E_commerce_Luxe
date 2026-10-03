import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Zap, Shield, RefreshCw, Globe, ArrowRight, Star } from "lucide-react";
import GlassCard from "@/components/glass-card.tsx";

const TEAM = [
  {
    name: "Priya Doshi",
    role: "Founder & Creative Director",
    bio: "Visionary behind PD Stores, blending high fashion with tech culture.",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
  },
  {
    name: "Kai Nakamura",
    role: "Head of Design",
    bio: "Crafts every visual experience with precision and purpose.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    name: "Aisha Okonkwo",
    role: "Product Curator",
    bio: "Identifies emerging trends before they hit the mainstream.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop",
  },
];

const VALUES = [
  { icon: Zap, title: "Bold by Design", desc: "We push boundaries with every collection, never settling for ordinary." },
  { icon: Shield, title: "Quality First", desc: "Every product is vetted for materials, craftsmanship, and longevity." },
  { icon: RefreshCw, title: "Sustainable Future", desc: "Conscious sourcing and packaging that respects the planet." },
  { icon: Globe, title: "Global Community", desc: "Connecting fashion-forward minds across continents." },
];

const STATS = [
  { value: "50K+", label: "Happy Customers" },
  { value: "200+", label: "Unique Products" },
  { value: "40+", label: "Countries Served" },
  { value: "4.9★", label: "Average Rating" },
];

export default function AboutPage() {
  return (
    <div className="pt-20 min-h-screen">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center relative">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-4"
          >
            Est. 2024
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Wear the{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Future
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            PD Stores is more than a clothing brand — it&apos;s a cultural movement. We create
            garments for those who live at the intersection of fashion, technology, and rebellion.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p
                  className="text-3xl font-black text-primary mb-1"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-3">Our Story</p>
            <h2
              className="text-3xl md:text-4xl font-black uppercase mb-6 leading-tight"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              Born from the<br />Digital Underground
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                PD Stores was born in 2024 from a simple frustration: fashion that spoke the
                language of the digital generation didn&apos;t exist — so we built it.
              </p>
              <p>
                Our collections draw from cyber aesthetics, streetwear culture, and high-end
                craftsmanship. Each piece is designed to make a statement — not just about what
                you wear, but who you are.
              </p>
              <p>
                Today we serve customers across 40+ countries, with a community of rebels,
                creators, and dreamers who believe clothes are armor.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md blur-xl" />
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
              alt="PD Stores studio"
              className="relative w-full aspect-square object-cover rounded-md border border-border/50"
            />
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-3">What We Stand For</p>
            <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>Our Values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="p-6 h-full space-y-3">
                  <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-bold uppercase tracking-wider text-sm">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-3">The People</p>
            <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>Meet the Team</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard glow={i === 0 ? "purple" : i === 1 ? "blue" : "pink"} className="p-6 text-center space-y-4">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-20 h-20 rounded-full border-2 border-primary/40 mx-auto object-cover shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  />
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider">{member.name}</p>
                    <p className="text-xs text-primary mt-0.5">{member.role}</p>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{member.bio}</p>
                  </div>
                  <div className="flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-[oklch(0.75_0.15_60)] text-[oklch(0.75_0.15_60)]" />
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50 text-center">
        <div className="max-w-xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
            Ready to Join the Movement?
          </h2>
          <p className="text-muted-foreground">
            Explore our latest collections and find pieces that define your identity.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-sm hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all"
          >
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

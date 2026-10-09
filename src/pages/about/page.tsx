import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Zap, Shield, RefreshCw, Globe, ArrowRight, Star } from "lucide-react";
import { useQuery } from "convex/react";
import GlassCard from "@/components/glass-card.tsx";
import { api } from "@/convex/_generated/api.js";
import { DEFAULT_ABOUT_CONTENT, DEFAULT_TEAM_MEMBERS } from "@/lib/about-defaults.ts";

export default function AboutPage() {
  const storedContent = useQuery(api.about.getContent);
  const storedTeam = useQuery(api.about.listTeamMembers);
  const aboutContent = storedContent?.content;
  const content = { ...DEFAULT_ABOUT_CONTENT, ...aboutContent };
  const team = storedContent?.teamInitialized
    ? storedTeam ?? []
    : DEFAULT_TEAM_MEMBERS.map((member, order) => ({ ...member, order }));
  const valueIcons = [Zap, Shield, RefreshCw, Globe];

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
            {content.heroEyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            {content.heroTitle}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {content.heroAccent}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            {content.heroIntro}
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
            {content.stats.map((stat, i) => (
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
            <p className="text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-3">{content.storyEyebrow}</p>
            <h2
              className="text-3xl md:text-4xl font-black uppercase mb-6 leading-tight"
              style={{ fontFamily: "Orbitron, sans-serif" }}
            >
              {content.storyTitle.split("\n").map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {content.storyParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>{paragraph}</p>
              ))}
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
              src={aboutContent?.storyImageUrl ?? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"}
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
            {content.values.map(({ title, description }, i) => {
              const Icon = valueIcons[i % valueIcons.length];
              return (
              <motion.div
                key={`${i}-${title}`}
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
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </GlassCard>
              </motion.div>
              );
            })}
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
            {team.map((member, i) => {
              const imageUrl =
                member.imageUrl ?? DEFAULT_TEAM_MEMBERS[member.order]?.imageUrl;
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard glow={i === 0 ? "purple" : i === 1 ? "blue" : "pink"} className="p-6 text-center space-y-4">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={member.name}
                        className="w-20 h-20 rounded-full border-2 border-primary/40 mx-auto object-cover shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                      />
                    ) : (
                      <div
                        aria-label={`${member.name} photo`}
                        className="w-20 h-20 rounded-full border-2 border-primary/40 mx-auto flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold"
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
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
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50 text-center">
        <div className="max-w-xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {content.ctaTitle}
          </h2>
          <p className="text-muted-foreground">
            {content.ctaDescription}
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

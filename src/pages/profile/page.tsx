import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, AnimatePresence } from "motion/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Package,
  User,
  MapPin,
  Clock,
  Settings,
  ShoppingBag,
  Phone,
  Mail,
  Shield,
  Check,
  Edit2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useState } from "react";
import { toast } from "sonner";

const ORDER_STATUS_BG: Record<string, string> = {
  pending: "bg-[oklch(0.75_0.15_60)]/10 border-[oklch(0.75_0.15_60)]/30",
  confirmed: "bg-accent/10 border-accent/30",
  processing: "bg-primary/10 border-primary/30",
  shipped: "bg-accent/10 border-accent/30",
  delivered: "bg-[oklch(0.7_0.18_190)]/10 border-[oklch(0.7_0.18_190)]/30",
  cancelled: "bg-destructive/10 border-destructive/30",
};

type Tab = "overview" | "orders" | "settings";

function ProfileContent() {
  const user = useQuery(api.users.getCurrentUser);
  const orders = useQuery(api.orders.getUserOrders);
  const updateProfile = useMutation(api.users.updateProfile);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (user === undefined || orders === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const paidOrders = (orders ?? []).filter((o) => o.paymentStatus === "paid");
  const totalSpent = paidOrders.reduce((s, o) => s + o.total, 0);

  const startEdit = () => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setEditing(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    { id: "orders", label: "Orders", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <GlassCard glow="purple" className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full border-2 border-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <User className="w-10 h-10 text-primary" />
              </div>
            )}
            {user?.role === "admin" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black truncate" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {user?.name ?? "User"}
              </h2>
              {user?.role === "admin" && (
                <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-sm uppercase tracking-widest">
                  Admin
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-1 text-sm text-muted-foreground">
              {user?.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
              )}
              {user?.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-black text-primary" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {orders?.length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-black text-accent" style={{ fontFamily: "Orbitron, sans-serif" }}>
                Ksh {totalSpent.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Spent</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[oklch(0.7_0.18_190)]" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {(orders ?? []).filter((o) => o.status === "delivered").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Delivered</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-200 border-b-2 -mb-px cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Recent Orders */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
                  Recent Orders
                </h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-sm text-primary flex items-center gap-1 hover:underline cursor-pointer"
                >
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {!orders || orders.length === 0 ? (
                <GlassCard className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet. Start shopping!</p>
                </GlassCard>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order, i) => (
                    <motion.div key={order._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2 overflow-hidden">
                            {order.items.slice(0, 2).map((item) => (
                              <img key={item._id} src={item.productImage} alt={item.productName} className="w-12 h-14 object-cover rounded-sm shrink-0" />
                            ))}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs text-muted-foreground">#{order._id.slice(-8).toUpperCase()}</p>
                            <p className="text-sm font-bold truncate">
                              {order.items[0]?.productName}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(order._creationTime).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-primary">Ksh {order.total.toFixed(2)}</p>
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                              ORDER_STATUS_BG[order.status]
                            )}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info Summary */}
            <GlassCard className="p-6 space-y-4">
              <h3 className="text-lg font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>Account Info</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Email</p>
                    <p className="font-medium">{user?.email ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Phone</p>
                    <p className="font-medium">{user?.phone ?? "Not set"}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("settings")}
                className="text-sm text-primary flex items-center gap-1 hover:underline cursor-pointer"
              >
                Edit profile <ChevronRight className="w-3 h-3" />
              </button>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Order History ({orders?.length ?? 0})
            </h3>

            {!orders || orders.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-bold text-lg mb-2">No orders yet</h4>
                <p className="text-muted-foreground text-sm">Your orders will appear here once you make a purchase.</p>
                <a href="/shop" className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-sm font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity">
                  Shop Now
                </a>
              </GlassCard>
            ) : (
              orders.map((order, i) => (
                <motion.div key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <GlassCard className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" />
                          <span className="font-mono text-sm text-muted-foreground">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order._creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm border",
                          ORDER_STATUS_BG[order.status]
                        )}>
                          {order.status}
                        </span>
                        <p className="text-xl font-black text-primary mt-1" style={{ fontFamily: "Orbitron, sans-serif" }}>
                          Ksh {order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {order.items.map((item) => (
                        <div key={item._id} className="shrink-0">
                          <img src={item.productImage} alt={item.productName} className="w-16 h-20 object-cover rounded-sm" />
                          <p className="text-xs text-muted-foreground mt-1 w-16 truncate">{item.productName}</p>
                          <p className="text-xs font-bold">×{item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.shippingAddress.city}, {order.shippingAddress.country}
                      </span>
                      <span className="capitalize">{order.paymentMethod} · {order.paymentStatus}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 max-w-lg"
          >
            <h3 className="text-lg font-black uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>Edit Profile</h3>

            <GlassCard className="p-6 space-y-5">
              {!editing ? (
                <>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Display Name</p>
                      <p className="font-bold">{user?.name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Email</p>
                      <p className="font-bold text-muted-foreground">{user?.email ?? "—"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Email is managed by your sign-in provider</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Phone</p>
                      <p className="font-bold">{user?.phone ?? "Not set"}</p>
                    </div>
                  </div>
                  <Button onClick={startEdit} className="flex items-center gap-2 cursor-pointer" variant="secondary">
                    <Edit2 className="w-4 h-4" /> Edit Details
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-name">Display Name</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      value={user?.email ?? ""}
                      disabled
                      className="bg-background/30 opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Managed by your sign-in provider</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-phone">Phone Number</Label>
                    <Input
                      id="profile-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 cursor-pointer">
                      {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save Changes</>}
                    </Button>
                    <Button variant="ghost" onClick={() => setEditing(false)} className="cursor-pointer">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Account Security Info */}
            <GlassCard className="p-6 space-y-3">
              <h4 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Security
              </h4>
              <p className="text-sm text-muted-foreground">
                Your account is secured through Hercules Auth. Password management and two-factor authentication are handled through the auth portal.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-black uppercase mb-8" style={{ fontFamily: "Orbitron, sans-serif" }}>
          My Account
        </h1>
        <AuthLoading>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </AuthLoading>
        <Authenticated>
          <ProfileContent />
        </Authenticated>
        <Unauthenticated>
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-3 uppercase" style={{ fontFamily: "Orbitron, sans-serif" }}>
              Sign In Required
            </h2>
            <p className="text-muted-foreground mb-6">Sign in to view your profile, orders, and manage your account.</p>
            <SignInButton className="px-8 py-3 bg-primary text-primary-foreground rounded-sm font-bold uppercase tracking-widest cursor-pointer" />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}

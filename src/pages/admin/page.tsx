import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import GlassCard from "@/components/glass-card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  Plus,
  Trash2,
  Edit2,
  X,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Search,
  Shield,
  Check,
  BarChart3,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import NeonButton from "@/components/neon-button.tsx";
import type { Doc, Id } from "@/convex/_generated/dataModel.d.ts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import AdminImageUploader from "@/components/admin-image-uploader.tsx";
import VideosTab from "./_components/videos-tab.tsx";

type AdminTab = "dashboard" | "orders" | "products" | "users" | "categories" | "videos";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "text-[oklch(0.75_0.15_60)] bg-[oklch(0.75_0.15_60)]/10 border-[oklch(0.75_0.15_60)]/30",
  confirmed: "text-accent bg-accent/10 border-accent/30",
  processing: "text-primary bg-primary/10 border-primary/30",
  shipped: "text-[oklch(0.72_0.2_220)] bg-[oklch(0.72_0.2_220)]/10 border-[oklch(0.72_0.2_220)]/30",
  delivered: "text-[oklch(0.7_0.18_190)] bg-[oklch(0.7_0.18_190)]/10 border-[oklch(0.7_0.18_190)]/30",
  cancelled: "text-destructive bg-destructive/10 border-destructive/30",
};

function AdminGuard({ children }: { children: React.ReactNode }) {
  const user = useQuery(api.users.getCurrentUser);
  if (user === undefined) return <Skeleton className="h-64 w-full" />;
  if (!user || user.role !== "admin") {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-xl font-bold mb-2">Admin Access Required</p>
        <p className="text-muted-foreground">You need admin privileges to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}

/* ─── DASHBOARD TAB ─────────────────────────────────────────── */
function DashboardTab() {
  const stats = useQuery(api.orders.getAdminStats);
  const forceSeed = useMutation(api.seed.forceSeedData);
  const [seeding, setSeeding] = useState(false);

  const handleRestoreDemoData = async () => {
    setSeeding(true);
    try {
      const result = await forceSeed({});
      toast.success(`Demo data restored! (${(result as { count: number }).count} products added)`);
    } catch {
      toast.error("Failed to restore demo data");
    } finally {
      setSeeding(false);
    }
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Revenue", value: `Ksh ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary", glow: "purple" as const },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-accent", glow: "blue" as const },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-[oklch(0.72_0.2_330)]", glow: "pink" as const },
    { label: "Products", value: stats.totalProducts, icon: Package, color: "text-[oklch(0.7_0.18_190)]", glow: "none" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <GlassCard glow={stat.glow} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <stat.icon className={cn("w-5 h-5", stat.color)} />
                <TrendingUp className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className={cn("text-2xl font-black", stat.color)} style={{ fontFamily: "Orbitron, sans-serif" }}>
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <GlassCard className="p-6">
        <h3 className="font-black uppercase tracking-widest text-sm mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Revenue — Last 6 Months
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.monthlyRevenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "4px", fontSize: 12 }}
              formatter={(v: number) => [`Ksh ${v.toFixed(2)}`, "Revenue"]}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Order Status Breakdown */}
      <GlassCard className="p-6">
        <h3 className="font-black uppercase tracking-widest text-sm mb-5">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ORDER_STATUSES.map((s) => (
            <div key={s} className={cn("p-3 rounded-sm border text-center", STATUS_COLORS[s])}>
              <p className="text-xl font-black" style={{ fontFamily: "Orbitron, sans-serif" }}>
                {stats.statusBreakdown[s] ?? 0}
              </p>
              <p className="text-xs uppercase tracking-widest mt-0.5 capitalize">{s}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Demo Data */}
      <GlassCard className="p-6">
        <h3 className="font-black uppercase tracking-widest text-sm mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" /> Demo Data
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Restore the original 11 demo products and 4 categories. This will replace all existing products and categories.</p>
        <NeonButton variant="purple" size="sm" onClick={handleRestoreDemoData} disabled={seeding}>
          {seeding ? "Restoring..." : "Restore Demo Products"}
        </NeonButton>
      </GlassCard>
    </div>
  );
}

/* ─── ORDERS TAB ─────────────────────────────────────────────── */
function OrdersTab() {
  const orders = useQuery(api.orders.getAllOrders);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  if (orders === undefined) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      !search ||
      o._id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order ID or customer..."
            className="w-full bg-secondary border border-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-secondary border border-border rounded-sm px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-all cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-widest">{filtered.length} orders</p>

      {filtered.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No orders found</p>
        </GlassCard>
      ) : (
        filtered.map((order, i) => (
          <motion.div key={order._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex gap-2">
                    {order.items.slice(0, 2).map((item) => (
                      <img key={item._id} src={item.productImage} alt="" className="w-10 h-12 object-cover rounded-sm shrink-0" />
                    ))}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{order._id.slice(-10).toUpperCase()}</p>
                    <p className="font-semibold text-sm">{order.customer?.name ?? "Unknown Customer"}</p>
                    <p className="text-xs text-muted-foreground">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order._creationTime).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-primary font-black text-sm" style={{ fontFamily: "Orbitron, sans-serif" }}>
                    Ksh {order.total.toFixed(2)}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider", STATUS_COLORS[order.paymentStatus === "paid" ? "delivered" : "pending"])}>
                    {order.paymentStatus}
                  </span>
                  <select
                    value={order.status}
                    onChange={async (e) => {
                      try {
                        await updateStatus({ orderId: order._id, status: e.target.value as typeof ORDER_STATUSES[number] });
                        toast.success("Status updated");
                      } catch { toast.error("Failed to update"); }
                    }}
                    className="bg-secondary border border-border rounded-sm px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ─── PRODUCTS TAB ───────────────────────────────────────────── */
type EditingProduct = Doc<"products"> | null;

function ProductsTab() {
  const { results, status, loadMore } = usePaginatedQuery(api.products.list, {}, { initialNumItems: 12 });
  const removeProduct = useMutation(api.products.remove);
  const updateProduct = useMutation(api.products.update);
  const categories = useQuery(api.categories.list);
  const [editingProduct, setEditingProduct] = useState<EditingProduct>(null);
  const [search, setSearch] = useState("");

  const filtered = results.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <AddProductForm categories={categories ?? []} />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-secondary border border-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
        />
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-widest">{filtered.length} products</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <GlassCard key={product._id} className="overflow-hidden pt-0">
            <img src={product.images[0]} alt={product.name} className="w-full aspect-video object-cover rounded-t-xl" />
            <div className="p-4 space-y-3">
              <div>
                <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-primary font-bold text-sm">Ksh {product.price}</p>
                  {product.comparePrice && (
                    <p className="text-muted-foreground text-xs line-through">Ksh {product.comparePrice}</p>
                  )}
                </div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {product.featured && <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm">Featured</span>}
                  {product.trending && <span className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent border border-accent/20 rounded-sm">Trending</span>}
                  {product.newArrival && <span className="text-xs px-1.5 py-0.5 bg-[oklch(0.7_0.18_190)]/10 text-[oklch(0.7_0.18_190)] border border-[oklch(0.7_0.18_190)]/20 rounded-sm">New</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Stock: {product.stock}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-accent border border-accent/30 rounded-sm hover:bg-accent/10 transition-all cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this product?")) return;
                    try { await removeProduct({ id: product._id }); toast.success("Product deleted"); }
                    catch { toast.error("Failed to delete"); }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded-sm hover:bg-destructive/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {status === "CanLoadMore" && (
        <div className="text-center">
          <NeonButton variant="ghost" onClick={() => loadMore(12)}>Load More</NeonButton>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md">
              <GlassCard glow="blue" className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-black uppercase tracking-widest text-sm">Edit Product</h3>
                  <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
                <EditProductForm
                  product={editingProduct}
                  onSave={async (fields) => {
                    try {
                      await updateProduct({ id: editingProduct._id, ...fields });
                      toast.success("Product updated!");
                      setEditingProduct(null);
                    } catch { toast.error("Failed to update"); }
                  }}
                  onCancel={() => setEditingProduct(null)}
                />
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EditProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: Doc<"products">;
  onSave: (fields: { name?: string; price?: number; comparePrice?: number; stock?: number; featured?: boolean; trending?: boolean; newArrival?: boolean; images?: string[] }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() ?? "",
    stock: product.stock.toString(),
    featured: product.featured,
    trending: product.trending,
    newArrival: product.newArrival,
  });
  const [images, setImages] = useState<string[]>(product.images);
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Images */}
      <div>
        <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
          Product Images <span className="normal-case text-muted-foreground/60">(any format, full quality)</span>
        </label>
        <AdminImageUploader value={images} onChange={setImages} maxImages={8} />
      </div>

      {[
        { name: "name", label: "Name", type: "text" },
        { name: "price", label: "Price (Ksh)", type: "number" },
        { name: "comparePrice", label: "Compare Price (Ksh)", type: "number" },
        { name: "stock", label: "Stock", type: "number" },
      ].map(({ name, label, type }) => (
        <div key={name}>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
          <input
            type={type}
            value={form[name as keyof typeof form] as string}
            onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
            className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-all"
          />
        </div>
      ))}
      <div className="flex items-center gap-4">
        {(["featured", "trending", "newArrival"] as const).map((field) => (
          <label key={field} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form[field]}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.checked }))}
              className="accent-primary"
            />
            <span className="text-xs uppercase tracking-widest text-muted-foreground capitalize">{field}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-3">
        <NeonButton
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({
              name: form.name,
              price: parseFloat(form.price),
              comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
              stock: parseInt(form.stock),
              featured: form.featured,
              trending: form.trending,
              newArrival: form.newArrival,
              images,
            });
            setSaving(false);
          }}
        >
          {saving ? "Saving..." : <><Check className="w-4 h-4" /> Save</>}
        </NeonButton>
        <NeonButton variant="ghost" onClick={onCancel}>Cancel</NeonButton>
      </div>
    </div>
  );
}

function AddProductForm({ categories }: { categories: Doc<"categories">[] }) {
  const createProduct = useMutation(api.products.create);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", slug: "", description: "", price: "", comparePrice: "", stock: "",
    sizes: "XS,S,M,L,XL", colors: "Black,White", tags: "",
    featured: false, trending: false, newArrival: false,
    categoryId: "" as Id<"categories"> | "",
  });

  const resetForm = () => {
    setImages([]);
    setForm({
      name: "", slug: "", description: "", price: "", comparePrice: "", stock: "",
      sizes: "XS,S,M,L,XL", colors: "Black,White", tags: "",
      featured: false, trending: false, newArrival: false,
      categoryId: "" as Id<"categories"> | "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Select a category"); return; }
    if (images.length === 0) { toast.error("Upload at least one product image"); return; }
    setSaving(true);
    try {
      await createProduct({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        categoryId: form.categoryId as Id<"categories">,
        images,
        sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
        stock: parseInt(form.stock),
        featured: form.featured,
        trending: form.trending,
        newArrival: form.newArrival,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Product created!");
      setOpen(false);
      resetForm();
    } catch { toast.error("Failed to create product"); }
    finally { setSaving(false); }
  };

  if (!open) return (
    <NeonButton onClick={() => setOpen(true)} variant="blue">
      <Plus className="w-4 h-4" /> Add New Product
    </NeonButton>
  );

  return (
    <GlassCard glow="blue" className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-black uppercase tracking-widest text-sm">Add New Product</h3>
        <button onClick={() => { setOpen(false); resetForm(); }} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Images */}
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground mb-2 block">
            Product Images * <span className="normal-case text-muted-foreground/60">(any format, full quality)</span>
          </label>
          <AdminImageUploader value={images} onChange={setImages} maxImages={8} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "name", label: "Product Name *", placeholder: "Cyber Jacket" },
            { name: "slug", label: "Slug (auto-generated)", placeholder: "cyber-jacket" },
            { name: "price", label: "Price ($) *", placeholder: "99.99", type: "number" },
            { name: "comparePrice", label: "Compare Price ($)", placeholder: "129.99", type: "number" },
            { name: "stock", label: "Stock *", placeholder: "50", type: "number" },
            { name: "sizes", label: "Sizes (comma-separated)", placeholder: "S,M,L,XL" },
            { name: "colors", label: "Colors (comma-separated)", placeholder: "Black,White" },
            { name: "tags", label: "Tags (comma-separated)", placeholder: "cyberpunk,jacket" },
          ].map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
              <input
                type={type ?? "text"}
                placeholder={placeholder}
                value={form[name as keyof typeof form] as string}
                onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Description *</label>
            <textarea
              placeholder="Product description..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">Category *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value as Id<"categories"> }))}
              className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-all cursor-pointer"
            >
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            {(["featured", "trending", "newArrival"] as const).map((field) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.checked }))} className="accent-primary" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground capitalize">{field}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <NeonButton type="submit" variant="purple" disabled={saving}>{saving ? "Creating..." : "Create Product"}</NeonButton>
          <NeonButton type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>Cancel</NeonButton>
        </div>
      </form>
    </GlassCard>
  );
}

/* ─── CATEGORIES TAB ─────────────────────────────────────────── */
function CategoriesTab() {
  const categories = useQuery(api.categories.list);
  const createCategory = useMutation(api.categories.create);
  const removeCategory = useMutation(api.categories.remove);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", image: "", featured: false });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await createCategory({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description || undefined,
        image: form.image || undefined,
        featured: form.featured,
      });
      toast.success("Category created!");
      setOpen(false);
      setForm({ name: "", slug: "", description: "", image: "", featured: false });
    } catch { toast.error("Failed to create category"); }
    finally { setSaving(false); }
  };

  if (categories === undefined) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      {!open ? (
        <NeonButton onClick={() => setOpen(true)} variant="blue">
          <Plus className="w-4 h-4" /> Add Category
        </NeonButton>
      ) : (
        <GlassCard glow="blue" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black uppercase tracking-widest text-sm">Add Category</h3>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "name", label: "Name *", placeholder: "Streetwear" },
              { name: "slug", label: "Slug (auto)", placeholder: "streetwear" },
              { name: "image", label: "Image URL", placeholder: "https://...", col: 2 },
              { name: "description", label: "Description", placeholder: "Category description", col: 2 },
            ].map(({ name, label, placeholder, col }) => (
              <div key={name} className={col === 2 ? "md:col-span-2" : ""}>
                <label className="text-xs uppercase tracking-widest text-muted-foreground mb-1 block">{label}</label>
                <input
                  placeholder={placeholder}
                  value={form[name as keyof typeof form] as string}
                  onChange={(e) => setForm((p) => ({ ...p, [name]: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} className="accent-primary" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Featured</span>
              </label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <NeonButton type="submit" variant="purple" disabled={saving}>{saving ? "Creating..." : "Create"}</NeonButton>
              <NeonButton type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</NeonButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, i) => (
          <motion.div key={cat._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassCard className="overflow-hidden pt-0">
              {cat.image && <img src={cat.image} alt={cat.name} className="w-full h-32 object-cover rounded-t-xl" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.slug}</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>}
                  </div>
                  {cat.featured && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-sm shrink-0">Featured</span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Delete this category?")) return;
                    try { await removeCategory({ id: cat._id }); toast.success("Category deleted"); }
                    catch { toast.error("Failed to delete"); }
                  }}
                  className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs text-destructive border border-destructive/30 rounded-sm hover:bg-destructive/10 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── USERS TAB ──────────────────────────────────────────────── */
function UsersTab() {
  const users = useQuery(api.users.getAllUsers);
  const updateRole = useMutation(api.users.updateUserRole);
  const [search, setSearch] = useState("");

  if (users === undefined) return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;

  const filtered = (users ?? []).filter((u) =>
    !search ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full bg-secondary border border-border rounded-sm pl-9 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all"
        />
      </div>

      <p className="text-xs text-muted-foreground uppercase tracking-widest">{filtered.length} users</p>

      <div className="space-y-2">
        {filtered.map((user, i) => (
          <motion.div key={user._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard className="p-4 flex items-center gap-4">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border border-primary/30 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.name ?? "No name"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email ?? "No email"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-sm border uppercase tracking-widest font-bold",
                  user.role === "admin" ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-border"
                )}>
                  {user.role ?? "user"}
                </span>
                <select
                  value={user.role ?? "user"}
                  onChange={async (e) => {
                    try {
                      await updateRole({ userId: user._id, role: e.target.value as "admin" | "user" });
                      toast.success("Role updated");
                    } catch { toast.error("Failed to update role"); }
                  }}
                  className="bg-secondary border border-border rounded-sm px-2 py-1 text-xs text-foreground outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── MAIN ADMIN ─────────────────────────────────────────────── */
function AdminContent() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const tabs: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "videos", label: "Videos", icon: Video },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <GlassCard className="p-3 space-y-1 lg:sticky lg:top-24">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold uppercase tracking-widest transition-all cursor-pointer",
                activeTab === id
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </button>
          ))}
        </GlassCard>
      </div>

      {/* Content */}
      <div className="lg:col-span-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black uppercase tracking-widest" style={{ fontFamily: "Orbitron, sans-serif" }}>
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dashboard" && <DashboardTab />}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "products" && <ProductsTab />}
            {activeTab === "categories" && <CategoriesTab />}
            {activeTab === "videos" && <VideosTab />}
            {activeTab === "users" && <UsersTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-7 h-7 text-primary" />
          <h1
            className="text-3xl font-black uppercase bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            Admin Dashboard
          </h1>
        </div>
        <Authenticated>
          <AdminGuard>
            <AdminContent />
          </AdminGuard>
        </Authenticated>
        <Unauthenticated>
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">Sign in to access the admin panel</p>
            <SignInButton className="px-8 py-3 bg-primary text-primary-foreground rounded-sm font-bold uppercase tracking-widest" />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}

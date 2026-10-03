import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createOrder = mutation({
  args: {
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    total: v.number(),
    couponCode: v.optional(v.string()),
    paymentMethod: v.union(v.literal("stripe"), v.literal("mpesa"), v.literal("paystack"), v.literal("cod")),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.string(),
      city: v.string(),
      country: v.string(),
      postalCode: v.string(),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        productImage: v.string(),
        price: v.number(),
        quantity: v.number(),
        size: v.string(),
        color: v.string(),
      }),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const { items, ...orderData } = args;
    const orderId = await ctx.db.insert("orders", {
      ...orderData,
      userId: user._id,
      status: "pending",
      paymentStatus: "pending",
    });

    await Promise.all(
      items.map((item) => ctx.db.insert("orderItems", { orderId, ...item })),
    );

    return orderId;
  },
});

export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return { ...order, items };
      }),
    );
  },
});

export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") return [];
    const orders = await ctx.db.query("orders").order("desc").collect();
    return await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        const customer = await ctx.db.get(order.userId);
        return { ...order, items, customer };
      }),
    );
  },
});

export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || (order.userId !== user._id && user.role !== "admin")) return null;
    return order;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") return null;

    const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

    const orders = await ctx.db.query("orders").collect();
    const users = await ctx.db.query("users").collect();
    const products = await ctx.db.query("products").collect();

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

    const statusBreakdown = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    }, {});

    // Revenue by month (last 6 months)
    const now = Date.now();
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const month = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const revenue = orders
        .filter((o) => {
          const od = new Date(o._creationTime);
          return od.getMonth() === d.getMonth() && od.getFullYear() === year && o.paymentStatus === "paid";
        })
        .reduce((sum, o) => sum + o.total, 0);
      return { month, revenue };
    });

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingOrders,
      deliveredOrders,
      statusBreakdown,
      monthlyRevenue,
    };
  },
});

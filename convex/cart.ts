import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const enriched = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return { ...item, product };
      }),
    );
    return enriched;
  },
});

export const addToCart = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    size: v.string(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("productId"), args.productId),
          q.eq(q.field("size"), args.size),
          q.eq(q.field("color"), args.color),
        ),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { quantity: existing.quantity + args.quantity });
    } else {
      await ctx.db.insert("cartItems", { userId: user._id, ...args });
    }
  },
});

export const updateQuantity = mutation({
  args: { cartItemId: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    if (args.quantity <= 0) {
      await ctx.db.delete(args.cartItemId);
    } else {
      await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
    }
  },
});

export const removeFromCart = mutation({
  args: { cartItemId: v.id("cartItems") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(args.cartItemId);
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return;
    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    await Promise.all(items.map((item) => ctx.db.delete(item._id)));
  },
});

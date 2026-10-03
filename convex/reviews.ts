import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProductReviews = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    return await Promise.all(
      reviews.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return { ...r, user };
      }),
    );
  },
});

export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query.trim()) return [];
    const q = args.query.toLowerCase();
    const all = await ctx.db.query("products").take(200);
    return all
      .filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 20);
  },
});

export const getUserReview = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    return reviews.find((r) => r.userId === user._id) ?? null;
  },
});

export const addReview = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    await ctx.db.insert("reviews", { ...args, userId: user._id });

    // Update product rating
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await ctx.db.patch(args.productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
  },
});

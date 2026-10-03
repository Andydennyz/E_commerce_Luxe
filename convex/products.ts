import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
    newArrival: v.optional(v.boolean()),
    search: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db.query("products");

    if (args.categoryId) {
      return await ctx.db
        .query("products")
        .withIndex("by_category", (qi) => qi.eq("categoryId", args.categoryId!))
        .paginate(args.paginationOpts);
    }
    if (args.featured) {
      return await ctx.db
        .query("products")
        .withIndex("by_featured", (qi) => qi.eq("featured", true))
        .paginate(args.paginationOpts);
    }
    if (args.trending) {
      return await ctx.db
        .query("products")
        .withIndex("by_trending", (qi) => qi.eq("trending", true))
        .paginate(args.paginationOpts);
    }
    if (args.newArrival) {
      return await ctx.db
        .query("products")
        .withIndex("by_new_arrival", (qi) => qi.eq("newArrival", true))
        .paginate(args.paginationOpts);
    }

    return await q.paginate(args.paginationOpts);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .take(8);
  },
});

export const getTrending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_trending", (q) => q.eq("trending", true))
      .take(8);
  },
});

export const getNewArrivals = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("newArrival", true))
      .take(8);
  },
});

export const getRelated = query({
  args: { categoryId: v.id("categories"), excludeId: v.id("products") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(5);
    return products.filter((p) => p._id !== args.excludeId).slice(0, 4);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    comparePrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    sizes: v.array(v.string()),
    colors: v.array(v.string()),
    stock: v.number(),
    featured: v.boolean(),
    trending: v.boolean(),
    newArrival: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.insert("products", { ...args, rating: 0, reviewCount: 0 });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    comparePrice: v.optional(v.number()),
    stock: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    trending: v.optional(v.boolean()),
    newArrival: v.optional(v.boolean()),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await ctx.db.delete(args.id);
  },
});

// Lightweight query used for dropdowns — returns basic fields only
export const getAllNames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .order("asc")
      .collect()
      .then((rows) => rows.map((p) => ({ _id: p._id, name: p.name, price: p.price, images: p.images })));
  },
});

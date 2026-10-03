import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("categories")
      .filter((q) => q.eq(q.field("featured"), true))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    featured: v.optional(v.boolean()),
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
  args: { id: v.id("categories") },
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

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return await ctx.db.insert("categories", args);
  },
});

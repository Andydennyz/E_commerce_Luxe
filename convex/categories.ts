import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isAuthorizedAdminUser } from "./adminAccess";

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
    slug: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email))
      throw new Error("Forbidden");
    const { id, images, description, ...fields } = args;
    if (fields.slug) {
      const existingCategory = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", fields.slug!))
        .first();
      if (existingCategory && existingCategory._id !== id) {
        throw new Error("A category with this slug already exists");
      }
    }
    await ctx.db.patch(id, {
      ...fields,
      ...(description !== undefined
        ? { description: description || undefined }
        : {}),
      ...(images !== undefined
        ? { images, image: images[0] || undefined }
        : {}),
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email))
      throw new Error("Forbidden");
    await ctx.db.delete(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    featured: v.boolean(),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email))
      throw new Error("Forbidden");
    const existingCategory = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existingCategory) {
      throw new Error("A category with this slug already exists");
    }
    return await ctx.db.insert("categories", {
      ...args,
      image: args.images?.[0] || args.image,
    });
  },
});

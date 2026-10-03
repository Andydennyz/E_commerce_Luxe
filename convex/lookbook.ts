import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { isAuthorizedAdminUser } from "./adminAccess";

async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not authenticated" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!isAuthorizedAdminUser(user, identity.email)) throw new ConvexError({ code: "FORBIDDEN", message: "Admin only" });
  return user;
}

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email)) return [];
    return await ctx.db.query("lookbookVideos").order("asc").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("lookbookVideos")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("asc")
      .collect();
  },
});

export const addVideo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    url: v.string(),
    productIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    // Determine next order value
    const all = await ctx.db.query("lookbookVideos").order("desc").take(1);
    const order = all.length > 0 ? all[0].order + 1 : 0;
    return await ctx.db.insert("lookbookVideos", {
      ...args,
      active: true,
      order,
    });
  },
});

export const updateVideo = mutation({
  args: {
    id: v.id("lookbookVideos"),
    title: v.string(),
    description: v.optional(v.string()),
    productIds: v.array(v.id("products")),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("lookbookVideos"), active: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { active: args.active });
  },
});

export const deleteVideo = mutation({
  args: { id: v.id("lookbookVideos") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const video = await ctx.db.get(args.id);
    if (!video) throw new ConvexError({ code: "NOT_FOUND", message: "Video not found" });
    // Delete from Convex storage
    await ctx.storage.delete(video.storageId);
    await ctx.db.delete(args.id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("lookbookVideos")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    for (let i = 0; i < args.ids.length; i++) {
      await ctx.db.patch(args.ids[i], { order: i });
    }
  },
});

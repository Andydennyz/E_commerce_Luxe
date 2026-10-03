import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate a signed upload URL for Convex File Storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return await ctx.storage.generateUploadUrl();
  },
});

// Generate a signed upload URL specifically for video uploads (admin only)
export const generateVideoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return await ctx.storage.generateUploadUrl();
  },
});

// Resolve a storage ID to a permanent serving URL
export const getStorageUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete a file from storage (admin only)
export const deleteStorageFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user || user.role !== "admin") throw new Error("Forbidden");
    await ctx.storage.delete(args.storageId);
  },
});

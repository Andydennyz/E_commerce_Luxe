import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  isAuthorizedAdminEmail,
  isAuthorizedAdminUser,
} from "./adminAccess";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const isAdminEmail = isAuthorizedAdminEmail(identity.email);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name,
        email: identity.email,
        avatar: identity.profileUrl,
        role: isAdminEmail ? "admin" : "user",
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      avatar: identity.profileUrl,
      role: isAdminEmail ? "admin" : "user",
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    return {
      ...user,
      role: isAuthorizedAdminEmail(identity.email) ? user.role : "user" as const,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.phone !== undefined && { phone: args.phone }),
    });
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(me, identity.email)) return [];
    return await ctx.db.query("users").collect().then((users) =>
      users.map((user) => ({
        ...user,
        role: isAuthorizedAdminEmail(user.email) ? user.role : "user" as const,
        canBeAdmin: isAuthorizedAdminEmail(user.email),
      })),
    );
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(me, identity.email)) throw new Error("Forbidden");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found");
    if (args.role === "admin" && !isAuthorizedAdminEmail(target.email)) {
      throw new Error("Only approved email addresses can be admins");
    }
    await ctx.db.patch(target._id, { role: args.role });
  },
});

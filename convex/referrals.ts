import { internalMutation, mutation, query } from "./_generated/server";
import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { v } from "convex/values";
import { isAuthorizedAdminUser } from "./adminAccess";

export const ensureMyReferralCode = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to create a referral code");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) throw new Error("User profile not found");

    const existing = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) return existing.code;

    const encodedUserId = [...user._id]
      .map((character) => character.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    const code = `LUXE-${encodedUserId}`;
    const collision = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (collision) throw new Error("Unable to create a unique referral code");

    await ctx.db.insert("referralCodes", { userId: user._id, code });
    return code;
  },
});

export const getMyReferralInfo = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      code: v.union(v.string(), v.null()),
      redeemed: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;
    const referral = await ctx.db
      .query("referralCodes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return {
      code: referral?.code ?? null,
      redeemed: referral?.redeemedBy !== undefined,
    };
  },
});

export const checkCode = query({
  args: { code: v.string() },
  returns: v.object({
    valid: v.boolean(),
    reason: v.string(),
    discountPercent: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        valid: false,
        reason: "Sign in to use a referral code",
        discountPercent: 10,
      };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) {
      return {
        valid: false,
        reason: "Your account profile is not ready yet",
        discountPercent: 10,
      };
    }

    const referral = await ctx.db
      .query("referralCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim().toUpperCase()))
      .unique();
    if (!referral) {
      return {
        valid: false,
        reason: "Referral code not found",
        discountPercent: 10,
      };
    }
    if (referral.userId === user._id) {
      return {
        valid: false,
        reason: "You cannot use your own referral code",
        discountPercent: 10,
      };
    }
    if (referral.redeemedBy || referral.reservedOrderId) {
      return {
        valid: false,
        reason: referral.redeemedBy
          ? "This referral code has already been used"
          : "This referral code is currently reserved for checkout",
        discountPercent: 10,
      };
    }
    const previousOrder = await ctx.db
      .query("orders")
      .withIndex("by_user_and_payment_status", (q) =>
        q.eq("userId", user._id).eq("paymentStatus", "paid"),
      )
      .first();
    if (previousOrder) {
      return {
        valid: false,
        reason: "Referral discounts are for first-time customers",
        discountPercent: 10,
      };
    }
    return { valid: true, reason: "", discountPercent: 10 };
  },
});

export const completeRedemption = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order?.referralCodeId || !order.userId) return null;
    const code = await ctx.db.get(order.referralCodeId);
    if (!code) throw new Error("Referral code for order could not be found");
    if (code.redeemedOrderId === order._id) return null;
    if (code.reservedOrderId !== order._id || code.redeemedBy) {
      throw new Error("Referral code reservation does not match the paid order");
    }
    await ctx.db.patch(code._id, {
      reservedOrderId: undefined,
      redeemedBy: order.userId,
      redeemedOrderId: order._id,
      redeemedAt: Date.now(),
    });
    await ctx.db.insert("referralRedemptions", {
      code: code.code,
      referrerUserId: code.userId,
      referredUserId: order.userId,
      orderId: order._id,
      discount: order.discount,
    });
    return null;
  },
});

export const releaseReservation = internalMutation({
  args: { orderId: v.id("orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order?.referralCodeId) return null;
    const code = await ctx.db.get(order.referralCodeId);
    if (code?.reservedOrderId === order._id) {
      await ctx.db.patch(code._id, { reservedOrderId: undefined });
    }
    return null;
  },
});

export const listAdminRedemptions = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      id: v.id("referralRedemptions"),
      createdAt: v.number(),
      code: v.string(),
      discount: v.number(),
      referrerName: v.union(v.string(), v.null()),
      referrerEmail: v.union(v.string(), v.null()),
      newCustomerName: v.union(v.string(), v.null()),
      newCustomerEmail: v.union(v.string(), v.null()),
      orderId: v.id("orders"),
      orderTotal: v.union(v.number(), v.null()),
      orderStatus: v.union(v.string(), v.null()),
      paymentStatus: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const admin = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!isAuthorizedAdminUser(admin, identity.email)) {
      throw new Error("Forbidden");
    }

    const redemptions = await ctx.db
      .query("referralRedemptions")
      .order("desc")
      .paginate(args.paginationOpts);
    const page = await Promise.all(
      redemptions.page.map(async (redemption) => {
        const [referrer, newCustomer, order] = await Promise.all([
          ctx.db.get(redemption.referrerUserId),
          ctx.db.get(redemption.referredUserId),
          ctx.db.get(redemption.orderId),
        ]);
        return {
          id: redemption._id,
          createdAt: redemption._creationTime,
          code: redemption.code,
          discount: redemption.discount,
          referrerName: referrer?.name ?? null,
          referrerEmail: referrer?.email ?? null,
          newCustomerName: newCustomer?.name ?? null,
          newCustomerEmail: newCustomer?.email ?? null,
          orderId: redemption.orderId,
          orderTotal: order?.total ?? null,
          orderStatus: order?.status ?? null,
          paymentStatus: order?.paymentStatus ?? null,
        };
      }),
    );
    return { ...redemptions, page };
  },
});

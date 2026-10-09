import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Internal mutations called by the M-Pesa action and HTTP callback

export const saveStkPushIds = internalMutation({
  args: {
    orderId: v.id("orders"),
    checkoutRequestId: v.string(),
    merchantRequestId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      mpesaCheckoutRequestId: args.checkoutRequestId,
      mpesaMerchantRequestId: args.merchantRequestId,
    });
  },
});

export const handleCallback = internalMutation({
  args: {
    merchantRequestId: v.string(),
    checkoutRequestId: v.string(),
    resultCode: v.number(),
    resultDesc: v.string(),
    receiptNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Find the order with this checkoutRequestId
    // Use a filter since we can't index on optional fields easily
    const orders = await ctx.db.query("orders").collect();
    const order = orders.find(
      (o) => o.mpesaCheckoutRequestId === args.checkoutRequestId,
    );
    if (!order) return;

    if (
      args.resultCode === 0 &&
      order.paymentStatus === "pending" &&
      order.status === "pending"
    ) {
      await ctx.db.patch(order._id as Id<"orders">, {
        paymentStatus: "paid",
        status: "confirmed",
        mpesaReceiptNumber: args.receiptNumber,
      });
      await ctx.runMutation(internal.referrals.completeRedemption, {
        orderId: order._id,
      });
    } else if (
      order.paymentStatus === "pending" &&
      order.status === "pending"
    ) {
      await ctx.db.patch(order._id as Id<"orders">, {
        paymentStatus: "failed",
      });
      await ctx.runMutation(internal.referrals.releaseReservation, {
        orderId: order._id,
      });
    }
  },
});

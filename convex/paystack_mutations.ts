import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Save Paystack reference to order after initialization
export const savePaystackReference = internalMutation({
  args: {
    orderId: v.id("orders"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (
      !order ||
      order.paymentMethod !== "paystack" ||
      order.paymentStatus !== "pending" ||
      order.status !== "pending" ||
      order.paystackReference
    ) {
      throw new Error("Order is not available for Paystack payment");
    }
    await ctx.db.patch(args.orderId, {
      paystackReference: args.reference,
    });
  },
});

export const confirmVerifiedPayment = internalMutation({
  args: {
    orderId: v.id("orders"),
    reference: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (
      !order ||
      order.paymentMethod !== "paystack" ||
      order.paystackReference !== args.reference ||
      args.amount !== Math.round(order.total * 100)
    ) {
      throw new Error("Verified Paystack transaction does not match the order");
    }
    if (order.paymentStatus === "paid") return;
    if (order.paymentStatus !== "pending" || order.status !== "pending") {
      throw new Error("Order is no longer awaiting Paystack payment");
    }
    await ctx.db.patch(order._id, {
      paymentStatus: "paid",
      status: "confirmed",
    });
  },
});

// Handle Paystack webhook — update order payment status
export const handleWebhook = internalMutation({
  args: {
    reference: v.string(),
    status: v.string(), // "success" | "failed" | "abandoned"
    amount: v.optional(v.number()), // in kobo/pesewas, Paystack sends smallest currency unit
    paidAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_paystack_reference", (q) =>
        q.eq("paystackReference", args.reference),
      )
      .unique();

    if (!order) return;

    if (
      args.status === "success" &&
      args.amount === Math.round(order.total * 100) &&
      order.paymentMethod === "paystack" &&
      order.paymentStatus === "pending" &&
      order.status === "pending"
    ) {
      await ctx.db.patch(order._id, {
        paymentStatus: "paid",
        status: "confirmed",
      });
    }
  },
});

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Save Paystack reference to order after initialization
export const savePaystackReference = internalMutation({
  args: {
    orderId: v.id("orders"),
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      paystackReference: args.reference,
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
      .filter((q) => q.eq(q.field("paystackReference"), args.reference))
      .first();

    if (!order) return;

    if (args.status === "success") {
      await ctx.db.patch(order._id, {
        paymentStatus: "paid",
        status: "confirmed",
      });
    } else if (args.status === "failed" || args.status === "abandoned") {
      await ctx.db.patch(order._id, {
        paymentStatus: "failed",
      });
    }
  },
});

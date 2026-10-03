"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

// Initialize a Paystack transaction and return the authorization URL
export const initializeTransaction = action({
  args: {
    orderId: v.id("orders"),
    email: v.string(),
    amount: v.number(), // in KES (will be multiplied by 100 for Paystack)
    callbackUrl: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> => {
    const order = await ctx.runQuery(internal.orders.getOrderForPaystack, {
      orderId: args.orderId,
    });
    if (
      !order ||
      order.paymentMethod !== "paystack" ||
      order.paymentStatus !== "pending" ||
      order.status !== "pending" ||
      order.paystackReference ||
      args.amount !== order.total
    ) {
      throw new Error("Order details could not be validated for Paystack payment");
    }
    const email = args.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email address is required for Paystack payment");
    }

    const secretKey = getPaystackSecretKey();

    // Paystack expects amount in the smallest currency unit (kobo for NGN, pesewas for GHS, cents for USD)
    // For KES, Paystack uses 100 as the multiplier
    const amountInSmallestUnit = Math.round(args.amount * 100);

    // Generate a unique reference
    const reference = `PD-${args.orderId}-${Date.now()}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInSmallestUnit,
        reference,
        callback_url: args.callbackUrl,
        currency: "KES",
        metadata: {
          orderId: args.orderId,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: args.orderId,
            },
          ],
        },
      }),
    });

    const data = (await res.json()) as {
      status: boolean;
      message: string;
      data?: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (
      !res.ok ||
      !data.status ||
      !data.data ||
      data.data.reference !== reference
    ) {
      throw new Error(data.message ?? "Failed to initialize Paystack transaction");
    }

    // Save reference to the order
    await ctx.runMutation(internal.paystack_mutations.savePaystackReference, {
      orderId: args.orderId,
      reference: data.data.reference,
    });

    return {
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
      accessCode: data.data.access_code,
    };
  },
});

// Verify a Paystack transaction by reference
export const verifyTransaction = action({
  args: { reference: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ status: string; amount: number; paidAt: string | null }> => {
    const order = await ctx.runQuery(
      internal.orders.getOrderForPaystackReference,
      { reference: args.reference },
    );
    if (
      !order ||
      order.paymentMethod !== "paystack" ||
      (order.paymentStatus !== "pending" && order.paymentStatus !== "paid") ||
      (order.status !== "pending" &&
        !(order.paymentStatus === "paid" && order.status === "confirmed"))
    ) {
      throw new Error("Paystack reference does not match a payable order");
    }

    const secretKey = getPaystackSecretKey();

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    const data = (await res.json()) as {
      status: boolean;
      message: string;
      data?: {
        status: string; // "success" | "failed" | "abandoned"
        amount: number; // in smallest currency unit
        paid_at: string | null;
        reference: string;
      };
    };

    if (!res.ok || !data.status || !data.data) {
      throw new Error(data.message ?? "Failed to verify transaction");
    }
    if (data.data.reference !== args.reference) {
      throw new Error("Paystack returned a different transaction reference");
    }
    if (
      data.data.status === "success" &&
      data.data.amount !== Math.round(order.total * 100)
    ) {
      throw new Error("Paystack payment amount does not match the order total");
    }
    if (data.data.status === "success") {
      await ctx.runMutation(internal.paystack_mutations.confirmVerifiedPayment, {
        orderId: order.orderId,
        reference: args.reference,
        amount: data.data.amount,
      });
    }

    return {
      status: data.data.status,
      amount: data.data.amount / 100,
      paidAt: data.data.paid_at,
    };
  },
});

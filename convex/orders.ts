import { internalQuery, mutation, query } from "./_generated/server";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel.d.ts";
import schema from "./schema";
import { isAuthorizedAdminUser } from "./adminAccess";

export const createOrder = mutation({
  args: {
    paymentMethod: v.union(v.literal("mpesa"), v.literal("paystack")),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      location: v.string(),
      destination: v.string(),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
        size: v.string(),
        color: v.string(),
        customAttributes: v.optional(
          v.array(v.object({ name: v.string(), value: v.string() })),
        ),
      }),
    ),
    promoCode: v.optional(v.string()),
  },
  returns: v.object({ orderId: v.id("orders"), total: v.number() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in before placing an order");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User profile not found");
    const products = await Promise.all(
      args.items.map((item) => ctx.db.get(item.productId)),
    );
    const orderItems = args.items.map((item, index) => {
      const product = products[index];
      if (!product) throw new Error("A product in your cart is no longer available");
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new Error("Cart quantity is invalid");
      }
      if (product.stock < item.quantity) {
        throw new Error(`${product.name} does not have enough stock`);
      }
      if (item.size === "Custom" || item.color === "Custom") {
        if (!item.customAttributes?.length) {
          throw new Error("Custom product attributes are required");
        }
        if (
          item.customAttributes.length > 5 ||
          item.customAttributes.some(
            ({ name, value }) =>
              !name.trim() ||
              name.length > 40 ||
              !value.trim() ||
              value.length > 100,
          )
        ) {
          throw new Error("Custom product attributes are invalid");
        }
      } else if (item.customAttributes?.length) {
        throw new Error("Custom attributes require custom product options");
      }
      if (item.size !== "Custom" && product.sizes.length > 0 && !product.sizes.includes(item.size)) {
        throw new Error(`Selected size is unavailable for ${product.name}`);
      }
      if (item.color !== "Custom" && product.colors.length > 0 && !product.colors.includes(item.color)) {
        throw new Error(`Selected color is unavailable for ${product.name}`);
      }
      return {
        productId: product._id,
        productName: product.name,
        productImage: product.images[0] ?? "",
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        ...(item.customAttributes ? { customAttributes: item.customAttributes } : {}),
      };
    });
    if (orderItems.length === 0) throw new Error("Your cart is empty");

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const deliveryFee = 9.99;
    const promoCode = args.promoCode?.trim().toUpperCase() || undefined;
    let discount = 0;
    let referralCode: Doc<"referralCodes"> | null = null;

    if (promoCode === "CYBER40") {
      discount = Math.round(subtotal * 0.1 * 100) / 100;
    } else if (promoCode === "PD20") {
      discount = Math.round(subtotal * 0.2 * 100) / 100;
    } else if (promoCode) {
      referralCode = await ctx.db
        .query("referralCodes")
        .withIndex("by_code", (q) => q.eq("code", promoCode))
        .unique();
      if (
        !referralCode ||
        referralCode.redeemedBy ||
        referralCode.reservedOrderId
      ) {
        throw new Error("Referral code is invalid or has already been used");
      }
      if (referralCode.userId === user._id) {
        throw new Error("You cannot use your own referral code");
      }
      const previousOrder = await ctx.db
        .query("orders")
        .withIndex("by_user_and_payment_status", (q) =>
          q.eq("userId", user._id).eq("paymentStatus", "paid"),
        )
        .first();
      if (previousOrder) {
        throw new Error("Referral discounts are for first-time customers");
      }
      discount = Math.round(subtotal * 0.1 * 100) / 100;
    }
    const total = subtotal - discount + deliveryFee;
    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: args.paymentMethod,
      subtotal,
      deliveryFee,
      discount,
      ...(promoCode ? { couponCode: promoCode } : {}),
      ...(referralCode ? { referralCodeId: referralCode._id } : {}),
      total,
      shippingAddress: args.shippingAddress,
    });

    if (referralCode && promoCode) {
      await ctx.db.patch(referralCode._id, {
        reservedOrderId: orderId,
      });
    }

    await Promise.all(
      orderItems.map((item) => ctx.db.insert("orderItems", { orderId, ...item })),
    );

    return { orderId, total };
  },
});

export const getOrderForMpesa = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.null(),
    v.object({
      status: v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
      ),
      paymentStatus: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
      paymentMethod: v.union(
        v.literal("stripe"),
        v.literal("mpesa"),
        v.literal("paystack"),
        v.literal("cod"),
      ),
      total: v.number(),
      phone: v.string(),
      checkoutRequestId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    return {
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      phone: order.shippingAddress.phone,
      checkoutRequestId: order.mpesaCheckoutRequestId,
    };
  },
});

export const getOrderForPaystack = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.null(),
    v.object({
      status: v.string(),
      paymentStatus: v.string(),
      paymentMethod: v.string(),
      total: v.number(),
      paystackReference: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    return {
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      paystackReference: order.paystackReference,
    };
  },
});

export const getOrderForPaystackReference = internalQuery({
  args: { reference: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      orderId: v.id("orders"),
      status: v.string(),
      paymentStatus: v.string(),
      paymentMethod: v.string(),
      total: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_paystack_reference", (q) =>
        q.eq("paystackReference", args.reference),
      )
      .unique();
    if (!order) return null;
    return {
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
    };
  },
});

export const getUserOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        return { ...order, items };
      }),
    );
  },
});

export const listMyOrders = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      order: schema.doc("orders"),
      items: v.array(schema.doc("orderItems")),
    }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found");

    const ordersPage = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
    const page = await Promise.all(
      ordersPage.page.map(async (order) => ({
        order,
        items: await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .take(100),
      })),
    );
    return { ...ordersPage, page };
  },
});

export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email)) return [];
    const orders = await ctx.db.query("orders").order("desc").collect();
    return await Promise.all(
      orders.map(async (order) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("by_order", (q) => q.eq("orderId", order._id))
          .collect();
        const customer = order.userId ? await ctx.db.get(order.userId) : null;
        return { ...order, items, customer };
      }),
    );
  },
});

export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (
      !user ||
      (order.userId !== user._id && !isAuthorizedAdminUser(user, identity.email))
    ) return null;
    return order;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email)) throw new Error("Forbidden");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (args.status === "cancelled" && order.referralCodeId) {
      const referralCode = await ctx.db.get(order.referralCodeId);
      if (referralCode?.reservedOrderId === order._id) {
        await ctx.db.patch(referralCode._id, { reservedOrderId: undefined });
      }
    }
    await ctx.db.patch(args.orderId, { status: args.status });
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!isAuthorizedAdminUser(user, identity.email)) return null;

    const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

    const orders = await ctx.db.query("orders").collect();
    const users = await ctx.db.query("users").collect();
    const products = await ctx.db.query("products").collect();

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

    const statusBreakdown = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = orders.filter((o) => o.status === s).length;
      return acc;
    }, {});

    // Revenue by month (last 6 months)
    const now = Date.now();
    const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const month = d.toLocaleString("default", { month: "short" });
      const year = d.getFullYear();
      const revenue = orders
        .filter((o) => {
          const od = new Date(o._creationTime);
          return od.getMonth() === d.getMonth() && od.getFullYear() === year && o.paymentStatus === "paid";
        })
        .reduce((sum, o) => sum + o.total, 0);
      return { month, revenue };
    });

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalUsers: users.length,
      totalProducts: products.length,
      pendingOrders,
      deliveredOrders,
      statusBreakdown,
      monthlyRevenue,
    };
  },
});

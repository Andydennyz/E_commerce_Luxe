import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
    phone: v.optional(v.string()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_role", ["role"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    featured: v.boolean(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    price: v.number(),
    comparePrice: v.optional(v.number()),
    categoryId: v.id("categories"),
    images: v.array(v.string()),
    sizes: v.array(v.string()),
    colors: v.array(v.string()),
    stock: v.number(),
    featured: v.boolean(),
    trending: v.boolean(),
    newArrival: v.boolean(),
    tags: v.array(v.string()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_featured", ["featured"])
    .index("by_trending", ["trending"])
    .index("by_new_arrival", ["newArrival"]),

  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    rating: v.number(),
    title: v.string(),
    body: v.string(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  wishlist: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  userActivity: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("cart_added"), v.literal("wishlist_added")),
    productId: v.id("products"),
    productName: v.string(),
    productSlug: v.string(),
    productImage: v.string(),
    price: v.number(),
    quantity: v.number(),
    size: v.optional(v.string()),
    color: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  coupons: defineTable({
    code: v.string(),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountValue: v.number(),
    minOrderAmount: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    usedCount: v.number(),
    expiresAt: v.optional(v.string()),
    active: v.boolean(),
  }).index("by_code", ["code"]),

  referralCodes: defineTable({
    userId: v.id("users"),
    code: v.string(),
    reservedOrderId: v.optional(v.id("orders")),
    redeemedBy: v.optional(v.id("users")),
    redeemedOrderId: v.optional(v.id("orders")),
    redeemedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_code", ["code"]),

  referralRedemptions: defineTable({
    code: v.string(),
    referrerUserId: v.id("users"),
    referredUserId: v.id("users"),
    orderId: v.id("orders"),
    discount: v.number(),
  }),

  orders: defineTable({
    userId: v.optional(v.id("users")),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    total: v.number(),
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    couponCode: v.optional(v.string()),
    referralCodeId: v.optional(v.id("referralCodes")),
    paymentMethod: v.union(
      v.literal("stripe"),
      v.literal("mpesa"),
      v.literal("paystack"),
      v.literal("cod"),
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
    stripeSessionId: v.optional(v.string()),
    mpesaCheckoutRequestId: v.optional(v.string()),
    mpesaMerchantRequestId: v.optional(v.string()),
    mpesaReceiptNumber: v.optional(v.string()),
    paystackReference: v.optional(v.string()),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      address: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      location: v.optional(v.string()),
      destination: v.optional(v.string()),
    }),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_payment_status", ["userId", "paymentStatus"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_paystack_reference", ["paystackReference"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    productName: v.string(),
    productImage: v.string(),
    price: v.number(),
    quantity: v.number(),
    size: v.string(),
    color: v.string(),
    customAttributes: v.optional(
      v.array(v.object({ name: v.string(), value: v.string() })),
    ),
  }).index("by_order", ["orderId"]),

  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    size: v.string(),
    color: v.string(),
    customAttributes: v.optional(
      v.array(v.object({ name: v.string(), value: v.string() })),
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  lookbookVideos: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    url: v.string(),
    productIds: v.array(v.id("products")),
    active: v.boolean(),
    order: v.number(),
  }).index("by_active", ["active"]),

  aboutContent: defineTable({
    key: v.string(),
    heroEyebrow: v.string(),
    heroTitle: v.string(),
    heroAccent: v.string(),
    heroIntro: v.string(),
    storyEyebrow: v.string(),
    storyTitle: v.string(),
    storyParagraphs: v.array(v.string()),
    storyImageStorageId: v.optional(v.id("_storage")),
    stats: v.array(
      v.object({
        value: v.string(),
        label: v.string(),
      }),
    ),
    values: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
      }),
    ),
    ctaTitle: v.string(),
    ctaDescription: v.string(),
  }).index("by_key", ["key"]),

  aboutTeamMembers: defineTable({
    name: v.string(),
    role: v.string(),
    bio: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.number(),
  }).index("by_order", ["order"]),

  aboutTeamState: defineTable({
    key: v.string(),
    teamInitialized: v.boolean(),
  }).index("by_key", ["key"]),

  aboutSocialLinks: defineTable({
    platform: v.union(
      v.literal("Instagram"),
      v.literal("Facebook"),
      v.literal("YouTube"),
      v.literal("X"),
      v.literal("TikTok"),
      v.literal("LinkedIn"),
      v.literal("Pinterest"),
      v.literal("WhatsApp"),
    ),
    url: v.string(),
    order: v.number(),
    active: v.boolean(),
  })
    .index("by_platform", ["platform"])
    .index("by_order", ["order"]),
});

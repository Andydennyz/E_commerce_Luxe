import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { v } from "convex/values";
import schema from "./schema";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";

async function getSignedInUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

export const recordCartAddition = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
    size: v.string(),
    color: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getSignedInUser(ctx);
    if (!Number.isInteger(args.quantity) || args.quantity < 1) {
      throw new Error("Cart quantity is invalid");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");
    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: "cart_added",
      productId: product._id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0] ?? "",
      price: product.price,
      quantity: args.quantity,
      size: args.size,
      color: args.color,
    });
    return null;
  },
});

export const getMyActivity = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc("userActivity")),
  handler: async (ctx, args) => {
    const user = await getSignedInUser(ctx);
    return await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

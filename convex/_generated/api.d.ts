/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as about from "../about.js";
import type * as adminAccess from "../adminAccess.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lookbook from "../lookbook.js";
import type * as mpesa from "../mpesa.js";
import type * as mpesa_mutations from "../mpesa_mutations.js";
import type * as orders from "../orders.js";
import type * as paystack from "../paystack.js";
import type * as paystack_mutations from "../paystack_mutations.js";
import type * as products from "../products.js";
import type * as referrals from "../referrals.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as userActivity from "../userActivity.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  about: typeof about;
  adminAccess: typeof adminAccess;
  cart: typeof cart;
  categories: typeof categories;
  files: typeof files;
  http: typeof http;
  lookbook: typeof lookbook;
  mpesa: typeof mpesa;
  mpesa_mutations: typeof mpesa_mutations;
  orders: typeof orders;
  paystack: typeof paystack;
  paystack_mutations: typeof paystack_mutations;
  products: typeof products;
  referrals: typeof referrals;
  reviews: typeof reviews;
  seed: typeof seed;
  userActivity: typeof userActivity;
  users: typeof users;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

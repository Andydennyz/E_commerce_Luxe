"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMpesaConfig() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY ?? "";
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET ?? "";
  // The initiator shortcode used to generate the password (sandbox: 174379)
  const shortcode = process.env.MPESA_SHORTCODE ?? "";
  // The Paybill number where money is actually received (e.g. 400200)
  const paybill = process.env.MPESA_PAYBILL ?? shortcode;
  // Account number under the Paybill (e.g. 1124250)
  const accountNumber = process.env.MPESA_ACCOUNT_NUMBER ?? "";
  const passkey = process.env.MPESA_PASSKEY ?? "";
  const callbackUrl = process.env.MPESA_CALLBACK_URL ?? "";
  const environment = (process.env.MPESA_ENVIRONMENT ?? "sandbox") as
    | "sandbox"
    | "production";

  const baseUrl =
    environment === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

  return { consumerKey, consumerSecret, shortcode, paybill, accountNumber, passkey, callbackUrl, baseUrl };
}

async function getAccessToken(
  baseUrl: string,
  consumerKey: string,
  consumerSecret: string,
): Promise<string> {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${body}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// Normalize phone: strip leading 0, prefix 254
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("7") || digits.startsWith("1")) return "254" + digits;
  return digits;
}

// ---------------------------------------------------------------------------
// STK Push action — initiates payment and stores CheckoutRequestID on order
// ---------------------------------------------------------------------------

export const initiateStkPush = action({
  args: {
    orderId: v.id("orders"),
    phone: v.string(),
    amount: v.number(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; checkoutRequestId: string; customerMessage: string }> => {
    const order = await ctx.runQuery(internal.orders.getOrderForMpesa, {
      orderId: args.orderId,
    });
    if (
      !order ||
      order.paymentMethod !== "mpesa" ||
      order.paymentStatus !== "pending" ||
      order.status !== "pending" ||
      order.checkoutRequestId ||
      args.amount !== order.total ||
      normalizePhone(args.phone) !== normalizePhone(order.phone)
    ) {
      throw new Error("Order details could not be validated for M-Pesa payment");
    }

    const { consumerKey, consumerSecret, shortcode, paybill, accountNumber, passkey, callbackUrl, baseUrl } =
      getMpesaConfig();

    const accessToken = await getAccessToken(baseUrl, consumerKey, consumerSecret);
    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    const phone = normalizePhone(order.phone);
    const amount = Math.ceil(args.amount);

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: paybill,           // Paybill number money is paid TO
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountNumber, // Account number under the Paybill
      TransactionDesc: "PD Stores Order Payment",
    };

    const res = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      ResponseCode?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
      CustomerMessage?: string;
      errorMessage?: string;
    };

    if (!res.ok || data.ResponseCode !== "0") {
      throw new Error(data.errorMessage ?? "STK Push request failed");
    }

    await ctx.runMutation(internal.mpesa_mutations.saveStkPushIds, {
      orderId: args.orderId,
      checkoutRequestId: data.CheckoutRequestID!,
      merchantRequestId: data.MerchantRequestID!,
    });

    return {
      success: true,
      checkoutRequestId: data.CheckoutRequestID!,
      customerMessage:
        data.CustomerMessage ?? "Check your phone for the M-Pesa prompt.",
    };
  },
});

// ---------------------------------------------------------------------------
// Query STK Push status (polled from frontend)
// ---------------------------------------------------------------------------

export const queryStkStatus = action({
  args: { checkoutRequestId: v.string() },
  handler: async (
    _ctx,
    args,
  ): Promise<{ resultCode: string; resultDesc: string }> => {
    const { consumerKey, consumerSecret, shortcode, passkey, baseUrl } =
      getMpesaConfig();
    const accessToken = await getAccessToken(baseUrl, consumerKey, consumerSecret);
    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);

    const body = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: args.checkoutRequestId,
    };

    const res = await fetch(`${baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      ResultCode?: string;
      ResultDesc?: string;
      errorMessage?: string;
    };

    return {
      resultCode: data.ResultCode ?? data.errorMessage ?? "unknown",
      resultDesc: data.ResultDesc ?? data.errorMessage ?? "Unknown error",
    };
  },
});

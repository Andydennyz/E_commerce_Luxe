import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Verify Paystack webhook HMAC-SHA512 signature using Web Crypto API
async function verifyPaystackSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

// M-Pesa STK Push callback endpoint
// Safaricom will POST to this URL after a payment attempt
http.route({
  path: "/mpesa/callback",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json() as {
        Body?: {
          stkCallback?: {
            MerchantRequestID: string;
            CheckoutRequestID: string;
            ResultCode: number;
            ResultDesc: string;
            CallbackMetadata?: {
              Item: Array<{ Name: string; Value?: string | number }>;
            };
          };
        };
      };

      const callback = body?.Body?.stkCallback;
      if (!callback) {
        return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

      // Extract metadata items (only present on success)
      const items = CallbackMetadata?.Item ?? [];
      const getItem = (name: string) => items.find((i) => i.Name === name)?.Value;

      const receiptNumber = getItem("MpesaReceiptNumber") as string | undefined;
      const phone = getItem("PhoneNumber") as string | undefined;
      const amount = getItem("Amount") as number | undefined;

      await ctx.runMutation(internal.mpesa_mutations.handleCallback, {
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDesc: ResultDesc,
        receiptNumber,
        phone,
        amount,
      });

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("M-Pesa callback error:", err);
      return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Paystack webhook endpoint
// Paystack will POST to this URL for payment events
http.route({
  path: "/paystack/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      const signature = request.headers.get("x-paystack-signature") ?? "";
      const secret = process.env.PAYSTACK_SECRET_KEY ?? "";

      // Verify HMAC-SHA512 signature when secret is configured
      if (secret) {
        const valid = await verifyPaystackSignature(rawBody, signature, secret);
        if (!valid) {
          return new Response("Unauthorized", { status: 401 });
        }
      }

      const event = JSON.parse(rawBody) as {
        event: string;
        data: {
          reference: string;
          status: string;
          amount: number;
          paid_at: string | null;
        };
      };

      if (event.event === "charge.success") {
        await ctx.runMutation(internal.paystack_mutations.handleWebhook, {
          reference: event.data.reference,
          status: event.data.status,
          amount: event.data.amount,
          paidAt: event.data.paid_at ?? undefined,
        });
      }

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Paystack webhook error:", err);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

export default http;

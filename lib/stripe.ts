import "server-only";

// Stripe placeholder — the `stripe` npm package is intentionally NOT installed
// yet. This module gives the rest of the app something to import (a typed
// `createCheckoutSession`, a `verifyWebhook`, a `stripeStatus` flag) so the
// billing UI and webhook route can be wired in their final shape today, and
// the only thing that changes when Stripe is enabled is this file.

export type StripeStatus = "unconfigured" | "test" | "live";

export function stripeStatus(): StripeStatus {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "unconfigured";
  if (key.startsWith("sk_test_")) return "test";
  if (key.startsWith("sk_live_")) return "live";
  return "unconfigured";
}

export function isStripeConfigured(): boolean {
  return stripeStatus() !== "unconfigured";
}

export function publishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null;
}

// ---------------------------------------------------------------------------
// Checkout

export type Plan = "essential" | "standard" | "professional";

export type CheckoutSessionRequest = {
  plan: Plan;
  workspaceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSessionResult =
  | { ok: true; url: string }
  | {
      ok: false;
      reason: "not_configured" | "not_implemented";
      message: string;
    };

export async function createCheckoutSession(
  _input: CheckoutSessionRequest
): Promise<CheckoutSessionResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "Self-serve billing is not yet enabled. Contact ethan@clearbot.io to change your plan.",
    };
  }
  // When wired:
  //   import Stripe from "stripe";
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  //   const session = await stripe.checkout.sessions.create({
  //     mode: "subscription",
  //     customer_email: _input.customerEmail,
  //     line_items: [{ price: PRICE_IDS[_input.plan], quantity: 1 }],
  //     metadata: { workspace_id: _input.workspaceId, plan: _input.plan },
  //     success_url: _input.successUrl,
  //     cancel_url: _input.cancelUrl,
  //   });
  //   return { ok: true, url: session.url! };
  return {
    ok: false,
    reason: "not_implemented",
    message: "Stripe is configured but the checkout flow is not yet implemented.",
  };
}

// ---------------------------------------------------------------------------
// Webhooks

export type WebhookEvent =
  | { type: "checkout.session.completed"; data: Record<string, unknown> }
  | { type: "customer.subscription.updated"; data: Record<string, unknown> }
  | { type: "customer.subscription.deleted"; data: Record<string, unknown> }
  | { type: "invoice.payment_succeeded"; data: Record<string, unknown> }
  | { type: "invoice.payment_failed"; data: Record<string, unknown> }
  | { type: string; data: Record<string, unknown> };

export type WebhookVerifyResult =
  | { ok: true; event: WebhookEvent }
  | {
      ok: false;
      reason: "not_configured" | "invalid_signature";
      message: string;
    };

export async function verifyWebhook(
  _rawBody: string,
  _signature: string | null
): Promise<WebhookVerifyResult> {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Stripe webhook secret not set.",
    };
  }
  // When wired:
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "..." });
  //   try {
  //     const event = stripe.webhooks.constructEvent(_rawBody, _signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  //     return { ok: true, event };
  //   } catch (err) {
  //     return { ok: false, reason: "invalid_signature", message: String(err) };
  //   }
  return {
    ok: false,
    reason: "not_configured",
    message: "Stripe webhook handler not yet implemented.",
  };
}

import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe sends events here once a webhook endpoint is created in the Stripe
// dashboard and STRIPE_WEBHOOK_SECRET is set on the deployment. Until then
// this returns 503 so Stripe surfaces the misconfiguration, rather than 200
// with a silent no-op (which would mask billing breakage).
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const result = await verifyWebhook(body, sig);
  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : 400;
    return NextResponse.json(
      { ok: false, reason: result.reason, message: result.message },
      { status }
    );
  }

  // When wired, switch on result.event.type:
  //   - checkout.session.completed       → mark workspace plan, store subscription_id
  //   - customer.subscription.updated    → sync workspace plan + status
  //   - customer.subscription.deleted    → revert to "essential" or suspend
  //   - invoice.payment_succeeded        → mark invoice paid, log activity
  //   - invoice.payment_failed           → flag workspace, notify admins
  return NextResponse.json({ ok: true, received: result.event.type });
}

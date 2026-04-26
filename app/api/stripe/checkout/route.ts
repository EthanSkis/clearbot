import { NextResponse } from "next/server";
import { createCheckoutSession, type Plan } from "@/lib/stripe";
import { requireContext, canAdmin } from "@/lib/workspace";

export const dynamic = "force-dynamic";

const PLANS: ReadonlyArray<Plan> = ["essential", "standard", "professional"];

export async function POST(req: Request) {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return NextResponse.json(
      { ok: false, error: "Only owners and admins can change the plan." },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { plan?: Plan };
  if (!body.plan || !PLANS.includes(body.plan)) {
    return NextResponse.json(
      { ok: false, error: "plan must be essential, standard, or professional" },
      { status: 400 }
    );
  }

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://clearbot.io";

  const result = await createCheckoutSession({
    plan: body.plan,
    workspaceId: ctx.workspace.id,
    customerEmail: ctx.user.email,
    successUrl: `${origin}/dashboard/billing?checkout=success`,
    cancelUrl: `${origin}/dashboard/billing?checkout=cancel`,
  });

  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : 501;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

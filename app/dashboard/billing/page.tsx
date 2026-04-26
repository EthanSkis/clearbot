import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { PRICING_TIERS } from "@/lib/data";
import { stripeStatus } from "@/lib/stripe";
import {
  InvoicesTable,
  PaymentMethods,
  PlanSwitcher,
  StripeStatusBanner,
  type Invoice,
  type PaymentMethod,
} from "./BillingClient";

export const metadata: Metadata = { title: "Billing · ClearBot" };
export const dynamic = "force-dynamic";

const PLAN_INCLUDED: Record<string, { locations: number; filings: number; storageGb: number }> = {
  essential: { locations: 10, filings: 60, storageGb: 25 },
  standard: { locations: 25, filings: 120, storageGb: 50 },
  professional: { locations: 40, filings: 200, storageGb: 100 },
};

// Single source of truth lives in PRICING_TIERS (price = annual dollars
// per location). Marketing page = $500 / $800 / $1,200 per loc/yr.
const PLAN_ANNUAL_PRICE_PER_LOC: Record<string, number> = Object.fromEntries(
  PRICING_TIERS.map((t) => [t.tier.toLowerCase(), t.price])
);

export default async function BillingPage() {
  const ctx = await requireContext();
  const supabase = createClient();
  const canManage = canAdmin(ctx.membership.role) || ctx.membership.role === "finance";
  const stripe = stripeStatus();

  const [
    { count: locationCount },
    { count: filingsThisMonth },
    { data: documents },
    { count: members },
    { data: invoices },
    { data: paymentMethods },
  ] = await Promise.all([
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active"),
    supabase
      .from("filings")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from("documents")
      .select("size_bytes")
      .eq("workspace_id", ctx.workspace.id),
    supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active"),
    supabase
      .from("invoices")
      .select("id, short_id, period_label, period_start, period_end, amount_cents, status, method, issued_at, paid_at")
      .eq("workspace_id", ctx.workspace.id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("payment_methods")
      .select("id, kind, label, last4, is_primary")
      .eq("workspace_id", ctx.workspace.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const totalBytes = (documents ?? []).reduce((s, d) => s + (d.size_bytes as number), 0);
  const usedGb = totalBytes / 1024 / 1024 / 1024;

  const plan = ctx.workspace.plan;
  const limits = PLAN_INCLUDED[plan] ?? PLAN_INCLUDED.essential;
  const annualCents = (locationCount ?? 0) * (PLAN_ANNUAL_PRICE_PER_LOC[plan] ?? 500) * 100;
  // Monthly invoice = 1/12 of the annual contract. The marketing page
  // also offers a no-commit monthly cycle at +15% — we don't surface
  // that until the workspace stores a billing_cycle.
  const monthlyCents = Math.round(annualCents / 12);

  const today = new Date();
  const nextInvoiceDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const usage = [
    { label: "Locations", used: locationCount ?? 0, limit: limits.locations },
    { label: "Filings this month", used: filingsThisMonth ?? 0, limit: limits.filings },
    { label: "Document storage (GB)", used: Number(usedGb.toFixed(2)), limit: limits.storageGb },
    { label: "Seats", used: members ?? 0, limit: 999 },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`${plan.charAt(0).toUpperCase() + plan.slice(1)} plan · per location, per year`}
        title={
          <>
            Your plan, <span className="italic">and the math behind it.</span>
          </>
        }
        subtitle="Per-location annual pricing. Filings, fees, and storage included — no per-filing surcharges, cancel any time."
        actions={<PlanSwitcher currentPlan={plan} canManage={canManage} stripeStatus={stripe} />}
      />

      <StripeStatusBanner status={stripe} />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">Current plan</div>
              <div className="mt-2 font-display text-[32px] font-light leading-tight tracking-[-0.01em] text-ink capitalize">
                {plan}
              </div>
              <p className="mt-2 max-w-[460px] text-[13px] leading-[1.55] text-body">
                {plan === "essential" && "Tracking and alerts. We watch every deadline, you file."}
                {plan === "standard" && "Tracking + pre-fill. Forms staged, fees calculated, you submit."}
                {plan === "professional" && "Fully automated filing · dedicated CSM · SSO + SCIM · 1-hour SLA."}
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-[32px] font-light leading-tight text-ink tabular-nums">
                ${(annualCents / 100).toLocaleString()}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-body">
                per year at current usage
              </div>
              <div className="mt-1 font-mono text-[11px] text-body">
                ${(monthlyCents / 100).toLocaleString()}/month invoiced
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Locations" value={`${locationCount ?? 0} / ${limits.locations}`} />
            <MiniStat label="Filings / mo" value={`${filingsThisMonth ?? 0} / ${limits.filings}`} />
            <MiniStat label="Storage" value={`${usedGb.toFixed(1)} / ${limits.storageGb} GB`} />
            <MiniStat label="Seats" value={`${members ?? 0}`} />
          </div>

          <div className="mt-6 border-t border-hairline pt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Next invoice</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[14px] text-ink">
                {nextInvoiceDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-ink">
                ${(monthlyCents / 100).toLocaleString()}{" "}
                <span className="text-body">· 1/12 of annual</span>
              </span>
            </div>
          </div>
        </div>

        <PaymentMethods rows={(paymentMethods ?? []) as unknown as PaymentMethod[]} canManage={canManage} />
      </section>

      <section>
        <SectionHeader title="Usage this month" subtitle="Measured continuously · updates at midnight UTC." />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <ul className="divide-y divide-hairline">
            {usage.map((u) => {
              const pct = Math.min(100, (u.used / u.limit) * 100);
              const tone = pct > 90 ? "bg-bad" : pct > 70 ? "bg-warn" : "bg-accent";
              return (
                <li
                  key={u.label}
                  className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 md:grid-cols-[1.6fr_3fr_0.8fr]"
                >
                  <div className="text-[13px] font-medium text-ink">{u.label}</div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bgalt">
                    <div className={clsx("h-full", tone)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right font-mono text-[12px] tabular-nums text-ink">
                    {u.used} / {u.limit === 999 ? "unlimited" : u.limit}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <SectionHeader title="Compare plans" subtitle="Per-location, per-year. Filings & storage included." />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PRICING_TIERS.map((p) => {
            const isCurrent = p.tier.toLowerCase() === plan;
            const monthly = Math.round((p.price / 12) * 1.15);
            return (
              <div
                key={p.tier}
                className={clsx(
                  "rounded-2xl border p-5 shadow-card",
                  isCurrent ? "border-accent bg-accent-soft/30" : "border-hairline bg-white"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-[22px] font-light text-ink">{p.tier}</div>
                  {isCurrent && (
                    <span className="rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                      Current
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-[32px] font-light text-ink tabular-nums">
                    ${p.price.toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-body">/loc/yr</span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-body">
                  or ${monthly}/loc/mo billed monthly
                </div>
                <p className="mt-2 text-[13px] leading-[1.55] text-body">{p.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-ink">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7ab833" strokeWidth="3" className="mt-1 shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-xl border border-hairline bg-bgalt px-5 py-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-body">Enterprise</div>
          <div className="mt-1 text-[13px] text-ink">
            500+ locations, custom SLAs, dedicated infrastructure, BAA support.
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Invoices" subtitle="Generate, mark paid, and download as CSV." />
        <div className="mt-4">
          <InvoicesTable rows={(invoices ?? []) as unknown as Invoice[]} canManage={canManage} />
        </div>
      </section>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-hairline bg-bgalt px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-1 font-mono text-[13px] tabular-nums text-ink">{value}</div>
    </div>
  );
}

import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { PRICING_TIERS } from "@/lib/data";

export const metadata: Metadata = { title: "Billing · ClearBot" };

const INVOICES = [
  { id: "INV-2026-04", date: "Apr 01, 2026", period: "Apr 2026", amount: "$30,400", status: "Paid", method: "Wire · Chase ••4421" },
  { id: "INV-2026-03", date: "Mar 01, 2026", period: "Mar 2026", amount: "$30,400", status: "Paid", method: "Wire · Chase ••4421" },
  { id: "INV-2026-02", date: "Feb 01, 2026", period: "Feb 2026", amount: "$28,800", status: "Paid", method: "Wire · Chase ••4421" },
  { id: "INV-2026-01", date: "Jan 01, 2026", period: "Jan 2026", amount: "$28,800", status: "Paid", method: "Wire · Chase ••4421" },
  { id: "INV-2025-12", date: "Dec 01, 2025", period: "Dec 2025", amount: "$28,800", status: "Paid", method: "ACH · Chase ••4421" },
];

const USAGE = [
  { label: "Locations included", value: 40, used: 38 },
  { label: "Additional locations (overage)", value: 10, used: 0 },
  { label: "Filings included /mo", value: 200, used: 42 },
  { label: "Document storage", value: 100, used: 18 },
  { label: "API events /mo", value: 1_000_000, used: 127_420 },
];

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Professional · annual · seat-locked"
        title={<>Your plan, <span className="italic">and the math behind it.</span></>}
        subtitle="Every line item — seats, locations, filings, storage, fees routed. Transparent pricing, auditor-ready."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Download MSA
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Change plan
            </button>
          </>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">Current plan</div>
              <div className="mt-2 font-display text-[32px] font-light leading-tight tracking-[-0.01em] text-ink">
                Professional
              </div>
              <p className="mt-2 max-w-[460px] text-[13px] leading-[1.55] text-body">
                Fully automated filing · dedicated compliance manager · 1-hour SLA · SSO + SCIM · priority response.
              </p>
            </div>
            <div className="text-right">
              <div className="font-display text-[32px] font-light leading-tight text-ink tabular-nums">
                $30,400
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-body">per month · billed annually</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MiniStat label="Locations" value="38 / 40" />
            <MiniStat label="Filings / mo" value="42 / 200" />
            <MiniStat label="Storage" value="18 / 100 GB" />
            <MiniStat label="Seats" value="7 / unlimited" />
          </div>

          <div className="mt-6 border-t border-hairline pt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Next invoice</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[14px] text-ink">May 01, 2026</span>
              <span className="font-mono text-[13px] tabular-nums text-ink">$30,400</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">Payment method</div>
          <div className="mt-3 rounded-md border border-hairline bg-bgalt px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-ink">Chase Business ••4421</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-body">Primary</span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-body">Wire · US ACH · auto-pay on invoice</div>
          </div>
          <button className="mt-3 w-full rounded-md border border-hairline bg-white py-2 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-bgalt">
            + Add payment method
          </button>

          <div className="mt-6 border-t border-hairline pt-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Billing contact</div>
            <div className="mt-2 text-[13px] text-ink">Marcus Holt · Finance</div>
            <div className="font-mono text-[11px] text-body">marcus@meridiang.com</div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Usage this month" subtitle="Measured continuously · updates at midnight UTC." />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <ul className="divide-y divide-hairline">
            {USAGE.map((u) => {
              const pct = Math.min(100, (u.used / u.value) * 100);
              const tone = pct > 90 ? "bg-bad" : pct > 70 ? "bg-warn" : "bg-accent";
              return (
                <li key={u.label} className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 md:grid-cols-[1.6fr_3fr_0.8fr]">
                  <div className="text-[13px] font-medium text-ink">{u.label}</div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bgalt">
                    <div className={clsx("h-full", tone)} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right font-mono text-[12px] tabular-nums text-ink">
                    {formatUsed(u.used)} / {formatUsed(u.value)}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Compare plans"
          subtitle="Prices are per-location, per-month. Filings, fees, and storage are included — no per-filing billing."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {PRICING_TIERS.map((p) => {
            const isCurrent = p.tier === "Professional";
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
                  <span className="font-display text-[32px] font-light text-ink tabular-nums">${p.price}</span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-body">/loc/mo</span>
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
      </section>

      <section>
        <SectionHeader title="Invoices" subtitle="All past invoices, downloadable as PDF or CSV." />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.6fr_1.2fr_0.5fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>Invoice</div>
            <div>Date</div>
            <div>Period</div>
            <div className="text-right">Amount</div>
            <div>Status</div>
            <div>Method</div>
            <div className="text-right"></div>
          </div>
          <ul className="divide-y divide-hairline">
            {INVOICES.map((inv) => (
              <li key={inv.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.6fr_1.2fr_0.5fr]">
                <div className="font-mono text-[12px] text-ink">{inv.id}</div>
                <div className="hidden font-mono text-[12px] text-body md:block">{inv.date}</div>
                <div className="hidden font-mono text-[12px] text-body md:block">{inv.period}</div>
                <div className="hidden text-right font-mono text-[13px] tabular-nums text-ink md:block">{inv.amount}</div>
                <div className="hidden md:block">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">
                    <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                    {inv.status}
                  </span>
                </div>
                <div className="hidden truncate font-mono text-[11px] text-body md:block">{inv.method}</div>
                <div className="flex items-center justify-end">
                  <a href="#" className="font-mono text-[11px] uppercase tracking-wider text-accent-deep hover:text-accent">
                    PDF →
                  </a>
                </div>
              </li>
            ))}
          </ul>
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

function formatUsed(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return n.toString();
}

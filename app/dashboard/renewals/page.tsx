import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { RenewalCalendar } from "@/components/dashboard/RenewalCalendar";

export const metadata: Metadata = { title: "Renewals · ClearBot" };

type Renewal = {
  id: string;
  license: string;
  location: string;
  agency: string;
  due: string;
  days: number;
  fee: string;
  mode: "Alert" | "Prep" | "Auto";
};

const RENEWALS: Renewal[] = [
  { id: "R-918", license: "Building Occupancy", location: "Denver, CO · LoDo Rooftop", agency: "Denver BLDG", due: "Apr 21", days: -1, fee: "$1,210", mode: "Prep" },
  { id: "R-921", license: "Liquor License", location: "Chicago, IL · Wrigleyville Tap", agency: "IL LCC", due: "Apr 26", days: 4, fee: "$1,540", mode: "Auto" },
  { id: "R-922", license: "Health Permit", location: "Austin, TX · SoCo Burger Co.", agency: "TX DSHS", due: "May 10", days: 18, fee: "$425", mode: "Auto" },
  { id: "R-923", license: "Tobacco Retailer", location: "Miami, FL · Wynwood Cigar Lounge", agency: "FL DBPR", due: "May 23", days: 31, fee: "$290", mode: "Prep" },
  { id: "R-924", license: "Sales Tax Permit", location: "Brooklyn, NY · Williamsburg Deli", agency: "NY DTF", due: "Jul 22", days: 92, fee: "$0", mode: "Auto" },
  { id: "R-925", license: "Food Service Cert", location: "Los Angeles, CA · Silver Lake Smokehouse", agency: "LA County EH", due: "Dec 24", days: 247, fee: "$180", mode: "Auto" },
];

export default function RenewalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="14 upcoming · 1 overdue"
        title={<>Every deadline, <span className="italic">ahead of time.</span></>}
        subtitle="ClearBot tracks renewal cadence per license and pre-prepares packets 45 days out by default."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Sync to calendar
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Add license
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due this week" value="3" tone="warn" sub="1 overdue, 2 due" />
        <Stat label="Due in 30 days" value="11" tone="neutral" sub="8 on Auto" />
        <Stat label="Filed on time YTD" value="100%" tone="ok" sub="42 of 42" />
        <Stat label="Avg lead time" value="12d" tone="neutral" sub="before deadline" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <RenewalCalendar />
        <div className="flex flex-col gap-3">
          <SectionHeader
            title="This week"
            subtitle="Prioritized by proximity, risk-adjusted for agency lead time."
          />
          <ul className="flex flex-col gap-2">
            {RENEWALS.slice(0, 3).map((r) => (
              <li key={r.id} className="rounded-xl border border-hairline bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{r.license}</div>
                    <div className="truncate font-mono text-[11px] text-body">{r.location}</div>
                  </div>
                  <Pill tone={r.days < 0 ? "bad" : r.days <= 7 ? "warn" : "ok"} withDot>
                    {r.days < 0 ? `${Math.abs(r.days)}d over` : `${r.days}d`}
                  </Pill>
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-body">
                  <span>{r.agency}</span>
                  <span className="tabular-nums text-ink">{r.fee}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Upcoming renewals"
          subtitle="Next 180 days · sorted by due date."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[0.5fr_1.6fr_1.4fr_0.9fr_0.5fr_0.5fr_0.6fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>ID</div>
            <div>License · Location</div>
            <div>Agency</div>
            <div>Due</div>
            <div className="text-right">Days</div>
            <div className="text-right">Fee</div>
            <div>Mode</div>
            <div className="text-right">Action</div>
          </div>
          <ul className="divide-y divide-hairline">
            {RENEWALS.map((r) => (
              <li key={r.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.5fr_1.6fr_1.4fr_0.9fr_0.5fr_0.5fr_0.6fr_0.6fr]">
                <div className="hidden font-mono text-[11px] text-body md:block">{r.id}</div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">{r.license}</div>
                  <div className="truncate font-mono text-[11px] text-body">{r.location}</div>
                </div>
                <div className="hidden font-mono text-[12px] text-body md:block">{r.agency}</div>
                <div className="hidden font-mono text-[12px] text-ink md:block">{r.due}</div>
                <div className={clsx("hidden text-right font-mono text-[12px] tabular-nums md:block", r.days < 0 ? "text-bad" : r.days <= 7 ? "text-warn" : "text-ink")}>
                  {r.days < 0 ? `${Math.abs(r.days)}d over` : `${r.days}d`}
                </div>
                <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">{r.fee}</div>
                <div className="hidden md:block">
                  <Pill tone={r.mode === "Auto" ? "accent" : r.mode === "Prep" ? "warn" : "neutral"} withDot>
                    {r.mode}
                  </Pill>
                </div>
                <div className="flex items-center justify-end">
                  <button className="rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink">
                    Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "ok" | "warn" | "bad" | "neutral" }) {
  const toneClass = tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className={clsx("mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em]", toneClass)}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

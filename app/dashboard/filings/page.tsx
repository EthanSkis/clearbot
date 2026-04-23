import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { FilingsInFlight } from "@/components/dashboard/FilingsInFlight";

export const metadata: Metadata = { title: "Filings · ClearBot" };

type History = {
  id: string;
  license: string;
  location: string;
  agency: string;
  filed: string;
  cycle: string;
  fee: string;
  confirmation: string;
  status: "Confirmed" | "Pending" | "Rejected";
};

const HISTORY: History[] = [
  { id: "CB-40121", license: "Sign Permit", location: "Chicago, IL", agency: "Chicago DOB", filed: "Apr 21", cycle: "4d", fee: "$140", confirmation: "CHI-SGN-9912", status: "Confirmed" },
  { id: "CB-40118", license: "Business License", location: "Austin, TX", agency: "City of Austin", filed: "Apr 18", cycle: "2d", fee: "$95", confirmation: "ATX-BUS-00412", status: "Confirmed" },
  { id: "CB-40102", license: "Fire Inspection", location: "Atlanta, GA", agency: "Atlanta Fire", filed: "Apr 10", cycle: "5d", fee: "$210", confirmation: "ATL-FIRE-1105", status: "Confirmed" },
  { id: "CB-40088", license: "Sales Tax Permit", location: "Brooklyn, NY", agency: "NY DTF", filed: "Apr 03", cycle: "3d", fee: "$0", confirmation: "NYDTF-0483", status: "Confirmed" },
  { id: "CB-40071", license: "Health Permit", location: "Dallas, TX", agency: "Dallas County HHS", filed: "Mar 27", cycle: "6d", fee: "$318", confirmation: "DAL-HTH-1220", status: "Pending" },
  { id: "CB-40066", license: "Liquor License", location: "Seattle, WA", agency: "WA LCB", filed: "Mar 24", cycle: "11d", fee: "$1,330", confirmation: "WA-LCB-8831", status: "Confirmed" },
];

const STATUS_TONE: Record<History["status"], "ok" | "warn" | "bad"> = {
  Confirmed: "ok",
  Pending: "warn",
  Rejected: "bad",
};

export default function FilingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="11 in flight · 42 this quarter"
        title={<>The filing queue, <span className="italic">end to end.</span></>}
        subtitle="Every packet, every fee routed, every agency receipt — in one immutable timeline."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Download audit pack
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Manual file
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="In flight" value="11" sub="5 stages tracked" />
        <Stat label="Awaiting your review" value="2" sub="Miami · Denver" />
        <Stat label="Filed this week" value="6" sub="avg cycle 3.2d" />
        <Stat label="Rejected YTD" value="0" sub="100% accept rate" />
      </section>

      <section>
        <SectionHeader
          title="Active pipeline"
          subtitle="Intake → Pre-fill → Review → Submit → Confirm."
        />
        <div className="mt-4">
          <FilingsInFlight />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Filing history"
          subtitle="Every submission since onboarding · fully exportable for auditors."
          right={
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-ink bg-ink px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white">
                All
              </button>
              <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                Confirmed
              </button>
              <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                Pending
              </button>
            </div>
          }
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.5fr_0.6fr_1fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>Filing ID</div>
            <div>License · Location</div>
            <div>Agency</div>
            <div>Filed</div>
            <div>Cycle</div>
            <div className="text-right">Fee</div>
            <div>Confirmation</div>
            <div>Status</div>
          </div>
          <ul className="divide-y divide-hairline">
            {HISTORY.map((h) => (
              <li key={h.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.5fr_0.6fr_1fr_0.6fr]">
                <div className="hidden font-mono text-[11px] text-body md:block">{h.id}</div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">{h.license}</div>
                  <div className="truncate font-mono text-[11px] text-body">{h.location}</div>
                </div>
                <div className="hidden font-mono text-[12px] text-body md:block">{h.agency}</div>
                <div className="hidden font-mono text-[12px] text-body md:block">{h.filed}</div>
                <div className="hidden font-mono text-[12px] tabular-nums text-body md:block">{h.cycle}</div>
                <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">{h.fee}</div>
                <div className="hidden truncate font-mono text-[11px] text-accent-deep md:block">{h.confirmation}</div>
                <div className="flex items-center justify-end md:justify-start">
                  <Pill tone={STATUS_TONE[h.status]} withDot>
                    {h.status}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
            <span>Showing 6 of 164</span>
            <a href="#" className="hover:text-ink">Export CSV · PDF → </a>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">{value}</div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

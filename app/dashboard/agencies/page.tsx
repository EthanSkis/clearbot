import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { AgencyMonitorMockup } from "@/components/mockups/AgencyMonitorMockup";

export const metadata: Metadata = { title: "Agencies · ClearBot" };

type Change = {
  when: string;
  agency: string;
  kind: "Form" | "Fee" | "Deadline" | "Portal";
  detail: string;
};

const CHANGES: Change[] = [
  { when: "12m ago", agency: "NYC DOH", kind: "Form", detail: "HMH-203 revised to 2026.04 · 2 new signature fields" },
  { when: "58m ago", agency: "TX TABC", kind: "Fee", detail: "Retail Dealer fee +$25 effective May 1" },
  { when: "2h ago", agency: "IL LCC", kind: "Deadline", detail: "Cook County liquor deadline advanced 5 days" },
  { when: "yesterday", agency: "FL DBPR", kind: "Portal", detail: "MyFloridaLicense portal cert renewed · all flows re-validated" },
  { when: "2d ago", agency: "CA ABC", kind: "Form", detail: "ABC-257 new attestation checkbox · existing filings re-prepared" },
  { when: "3d ago", agency: "Nashville Metro Health", kind: "Portal", detail: "New agency modeled · 94 permits eligible" },
];

const TOP_AGENCIES = [
  { code: "TX TABC", name: "Texas Alcoholic Beverage Commission", filings: 24, load: 0.82 },
  { code: "CA ABC", name: "California Dept. of Alcoholic Beverage Control", filings: 19, load: 0.68 },
  { code: "IL LCC", name: "Illinois Liquor Control Commission", filings: 17, load: 0.61 },
  { code: "FL DBPR", name: "Florida Dept. of Business & Professional Regulation", filings: 14, load: 0.5 },
  { code: "NY DTF", name: "New York Dept. of Taxation & Finance", filings: 12, load: 0.43 },
  { code: "CO DOR", name: "Colorado Dept. of Revenue", filings: 9, load: 0.32 },
];

const KIND_TONE: Record<Change["kind"], string> = {
  Form: "text-accent-deep bg-accent-soft",
  Fee: "text-warn bg-warn/10",
  Deadline: "text-bad bg-bad/10",
  Portal: "text-ink bg-bgalt",
};

export default function AgenciesPage() {
  return (
    <>
      <PageHeader
        eyebrow="528 portals · polled every 90s"
        title={<>The agency engine, <span className="italic">live.</span></>}
        subtitle="Federal, state, county, and municipal portals — modeled and re-validated continuously. When something shifts, every affected filing is re-prepared before you see a warning."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Request new agency
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Coverage map
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Agencies covered" value="528" sub="+3 this month" />
        <Stat label="Form versions" value="2,140" sub="all diffed & versioned" />
        <Stat label="Avg detect-to-update" value="11m" sub="when an agency changes" />
        <Stat label="Changes today" value="7" sub="3 forms · 2 fees · 2 deadlines" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeader title="Live monitor" subtitle="A sample of what the engine is watching right now." />
          <div className="mt-4">
            <AgencyMonitorMockup />
          </div>
        </div>
        <div>
          <SectionHeader title="Change feed" subtitle="Every material change across all 528 agencies, chronological." />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <ul className="divide-y divide-hairline">
              {CHANGES.map((c, i) => (
                <li key={i} className="flex gap-3 px-5 py-3.5">
                  <span className={clsx("mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider", KIND_TONE[c.kind])}>
                    {c.kind}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-ink">{c.agency}</div>
                      <span className="font-mono text-[10px] text-body">{c.when}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] leading-snug text-body">{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Your top agencies"
          subtitle="Where most of your filings go. Load is share of your annual filing volume."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[0.6fr_2.4fr_0.5fr_1.4fr_0.5fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>Code</div>
            <div>Agency</div>
            <div className="text-right">Filings</div>
            <div>Load share</div>
            <div className="text-right">Status</div>
          </div>
          <ul className="divide-y divide-hairline">
            {TOP_AGENCIES.map((a) => (
              <li key={a.code} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[0.6fr_2.4fr_0.5fr_1.4fr_0.5fr]">
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink">{a.code}</div>
                <div className="hidden min-w-0 truncate text-[13px] text-body md:block">{a.name}</div>
                <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">{a.filings}</div>
                <div className="hidden md:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                    <div className="h-full bg-accent" style={{ width: `${a.load * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-end font-mono text-[11px] uppercase tracking-wider text-ok">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-ok" /> Live
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionHeader title="Knowledge base" subtitle="Form templates, fee schedules, agency contacts — kept current." />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <KbCard title="Form templates" count="2,140" body="Every current form version, diffed against history, ready to pre-fill." />
          <KbCard title="Fee schedules" count="1,812" body="Live per-jurisdiction pricing. Automatically applied at filing time." />
          <KbCard title="Agency contacts" count="4,460" body="Direct lines for escalations. Pre-routed when a filing stalls." />
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

function KbCard({ title, count, body }: { title: string; count: string; body: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-body">{count}</span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.55] text-body">{body}</p>
      <a href="#" className="mt-3 inline-block font-mono text-[11px] uppercase tracking-wider text-accent-deep hover:text-accent">
        Open →
      </a>
    </div>
  );
}

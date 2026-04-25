import Link from "next/link";
import clsx from "clsx";
import { Pill } from "@/components/ui/Pill";
import type { FilingRow } from "@/app/dashboard/filings/FilingsClient";

const STAGES = ["intake", "prep", "review", "submit", "confirm"] as const;
type Stage = (typeof STAGES)[number];
const LABEL: Record<Stage, string> = {
  intake: "Intake",
  prep: "Pre-fill",
  review: "Review",
  submit: "Submit",
  confirm: "Confirm",
};

export function FilingsInFlightServer({ rows }: { rows: FilingRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-bgalt/30 px-5 py-12 text-center font-mono text-[12px] text-body">
        No filings in flight. Use the Filings page to start one.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="hidden grid-cols-[1.3fr_1fr_2fr_0.6fr_0.6fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
        <div>License · Location</div>
        <div>Agency</div>
        <div>Progress</div>
        <div className="text-right">Fee</div>
        <div>Mode</div>
        <div className="text-right">Owner</div>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((f) => {
          const idx = STAGES.indexOf(f.stage as Stage);
          const pct = idx < 0 ? 0 : ((idx + 1) / STAGES.length) * 100;
          return (
            <li
              key={f.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[1.3fr_1fr_2fr_0.6fr_0.6fr_0.6fr]"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-ink">
                  {f.license?.license_type ?? "Untracked"}
                </div>
                <div className="truncate font-mono text-[11px] text-body">
                  {f.license?.location ? `${f.license.location.name}` : "—"}
                </div>
              </div>
              <div className="hidden font-mono text-[12px] text-body md:block">{f.agency?.code ?? "—"}</div>
              <div className="col-span-2 md:col-span-1">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                  <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-1.5 hidden items-center justify-between font-mono text-[10px] uppercase tracking-wider text-body md:flex">
                  {STAGES.map((s, i) => (
                    <span key={s} className={clsx(i <= idx ? "text-ink" : "text-body/60", i === idx && "font-semibold")}>
                      {LABEL[s]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
                ${(f.fee_cents / 100).toLocaleString()}
              </div>
              <div className="hidden md:block">
                <Pill tone={f.mode === "auto" ? "accent" : f.mode === "prep" ? "warn" : "neutral"} withDot>
                  {f.mode}
                </Pill>
              </div>
              <div className="text-right font-mono text-[11px] text-body">
                {f.confirmation_number ? "ClearBot" : "—"}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
        <span>{rows.length} filing{rows.length === 1 ? "" : "s"} in flight</span>
        <Link href="/dashboard/filings" className="hover:text-ink">
          Open filings queue →
        </Link>
      </div>
    </div>
  );
}

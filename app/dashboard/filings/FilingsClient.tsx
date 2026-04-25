"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Pill } from "@/components/ui/Pill";
import { advanceFilingStage, manualFile, rejectFiling } from "./actions";

type Stage = "intake" | "prep" | "review" | "submit" | "confirm" | "done" | "rejected";

const STAGE_ORDER: Stage[] = ["intake", "prep", "review", "submit", "confirm", "done"];
const STAGE_LABEL: Record<Stage, string> = {
  intake: "Intake",
  prep: "Pre-fill",
  review: "Review",
  submit: "Submit",
  confirm: "Confirm",
  done: "Done",
  rejected: "Rejected",
};

export type FilingRow = {
  id: string;
  short_id: string;
  stage: Stage;
  mode: "alert" | "prep" | "auto";
  fee_cents: number;
  filed_at: string | null;
  cycle_days_taken: number | null;
  confirmation_number: string | null;
  status: string;
  license: { id: string; license_type: string; location: { name: string; city: string | null; state: string | null } | null } | null;
  agency: { code: string } | null;
};

export type LicenseOption = {
  id: string;
  label: string;
};

export function FilingsInFlightLive({ rows }: { rows: FilingRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  function refresh() {
    startTransition(() => router.refresh());
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-bgalt/30 px-5 py-12 text-center font-mono text-[12px] text-body">
        No filings in flight. Use “Manual file” to kick one off, or set a license to Auto.
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="hidden grid-cols-[1.2fr_1fr_2fr_0.7fr_0.6fr_0.7fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
        <div>License · Location</div>
        <div>Agency</div>
        <div>Progress</div>
        <div className="text-right">Fee</div>
        <div>Mode</div>
        <div className="text-right">Action</div>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.map((f) => {
          const idx = STAGE_ORDER.indexOf(f.stage as (typeof STAGE_ORDER)[number]);
          const pct = idx < 0 ? 0 : ((idx + 1) / STAGE_ORDER.length) * 100;
          const isRejected = f.stage === "rejected";
          return (
            <li
              key={f.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[1.2fr_1fr_2fr_0.7fr_0.6fr_0.7fr]"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-ink">
                  {f.license?.license_type ?? "Untracked"}
                </div>
                <div className="truncate font-mono text-[11px] text-body">
                  {f.license?.location ? `${f.license.location.name} · ${f.license.location.city}, ${f.license.location.state}` : "—"}
                </div>
              </div>
              <div className="hidden font-mono text-[12px] text-body md:block">
                {f.agency?.code ?? "—"}
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                  <div
                    className={clsx(
                      "absolute inset-y-0 left-0",
                      isRejected ? "bg-bad" : "bg-accent"
                    )}
                    style={{ width: `${isRejected ? 100 : pct}%` }}
                  />
                </div>
                <div className="mt-1.5 hidden items-center justify-between font-mono text-[10px] uppercase tracking-wider text-body md:flex">
                  {STAGE_ORDER.map((s, i) => (
                    <span
                      key={s}
                      className={clsx(
                        i <= idx ? "text-ink" : "text-body/60",
                        i === idx && "font-semibold"
                      )}
                    >
                      {STAGE_LABEL[s]}
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
              <div className="flex items-center justify-end gap-2">
                {!isRejected && f.stage !== "done" && (
                  <button
                    onClick={async () => {
                      const r = await advanceFilingStage(f.id);
                      if (!r.ok) alert(r.error);
                      else refresh();
                    }}
                    className="rounded-md border border-accent bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-accent-deep"
                  >
                    Advance
                  </button>
                )}
                {!isRejected && f.stage !== "done" && (
                  <button
                    onClick={async () => {
                      const reason = prompt("Reason for rejection?");
                      if (!reason) return;
                      const r = await rejectFiling(f.id, reason);
                      if (!r.ok) alert(r.error);
                      else refresh();
                    }}
                    className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                  >
                    Reject
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
        <span>{rows.length} active filing{rows.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}

export function FilingHistoryClient({
  rows,
  total,
}: {
  rows: FilingRow[];
  total: number;
}) {
  const [filter, setFilter] = useState<"all" | "Confirmed" | "Pending" | "Rejected">("all");
  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "Confirmed") return rows.filter((r) => r.status === "confirmed");
    if (filter === "Pending") return rows.filter((r) => r.status === "pending" || r.status === "in_flight");
    if (filter === "Rejected") return rows.filter((r) => r.status === "rejected" || r.stage === "rejected");
    return rows;
  }, [rows, filter]);

  function exportCsv() {
    const header = ["Filing ID", "License", "Location", "Agency", "Filed", "Fee", "Confirmation", "Status"];
    const body = filtered.map((r) => [
      r.short_id,
      r.license?.license_type ?? "",
      r.license?.location ? `${r.license.location.name}` : "",
      r.agency?.code ?? "",
      r.filed_at ?? "",
      `$${(r.fee_cents / 100).toLocaleString()}`,
      r.confirmation_number ?? "",
      r.status,
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center gap-2 border-b border-hairline bg-bgalt/60 px-5 py-2.5">
        {(["all", "Confirmed", "Pending", "Rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              filter === f
                ? "border border-ink bg-ink text-white"
                : "border border-hairline bg-white text-body hover:text-ink"
            )}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
        <button
          onClick={exportCsv}
          className="ml-auto rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
        >
          Export CSV
        </button>
      </div>
      <div className="hidden grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.6fr_1fr_0.6fr] items-center gap-4 border-b border-hairline bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
        <div>Filing ID</div>
        <div>License · Location</div>
        <div>Agency</div>
        <div>Filed</div>
        <div className="text-right">Fee</div>
        <div>Confirmation</div>
        <div>Status</div>
      </div>
      <ul className="divide-y divide-hairline">
        {filtered.length === 0 && (
          <li className="px-5 py-10 text-center font-mono text-[12px] text-body">
            No filings match this filter.
          </li>
        )}
        {filtered.map((h) => (
          <li
            key={h.id}
            className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.8fr_1.4fr_1fr_0.9fr_0.6fr_1fr_0.6fr]"
          >
            <div className="hidden font-mono text-[11px] text-body md:block">{h.short_id}</div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-ink">{h.license?.license_type ?? "—"}</div>
              <div className="truncate font-mono text-[11px] text-body">
                {h.license?.location ? `${h.license.location.name} · ${h.license.location.city}, ${h.license.location.state}` : ""}
              </div>
            </div>
            <div className="hidden font-mono text-[12px] text-body md:block">{h.agency?.code ?? "—"}</div>
            <div className="hidden font-mono text-[12px] text-body md:block">
              {h.filed_at ? new Date(h.filed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
            </div>
            <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
              ${(h.fee_cents / 100).toLocaleString()}
            </div>
            <div className="hidden truncate font-mono text-[11px] text-accent-deep md:block">
              {h.confirmation_number ?? "—"}
            </div>
            <div className="flex items-center justify-end md:justify-start">
              <Pill
                tone={
                  h.status === "confirmed" ? "ok" : h.status === "rejected" ? "bad" : "warn"
                }
                withDot
              >
                {h.status === "confirmed"
                  ? "Confirmed"
                  : h.status === "rejected"
                    ? "Rejected"
                    : h.status === "in_flight"
                      ? "In flight"
                      : h.status}
              </Pill>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
        <span>
          Showing {filtered.length} of {total}
        </span>
      </div>
    </div>
  );
}

export function ManualFileButton({ licenses }: { licenses: LicenseOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [licenseId, setLicenseId] = useState(licenses[0]?.id ?? "");
  const [feeUsd, setFeeUsd] = useState("0");
  const [mode, setMode] = useState<"alert" | "prep" | "auto">("auto");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={licenses.length === 0}
        className={clsx(
          "rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white",
          licenses.length === 0 ? "cursor-not-allowed opacity-60" : "hover:bg-accent-deep"
        )}
      >
        Manual file
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
            <div className="font-display text-[20px] font-light text-ink">Start a manual filing</div>
            <p className="mt-1 text-[13px] text-body">
              We&apos;ll create a filing in <em>Intake</em> and walk it through the pipeline. You can advance stages from the queue.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                setError(null);
                const result = await manualFile({
                  licenseId,
                  feeCents: Math.round((Number(feeUsd) || 0) * 100),
                  mode,
                });
                setSaving(false);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                router.refresh();
              }}
              className="mt-4 space-y-3"
            >
              <Field label="License">
                <select
                  required
                  value={licenseId}
                  onChange={(e) => setLicenseId(e.target.value)}
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
                >
                  {licenses.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fee (USD)">
                  <input
                    value={feeUsd}
                    onChange={(e) => setFeeUsd(e.target.value)}
                    className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Mode">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as "alert" | "prep" | "auto")}
                    className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
                  >
                    <option value="alert">Alert</option>
                    <option value="prep">Prep</option>
                    <option value="auto">Auto</option>
                  </select>
                </Field>
              </div>
              {error && (
                <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep disabled:opacity-70"
                >
                  {saving ? "Starting…" : "Start filing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </span>
      {children}
    </label>
  );
}

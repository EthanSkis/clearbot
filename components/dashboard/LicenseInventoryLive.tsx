"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Pill } from "@/components/ui/Pill";

export type LiveLicenseRow = {
  id: string;
  license_type: string;
  location_name: string;
  location_city: string | null;
  location_state: string | null;
  expires_at: string | null;
  fee_cents: number;
  cycle_days: number;
};

type Filter = "all" | "attention" | "filed";

export function LicenseInventoryLive({ rows, filedYtd }: { rows: LiveLicenseRow[]; filedYtd: number }) {
  const today = new Date();
  const enriched = rows.map((r) => {
    const days =
      r.expires_at !== null
        ? Math.floor((new Date(r.expires_at).getTime() - today.getTime()) / 86_400_000)
        : 999;
    const status: "current" | "due" | "overdue" =
      days <= 0 ? "overdue" : days <= 30 ? "due" : "current";
    return { ...r, days, status };
  });

  const counts = {
    all: enriched.length,
    attention: enriched.filter((r) => r.status !== "current").length,
    filed: filedYtd,
  };

  const [filter, setFilter] = useState<Filter>("attention");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((r) => {
      const matchStatus =
        filter === "all"
          ? true
          : filter === "attention"
            ? r.status === "due" || r.status === "overdue"
            : r.status === "current";
      const matchQ =
        !q ||
        r.license_type.toLowerCase().includes(q) ||
        r.location_name.toLowerCase().includes(q) ||
        (r.location_city ?? "").toLowerCase().includes(q) ||
        (r.location_state ?? "").toLowerCase().includes(q);
      return matchStatus && matchQ;
    });
  }, [enriched, filter, search]);

  function exportCsv() {
    const header = ["Type", "Location", "Status", "Days remaining", "Cycle days"];
    const body = visible.map((r) => [
      r.license_type,
      `${r.location_name} · ${r.location_city ?? ""}, ${r.location_state ?? ""}`,
      r.status,
      String(r.days),
      String(r.cycle_days),
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licenses-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-light leading-tight tracking-[-0.005em] text-ink">
            License inventory
          </h2>
          <p className="mt-1 max-w-[560px] text-[13px] leading-[1.55] text-body">
            Every tracked license, across every location.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Export
          </button>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            aria-pressed={filterOpen}
            className={clsx(
              "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
              filterOpen ? "border-ink bg-ink text-white" : "border-hairline bg-white text-body hover:text-ink"
            )}
          >
            Filter
          </button>
          {(["all", "attention", "filed"] as Filter[]).map((id) => {
            const label = id === "all" ? `All ${counts.all}` : id === "attention" ? `Needs attention · ${counts.attention}` : `Filed · ${counts.filed}`;
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={clsx(
                  "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                  active
                    ? "border border-ink bg-ink text-white"
                    : "border border-hairline bg-white text-body hover:text-ink"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filterOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-bgalt/60 px-4 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by license type or location…"
            className="min-w-[240px] flex-1 rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-accent"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              Clear
            </button>
          )}
          <button
            onClick={exportCsv}
            className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Export visible
          </button>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg">
        <div className="hidden grid-cols-[1.4fr_0.7fr_0.6fr_1fr_auto] items-center gap-4 border-b border-hairline bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>License · Location</div>
          <div>Status</div>
          <div className="text-right">Days left</div>
          <div>Renewal cycle</div>
          <div className="w-[88px]" />
        </div>
        {visible.length === 0 ? (
          <div className="px-5 py-10 text-center font-mono text-[12px] text-body">
            No licenses match this filter. Add one from the Renewals page.
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {visible.map((row) => {
              const pct = Math.max(0, Math.min(100, (row.days / Math.max(row.cycle_days, 1)) * 100));
              const tone: "ok" | "warn" | "bad" = row.status === "overdue" ? "bad" : row.status === "due" ? "warn" : "ok";
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[1.4fr_0.7fr_0.6fr_1fr_auto] md:gap-4"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{row.license_type}</div>
                    <div className="truncate font-mono text-[11px] text-body">
                      {row.location_name} · {row.location_city ?? ""}, {row.location_state ?? ""}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <Pill tone={tone} withDot>
                      {row.status === "current" ? "Current" : row.status === "due" ? "Due Soon" : "Overdue"}
                    </Pill>
                  </div>
                  <div className="hidden text-right font-mono text-[13px] tabular-nums text-ink md:block">
                    {row.days < 0 ? `${Math.abs(row.days)}d over` : row.days === 0 ? "today" : `${row.days}d`}
                  </div>
                  <div className="hidden md:block">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                      <div
                        className={clsx(
                          "absolute inset-y-0 left-0 transition-[width] duration-700 ease-out",
                          tone === "bad" ? "bg-bad" : tone === "warn" ? "bg-warn" : "bg-ok"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="font-mono text-[12px] tabular-nums text-body md:hidden">
                      {row.days < 0 ? `${Math.abs(row.days)}d over` : `${row.days}d`}
                    </span>
                    <a
                      href="/dashboard/renewals"
                      className={clsx(
                        "h-8 w-[88px] rounded-md border font-mono text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center",
                        tone === "bad"
                          ? "border-bad/30 bg-bad/5 text-bad hover:bg-bad/10"
                          : tone === "warn"
                            ? "border-warn/30 bg-warn/5 text-warn hover:bg-warn/10"
                            : "border-hairline bg-white text-body hover:bg-bgalt"
                      )}
                    >
                      {tone === "bad" ? "File" : tone === "warn" ? "Prepare" : "View"}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

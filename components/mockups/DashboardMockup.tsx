"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { LiveDot } from "@/components/ui/LiveDot";
import { Pill } from "@/components/ui/Pill";
import {
  SEED_ROWS,
  statusFor,
  type LicenseRow,
  type LicenseStatus,
} from "@/lib/data";

const STATUS_LABEL: Record<LicenseStatus, string> = {
  current: "Current",
  due: "Due Soon",
  overdue: "Overdue",
};

const STATUS_TONE: Record<
  LicenseStatus,
  "ok" | "warn" | "bad"
> = {
  current: "ok",
  due: "warn",
  overdue: "bad",
};

const ACTION_LABEL: Record<LicenseStatus, string> = {
  current: "View",
  due: "Prepare",
  overdue: "File Now",
};

const BAR_COLOR: Record<LicenseStatus, string> = {
  current: "bg-ok",
  due: "bg-warn",
  overdue: "bg-bad",
};

export function DashboardMockup({
  filterRows,
}: {
  filterRows?: (rows: LicenseRow[]) => LicenseRow[];
} = {}) {
  const [rows, setRows] = useState<LicenseRow[]>(SEED_ROWS);
  const [tick, setTick] = useState(0);

  const visible = filterRows ? filterRows(rows) : rows;

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setRows((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                daysRemaining: r.daysRemaining > -5 ? r.daysRemaining - 1 : r.cycleDays,
              }
            : r
        );
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* outer card */}
      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg">
        {/* header bar */}
        <div className="flex items-center justify-between gap-4 border-b border-hairline bg-bgalt/60 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <LiveDot size={7} />
            <span className="font-sans text-[14px] font-semibold tracking-tight text-ink">
              ClearBot
            </span>
            <span className="hidden text-hairline sm:inline">/</span>
            <span className="hidden font-mono text-[12px] text-body sm:inline">
              License Renewal Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[11px] text-body sm:inline">
              38 locations
            </span>
            <span className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[11px] text-body">
              <span className="text-accent">●</span> live
            </span>
          </div>
        </div>

        {/* table header */}
        <div className="hidden grid-cols-[1.4fr_0.7fr_0.6fr_1fr_auto] items-center gap-4 border-b border-hairline bg-white px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>License · Location</div>
          <div>Status</div>
          <div className="text-right">Days left</div>
          <div>Renewal cycle</div>
          <div className="w-[88px]" />
        </div>

        {/* rows */}
        <ul className="divide-y divide-hairline">
          {visible.length === 0 && (
            <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
              No licenses match the current filter.
            </li>
          )}
          {visible.map((row) => {
            const s = statusFor(row.daysRemaining);
            const pct = Math.max(
              0,
              Math.min(100, (row.daysRemaining / row.cycleDays) * 100)
            );
            return (
              <li
                key={row.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[1.4fr_0.7fr_0.6fr_1fr_auto] md:gap-4"
              >
                {/* license + location */}
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-ink">
                    {row.type}
                  </div>
                  <div className="truncate font-mono text-[11px] text-body">
                    {row.location}
                  </div>
                </div>

                {/* status (mobile: hidden, shown inline on desktop) */}
                <div className="hidden md:block">
                  <Pill tone={STATUS_TONE[s]} withDot>
                    {STATUS_LABEL[s]}
                  </Pill>
                </div>

                {/* days remaining */}
                <div className="hidden text-right font-mono text-[13px] tabular-nums text-ink md:block">
                  {formatDays(row.daysRemaining)}
                </div>

                {/* progress bar */}
                <div className="hidden md:block">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                    <div
                      className={clsx(
                        "absolute inset-y-0 left-0 transition-[width] duration-700 ease-out",
                        BAR_COLOR[s]
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* mobile: pill + days inline */}
                <div className="flex items-center justify-end gap-3 md:hidden">
                  <span className="font-mono text-[12px] tabular-nums text-body">
                    {formatDays(row.daysRemaining)}
                  </span>
                  <Pill tone={STATUS_TONE[s]} withDot>
                    {STATUS_LABEL[s]}
                  </Pill>
                </div>

                {/* action */}
                <button
                  type="button"
                  className={clsx(
                    "col-span-2 hidden h-8 w-[88px] rounded-md border font-mono text-[11px] uppercase tracking-wider transition-colors md:col-span-1 md:inline-flex md:items-center md:justify-center",
                    s === "overdue"
                      ? "border-bad/30 bg-bad/5 text-bad hover:bg-bad/10"
                      : s === "due"
                        ? "border-warn/30 bg-warn/5 text-warn hover:bg-warn/10"
                        : "border-hairline bg-white text-body hover:bg-bgalt"
                  )}
                >
                  {ACTION_LABEL[s]}
                </button>
              </li>
            );
          })}
        </ul>

        {/* footer strip */}
        <div className="flex items-center justify-between gap-4 border-t border-hairline bg-bgalt/60 px-5 py-2.5">
          <span className="font-mono text-[11px] text-body">
            Last sync · {formatTickAgo(tick)}
          </span>
          <span className="font-mono text-[11px] text-body">
            <span className="text-accent">●</span> 0 missed renewals · all-time
          </span>
        </div>
      </div>
    </div>
  );
}

function formatDays(d: number) {
  if (d < 0) return `${Math.abs(d)}d over`;
  if (d === 0) return "today";
  return `${d}d`;
}

function formatTickAgo(t: number) {
  if (t === 0) return "just now";
  if (t < 60) return `${t}s ago`;
  const m = Math.floor(t / 60);
  return `${m}m ago`;
}

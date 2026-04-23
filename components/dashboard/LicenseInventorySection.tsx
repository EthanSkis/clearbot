"use client";

import clsx from "clsx";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";
import { SectionHeader } from "./PageHeader";
import {
  useLicenseInventory,
  type StatusFilter,
} from "./LicenseInventoryContext";

const TABS: { id: StatusFilter; label: (n: number) => string }[] = [
  { id: "all", label: (n) => `All ${n}` },
  { id: "attention", label: (n) => `Needs attention · ${n}` },
  { id: "filed", label: (n) => `Filed · ${n}` },
];

export function LicenseInventorySection() {
  const {
    statusFilter,
    setStatusFilter,
    locationQuery,
    setLocationQuery,
    filterOpen,
    exportCsv,
    visibleRows,
    counts,
  } = useLicenseInventory();

  return (
    <section>
      <SectionHeader
        title="License inventory"
        subtitle="All 146 tracked licenses, across every location. Filtered to the 6 with action this quarter."
        right={
          <div className="flex items-center gap-2">
            {TABS.map((t) => {
              const active = statusFilter === t.id;
              const n = counts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id)}
                  aria-pressed={active}
                  className={clsx(
                    "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                    active
                      ? "border border-ink bg-ink text-white"
                      : "border border-hairline bg-white text-body hover:text-ink"
                  )}
                >
                  {t.label(n)}
                </button>
              );
            })}
          </div>
        }
      />

      {filterOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-bgalt/60 px-4 py-3">
          <label className="font-mono text-[11px] uppercase tracking-wider text-body">
            Search
          </label>
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Filter by location or license type…"
            className="min-w-[240px] flex-1 rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[12px] text-ink placeholder:text-body focus:border-ink focus:outline-none"
          />
          {locationQuery && (
            <button
              type="button"
              onClick={() => setLocationQuery("")}
              className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Export visible
          </button>
        </div>
      )}

      <div className="mt-4">
        <DashboardMockup filterRows={visibleRows} />
      </div>
    </section>
  );
}

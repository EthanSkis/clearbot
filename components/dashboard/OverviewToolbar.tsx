"use client";

import clsx from "clsx";
import { useLicenseInventory } from "./LicenseInventoryContext";

export function OverviewToolbarActions() {
  const { exportCsv, filterOpen, toggleFilter } = useLicenseInventory();
  return (
    <>
      <ToolbarButton label="Export" icon="download" onClick={exportCsv} />
      <ToolbarButton
        label="Filter"
        icon="filter"
        onClick={toggleFilter}
        active={filterOpen}
      />
    </>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: "download" | "filter";
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-hairline bg-white text-body hover:text-ink"
      )}
    >
      {icon === "download" ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      )}
      {label}
    </button>
  );
}

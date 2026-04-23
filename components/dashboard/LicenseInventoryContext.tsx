"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SEED_ROWS, statusFor, type LicenseRow } from "@/lib/data";

export type StatusFilter = "all" | "attention" | "filed";

type Ctx = {
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  locationQuery: string;
  setLocationQuery: (q: string) => void;
  filterOpen: boolean;
  toggleFilter: () => void;
  exportCsv: () => void;
  visibleRows: (rows: LicenseRow[]) => LicenseRow[];
  counts: { all: number; attention: number; filed: number };
};

const LicenseInventoryContext = createContext<Ctx | null>(null);

const TOTAL_ALL = 146;
const TOTAL_ATTENTION = 6;
const TOTAL_FILED = 42;

export function LicenseInventoryProvider({ children }: { children: ReactNode }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("attention");
  const [locationQuery, setLocationQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleFilter = useCallback(() => setFilterOpen((v) => !v), []);

  const visibleRows = useCallback(
    (rows: LicenseRow[]) => {
      const q = locationQuery.trim().toLowerCase();
      return rows.filter((r) => {
        const s = statusFor(r.daysRemaining);
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "attention"
              ? s === "due" || s === "overdue"
              : s === "current";
        const matchesQuery =
          q.length === 0 ||
          r.location.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      });
    },
    [statusFilter, locationQuery]
  );

  const exportCsv = useCallback(() => {
    const rows = visibleRows(SEED_ROWS);
    const header = ["Type", "Location", "Status", "Days remaining", "Cycle days"];
    const body = rows.map((r) => [
      r.type,
      r.location,
      statusFor(r.daysRemaining),
      String(r.daysRemaining),
      String(r.cycleDays),
    ]);
    const csv = [header, ...body]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `licenses-${statusFilter}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [statusFilter, visibleRows]);

  const counts = useMemo(
    () => ({ all: TOTAL_ALL, attention: TOTAL_ATTENTION, filed: TOTAL_FILED }),
    []
  );

  const value = useMemo(
    () => ({
      statusFilter,
      setStatusFilter,
      locationQuery,
      setLocationQuery,
      filterOpen,
      toggleFilter,
      exportCsv,
      visibleRows,
      counts,
    }),
    [
      statusFilter,
      locationQuery,
      filterOpen,
      toggleFilter,
      exportCsv,
      visibleRows,
      counts,
    ]
  );

  return (
    <LicenseInventoryContext.Provider value={value}>
      {children}
    </LicenseInventoryContext.Provider>
  );
}

export function useLicenseInventory() {
  const ctx = useContext(LicenseInventoryContext);
  if (!ctx) {
    throw new Error(
      "useLicenseInventory must be used inside LicenseInventoryProvider"
    );
  }
  return ctx;
}

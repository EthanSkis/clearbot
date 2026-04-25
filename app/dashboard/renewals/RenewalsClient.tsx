"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui/Pill";
import {
  createLicense,
  deleteLicense,
  exportIcs,
  markRenewalFiled,
  setAutomationMode,
} from "./actions";

export type Renewal = {
  id: string;
  license_type: string;
  expires_at: string | null;
  fee_cents: number;
  cycle_days: number;
  automation_mode: "alert" | "prep" | "auto";
  status: string;
  location: { id: string; name: string; city: string | null; state: string | null } | null;
  agency: { id: string; code: string; name: string } | null;
};

export type LocationOption = { id: string; label: string };
export type AgencyOption = { id: string; code: string; name: string };

export function RenewalsClient({
  rows,
  locations,
  agencies,
}: {
  rows: Renewal[];
  locations: LocationOption[];
  agencies: AgencyOption[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "month" | "overdue">("all");

  function refresh() {
    startTransition(() => router.refresh());
  }

  const computed = useMemo(() => {
    const today = new Date();
    return rows
      .filter((r) => r.expires_at)
      .map((r) => {
        const exp = new Date(r.expires_at!);
        const days = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const tone: "ok" | "warn" | "bad" = days < 0 ? "bad" : days <= 30 ? "warn" : "ok";
        return { ...r, days, tone, expDate: exp };
      })
      .sort((a, b) => a.expDate.getTime() - b.expDate.getTime());
  }, [rows]);

  const filtered = computed.filter((r) => {
    if (filter === "all") return true;
    if (filter === "overdue") return r.days < 0;
    if (filter === "month") return r.days >= 0 && r.days <= 31;
    return true;
  });

  async function handleSyncCalendar() {
    const result = await exportIcs();
    if (!result.ok) return;
    const blob = new Blob([result.ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clearbot-renewals-${new Date().toISOString().slice(0, 10)}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={clsx(
            "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
            filter === "all"
              ? "border border-ink bg-ink text-white"
              : "border border-hairline bg-white text-body hover:text-ink"
          )}
        >
          All {computed.length}
        </button>
        <button
          onClick={() => setFilter("month")}
          className={clsx(
            "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
            filter === "month"
              ? "border border-ink bg-ink text-white"
              : "border border-hairline bg-white text-body hover:text-ink"
          )}
        >
          Next 30 days · {computed.filter((r) => r.days >= 0 && r.days <= 31).length}
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={clsx(
            "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
            filter === "overdue"
              ? "border border-ink bg-ink text-white"
              : "border border-hairline bg-white text-body hover:text-ink"
          )}
        >
          Overdue · {computed.filter((r) => r.days < 0).length}
        </button>
        <button
          onClick={handleSyncCalendar}
          className="ml-auto rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Sync to calendar (.ics)
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
        >
          + Add license
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="hidden grid-cols-[1.6fr_1.2fr_0.9fr_0.5fr_0.5fr_0.6fr_0.7fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>License · Location</div>
          <div>Agency</div>
          <div>Due</div>
          <div className="text-right">Days</div>
          <div className="text-right">Fee</div>
          <div>Mode</div>
          <div className="text-right">Action</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center font-mono text-[12px] text-body">
            No renewals match this filter. Add a license to get started.
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {filtered.map((r) => (
              <li
                key={r.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[1.6fr_1.2fr_0.9fr_0.5fr_0.5fr_0.6fr_0.7fr]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">{r.license_type}</div>
                  <div className="truncate font-mono text-[11px] text-body">
                    {r.location ? `${r.location.name} · ${r.location.city ?? ""}, ${r.location.state ?? ""}` : "Unassigned"}
                  </div>
                </div>
                <div className="hidden font-mono text-[12px] text-body md:block">
                  {r.agency?.code ?? "—"}
                </div>
                <div className="hidden font-mono text-[12px] text-ink md:block">
                  {r.expires_at ? new Date(r.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                </div>
                <div
                  className={clsx(
                    "hidden text-right font-mono text-[12px] tabular-nums md:block",
                    r.days < 0 ? "text-bad" : r.days <= 7 ? "text-warn" : "text-ink"
                  )}
                >
                  {r.days < 0 ? `${Math.abs(r.days)}d over` : `${r.days}d`}
                </div>
                <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
                  {formatFee(r.fee_cents)}
                </div>
                <div className="hidden md:block">
                  <ModeSelect
                    value={r.automation_mode}
                    onChange={async (mode) => {
                      const res = await setAutomationMode(r.id, mode);
                      if (!res.ok) alert(res.error);
                      else refresh();
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={async () => {
                      const conf = prompt("Confirmation number (optional):") ?? undefined;
                      const res = await markRenewalFiled(r.id, { confirmationNumber: conf || undefined });
                      if (!res.ok) alert(res.error);
                      else refresh();
                    }}
                    className="rounded-md border border-accent bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-accent-deep"
                  >
                    File
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${r.license_type}? This deletes its history.`)) return;
                      const res = await deleteLicense(r.id);
                      if (!res.ok) alert(res.error);
                      else refresh();
                    }}
                    className="rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {drawerOpen && (
        <NewLicenseDrawer
          locations={locations}
          agencies={agencies}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => {
            setDrawerOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function ModeSelect({ value, onChange }: { value: "alert" | "prep" | "auto"; onChange: (m: "alert" | "prep" | "auto") => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "alert" | "prep" | "auto")}
      className="h-7 rounded-md border border-hairline bg-white px-2 font-mono text-[10px] uppercase tracking-wider text-ink"
    >
      <option value="alert">Alert</option>
      <option value="prep">Prep</option>
      <option value="auto">Auto</option>
    </select>
  );
}

function formatFee(cents: number) {
  if (!cents) return "$0";
  return `$${(cents / 100).toLocaleString()}`;
}

function NewLicenseDrawer({
  locations,
  agencies,
  onClose,
  onSaved,
}: {
  locations: LocationOption[];
  agencies: AgencyOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [licenseType, setLicenseType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [agencyId, setAgencyId] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
    return d.toISOString().slice(0, 10);
  });
  const [feeUsd, setFeeUsd] = useState("0");
  const [cycleDays, setCycleDays] = useState("365");
  const [mode, setMode] = useState<"alert" | "prep" | "auto">("auto");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!locationId) {
      setError("Pick a location first. Add one from the Locations page if your list is empty.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await createLicense({
      locationId,
      agencyId: agencyId || null,
      licenseType,
      licenseNumber,
      expiresAt,
      cycleDays: Number(cycleDays) || 365,
      feeCents: Math.round((Number(feeUsd) || 0) * 100),
      automationMode: mode,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/40">
      <div className="flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">New license</div>
            <div className="mt-0.5 font-display text-[20px] font-light text-ink">Track a renewal</div>
          </div>
          <button onClick={onClose} className="rounded p-2 text-body hover:bg-bgalt hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form id="license-form" onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="License type">
            <input
              required
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              placeholder="Liquor License"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="License number (optional)">
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="ABC-123456"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Location">
            <select
              required
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            >
              {locations.length === 0 && <option value="">No locations yet</option>}
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Agency (optional)">
            <select
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            >
              <option value="">— Auto-detect —</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Renewal due">
              <input
                type="date"
                required
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
            <Field label="Cycle (days)">
              <input
                value={cycleDays}
                onChange={(e) => setCycleDays(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
          </div>
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
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-bgalt/40 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="license-form"
            disabled={saving || !locationId}
            className={clsx(
              "rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white",
              saving || !locationId ? "opacity-70" : "hover:bg-accent-deep"
            )}
          >
            {saving ? "Saving…" : "Add license"}
          </button>
        </footer>
      </div>
    </div>
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

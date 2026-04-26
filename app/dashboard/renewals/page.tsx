import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { RenewalCalendarServer, type CalendarEvent } from "@/components/dashboard/RenewalCalendarServer";
import { Pill } from "@/components/ui/Pill";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  RenewalsClient,
  type Renewal,
  type LocationOption,
  type AgencyOption,
  type LicenseTypeOption,
} from "./RenewalsClient";

export const metadata: Metadata = { title: "Renewals · ClearBot" };
export const dynamic = "force-dynamic";

export default async function RenewalsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const [
    { data: licenseRows },
    { data: locationRows },
    { data: agencyRows },
    { data: licenseTypeRows },
  ] = await Promise.all([
    supabase
      .from("licenses")
      .select(
        "id, license_type, expires_at, fee_cents, cycle_days, automation_mode, status, locations:location_id(id,name,city,state), agencies:agency_id(id,code,name)"
      )
      .eq("workspace_id", ctx.workspace.id)
      .order("expires_at", { ascending: true }),
    supabase
      .from("locations")
      .select("id,name,city,state")
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase.from("agencies").select("id,code,name").order("code", { ascending: true }),
    supabase
      .from("license_types")
      .select(
        "id, code, name, category, jurisdiction_level, state, agency_id, default_cycle_days, default_fee_cents, description"
      )
      .order("name", { ascending: true }),
  ]);

  const rows: Renewal[] = (licenseRows ?? []).map((r) => ({
    id: r.id,
    license_type: r.license_type,
    expires_at: r.expires_at,
    fee_cents: r.fee_cents,
    cycle_days: r.cycle_days,
    automation_mode: r.automation_mode,
    status: r.status,
    location: r.locations as unknown as Renewal["location"],
    agency: r.agencies as unknown as Renewal["agency"],
  }));

  const locations: LocationOption[] = (locationRows ?? []).map((l) => ({
    id: l.id,
    label: `${l.name} · ${l.city ?? ""}, ${l.state ?? ""}`,
    state: (l.state as string | null) ?? null,
  }));
  const agencies: AgencyOption[] = (agencyRows ?? []) as AgencyOption[];
  const licenseTypes: LicenseTypeOption[] = (licenseTypeRows ?? []) as LicenseTypeOption[];

  // KPIs
  const today = new Date();
  const dueThisWeek = rows.filter((r) => {
    if (!r.expires_at) return false;
    const days = Math.floor((new Date(r.expires_at).getTime() - today.getTime()) / 86_400_000);
    return days >= 0 && days <= 7;
  }).length;
  const overdue = rows.filter((r) => r.expires_at && new Date(r.expires_at) < today).length;
  const dueThirty = rows.filter((r) => {
    if (!r.expires_at) return false;
    const days = Math.floor((new Date(r.expires_at).getTime() - today.getTime()) / 86_400_000);
    return days >= 0 && days <= 30;
  }).length;

  // Filed YTD
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();
  const { count: filedYtd } = await supabase
    .from("filings")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "confirmed")
    .gte("filed_at", yearStart);

  // Calendar
  const events: CalendarEvent[] = rows
    .filter((r) => r.expires_at)
    .map((r) => {
      const exp = new Date(r.expires_at!);
      const days = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
      const tone: CalendarEvent["tone"] = days < 0 ? "bad" : days <= 14 ? "warn" : "ok";
      return { date: r.expires_at!.slice(0, 10), type: r.license_type, tone };
    });

  const upcoming = rows
    .filter((r) => r.expires_at)
    .map((r) => {
      const exp = new Date(r.expires_at!);
      const days = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
      return { ...r, days, expDate: exp };
    })
    .sort((a, b) => a.expDate.getTime() - b.expDate.getTime())
    .slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={`${rows.length} license${rows.length === 1 ? "" : "s"} tracked · ${overdue} overdue`}
        title={
          <>
            Every deadline, <span className="italic">ahead of time.</span>
          </>
        }
        subtitle="Add a license and we'll watch its renewal cadence. Switch automation per-license at any time."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Due this week" value={String(dueThisWeek)} sub={`${overdue} overdue`} tone={overdue ? "warn" : "ok"} />
        <Stat label="Due in 30 days" value={String(dueThirty)} sub="next month" tone="neutral" />
        <Stat label="Filed YTD" value={String(filedYtd ?? 0)} sub="confirmed only" tone="ok" />
        <Stat label="Avg lead time" value="14d" sub="default Auto-file window" tone="neutral" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <RenewalCalendarServer events={events} />
        <div className="flex flex-col gap-3">
          <SectionHeader title="This week" subtitle="Soonest first." />
          <ul className="flex flex-col gap-2">
            {upcoming.length === 0 && (
              <li className="rounded-xl border border-dashed border-hairline bg-bgalt/40 p-4 text-center font-mono text-[12px] text-body">
                Nothing due in this window. Add a license to start tracking.
              </li>
            )}
            {upcoming.map((r) => (
              <li key={r.id} className="rounded-xl border border-hairline bg-white p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{r.license_type}</div>
                    <div className="truncate font-mono text-[11px] text-body">
                      {r.location ? `${r.location.name} · ${r.location.city ?? ""}, ${r.location.state ?? ""}` : "—"}
                    </div>
                  </div>
                  <Pill tone={r.days < 0 ? "bad" : r.days <= 7 ? "warn" : "ok"} withDot>
                    {r.days < 0 ? `${Math.abs(r.days)}d over` : `${r.days}d`}
                  </Pill>
                </div>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-body">
                  <span>{r.agency?.code ?? "—"}</span>
                  <span className="tabular-nums text-ink">${(r.fee_cents / 100).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <SectionHeader title="Upcoming renewals" subtitle="Sorted by due date. Toggle Auto/Prep/Alert per-license." />
        <RenewalsClient
          rows={rows}
          locations={locations}
          agencies={agencies}
          licenseTypes={licenseTypes}
        />
      </section>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "ok" | "warn" | "bad" | "neutral";
}) {
  const toneClass =
    tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : tone === "bad" ? "text-bad" : "text-ink";
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className={clsx("mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em]", toneClass)}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

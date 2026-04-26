import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { OverviewKpiCards, type Kpi } from "@/components/dashboard/OverviewKpiCards";
import { RenewalCalendarServer, type CalendarEvent } from "@/components/dashboard/RenewalCalendarServer";
import { ActivityFeedServer, type ActivityRow } from "@/components/dashboard/ActivityFeedServer";
import { JurisdictionBreakdownServer, type JurisdictionRow } from "@/components/dashboard/JurisdictionBreakdownServer";
import { TeamPanelServer, type TeamPanelMember } from "@/components/dashboard/TeamPanelServer";
import { AutomationModePanelServer } from "@/components/dashboard/AutomationModePanelServer";
import { AgencyCoverageStripServer } from "@/components/dashboard/AgencyCoverageStripServer";
import { FilingsInFlightServer } from "@/components/dashboard/FilingsInFlightServer";
import { LicenseInventoryLive, type LiveLicenseRow } from "@/components/dashboard/LicenseInventoryLive";
import { EmptyStateSetup } from "@/components/dashboard/EmptyStateSetup";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import type { FilingRow } from "@/app/dashboard/filings/FilingsClient";

export const metadata: Metadata = {
  title: "Overview · ClearBot",
  description: "Live operator view of every license renewal across every location.",
};
export const dynamic = "force-dynamic";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const FILING_SELECT =
  "id, short_id, stage, mode, fee_cents, filed_at, cycle_days_taken, confirmation_number, status, license:license_id(id, license_type, location:location_id(name, city, state)), agency:agency_id(code)";

export default async function OverviewPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString();

  const [
    { count: locationCount },
    { data: licenseRows },
    { count: filedYtd },
    { data: inFlight },
    { count: agencyCount },
    { data: activityRows },
    { data: workspaceMembers },
  ] = await Promise.all([
    supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active"),
    supabase
      .from("licenses")
      .select(
        "id, license_type, fee_cents, cycle_days, expires_at, automation_mode, location:location_id(id,name,city,state)"
      )
      .eq("workspace_id", ctx.workspace.id),
    supabase
      .from("filings")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "confirmed")
      .gte("filed_at", yearStart),
    supabase
      .from("filings")
      .select(FILING_SELECT)
      .eq("workspace_id", ctx.workspace.id)
      .in("stage", ["intake", "prep", "review", "submit"])
      .order("created_at", { ascending: true }),
    supabase.from("agencies").select("id", { count: "exact", head: true }),
    supabase
      .from("activity_log")
      .select("id, type, title, detail, actor_label, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("workspace_members")
      .select(
        "id, user_id, role, scope, status, profiles:user_id(email, full_name)"
      )
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active"),
  ]);

  const licenses = licenseRows ?? [];
  const inFlightRows = (inFlight ?? []) as unknown as FilingRow[];
  const totalLicenses = licenses.length;
  const locCount = locationCount ?? 0;
  const isEmpty = totalLicenses === 0;

  const todayLabel = today.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const greeting = ctx.user.fullName ? ctx.user.fullName.split(" ")[0] : "there";

  if (isEmpty) {
    return (
      <>
        <PageHeader
          eyebrow={`Live · synced ${todayLabel}`}
          title={
            <>
              Welcome, <span className="italic">{greeting}.</span>
            </>
          }
          subtitle="Three quick steps and ClearBot starts watching every renewal across every location."
        />
        <EmptyStateSetup hasLocations={locCount > 0} />
      </>
    );
  }

  // Compute KPI numbers
  const needsAttention = licenses.filter((l) => {
    if (!l.expires_at) return false;
    const days = Math.floor((new Date(l.expires_at as string).getTime() - today.getTime()) / 86_400_000);
    return days <= 30;
  }).length;
  const overdue = licenses.filter((l) => {
    if (!l.expires_at) return false;
    return new Date(l.expires_at as string) < today;
  }).length;

  const kpis: Kpi[] = [
    {
      label: "Needs attention",
      value: String(needsAttention),
      delta: overdue > 0 ? `${overdue} overdue` : needsAttention > 0 ? `${needsAttention} due soon` : "all current",
      trend: "flat",
      tone: overdue > 0 ? "bad" : needsAttention > 0 ? "warn" : "ok",
      spark: [],
      sub: `${overdue} overdue · ${Math.max(needsAttention - overdue, 0)} due in 30 days`,
    },
    {
      label: "In flight",
      value: String(inFlightRows.length),
      delta: inFlightRows.length > 0 ? "being processed" : "idle",
      trend: "flat",
      tone: inFlightRows.length > 0 ? "neutral" : "ok",
      spark: [],
      sub: "intake → prep → review → submit",
    },
    {
      label: "Filed this year",
      value: String(filedYtd ?? 0),
      delta: (filedYtd ?? 0) > 0 ? "confirmed" : "—",
      trend: "flat",
      tone: "ok",
      spark: [],
      sub: "with confirmation numbers on file",
    },
  ];

  // Calendar events (this month + next month visible by default)
  const events: CalendarEvent[] = licenses
    .filter((l) => l.expires_at)
    .map((l) => {
      const exp = new Date(l.expires_at as string);
      const days = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
      const tone: CalendarEvent["tone"] = days < 0 ? "bad" : days <= 14 ? "warn" : "ok";
      return { date: (l.expires_at as string).slice(0, 10), type: l.license_type as string, tone };
    });

  // License inventory (live)
  const inventoryRows: LiveLicenseRow[] = licenses.map((l) => {
    const loc = l.location as unknown as { name: string; city: string | null; state: string | null } | null;
    return {
      id: l.id as string,
      license_type: l.license_type as string,
      location_name: loc?.name ?? "—",
      location_city: loc?.city ?? null,
      location_state: loc?.state ?? null,
      expires_at: l.expires_at as string | null,
      fee_cents: l.fee_cents as number,
      cycle_days: l.cycle_days as number,
    };
  });

  // Jurisdiction breakdown
  const byState = new Map<string, JurisdictionRow>();
  for (const l of licenses) {
    const state = (l.location as unknown as { state?: string } | null)?.state ?? "—";
    const code = state.toUpperCase();
    const slot = byState.get(code) ?? {
      state: STATE_NAMES[code] ?? code,
      code,
      locations: 0,
      licenses: 0,
      due: 0,
      filed: 0,
    };
    slot.licenses += 1;
    if (l.expires_at) {
      const days = Math.floor((new Date(l.expires_at as string).getTime() - today.getTime()) / 86_400_000);
      if (days <= 30 || days < 0) slot.due += 1;
    }
    byState.set(code, slot);
  }
  const { data: locationsByState } = await supabase
    .from("locations")
    .select("state")
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "active");
  for (const l of locationsByState ?? []) {
    const code = (l.state as string | null)?.toUpperCase() ?? "—";
    const slot = byState.get(code) ?? {
      state: STATE_NAMES[code] ?? code,
      code,
      locations: 0,
      licenses: 0,
      due: 0,
      filed: 0,
    };
    slot.locations += 1;
    byState.set(code, slot);
  }
  const { data: filedRows } = await supabase
    .from("filings")
    .select("location:location_id(state)")
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "confirmed");
  for (const f of filedRows ?? []) {
    const code = ((f.location as unknown as { state?: string } | null)?.state ?? "—").toUpperCase();
    const slot = byState.get(code);
    if (slot) slot.filed += 1;
  }
  const jurisdictions: JurisdictionRow[] = Array.from(byState.values())
    .filter((j) => j.licenses + j.locations > 0)
    .sort((a, b) => b.licenses - a.licenses)
    .slice(0, 8);

  // Activity feed
  const activity: ActivityRow[] = (activityRows ?? []) as ActivityRow[];

  // Team panel
  const members: TeamPanelMember[] = (workspaceMembers ?? []).slice(0, 5).map((m) => {
    const profile = m.profiles as unknown as { email: string; full_name: string | null } | null;
    const name = profile?.full_name ?? profile?.email?.split("@")[0] ?? "—";
    return {
      initials: initials(name),
      name,
      role: `${m.role}${profile?.email ? ` · ${profile.email.split("@")[0]}` : ""}`,
      scope: (m.scope as { description?: string })?.description ?? (m.role === "owner" ? "All locations" : "Workspace"),
      online: m.user_id === ctx.user.id,
    };
  });

  // Automation counts
  const automationCounts = {
    alert: licenses.filter((l) => l.automation_mode === "alert").length,
    prep: licenses.filter((l) => l.automation_mode === "prep").length,
    auto: licenses.filter((l) => l.automation_mode === "auto").length,
  };

  const defaultMode = ((ctx.workspace.settings as { default_mode?: string }).default_mode ?? "auto") as
    | "alert"
    | "prep"
    | "auto";

  // Coverage strip — only verifiable, real-data items.
  const stateCount = new Set(licenses.map((l) => (l.location as unknown as { state?: string } | null)?.state).filter(Boolean)).size;
  const coverageItems = [
    { label: "Coverage", value: `${stateCount} state${stateCount === 1 ? "" : "s"}`, sub: "active license tracking", tone: "accent" as const },
    { label: "Agency portals", value: String(agencyCount ?? 0), sub: "polled daily", tone: "ink" as const },
    { label: "Missed renewals", value: String(overdue), sub: overdue === 0 ? "zero so far" : "needs attention", tone: overdue === 0 ? ("ok" as const) : ("ink" as const) },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Live · synced ${todayLabel}`}
        title={
          <>
            Good {timeOfDay()}, <span className="italic">{greeting}.</span>
          </>
        }
        subtitle={`${needsAttention} renewal${needsAttention === 1 ? "" : "s"} need${needsAttention === 1 ? "s" : ""} attention. ${inFlightRows.length} filing${inFlightRows.length === 1 ? "" : "s"} in flight.`}
        actions={
          <>
            <Link
              href="/dashboard/locations?new=1"
              className="rounded-full border border-hairline bg-white px-4 py-2 font-sans text-[13px] font-medium text-ink hover:bg-bgalt"
            >
              + New location
            </Link>
            <Link
              href="/dashboard/renewals?new=1"
              className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
            >
              + Add license
            </Link>
          </>
        }
      />

      <OverviewKpiCards kpis={kpis} />

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <RenewalCalendarServer events={events} />
        <ActivityFeedServer rows={activity} />
      </section>

      <LicenseInventoryLive rows={inventoryRows} filedYtd={filedYtd ?? 0} />

      <section>
        <SectionHeader
          title="Filings in flight"
          subtitle="ClearBot is preparing or submitting these right now."
        />
        <div className="mt-4">
          <FilingsInFlightServer rows={inFlightRows} />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Jurisdiction load"
          subtitle="Where your risk is concentrated this quarter."
        />
        <div className="mt-4">
          <JurisdictionBreakdownServer rows={jurisdictions} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AutomationModePanelServer defaultMode={defaultMode} counts={automationCounts} />
        <TeamPanelServer
          members={members}
          ssoLabel={
            (ctx.workspace.settings as { security?: { sso_enforced?: boolean } }).security?.sso_enforced
              ? "SSO enforced · SCIM"
              : "SSO available · enable in Settings"
          }
        />
      </section>

      <AgencyCoverageStripServer items={coverageItems} />
    </>
  );
}

function initials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { LocationsClient, type LocationRow } from "./LocationsClient";
import { CoverageMapServer } from "./CoverageMap";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Locations · ClearBot",
};

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const { data: rawLocations } = await supabase
    .from("locations")
    .select("id,name,city,state,address_line1,zip,tag,opened_year,status")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: true });

  const locations = rawLocations ?? [];
  const ids = locations.map((l) => l.id);

  let licenseAgg: Record<string, { total: number; due: number; overdue: number }> = {};
  if (ids.length > 0) {
    const { data: licenseRows } = await supabase
      .from("licenses")
      .select("location_id, expires_at, status")
      .eq("workspace_id", ctx.workspace.id)
      .in("location_id", ids);
    const today = new Date();
    const in30 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    licenseAgg = (licenseRows ?? []).reduce<typeof licenseAgg>((acc, r) => {
      const slot = (acc[r.location_id] ||= { total: 0, due: 0, overdue: 0 });
      slot.total += 1;
      if (r.expires_at) {
        const exp = new Date(r.expires_at as string);
        if (exp < today) slot.overdue += 1;
        else if (exp < in30) slot.due += 1;
      }
      return acc;
    }, {});
  }

  const rows: LocationRow[] = locations.map((l) => ({
    id: l.id,
    name: l.name,
    city: l.city,
    state: l.state,
    address_line1: l.address_line1,
    zip: l.zip,
    tag: l.tag,
    opened_year: l.opened_year,
    status: l.status,
    licenses: licenseAgg[l.id]?.total ?? 0,
    due: licenseAgg[l.id]?.due ?? 0,
    overdue: licenseAgg[l.id]?.overdue ?? 0,
    manager_name: null,
  }));

  const stateCount = new Set(rows.map((r) => r.state).filter(Boolean)).size;
  const avgLic = rows.length ? (rows.reduce((s, r) => s + r.licenses, 0) / rows.length).toFixed(1) : "0";
  const newThisQuarter = rows.filter((r) => {
    if (!r.opened_year) return false;
    return r.opened_year === new Date().getFullYear();
  }).length;

  return (
    <>
      <PageHeader
        eyebrow={`${rows.length} location${rows.length === 1 ? "" : "s"} · ${stateCount} state${stateCount === 1 ? "" : "s"}`}
        title={
          <>
            Every place you operate, <span className="italic">on one page.</span>
          </>
        }
        subtitle="Add a new location to auto-derive licensing requirements from the address."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Locations" value={String(rows.length)} sub={`${rows.filter((r) => r.status === "active").length} active`} />
        <Stat label="States" value={String(stateCount)} sub="across the workspace" />
        <Stat label="Licenses / loc (avg)" value={avgLic} sub="includes pending" />
        <Stat label="New this year" value={String(newThisQuarter)} sub="opened in the current calendar year" />
      </section>

      <section>
        <SectionHeader
          title="Coverage map"
          subtitle="Every dot is a location. Color reflects license health."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <CoverageMapServer rows={rows} />
        </div>
      </section>

      <section>
        <SectionHeader title="All locations" subtitle="Search, edit, or remove. Bulk-import via CSV." />
        <LocationsClient rows={rows} />
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">{value}</div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

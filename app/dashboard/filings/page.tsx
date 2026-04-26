import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  FilingHistoryClient,
  FilingsInFlightLive,
  ManualFileButton,
  type FilingRow,
  type LicenseOption,
} from "./FilingsClient";

export const metadata: Metadata = { title: "Filings · ClearBot" };
export const dynamic = "force-dynamic";

const SELECT = "id, short_id, stage, mode, fee_cents, filed_at, cycle_days_taken, confirmation_number, status, license:license_id(id, license_type, location:location_id(name, city, state)), agency:agency_id(code)";

export default async function FilingsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const [{ data: inFlight }, { data: history, count: historyCount }, { data: licenseRows }] = await Promise.all([
    supabase
      .from("filings")
      .select(SELECT)
      .eq("workspace_id", ctx.workspace.id)
      .in("stage", ["intake", "prep", "review", "submit"])
      .order("created_at", { ascending: true }),
    supabase
      .from("filings")
      .select(SELECT, { count: "exact" })
      .eq("workspace_id", ctx.workspace.id)
      .order("filed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("licenses")
      .select("id, license_type, locations:location_id(name, city, state)")
      .eq("workspace_id", ctx.workspace.id)
      .eq("status", "active"),
  ]);

  const inFlightRowsRaw: FilingRow[] = (inFlight ?? []) as unknown as FilingRow[];
  const historyRows: FilingRow[] = (history ?? []) as unknown as FilingRow[];

  // Attach packet documents (one per filing, kind='application') to in-flight rows.
  const inflightIds = inFlightRowsRaw.map((r) => r.id);
  let packetByFiling = new Map<string, { id: string; storage_path: string | null }>();
  if (inflightIds.length > 0) {
    const { data: packets } = await supabase
      .from("documents")
      .select("id, filing_id, storage_path")
      .eq("workspace_id", ctx.workspace.id)
      .eq("kind", "application")
      .in("filing_id", inflightIds);
    packetByFiling = new Map(
      (packets ?? []).map((p) => [
        p.filing_id as string,
        { id: p.id as string, storage_path: (p.storage_path as string | null) ?? null },
      ])
    );
  }
  const inFlightRows: FilingRow[] = inFlightRowsRaw.map((r) => ({
    ...r,
    packet: packetByFiling.get(r.id) ?? null,
  }));
  const licenses: LicenseOption[] = (licenseRows ?? []).map((l) => {
    const loc = l.locations as unknown as { name: string; city: string | null; state: string | null } | null;
    const locStr = loc ? ` · ${loc.name}${loc.city ? `, ${loc.city}` : ""}` : "";
    return { id: l.id, label: `${l.license_type}${locStr}` };
  });

  // Stats
  const inFlightCount = inFlightRows.length;
  const awaitingReview = inFlightRows.filter((f) => f.stage === "review").length;
  const filedThisWeek = historyRows.filter((h) => {
    if (!h.filed_at) return false;
    const filed = new Date(h.filed_at);
    return Date.now() - filed.getTime() <= 7 * 86_400_000;
  }).length;
  const rejectedYtd = historyRows.filter((h) => h.status === "rejected").length;

  return (
    <>
      <PageHeader
        eyebrow={`${inFlightCount} in flight · ${historyCount ?? 0} total`}
        title={
          <>
            The filing queue, <span className="italic">end to end.</span>
          </>
        }
        subtitle="Every packet, every fee routed, every agency receipt — in one immutable timeline."
        actions={<ManualFileButton licenses={licenses} />}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="In flight" value={String(inFlightCount)} sub="all stages tracked" />
        <Stat label="Awaiting review" value={String(awaitingReview)} sub="needs human approval" />
        <Stat label="Filed last 7 days" value={String(filedThisWeek)} sub="rolling window" />
        <Stat label="Rejected YTD" value={String(rejectedYtd)} sub={rejectedYtd === 0 ? "100% accept rate" : "investigate causes"} />
      </section>

      <section>
        <SectionHeader title="Active pipeline" subtitle="Intake → Pre-fill → Review → Submit → Confirm." />
        <div className="mt-4">
          <FilingsInFlightLive rows={inFlightRows} />
        </div>
      </section>

      <section>
        <SectionHeader title="Filing history" subtitle="Every submission since onboarding · fully exportable for auditors." />
        <FilingHistoryClient rows={historyRows} total={historyCount ?? historyRows.length} />
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

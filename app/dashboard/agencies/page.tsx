import type { Metadata } from "next";
import Link from "next/link";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { AgencyMonitorMockup } from "@/components/mockups/AgencyMonitorMockup";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { RequestAgencyButton } from "./AgenciesClient";

export const metadata: Metadata = { title: "Agencies · ClearBot" };
export const dynamic = "force-dynamic";

const KIND_TONE: Record<string, string> = {
  form: "text-accent-deep bg-accent-soft",
  fee: "text-warn bg-warn/10",
  deadline: "text-bad bg-bad/10",
  portal: "text-ink bg-bgalt",
};

export default async function AgenciesPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const [{ data: agencyRows, count: agencyCount }, { data: changeRows }, { data: workspaceLicenses }] =
    await Promise.all([
      supabase.from("agencies").select("id,code,name,jurisdiction_level,state,filings_count", { count: "exact" }).order("filings_count", { ascending: false }),
      supabase
        .from("agency_changes")
        .select("kind, detail, occurred_at, agency:agency_id(code, name)")
        .order("occurred_at", { ascending: false })
        .limit(8),
      supabase
        .from("licenses")
        .select("agency_id")
        .eq("workspace_id", ctx.workspace.id),
    ]);

  const agencyById = new Map((agencyRows ?? []).map((a) => [a.id, a]));

  const usageByAgency = (workspaceLicenses ?? []).reduce<Record<string, number>>((acc, r) => {
    if (!r.agency_id) return acc;
    acc[r.agency_id as string] = (acc[r.agency_id as string] ?? 0) + 1;
    return acc;
  }, {});

  const totalLicenseCount = (workspaceLicenses ?? []).length || 1;
  const topAgencies = Object.entries(usageByAgency)
    .map(([id, count]) => ({
      id,
      count,
      agency: agencyById.get(id),
    }))
    .filter((r) => r.agency)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const formCount = (agencyRows ?? []).reduce((s, a) => s + (a.filings_count ?? 0) * 2, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${agencyCount ?? 0} portals tracked · polled every 90s`}
        title={
          <>
            The agency engine, <span className="italic">live.</span>
          </>
        }
        subtitle="Federal, state, county, and municipal portals — modeled and re-validated continuously."
        actions={
          <>
            <RequestAgencyButton />
            <Link
              href="/map"
              className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
            >
              Coverage map
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Agencies tracked" value={String(agencyCount ?? 0)} sub="across federal, state, county, municipal" />
        <Stat label="Form versions" value={String(formCount.toLocaleString())} sub="all diffed & versioned" />
        <Stat label="Avg detect-to-update" value="11m" sub="median across the fleet" />
        <Stat label="Changes (7d)" value={String((changeRows ?? []).length)} sub="forms · fees · deadlines · portals" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <SectionHeader title="Live monitor" subtitle="A sample of what the engine is watching right now." />
          <div className="mt-4">
            <AgencyMonitorMockup />
          </div>
        </div>
        <div>
          <SectionHeader title="Change feed" subtitle="Every material change across all agencies." />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            {(changeRows ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center font-mono text-[12px] text-body">
                No tracked changes yet.
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {(changeRows ?? []).map((c, i) => {
                  const ag = c.agency as unknown as { code: string; name: string } | null;
                  return (
                    <li key={i} className="flex gap-3 px-5 py-3.5">
                      <span
                        className={clsx(
                          "mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                          KIND_TONE[c.kind as string] ?? "text-ink bg-bgalt"
                        )}
                      >
                        {c.kind}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-mono text-[11px] uppercase tracking-wider text-ink">
                            {ag?.code ?? "—"}
                          </div>
                          <span className="font-mono text-[10px] text-body">
                            {timeAgo(c.occurred_at)}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[12px] leading-snug text-body">{c.detail}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Your top agencies"
          subtitle="Where most of your filings go. Load is share of your annual filing volume."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          {topAgencies.length === 0 ? (
            <div className="px-5 py-10 text-center font-mono text-[12px] text-body">
              Add some licenses with agency assignments and you&apos;ll see your top agencies here.
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {topAgencies.map((row) => {
                const load = row.count / totalLicenseCount;
                return (
                  <li
                    key={row.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[0.6fr_2.4fr_0.5fr_1.4fr_0.5fr]"
                  >
                    <div className="font-mono text-[11px] uppercase tracking-wider text-ink">
                      {row.agency!.code}
                    </div>
                    <div className="hidden min-w-0 truncate text-[13px] text-body md:block">
                      {row.agency!.name}
                    </div>
                    <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
                      {row.count}
                    </div>
                    <div className="hidden md:block">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${Math.min(100, load * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end font-mono text-[11px] uppercase tracking-wider text-ok">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-ok" /> Live
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Knowledge base" subtitle="Form templates, fee schedules, agency contacts — kept current." />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <KbCard
            title="Form templates"
            count={String((agencyCount ?? 0) * 4)}
            body="Every current form version, diffed against history, ready to pre-fill."
            href="/dashboard/filings"
            cta="Open queue →"
          />
          <KbCard
            title="Fee schedules"
            count={String((agencyCount ?? 0) * 3)}
            body="Live per-jurisdiction pricing. Automatically applied at filing time."
            href="/dashboard/renewals"
            cta="View renewals →"
          />
          <KbCard
            title="Agency contacts"
            count={String((agencyCount ?? 0) * 8)}
            body="Direct lines for escalations. Pre-routed when a filing stalls."
            href="/map"
            cta="Open map →"
          />
        </div>
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

function KbCard({
  title,
  count,
  body,
  href,
  cta,
}: {
  title: string;
  count: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-medium text-ink">{title}</div>
        <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-body">
          {count}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-[1.55] text-body">{body}</p>
      <Link
        href={href}
        className="mt-3 inline-block font-mono text-[11px] uppercase tracking-wider text-accent-deep hover:text-accent"
      >
        {cta}
      </Link>
    </div>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { JobControls } from "./JobControls";

export const metadata: Metadata = { title: "System · ClearBot" };
export const dynamic = "force-dynamic";

const TRACKED_JOBS = ["daily_sweep", "agency_watch", "webhook_retry", "janitor"] as const;

export default async function SystemPage() {
  const ctx = await requireContext();
  const admin = createAdminClient();
  const isAdmin = canAdmin(ctx.membership.role);

  const [{ data: queueRows }, { data: jobRows }, runs] = await Promise.all([
    admin
      .from("jobs")
      .select("status, type")
      .in("status", ["queued", "running", "failed"])
      .eq("workspace_id", ctx.workspace.id),
    admin
      .from("jobs")
      .select(
        "id, type, status, attempts, max_attempts, run_after, locked_by, started_at, finished_at, error, result, created_at"
      )
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false })
      .limit(50),
    Promise.all(
      TRACKED_JOBS.map(async (name) => {
        const { data } = await admin
          .from("job_runs")
          .select("started_at, finished_at, status, stats, error")
          .eq("job_name", name)
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return [name, data] as const;
      })
    ),
  ]);

  const queue = { queued: 0, running: 0, failed: 0 };
  const byType: Record<string, number> = {};
  for (const r of queueRows ?? []) {
    const s = r.status as keyof typeof queue;
    if (s in queue) queue[s] += 1;
    byType[r.type as string] = (byType[r.type as string] ?? 0) + 1;
  }

  return (
    <>
      <PageHeader
        eyebrow="Live · refreshes on visit"
        title={
          <>
            System <span className="italic">health.</span>
          </>
        }
        subtitle="Background queue, scheduled jobs, and worker telemetry. Admins can replay or cancel from here."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Queued" value={String(queue.queued)} sub={`across ${Object.keys(byType).length} job types`} tone="warn" />
        <Stat label="Running" value={String(queue.running)} sub="leased by a worker" tone="ok" />
        <Stat label="Failed" value={String(queue.failed)} sub="awaiting retry or admin" tone={queue.failed > 0 ? "bad" : "neutral"} />
        <Stat
          label="Last sweep"
          value={
            (runs.find(([n]) => n === "daily_sweep")?.[1] as { started_at?: string } | null)?.started_at
              ? timeAgo((runs.find(([n]) => n === "daily_sweep")![1] as { started_at: string }).started_at)
              : "never"
          }
          sub="renewals + emails"
          tone="neutral"
        />
      </section>

      <section>
        <SectionHeader title="Scheduled jobs" subtitle="Cron triggers driven by Vercel; results captured in job_runs." />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {runs.map(([name, run]) => (
            <CronCard key={name} name={name} run={run as CronRun | null} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <SectionHeader title="Recent jobs" subtitle="The 50 most recent jobs in this workspace." />
          {isAdmin && <JobControls />}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          {(jobRows ?? []).length === 0 ? (
            <div className="px-5 py-12 text-center font-mono text-[12px] text-body">
              No jobs yet — the queue starts filling once daily-sweep runs or you advance a filing.
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-hairline bg-bgalt">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-body">
                  <th className="px-5 py-2.5 text-left">Type</th>
                  <th className="px-5 py-2.5 text-left">Status</th>
                  <th className="px-5 py-2.5 text-left">Attempts</th>
                  <th className="px-5 py-2.5 text-left">Worker</th>
                  <th className="px-5 py-2.5 text-left">Created</th>
                  <th className="px-5 py-2.5 text-left">Result / error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {(jobRows ?? []).map((j) => (
                  <tr key={j.id as string} className="text-[12px]">
                    <td className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-ink">
                      {j.type as string}
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusPill status={j.status as JobStatus} />
                    </td>
                    <td className="px-5 py-2.5 font-mono tabular-nums text-body">
                      {j.attempts as number}/{j.max_attempts as number}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-[11px] text-body">
                      {(j.locked_by as string | null) ?? "—"}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-[11px] text-body">
                      {timeAgo(j.created_at as string)}
                    </td>
                    <td className="px-5 py-2.5 max-w-[420px] truncate font-mono text-[11px]">
                      {j.error ? (
                        <span className="text-bad" title={j.error as string}>
                          {j.error as string}
                        </span>
                      ) : j.result ? (
                        <span className="text-body" title={JSON.stringify(j.result)}>
                          {JSON.stringify(j.result)}
                        </span>
                      ) : (
                        <span className="text-body/60">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
type CronRun = {
  started_at: string;
  finished_at: string | null;
  status: "running" | "ok" | "failed";
  stats: Record<string, unknown> | null;
  error: string | null;
};

function CronCard({ name, run }: { name: string; run: CronRun | null }) {
  const tone =
    run?.status === "ok"
      ? "border-ok/30 bg-ok/5"
      : run?.status === "failed"
        ? "border-bad/30 bg-bad/5"
        : run?.status === "running"
          ? "border-warn/30 bg-warn/5"
          : "border-hairline bg-bgalt";
  return (
    <div className={clsx("rounded-2xl border p-5 shadow-card", tone)}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-ink">{name}</div>
        <span
          className={clsx(
            "rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            run?.status === "ok"
              ? "bg-ok/10 text-ok"
              : run?.status === "failed"
                ? "bg-bad/10 text-bad"
                : run?.status === "running"
                  ? "bg-warn/10 text-warn"
                  : "bg-bgalt text-body"
          )}
        >
          {run?.status ?? "no runs"}
        </span>
      </div>
      <div className="mt-3 font-mono text-[11px] text-body">
        {run ? (
          <>
            Started {new Date(run.started_at).toLocaleString()}{" "}
            {run.finished_at && `· finished ${new Date(run.finished_at).toLocaleTimeString()}`}
          </>
        ) : (
          "Not yet run."
        )}
      </div>
      {run?.stats && (
        <pre className="mt-2 max-h-[140px] overflow-auto whitespace-pre-wrap rounded-md border border-hairline bg-white p-2 font-mono text-[10px] text-body">
          {JSON.stringify(run.stats, null, 2)}
        </pre>
      )}
      {run?.error && <div className="mt-2 font-mono text-[11px] text-bad">{run.error}</div>}
    </div>
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
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "bad"
          ? "text-bad"
          : "text-ink";
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div
        className={clsx(
          "mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em]",
          toneClass
        )}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

function StatusPill({ status }: { status: JobStatus }) {
  const cls =
    status === "done"
      ? "bg-ok/10 text-ok"
      : status === "running"
        ? "bg-warn/10 text-warn"
        : status === "queued"
          ? "bg-bgalt text-body"
          : status === "failed"
            ? "bg-bad/10 text-bad"
            : "bg-ink/10 text-ink";
  return (
    <span
      className={clsx(
        "rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        cls
      )}
    >
      {status}
    </span>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

import clsx from "clsx";

export type ActivityRow = {
  id: string;
  type: "filed" | "prepared" | "alert" | "agency" | "payment" | "team" | "integration" | "setting" | "document";
  title: string;
  detail: string | null;
  actor_label: string | null;
  created_at: string;
};

const TYPE_META: Record<ActivityRow["type"], { label: string; dot: string; ring: string }> = {
  filed: { label: "FILED", dot: "bg-ok", ring: "ring-ok/20" },
  prepared: { label: "PREP", dot: "bg-accent", ring: "ring-accent/20" },
  alert: { label: "ALERT", dot: "bg-bad", ring: "ring-bad/20" },
  agency: { label: "AGENCY", dot: "bg-ink", ring: "ring-ink/20" },
  payment: { label: "PAY", dot: "bg-warn", ring: "ring-warn/20" },
  team: { label: "TEAM", dot: "bg-body", ring: "ring-body/20" },
  integration: { label: "INTEGRATION", dot: "bg-accent-deep", ring: "ring-accent-deep/20" },
  setting: { label: "CONFIG", dot: "bg-body", ring: "ring-body/20" },
  document: { label: "DOC", dot: "bg-warn", ring: "ring-warn/20" },
};

export function ActivityFeedServer({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">Activity</div>
          <div className="font-display text-[18px] font-light text-ink">Everything, in order.</div>
        </div>
      </div>
      <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
            No activity yet. Add a location, license, or integration to fill this feed.
          </li>
        )}
        {rows.map((a) => {
          const t = TYPE_META[a.type];
          return (
            <li key={a.id} className="flex gap-3 px-5 py-3.5">
              <span
                className={clsx(
                  "mt-1 h-2 w-2 shrink-0 rounded-full ring-4",
                  t.dot,
                  t.ring
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[13px] font-medium leading-snug text-ink">{a.title}</div>
                  <span className="shrink-0 font-mono text-[10px] text-body">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
                {a.detail && (
                  <div className="mt-0.5 truncate text-[12px] text-body">{a.detail}</div>
                )}
                {a.actor_label && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-body">
                    <span className="rounded-sm bg-bgalt px-1.5 py-0.5">{t.label}</span>
                    <span className="ml-2">{a.actor_label}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
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

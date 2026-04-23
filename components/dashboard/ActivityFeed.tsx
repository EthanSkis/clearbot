"use client";

import clsx from "clsx";

type ActivityType = "filed" | "prepared" | "alert" | "agency" | "payment" | "team";

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  time: string;
  actor?: string;
};

const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "filed",
    title: "Health Permit filed",
    detail: "Austin, TX · Travis County DOH · confirmation #TXH-41829",
    time: "just now",
    actor: "ClearBot · Auto",
  },
  {
    id: "a2",
    type: "payment",
    title: "$1,245 routed to CA ABC",
    detail: "Liquor License · Los Angeles, CA · paid via AP automation",
    time: "14m ago",
    actor: "ClearBot · Auto",
  },
  {
    id: "a3",
    type: "agency",
    title: "Form version changed",
    detail: "NYC DOH · HMH-203 rev. 2026.04 · affected filings re-prepared",
    time: "38m ago",
  },
  {
    id: "a4",
    type: "prepared",
    title: "Tobacco Retailer packet ready",
    detail: "Miami, FL · awaiting Diana's approval",
    time: "1h ago",
    actor: "ClearBot · Prep",
  },
  {
    id: "a5",
    type: "alert",
    title: "Building Occupancy overdue by 1 day",
    detail: "Denver, CO · switching to expedited track",
    time: "2h ago",
  },
  {
    id: "a6",
    type: "team",
    title: "Marcus Holt viewed the audit log",
    detail: "38 records exported as PDF for Q1 board pack",
    time: "3h ago",
    actor: "Marcus Holt",
  },
  {
    id: "a7",
    type: "filed",
    title: "Sign Permit filed",
    detail: "Chicago, IL · confirmation #CHI-SGN-9912",
    time: "yesterday",
    actor: "ClearBot · Auto",
  },
  {
    id: "a8",
    type: "agency",
    title: "New agency mapped",
    detail: "Nashville Metro Health Dept. added to the engine",
    time: "2d ago",
  },
];

const TYPE_META: Record<
  ActivityType,
  { label: string; dot: string; ring: string }
> = {
  filed: { label: "FILED", dot: "bg-ok", ring: "ring-ok/20" },
  prepared: { label: "PREP", dot: "bg-accent", ring: "ring-accent/20" },
  alert: { label: "ALERT", dot: "bg-bad", ring: "ring-bad/20" },
  agency: { label: "AGENCY", dot: "bg-ink", ring: "ring-ink/20" },
  payment: { label: "PAY", dot: "bg-warn", ring: "ring-warn/20" },
  team: { label: "TEAM", dot: "bg-body", ring: "ring-body/20" },
};

export function ActivityFeed() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Activity
          </div>
          <div className="font-display text-[18px] font-light text-ink">
            Everything, in order.
          </div>
        </div>
        <a
          href="#"
          className="font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          View all →
        </a>
      </div>

      <ul className="flex-1 divide-y divide-hairline overflow-y-auto">
        {ACTIVITIES.map((a) => {
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
                  <div className="text-[13px] font-medium leading-snug text-ink">
                    {a.title}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-body">
                    {a.time}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-body">
                  {a.detail}
                </div>
                {a.actor && (
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-body">
                    <span className="rounded-sm bg-bgalt px-1.5 py-0.5">
                      {t.label}
                    </span>
                    <span className="ml-2">{a.actor}</span>
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

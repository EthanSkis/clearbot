"use client";

import clsx from "clsx";

type Event = {
  day: number;
  type: string;
  tone: "ok" | "warn" | "bad" | "accent";
};

const MONTH_LABEL = "April 2026";
const FIRST_WEEKDAY = 3; // Wednesday
const DAYS_IN_MONTH = 30;
const TODAY = 22;

const EVENTS: Event[] = [
  { day: 3, type: "Sales Tax Permit", tone: "ok" },
  { day: 7, type: "Business License", tone: "ok" },
  { day: 10, type: "Fire Inspection", tone: "ok" },
  { day: 14, type: "Health Permit", tone: "ok" },
  { day: 19, type: "Sign Permit", tone: "ok" },
  { day: 23, type: "Liquor License", tone: "warn" },
  { day: 26, type: "Tobacco Retailer", tone: "warn" },
  { day: 28, type: "Food Service Cert", tone: "warn" },
  { day: 30, type: "Building Occupancy", tone: "bad" },
];

function eventsOn(day: number) {
  return EVENTS.filter((e) => e.day === day);
}

const DOT_COLOR: Record<Event["tone"], string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
};

export function RenewalCalendar() {
  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < FIRST_WEEKDAY; i++) cells.push({ day: null });
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Renewal calendar
          </div>
          <div className="font-display text-[18px] font-light text-ink">
            {MONTH_LABEL}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <CalBtn dir="prev" />
          <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
            Today
          </button>
          <CalBtn dir="next" />
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="grid grid-cols-7 text-center font-mono text-[10px] uppercase tracking-wider text-body">
          {weekdays.map((d) => (
            <div key={d} className="pb-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 pb-4">
          {cells.map((c, i) => {
            const events = c.day ? eventsOn(c.day) : [];
            const isToday = c.day === TODAY;
            const isPast = c.day !== null && c.day < TODAY;
            return (
              <div
                key={i}
                className={clsx(
                  "relative aspect-[7/5] rounded-md border p-1.5 text-left transition-colors",
                  c.day
                    ? isToday
                      ? "border-accent bg-accent-soft"
                      : isPast
                        ? "border-hairline bg-bgalt/40"
                        : "border-hairline bg-white hover:border-ink/20"
                    : "border-transparent bg-transparent"
                )}
              >
                {c.day && (
                  <>
                    <div
                      className={clsx(
                        "font-mono text-[11px] tabular-nums",
                        isToday ? "font-semibold text-accent-deep" : "text-ink"
                      )}
                    >
                      {c.day}
                    </div>
                    {events.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {events.slice(0, 3).map((e, k) => (
                          <span
                            key={k}
                            className={clsx(
                              "h-1.5 w-1.5 rounded-full",
                              DOT_COLOR[e.tone]
                            )}
                            title={e.type}
                          />
                        ))}
                        {events.length > 3 && (
                          <span className="font-mono text-[9px] text-body">
                            +{events.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-body">
        <Legend color="ok" label="Filed" />
        <Legend color="warn" label="Due" />
        <Legend color="bad" label="Overdue" />
        <span className="ml-auto">9 events this month · 6 already filed</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: Event["tone"]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT_COLOR[color])} />
      {label}
    </span>
  );
}

function CalBtn({ dir }: { dir: "prev" | "next" }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-hairline bg-white text-body hover:text-ink"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        {dir === "prev" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

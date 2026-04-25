import clsx from "clsx";

type Tone = "ok" | "warn" | "bad" | "accent";

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  type: string;
  tone: Tone;
};

const DOT_COLOR: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  accent: "bg-accent",
};

export function RenewalCalendarServer({
  events,
  monthOffset = 0,
}: {
  events: CalendarEvent[];
  monthOffset?: number;
}) {
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthLabel = target.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstWeekday = target.getDay();
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const todayDay = today.getMonth() === target.getMonth() && today.getFullYear() === target.getFullYear()
    ? today.getDate()
    : null;

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  function eventsOn(day: number) {
    const target_yyyymm = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    return events.filter((e) => e.date.startsWith(target_yyyymm) && Number(e.date.slice(8, 10)) === day);
  }

  const totalThisMonth = events.filter((e) =>
    e.date.startsWith(`${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`)
  ).length;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Renewal calendar
          </div>
          <div className="font-display text-[18px] font-light text-ink">{monthLabel}</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body">
            {totalThisMonth} events
          </span>
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
            const ev = c.day ? eventsOn(c.day) : [];
            const isToday = c.day === todayDay;
            const isPast = todayDay !== null && c.day !== null && c.day < todayDay;
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
                        : "border-hairline bg-white"
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
                    {ev.length > 0 && (
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {ev.slice(0, 3).map((e, k) => (
                          <span
                            key={k}
                            className={clsx("h-1.5 w-1.5 rounded-full", DOT_COLOR[e.tone])}
                            title={e.type}
                          />
                        ))}
                        {ev.length > 3 && (
                          <span className="font-mono text-[9px] text-body">
                            +{ev.length - 3}
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
        <Legend color="ok" label="On track" />
        <Legend color="warn" label="Due soon" />
        <Legend color="bad" label="Overdue" />
        <span className="ml-auto">{totalThisMonth} events this month</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT_COLOR[color])} />
      {label}
    </span>
  );
}

import clsx from "clsx";
import { AUTOMATION_MODES } from "@/lib/data";

export function AutomationModePanelServer({
  defaultMode,
  counts,
}: {
  defaultMode: "alert" | "prep" | "auto";
  counts: { alert: number; prep: number; auto: number };
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="border-b border-hairline px-5 py-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-body">
          Automation mode
        </div>
        <div className="mt-0.5 font-display text-[18px] font-light text-ink">
          Per-license control.
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {AUTOMATION_MODES.map((m) => {
          const id = m.name.toLowerCase() as "alert" | "prep" | "auto";
          const active = id === defaultMode;
          const total = counts[id];
          return (
            <div
              key={m.n}
              className={clsx(
                "rounded-lg border p-3 text-left transition-colors",
                active ? "border-accent bg-accent-soft" : "border-hairline bg-white"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-hairline bg-white text-body"
                    )}
                  >
                    {active ? "✓" : m.n}
                  </span>
                  <span
                    className={clsx(
                      "text-[14px] font-medium",
                      active ? "text-accent-deep" : "text-ink"
                    )}
                  >
                    {m.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-body">
                  {total} lic
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-[1.5] text-body">{m.body}</p>
            </div>
          );
        })}
      </div>
      <div className="border-t border-hairline bg-bgalt/60 px-5 py-3 font-mono text-[11px] text-body">
        Default for new licenses ·{" "}
        <span className="text-accent-deep capitalize">{defaultMode}</span>
      </div>
    </div>
  );
}

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { AgencyMonitorMockup } from "@/components/mockups/AgencyMonitorMockup";

export function FeatureEveryAgency() {
  return (
    <Section id="coverage">
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
        <Reveal delay={0.1} className="md:order-1">
          <AgencyMonitorMockup />
        </Reveal>

        <div className="md:order-2">
          <Reveal>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              The knowledge base
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Every agency. Every jurisdiction. <span className="italic">Every form.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-body">
              ClearBot agents monitor 500+ agency portals daily. They detect form
              changes the day they ship, update fee schedules automatically, and
              flag jurisdictional rule changes before they affect your filings.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <ul className="mt-9 space-y-3">
              {[
                "Federal · state · county · municipal",
                "Live form-version diffing",
                "Auto-updated fee schedules",
                "Operator-specific compliance rules",
              ].map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-3 border-t border-hairline pt-3 text-[14px] text-ink"
                >
                  <Check />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

function Check() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

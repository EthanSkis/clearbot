import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { AutomationModeIllustration } from "@/components/mockups/AutomationModeIllustration";
import { AUTOMATION_MODES } from "@/lib/data";

const MODE_VISUAL = ["alert", "prep", "auto"] as const;

export function FeatureAutomationModes() {
  return (
    <Section alt>
      <Reveal className="mx-auto max-w-[680px] text-center">
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
          Three modes
        </div>
        <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          Choose how much you <span className="italic">automate.</span>
        </h2>
        <p className="mt-5 text-[16px] leading-[1.55] text-body">
          Same coverage. Same reliability. Pick the level of involvement that fits
          how your team operates today — change it any time.
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        {AUTOMATION_MODES.map((m, i) => (
          <Reveal key={m.n} delay={0.05 + i * 0.08}>
            <article className="flex h-full flex-col rounded-xl border border-hairline bg-white p-7 shadow-card">
              <div className="font-mono text-[11px] uppercase tracking-wider text-body">
                {m.n}
              </div>
              <div className="mt-1 font-display text-[28px] font-light leading-tight text-ink">
                {m.name}
              </div>
              <p className="mt-3 text-[14px] leading-[1.55] text-body">
                {m.body}
              </p>
              <div className="mt-7">
                <AutomationModeIllustration mode={MODE_VISUAL[i]} />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { OnboardingMockup } from "@/components/mockups/OnboardingMockup";
import { FOUR_STEPS } from "@/lib/data";

export function FeatureFourSteps() {
  return (
    <Section id="product" alt>
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
        <div>
          <Reveal>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              How it works
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Four steps, then it <span className="italic">runs itself.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-body">
              No new processes to invent. No internal change-management. We onboard
              your existing license records, then ClearBot becomes the system of
              record from day one.
            </p>
          </Reveal>

          <ol className="mt-9 space-y-6">
            {FOUR_STEPS.map((s, i) => (
              <Reveal key={s.n} delay={0.15 + i * 0.06} as="li">
                <div className="flex gap-5 border-t border-hairline pt-5">
                  <span className="font-mono text-[12px] text-body tabular-nums">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-[15px] font-medium text-ink">
                      {s.title}
                    </div>
                    <p className="mt-1 max-w-[420px] text-[14px] leading-[1.55] text-body">
                      {s.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal delay={0.15}>
          <OnboardingMockup />
        </Reveal>
      </div>
    </Section>
  );
}

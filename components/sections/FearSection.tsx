import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { FEAR_FACTS } from "@/lib/data";

export function FearSection() {
  return (
    <Section>
      <Reveal className="mx-auto max-w-[720px] text-center">
        <h2 className="font-display text-[clamp(32px,4vw,48px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          What a lapsed license <span className="italic">actually</span> costs.
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        {FEAR_FACTS.map((f, i) => (
          <Reveal key={f.region} delay={0.05 + i * 0.07}>
            <article className="h-full rounded-xl border border-hairline bg-white p-8 shadow-card">
              <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                {f.region}
              </div>
              <p className="mt-5 text-[16px] leading-[1.55] text-ink">
                {f.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.2} className="mt-10 text-center">
        <p className="font-mono text-[12px] uppercase tracking-wider text-body">
          ClearBot makes all of this impossible.
        </p>
      </Reveal>
    </Section>
  );
}

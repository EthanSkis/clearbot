import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { QUOTES } from "@/lib/data";

export function SocialProof() {
  return (
    <Section id="customers">
      <Reveal className="mx-auto max-w-[680px] text-center">
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
          Customers
        </div>
        <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          From the people <span className="italic">running it.</span>
        </h2>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        {QUOTES.map((q, i) => (
          <Reveal key={q.name} delay={0.04 + i * 0.05}>
            <article className="flex h-full flex-col rounded-xl border border-hairline bg-white p-7 shadow-card">
              <p className="font-display text-[20px] font-light italic leading-[1.4] text-ink">
                “{q.body}”
              </p>
              <div className="mt-auto pt-7">
                <div className="text-[14px] font-medium text-ink">{q.name}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-body">
                  {q.role} · {q.company}
                </div>
                <div className="mt-1 font-mono text-[11px] text-accent-deep">
                  {q.locations}
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.25} className="mt-14 text-center">
        <p className="font-display text-[clamp(22px,2.4vw,30px)] font-light leading-tight text-ink">
          Over 14,000 locations.{" "}
          <span className="italic">Zero missed renewals.</span>
        </p>
      </Reveal>
    </Section>
  );
}

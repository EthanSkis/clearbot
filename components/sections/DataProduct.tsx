import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { DATA_BUYERS } from "@/lib/data";

export function DataProduct() {
  return (
    <Section id="data" alt>
      <div className="grid items-start gap-14 md:grid-cols-2 md:gap-20">
        <div>
          <Reveal>
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Data
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              For intelligence <span className="italic">buyers.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-body">
              We track every license issued, modified, or revoked across 38
              states. The same data ClearBot uses to operate is licensed to
              diligence teams, underwriters, and research firms who need to know
              the regulatory shape of any market — before they enter it.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-[460px] text-[16px] leading-[1.55] text-body">
              Quarterly updates, normalized schemas, jurisdiction-by-jurisdiction
              risk scoring. Available as flat exports or via API.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <ul className="rounded-xl border border-hairline bg-white shadow-card">
            {DATA_BUYERS.map((b, i) => (
              <li
                key={b.buyer}
                className={`flex items-start justify-between gap-6 p-6 ${
                  i !== 0 ? "border-t border-hairline" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-medium text-ink">
                    {b.buyer}
                  </div>
                  <div className="mt-1 text-[13px] text-body">{b.note}</div>
                </div>
                <div className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-body">
                  {b.anchor}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

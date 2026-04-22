import { Reveal } from "@/components/ui/Reveal";
import { TRUST_COMPANIES } from "@/lib/data";

export function TrustBar() {
  return (
    <section className="w-full border-y border-hairline bg-bgalt py-14">
      <div className="mx-auto w-full max-w-content px-6">
        <Reveal className="text-center font-mono text-[12px] uppercase tracking-wider text-body">
          Trusted by operators managing over 14,000 locations across 38 states
        </Reveal>
        <Reveal
          delay={0.1}
          className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-5"
        >
          {TRUST_COMPANIES.map((c) => (
            <span
              key={c}
              className="text-[14px] font-medium tracking-tight text-ink/35"
            >
              {c}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

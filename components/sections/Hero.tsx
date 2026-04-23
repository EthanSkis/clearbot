import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";

export function Hero() {
  return (
    <section
      id="top"
      className="relative w-full overflow-hidden bg-bg pb-12 pt-[140px] md:pb-20 md:pt-[180px]"
    >
      <div className="mx-auto w-full max-w-content px-6">
        {/* eyebrow */}
        <Reveal className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Now managing renewals in 38 states
          </span>
        </Reveal>

        {/* headline */}
        <Reveal delay={0.05} className="mx-auto mt-7 max-w-[920px] text-center">
          <h1 className="font-display text-[clamp(48px,6vw,88px)] font-light leading-[1.02] tracking-[-0.015em] text-ink">
            Stop managing license renewals in
            <br />
            <span className="italic">spreadsheets.</span>
          </h1>
        </Reveal>

        {/* sub */}
        <Reveal
          delay={0.1}
          className="mx-auto mt-7 max-w-[560px] text-center"
        >
          <p className="text-[18px] leading-[1.55] text-body">
            ClearBot tracks, prepares, and files every renewal for every
            location you operate — across every agency, every jurisdiction,
            every form. A lapse is no longer possible.
          </p>
        </Reveal>

        {/* CTAs */}
        <Reveal
          delay={0.15}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button variant="primary" size="md" href="/book">
            Book a free intro call
          </Button>
          <Button variant="ghost" size="md" href="#product">
            See how it works →
          </Button>
        </Reveal>

        {/* dashboard mockup */}
        <Reveal delay={0.25} className="mt-16 md:mt-24">
          <DashboardMockup />
        </Reveal>
      </div>
    </section>
  );
}

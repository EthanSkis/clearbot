import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { FINAL_CTA_BULLETS } from "@/lib/data";

export function FinalCTA() {
  return (
    <Section id="cta">
      <div className="mx-auto max-w-[680px] text-center">
        <Reveal>
          <h2 className="font-display text-[clamp(36px,4.6vw,60px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
            Book a free <span className="italic">15-minute call.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <ul className="mx-auto mt-10 max-w-[460px] space-y-3 text-left">
            {FINAL_CTA_BULLETS.map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 text-[15px] text-ink"
              >
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
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
                {b}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.18} className="mt-12 flex flex-col items-center gap-3">
          <Button variant="primary" size="md" href="#book">
            Book a free intro call
          </Button>
          <p className="font-mono text-[11px] uppercase tracking-wider text-body">
            or email{" "}
            <a
              href="mailto:ethan@clearbot.io"
              className="text-ink underline-offset-4 hover:text-accent-deep hover:underline"
            >
              ethan@clearbot.io
            </a>
          </p>
        </Reveal>
      </div>
    </Section>
  );
}

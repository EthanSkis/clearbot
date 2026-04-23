import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { DashboardMockup } from "@/components/mockups/DashboardMockup";
import { AgencyMonitorMockup } from "@/components/mockups/AgencyMonitorMockup";
import { AutomationModeIllustration } from "@/components/mockups/AutomationModeIllustration";
import {
  AUTOMATION_MODES,
  INTEGRATIONS,
  PRODUCT_PILLARS,
  SECURITY_POINTS,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Product · ClearBot",
  description:
    "ClearBot is one dashboard for every license, in every location, across every jurisdiction. See how it tracks, prepares, and files renewals automatically.",
};

const MODE_VISUAL = ["alert", "prep", "auto"] as const;

const INTEGRATION_GROUPS = INTEGRATIONS.reduce<Record<string, string[]>>(
  (acc, i) => {
    (acc[i.category] ||= []).push(i.name);
    return acc;
  },
  {}
);

export default function ProductPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg">
        {/* hero */}
        <section className="pt-[140px] md:pt-[180px]">
          <div className="mx-auto w-full max-w-content px-6">
            <Reveal className="mx-auto max-w-[820px] text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                The product
              </span>
              <h1 className="mt-7 font-display text-[clamp(44px,5.6vw,76px)] font-light leading-[1.04] tracking-[-0.015em] text-ink">
                One system for every license,
                <br />
                <span className="italic">every location.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[580px] text-[18px] leading-[1.55] text-body">
                A dashboard, an agency engine, and a filing system — built
                together, sold together, run as one. ClearBot is the system of
                record for the renewals your business can&apos;t afford to miss.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-9 flex justify-center gap-3">
              <Button variant="primary" size="md" href="/book">
                Book a free intro call
              </Button>
              <Button variant="ghost" size="md" href="/pricing">
                See pricing →
              </Button>
            </Reveal>

            <Reveal delay={0.2} className="mt-16 md:mt-24">
              <DashboardMockup />
            </Reveal>
          </div>
        </section>

        {/* three pillars */}
        <Section>
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
            {PRODUCT_PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.06}>
                <article>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                    {p.eyebrow}
                  </div>
                  <h2 className="mt-3 font-display text-[26px] font-light leading-[1.15] tracking-[-0.005em] text-ink">
                    {p.title}
                  </h2>
                  <p className="mt-4 text-[15px] leading-[1.6] text-body">
                    {p.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* agency engine */}
        <Section alt>
          <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
            <Reveal delay={0.1}>
              <AgencyMonitorMockup />
            </Reveal>
            <div>
              <Reveal>
                <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                  The agency engine
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                  Agencies <span className="italic">change.</span>
                  <br />
                  ClearBot notices first.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-[460px] text-[16px] leading-[1.6] text-body">
                  We don&apos;t scrape and pray. We model each portal — its forms,
                  its fee schedule, its acceptance rules — and re-validate that
                  model continuously. When something shifts, every affected
                  filing is re-prepared automatically before you ever see a
                  warning.
                </p>
              </Reveal>
              <Reveal delay={0.18}>
                <dl className="mt-9 grid grid-cols-2 gap-6 border-t border-hairline pt-7">
                  <Stat label="Agency portals" value="528" />
                  <Stat label="Poll interval" value="90s" />
                  <Stat label="Form versions tracked" value="2,140" />
                  <Stat label="Mean detect-to-update" value="11m" />
                </dl>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* automation modes */}
        <Section>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              The filing system
            </div>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Choose how much you <span className="italic">automate.</span>
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-body">
              Same coverage, same reliability — pick the level of involvement
              that matches how your team operates today. Switch any time, per
              license.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {AUTOMATION_MODES.map((m, i) => (
              <Reveal key={m.n} delay={0.05 + i * 0.07}>
                <article className="flex h-full flex-col rounded-xl border border-hairline bg-white p-7 shadow-card">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-body">
                    {m.n}
                  </div>
                  <div className="mt-1 font-display text-[28px] font-light leading-tight text-ink">
                    {m.name}
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.6] text-body">
                    {m.body}
                  </p>
                  <div className="mt-6">
                    <AutomationModeIllustration mode={MODE_VISUAL[i]} />
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* integrations */}
        <Section alt>
          <div className="grid gap-14 md:grid-cols-[1fr_1.4fr] md:gap-20">
            <div>
              <Reveal>
                <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                  Integrations
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                  Plugs into the systems <span className="italic">you already run.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 text-[16px] leading-[1.6] text-body">
                  Locations and ownership pulled from your POS or ERP. Fees
                  routed through your AP. Notifications in the channels your
                  team already uses.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Object.entries(INTEGRATION_GROUPS).map(([cat, items]) => (
                  <div
                    key={cat}
                    className="rounded-lg border border-hairline bg-white p-4 shadow-card"
                  >
                    <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                      {cat}
                    </div>
                    <ul className="mt-2 space-y-1">
                      {items.map((n) => (
                        <li
                          key={n}
                          className="text-[13px] font-medium tracking-tight text-ink"
                        >
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </Section>

        {/* security */}
        <Section>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Security & compliance
            </div>
            <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              The boring parts, <span className="italic">done right.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.map((p, i) => (
              <Reveal key={p.title} delay={0.04 + i * 0.04}>
                <article className="h-full rounded-xl border border-hairline bg-white p-6 shadow-card">
                  <div className="text-[15px] font-medium text-ink">
                    {p.title}
                  </div>
                  <p className="mt-2 text-[13px] leading-[1.6] text-body">
                    {p.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* final CTA */}
        <Section alt>
          <div className="mx-auto max-w-[680px] text-center">
            <Reveal>
              <h2 className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                See it on your own data.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.6] text-body">
                Send us your current license inventory. We&apos;ll come back with
                a live audit and a 30-second demo of what handoff looks like.
              </p>
            </Reveal>
            <Reveal delay={0.16} className="mt-9">
              <Button variant="primary" size="md" href="/book">
                Book a free intro call
              </Button>
            </Reveal>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </div>
      <div className="mt-1 font-display text-[32px] font-light leading-tight text-ink">
        {value}
      </div>
    </div>
  );
}

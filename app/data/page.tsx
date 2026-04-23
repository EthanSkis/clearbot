import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SchemaPreview } from "@/components/mockups/SchemaPreview";
import { QueryConsole } from "@/components/mockups/QueryConsole";
import { DATA_BUYERS, DATA_DELIVERY, DATA_USE_CASES } from "@/lib/data";
import { COVERED_COUNT, TOTAL_LICENSES } from "@/lib/states";

export const metadata: Metadata = {
  title: "Data · ClearBot",
  description:
    "Jurisdiction intelligence for diligence teams, underwriters, and research firms. The same data ClearBot operations runs on, available as exports, API, or hosted replica.",
};

export default function DataPage() {
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
                Data product
              </span>
              <h1 className="mt-7 font-display text-[clamp(44px,5.6vw,76px)] font-light leading-[1.04] tracking-[-0.015em] text-ink">
                Jurisdiction intelligence,
                <br />
                <span className="italic">at the row level.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[580px] text-[18px] leading-[1.55] text-body">
                Every license issued, modified, or revoked across {COVERED_COUNT}{" "}
                states. The same operational dataset ClearBot runs on, licensed
                to diligence teams, underwriters, and research firms who need to
                see the regulatory shape of any market — before they enter it.
              </p>
            </Reveal>
            <Reveal
              delay={0.1}
              className="mt-9 flex justify-center gap-3"
            >
              <Button variant="primary" size="md" href="/book">
                Request a sample
              </Button>
              <Button variant="ghost" size="md" href="#delivery">
                See delivery options →
              </Button>
            </Reveal>

            <Reveal delay={0.2} className="mt-16">
              <div className="grid grid-cols-3 divide-x divide-hairline rounded-2xl border border-hairline bg-white py-8 text-center shadow-card">
                <Stat
                  label="Licenses indexed"
                  value={`${(TOTAL_LICENSES / 1000).toFixed(1)}k+`}
                />
                <Stat label="Jurisdictions" value="528" />
                <Stat label="Refresh cadence" value="15 min" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* schema */}
        <Section>
          <div className="grid items-start gap-14 md:grid-cols-[1fr_1.2fr] md:gap-20">
            <div>
              <Reveal>
                <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                  The dataset
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                  One canonical schema, <span className="italic">across every jurisdiction.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 text-[16px] leading-[1.6] text-body">
                  We do the normalization work — every agency&apos;s field names,
                  status codes, and license taxonomies mapped to a single,
                  stable schema. Joinable with your CRM, your portfolio
                  database, your cap table.
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <ul className="mt-9 space-y-3">
                  {[
                    "Stable IDs across renewals",
                    "Cross-jurisdiction license taxonomy (1,200+ types)",
                    "Live fee schedules per agency",
                    "Full mutation history per record",
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
            <Reveal delay={0.15}>
              <SchemaPreview />
            </Reveal>
          </div>
        </Section>

        {/* sample query */}
        <Section alt>
          <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
            <Reveal delay={0.1}>
              <QueryConsole />
            </Reveal>
            <div>
              <Reveal>
                <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                  Query it
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                  Ask the question. <span className="italic">Get the answer.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-5 max-w-[460px] text-[16px] leading-[1.6] text-body">
                  Every customer gets a hosted Postgres replica, refreshed every
                  15 minutes. Connect from your BI tool of choice — Sigma, Mode,
                  Hex, Tableau — or hit the API directly. No ETL on your side.
                </p>
              </Reveal>
            </div>
          </div>
        </Section>

        {/* use cases */}
        <Section>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Use cases
            </div>
            <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Built for the people who <span className="italic">have to be sure.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {DATA_USE_CASES.map((u, i) => (
              <Reveal key={u.title} delay={0.04 + i * 0.05}>
                <article className="h-full rounded-xl border border-hairline bg-white p-7 shadow-card">
                  <div className="text-[16px] font-medium text-ink">
                    {u.title}
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.6] text-body">
                    {u.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* delivery */}
        <Section id="delivery" alt>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Delivery
            </div>
            <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Four ways to <span className="italic">consume it.</span>
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {DATA_DELIVERY.map((d, i) => (
              <Reveal key={d.name} delay={0.04 + i * 0.05}>
                <article className="flex h-full flex-col rounded-xl border border-hairline bg-white p-7 shadow-card">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 font-display text-[24px] font-light leading-tight text-ink">
                    {d.name}
                  </div>
                  <p className="mt-3 text-[14px] leading-[1.6] text-body">
                    {d.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* buyers / pricing anchors */}
        <Section>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Pricing
            </div>
            <h2 className="mt-3 font-display text-[clamp(30px,3.4vw,42px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Anchored by <span className="italic">how you use it.</span>
            </h2>
            <p className="mt-5 text-[16px] leading-[1.6] text-body">
              We don&apos;t publish a rate card. These are the pricing anchors
              we work from — final number depends on volume, refresh frequency,
              and license breadth.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="mx-auto mt-12 max-w-[820px]">
            <ul className="rounded-2xl border border-hairline bg-white shadow-card">
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
        </Section>

        {/* CTA */}
        <Section alt>
          <div className="mx-auto max-w-[680px] text-center">
            <Reveal>
              <h2 className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                Talk to the data team.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.6] text-body">
                Tell us the question you&apos;re trying to answer. We&apos;ll
                send back a sample slice that proves whether the data does what
                you need.
              </p>
            </Reveal>
            <Reveal delay={0.16} className="mt-9">
              <Button variant="primary" size="md" href="/book">
                Request a sample
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
    <div className="px-4">
      <div className="font-display text-[clamp(28px,3vw,40px)] font-light leading-tight text-ink">
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </div>
    </div>
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

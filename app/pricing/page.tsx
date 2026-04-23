import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { Pricing } from "@/components/sections/Pricing";
import { FAQAccordion } from "@/components/FAQAccordion";
import { Button } from "@/components/ui/Button";
import { FAQS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pricing · ClearBot",
  description:
    "Per-location, per-year pricing. Three plans, transparent feature breakdowns, and an enterprise tier for 500+ locations.",
};

const COMPARISON_ROWS: { feature: string; values: [string, string, string] }[] = [
  { feature: "Active license tracking", values: ["✓", "✓", "✓"] },
  { feature: "Renewal alerts (email + SMS)", values: ["✓", "✓", "✓"] },
  { feature: "Real-time agency monitoring", values: ["✓", "✓", "✓"] },
  { feature: "Renewal calendar export", values: ["✓", "✓", "✓"] },
  { feature: "Pre-filled renewal packets", values: ["—", "✓", "✓"] },
  { feature: "Fee calculation & payment routing", values: ["—", "✓", "✓"] },
  { feature: "Approval workflows", values: ["—", "✓", "✓"] },
  { feature: "Document storage & history", values: ["—", "✓", "✓"] },
  { feature: "Quarterly compliance reports", values: ["—", "✓", "✓"] },
  { feature: "Automated submission to agencies", values: ["—", "—", "✓"] },
  { feature: "Same-day confirmation receipts", values: ["—", "—", "✓"] },
  { feature: "Dedicated compliance manager", values: ["—", "—", "✓"] },
  { feature: "Custom integrations & SSO", values: ["—", "—", "✓"] },
  { feature: "Priority response, 1h SLA", values: ["—", "—", "✓"] },
  { feature: "Late-fee reimbursement (capped)", values: ["—", "✓", "✓"] },
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg">
        {/* hero */}
        <section className="pt-[140px] md:pt-[180px]">
          <div className="mx-auto w-full max-w-content px-6">
            <Reveal className="mx-auto max-w-[820px] text-center">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                Pricing
              </span>
              <h1 className="mt-7 font-display text-[clamp(44px,5.6vw,76px)] font-light leading-[1.04] tracking-[-0.015em] text-ink">
                Per location.
                <br />
                <span className="italic">Per year.</span>
              </h1>
              <p className="mx-auto mt-7 max-w-[560px] text-[18px] leading-[1.55] text-body">
                Three plans. No per-license fees, no per-filing surcharges, no
                surprise invoices. Cancel any time and walk away with every
                document we filed for you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* tiers (reuse) */}
        <div className="mt-12">
          <Pricing />
        </div>

        {/* comparison table */}
        <Section alt>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Compare
            </div>
            <h2 className="mt-3 font-display text-[clamp(28px,3.4vw,40px)] font-light leading-[1.1] tracking-[-0.01em] text-ink">
              Every feature, <span className="italic">side by side.</span>
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-12 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-hairline bg-bgalt/60">
                    <th className="w-[44%] px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-body">
                      Feature
                    </th>
                    {["Essential", "Standard", "Professional"].map((t, i) => (
                      <th
                        key={t}
                        className={`w-[18.66%] px-5 py-4 text-center font-mono text-[11px] uppercase tracking-wider ${
                          i === 1 ? "text-accent-deep" : "text-body"
                        }`}
                      >
                        {t}
                        {i === 1 && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent-deep">
                            popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td className="px-5 py-3 text-[14px] text-ink">
                        {row.feature}
                      </td>
                      {row.values.map((v, i) => (
                        <td
                          key={i}
                          className={`px-5 py-3 text-center font-mono text-[14px] ${
                            v === "✓"
                              ? i === 1
                                ? "text-accent-deep"
                                : "text-ink"
                              : "text-body/40"
                          }`}
                        >
                          {v === "✓" ? <Check /> : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </Section>

        {/* FAQ */}
        <Section>
          <Reveal className="mx-auto max-w-[680px] text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              Questions
            </div>
            <h2 className="mt-3 font-display text-[clamp(28px,3.4vw,40px)] font-light leading-[1.1] tracking-[-0.01em] text-ink">
              Things people ask <span className="italic">before signing.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mx-auto mt-12 max-w-[760px]">
            <FAQAccordion items={FAQS} />
          </Reveal>
        </Section>

        {/* CTA */}
        <Section alt>
          <div className="mx-auto max-w-[680px] text-center">
            <Reveal>
              <h2 className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
                Ready when you are.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mx-auto mt-5 max-w-[460px] text-[16px] leading-[1.6] text-body">
                15 minutes, your license inventory, and a real answer on
                whether ClearBot will save you money.
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

function Check() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
      <svg
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

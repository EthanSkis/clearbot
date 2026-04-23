"use client";

import { useState } from "react";
import clsx from "clsx";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { PRICING_TIERS } from "@/lib/data";

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <Section id="pricing">
      <Reveal className="mx-auto max-w-[680px] text-center">
        <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
          Pricing
        </div>
        <h2 className="mt-3 font-display text-[clamp(32px,3.6vw,44px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          Per location, <span className="italic">per year.</span>
        </h2>
        <p className="mt-5 text-[16px] leading-[1.55] text-body">
          Transparent pricing. No per-license fees, no per-filing surcharges, no
          surprises. Cancel any time.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-9 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-hairline bg-white p-1">
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={clsx(
              "h-8 rounded-full px-4 font-mono text-[12px] uppercase tracking-wider transition-colors",
              annual ? "bg-ink text-white" : "text-body hover:text-ink"
            )}
          >
            Annual
          </button>
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={clsx(
              "h-8 rounded-full px-4 font-mono text-[12px] uppercase tracking-wider transition-colors",
              !annual ? "bg-ink text-white" : "text-body hover:text-ink"
            )}
          >
            Monthly
          </button>
          {annual && (
            <span className="ml-1 rounded-full bg-accent-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-deep">
              Save 15%
            </span>
          )}
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PRICING_TIERS.map((t, i) => {
          const monthly = Math.round((t.price / 12) * 1.15);
          const display = annual ? t.price : monthly;
          return (
            <Reveal key={t.tier} delay={0.05 + i * 0.07}>
              <article
                className={clsx(
                  "relative flex h-full flex-col rounded-xl bg-white p-8 shadow-card",
                  t.featured
                    ? "border-2 border-accent"
                    : "border border-hairline"
                )}
              >
                {t.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-white">
                    Most popular
                  </span>
                )}
                <div className="font-mono text-[11px] uppercase tracking-wider text-body">
                  {t.tier}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-[52px] font-light leading-none text-ink">
                    ${display.toLocaleString()}
                  </span>
                  <span className="font-mono text-[11px] text-body">
                    {annual ? "/location/yr" : "/location/mo"}
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-[1.55] text-body">
                  {t.description}
                </p>
                <div className="my-6 h-px bg-hairline" />
                <ul className="space-y-2.5">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-ink"
                    >
                      <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
                        <svg
                          width="8"
                          height="8"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button
                    variant={t.featured ? "primary" : "secondary"}
                    size="md"
                    href="/book"
                    className="w-full"
                  >
                    {t.cta}
                  </Button>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* enterprise row */}
      <Reveal delay={0.2} className="mt-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-hairline bg-bgalt px-7 py-6 md:flex-row md:items-center">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-body">
              Enterprise
            </div>
            <div className="mt-1 text-[15px] text-ink">
              500+ locations, custom SLAs, dedicated infrastructure, BAA support.
            </div>
          </div>
          <a
            href="/book"
            className="font-mono text-[13px] uppercase tracking-wider text-ink underline-offset-4 hover:text-accent-deep hover:underline"
          >
            Contact us →
          </a>
        </div>
      </Reveal>
    </Section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CoverageMap } from "@/components/CoverageMap";
import { Button } from "@/components/ui/Button";
import { COVERED_COUNT } from "@/lib/states";

export const metadata: Metadata = {
  title: `Coverage map · ${COVERED_COUNT} states · ClearBot`,
  description:
    "ClearBot actively manages business license renewals across 38 US states. Explore which agencies we monitor in each jurisdiction.",
};

export default function MapPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg pb-24 pt-[140px] md:pt-[180px]">
        <div className="mx-auto w-full max-w-content px-6">
          {/* heading */}
          <div className="mx-auto max-w-[720px] text-center">
            <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              {COVERED_COUNT} states · live coverage
            </span>
            <h1 className="mt-7 font-display text-[clamp(40px,5.4vw,72px)] font-light leading-[1.04] tracking-[-0.015em] text-ink">
              Where ClearBot <span className="italic">files today.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[560px] text-[17px] leading-[1.55] text-body">
              We actively monitor and file with state, county, and municipal
              agencies in {COVERED_COUNT} states. Click a tile to see which
              agencies we cover and what we file in each jurisdiction.
            </p>
          </div>

          {/* map */}
          <div className="mt-14 md:mt-20">
            <CoverageMap />
          </div>

          {/* bottom CTA */}
          <div className="mt-20 rounded-2xl border border-hairline bg-bgalt p-8 text-center md:p-12">
            <h2 className="font-display text-[clamp(28px,3.4vw,40px)] font-light leading-[1.1] tracking-[-0.01em] text-ink">
              Don&apos;t see your state? <span className="italic">Tell us.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[440px] text-[15px] leading-[1.55] text-body">
              We expand to new jurisdictions based on operator demand. If your
              footprint includes a state we don&apos;t yet support, we&apos;ll
              tell you when it&apos;s realistic.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="primary" size="md" href="/book">
                Book a free intro call
              </Button>
              <Link
                href="/"
                className="font-mono text-[12px] uppercase tracking-wider text-body underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                ← Back to overview
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

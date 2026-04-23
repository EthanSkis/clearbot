import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ChangelogView } from "@/components/changelog/ChangelogView";
import { CHANGELOG } from "@/components/changelog/data";

export const metadata: Metadata = {
  title: "Changelog · ClearBot",
  description:
    "Every release, every improvement, every bug we fixed. Updated weekly.",
};

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <main className="bg-bg pb-24 pt-[120px] md:pt-[140px]">
        <div className="mx-auto w-full max-w-[920px] px-6">
          <header className="space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-body">
              {CHANGELOG.length} releases · updated weekly
            </div>
            <h1 className="font-display text-[clamp(32px,4vw,48px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
              Changelog
            </h1>
            <p className="max-w-[620px] text-[15px] leading-[1.55] text-body">
              What shipped, when, and why. New agency support, pipeline
              improvements, and bug fixes — all in one place. Subscribe via RSS
              or email to get notified on every release.
            </p>
          </header>
          <div className="mt-10">
            <ChangelogView />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

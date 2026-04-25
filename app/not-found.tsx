import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { NotFoundSearch } from "@/components/NotFoundSearch";

export const metadata: Metadata = {
  title: "Page not found · ClearBot",
  description:
    "We couldn't find that page. Search for what you were looking for, or jump back to the home page.",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="bg-bg pb-24 pt-[120px] md:pt-[140px]">
        <div className="mx-auto w-full max-w-[720px] px-6">
          <header className="space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-body">
              Error 404 · Page not found
            </div>
            <h1 className="font-display text-[clamp(40px,6vw,72px)] font-light leading-[1.02] tracking-[-0.015em] text-ink">
              We couldn't find that page.
            </h1>
            <p className="max-w-[560px] text-[15px] leading-[1.55] text-body">
              The link may be outdated, or the page may have moved. Search for
              what you were looking for below, or head back to the home page.
            </p>
          </header>

          <div className="mt-10">
            <NotFoundSearch />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="md" href="/">
              Back to home
            </Button>
            <Button variant="secondary" size="md" href="/docs">
              Browse docs
            </Button>
            <Button variant="ghost" size="md" href="/book">
              Talk to us →
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

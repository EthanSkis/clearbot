"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS } from "@/lib/data";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-hairline bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={22} />
          <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
            ClearBot
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-[13px] text-body transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" href="/login">
            Log in
          </Button>
          <Button variant="primary" size="sm" href="/book">
            Book intro call
          </Button>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-white md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-4">
            <span
              className={clsx(
                "absolute left-0 right-0 top-0 h-px bg-ink transition-transform",
                open && "translate-y-1.5 rotate-45"
              )}
            />
            <span
              className={clsx(
                "absolute left-0 right-0 top-1.5 h-px bg-ink transition-opacity",
                open && "opacity-0"
              )}
            />
            <span
              className={clsx(
                "absolute bottom-0 left-0 right-0 h-px bg-ink transition-transform",
                open && "-translate-y-1.5 -rotate-45"
              )}
            />
          </span>
        </button>
      </div>

      {/* mobile overlay */}
      <div
        className={clsx(
          "fixed inset-0 top-16 z-40 bg-white transition-opacity md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav className="flex flex-col items-stretch gap-1 p-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-hairline py-4 font-display text-[28px] text-ink"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="secondary" size="md" href="/login">
              Log in
            </Button>
            <Button variant="primary" size="md" href="/book">
              Book intro call
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

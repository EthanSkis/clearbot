import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Create your workspace · ClearBot",
  description: "Create a ClearBot account and start tracking renewals across every location.",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
              ClearBot
            </span>
          </Link>
          <Link
            href="/"
            className="font-mono text-[12px] uppercase tracking-wider text-body transition-colors hover:text-ink"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px]">
          <div className="text-center">
            <h1 className="font-display text-[clamp(32px,4vw,40px)] font-light leading-[1.1] tracking-[-0.01em] text-ink">
              Create your workspace.
            </h1>
            <p className="mt-3 text-[14px] text-body">
              Track every license, across every location, in one screen.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-hairline bg-white p-7 shadow-card">
            <Suspense fallback={<div className="h-[480px]" />}>
              <SignupForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-wider text-body">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-ink underline-offset-4 hover:text-accent-deep hover:underline"
            >
              Log in →
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-content flex-col items-center justify-between gap-2 px-6 py-5 sm:flex-row">
          <p className="font-mono text-[11px] text-body">
            © {new Date().getFullYear()} ClearBot, Inc.
          </p>
          <div className="flex items-center gap-5 font-mono text-[11px] text-body">
            <Link href="/pricing" className="hover:text-ink">
              Pricing
            </Link>
            <Link href="/map" className="hover:text-ink">
              Coverage
            </Link>
            <a href="mailto:ethan@clearbot.io" className="hover:text-ink">
              Email us
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

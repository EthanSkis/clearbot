import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { OnboardingForm } from "./OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome · ClearBot",
};

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: existing } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (existing && existing.length > 0) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company")
    .eq("id", user.id)
    .maybeSingle();

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
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="font-mono text-[12px] uppercase tracking-wider text-body transition-colors hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[480px]">
          <div className="text-center">
            <h1 className="font-display text-[clamp(28px,3.6vw,36px)] font-light leading-[1.1] tracking-[-0.01em] text-ink">
              Name your workspace.
            </h1>
            <p className="mt-3 text-[14px] text-body">
              We&apos;ll spin up an empty environment in your company&apos;s name. You can invite the team later.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border border-hairline bg-white p-7 shadow-card">
            <OnboardingForm defaultCompany={profile?.company ?? ""} />
          </div>
        </div>
      </main>
    </div>
  );
}

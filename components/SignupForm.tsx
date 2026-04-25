"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { signupUser } from "@/app/signup/actions";

type Status = "idle" | "loading" | "error" | "needs_confirm";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [accept, setAccept] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    if (!accept) {
      setStatus("error");
      setErrorMsg("You must agree to the terms to create an account.");
      return;
    }

    const result = await signupUser({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
    });

    if (!result.ok) {
      setStatus("error");
      setErrorMsg(result.error);
      return;
    }

    // Try to sign in immediately. Works when email confirmation is disabled.
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Account created but the project requires email confirmation.
      setStatus("needs_confirm");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (status === "needs_confirm") {
    return (
      <div
        role="status"
        className="rounded-md border border-ok/30 bg-ok/5 px-4 py-3 text-[13px] text-ok"
      >
        Account created. Check <span className="font-medium">{email}</span> for a confirmation
        link, then return to log in.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Diana Reyes"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
          />
        </Field>

        <Field label="Job title" htmlFor="jobTitle">
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            autoComplete="organization-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Director of Ops"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
          />
        </Field>
      </div>

      <Field label="Work email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
        />
      </Field>

      <Field label="Company" htmlFor="company" help="Your workspace will be named for this.">
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Meridian Restaurant Group"
          className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
        />
      </Field>

      <Field label="Password" htmlFor="password" help="At least 8 characters.">
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 pr-16 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      <label className="flex items-start gap-2 text-[12px] text-body">
        <input
          type="checkbox"
          checked={accept}
          onChange={(e) => setAccept(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          I agree to the ClearBot Terms and Privacy Policy and consent to receive product updates
          related to my account.
        </span>
      </label>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2.5 text-[13px] text-bad"
        >
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={clsx(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-accent bg-accent font-sans text-[14px] font-medium text-white transition-colors",
          status === "loading"
            ? "cursor-not-allowed opacity-70"
            : "hover:border-accent-deep hover:bg-accent-deep"
        )}
      >
        {status === "loading" ? (
          <>
            <Spinner /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  help,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[11px] uppercase tracking-wider text-body"
        >
          {label}
        </label>
        {help && <span className="font-mono text-[10px] text-body/70">{help}</span>}
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.55" />
    </svg>
  );
}

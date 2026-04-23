"use client";

import { useState, type FormEvent } from "react";
import clsx from "clsx";

type Status = "idle" | "loading" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setStatus("error");
      setErrorMsg("Enter your email and password to continue.");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    window.setTimeout(() => {
      setStatus("error");
      setErrorMsg(
        "We don't recognize that account. Contact ethan@clearbot.io for access."
      );
    }, 900);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
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

      <Field
        label="Password"
        htmlFor="password"
        right={
          <a
            href="#"
            className="font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Forgot
          </a>
        }
      >
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            required
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
            <Spinner />
            Signing in…
          </>
        ) : (
          "Log in"
        )}
      </button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-body">
          or
        </span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-hairline bg-white font-sans text-[14px] font-medium text-ink transition-colors hover:bg-bgalt"
      >
        <GoogleMark />
        Continue with Google SSO
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  right,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  right?: React.ReactNode;
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
        {right}
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

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

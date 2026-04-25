"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createWorkspaceForCurrentUser } from "./actions";

export function OnboardingForm({ defaultCompany }: { defaultCompany: string }) {
  const router = useRouter();
  const [company, setCompany] = useState(defaultCompany);
  const [legalEntity, setLegalEntity] = useState("");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createWorkspaceForCurrentUser({ company, legalEntity, timezone });
    setLoading(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Company name">
        <input
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Meridian Restaurant Group"
          className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none focus:border-accent"
        />
      </Field>
      <Field label="Legal entity (optional)">
        <input
          value={legalEntity}
          onChange={(e) => setLegalEntity(e.target.value)}
          placeholder="Meridian Restaurant Group, LLC"
          className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none focus:border-accent"
        />
      </Field>
      <Field label="Time zone">
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none focus:border-accent"
        >
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Chicago">America/Chicago (CST)</option>
          <option value="America/Denver">America/Denver (MST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
        </select>
      </Field>

      {error && (
        <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[13px] text-bad">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={clsx(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-accent bg-accent font-sans text-[14px] font-medium text-white transition-colors",
          loading ? "cursor-not-allowed opacity-70" : "hover:bg-accent-deep"
        )}
      >
        {loading ? "Creating workspace…" : "Create workspace"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-body">
        {label}
      </label>
      {children}
    </div>
  );
}

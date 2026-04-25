"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { requestNewAgency } from "./actions";

export function RequestAgencyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setOk(false);
        }}
        className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
      >
        Request new agency
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
            <div className="font-display text-[20px] font-light text-ink">Request a new agency</div>
            <p className="mt-1 text-[13px] text-body">
              We&apos;ll model the agency, ingest its forms, and re-validate every related filing in your workspace.
            </p>
            {ok ? (
              <div className="mt-4 rounded-md border border-ok/30 bg-ok/5 px-3 py-3 text-[13px] text-ok">
                Request received. We&apos;ll email you when it&apos;s live.
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  setError(null);
                  const r = await requestNewAgency({ agencyName: name, jurisdiction, notes });
                  setSaving(false);
                  if (!r.ok) {
                    setError(r.error);
                    return;
                  }
                  setOk(true);
                  setName("");
                  setJurisdiction("");
                  setNotes("");
                  router.refresh();
                }}
                className="mt-4 space-y-3"
              >
                <Field label="Agency name">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nashville Metro Health Dept."
                    className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Jurisdiction">
                  <input
                    required
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    placeholder="Davidson County, TN"
                    className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Notes (optional)">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-hairline bg-white px-3 py-2 text-[13px] outline-none focus:border-accent"
                  />
                </Field>
                {error && (
                  <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
                    {error}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={clsx(
                      "rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white",
                      saving ? "opacity-70" : "hover:bg-accent-deep"
                    )}
                  >
                    {saving ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </form>
            )}
            {ok && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </span>
      {children}
    </label>
  );
}

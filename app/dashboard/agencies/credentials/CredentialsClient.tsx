"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { upsertCredential, deleteCredential, enqueuePoaGeneration } from "./actions";
import type { CredentialListRow } from "./actions";

type AgencyOption = { id: string; code: string; name: string };

type Props = {
  initialCredentials: CredentialListRow[];
  initialError: string | null;
  agencies: AgencyOption[];
};

export function CredentialsClient({ initialCredentials, initialError, agencies }: Props) {
  const router = useRouter();
  const [creds] = useState(initialCredentials);
  const [editing, setEditing] = useState<CredentialListRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [poaFor, setPoaFor] = useState<CredentialListRow | null>(null);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[640px] text-[13px] leading-[1.55] text-body">
          Add the username, password, and MFA seed for each agency portal. The worker decrypts these
          when filing — they never travel back through the dashboard, and they&apos;re bound to the
          master key set in <code className="font-mono text-[11px] text-ink">CREDENTIAL_MASTER_KEY</code>.
        </p>
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
        >
          + Add credentials
        </button>
      </div>

      {initialError && (
        <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
          {initialError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        {creds.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">
              Nothing on file
            </div>
            <p className="mt-2 text-[13px] text-body">
              The worker can only file to portals it has credentials for. Add your first set above.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-hairline bg-bgalt">
              <tr className="font-mono text-[10px] uppercase tracking-wider text-body">
                <th className="px-5 py-2.5 text-left">Agency</th>
                <th className="px-5 py-2.5 text-left">Label</th>
                <th className="px-5 py-2.5 text-left">Last used</th>
                <th className="px-5 py-2.5 text-left">Rotated</th>
                <th className="px-5 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {creds.map((c) => (
                <tr key={c.id} className="text-[13px] text-ink">
                  <td className="px-5 py-3">
                    <div className="font-mono text-[11px] uppercase tracking-wider text-ink">
                      {c.agency_code}
                    </div>
                    <div className="text-[12px] text-body">{c.agency_name}</div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-body">{c.label}</td>
                  <td className="px-5 py-3 font-mono text-[12px] text-body">
                    {c.last_used_at ? new Date(c.last_used_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-body">
                    {c.rotated_at
                      ? new Date(c.rotated_at).toLocaleDateString()
                      : new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setPoaFor(c)}
                      className="mr-2 rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                    >
                      Generate POA
                    </button>
                    <button
                      onClick={() => {
                        setEditing(c);
                        setCreating(false);
                      }}
                      className="mr-2 rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                    >
                      Rotate
                    </button>
                    <DeleteButton id={c.id} onDone={() => router.refresh()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(creating || editing) && (
        <CredentialModal
          editing={editing}
          agencies={agencies}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onDone={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}

      {poaFor && (
        <PoaModal
          credential={poaFor}
          onClose={() => setPoaFor(null)}
          onDone={() => {
            setPoaFor(null);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}

function DeleteButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("Delete this credential? The worker will stop being able to file via this portal.")) return;
        startTransition(async () => {
          await deleteCredential(id);
          onDone();
        });
      }}
      className={clsx(
        "rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider hover:text-bad",
        pending ? "text-body opacity-70" : "text-body"
      )}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function CredentialModal({
  editing,
  agencies,
  onClose,
  onDone,
}: {
  editing: CredentialListRow | null;
  agencies: AgencyOption[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [agencyId, setAgencyId] = useState(editing?.agency_id ?? agencies[0]?.id ?? "");
  const [label, setLabel] = useState(editing?.label ?? "default");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mfaSeed, setMfaSeed] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-[520px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
        <div className="font-display text-[20px] font-light text-ink">
          {editing ? `Rotate · ${editing.agency_code}` : "Add portal credentials"}
        </div>
        <p className="mt-1 text-[13px] text-body">
          {editing
            ? "Replacing the encrypted blob. The previous values are unrecoverable after save."
            : "Stored encrypted. Decryption requires the master key set on the worker."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            const r = await upsertCredential({
              id: editing?.id ?? null,
              agencyId,
              label,
              username,
              password,
              mfaSeed: mfaSeed || undefined,
              notes: notes || undefined,
            });
            setSaving(false);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onDone();
          }}
          className="mt-4 space-y-3"
        >
          <Field label="Agency">
            {editing ? (
              <div className="rounded-md border border-hairline bg-bgalt px-3 py-2 font-mono text-[12px] text-body">
                {editing.agency_code} · {editing.agency_name}
              </div>
            ) : (
              <select
                required
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Label">
            <input
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="default"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Username">
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 font-mono text-[12px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 font-mono text-[12px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="MFA seed (optional)">
            <input
              value={mfaSeed}
              onChange={(e) => setMfaSeed(e.target.value)}
              placeholder="Base32 TOTP secret"
              autoComplete="off"
              spellCheck={false}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 font-mono text-[12px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
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
              onClick={onClose}
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
              {saving ? "Encrypting…" : editing ? "Rotate" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
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

function PoaModal({
  credential,
  onClose,
  onDone,
}: {
  credential: CredentialListRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [durationDays, setDurationDays] = useState(365);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-[480px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
        <div className="font-display text-[20px] font-light text-ink">
          Power-of-Attorney · {credential.agency_code}
        </div>
        <p className="mt-1 text-[13px] text-body">
          Generates a generic limited POA PDF and stores it under Documents. <strong>Have your lawyer review the language for this jurisdiction before sending it to the agency.</strong>
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            const r = await enqueuePoaGeneration({
              agencyId: credential.agency_id,
              signerName,
              signerTitle: signerTitle || null,
              signerEmail,
              durationDays,
            });
            setSaving(false);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onDone();
          }}
          className="mt-4 space-y-3"
        >
          <Field label="Signer name">
            <input
              required
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Signer title">
            <input
              value={signerTitle}
              onChange={(e) => setSignerTitle(e.target.value)}
              placeholder="CEO, General Manager, etc."
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Signer email">
            <input
              required
              type="email"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 font-mono text-[12px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Valid for">
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            >
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
              <option value={730}>2 years</option>
              <option value={1095}>3 years</option>
            </select>
          </Field>
          {error && (
            <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
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
              {saving ? "Queueing…" : "Queue PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

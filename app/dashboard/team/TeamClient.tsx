"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ROLE_PERMISSIONS, type WorkspaceRole } from "@/lib/roles";
import { changeMemberRole, inviteMember, removeMember, revokeInvite } from "./actions";

export type Member = {
  id: string;
  user_id: string;
  role: WorkspaceRole;
  scope: { description?: string };
  status: string;
  created_at: string;
  email: string;
  full_name: string | null;
  is_self: boolean;
};

export type Invite = {
  id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  expires_at: string;
  created_at: string;
};

const COLORS = ["bg-accent", "bg-warn", "bg-ok", "bg-ink", "bg-bad", "bg-accent-deep", "bg-body"];

const ROLE_OPTIONS: WorkspaceRole[] = ["admin", "finance", "manager", "ops", "legal"];

export function TeamMembersTable({
  members,
  invites,
  canManage,
  workspaceName,
}: {
  members: Member[];
  invites: Invite[];
  canManage: boolean;
  workspaceName: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.full_name ?? "").toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-48 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] text-ink outline-none focus:border-accent"
        />
        {canManage && (
          <button
            onClick={() => setInviteOpen(true)}
            className="ml-auto rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
          >
            + Invite member
          </button>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="hidden grid-cols-[2fr_1.6fr_0.7fr_1.2fr_0.7fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>Member</div>
          <div>Email</div>
          <div>Role</div>
          <div>Scope</div>
          <div>Joined</div>
          <div className="text-right">Actions</div>
        </div>
        <ul className="divide-y divide-hairline">
          {filteredMembers.map((m, i) => (
            <li
              key={m.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[2fr_1.6fr_0.7fr_1.2fr_0.7fr_0.6fr]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white",
                    COLORS[i % COLORS.length]
                  )}
                >
                  {initials(m.full_name ?? m.email)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">
                    {m.full_name ?? m.email.split("@")[0]} {m.is_self && <span className="font-mono text-[10px] text-body">(you)</span>}
                  </div>
                  <div className="truncate font-mono text-[10px] text-body md:hidden">{m.email}</div>
                </div>
              </div>
              <div className="hidden truncate font-mono text-[12px] text-body md:block">{m.email}</div>
              <div className="hidden md:block">
                {canManage && !m.is_self && m.role !== "owner" ? (
                  <select
                    value={m.role}
                    onChange={async (e) => {
                      const result = await changeMemberRole(m.id, e.target.value as WorkspaceRole);
                      if (!result.ok) alert(result.error);
                      else refresh();
                    }}
                    className="h-7 rounded-md border border-hairline bg-white px-2 font-mono text-[10px] uppercase tracking-wider text-ink"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">
                    {m.role}
                  </span>
                )}
              </div>
              <div className="hidden truncate font-mono text-[11px] text-body md:block">
                {m.scope?.description ?? "All locations"}
              </div>
              <div className="hidden font-mono text-[11px] text-body md:block">
                {new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
              <div className="flex items-center justify-end gap-2">
                {canManage && !m.is_self && m.role !== "owner" && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Remove ${m.email} from ${workspaceName}?`)) return;
                      const r = await removeMember(m.id);
                      if (!r.ok) alert(r.error);
                      else refresh();
                    }}
                    className="rounded border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
          {filteredMembers.length === 0 && (
            <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
              No members match the filter.
            </li>
          )}
        </ul>
      </div>

      {invites.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
            Pending invites · {invites.length}
          </div>
          <ul className="divide-y divide-hairline">
            {invites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">{inv.email}</div>
                  <div className="font-mono text-[10px] text-body">
                    Role · {inv.role} · expires{" "}
                    {new Date(inv.expires_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/signup?invite=${inv.token}&email=${encodeURIComponent(
                        inv.email
                      )}`;
                      navigator.clipboard.writeText(url);
                      alert("Invite URL copied to clipboard.");
                    }}
                    className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                  >
                    Copy link
                  </button>
                  {canManage && (
                    <button
                      onClick={async () => {
                        const r = await revokeInvite(inv.id);
                        if (!r.ok) alert(r.error);
                        else refresh();
                      }}
                      className="rounded-md border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {inviteOpen && (
        <InviteDialog
          onClose={() => setInviteOpen(false)}
          onInvited={() => {
            setInviteOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function InviteDialog({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("manager");
  const [scope, setScope] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
        <div className="font-display text-[20px] font-light text-ink">Invite a teammate</div>
        <p className="mt-1 text-[13px] text-body">
          They&apos;ll get an invite link. Active users get added immediately.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            const r = await inviteMember({ email, role, scope });
            setSaving(false);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            onInvited();
          }}
          className="mt-4 space-y-3"
        >
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Role">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} — {ROLE_PERMISSIONS[r].description}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Scope (optional)">
            <input
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="TX · IL locations"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
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
              {saving ? "Sending…" : "Send invite"}
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

function initials(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

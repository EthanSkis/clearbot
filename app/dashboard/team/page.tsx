import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext, ROLE_PERMISSIONS, type WorkspaceRole } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { TeamMembersTable, type Invite, type Member } from "./TeamClient";

export const metadata: Metadata = { title: "Team · ClearBot" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const [{ data: memberRows }, { data: inviteRows }, { data: activityRows }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("id, user_id, role, scope, status, created_at, profiles:user_id(email, full_name)")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("workspace_invites")
      .select("id, email, role, token, expires_at, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id, type, title, detail, actor_label, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const members: Member[] = (memberRows ?? []).map((m) => {
    const profile = m.profiles as unknown as { email: string; full_name: string | null } | null;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role as WorkspaceRole,
      scope: (m.scope ?? {}) as { description?: string },
      status: m.status,
      created_at: m.created_at,
      email: profile?.email ?? "",
      full_name: profile?.full_name ?? null,
      is_self: m.user_id === ctx.user.id,
    };
  });

  const invites: Invite[] = (inviteRows ?? []) as unknown as Invite[];

  const ssoConnected = false; // wired from settings.security if/when set
  const totalSeats = members.filter((m) => m.status === "active").length;
  const rolesUsed = new Set(members.map((m) => m.role)).size;

  return (
    <>
      <PageHeader
        eyebrow={`${totalSeats} seat${totalSeats === 1 ? "" : "s"} · RBAC enforced`}
        title={
          <>
            Your team, <span className="italic">scoped.</span>
          </>
        }
        subtitle="Operators see their locations. Finance sees fees. Legal sees the audit trail."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Members" value={String(totalSeats)} sub={`${invites.length} pending invite${invites.length === 1 ? "" : "s"}`} />
        <Stat label="Roles in use" value={String(rolesUsed)} sub="of 6 defined" />
        <Stat label="Owners" value={String(members.filter((m) => m.role === "owner").length)} sub="full workspace control" />
        <Stat label="SSO" value={ssoConnected ? "Active" : "Off"} sub="connect via Settings → Security" />
      </section>

      <section>
        <SectionHeader title="Members" subtitle="Manage roles and remove access. Owners and admins only." />
        <TeamMembersTable
          members={members}
          invites={invites}
          canManage={canAdmin(ctx.membership.role)}
          workspaceName={ctx.workspace.name}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeader title="Role matrix" subtitle="Who can see what and do what." />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <div className="grid grid-cols-[1.2fr_1.8fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
              <div>Role</div>
              <div>Description</div>
              <div className="text-center">View</div>
              <div className="text-center">Edit</div>
              <div className="text-center">File</div>
              <div className="text-center">Approve</div>
              <div className="text-center">Admin</div>
            </div>
            <ul className="divide-y divide-hairline">
              {(Object.keys(ROLE_PERMISSIONS) as WorkspaceRole[]).map((role) => {
                const r = ROLE_PERMISSIONS[role];
                return (
                  <li
                    key={role}
                    className="grid grid-cols-[1.2fr_1.8fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr] items-center gap-4 px-5 py-3"
                  >
                    <div className="text-[13px] font-medium capitalize text-ink">{role}</div>
                    <div className="text-[12px] text-body">{r.description}</div>
                    <Check v={r.view} />
                    <Check v={r.edit} />
                    <Check v={r.file} />
                    <Check v={r.approve} />
                    <Check v={r.admin} />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div>
          <SectionHeader title="Recent activity" subtitle="Last 8 actions in this workspace." />
          <div className="mt-4 rounded-2xl border border-hairline bg-white shadow-card">
            <ul className="divide-y divide-hairline">
              {(activityRows ?? []).length === 0 && (
                <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
                  No activity yet. Add a location, license, or invite a teammate.
                </li>
              )}
              {(activityRows ?? []).map((l) => (
                <li key={l.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-medium text-ink">{l.actor_label ?? "System"}</div>
                    <span className="font-mono text-[10px] text-body">{timeAgo(l.created_at)}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-body">{l.title}</div>
                  {l.detail && <div className="mt-0.5 font-mono text-[10px] text-body">{l.detail}</div>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

function Check({ v }: { v: boolean }) {
  return (
    <div className="flex justify-center">
      {v ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <span className="h-0.5 w-2.5 rounded-full bg-hairline" />
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, type MemberOption, type WorkspaceSnapshot } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings · ClearBot" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id, profiles:user_id(email, full_name)")
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "active");

  const memberOptions: MemberOption[] = (members ?? []).map((m) => {
    const p = m.profiles as unknown as { email: string; full_name: string | null } | null;
    return {
      user_id: m.user_id,
      email: p?.email ?? "",
      full_name: p?.full_name ?? null,
    };
  });

  const snapshot: WorkspaceSnapshot = {
    id: ctx.workspace.id,
    name: ctx.workspace.name,
    legal_entity: ctx.workspace.legal_entity,
    timezone: ctx.workspace.timezone,
    plan: ctx.workspace.plan,
    status: ctx.workspace.status,
    settings: ctx.workspace.settings,
    role: ctx.membership.role,
  };

  return (
    <>
      <PageHeader
        eyebrow={`Workspace · ${ctx.workspace.name}`}
        title={
          <>
            Settings, <span className="italic">all in one place.</span>
          </>
        }
        subtitle="Workspace identity, security posture, notification routing, and danger-zone actions."
      />

      <SettingsView workspace={snapshot} members={memberOptions} canManage={canAdmin(ctx.membership.role)} />
    </>
  );
}

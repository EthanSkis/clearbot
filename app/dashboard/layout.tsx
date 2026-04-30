import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell, type DashboardUser, type DashboardWorkspace } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, company")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("id, workspace_id, role, scope, status, workspaces:workspace_id(id, name, plan, settings)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  if (!memberships || memberships.length === 0) {
    redirect("/onboarding");
  }

  const active = memberships[0];
  const workspaceId = active.workspace_id as string;
  const workspaceRow = active.workspaces as unknown as { id: string; name: string; plan: string; settings: { default_mode?: string } } | null;

  const [
    { count: locationsCount },
    { count: renewalsCount },
    { count: filingsCount },
    { count: documentsCount },
    { count: teamCount },
    { data: notificationRows },
  ] = await Promise.all([
    supabase.from("locations").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "active"),
    supabase
      .from("licenses")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .lte("expires_at", new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString().slice(0, 10)),
    supabase
      .from("filings")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("stage", ["intake", "prep", "review", "submit"]),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "active"),
    supabase
      .from("activity_log")
      .select("id, type, title, detail, actor_label, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const workspace: DashboardWorkspace = {
    id: workspaceId,
    name: workspaceRow?.name ?? "Workspace",
    plan: workspaceRow?.plan ?? "essential",
    role: active.role as string,
  };

  const dashboardUser: DashboardUser = {
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? null,
  };

  const automationDefault = (workspaceRow?.settings?.default_mode ?? "auto") as "alert" | "prep" | "auto";

  return (
    <DashboardShell
      user={dashboardUser}
      workspace={workspace}
      automationDefault={automationDefault}
      badges={{
        locations: locationsCount ?? 0,
        renewals: renewalsCount ?? 0,
        filings: filingsCount ?? 0,
        documents: documentsCount ?? 0,
        team: teamCount ?? 0,
      }}
      notifications={(notificationRows ?? []).map((n) => ({
        id: n.id as string,
        type: n.type as string,
        title: n.title as string,
        detail: (n.detail as string | null) ?? null,
        actor_label: (n.actor_label as string | null) ?? null,
        created_at: n.created_at as string,
      }))}
    >
      {children}
    </DashboardShell>
  );
}

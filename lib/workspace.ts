import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_PERMISSIONS, canAdmin, canApprove, type WorkspaceRole } from "@/lib/roles";

export type Workspace = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  legal_entity: string | null;
  brand_logo_url: string | null;
  timezone: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMembership = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  scope: Record<string, unknown>;
  status: string;
  created_at: string;
};

export type CurrentContext = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: string | null;
  };
  workspace: Workspace;
  membership: WorkspaceMembership;
};

export async function getCurrentContext(): Promise<CurrentContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("id, workspace_id, user_id, role, scope, status, created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", membership.workspace_id)
    .maybeSingle();
  if (!workspace) return null;

  return {
    user: {
      id: user.id,
      email: user.email ?? "",
      fullName: profile?.full_name ?? null,
      role: profile?.role ?? null,
    },
    workspace: workspace as Workspace,
    membership: membership as WorkspaceMembership,
  };
}

export async function requireContext(): Promise<CurrentContext> {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/login?next=/dashboard");
  return ctx;
}

export { ROLE_PERMISSIONS, canApprove, canAdmin };
export type { WorkspaceRole };

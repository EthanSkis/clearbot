import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell, type DashboardUser } from "@/components/dashboard/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const dashboardUser: DashboardUser = {
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? null,
  };

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}

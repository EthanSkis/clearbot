export type WorkspaceRole = "owner" | "admin" | "finance" | "manager" | "ops" | "legal";

export const ROLE_PERMISSIONS: Record<
  WorkspaceRole,
  {
    view: boolean;
    edit: boolean;
    file: boolean;
    approve: boolean;
    admin: boolean;
    description: string;
  }
> = {
  owner: { view: true, edit: true, file: true, approve: true, admin: true, description: "Full workspace control · billing · team" },
  admin: { view: true, edit: true, file: true, approve: true, admin: true, description: "Workspace administration without ownership transfer" },
  finance: { view: true, edit: true, file: false, approve: true, admin: false, description: "Fees, AP routing, billing, invoices" },
  manager: { view: true, edit: true, file: true, approve: false, admin: false, description: "Locations scoped by region or tag" },
  ops: { view: true, edit: true, file: true, approve: false, admin: false, description: "Filing review and submission" },
  legal: { view: true, edit: false, file: false, approve: false, admin: false, description: "Read-only audit access" },
};

export function canApprove(role: WorkspaceRole) {
  return ROLE_PERMISSIONS[role].approve;
}

export function canAdmin(role: WorkspaceRole) {
  return ROLE_PERMISSIONS[role].admin;
}

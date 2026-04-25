"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useDialog } from "@/components/ui/Dialog";
import {
  cancelSubscription,
  deleteWorkspace,
  exportWorkspace,
  transferOwnership,
  updateAutomationSettings,
  updateGeneralSettings,
  updateNotificationSettings,
  updateSecuritySettings,
} from "./actions";

export type WorkspaceSnapshot = {
  id: string;
  name: string;
  legal_entity: string | null;
  timezone: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  role: string;
};

export type MemberOption = { user_id: string; email: string; full_name: string | null };

export function SettingsView({
  workspace,
  members,
  canManage,
}: {
  workspace: WorkspaceSnapshot;
  members: MemberOption[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [section, setSection] = useState<
    "general" | "security" | "notifications" | "automation" | "developer" | "danger-zone"
  >("general");

  function refresh() {
    startTransition(() => router.refresh());
  }

  const SECTIONS = ["General", "Security", "Notifications", "Automation", "Developer", "Danger zone"] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-[150px] lg:self-start">
        <nav className="flex flex-row overflow-x-auto rounded-2xl border border-hairline bg-white p-1 shadow-card lg:flex-col">
          {SECTIONS.map((s) => {
            const id = s.toLowerCase().replace(/\s+/g, "-") as typeof section;
            const active = section === id;
            return (
              <button
                key={s}
                onClick={() => setSection(id)}
                className={clsx(
                  "whitespace-nowrap rounded-md px-3 py-2 text-left text-[13px] font-medium transition-colors",
                  active
                    ? "bg-accent-soft text-accent-deep"
                    : "text-body hover:bg-bgalt hover:text-ink"
                )}
              >
                {s}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-col gap-6">
        {section === "general" && (
          <GeneralSection workspace={workspace} canManage={canManage} onSaved={refresh} />
        )}
        {section === "security" && (
          <SecuritySection workspace={workspace} canManage={canManage} onSaved={refresh} />
        )}
        {section === "notifications" && (
          <NotificationsSection workspace={workspace} onSaved={refresh} />
        )}
        {section === "automation" && (
          <AutomationSection workspace={workspace} canManage={canManage} onSaved={refresh} />
        )}
        {section === "developer" && <DeveloperSection />}
        {section === "danger-zone" && (
          <DangerSection workspace={workspace} members={members} onChanged={refresh} />
        )}
      </div>
    </div>
  );
}

function GeneralSection({
  workspace,
  canManage,
  onSaved,
}: {
  workspace: WorkspaceSnapshot;
  canManage: boolean;
  onSaved: () => void;
}) {
  const [name, setName] = useState(workspace.name);
  const [legalEntity, setLegalEntity] = useState(workspace.legal_entity ?? "");
  const [timezone, setTimezone] = useState(workspace.timezone);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title="General" subtitle="Workspace identity, used on exported reports and agency filings.">
      <FormRow label="Workspace name">
        <Input value={name} onChange={setName} disabled={!canManage} />
      </FormRow>
      <FormRow label="Legal entity">
        <Input value={legalEntity} onChange={setLegalEntity} disabled={!canManage} />
      </FormRow>
      <FormRow label="Time zone">
        <Select
          disabled={!canManage}
          value={timezone}
          onChange={setTimezone}
          options={[
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "America/Anchorage",
            "Pacific/Honolulu",
          ]}
        />
      </FormRow>
      <FormFooter
        error={error}
        canSave={canManage}
        onSave={async () => {
          const r = await updateGeneralSettings({ name, legalEntity, timezone });
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setError(null);
          onSaved();
        }}
      />
    </Card>
  );
}

type SecuritySettings = {
  sso_enforced?: boolean;
  scim_active?: boolean;
  session_lifetime?: string;
  ip_allowlist?: boolean;
  audit_retention?: string;
  baa_on_file?: boolean;
};

function SecuritySection({
  workspace,
  canManage,
  onSaved,
}: {
  workspace: WorkspaceSnapshot;
  canManage: boolean;
  onSaved: () => void;
}) {
  const seed = ((workspace.settings as { security?: SecuritySettings }).security ?? {}) as SecuritySettings;
  const [ssoEnforced, setSsoEnforced] = useState(Boolean(seed.sso_enforced));
  const [scimActive, setScimActive] = useState(Boolean(seed.scim_active));
  const [sessionLifetime, setSessionLifetime] = useState(seed.session_lifetime ?? "8 hours");
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(Boolean(seed.ip_allowlist));
  const [auditRetention, setAuditRetention] = useState(seed.audit_retention ?? "7 years (default)");
  const [baaOnFile, setBaaOnFile] = useState(Boolean(seed.baa_on_file));
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title="Security" subtitle="SSO, session, and data-protection controls." eyebrow="SOC 2 Type II · AES-256 at rest · TLS 1.3">
      <FormRow label="Single sign-on">
        <Toggle on={ssoEnforced} setOn={setSsoEnforced} label={ssoEnforced ? "Enforced" : "Disabled"} />
      </FormRow>
      <FormRow label="SCIM provisioning">
        <Toggle on={scimActive} setOn={setScimActive} label={scimActive ? "Active" : "Inactive"} />
      </FormRow>
      <FormRow label="Session lifetime">
        <Select
          value={sessionLifetime}
          onChange={setSessionLifetime}
          options={["30 minutes", "2 hours", "8 hours", "24 hours"]}
        />
      </FormRow>
      <FormRow label="IP allowlist">
        <Toggle
          on={ipAllowlistEnabled}
          setOn={setIpAllowlistEnabled}
          label={ipAllowlistEnabled ? "On" : "Off"}
        />
      </FormRow>
      <FormRow label="Audit log retention">
        <Select
          value={auditRetention}
          onChange={setAuditRetention}
          options={["7 years (default)", "10 years", "Forever"]}
        />
      </FormRow>
      <FormRow label="BAA on file">
        <Toggle on={baaOnFile} setOn={setBaaOnFile} label={baaOnFile ? "Yes" : "No"} />
      </FormRow>
      <FormFooter
        error={error}
        canSave={canManage}
        onSave={async () => {
          const r = await updateSecuritySettings({
            ssoEnforced,
            scimActive,
            sessionLifetime,
            ipAllowlistEnabled,
            auditRetention,
            baaOnFile,
          });
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setError(null);
          onSaved();
        }}
      />
    </Card>
  );
}

type NotificationSettings = {
  owner?: { email?: boolean; sms?: boolean; slack?: boolean };
  manager?: { email?: boolean; sms?: boolean; slack?: boolean };
  finance?: { email?: boolean; slack?: boolean };
  lead_days?: number;
  escalation_hours?: number;
};

function NotificationsSection({
  workspace,
  onSaved,
}: {
  workspace: WorkspaceSnapshot;
  onSaved: () => void;
}) {
  const seed = ((workspace.settings as { notifications?: NotificationSettings }).notifications ?? {}) as NotificationSettings;
  const [ownerEmail, setOwnerEmail] = useState(seed.owner?.email ?? true);
  const [ownerSms, setOwnerSms] = useState(seed.owner?.sms ?? false);
  const [ownerSlack, setOwnerSlack] = useState(seed.owner?.slack ?? false);
  const [managerEmail, setManagerEmail] = useState(seed.manager?.email ?? true);
  const [managerSms, setManagerSms] = useState(seed.manager?.sms ?? false);
  const [managerSlack, setManagerSlack] = useState(seed.manager?.slack ?? false);
  const [financeEmail, setFinanceEmail] = useState(seed.finance?.email ?? true);
  const [financeSlack, setFinanceSlack] = useState(seed.finance?.slack ?? false);
  const [leadDays, setLeadDays] = useState(seed.lead_days ?? 45);
  const [escalationHours, setEscalationHours] = useState(seed.escalation_hours ?? 48);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title="Notifications" subtitle="Where and how your team hears about renewals.">
      <FormRow label="Owner alerts">
        <div className="flex flex-wrap gap-2">
          <Toggle on={ownerEmail} setOn={setOwnerEmail} label="Email" compact />
          <Toggle on={ownerSms} setOn={setOwnerSms} label="SMS" compact />
          <Toggle on={ownerSlack} setOn={setOwnerSlack} label="Slack" compact />
        </div>
      </FormRow>
      <FormRow label="Manager alerts">
        <div className="flex flex-wrap gap-2">
          <Toggle on={managerEmail} setOn={setManagerEmail} label="Email" compact />
          <Toggle on={managerSms} setOn={setManagerSms} label="SMS" compact />
          <Toggle on={managerSlack} setOn={setManagerSlack} label="Slack" compact />
        </div>
      </FormRow>
      <FormRow label="Finance alerts">
        <div className="flex flex-wrap gap-2">
          <Toggle on={financeEmail} setOn={setFinanceEmail} label="Email" compact />
          <Toggle on={financeSlack} setOn={setFinanceSlack} label="Slack" compact />
        </div>
      </FormRow>
      <FormRow label="Deadline lead time" help="How far in advance to fire the first alert.">
        <Select
          value={String(leadDays)}
          onChange={(v) => setLeadDays(Number(v))}
          options={["30", "45", "60", "90"]}
          format={(v) => `${v} days`}
        />
      </FormRow>
      <FormRow label="Escalation" help="Escalate to the owner if a filing stalls.">
        <Select
          value={String(escalationHours)}
          onChange={(v) => setEscalationHours(Number(v))}
          options={["24", "48", "72", "168"]}
          format={(v) => (Number(v) >= 168 ? "1 week" : `${v} hours`)}
        />
      </FormRow>
      <FormFooter
        error={error}
        canSave
        onSave={async () => {
          const r = await updateNotificationSettings({
            ownerEmail,
            ownerSms,
            ownerSlack,
            managerEmail,
            managerSms,
            managerSlack,
            financeEmail,
            financeSlack,
            leadDays,
            escalationHours,
          });
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setError(null);
          onSaved();
        }}
      />
    </Card>
  );
}

function AutomationSection({
  workspace,
  canManage,
  onSaved,
}: {
  workspace: WorkspaceSnapshot;
  canManage: boolean;
  onSaved: () => void;
}) {
  const seed = workspace.settings as {
    default_mode?: "alert" | "prep" | "auto";
    approval_threshold_cents?: number;
    auto_file_window_days?: number;
  };
  const [defaultMode, setDefaultMode] = useState<"alert" | "prep" | "auto">(seed.default_mode ?? "auto");
  const [thresholdUsd, setThresholdUsd] = useState(((seed.approval_threshold_cents ?? 100000) / 100).toString());
  const [autoFileWindowDays, setAutoFileWindowDays] = useState(String(seed.auto_file_window_days ?? 14));
  const [error, setError] = useState<string | null>(null);

  return (
    <Card title="Automation" subtitle="Defaults applied to every new license.">
      <FormRow label="Default mode">
        <ModePicker value={defaultMode} onChange={setDefaultMode} />
      </FormRow>
      <FormRow label="Approval threshold (USD)" help="Fees above this require human approval.">
        <Input value={thresholdUsd} onChange={setThresholdUsd} mono />
      </FormRow>
      <FormRow label="Auto-file window (days)" help="Submit within this many days of the deadline.">
        <Input value={autoFileWindowDays} onChange={setAutoFileWindowDays} mono />
      </FormRow>
      <FormFooter
        error={error}
        canSave={canManage}
        onSave={async () => {
          const r = await updateAutomationSettings({
            defaultMode,
            approvalThresholdUsd: Number(thresholdUsd) || 0,
            autoFileWindowDays: Number(autoFileWindowDays) || 14,
          });
          if (!r.ok) {
            setError(r.error);
            return;
          }
          setError(null);
          onSaved();
        }}
      />
    </Card>
  );
}

function DeveloperSection() {
  return (
    <Card title="Developer" subtitle="API keys live on the Integrations page.">
      <FormRow label="API surface">
        <span className="text-[13px] text-body">REST + GraphQL · OAuth-protected · cursor-paginated.</span>
      </FormRow>
      <FormRow label="Rate limit">
        <span className="font-mono text-[12px] text-ink">10,000 req / min per key</span>
      </FormRow>
      <FormRow label="Webhook signing">
        <span className="font-mono text-[12px] text-ink">{"HMAC SHA-256 of `{signing_secret}.{body}`"}</span>
      </FormRow>
    </Card>
  );
}

function DangerSection({
  workspace,
  members,
  onChanged,
}: {
  workspace: WorkspaceSnapshot;
  members: MemberOption[];
  onChanged: () => void;
}) {
  const dialog = useDialog();
  const [transferTarget, setTransferTarget] = useState(members[0]?.user_id ?? "");
  const [confirmName, setConfirmName] = useState("");
  return (
    <div id="danger-zone" className="rounded-2xl border border-bad/30 bg-bad/5 p-6 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-bad">Danger zone</div>
      <div className="mt-1 font-display text-[20px] font-light text-ink">Irreversible workspace actions.</div>
      <div className="mt-4 space-y-3">
        <DangerRow
          title="Export workspace"
          body="Download every location, license, and filing as CSV."
          cta="Export"
          onClick={async () => {
            const r = await exportWorkspace();
            if (!r.ok) {
              await dialog.alert({ title: "Export failed", body: r.error, tone: "danger" });
              return;
            }
            const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${workspace.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            dialog.toast({ body: "Workspace export downloaded.", tone: "success" });
          }}
        />
        <div className="rounded-md border border-hairline bg-white p-4">
          <div className="text-[13px] font-medium text-ink">Transfer ownership</div>
          <div className="mt-0.5 text-[12px] text-body">
            Move the owner role to another member. Your role drops to Admin.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={transferTarget}
              onChange={(e) => setTransferTarget(e.target.value)}
              className="h-9 rounded-md border border-hairline bg-white px-2 font-sans text-[12px]"
            >
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name ?? m.email}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (!transferTarget) return;
                const target = members.find((m) => m.user_id === transferTarget);
                const targetLabel = target?.full_name ?? target?.email ?? "this member";
                const ok = await dialog.confirm({
                  title: "Transfer workspace ownership?",
                  body: `${targetLabel} becomes the owner. You drop to Admin and lose owner-only powers (delete, transfer, ownership). This can't be undone from this page.`,
                  confirmLabel: "Transfer",
                  tone: "danger",
                });
                if (!ok) return;
                const r = await transferOwnership(transferTarget);
                if (!r.ok) {
                  await dialog.alert({ title: "Could not transfer ownership", body: r.error, tone: "danger" });
                } else {
                  dialog.toast({ body: `${targetLabel} is now the owner.`, tone: "success" });
                  onChanged();
                }
              }}
              className="rounded-md border border-bad/40 bg-bad/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bad hover:bg-bad/15"
            >
              Transfer
            </button>
          </div>
        </div>
        <DangerRow
          title="Cancel subscription"
          body="Workspace stays accessible but new filings stop until you reactivate."
          cta="Cancel"
          onClick={async () => {
            const ok = await dialog.confirm({
              title: "Cancel the subscription?",
              body: "The workspace stays accessible but new filings stop until you reactivate.",
              confirmLabel: "Cancel subscription",
              cancelLabel: "Keep it",
              tone: "danger",
            });
            if (!ok) return;
            const r = await cancelSubscription();
            if (!r.ok) {
              await dialog.alert({ title: "Could not cancel subscription", body: r.error, tone: "danger" });
            } else {
              dialog.toast({ body: "Subscription cancelled.", tone: "default" });
              onChanged();
            }
          }}
        />
        <div className="rounded-md border border-hairline bg-white p-4">
          <div className="text-[13px] font-medium text-ink">Delete workspace</div>
          <div className="mt-0.5 text-[12px] text-body">
            Type <span className="font-mono text-ink">{workspace.name}</span> to confirm. This deletes everything: locations, licenses, filings, documents.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={workspace.name}
              className="h-9 flex-1 rounded-md border border-hairline bg-white px-3 font-mono text-[12px]"
            />
            <button
              onClick={async () => {
                const r = await deleteWorkspace(confirmName);
                if (!r.ok) {
                  await dialog.alert({ title: "Could not delete workspace", body: r.error, tone: "danger" });
                }
              }}
              className="rounded-md border border-bad/40 bg-bad/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bad hover:bg-bad/15"
            >
              Delete forever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  eyebrow,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
      {eyebrow && (
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">{eyebrow}</div>
      )}
      <div className={clsx(eyebrow && "mt-1", "font-display text-[22px] font-light text-ink")}>{title}</div>
      {subtitle && <p className="mt-1 max-w-[560px] text-[13px] leading-[1.55] text-body">{subtitle}</p>}
      <div className="mt-5 divide-y divide-hairline">{children}</div>
    </section>
  );
}

function FormRow({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 py-4 md:grid-cols-[1fr_1.4fr] md:gap-6">
      <div>
        <div className="text-[13px] font-medium text-ink">{label}</div>
        {help && <div className="mt-1 max-w-[320px] text-[12px] leading-[1.5] text-body">{help}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function FormFooter({
  error,
  canSave,
  onSave,
}: {
  error: string | null;
  canSave: boolean;
  onSave: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-5 flex items-center justify-between gap-2 border-t border-hairline pt-4">
      <span className="font-mono text-[11px] text-bad">{error}</span>
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={async () => {
          setSaving(true);
          await onSave();
          setSaving(false);
        }}
        className={clsx(
          "rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white",
          !canSave || saving ? "cursor-not-allowed opacity-60" : "hover:bg-accent-deep"
        )}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function Input({
  value,
  onChange,
  mono,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={clsx(
        "h-9 w-full rounded-md border border-hairline bg-white px-3 text-[13px] text-ink outline-none focus:border-accent",
        mono && "font-mono text-[12px]",
        disabled && "opacity-60"
      )}
    />
  );
}

function Select({
  value,
  onChange,
  options,
  format,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  format?: (v: string) => string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={clsx(
        "h-9 w-full rounded-md border border-hairline bg-white px-3 text-[13px] text-ink outline-none focus:border-accent",
        disabled && "opacity-60"
      )}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {format ? format(o) : o}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  on,
  setOn,
  label,
  compact,
}: {
  on: boolean;
  setOn: (v: boolean) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={clsx(
        "inline-flex items-center gap-2",
        compact && "rounded-md border border-hairline bg-white px-2.5 py-1.5"
      )}
    >
      <span
        className={clsx(
          "inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
          on ? "bg-accent" : "bg-hairline"
        )}
      >
        <span
          className={clsx(
            "h-3 w-3 rounded-full bg-white shadow transition-transform",
            on && "translate-x-3"
          )}
        />
      </span>
      <span className={clsx("text-[12px]", on ? "text-ink" : "text-body")}>{label}</span>
    </button>
  );
}

function ModePicker({
  value,
  onChange,
}: {
  value: "alert" | "prep" | "auto";
  onChange: (v: "alert" | "prep" | "auto") => void;
}) {
  const modes = [
    { id: "alert" as const, name: "Alert", desc: "Notify only · you file" },
    { id: "prep" as const, name: "Prep", desc: "Pre-fill · you submit" },
    { id: "auto" as const, name: "Auto", desc: "End-to-end · ClearBot files" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={clsx(
            "rounded-md border px-3 py-2 text-left transition-colors",
            value === m.id
              ? "border-accent bg-accent-soft text-accent-deep"
              : "border-hairline bg-white text-body hover:text-ink"
          )}
        >
          <div className="text-[13px] font-medium">{m.name}</div>
          <div className="mt-0.5 text-[11px]">{m.desc}</div>
        </button>
      ))}
    </div>
  );
}

function DangerRow({
  title,
  body,
  cta,
  onClick,
}: {
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-white p-4">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 max-w-[520px] text-[12px] leading-[1.5] text-body">{body}</div>
      </div>
      <button
        onClick={onClick}
        className="rounded-md border border-bad/40 bg-bad/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bad hover:bg-bad/15"
      >
        {cta}
      </button>
    </div>
  );
}

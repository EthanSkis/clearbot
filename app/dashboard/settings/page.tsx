import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";

export const metadata: Metadata = { title: "Settings · ClearBot" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace · Meridian Restaurant Group"
        title={<>Settings, <span className="italic">all in one place.</span></>}
        subtitle="Workspace identity, security posture, notification routing, developer access. Changes are logged to the audit trail."
        actions={
          <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
            View audit log
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-[150px] lg:self-start">
          <nav className="flex flex-row overflow-x-auto rounded-2xl border border-hairline bg-white p-1 shadow-card lg:flex-col">
            {["General", "Security", "Notifications", "Automation", "Developer", "Danger zone"].map((s, i) => (
              <a
                key={s}
                href={`#${s.toLowerCase().replace(/\s+/g, "-")}`}
                className={clsx(
                  "whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  i === 0
                    ? "bg-accent-soft text-accent-deep"
                    : "text-body hover:bg-bgalt hover:text-ink"
                )}
              >
                {s}
              </a>
            ))}
          </nav>
        </aside>

        <div className="flex flex-col gap-6">
          {/* General */}
          <SettingsCard
            id="general"
            title="General"
            subtitle="Workspace identity, branding, and defaults."
          >
            <FormRow label="Workspace name" help="Shown in the sidebar and on exported reports.">
              <Input defaultValue="Meridian Restaurant Group" />
            </FormRow>
            <FormRow label="Legal entity" help="Used on agency filings when a legal name is required.">
              <Input defaultValue="Meridian Restaurant Group, LLC" />
            </FormRow>
            <FormRow label="Time zone" help="Deadlines are shown in this zone.">
              <Select options={["America/Chicago (CST)", "America/New_York (EST)", "America/Los_Angeles (PST)"]} />
            </FormRow>
            <FormRow label="Brand logo" help="Used in exported audit packs. 1:1 PNG, 512px+.">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-soft font-display text-[18px] text-accent-deep">
                  M
                </div>
                <button className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                  Upload
                </button>
              </div>
            </FormRow>
          </SettingsCard>

          {/* Security */}
          <SettingsCard
            id="security"
            title="Security"
            subtitle="SSO, session, and data protection controls."
            eyebrow="SOC 2 Type II · AES-256 at rest · TLS 1.3"
          >
            <FormRow label="Single sign-on" help="Users must authenticate via your IdP. Direct password login disabled.">
              <Toggle on label="Okta · enforced" />
            </FormRow>
            <FormRow label="SCIM provisioning" help="Users and scopes mirror your IdP directory in real time.">
              <Toggle on label="Active · last sync 42s ago" />
            </FormRow>
            <FormRow label="Session lifetime" help="Active sessions auto-expire after this window of inactivity.">
              <Select options={["30 minutes", "2 hours", "8 hours", "24 hours"]} value="8 hours" />
            </FormRow>
            <FormRow label="IP allowlist" help="Restrict workspace access to specified CIDRs.">
              <Toggle label="Off · configure" />
            </FormRow>
            <FormRow label="Audit log retention" help="Every action, every filing, every access — immutable.">
              <Select options={["7 years (default)", "10 years", "Forever"]} />
            </FormRow>
            <FormRow label="BAA on file" help="For healthcare and regulated verticals.">
              <Toggle on label="Signed Feb 2026" />
            </FormRow>
          </SettingsCard>

          {/* Notifications */}
          <SettingsCard
            id="notifications"
            title="Notifications"
            subtitle="Where and how your team hears about renewals."
          >
            <FormRow label="Owner (you) · Diana" help="You receive every alert, everywhere.">
              <div className="flex flex-wrap gap-2">
                <Toggle on label="Email" compact />
                <Toggle on label="SMS" compact />
                <Toggle on label="Slack #ops-renewals" compact />
              </div>
            </FormRow>
            <FormRow label="Managers · scoped" help="Each manager gets alerts only for their locations.">
              <div className="flex flex-wrap gap-2">
                <Toggle on label="Email" compact />
                <Toggle label="SMS" compact />
                <Toggle on label="Slack" compact />
              </div>
            </FormRow>
            <FormRow label="Finance · Marcus" help="Routed to AP for fee approval.">
              <div className="flex flex-wrap gap-2">
                <Toggle on label="Email" compact />
                <Toggle on label="Slack #finance-fees" compact />
              </div>
            </FormRow>
            <FormRow label="Deadline lead time" help="How far in advance to fire the first alert.">
              <Select options={["30 days", "45 days (default)", "60 days", "90 days"]} value="45 days (default)" />
            </FormRow>
            <FormRow label="Escalation" help="If a filing stalls, escalate to owner after this window.">
              <Select options={["24 hours", "48 hours", "1 week"]} value="48 hours" />
            </FormRow>
          </SettingsCard>

          {/* Automation */}
          <SettingsCard
            id="automation"
            title="Automation"
            subtitle="Default mode for new licenses. Per-license overrides live on each license record."
          >
            <FormRow label="Default mode" help="Applies to any new license added to the workspace.">
              <ModePicker />
            </FormRow>
            <FormRow label="Approval threshold" help="Fees above this require human approval regardless of mode.">
              <Input defaultValue="$1,000" monospace />
            </FormRow>
            <FormRow label="Auto-file window" help="Submit within this many days of the deadline.">
              <Select options={["7 days", "14 days (default)", "21 days", "30 days"]} value="14 days (default)" />
            </FormRow>
          </SettingsCard>

          {/* Developer */}
          <SettingsCard
            id="developer"
            title="Developer"
            subtitle="API keys, webhooks, and raw data access."
          >
            <FormRow label="API access" help="REST + GraphQL · OAuth-protected · cursor-paginated.">
              <Toggle on label="Enabled · 3 keys" />
            </FormRow>
            <FormRow label="Webhook signing secret" help="Rotate at any time. Dual-secret rotation supported.">
              <Input defaultValue="whsec_live_4f2a8c…09b3" monospace />
            </FormRow>
            <FormRow label="Rate limit" help="Per-key request ceiling. Plan-linked.">
              <Input defaultValue="10,000 req / min" monospace />
            </FormRow>
            <FormRow label="Streaming replica" help="Hosted Postgres mirror, refreshed every 15 minutes.">
              <Toggle label="Off · available on Professional" />
            </FormRow>
          </SettingsCard>

          {/* Danger zone */}
          <div id="danger-zone" className="rounded-2xl border border-bad/30 bg-bad/5 p-6 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-bad">Danger zone</div>
            <div className="mt-1 font-display text-[20px] font-light text-ink">Irreversible workspace actions.</div>
            <div className="mt-4 space-y-3">
              <DangerRow title="Export and delete workspace" body="Full data export (CSV + PDF), then permanent deletion. No egress fees. No lock-in." cta="Begin export" />
              <DangerRow title="Transfer ownership" body="Move Owner role to another member. Your role drops to Admin." cta="Transfer" />
              <DangerRow title="Cancel subscription" body="Keeps your data. Read-only access until the current term ends." cta="Cancel plan" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsCard({
  id,
  title,
  subtitle,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
      {eyebrow && (
        <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">{eyebrow}</div>
      )}
      <div className={clsx(eyebrow && "mt-1", "font-display text-[22px] font-light text-ink")}>{title}</div>
      {subtitle && <p className="mt-1 max-w-[560px] text-[13px] leading-[1.55] text-body">{subtitle}</p>}
      <div className="mt-5 divide-y divide-hairline">{children}</div>
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-hairline pt-4">
        <button className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
          Discard
        </button>
        <button className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep">
          Save changes
        </button>
      </div>
    </section>
  );
}

function FormRow({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
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

function Input({ defaultValue, monospace }: { defaultValue?: string; monospace?: boolean }) {
  return (
    <input
      defaultValue={defaultValue}
      className={clsx(
        "h-9 w-full rounded-md border border-hairline bg-white px-3 text-[13px] text-ink outline-none transition-colors focus:border-accent",
        monospace && "font-mono text-[12px]"
      )}
    />
  );
}

function Select({ options, value }: { options: string[]; value?: string }) {
  return (
    <select defaultValue={value ?? options[0]} className="h-9 w-full rounded-md border border-hairline bg-white px-3 text-[13px] text-ink outline-none focus:border-accent">
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

function Toggle({ on, label, compact }: { on?: boolean; label: string; compact?: boolean }) {
  return (
    <label className={clsx("inline-flex items-center gap-2", compact ? "rounded-md border border-hairline bg-white px-2.5 py-1.5" : "")}>
      <span
        className={clsx(
          "inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
          on ? "bg-accent" : "bg-hairline"
        )}
      >
        <span className={clsx("h-3 w-3 rounded-full bg-white shadow transition-transform", on && "translate-x-3")} />
      </span>
      <span className={clsx("text-[12px]", on ? "text-ink" : "text-body")}>{label}</span>
    </label>
  );
}

function ModePicker() {
  const modes = [
    { name: "Alert", desc: "Notify only · you file", active: false },
    { name: "Prep", desc: "Pre-fill · you submit", active: false },
    { name: "Auto", desc: "End-to-end · ClearBot files", active: true },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {modes.map((m) => (
        <button
          key={m.name}
          type="button"
          className={clsx(
            "rounded-md border px-3 py-2 text-left transition-colors",
            m.active
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

function DangerRow({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline bg-white p-4">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 max-w-[520px] text-[12px] leading-[1.5] text-body">{body}</div>
      </div>
      <button className="rounded-md border border-bad/40 bg-bad/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-bad hover:bg-bad/15">
        {cta}
      </button>
    </div>
  );
}

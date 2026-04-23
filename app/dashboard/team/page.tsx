import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";

export const metadata: Metadata = { title: "Team · ClearBot" };

type Member = {
  initials: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  lastActive: string;
  status: "online" | "away" | "offline";
};

const MEMBERS: Member[] = [
  { initials: "DR", name: "Diana Reyes", email: "diana@meridiang.com", role: "Owner", scope: "All locations", lastActive: "now", status: "online" },
  { initials: "MH", name: "Marcus Holt", email: "marcus@meridiang.com", role: "Finance", scope: "Fees · AP · Billing", lastActive: "4m ago", status: "online" },
  { initials: "PA", name: "Priya Anand", email: "priya@meridiang.com", role: "Manager", scope: "TX · IL locations", lastActive: "12m ago", status: "away" },
  { initials: "JP", name: "Jonathan Pak", email: "jpak@meridiang.com", role: "Legal", scope: "Audit trail · read-only", lastActive: "2h ago", status: "offline" },
  { initials: "EW", name: "Erica Walsh", email: "erica@meridiang.com", role: "Manager", scope: "CA · CO locations", lastActive: "just now", status: "online" },
  { initials: "RQ", name: "Rafael Quintero", email: "rafael@meridiang.com", role: "Regional", scope: "South-central", lastActive: "yesterday", status: "offline" },
  { initials: "NP", name: "Nadia Patel", email: "nadia@meridiang.com", role: "Ops", scope: "Filings review", lastActive: "3d ago", status: "offline" },
];

const ROLES = [
  { name: "Owner", body: "Full workspace control · billing · team", access: { view: true, edit: true, file: true, approve: true, admin: true } },
  { name: "Finance", body: "Fees, AP routing, billing, invoices", access: { view: true, edit: true, file: false, approve: true, admin: false } },
  { name: "Manager", body: "Locations scoped by region or tag", access: { view: true, edit: true, file: true, approve: false, admin: false } },
  { name: "Ops", body: "Filing review and submission", access: { view: true, edit: true, file: true, approve: false, admin: false } },
  { name: "Legal", body: "Read-only audit access", access: { view: true, edit: false, file: false, approve: false, admin: false } },
];

const STATUS_COLOR = { online: "bg-ok", away: "bg-warn", offline: "bg-body/40" };
const COLORS = ["bg-accent", "bg-warn", "bg-ok", "bg-ink", "bg-bad", "bg-accent-deep", "bg-body"];

const LOG = [
  { who: "Marcus Holt", what: "Downloaded Q1 audit pack (38 records, PDF)", when: "14m ago" },
  { who: "Priya Anand", what: "Approved filing packet CB-40122 · Austin, TX", when: "1h ago" },
  { who: "Diana Reyes", what: "Invited nadia@meridiang.com · role: Ops", when: "2h ago" },
  { who: "Erica Walsh", what: "Switched LA location to Automation mode · Auto", when: "yesterday" },
  { who: "Jonathan Pak", what: "Viewed audit trail · Chicago, IL liquor license", when: "yesterday" },
];

export default function TeamPage() {
  return (
    <>
      <PageHeader
        eyebrow="7 seats · RBAC on · SSO enforced"
        title={<>Your team, <span className="italic">scoped.</span></>}
        subtitle="Operators see their locations. Finance sees fees. Legal sees the audit trail. Nobody sees more than they need to."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Manage SSO
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              + Invite member
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Members" value="7" sub="1 pending invite" />
        <Stat label="Online now" value="3" sub="of 7 seats" />
        <Stat label="Roles defined" value="5" sub="fully scoped" />
        <Stat label="SSO coverage" value="100%" sub="Okta enforced" />
      </section>

      <section>
        <SectionHeader
          title="Members"
          right={
            <div className="flex items-center gap-2">
              <input type="search" placeholder="Filter…" className="h-8 w-44 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] text-ink outline-none focus:border-accent" />
            </div>
          }
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[2fr_1.6fr_0.7fr_1.2fr_0.7fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>Member</div>
            <div>Email</div>
            <div>Role</div>
            <div>Scope</div>
            <div>Last active</div>
            <div className="text-right">Status</div>
          </div>
          <ul className="divide-y divide-hairline">
            {MEMBERS.map((m, i) => (
              <li key={m.email} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[2fr_1.6fr_0.7fr_1.2fr_0.7fr_0.6fr]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative shrink-0">
                    <span className={clsx("flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white", COLORS[i % COLORS.length])}>
                      {m.initials}
                    </span>
                    <span className={clsx("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white", STATUS_COLOR[m.status])} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-ink">{m.name}</div>
                    <div className="truncate font-mono text-[10px] text-body md:hidden">{m.email}</div>
                  </div>
                </div>
                <div className="hidden truncate font-mono text-[12px] text-body md:block">{m.email}</div>
                <div className="hidden md:block">
                  <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">{m.role}</span>
                </div>
                <div className="hidden truncate font-mono text-[11px] text-body md:block">{m.scope}</div>
                <div className="hidden font-mono text-[11px] text-body md:block">{m.lastActive}</div>
                <div className="flex items-center justify-end font-mono text-[11px] uppercase tracking-wider text-body">
                  <span className={clsx("mr-1.5 h-1.5 w-1.5 rounded-full", STATUS_COLOR[m.status])} />
                  {m.status}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeader title="Role matrix" subtitle="Who can see what and do what. Click any row to edit permissions." />
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
              {ROLES.map((r) => (
                <li key={r.name} className="grid grid-cols-[1.2fr_1.8fr_0.4fr_0.4fr_0.4fr_0.4fr_0.4fr] items-center gap-4 px-5 py-3">
                  <div className="text-[13px] font-medium text-ink">{r.name}</div>
                  <div className="text-[12px] text-body">{r.body}</div>
                  <Check v={r.access.view} />
                  <Check v={r.access.edit} />
                  <Check v={r.access.file} />
                  <Check v={r.access.approve} />
                  <Check v={r.access.admin} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <SectionHeader title="Recent team activity" subtitle="Every action, logged and immutable." />
          <div className="mt-4 rounded-2xl border border-hairline bg-white shadow-card">
            <ul className="divide-y divide-hairline">
              {LOG.map((l, i) => (
                <li key={i} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[13px] font-medium text-ink">{l.who}</div>
                    <span className="font-mono text-[10px] text-body">{l.when}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-body">{l.what}</div>
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
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">{value}</div>
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

"use client";

import clsx from "clsx";

type Member = {
  initials: string;
  name: string;
  role: string;
  scope: string;
  online?: boolean;
};

const MEMBERS: Member[] = [
  {
    initials: "DR",
    name: "Diana Reyes",
    role: "Owner · Director of Ops",
    scope: "All locations",
    online: true,
  },
  {
    initials: "MH",
    name: "Marcus Holt",
    role: "Finance · COO",
    scope: "Fees & AP",
    online: true,
  },
  {
    initials: "PA",
    name: "Priya Anand",
    role: "Manager",
    scope: "TX · IL locations",
  },
  {
    initials: "JP",
    name: "Jonathan Pak",
    role: "Legal · Read-only",
    scope: "Audit trail",
  },
  {
    initials: "EW",
    name: "Erica Walsh",
    role: "Manager",
    scope: "CA · CO locations",
    online: true,
  },
];

const COLORS = ["bg-accent", "bg-warn", "bg-ok", "bg-ink", "bg-bad"];

export function TeamPanel() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Team & access
          </div>
          <div className="mt-0.5 font-display text-[18px] font-light text-ink">
            5 seats · RBAC on.
          </div>
        </div>
        <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink">
          + Invite
        </button>
      </div>

      <ul className="flex-1 divide-y divide-hairline">
        {MEMBERS.map((m, i) => (
          <li key={m.initials} className="flex items-center gap-3 px-5 py-3">
            <span className="relative shrink-0">
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white",
                  COLORS[i % COLORS.length]
                )}
              >
                {m.initials}
              </span>
              {m.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-ok ring-2 ring-white" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">
                {m.name}
              </div>
              <div className="truncate font-mono text-[10px] text-body">
                {m.role}
              </div>
            </div>
            <div className="shrink-0 rounded-md bg-bgalt px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body">
              {m.scope}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-3 font-mono text-[11px] text-body">
        <span>SSO · Okta · SCIM enabled</span>
        <a href="#" className="hover:text-ink">
          Manage roles →
        </a>
      </div>
    </div>
  );
}

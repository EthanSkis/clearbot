import clsx from "clsx";
import Link from "next/link";

export type TeamPanelMember = {
  initials: string;
  name: string;
  role: string;
  scope: string;
  online?: boolean;
};

const COLORS = ["bg-accent", "bg-warn", "bg-ok", "bg-ink", "bg-bad"];

export function TeamPanelServer({
  members,
  ssoLabel,
}: {
  members: TeamPanelMember[];
  ssoLabel: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Team & access
          </div>
          <div className="mt-0.5 font-display text-[18px] font-light text-ink">
            {members.length} seat{members.length === 1 ? "" : "s"} · RBAC on.
          </div>
        </div>
        <Link
          href="/dashboard/team"
          className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
        >
          + Invite
        </Link>
      </div>

      <ul className="flex-1 divide-y divide-hairline">
        {members.length === 0 && (
          <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
            Just you here. Invite teammates from the Team page.
          </li>
        )}
        {members.map((m, i) => (
          <li key={`${m.initials}-${i}`} className="flex items-center gap-3 px-5 py-3">
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
              <div className="truncate text-[13px] font-medium text-ink">{m.name}</div>
              <div className="truncate font-mono text-[10px] text-body">{m.role}</div>
            </div>
            <div className="shrink-0 rounded-md bg-bgalt px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body">
              {m.scope}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-3 font-mono text-[11px] text-body">
        <span>{ssoLabel}</span>
        <Link href="/dashboard/team" className="hover:text-ink">
          Manage roles →
        </Link>
      </div>
    </div>
  );
}

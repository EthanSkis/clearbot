"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { Pill } from "@/components/ui/Pill";
import { DialogProvider } from "@/components/ui/Dialog";
import { CHANGELOG } from "@/components/changelog/data";

type IconName =
  | "grid"
  | "pin"
  | "calendar"
  | "doc"
  | "folder"
  | "bank"
  | "users"
  | "card"
  | "gear"
  | "pulse";

type NavItem = {
  label: string;
  href: string;
  icon: IconName;
  badgeKey?: keyof BadgeCounts;
};

export type BadgeCounts = {
  locations: number;
  renewals: number;
  filings: number;
  documents: number;
  team: number;
};

const NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "grid" },
  { label: "Locations", href: "/dashboard/locations", icon: "pin", badgeKey: "locations" },
  { label: "Renewals", href: "/dashboard/renewals", icon: "calendar", badgeKey: "renewals" },
  { label: "Filings", href: "/dashboard/filings", icon: "doc" },
  { label: "Documents", href: "/dashboard/documents", icon: "folder" },
  { label: "Agencies", href: "/dashboard/agencies", icon: "bank" },
  { label: "Team", href: "/dashboard/team", icon: "users" },
  { label: "Billing", href: "/dashboard/billing", icon: "card" },
  { label: "System", href: "/dashboard/system", icon: "pulse" },
  { label: "Settings", href: "/dashboard/settings", icon: "gear" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

export type DashboardUser = {
  email: string;
  fullName?: string | null;
  role?: string | null;
};

export type DashboardWorkspace = {
  id: string;
  name: string;
  plan: string;
  role: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  actor_label: string | null;
  created_at: string;
};

function initialsFor(user: DashboardUser) {
  const source = (user.fullName || user.email || "").trim();
  if (!source) return "??";
  if (user.fullName) {
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function DashboardShell({
  children,
  user,
  workspace,
  badges,
  automationDefault,
  notifications,
}: {
  children: ReactNode;
  user?: DashboardUser;
  workspace?: DashboardWorkspace;
  badges?: Partial<BadgeCounts>;
  automationDefault?: "alert" | "prep" | "auto";
  notifications?: NotificationItem[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();

  const notifs = useMemo(() => notifications ?? [], [notifications]);

  const displayUser: DashboardUser = user ?? {
    email: "diana@meridiangroup.com",
    fullName: "Diana Reyes",
    role: "Director of Ops",
  };
  const workspaceName = workspace?.name ?? "Your workspace";
  const displayName = displayUser.fullName ?? displayUser.email;
  const displayRole = displayUser.role ?? displayUser.email;
  const initials = initialsFor(displayUser);

  return (
    <DialogProvider>
    <div className="flex min-h-screen bg-bgalt">
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-[240px] shrink-0 border-r border-hairline bg-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-hairline px-5">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
              ClearBot
            </span>
          </Link>
        </div>

        <div className="border-b border-hairline px-3 py-3">
          <Link
            href="/dashboard/settings"
            onClick={() => setSidebarOpen(false)}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-hairline bg-bgalt px-3 py-2 text-left transition-colors hover:bg-white"
          >
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                Workspace
              </div>
              <div className="truncate text-[13px] font-medium text-ink">
                {workspaceName}
              </div>
            </div>
            <Chevron />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-accent-soft text-accent-deep"
                        : "text-body hover:bg-bgalt hover:text-ink"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <NavIcon name={item.icon} />
                      {item.label}
                    </span>
                    {typeof badge === "number" && badge > 0 && (
                      <span className="rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px] text-body ring-1 ring-hairline">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 px-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">
              Automation mode
            </div>
            <div className="mt-2 rounded-md border border-accent/30 bg-accent-soft px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-accent-deep capitalize">
                  {automationDefault ?? "auto"}
                </span>
                <Pill tone="accent" withDot>
                  On
                </Pill>
              </div>
              <p className="mt-1 text-[11px] leading-[1.4] text-body">
                Default for new licenses. Override per-license at any time.
              </p>
            </div>
          </div>
        </nav>

        <div className="border-t border-hairline p-3">
          <div className="flex items-center gap-2.5 rounded-md bg-bgalt px-2.5 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-ink">
                {displayName}
              </div>
              <div className="truncate font-mono text-[10px] text-body">
                {displayRole}
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="rounded p-1 text-body hover:bg-white hover:text-ink"
                aria-label="Sign out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-ink/20 md:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-hairline bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 md:px-8">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-hairline md:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                const q = searchValue.trim();
                if (!q) return;
                router.push(`/dashboard/locations?q=${encodeURIComponent(q)}`);
              }}
              className="relative hidden max-w-[440px] flex-1 md:block"
            >
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search licenses, locations, agencies…"
                className="h-9 w-full rounded-md border border-hairline bg-bgalt pl-9 pr-12 font-sans text-[13px] text-ink outline-none transition-colors placeholder:text-body/70 focus:border-accent focus:bg-white"
              />
              <kbd className="pointer-events-none absolute inset-y-0 right-2 my-auto flex h-5 items-center rounded border border-hairline bg-white px-1.5 font-mono text-[10px] text-body">
                ↵
              </kbd>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <TopBarButton
                label="What's new"
                icon="sparkle"
                onClick={() => setChangelogOpen(true)}
              />
              <NotificationsBell
                items={notifs}
                open={notifOpen}
                setOpen={setNotifOpen}
              />
              <Link
                href="/dashboard/locations?new=1"
                className="hidden items-center gap-2 rounded-full border border-accent bg-accent px-4 py-1.5 font-sans text-[13px] font-medium text-white transition-colors hover:border-accent-deep hover:bg-accent-deep md:inline-flex"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New location
              </Link>
            </div>
          </div>

          <Breadcrumb pathname={pathname} />
        </header>

        <main className="flex-1 space-y-8 px-4 py-6 md:px-8 md:py-8">
          {children}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6 font-mono text-[11px] text-body">
            <div className="flex items-center gap-3">
              <span>© {new Date().getFullYear()} ClearBot, Inc.</span>
              <span className="text-hairline">·</span>
              <Link href="/status" className="hover:text-ink">Status</Link>
              <span className="text-hairline">·</span>
              <Link href="/changelog" className="hover:text-ink">Changelog</Link>
              <span className="text-hairline">·</span>
              <Link href="/docs" className="hover:text-ink">Docs</Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-accent-deep">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                All systems normal
              </span>
            </div>
          </footer>
        </main>
      </div>

      {changelogOpen && <ChangelogModal onClose={() => setChangelogOpen(false)} />}
    </div>
    </DialogProvider>
  );
}

type Tab = { label: string; href: string };

function Breadcrumb({ pathname }: { pathname: string }) {
  const current = NAV.find((n) => isActive(pathname, n.href)) ?? NAV[0];
  const tabs = tabsFor(current.label, current.href);
  if (tabs.length === 0) return null;
  return (
    <div className="flex items-center gap-1 overflow-x-auto overflow-y-hidden px-4 md:px-8">
      {tabs.map((t, i) => (
        <Link
          key={t.label}
          href={t.href}
          className={clsx(
            "relative -mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 font-sans text-[13px] font-medium transition-colors",
            i === 0
              ? "border-ink text-ink"
              : "border-transparent text-body hover:text-ink"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function tabsFor(label: string, base: string): Tab[] {
  switch (label) {
    case "Overview":
      return [
        { label: "Overview", href: base },
        { label: "Renewals", href: "/dashboard/renewals" },
        { label: "Filings", href: "/dashboard/filings" },
        { label: "Documents", href: "/dashboard/documents" },
      ];
    case "Locations":
      return [{ label: "All locations", href: base }];
    case "Renewals":
      return [{ label: "Upcoming", href: base }];
    case "Filings":
      return [{ label: "Queue", href: base }];
    case "Documents":
      return [{ label: "Library", href: base }];
    case "Agencies":
      return [{ label: "Monitor", href: base }];
    case "Team":
      return [{ label: "Members", href: base }];
    case "Integrations":
      return [{ label: "Connected", href: base }];
    case "Billing":
      return [{ label: "Plan", href: base }];
    case "Settings":
      return [{ label: "General", href: base }];
    default:
      return [];
  }
}

function TopBarButton({
  label,
  icon,
  onClick,
  active,
  dot,
}: {
  label: string;
  icon: "bell" | "sparkle";
  onClick: () => void;
  active?: boolean;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={clsx(
        "relative flex h-9 w-9 items-center justify-center rounded-md border bg-white text-body transition-colors hover:text-ink",
        active ? "border-ink text-ink" : "border-hairline"
      )}
    >
      {icon === "bell" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        </svg>
      )}
      {dot && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-bad ring-2 ring-white" />
      )}
    </button>
  );
}

const NOTIF_TYPE_META: Record<string, { label: string; dot: string; ring: string }> = {
  filed: { label: "FILED", dot: "bg-ok", ring: "ring-ok/20" },
  prepared: { label: "PREP", dot: "bg-accent", ring: "ring-accent/20" },
  alert: { label: "ALERT", dot: "bg-bad", ring: "ring-bad/20" },
  agency: { label: "AGENCY", dot: "bg-ink", ring: "ring-ink/20" },
  payment: { label: "PAY", dot: "bg-warn", ring: "ring-warn/20" },
  team: { label: "TEAM", dot: "bg-body", ring: "ring-body/20" },
  integration: { label: "INTEGRATION", dot: "bg-accent-deep", ring: "ring-accent-deep/20" },
  setting: { label: "CONFIG", dot: "bg-body", ring: "ring-body/20" },
  document: { label: "DOC", dot: "bg-warn", ring: "ring-warn/20" },
};

function NotificationsBell({
  items,
  open,
  setOpen,
}: {
  items: NotificationItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const hasItems = items.length > 0;

  return (
    <div ref={ref} className="relative">
      <TopBarButton
        label="Notifications"
        icon="bell"
        onClick={() => setOpen(!open)}
        active={open}
        dot={hasItems}
      />
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-hairline bg-white shadow-card-lg"
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                Activity
              </div>
              <div className="font-display text-[16px] font-light text-ink">
                {hasItems ? `${items.length} recent event${items.length === 1 ? "" : "s"}` : "All quiet."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded p-1 text-body hover:bg-bgalt hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <ul className="max-h-[420px] divide-y divide-hairline overflow-y-auto">
            {!hasItems && (
              <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
                No activity yet. Add a location, license, or integration to fill this feed.
              </li>
            )}
            {items.map((a) => {
              const meta = NOTIF_TYPE_META[a.type] ?? NOTIF_TYPE_META.setting;
              return (
                <li key={a.id} className="flex gap-3 px-4 py-3">
                  <span
                    className={clsx(
                      "mt-1 h-2 w-2 shrink-0 rounded-full ring-4",
                      meta.dot,
                      meta.ring
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[13px] font-medium leading-snug text-ink">
                        {a.title}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-body">
                        {timeAgo(a.created_at)}
                      </span>
                    </div>
                    {a.detail && (
                      <div className="mt-0.5 truncate text-[12px] text-body">{a.detail}</div>
                    )}
                    {a.actor_label && (
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-body">
                        <span className="rounded-sm bg-bgalt px-1.5 py-0.5">{meta.label}</span>
                        <span className="ml-2">{a.actor_label}</span>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-hairline bg-bgalt/60 px-4 py-2.5 text-right">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              See all on overview →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const CHANGELOG_TAG_META: Record<string, string> = {
  feature: "bg-accent-soft text-accent-deep border-accent/30",
  improvement: "bg-ink/5 text-ink border-hairline",
  fix: "bg-warn/10 text-warn border-warn/30",
  agency: "bg-ink text-white border-ink",
  security: "bg-bad/10 text-bad border-bad/30",
};

function ChangelogModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/40 p-4 md:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="What's new"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-[720px] flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">
              {CHANGELOG.length} releases · updated weekly
            </div>
            <div className="mt-0.5 font-display text-[22px] font-light text-ink">
              What&apos;s new
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/changelog"
              onClick={onClose}
              className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
            >
              Open full page
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-2 text-body hover:bg-bgalt hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {CHANGELOG.map((e) => (
            <article
              key={e.id}
              className="rounded-xl border border-hairline bg-white p-5 shadow-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                {e.tags.map((t) => (
                  <span
                    key={t}
                    className={clsx(
                      "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      CHANGELOG_TAG_META[t] ?? "border-hairline bg-white text-body"
                    )}
                  >
                    {t}
                  </span>
                ))}
                <span className="font-mono text-[11px] text-body">
                  {new Date(e.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="mt-3 font-display text-[18px] font-light leading-tight text-ink">
                {e.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-body">{e.summary}</p>
              <ul className="mt-3 space-y-1.5">
                {e.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5 text-[13px] leading-[1.55] text-body">
                    <span className="mt-[9px] inline-block h-[3px] w-[3px] shrink-0 rounded-full bg-body/60" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-body">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "pin":
      return (
        <svg {...props}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "doc":
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "folder":
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "bank":
      return (
        <svg {...props}>
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <polyline points="5 6 12 3 19 6" />
          <line x1="4" y1="10" x2="4" y2="21" />
          <line x1="20" y1="10" x2="20" y2="21" />
          <line x1="8" y1="14" x2="8" y2="18" />
          <line x1="12" y1="14" x2="12" y2="18" />
          <line x1="16" y1="14" x2="16" y2="18" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "card":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "gear":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.31.22.65.22 1H21a2 2 0 0 1 0 4h-.09c-.35 0-.69.08-1 .22z" />
        </svg>
      );
    case "pulse":
      return (
        <svg {...props}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
  }
}

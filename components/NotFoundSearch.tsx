"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type PageEntry = {
  href: string;
  title: string;
  description: string;
  section: string;
  keywords?: string[];
};

const PAGES: PageEntry[] = [
  {
    href: "/",
    title: "Home",
    description: "Business license renewals, automated.",
    section: "Marketing",
    keywords: ["landing", "start", "main"],
  },
  {
    href: "/product",
    title: "Product",
    description: "How ClearBot tracks, prepares, and files every renewal.",
    section: "Marketing",
    keywords: ["features", "overview", "how it works"],
  },
  {
    href: "/pricing",
    title: "Pricing",
    description: "Plans, per-location pricing, and what's included.",
    section: "Marketing",
    keywords: ["plans", "cost", "billing"],
  },
  {
    href: "/map",
    title: "Coverage map",
    description: "Every state and agency ClearBot files with.",
    section: "Marketing",
    keywords: ["states", "jurisdictions", "agencies"],
  },
  {
    href: "/data",
    title: "Data product",
    description: "Renewal calendar data, agency rules, and APIs.",
    section: "Marketing",
    keywords: ["api", "datasets", "research"],
  },
  {
    href: "/docs",
    title: "Documentation",
    description: "Guides for operators, admins, and developers.",
    section: "Resources",
    keywords: ["help", "guide", "manual", "developer"],
  },
  {
    href: "/changelog",
    title: "Changelog",
    description: "Every release, every improvement, every fix.",
    section: "Resources",
    keywords: ["releases", "updates", "what's new"],
  },
  {
    href: "/status",
    title: "Status",
    description: "Live operational status for every ClearBot system.",
    section: "Resources",
    keywords: ["uptime", "incident", "health"],
  },
  {
    href: "/book",
    title: "Book a call",
    description: "Schedule a 30-minute walkthrough with the team.",
    section: "Company",
    keywords: ["demo", "meeting", "sales", "contact"],
  },
  {
    href: "/login",
    title: "Log in",
    description: "Sign in to your ClearBot workspace.",
    section: "Account",
    keywords: ["sign in", "auth"],
  },
  {
    href: "/signup",
    title: "Get started",
    description: "Create a ClearBot workspace.",
    section: "Account",
    keywords: ["sign up", "register", "create account"],
  },
  {
    href: "/onboarding",
    title: "Onboarding",
    description: "Guided setup for a new ClearBot workspace.",
    section: "Account",
    keywords: ["setup", "welcome"],
  },
  {
    href: "/dashboard",
    title: "Dashboard",
    description: "Workspace overview and renewal pipeline.",
    section: "App",
    keywords: ["home", "overview"],
  },
  {
    href: "/dashboard/renewals",
    title: "Renewals",
    description: "Upcoming and in-flight license renewals.",
    section: "App",
    keywords: ["pipeline", "due"],
  },
  {
    href: "/dashboard/filings",
    title: "Filings",
    description: "Submitted filings and confirmations.",
    section: "App",
    keywords: ["history", "submissions"],
  },
  {
    href: "/dashboard/locations",
    title: "Locations",
    description: "Every location in your workspace.",
    section: "App",
    keywords: ["sites", "stores"],
  },
  {
    href: "/dashboard/agencies",
    title: "Agencies",
    description: "Agency contacts and status by jurisdiction.",
    section: "App",
    keywords: ["jurisdictions", "departments"],
  },
  {
    href: "/dashboard/documents",
    title: "Documents",
    description: "Permits, certificates, and filing artifacts.",
    section: "App",
    keywords: ["files", "uploads"],
  },
  {
    href: "/dashboard/team",
    title: "Team",
    description: "Workspace members and roles.",
    section: "App",
    keywords: ["users", "permissions", "members"],
  },
  {
    href: "/dashboard/settings/deliveries",
    title: "Webhook deliveries",
    description: "Per-delivery audit trail. Replay or drop pending deliveries.",
    section: "App",
    keywords: ["api", "webhooks", "deliveries", "replay"],
  },
  {
    href: "/dashboard/billing",
    title: "Billing",
    description: "Subscription, invoices, and payment methods.",
    section: "App",
    keywords: ["invoices", "payment", "subscription"],
  },
  {
    href: "/dashboard/settings",
    title: "Settings",
    description: "Workspace preferences and notifications.",
    section: "App",
    keywords: ["preferences", "config"],
  },
];

function score(entry: PageEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const haystack = [
    entry.title,
    entry.description,
    entry.href,
    entry.section,
    ...(entry.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (entry.title.toLowerCase() === q) return 100;
  if (entry.title.toLowerCase().startsWith(q)) return 80;
  if (entry.href.toLowerCase().includes(q)) return 60;
  if (entry.title.toLowerCase().includes(q)) return 50;
  if (haystack.includes(q)) return 30;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => haystack.includes(t))) return 20;

  return 0;
}

export function NotFoundSearch() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      return PAGES.filter((p) =>
        ["Home", "Product", "Pricing", "Documentation", "Dashboard", "Status"].includes(
          p.title
        )
      );
    }
    return PAGES.map((p) => ({ p, s: score(p, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.p);
  }, [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[active];
      if (target) window.location.href = target.href;
    }
  };

  return (
    <div className="w-full">
      <label htmlFor="not-found-search" className="sr-only">
        Search pages
      </label>
      <div className="relative">
        <input
          id="not-found-search"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search pages — try 'pricing', 'docs', 'renewals'…"
          className="h-12 w-full rounded-full border border-hairline bg-white px-5 pr-12 font-sans text-[15px] text-ink placeholder:text-body focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          autoComplete="off"
          spellCheck={false}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-wider text-body"
        >
          {query ? `${results.length}` : "↵"}
        </span>
      </div>

      <div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-body">
        {query.trim()
          ? results.length === 0
            ? "No pages match that search"
            : `${results.length} match${results.length === 1 ? "" : "es"}`
          : "Suggested pages"}
      </div>

      <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-white">
        {results.length === 0 ? (
          <li className="flex flex-col gap-2 p-5">
            <span className="text-[14px] text-body">
              Nothing matched “{query}”.
            </span>
            <Link
              href="/"
              className="font-mono text-[12px] uppercase tracking-wider text-accent-deep hover:underline"
            >
              Back to home →
            </Link>
          </li>
        ) : (
          results.map((p, i) => (
            <li key={p.href}>
              <Link
                href={p.href}
                onMouseEnter={() => setActive(i)}
                className={`flex items-start justify-between gap-6 px-5 py-4 transition-colors ${
                  i === active ? "bg-bgalt" : "bg-white"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-medium text-ink">
                      {p.title}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-body">
                      {p.section}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[13px] text-body">
                    {p.description}
                  </p>
                </div>
                <span className="shrink-0 self-center font-mono text-[12px] text-body">
                  {p.href}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

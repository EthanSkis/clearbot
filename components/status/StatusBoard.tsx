"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import clsx from "clsx";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

type Health = "operational" | "degraded" | "outage" | "maintenance";

type Component = {
  id: string;
  name: string;
  description: string;
  health: Health;
  uptime90: number;
  latencyMs?: number;
};

type Incident = {
  id: string;
  title: string;
  impact: "minor" | "major" | "maintenance";
  startedAt: string;
  resolvedAt: string | null;
  affects: string[];
  updates: { at: string; status: string; body: string }[];
};

const COMPONENTS: Component[] = [
  {
    id: "api",
    name: "Public API",
    description: "REST + GraphQL endpoints used by customers and integrations.",
    health: "operational",
    uptime90: 99.987,
    latencyMs: 142,
  },
  {
    id: "dashboard",
    name: "Operator dashboard",
    description: "The web app at app.clearbot.io.",
    health: "operational",
    uptime90: 99.994,
    latencyMs: 88,
  },
  {
    id: "filing",
    name: "Filing pipeline",
    description: "Form preparation, fee calculation, and submission to agencies.",
    health: "operational",
    uptime90: 99.902,
    latencyMs: 312,
  },
  {
    id: "monitors",
    name: "Agency monitors",
    description: "528 federal, state, and municipal portal pollers (every 90s).",
    health: "degraded",
    uptime90: 99.612,
    latencyMs: 1850,
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Email, SMS, Slack, and Teams delivery.",
    health: "operational",
    uptime90: 99.971,
    latencyMs: 410,
  },
  {
    id: "auth",
    name: "Authentication & SSO",
    description: "Session management, SAML, SCIM, and OAuth.",
    health: "operational",
    uptime90: 99.999,
    latencyMs: 61,
  },
];

const INCIDENTS: Incident[] = [
  {
    id: "inc-2026-04-19",
    title: "Delayed agency polling for 3 TX county portals",
    impact: "minor",
    startedAt: "2026-04-19T14:22:00Z",
    resolvedAt: "2026-04-19T16:48:00Z",
    affects: ["monitors"],
    updates: [
      {
        at: "2026-04-19T14:22:00Z",
        status: "Investigating",
        body: "Our monitors for Harris, Travis, and Dallas County portals are returning stale data. No filings affected.",
      },
      {
        at: "2026-04-19T15:10:00Z",
        status: "Identified",
        body: "Three county portals changed TLS cipher suites simultaneously. Rolling out updated client config.",
      },
      {
        at: "2026-04-19T16:48:00Z",
        status: "Resolved",
        body: "All three portals are polling normally again. Backfill of missed polls complete.",
      },
    ],
  },
  {
    id: "inc-2026-04-06",
    title: "Scheduled maintenance — filing pipeline upgrade",
    impact: "maintenance",
    startedAt: "2026-04-06T06:00:00Z",
    resolvedAt: "2026-04-06T06:38:00Z",
    affects: ["filing"],
    updates: [
      {
        at: "2026-04-06T06:00:00Z",
        status: "In progress",
        body: "Rolling out pipeline v2.14 with improved retry semantics for agency uploads.",
      },
      {
        at: "2026-04-06T06:38:00Z",
        status: "Complete",
        body: "Deployment finished. No queued filings were dropped.",
      },
    ],
  },
  {
    id: "inc-2026-03-22",
    title: "SMS delivery delays — Twilio US carrier",
    impact: "minor",
    startedAt: "2026-03-22T18:04:00Z",
    resolvedAt: "2026-03-22T19:30:00Z",
    affects: ["notifications"],
    updates: [
      {
        at: "2026-03-22T18:04:00Z",
        status: "Investigating",
        body: "SMS alerts are queued with a 2–4 minute delay through a major US carrier. Email unaffected.",
      },
      {
        at: "2026-03-22T19:30:00Z",
        status: "Resolved",
        body: "Carrier resolved their upstream issue. All queued messages delivered.",
      },
    ],
  },
  {
    id: "inc-2026-02-11",
    title: "Elevated dashboard latency (p95 > 800ms)",
    impact: "minor",
    startedAt: "2026-02-11T21:14:00Z",
    resolvedAt: "2026-02-11T22:02:00Z",
    affects: ["dashboard", "api"],
    updates: [
      {
        at: "2026-02-11T21:14:00Z",
        status: "Investigating",
        body: "Dashboard load times are elevated. Functionality is unaffected.",
      },
      {
        at: "2026-02-11T21:36:00Z",
        status: "Identified",
        body: "Hot partition on renewals read replica. Failing over.",
      },
      {
        at: "2026-02-11T22:02:00Z",
        status: "Resolved",
        body: "Failover complete. Latency returned to baseline (p95 ~110ms).",
      },
    ],
  },
];

const DAYS = 90;

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function historyFor(componentId: string): Health[] {
  const seed = componentId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const out: Health[] = [];
  for (let i = 0; i < DAYS; i++) {
    const r = seededRandom(seed + i);
    if (componentId === "monitors" && i < 3) {
      out.push("degraded");
      continue;
    }
    if (componentId === "filing" && i === 16) {
      out.push("maintenance");
      continue;
    }
    if (componentId === "notifications" && i === 31) {
      out.push("degraded");
      continue;
    }
    if (componentId === "dashboard" && i === 70) {
      out.push("degraded");
      continue;
    }
    if (r < 0.005) out.push("outage");
    else if (r < 0.015) out.push("degraded");
    else out.push("operational");
  }
  return out.reverse();
}

const HEALTH_META: Record<
  Health,
  { label: string; bar: string; pill: string; dot: string }
> = {
  operational: {
    label: "Operational",
    bar: "bg-ok",
    pill: "bg-accent-soft text-accent-deep",
    dot: "bg-ok",
  },
  degraded: {
    label: "Degraded",
    bar: "bg-warn",
    pill: "bg-warn/10 text-warn",
    dot: "bg-warn",
  },
  outage: {
    label: "Outage",
    bar: "bg-bad",
    pill: "bg-bad/10 text-bad",
    dot: "bg-bad",
  },
  maintenance: {
    label: "Maintenance",
    bar: "bg-ink/40",
    pill: "bg-ink/10 text-ink",
    dot: "bg-ink",
  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationMin(startIso: string, endIso: string | null) {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  return Math.max(1, Math.round((end - start) / 60000));
}

function useNow(intervalMs: number, ref: RefObject<Element>) {
  const [now, setNow] = useState(() => Date.now());
  useVisibleInterval(() => setNow(Date.now()), intervalMs, ref);
  return now;
}

export function StatusBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const now = useNow(30000, containerRef);
  const [filter, setFilter] = useState<"all" | "90d" | "30d">("90d");
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const overall: Health = useMemo(() => {
    if (COMPONENTS.some((c) => c.health === "outage")) return "outage";
    if (COMPONENTS.some((c) => c.health === "degraded")) return "degraded";
    if (COMPONENTS.some((c) => c.health === "maintenance")) return "maintenance";
    return "operational";
  }, []);

  const activeIncidents = INCIDENTS.filter((i) => !i.resolvedAt);
  const pastIncidents = INCIDENTS.filter((i) => i.resolvedAt);

  const lastUpdate = new Date(now).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const barDays = filter === "30d" ? 30 : 90;

  return (
    <div ref={containerRef} className="space-y-10">
      <header className="space-y-5">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-body">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Live · last checked {lastUpdate}
        </div>
        <h1 className="font-display text-[clamp(32px,4vw,48px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          System status
        </h1>
        <OverallBanner status={overall} activeCount={activeIncidents.length} />
      </header>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
          <h2 className="font-display text-[22px] font-light text-ink">
            Components
          </h2>
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider">
            {(["30d", "90d"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={clsx(
                  "rounded-md border px-2.5 py-1.5 transition-colors",
                  filter === f
                    ? "border-ink bg-ink text-white"
                    : "border-hairline bg-white text-body hover:text-ink"
                )}
              >
                Last {f === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {COMPONENTS.map((c) => (
            <ComponentRow key={c.id} component={c} days={barDays} />
          ))}
        </ul>
      </section>

      {activeIncidents.length > 0 && (
        <section>
          <h2 className="border-b border-hairline pb-3 font-display text-[22px] font-light text-ink">
            Active incidents
          </h2>
          <ul className="mt-4 space-y-4">
            {activeIncidents.map((i) => (
              <IncidentCard key={i.id} incident={i} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="border-b border-hairline pb-3 font-display text-[22px] font-light text-ink">
          Incident history
        </h2>
        <ul className="mt-4 space-y-4">
          {pastIncidents.map((i) => (
            <IncidentCard key={i.id} incident={i} />
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-hairline bg-bgalt/60 p-6 sm:p-8">
        <h2 className="font-display text-[20px] font-light text-ink">
          Get notified when status changes
        </h2>
        <p className="mt-2 max-w-[520px] text-[14px] text-body">
          We&apos;ll email you when an incident is opened, updated, or resolved. One
          message per event — no digests, no marketing.
        </p>
        <form
          className="mt-4 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
            setSubscribed(true);
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={subscribed}
            className="min-w-[260px] flex-1 rounded-md border border-hairline bg-white px-3 py-2 text-[14px] text-ink placeholder:text-body focus:border-ink focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={subscribed}
            className="rounded-md bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-white transition-colors hover:bg-ink/90 disabled:opacity-60"
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
          <a
            href="/status.rss"
            className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            RSS
          </a>
        </form>
        {subscribed && (
          <p className="mt-3 font-mono text-[11px] text-accent-deep">
            ✓ Confirmation sent to {email}. Click the link to finish subscribing.
          </p>
        )}
      </section>
    </div>
  );
}

function OverallBanner({
  status,
  activeCount,
}: {
  status: Health;
  activeCount: number;
}) {
  const title =
    status === "operational"
      ? "All systems operational"
      : status === "degraded"
        ? "Some systems are degraded"
        : status === "outage"
          ? "A system is currently down"
          : "Scheduled maintenance in progress";
  const tone =
    status === "operational"
      ? "border-accent/30 bg-accent-soft"
      : status === "degraded"
        ? "border-warn/30 bg-warn/5"
        : status === "outage"
          ? "border-bad/30 bg-bad/5"
          : "border-hairline bg-bgalt";
  return (
    <div className={clsx("rounded-2xl border p-5 sm:p-6", tone)}>
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            "h-3 w-3 rounded-full",
            HEALTH_META[status].dot
          )}
        />
        <span className="font-display text-[22px] font-light text-ink">
          {title}
        </span>
      </div>
      <p className="mt-2 max-w-[640px] text-[14px] text-body">
        {status === "operational"
          ? "All ClearBot services are running normally. Agency monitors are polling within SLA."
          : status === "degraded"
            ? `We're investigating ${activeCount === 1 ? "an issue" : `${activeCount} issues`} affecting one or more services. Filings queued for today are still being submitted.`
            : status === "outage"
              ? "We are in a full incident response. Follow the active incident card for updates every 15 minutes until resolved."
              : "Planned work is underway. See the active incident card for expected completion."}
      </p>
    </div>
  );
}

function ComponentRow({
  component,
  days,
}: {
  component: Component;
  days: number;
}) {
  const history = useMemo(() => historyFor(component.id), [component.id]);
  const slice = history.slice(-days);
  const uptime =
    (slice.filter((h) => h === "operational" || h === "maintenance").length /
      slice.length) *
    100;
  const meta = HEALTH_META[component.health];
  return (
    <li className="rounded-xl border border-hairline bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx("h-2 w-2 rounded-full", meta.dot)} />
            <span className="text-[15px] font-medium text-ink">
              {component.name}
            </span>
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                meta.pill
              )}
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-1 max-w-[540px] text-[13px] text-body">
            {component.description}
          </p>
        </div>
        <div className="text-right font-mono text-[11px] uppercase tracking-wider text-body">
          <div>{uptime.toFixed(3)}% uptime</div>
          {component.latencyMs != null && (
            <div className="mt-1 text-[10px] text-body/80">
              p50 · {component.latencyMs}ms
            </div>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex h-8 items-stretch gap-[2px]">
          {slice.map((h, i) => (
            <div
              key={i}
              className={clsx(
                "flex-1 rounded-[2px] transition-opacity hover:opacity-70",
                HEALTH_META[h].bar
              )}
              title={`${days - i} days ago · ${HEALTH_META[h].label}`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-body">
          <span>{days} days ago</span>
          <span>today</span>
        </div>
      </div>
    </li>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  const mins = durationMin(incident.startedAt, incident.resolvedAt);
  const dur =
    mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h ${mins % 60}m`;
  const impactTone =
    incident.impact === "major"
      ? "bg-bad/10 text-bad"
      : incident.impact === "minor"
        ? "bg-warn/10 text-warn"
        : "bg-ink/10 text-ink";
  return (
    <li className="rounded-xl border border-hairline bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={clsx(
                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                impactTone
              )}
            >
              {incident.impact}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-body">
              {incident.affects
                .map((id) => COMPONENTS.find((c) => c.id === id)?.name ?? id)
                .join(" · ")}
            </span>
          </div>
          <h3 className="mt-2 text-[16px] font-medium text-ink">
            {incident.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-body">
            {fmtDate(incident.startedAt)}
            {incident.resolvedAt
              ? ` · resolved ${fmtDate(incident.resolvedAt)} · ${dur}`
              : " · ongoing"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          {open ? "Hide updates" : `${incident.updates.length} updates`}
        </button>
      </div>
      {open && (
        <ol className="mt-4 space-y-3 border-t border-hairline pt-4">
          {incident.updates.map((u, i) => (
            <li key={i} className="grid grid-cols-[90px_1fr] gap-4">
              <div className="font-mono text-[11px] text-body">
                {fmtDate(u.at)}
              </div>
              <div>
                <div className="text-[13px] font-medium text-ink">
                  {u.status}
                </div>
                <p className="mt-0.5 text-[13px] text-body">{u.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { replayDelivery, dropDelivery } from "./actions";

export type DeliveryRow = {
  id: string;
  webhook_id: string;
  webhook_url: string;
  webhook_description: string | null;
  event: string;
  status: "pending" | "delivered" | "failed" | "dropped";
  attempts: number;
  max_attempts: number;
  next_retry_at: string;
  last_response_status: number | null;
  last_error: string | null;
  delivered_at: string | null;
  created_at: string;
};

const STATUS_TONE: Record<DeliveryRow["status"], string> = {
  pending: "text-warn bg-warn/10",
  delivered: "text-ok bg-ok/10",
  failed: "text-bad bg-bad/10",
  dropped: "text-body bg-bgalt",
};

const FILTERS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Delivered", value: "delivered" },
  { label: "Failed", value: "failed" },
  { label: "Dropped", value: "dropped" },
];

export function DeliveriesClient({
  rows,
  error,
  statusFilter,
}: {
  rows: DeliveryRow[];
  error: string | null;
  statusFilter: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<string | null>(null);

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("status", value);
    else params.delete("status");
    router.push(`/dashboard/integrations/deliveries${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = (statusFilter ?? "") === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={clsx(
                "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider",
                active
                  ? "border-accent bg-accent text-white"
                  : "border-hairline bg-white text-body hover:text-ink"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center font-mono text-[12px] text-body">
            No deliveries match this filter.
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {rows.map((d) => {
              const open = expanded === d.id;
              return (
                <li key={d.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                            STATUS_TONE[d.status]
                          )}
                        >
                          {d.status}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-ink">
                          {d.event}
                        </span>
                        <span className="truncate text-[12px] text-body">{d.webhook_url}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-body">
                        <span>
                          {d.attempts}/{d.max_attempts} attempts
                        </span>
                        {d.last_response_status != null && (
                          <span>HTTP {d.last_response_status}</span>
                        )}
                        <span>
                          {d.delivered_at
                            ? `Delivered ${new Date(d.delivered_at).toLocaleString()}`
                            : `Next retry ${new Date(d.next_retry_at).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setExpanded(open ? null : d.id)}
                        className="rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                      >
                        {open ? "Hide" : "Details"}
                      </button>
                      {(d.status === "pending" || d.status === "failed") && (
                        <ReplayButton id={d.id} />
                      )}
                      {d.status === "pending" && <DropButton id={d.id} />}
                    </div>
                  </div>
                  {open && (
                    <div className="mt-3 grid gap-2 rounded-md border border-hairline bg-bgalt px-3 py-3 text-[12px]">
                      <Row k="Delivery ID" v={<code className="font-mono text-[11px]">{d.id}</code>} />
                      <Row k="Webhook ID" v={<code className="font-mono text-[11px]">{d.webhook_id}</code>} />
                      <Row k="Created" v={new Date(d.created_at).toLocaleString()} />
                      {d.webhook_description && (
                        <Row k="Description" v={d.webhook_description} />
                      )}
                      {d.last_error && (
                        <Row k="Last error" v={<span className="text-bad">{d.last_error}</span>} />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="w-28 shrink-0 font-mono text-[10px] uppercase tracking-wider text-body">
        {k}
      </span>
      <span className="text-body">{v}</span>
    </div>
  );
}

function ReplayButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const r = await replayDelivery(id);
          if (r.ok) router.refresh();
          else alert(r.error);
        })
      }
      className={clsx(
        "rounded-md border border-accent bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-accent-deep hover:bg-accent-soft",
        pending && "opacity-70"
      )}
    >
      {pending ? "Replaying…" : "Replay"}
    </button>
  );
}

function DropButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("Drop this delivery? It will not be retried again.")) return;
        startTransition(async () => {
          const r = await dropDelivery(id);
          if (r.ok) router.refresh();
          else alert(r.error);
        });
      }}
      className={clsx(
        "rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-body hover:text-bad",
        pending && "opacity-70"
      )}
    >
      {pending ? "Dropping…" : "Drop"}
    </button>
  );
}

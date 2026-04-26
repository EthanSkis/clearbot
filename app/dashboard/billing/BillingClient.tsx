"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useDialog } from "@/components/ui/Dialog";
import { addPaymentMethod, changePlan, deletePaymentMethod, generateMonthlyInvoice, markInvoicePaid } from "./actions";

export type Invoice = {
  id: string;
  short_id: string;
  period_label: string;
  period_start: string;
  period_end: string;
  amount_cents: number;
  status: "pending" | "paid" | "failed";
  method: string | null;
  issued_at: string;
  paid_at: string | null;
};

export type PaymentMethod = {
  id: string;
  kind: "wire" | "ach" | "card";
  label: string;
  last4: string | null;
  is_primary: boolean;
};

const PLAN_TIER: Record<string, string> = {
  essential: "Essential",
  standard: "Standard",
  professional: "Professional",
};

type StripeStatus = "unconfigured" | "test" | "live";

export function StripeStatusBanner({ status }: { status: StripeStatus }) {
  if (status === "live") return null;
  const isTest = status === "test";
  return (
    <div
      className={clsx(
        "flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-[13px]",
        isTest
          ? "border-warn/30 bg-warn/5 text-ink"
          : "border-accent/30 bg-accent-soft/40 text-ink"
      )}
    >
      <span
        className={clsx(
          "mt-0.5 inline-flex h-5 items-center rounded-full px-2 font-mono text-[10px] uppercase tracking-wider",
          isTest ? "bg-warn text-white" : "bg-accent text-white"
        )}
      >
        {isTest ? "Stripe · test mode" : "Self-serve billing pending"}
      </span>
      <div className="min-w-0 flex-1">
        {isTest ? (
          <>
            Stripe is in test mode. Real charges will not be made until live keys are
            installed.
          </>
        ) : (
          <>
            Stripe isn&apos;t wired up yet. Plan changes are applied immediately and
            reconciled with your invoice manually — contact{" "}
            <a
              href="mailto:ethan@clearbot.io"
              className="underline decoration-hairline underline-offset-2 hover:text-accent-deep"
            >
              ethan@clearbot.io
            </a>{" "}
            for upgrades or downgrades.
          </>
        )}
      </div>
    </div>
  );
}

export function PlanSwitcher({
  currentPlan,
  canManage,
  stripeStatus,
}: {
  currentPlan: string;
  canManage: boolean;
  stripeStatus: StripeStatus;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const stripeReady = stripeStatus !== "unconfigured";
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canManage}
        className={clsx(
          "rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white",
          canManage ? "hover:bg-accent-deep" : "cursor-not-allowed opacity-60"
        )}
      >
        Change plan
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
            <div className="font-display text-[20px] font-light text-ink">Change plan</div>
            <p className="mt-1 text-[13px] text-body">
              {stripeReady
                ? "Pick a tier. You'll be redirected to Stripe checkout."
                : "Pick a tier. Plan switches immediately — your next invoice reflects the new per-location rate."}
            </p>
            {!stripeReady && (
              <div className="mt-3 rounded-md border border-accent/30 bg-accent-soft/40 px-3 py-2 font-mono text-[11px] text-ink">
                Self-serve checkout pending Stripe setup.
              </div>
            )}
            <div className="mt-4 grid gap-2">
              {(["essential", "standard", "professional"] as const).map((p) => (
                <button
                  key={p}
                  onClick={async () => {
                    if (stripeReady) {
                      const res = await fetch("/api/stripe/checkout", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ plan: p }),
                      });
                      const data = (await res.json()) as
                        | { ok: true; url: string }
                        | { ok: false; message?: string; error?: string };
                      if (!res.ok || !data.ok) {
                        await dialog.alert({
                          title: "Could not start checkout",
                          body:
                            ("message" in data && data.message) ||
                            ("error" in data && data.error) ||
                            "Try again in a moment.",
                          tone: "danger",
                        });
                        return;
                      }
                      window.location.href = data.url;
                      return;
                    }
                    const r = await changePlan(p);
                    if (!r.ok) {
                      await dialog.alert({ title: "Could not change plan", body: r.error, tone: "danger" });
                      return;
                    }
                    setOpen(false);
                    dialog.toast({ body: `Plan switched to ${PLAN_TIER[p]}.`, tone: "success" });
                    startTransition(() => router.refresh());
                  }}
                  className={clsx(
                    "rounded-md border p-3 text-left",
                    currentPlan === p
                      ? "border-accent bg-accent-soft text-accent-deep"
                      : "border-hairline bg-white text-ink hover:bg-bgalt"
                  )}
                >
                  <div className="font-display text-[18px] font-light">{PLAN_TIER[p]}</div>
                  <div className="font-mono text-[11px] text-body">
                    {p === "essential" && "$500/loc/yr · alerts only"}
                    {p === "standard" && "$800/loc/yr · pre-filled packets"}
                    {p === "professional" && "$1,200/loc/yr · auto-file + dedicated CSM"}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function PaymentMethods({ rows, canManage }: { rows: PaymentMethod[]; canManage: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<"wire" | "ach" | "card">("ach");
  const [label, setLabel] = useState("");
  const [last4, setLast4] = useState("");
  const [primary, setPrimary] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">Payment methods</div>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && (
          <div className="rounded-md border border-dashed border-hairline bg-bgalt/40 px-4 py-4 font-mono text-[12px] text-body">
            No methods on file. Add one to autopay invoices.
          </div>
        )}
        {rows.map((m) => (
          <div key={m.id} className="rounded-md border border-hairline bg-bgalt px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-ink">
                {m.label} {m.last4 && <span className="font-mono text-[12px] text-body">··{m.last4}</span>}
              </span>
              <div className="flex items-center gap-2">
                {m.is_primary && (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
                    Primary
                  </span>
                )}
                {canManage && (
                  <button
                    onClick={async () => {
                      const ok = await dialog.confirm({
                        title: "Remove this payment method?",
                        body: `${m.label}${m.last4 ? ` ··${m.last4}` : ""} will no longer be used for autopay.`,
                        confirmLabel: "Remove",
                        tone: "danger",
                      });
                      if (!ok) return;
                      const r = await deletePaymentMethod(m.id);
                      if (!r.ok) {
                        await dialog.alert({ title: "Could not remove method", body: r.error, tone: "danger" });
                      } else {
                        dialog.toast({ body: "Payment method removed.", tone: "success" });
                        refresh();
                      }
                    }}
                    className="rounded-md border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1 font-mono text-[11px] text-body capitalize">{m.kind} · auto-pay on invoice</div>
          </div>
        ))}
      </div>

      {canManage && (
        <div className="mt-3">
          {adding ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await addPaymentMethod({ kind, label, last4: last4 || undefined, primary });
                if (!r.ok) {
                  await dialog.alert({ title: "Could not add payment method", body: r.error, tone: "danger" });
                  return;
                }
                setLabel("");
                setLast4("");
                setPrimary(false);
                setAdding(false);
                dialog.toast({ body: "Payment method added.", tone: "success" });
                refresh();
              }}
              className="space-y-2 rounded-md border border-hairline bg-bgalt/40 p-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as "wire" | "ach" | "card")}
                  className="h-9 w-full rounded-md border border-hairline bg-white px-2 font-mono text-[11px] uppercase tracking-wider"
                >
                  <option value="ach">ACH</option>
                  <option value="wire">Wire</option>
                  <option value="card">Card</option>
                </select>
                <input
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Chase Business"
                  className="h-9 rounded-md border border-hairline bg-white px-3 font-sans text-[12px]"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                <input
                  value={last4}
                  onChange={(e) => setLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                  placeholder="Last 4"
                  className="h-9 rounded-md border border-hairline bg-white px-3 font-sans text-[12px]"
                />
                <label className="flex items-center gap-2 font-mono text-[11px] text-body">
                  <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
                  Set primary
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep"
                >
                  Add method
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full rounded-md border border-hairline bg-white py-2 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-bgalt"
            >
              + Add payment method
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function InvoicesTable({ rows, canManage }: { rows: Invoice[]; canManage: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  function refresh() {
    startTransition(() => router.refresh());
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-bgalt/60 px-5 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-body">
          {rows.length} invoice{rows.length === 1 ? "" : "s"}
        </span>
        {canManage && (
          <button
            onClick={async () => {
              const r = await generateMonthlyInvoice();
              if (!r.ok) {
                await dialog.alert({ title: "Could not generate invoice", body: r.error, tone: "danger" });
              } else {
                dialog.toast({ body: "Invoice generated.", tone: "success" });
                refresh();
              }
            }}
            className="rounded-md border border-hairline bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
          >
            + Generate this month
          </button>
        )}
      </div>
      <div className="hidden grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.6fr_1fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
        <div>Invoice</div>
        <div>Issued</div>
        <div>Period</div>
        <div className="text-right">Amount</div>
        <div>Status</div>
        <div>Method</div>
        <div className="text-right">Actions</div>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.length === 0 && (
          <li className="px-5 py-10 text-center font-mono text-[12px] text-body">
            No invoices yet. Generate one to see it here.
          </li>
        )}
        {rows.map((inv) => (
          <li
            key={inv.id}
            className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.8fr_1fr_0.9fr_0.8fr_0.6fr_1fr_0.6fr]"
          >
            <div className="font-mono text-[12px] text-ink">{inv.short_id}</div>
            <div className="hidden font-mono text-[12px] text-body md:block">
              {new Date(inv.issued_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </div>
            <div className="hidden font-mono text-[12px] text-body md:block">{inv.period_label}</div>
            <div className="hidden text-right font-mono text-[13px] tabular-nums text-ink md:block">
              ${(inv.amount_cents / 100).toLocaleString()}
            </div>
            <div className="hidden md:block">
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  inv.status === "paid"
                    ? "bg-ok/10 text-ok"
                    : inv.status === "failed"
                      ? "bg-bad/10 text-bad"
                      : "bg-warn/10 text-warn"
                )}
              >
                <span
                  className={clsx(
                    "h-1.5 w-1.5 rounded-full",
                    inv.status === "paid" ? "bg-ok" : inv.status === "failed" ? "bg-bad" : "bg-warn"
                  )}
                />
                {inv.status}
              </span>
            </div>
            <div className="hidden truncate font-mono text-[11px] text-body md:block">{inv.method ?? "—"}</div>
            <div className="flex items-center justify-end gap-2">
              {canManage && inv.status !== "paid" && (
                <button
                  onClick={async () => {
                    const r = await markInvoicePaid(inv.id);
                    if (!r.ok) {
                      await dialog.alert({ title: "Could not mark paid", body: r.error, tone: "danger" });
                    } else {
                      dialog.toast({ body: `${inv.short_id} marked paid.`, tone: "success" });
                      refresh();
                    }
                  }}
                  className="rounded-md border border-accent bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-accent-deep"
                >
                  Mark paid
                </button>
              )}
              <button
                onClick={() => downloadInvoiceCsv(inv)}
                className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
              >
                CSV
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function downloadInvoiceCsv(inv: Invoice) {
  const csv = [
    ["short_id", "issued", "period", "amount_cents", "status", "method"],
    [inv.short_id, inv.issued_at, inv.period_label, String(inv.amount_cents), inv.status, inv.method ?? ""],
  ]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${inv.short_id}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

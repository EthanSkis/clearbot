"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useDialog } from "@/components/ui/Dialog";
import {
  connectIntegration,
  createWebhook,
  deleteWebhook,
  disconnectIntegration,
  fireTestWebhook,
  generateApiKey,
  revokeApiKey,
  rotateApiKey,
  syncIntegration,
} from "./actions";

export type IntegrationStatus = "connected" | "syncing" | "disconnected" | "error";

export type IntegrationCardData = {
  id: string | null;
  provider: string;
  category: string;
  status: IntegrationStatus | "available";
  detail: string;
  last_synced_at?: string | null;
};

export type WebhookRow = {
  id: string;
  url: string;
  event: string;
  last_fired_at: string | null;
  last_status: string | null;
};

export type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  scope: "read" | "read_write";
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

const STATUS_META: Record<IntegrationCardData["status"], { label: string; dot: string; text: string }> = {
  connected: { label: "Connected", dot: "bg-ok", text: "text-ok" },
  syncing: { label: "Syncing", dot: "bg-warn", text: "text-warn" },
  disconnected: { label: "Disconnected", dot: "bg-body", text: "text-body" },
  available: { label: "Available", dot: "bg-body", text: "text-body" },
  error: { label: "Error", dot: "bg-bad", text: "text-bad" },
};

export function IntegrationsGrid({
  connected,
  available,
}: {
  connected: IntegrationCardData[];
  available: IntegrationCardData[];
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onToggle(card: IntegrationCardData) {
    if (card.id && card.status !== "disconnected") {
      const ok = await dialog.confirm({
        title: `Disconnect ${card.provider}?`,
        body: "Sync will pause until you reconnect. Existing data stays put.",
        confirmLabel: "Disconnect",
        tone: "danger",
      });
      if (!ok) return;
      const r = await disconnectIntegration(card.id);
      if (!r.ok) {
        await dialog.alert({ title: "Could not disconnect", body: r.error, tone: "danger" });
      } else {
        dialog.toast({ body: `${card.provider} disconnected.`, tone: "default" });
        refresh();
      }
      return;
    }
    const r = await connectIntegration({ provider: card.provider, category: card.category });
    if (!r.ok) {
      await dialog.alert({ title: "Could not connect", body: r.error, tone: "danger" });
    } else {
      dialog.toast({ body: `${card.provider} connected.`, tone: "success" });
      refresh();
    }
  }

  async function onSync(card: IntegrationCardData) {
    if (!card.id) return;
    const r = await syncIntegration(card.id);
    if (!r.ok) {
      await dialog.alert({ title: "Sync failed", body: r.error, tone: "danger" });
    } else {
      dialog.toast({ body: `${card.provider} synced.`, tone: "success" });
      refresh();
    }
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {connected.map((c) => (
          <Card key={c.provider} card={c} onToggle={onToggle} onSync={onSync} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {available.map((c) => (
          <Card key={c.provider} card={c} onToggle={onToggle} onSync={onSync} />
        ))}
      </div>
    </>
  );
}

function Card({
  card,
  onToggle,
  onSync,
}: {
  card: IntegrationCardData;
  onToggle: (c: IntegrationCardData) => void;
  onSync: (c: IntegrationCardData) => void;
}) {
  const meta = STATUS_META[card.status];
  const isConnected = card.status === "connected" || card.status === "syncing";
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bgalt font-mono text-[12px] font-semibold text-ink ring-1 ring-hairline">
            {card.provider.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-ink">{card.provider}</div>
            <div className="truncate font-mono text-[10px] uppercase tracking-wider text-body">
              {card.category}
            </div>
          </div>
        </div>
        <div className={clsx("inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider", meta.text)}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-[1.55] text-body">{card.detail}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-body">
          {card.last_synced_at ? `Last sync ${timeAgo(card.last_synced_at)}` : "Ready"}
        </span>
        <div className="flex items-center gap-2">
          {isConnected && card.id && (
            <button
              onClick={() => onSync(card)}
              className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
            >
              Sync
            </button>
          )}
          <button
            onClick={() => onToggle(card)}
            className={clsx(
              "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              isConnected
                ? "border-hairline bg-white text-body hover:text-ink"
                : "border-accent bg-accent text-white hover:bg-accent-deep"
            )}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WebhooksManager({ rows }: { rows: WebhookRow[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("license.state_changed");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="grid grid-cols-[2fr_1fr_0.7fr_0.6fr_0.4fr] gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
        <div>Endpoint</div>
        <div>Event</div>
        <div>Last fired</div>
        <div>Result</div>
        <div></div>
      </div>
      <ul className="divide-y divide-hairline">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
            No webhooks yet. Subscribe to license-state changes to wire up alerting and ETL.
          </li>
        )}
        {rows.map((w) => (
          <li key={w.id} className="grid grid-cols-[2fr_1fr_0.7fr_0.6fr_0.4fr] items-center gap-4 px-5 py-3">
            <div className="truncate font-mono text-[12px] text-ink">{w.url}</div>
            <div className="truncate font-mono text-[11px] text-body">{w.event}</div>
            <div className="font-mono text-[11px] text-body">{w.last_fired_at ? timeAgo(w.last_fired_at) : "—"}</div>
            <div className={clsx("font-mono text-[11px]", w.last_status?.startsWith("2") ? "text-ok" : w.last_status ? "text-bad" : "text-body")}>
              {w.last_status ?? "—"}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={async () => {
                  const r = await fireTestWebhook(w.id);
                  if (!r.ok) {
                    await dialog.alert({ title: "Test webhook failed", body: r.error, tone: "danger" });
                  } else {
                    dialog.toast({ body: "Test event delivered.", tone: "success" });
                    refresh();
                  }
                }}
                className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
              >
                Test
              </button>
              <button
                onClick={async () => {
                  const ok = await dialog.confirm({
                    title: "Delete this webhook?",
                    body: w.url,
                    confirmLabel: "Delete",
                    tone: "danger",
                  });
                  if (!ok) return;
                  const r = await deleteWebhook(w.id);
                  if (!r.ok) {
                    await dialog.alert({ title: "Could not delete webhook", body: r.error, tone: "danger" });
                  } else {
                    dialog.toast({ body: "Webhook deleted.", tone: "success" });
                    refresh();
                  }
                }}
                className="rounded-md border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-hairline bg-bgalt/60 px-5 py-3">
        {open ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setSaving(true);
              const r = await createWebhook({ url, event });
              setSaving(false);
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setUrl("");
              setOpen(false);
              dialog.toast({ body: "Webhook added.", tone: "success" });
              refresh();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="h-9 flex-1 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] outline-none focus:border-accent"
            />
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className="h-9 rounded-md border border-hairline bg-white px-2 font-mono text-[11px] outline-none focus:border-accent"
            >
              <option value="license.state_changed">license.state_changed</option>
              <option value="renewal.due">renewal.due</option>
              <option value="filing.fee_scheduled">filing.fee_scheduled</option>
              <option value="filing.submitted">filing.submitted</option>
              <option value="filing.confirmed">filing.confirmed</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep disabled:opacity-70"
            >
              {saving ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              Cancel
            </button>
            {error && (
              <div className="basis-full rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
                {error}
              </div>
            )}
          </form>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full rounded-md border border-hairline bg-white py-2 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-bgalt"
          >
            + Add webhook
          </button>
        )}
      </div>
    </div>
  );
}

export function ApiKeysManager({ rows, canManage }: { rows: ApiKeyRow[]; canManage: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  const [revealed, setRevealed] = useState<{ id: string; secret: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "read_write">("read_write");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <ul className="divide-y divide-hairline">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
            No API keys yet.
          </li>
        )}
        {rows.map((k) => {
          const isRevealed = revealed?.id === k.id;
          return (
            <li key={k.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">
                    {k.name}{" "}
                    <span className="font-mono text-[10px] text-body">
                      · {k.scope === "read" ? "read-only" : "read/write"}
                    </span>
                  </div>
                  <div className="truncate font-mono text-[11px] text-body">
                    {isRevealed ? revealed!.secret : k.key_prefix}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && !k.revoked_at && (
                    <button
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          title: "Rotate this API key?",
                          body: "The current secret stops working immediately. Make sure callers are ready for the new one.",
                          confirmLabel: "Rotate",
                          tone: "danger",
                        });
                        if (!ok) return;
                        const r = await rotateApiKey(k.id);
                        if (!r.ok) {
                          await dialog.alert({ title: "Could not rotate key", body: r.error, tone: "danger" });
                          return;
                        }
                        setRevealed({ id: k.id, secret: r.secret });
                        await dialog.alert({
                          title: "Save the new secret",
                          body: r.secret,
                          tone: "success",
                          confirmLabel: "I've copied it",
                        });
                        refresh();
                      }}
                      className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                    >
                      Rotate
                    </button>
                  )}
                  {canManage && !k.revoked_at && (
                    <button
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          title: `Revoke ${k.name}?`,
                          body: "Callers using this key will start getting 401s on their next request.",
                          confirmLabel: "Revoke",
                          tone: "danger",
                        });
                        if (!ok) return;
                        const r = await revokeApiKey(k.id);
                        if (!r.ok) {
                          await dialog.alert({ title: "Could not revoke key", body: r.error, tone: "danger" });
                        } else {
                          dialog.toast({ body: "Key revoked.", tone: "default" });
                          refresh();
                        }
                      }}
                      className="rounded-md border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                    >
                      Revoke
                    </button>
                  )}
                  {k.revoked_at && (
                    <span className="rounded-md bg-bgalt px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body">
                      Revoked
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-body">
                <span>Created {new Date(k.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                <span>{k.last_used_at ? `Last used ${timeAgo(k.last_used_at)}` : "Never used"}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {canManage && (
        <div className="border-t border-hairline bg-bgalt/60 px-5 py-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setGenerating(true);
              setError(null);
              const r = await generateApiKey({ name, scope });
              setGenerating(false);
              if (!r.ok) {
                setError(r.error);
                return;
              }
              setName("");
              await dialog.alert({
                title: "Save this key now",
                body: r.secret,
                tone: "success",
                confirmLabel: "I've copied it",
              });
              refresh();
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production"
              className="h-9 flex-1 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] outline-none focus:border-accent"
            />
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "read" | "read_write")}
              className="h-9 rounded-md border border-hairline bg-white px-2 font-mono text-[11px] outline-none focus:border-accent"
            >
              <option value="read">read-only</option>
              <option value="read_write">read/write</option>
            </select>
            <button
              type="submit"
              disabled={generating}
              className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep disabled:opacity-70"
            >
              {generating ? "Generating…" : "+ New key"}
            </button>
            {error && (
              <div className="basis-full rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
                {error}
              </div>
            )}
          </form>
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

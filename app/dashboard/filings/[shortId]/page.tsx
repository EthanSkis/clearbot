import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { FilingActionsClient } from "./FilingActionsClient";
import { OpenDocumentButton } from "./OpenDocumentButton";

export const metadata: Metadata = { title: "Filing · ClearBot" };
export const dynamic = "force-dynamic";

const STAGE_ORDER = ["intake", "prep", "review", "submit", "confirm", "done"] as const;
const STAGE_LABEL: Record<(typeof STAGE_ORDER)[number] | "rejected", string> = {
  intake: "Intake",
  prep: "Pre-fill",
  review: "Review",
  submit: "Submit",
  confirm: "Confirm",
  done: "Done",
  rejected: "Rejected",
};

export default async function FilingDetailPage({ params }: { params: { shortId: string } }) {
  const ctx = await requireContext();
  const supabase = createClient();
  const shortId = decodeURIComponent(params.shortId);

  const { data: filing } = await supabase
    .from("filings")
    .select(
      "id, short_id, stage, status, mode, fee_cents, filed_at, confirmation_number, notes, created_at, license:license_id(id, license_type, license_number, expires_at, cycle_days, location:location_id(name, city, state, address_line1, zip)), agency:agency_id(code, name, portal_url)"
    )
    .eq("workspace_id", ctx.workspace.id)
    .eq("short_id", shortId)
    .maybeSingle();

  if (!filing) notFound();

  const [{ data: docs }, { data: activity }, { data: deliveries }] = await Promise.all([
    supabase
      .from("documents")
      .select("id, name, kind, size_bytes, storage_path, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .eq("filing_id", filing.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_log")
      .select("id, type, title, detail, actor_label, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .filter("metadata->>filing_short_id", "eq", filing.short_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("webhook_deliveries")
      .select("id, event, status, attempts, last_response_status, last_error, delivered_at, created_at")
      .eq("workspace_id", ctx.workspace.id)
      .filter("payload->>filing_short_id", "eq", filing.short_id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const license = filing.license as unknown as {
    id: string;
    license_type: string;
    license_number: string | null;
    expires_at: string | null;
    cycle_days: number;
    location: { name: string; city: string | null; state: string | null; address_line1: string | null; zip: string | null } | null;
  } | null;
  const agency = filing.agency as unknown as { code: string; name: string; portal_url: string | null } | null;

  const stage = filing.stage as keyof typeof STAGE_LABEL;
  const idx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);
  const isRejected = stage === "rejected";

  const packet = (docs ?? []).find((d) => d.kind === "application") ?? null;

  return (
    <>
      <PageHeader
        eyebrow={`${filing.short_id} · ${STAGE_LABEL[stage]}`}
        title={
          <>
            {license?.license_type ?? "Filing"}{" "}
            <span className="italic text-body">{license?.location?.name ?? ""}</span>
          </>
        }
        subtitle={agency ? `${agency.name} (${agency.code})` : undefined}
        actions={
          <Link
            href="/dashboard/filings"
            className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            ← All filings
          </Link>
        }
      />

      <FilingActionsClient
        filingId={filing.id as string}
        shortId={filing.short_id as string}
        stage={stage as string}
        packet={packet ? { id: packet.id as string, storage_path: (packet.storage_path as string | null) ?? null } : null}
        isRejected={isRejected}
        mode={filing.mode as "alert" | "prep" | "auto"}
      />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card label="Stage" value={STAGE_LABEL[stage]}>
          <div className="mt-3 space-y-1.5 font-mono text-[10px] uppercase tracking-wider">
            {STAGE_ORDER.map((s, i) => (
              <div
                key={s}
                className={
                  isRejected
                    ? "text-body/60"
                    : i < idx
                      ? "text-body"
                      : i === idx
                        ? "font-semibold text-ink"
                        : "text-body/60"
                }
              >
                {i < idx ? "✓ " : i === idx ? "→ " : "· "}
                {STAGE_LABEL[s]}
              </div>
            ))}
            {isRejected && <div className="text-bad">✕ Rejected</div>}
          </div>
        </Card>
        <Card label="License" value={license?.license_type ?? "—"}>
          <Row k="Number" v={license?.license_number ?? "—"} mono />
          <Row k="Expires" v={license?.expires_at ?? "—"} />
          <Row k="Cycle" v={license ? `${license.cycle_days} days` : "—"} />
          <Row k="Mode" v={String(filing.mode)} />
        </Card>
        <Card label="Filing meta" value={`$${((filing.fee_cents as number) / 100).toLocaleString()}`}>
          <Row k="Confirmation" v={(filing.confirmation_number as string | null) ?? "—"} mono />
          <Row k="Filed at" v={(filing.filed_at as string | null) ?? "—"} mono />
          <Row k="Status" v={String(filing.status)} />
          <Row k="Created" v={(filing.created_at as string).slice(0, 10)} mono />
        </Card>
      </section>

      {license?.location && (
        <section>
          <SectionHeader title="Location" />
          <div className="mt-3 rounded-2xl border border-hairline bg-white p-4 shadow-card text-[13px] text-body">
            <div className="font-medium text-ink">{license.location.name}</div>
            <div>{license.location.address_line1 ?? ""}</div>
            <div>
              {[license.location.city, license.location.state, license.location.zip].filter(Boolean).join(", ")}
            </div>
          </div>
        </section>
      )}

      <section>
        <SectionHeader title="Documents" subtitle="Packets, receipts, correspondence attached to this filing." />
        <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          {(docs ?? []).length === 0 ? (
            <div className="px-5 py-10 text-center font-mono text-[12px] text-body">
              No documents yet. The packet will appear here once the worker processes the job.
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {(docs ?? []).map((d) => (
                <li key={d.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3 text-[13px]">
                  <div>
                    <div className="font-medium text-ink">{d.name as string}</div>
                    <div className="font-mono text-[11px] text-body">
                      {d.kind as string} · {(((d.size_bytes as number) ?? 0) / 1024).toFixed(0)} KB
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-body">
                    {(d.created_at as string).slice(0, 10)}
                  </div>
                  <OpenDocumentButton storagePath={(d.storage_path as string | null) ?? null} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Activity" subtitle="Everything ClearBot or a teammate did on this filing." />
        <ul className="mt-3 space-y-1">
          {(activity ?? []).length === 0 ? (
            <li className="rounded-2xl border border-dashed border-hairline bg-bgalt/30 px-5 py-8 text-center font-mono text-[12px] text-body">
              No activity yet for {filing.short_id}.
            </li>
          ) : (
            (activity ?? []).map((a) => (
              <li
                key={a.id as string}
                className="grid grid-cols-[120px_1fr] items-baseline gap-4 rounded-md border border-hairline bg-white px-4 py-2 text-[13px]"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                  {(a.created_at as string).slice(0, 16).replace("T", " ")}
                </div>
                <div>
                  <div className="text-ink">
                    <Pill tone="neutral" withDot>
                      {a.type as string}
                    </Pill>{" "}
                    <span className="font-medium">{a.title as string}</span>
                  </div>
                  {a.detail && <div className="mt-0.5 text-body">{a.detail as string}</div>}
                  {a.actor_label && (
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-body/70">
                      by {a.actor_label as string}
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {(deliveries ?? []).length > 0 && (
        <section>
          <SectionHeader title="Webhook deliveries" subtitle="Outbound notifications sent to your subscribers." />
          <div className="mt-3 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <ul className="divide-y divide-hairline text-[12px]">
              {(deliveries ?? []).map((d) => (
                <li key={d.id as string} className="grid grid-cols-[160px_1fr_120px_80px] items-center gap-3 px-4 py-2">
                  <div className="font-mono text-[11px] text-body">{(d.created_at as string).slice(0, 16).replace("T", " ")}</div>
                  <div className="font-mono text-[11px] text-ink">{d.event as string}</div>
                  <div className="font-mono text-[11px] text-body">
                    HTTP {(d.last_response_status as number) ?? "—"} · {d.attempts as number}× tries
                  </div>
                  <Pill tone={d.status === "delivered" ? "ok" : d.status === "failed" ? "bad" : "warn"} withDot>
                    {d.status as string}
                  </Pill>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {filing.notes && (
        <section>
          <SectionHeader title="Notes" />
          <div className="mt-3 rounded-2xl border border-hairline bg-white p-4 text-[13px] text-body">
            {filing.notes as string}
          </div>
        </section>
      )}
    </>
  );
}

function Card({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[22px] font-light leading-tight tracking-[-0.01em] text-ink">{value}</div>
      <div className="mt-3 space-y-1 text-[12px] text-body">{children}</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-body">{k}</span>
      <span className={mono ? "font-mono text-[11px] text-ink" : "text-ink"}>{v}</span>
    </div>
  );
}

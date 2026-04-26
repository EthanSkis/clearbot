import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRenewalReminder } from "@/lib/email";
import { enqueueJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB = "daily_sweep";
const DEFAULT_LEAD_DAYS = 45;
const DEFAULT_ESCALATION_HOURS = 48;

type Stats = {
  workspaces: number;
  licenses_scanned: number;
  filings_created: number;
  packets_enqueued: number;
  emails_sent: number;
  emails_failed: number;
  workspaces_failed: number;
};

function todayUtcDate() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  return false;
}

export async function GET(req: Request) {
  return runSweep(req);
}

export async function POST(req: Request) {
  return runSweep(req);
}

async function runSweep(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const stats: Stats = {
    workspaces: 0,
    licenses_scanned: 0,
    filings_created: 0,
    packets_enqueued: 0,
    emails_sent: 0,
    emails_failed: 0,
    workspaces_failed: 0,
  };

  const { data: jobRow, error: jobErr } = await admin
    .from("job_runs")
    .insert({ job_name: JOB, status: "running" })
    .select("id")
    .single();
  if (jobErr || !jobRow) {
    return NextResponse.json(
      { ok: false, error: `job_runs insert failed: ${jobErr?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
  const jobId = jobRow.id as string;

  try {
    const { data: workspaces, error: wsErr } = await admin
      .from("workspaces")
      .select("id, name")
      .eq("status", "active");
    if (wsErr) throw new Error(`workspaces: ${wsErr.message}`);

    for (const ws of workspaces ?? []) {
      stats.workspaces += 1;
      try {
        const ran = await sweepWorkspace(admin, ws.id as string, ws.name as string);
        stats.licenses_scanned += ran.licenses_scanned;
        stats.filings_created += ran.filings_created;
        stats.packets_enqueued += ran.packets_enqueued;
        stats.emails_sent += ran.emails_sent;
        stats.emails_failed += ran.emails_failed;
      } catch (e) {
        stats.workspaces_failed += 1;
        console.error(`[daily-sweep] workspace ${ws.id} failed:`, e);
      }
    }

    await admin
      .from("job_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: stats.workspaces_failed > 0 ? "failed" : "ok",
        stats,
      })
      .eq("id", jobId);

    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("job_runs")
      .update({
        finished_at: new Date().toISOString(),
        status: "failed",
        error: msg,
        stats,
      })
      .eq("id", jobId);
    return NextResponse.json({ ok: false, error: msg, stats }, { status: 500 });
  }
}

type WorkspaceRunStats = {
  licenses_scanned: number;
  filings_created: number;
  packets_enqueued: number;
  emails_sent: number;
  emails_failed: number;
};

type MemberPref = {
  member_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  lead_days: number;
  escalation_hours: number;
};

type LicenseRow = {
  id: string;
  location_id: string;
  agency_id: string | null;
  license_type: string;
  license_number: string | null;
  expires_at: string | null;
  fee_cents: number;
  automation_mode: string;
  location: { name: string } | null;
  agency: { name: string | null } | null;
};

type FilingRow = {
  id: string;
  short_id: string;
  license_id: string;
  stage: string;
  status: string;
  created_at: string;
  license: {
    license_type: string;
    license_number: string | null;
    expires_at: string | null;
    location: { name: string } | null;
    agency: { name: string | null } | null;
  } | null;
};

async function sweepWorkspace(
  admin: ReturnType<typeof createAdminClient>,
  workspaceId: string,
  workspaceName: string
): Promise<WorkspaceRunStats> {
  const out: WorkspaceRunStats = {
    licenses_scanned: 0,
    filings_created: 0,
    packets_enqueued: 0,
    emails_sent: 0,
    emails_failed: 0,
  };
  const today = todayUtcDate();

  // Notification recipients (email-eligible members + their prefs)
  const { data: prefsRaw, error: prefsErr } = await admin
    .from("notification_prefs")
    .select(
      "member_id, lead_days, escalation_hours, channel_email, member:member_id(user_id, status)"
    )
    .eq("workspace_id", workspaceId)
    .eq("channel_email", true);
  if (prefsErr) throw new Error(`notification_prefs: ${prefsErr.message}`);

  const activePrefs = (prefsRaw ?? []).filter((p) => {
    const m = p.member as unknown as { user_id: string; status: string } | null;
    return m && m.status === "active";
  });

  // Resolve user emails via auth admin API (one call per user_id; small N).
  const members: MemberPref[] = [];
  for (const p of activePrefs) {
    const m = p.member as unknown as { user_id: string };
    try {
      const { data: u } = await admin.auth.admin.getUserById(m.user_id);
      const email = u?.user?.email;
      if (!email) continue;
      const fullName =
        (u.user?.user_metadata?.full_name as string | undefined) ??
        (u.user?.user_metadata?.name as string | undefined) ??
        null;
      members.push({
        member_id: p.member_id as string,
        user_id: m.user_id,
        email,
        full_name: fullName,
        lead_days: (p.lead_days as number) ?? DEFAULT_LEAD_DAYS,
        escalation_hours: (p.escalation_hours as number) ?? DEFAULT_ESCALATION_HOURS,
      });
    } catch (e) {
      console.error(`[daily-sweep] resolve user ${m.user_id}:`, e);
    }
  }

  // Effective lead_days for "create filing" = max across members so the earliest
  // warning triggers an intake row. (Larger lead_days = earlier warning.)
  const effectiveLeadDays = members.length
    ? Math.max(...members.map((m) => m.lead_days))
    : DEFAULT_LEAD_DAYS;
  const sweepCutoffIso = new Date(today.getTime() + effectiveLeadDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // ── 1. Find licenses needing an intake filing ────────────────────────────
  const { data: licensesRaw, error: licErr } = await admin
    .from("licenses")
    .select(
      "id, location_id, agency_id, license_type, license_number, expires_at, fee_cents, automation_mode, location:location_id(name), agency:agency_id(name)"
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .not("expires_at", "is", null)
    .lte("expires_at", sweepCutoffIso);
  if (licErr) throw new Error(`licenses: ${licErr.message}`);

  const licenses = (licensesRaw ?? []) as unknown as LicenseRow[];
  out.licenses_scanned = licenses.length;

  if (licenses.length > 0) {
    const licenseIds = licenses.map((l) => l.id);
    const { data: openFilings, error: openErr } = await admin
      .from("filings")
      .select("license_id")
      .eq("workspace_id", workspaceId)
      .eq("status", "in_flight")
      .in("license_id", licenseIds);
    if (openErr) throw new Error(`filings (open): ${openErr.message}`);
    const openSet = new Set((openFilings ?? []).map((f) => f.license_id as string));

    for (const lic of licenses) {
      if (openSet.has(lic.id)) continue;
      const { data: shortIdRow, error: sidErr } = await admin.rpc("next_filing_short_id", {
        wsid: workspaceId,
      });
      if (sidErr) {
        console.error(`[daily-sweep] short_id for ${lic.id}:`, sidErr);
        continue;
      }
      const shortId = (shortIdRow as string) || `CB-${Date.now()}`;

      const { data: insRow, error: insErr } = await admin
        .from("filings")
        .insert({
          workspace_id: workspaceId,
          license_id: lic.id,
          location_id: lic.location_id,
          agency_id: lic.agency_id,
          short_id: shortId,
          stage: "intake",
          mode: lic.automation_mode,
          fee_cents: lic.fee_cents,
          status: "in_flight",
        })
        .select("id")
        .single();
      if (insErr || !insRow) {
        console.error(`[daily-sweep] insert filing for ${lic.id}:`, insErr);
        continue;
      }
      out.filings_created += 1;

      await admin.from("activity_log").insert({
        workspace_id: workspaceId,
        actor_label: "ClearBot",
        type: "alert",
        title: `Renewal opened: ${lic.license_type}${lic.location?.name ? ` @ ${lic.location.name}` : ""}`,
        detail: `Filing ${shortId} (expires ${lic.expires_at})`,
        metadata: { filing_short_id: shortId, license_id: lic.id },
      });

      // Phase 2: enqueue packet generation for prep/auto modes. Alert-only
      // licenses just want the email reminder — no packet needed.
      if (lic.automation_mode === "prep" || lic.automation_mode === "auto") {
        const enq = await enqueueJob(
          {
            type: "generate_packet",
            workspaceId,
            payload: { filing_id: insRow.id, filing_short_id: shortId },
          },
          admin
        );
        if (enq) out.packets_enqueued += 1;
      }
    }
  }

  // ── 2. Send reminder emails for in-flight intake filings ────────────────
  if (members.length === 0) return out;

  const { data: openIntakeRaw, error: intakeErr } = await admin
    .from("filings")
    .select(
      "id, short_id, license_id, stage, status, created_at, license:license_id(license_type, license_number, expires_at, location:location_id(name), agency:agency_id(name))"
    )
    .eq("workspace_id", workspaceId)
    .eq("status", "in_flight")
    .eq("stage", "intake");
  if (intakeErr) throw new Error(`filings (intake): ${intakeErr.message}`);
  const openIntake = (openIntakeRaw ?? []) as unknown as FilingRow[];

  for (const f of openIntake) {
    const lic = f.license;
    if (!lic || !lic.expires_at) continue;
    const expDate = new Date(`${lic.expires_at}T00:00:00Z`);
    const daysUntil = daysBetween(expDate, today);

    const { data: prevSends, error: sendsErr } = await admin
      .from("notification_sends")
      .select("member_id, kind, sent_at")
      .eq("filing_id", f.id);
    if (sendsErr) {
      console.error(`[daily-sweep] notification_sends ${f.id}:`, sendsErr);
      continue;
    }
    const sentMap = new Map<string, { intake_opened?: string; escalation?: string }>();
    for (const s of prevSends ?? []) {
      const m = sentMap.get(s.member_id as string) ?? {};
      m[s.kind as "intake_opened" | "escalation"] = s.sent_at as string;
      sentMap.set(s.member_id as string, m);
    }

    for (const member of members) {
      const memberLead = member.lead_days;
      if (daysUntil > memberLead) continue; // not yet eligible for this member

      const sent = sentMap.get(member.member_id) ?? {};
      let kind: "intake_opened" | "escalation" | null = null;
      if (!sent.intake_opened) {
        kind = "intake_opened";
      } else if (!sent.escalation) {
        const firstSend = new Date(sent.intake_opened).getTime();
        const elapsedHours = (Date.now() - firstSend) / 3_600_000;
        if (elapsedHours >= member.escalation_hours) kind = "escalation";
      }
      if (!kind) continue;

      try {
        await sendRenewalReminder({
          to: member.email,
          recipientName: member.full_name,
          workspaceName,
          licenseType: lic.license_type,
          licenseNumber: lic.license_number,
          locationName: lic.location?.name ?? "—",
          agencyName: lic.agency?.name ?? null,
          expiresAt: lic.expires_at,
          daysUntilExpiry: daysUntil,
          filingShortId: f.short_id,
          kind,
        });

        const { error: dedupeErr } = await admin.from("notification_sends").insert({
          workspace_id: workspaceId,
          filing_id: f.id,
          member_id: member.member_id,
          kind,
          channel: "email",
        });
        if (dedupeErr) {
          console.error(`[daily-sweep] dedupe insert:`, dedupeErr);
        }

        await admin.from("activity_log").insert({
          workspace_id: workspaceId,
          actor_label: "ClearBot",
          type: "alert",
          title:
            kind === "escalation"
              ? `Reminder escalated: ${lic.license_type}`
              : `Reminder sent: ${lic.license_type}`,
          detail: `${member.email} · Filing ${f.short_id}`,
          metadata: { filing_short_id: f.short_id, kind, member_id: member.member_id },
        });

        out.emails_sent += 1;
      } catch (e) {
        out.emails_failed += 1;
        console.error(`[daily-sweep] email ${member.email} for ${f.short_id}:`, e);
      }
    }
  }

  return out;
}

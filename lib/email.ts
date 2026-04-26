import "server-only";
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";

type Transport = ReturnType<typeof nodemailer.createTransport>;

let cachedTransport: Transport | null = null;

function getTransport(): Transport {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP env vars missing (SMTP_HOST / SMTP_USER / SMTP_PASS)");
  }
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

export type BookingPayload = {
  name: string;
  email: string;
  company: string;
  locations: string;
  notes: string | null;
  scheduledAt: Date;
  timezone: string;
};

const DURATION_MINUTES = 15;
const ORGANIZER_NAME = "Ethan Gardner";
const ORGANIZER_EMAIL = "ethan@clearbot.io";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function toIcsDate(d: Date) {
  // YYYYMMDDTHHMMSSZ
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function foldLine(line: string) {
  // RFC 5545 lines should be folded at 75 octets.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push((i === 0 ? "" : " ") + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

export function buildBookingIcs(b: BookingPayload) {
  const start = b.scheduledAt;
  const end = new Date(start.getTime() + DURATION_MINUTES * 60 * 1000);
  const uid = `${randomUUID()}@clearbot.io`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClearBot//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs("ClearBot intro call")}`,
    `DESCRIPTION:${escapeIcs(
      `15-minute intro call with ${ORGANIZER_NAME}.\n\nCompany: ${b.company}\nLocations: ${b.locations}${b.notes ? `\n\nNotes: ${b.notes}` : ""}`
    )}`,
    `LOCATION:${escapeIcs("Google Meet (link in invite)")}`,
    `ORGANIZER;CN=${escapeIcs(ORGANIZER_NAME)}:mailto:${ORGANIZER_EMAIL}`,
    `ATTENDEE;CN=${escapeIcs(b.name)};RSVP=TRUE:mailto:${b.email}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n");
}

function formatLongDate(d: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone: timezone,
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

export async function sendBookingEmails(b: BookingPayload) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || `ClearBot <${ORGANIZER_EMAIL}>`;
  const notifyTo = process.env.BOOKING_NOTIFICATION_TO || ORGANIZER_EMAIL;

  const when = formatLongDate(b.scheduledAt, b.timezone);
  const ics = buildBookingIcs(b);
  const icsAttachment = {
    filename: "clearbot-intro-call.ics",
    content: ics,
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };

  const customerText = [
    `Hi ${b.name.split(" ")[0] || b.name},`,
    "",
    `You're booked for a 15-minute ClearBot intro call on ${when}.`,
    "",
    `A calendar invite is attached — accepting it will add the event to your calendar. A Google Meet link will be in the invite.`,
    "",
    `If you need to reschedule, just reply to this email.`,
    "",
    `— ${ORGANIZER_NAME}, ClearBot`,
  ].join("\n");

  const customerHtml = `
    <p>Hi ${escapeHtml(b.name.split(" ")[0] || b.name)},</p>
    <p>You're booked for a 15-minute ClearBot intro call on <strong>${escapeHtml(when)}</strong>.</p>
    <p>A calendar invite is attached &mdash; accepting it will add the event to your calendar. A Google Meet link will be in the invite.</p>
    <p>If you need to reschedule, just reply to this email.</p>
    <p>&mdash; ${escapeHtml(ORGANIZER_NAME)}, ClearBot</p>
  `;

  const notificationText = [
    "New booking via /book:",
    "",
    `When:      ${when}`,
    `Name:      ${b.name}`,
    `Email:     ${b.email}`,
    `Company:   ${b.company}`,
    `Locations: ${b.locations}`,
    `Notes:     ${b.notes || "—"}`,
    `Timezone:  ${b.timezone}`,
  ].join("\n");

  // Fire both emails in parallel. If one fails, we still want the other to go.
  const [customerResult, notificationResult] = await Promise.allSettled([
    transport.sendMail({
      from,
      to: `${b.name} <${b.email}>`,
      replyTo: ORGANIZER_EMAIL,
      subject: `You're booked: ClearBot intro call, ${when}`,
      text: customerText,
      html: customerHtml,
      attachments: [icsAttachment],
      icalEvent: {
        method: "REQUEST",
        filename: "clearbot-intro-call.ics",
        content: ics,
      },
    }),
    transport.sendMail({
      from,
      to: notifyTo,
      replyTo: `${b.name} <${b.email}>`,
      subject: `New booking: ${b.company} (${b.name})`,
      text: notificationText,
    }),
  ]);

  return {
    customer: customerResult.status === "fulfilled",
    notification: notificationResult.status === "fulfilled",
    customerError: customerResult.status === "rejected" ? String(customerResult.reason) : null,
    notificationError:
      notificationResult.status === "rejected" ? String(notificationResult.reason) : null,
  };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type RenewalReminderPayload = {
  to: string;
  recipientName?: string | null;
  workspaceName: string;
  licenseType: string;
  licenseNumber?: string | null;
  locationName: string;
  agencyName?: string | null;
  expiresAt: string; // ISO date (YYYY-MM-DD)
  daysUntilExpiry: number;
  filingShortId: string;
  kind: "intake_opened" | "escalation";
};

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://clearbot.io"
  ).replace(/\/$/, "");
}

function formatExpiry(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export async function sendRenewalReminder(p: RenewalReminderPayload) {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || `ClearBot <${ORGANIZER_EMAIL}>`;
  // No per-filing detail route yet; deep-link to the filings list.
  const filingUrl = `${appBaseUrl()}/dashboard/filings`;
  const expiry = formatExpiry(p.expiresAt);
  const firstName = (p.recipientName || "").split(" ")[0] || "there";
  const isEscalation = p.kind === "escalation";

  const subject = isEscalation
    ? `Still open: ${p.licenseType} renewal at ${p.locationName} (expires ${expiry})`
    : `Renewal opened: ${p.licenseType} at ${p.locationName} (expires ${expiry})`;

  const lead = isEscalation
    ? `This is a follow-up — the renewal below hasn't been actioned yet.`
    : `ClearBot opened a renewal for the license below. Review it before the deadline.`;

  const lines = [
    `License:    ${p.licenseType}${p.licenseNumber ? ` (#${p.licenseNumber})` : ""}`,
    `Location:   ${p.locationName}`,
    p.agencyName ? `Agency:     ${p.agencyName}` : null,
    `Expires:    ${expiry} (${p.daysUntilExpiry} days)`,
    `Filing:     ${p.filingShortId}`,
  ].filter(Boolean) as string[];

  const text = [
    `Hi ${firstName},`,
    "",
    lead,
    "",
    ...lines,
    "",
    `Open the filing: ${filingUrl}`,
    "",
    `— ClearBot for ${p.workspaceName}`,
  ].join("\n");

  const html = `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>${escapeHtml(lead)}</p>
    <table cellpadding="0" cellspacing="0" style="font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;line-height:1.6;border-collapse:collapse">
      <tr><td style="padding:2px 12px 2px 0;color:#6b7280">License</td><td><strong>${escapeHtml(p.licenseType)}</strong>${p.licenseNumber ? ` <span style="color:#6b7280">#${escapeHtml(p.licenseNumber)}</span>` : ""}</td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Location</td><td>${escapeHtml(p.locationName)}</td></tr>
      ${p.agencyName ? `<tr><td style="padding:2px 12px 2px 0;color:#6b7280">Agency</td><td>${escapeHtml(p.agencyName)}</td></tr>` : ""}
      <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Expires</td><td>${escapeHtml(expiry)} <span style="color:#6b7280">(${p.daysUntilExpiry} days)</span></td></tr>
      <tr><td style="padding:2px 12px 2px 0;color:#6b7280">Filing</td><td>${escapeHtml(p.filingShortId)}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${filingUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Open filing</a></p>
    <p style="color:#6b7280">— ClearBot for ${escapeHtml(p.workspaceName)}</p>
  `;

  await transport.sendMail({
    from,
    to: p.to,
    subject,
    text,
    html,
  });
}

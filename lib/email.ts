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

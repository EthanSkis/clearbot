"use server";

import { createClient } from "@/lib/supabase/server";
import { sendBookingEmails, type BookingPayload } from "@/lib/email";

export type SubmitBookingInput = {
  name: string;
  email: string;
  company: string;
  locations: string;
  notes: string;
  scheduledAtIso: string;
  timezone: string;
};

export type SubmitBookingResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitBooking(input: SubmitBookingInput): Promise<SubmitBookingResult> {
  const name = input.name.trim();
  const email = input.email.trim();
  const company = input.company.trim();
  const locations = input.locations.trim();
  const notes = input.notes.trim();
  const timezone = input.timezone.trim() || "UTC";

  if (!name || !email || !company || !locations) {
    return { ok: false, error: "Missing required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Invalid email." };
  }
  const scheduledAt = new Date(input.scheduledAtIso);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "Invalid date/time." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: insertError } = await supabase.from("bookings").insert({
    user_id: user?.id ?? null,
    name,
    email,
    company,
    locations,
    notes: notes || null,
    scheduled_at: scheduledAt.toISOString(),
    timezone,
  });

  if (insertError) {
    return { ok: false, error: "Could not save booking. Try again, or email ethan@clearbot.io." };
  }

  const payload: BookingPayload = {
    name,
    email,
    company,
    locations,
    notes: notes || null,
    scheduledAt,
    timezone,
  };

  try {
    const result = await sendBookingEmails(payload);
    if (!result.customer || !result.notification) {
      console.error("[booking email] partial failure", result);
    }
  } catch (err) {
    // Booking is already saved — don't fail the user if SMTP hiccups.
    console.error("[booking email] send failed", err);
  }

  return { ok: true };
}

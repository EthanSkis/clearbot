"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";

type Step = "datetime" | "details" | "confirmed";

type FormState = {
  name: string;
  email: string;
  company: string;
  locations: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  company: "",
  locations: "",
  notes: "",
};

const LOCATION_BUCKETS = [
  "1–5 locations",
  "6–25 locations",
  "26–100 locations",
  "100+ locations",
];

export function BookingFlow() {
  const [step, setStep] = useState<Step>("datetime");
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tz = useMemo(
    () =>
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
    []
  );

  function reset() {
    setStep("datetime");
    setDate(null);
    setSlot(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.company.trim() || !form.locations) {
      setError("Please fill in name, email, company, and location count.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("That email doesn't look right.");
      return;
    }
    if (!date || !slot) {
      setError("Pick a date and time first.");
      setStep("datetime");
      return;
    }

    setSubmitting(true);

    const [h, m] = slot.split(":").map(Number);
    const scheduled = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      h,
      m,
      0,
      0
    );

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error: insertError } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      locations: form.locations,
      notes: form.notes.trim() || null,
      scheduled_at: scheduled.toISOString(),
      timezone: tz,
    });

    setSubmitting(false);

    if (insertError) {
      setError("We couldn't save your booking. Try again, or email ethan@clearbot.io.");
      return;
    }

    setStep("confirmed");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
      <AboutPanel date={date} slot={slot} tz={tz} step={step} />

      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-card sm:p-8">
        <Stepper step={step} />

        <div className="mt-6">
          <AnimatePresence mode="wait">
            {step === "datetime" && (
              <motion.div
                key="datetime"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <DateTimeStep
                  date={date}
                  setDate={(d) => {
                    setDate(d);
                    setSlot(null);
                  }}
                  slot={slot}
                  setSlot={setSlot}
                  tz={tz}
                  onContinue={() => setStep("details")}
                />
              </motion.div>
            )}

            {step === "details" && (
              <motion.form
                key="details"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                noValidate
              >
                <DetailsStep
                  form={form}
                  setForm={setForm}
                  error={error}
                  submitting={submitting}
                  onBack={() => setStep("datetime")}
                />
              </motion.form>
            )}

            {step === "confirmed" && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <ConfirmedStep
                  date={date!}
                  slot={slot!}
                  form={form}
                  tz={tz}
                  onAnother={reset}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- left panel ---------- */

function AboutPanel({
  date,
  slot,
  tz,
  step,
}: {
  date: Date | null;
  slot: string | null;
  tz: string;
  step: Step;
}) {
  return (
    <aside className="rounded-2xl border border-hairline bg-white p-7 shadow-card lg:sticky lg:top-24 lg:self-start">
      <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
        ClearBot · 15 minutes
      </div>
      <h1 className="mt-3 font-display text-[34px] font-light leading-[1.05] tracking-[-0.01em] text-ink">
        Book a free <span className="italic">intro call.</span>
      </h1>
      <p className="mt-4 text-[14px] leading-[1.6] text-body">
        A 15-minute call to walk through your license inventory, surface the
        most exposed locations, and show you what handoff to ClearBot looks
        like. No deck, no pitch.
      </p>

      <ul className="mt-6 space-y-2.5">
        {[
          "A live audit of your current license inventory.",
          "A risk map of your top three exposed locations.",
          "A 30-second demo of what handoff looks like.",
        ].map((b) => (
          <li
            key={b}
            className="flex items-start gap-2.5 text-[13px] leading-[1.6] text-ink"
          >
            <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex items-center gap-3 border-t border-hairline pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-[12px] font-medium text-white">
          EG
        </span>
        <div>
          <div className="text-[13px] font-medium text-ink">Ethan Gardner</div>
          <div className="font-mono text-[11px] text-body">Founder, ClearBot</div>
        </div>
      </div>

      <div className="mt-6 space-y-1.5 border-t border-hairline pt-6 font-mono text-[11px] uppercase tracking-wider text-body">
        <div className="flex items-center gap-2">
          <Icon kind="clock" /> 15 min
        </div>
        <div className="flex items-center gap-2">
          <Icon kind="video" /> Google Meet (link emailed)
        </div>
        <div className="flex items-center gap-2">
          <Icon kind="globe" /> {tz}
        </div>
      </div>

      {step !== "confirmed" && (
        <div className="mt-6 rounded-lg border border-hairline bg-bgalt/60 p-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Selected
          </div>
          <div
            className={clsx(
              "mt-1 text-[13px]",
              date ? "text-ink" : "text-body/60"
            )}
          >
            {date ? formatLongDate(date) : "No date selected"}
          </div>
          <div
            className={clsx(
              "mt-0.5 text-[13px] text-body",
              !slot && "invisible"
            )}
            aria-hidden={!slot}
          >
            {slot ? formatTimeRange(slot) : "placeholder"}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------- stepper ---------- */

function Stepper({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "datetime", label: "Date & time" },
    { key: "details", label: "Your details" },
    { key: "confirmed", label: "Confirmed" },
  ];
  const idx = steps.findIndex((s) => s.key === step);

  return (
    <ol className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider">
      {steps.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={clsx(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition-colors",
                done
                  ? "border-accent bg-accent text-white"
                  : active
                    ? "border-ink text-ink"
                    : "border-hairline text-body"
              )}
            >
              {done ? (
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                i + 1
              )}
            </span>
            <span
              className={clsx(
                "hidden sm:inline",
                active ? "text-ink" : done ? "text-body" : "text-body/60"
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="h-px w-6 bg-hairline sm:w-10" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- step 1: date + time ---------- */

function DateTimeStep({
  date,
  setDate,
  slot,
  setSlot,
  tz,
  onContinue,
}: {
  date: Date | null;
  setDate: (d: Date) => void;
  slot: string | null;
  setSlot: (s: string) => void;
  tz: string;
  onContinue: () => void;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(() => buildMonth(monthOffset), [monthOffset]);
  const today = useMemo(stripTime, []);

  const slots = useMemo(() => {
    if (!date) return [];
    return buildSlots().map((s) => ({
      slot: s,
      available: isSlotAvailable(date, s),
    }));
  }, [date]);

  return (
    <div className="grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-8">
      {/* calendar */}
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[18px] font-medium tracking-tight text-ink">
            {monthLabel(month.year, month.month)}
          </h2>
          <div className="flex items-center gap-1">
            <NavBtn
              dir="prev"
              disabled={monthOffset === 0}
              onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
            />
            <NavBtn
              dir="next"
              disabled={monthOffset >= 2}
              onClick={() => setMonthOffset((m) => Math.min(2, m + 1))}
            />
          </div>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-7 grid-rows-[auto_repeat(6,minmax(0,1fr))] gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="py-2 text-center font-mono text-[10px] uppercase tracking-wider text-body"
            >
              {d}
            </div>
          ))}
          {month.cells.map((cell, i) => {
            if (!cell) {
              return <div key={`e-${i}`} />;
            }
            const dow = cell.getDay();
            const isPast = cell.getTime() < today.getTime();
            const isWeekend = dow === 0 || dow === 6;
            const disabled = isPast || isWeekend;
            const selected =
              date &&
              cell.getFullYear() === date.getFullYear() &&
              cell.getMonth() === date.getMonth() &&
              cell.getDate() === date.getDate();
            const isToday = sameDay(cell, today);

            return (
              <button
                key={cell.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => setDate(cell)}
                className={clsx(
                  "relative min-h-[44px] w-full rounded-md text-[14px] font-medium transition-colors",
                  selected
                    ? "bg-ink text-white"
                    : disabled
                      ? "cursor-not-allowed text-body/30"
                      : "text-ink hover:bg-bgalt",
                  !selected && !disabled && "border border-hairline"
                )}
              >
                {cell.getDate()}
                {isToday && !selected && (
                  <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* time slots */}
      <div className="flex h-full flex-col">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[18px] font-medium tracking-tight text-ink">
            {date ? formatShortDate(date) : "Pick a date"}
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-body">
            {tz.replace(/_/g, " ")}
          </span>
        </div>

        <div className="mt-4 flex-1">
          {!date && (
            <p className="flex h-full items-center justify-center rounded-md border border-dashed border-hairline bg-bgalt/40 p-6 text-center text-[12px] text-body">
              Select a date on the left to see available times.
            </p>
          )}
          {date && (
            <div className="grid h-full grid-cols-2 gap-1.5">
              {slots.map(({ slot: s, available }) => {
                const selected = slot === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!available}
                    onClick={() => setSlot(s)}
                    className={clsx(
                      "flex min-h-[44px] w-full items-center justify-between rounded-md border px-3 font-mono text-[12px] tabular-nums transition-colors",
                      selected
                        ? "border-accent bg-accent text-white"
                        : available
                          ? "border-hairline bg-white text-ink hover:border-ink"
                          : "cursor-not-allowed border-hairline bg-bgalt/40 text-body/40 line-through"
                    )}
                  >
                    <span>{formatTime(s)}</span>
                    {selected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <button
          type="button"
          disabled={!date || !slot}
          onClick={onContinue}
          className={clsx(
            "h-11 w-full rounded-full border px-5 font-sans text-[14px] font-medium transition-colors sm:w-auto",
            date && slot
              ? "border-accent bg-accent text-white hover:border-accent-deep hover:bg-accent-deep"
              : "cursor-not-allowed border-hairline bg-bgalt text-body"
          )}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function NavBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-white transition-colors",
        disabled
          ? "cursor-not-allowed text-body/30"
          : "text-ink hover:bg-bgalt"
      )}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={dir === "prev" ? "" : "rotate-180"}
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  );
}

/* ---------- step 2: details ---------- */

function DetailsStep({
  form,
  setForm,
  error,
  submitting,
  onBack,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  error: string | null;
  submitting: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="name">
          <input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoComplete="name"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
            placeholder="Jane Operator"
          />
        </Field>
        <Field label="Work email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
            placeholder="jane@meridiangroup.com"
          />
        </Field>
        <Field label="Company" htmlFor="company">
          <input
            id="company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            autoComplete="organization"
            className="h-11 w-full rounded-md border border-hairline bg-white px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
            placeholder="Meridian Restaurant Group"
          />
        </Field>
        <Field label="How many locations?" htmlFor="locations">
          <select
            id="locations"
            value={form.locations}
            onChange={(e) => setForm({ ...form, locations: e.target.value })}
            className={clsx(
              "h-11 w-full appearance-none rounded-md border border-hairline bg-white bg-no-repeat px-3 text-[14px] outline-none transition-colors focus:border-accent",
              form.locations ? "text-ink" : "text-body/60"
            )}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6b6b' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundPosition: "right 12px center",
              backgroundSize: "12px 12px",
              paddingRight: "32px",
            }}
          >
            <option value="">Select a range</option>
            {LOCATION_BUCKETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Anything we should know? (optional)" htmlFor="notes">
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-md border border-hairline bg-white px-3 py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-body/60 focus:border-accent"
          placeholder="States we operate in, license types we struggle with, any current issues…"
        />
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2.5 text-[13px] text-bad"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="font-mono text-[12px] uppercase tracking-wider text-body underline-offset-4 hover:text-ink hover:underline"
        >
          ← Change date or time
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={clsx(
            "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 font-sans text-[14px] font-medium text-white transition-colors",
            submitting
              ? "cursor-not-allowed opacity-70"
              : "hover:border-accent-deep hover:bg-accent-deep"
          )}
        >
          {submitting ? (
            <>
              <Spinner /> Confirming…
            </>
          ) : (
            "Confirm booking"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- step 3: confirmed ---------- */

function ConfirmedStep({
  date,
  slot,
  form,
  tz,
  onAnother,
}: {
  date: Date;
  slot: string;
  form: FormState;
  tz: string;
  onAnother: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mt-5 font-display text-[clamp(28px,3.4vw,40px)] font-light leading-tight text-ink">
        You&apos;re booked.
      </h2>
      <p className="mx-auto mt-3 max-w-[420px] text-[14px] leading-[1.6] text-body">
        A calendar invite is on its way to{" "}
        <span className="text-ink">{form.email}</span> with the Google Meet
        link.
      </p>

      <div className="mx-auto mt-8 max-w-[420px] rounded-xl border border-hairline bg-bgalt/60 p-5 text-left">
        <Detail label="When">
          {formatLongDate(date)} · {formatTimeRange(slot)}
          <span className="ml-2 font-mono text-[11px] text-body">
            ({tz.replace(/_/g, " ")})
          </span>
        </Detail>
        <Detail label="With">Ethan Gardner — Founder, ClearBot</Detail>
        <Detail label="Where">Google Meet (link in your invite)</Detail>
        <Detail label="Topic">
          {form.company || "Your company"} · {form.locations || "—"}
        </Detail>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-full border border-hairline bg-white px-5 font-sans text-[14px] font-medium text-ink hover:bg-bgalt"
        >
          Back to home
        </a>
        <button
          type="button"
          onClick={onAnother}
          className="font-mono text-[12px] uppercase tracking-wider text-body underline-offset-4 hover:text-ink hover:underline"
        >
          Book another time
        </button>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-body"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-hairline py-3 first:border-t-0 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </span>
      <span className="text-[13px] text-ink">{children}</span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.55" />
    </svg>
  );
}

function Icon({ kind }: { kind: "clock" | "video" | "globe" }) {
  if (kind === "clock") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    );
  }
  if (kind === "video") {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="14" height="12" rx="2" />
        <polygon points="22 8 16 12 22 16 22 8" />
      </svg>
    );
  }
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

/* ---------- date/time helpers ---------- */

function stripTime(d?: Date) {
  const t = d ?? new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonth(monthOffset: number) {
  const today = new Date();
  const target = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return { year, month, cells };
}

function buildSlots() {
  const slots: string[] = [];
  for (let h = 9; h <= 16; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${h}:${m === 0 ? "00" : "30"}`);
    }
  }
  return slots;
}

function isSlotAvailable(date: Date, slot: string) {
  // Deterministic "feel real" availability — same slot/date pair always returns the same answer
  const [h, m] = slot.split(":").map(Number);
  const seed = date.getDate() * 31 + h * 7 + m;
  return seed % 7 !== 0;
}

function formatTime(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTimeRange(slot: string) {
  const [h, m] = slot.split(":").map(Number);
  const start = new Date(2000, 0, 1, h, m);
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  const fmt: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  return `${start.toLocaleTimeString([], fmt)} – ${end.toLocaleTimeString([], fmt)}`;
}

function formatLongDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

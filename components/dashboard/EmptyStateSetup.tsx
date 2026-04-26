import Link from "next/link";
import clsx from "clsx";

type Props = {
  hasLocations: boolean;
};

export function EmptyStateSetup({ hasLocations }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-white p-6 shadow-card-lg md:p-10">
      <div className="max-w-[640px]">
        <div className="font-mono text-[10px] uppercase tracking-wider text-body">
          Setup · 3 steps
        </div>
        <h2 className="mt-2 font-display text-[26px] font-light leading-tight tracking-[-0.01em] text-ink md:text-[30px]">
          Start managing your licenses.
        </h2>
        <p className="mt-2 text-[14px] leading-[1.55] text-body">
          Three quick steps and ClearBot starts watching every renewal across every location.
        </p>
      </div>

      <ol className="mt-7 space-y-2.5">
        <Step
          n={1}
          title="Add your first location"
          body="We use the address to auto-derive licensing requirements."
          done={hasLocations}
          href="/dashboard/locations?new=1"
          cta={hasLocations ? "Add another" : "Add location"}
          enabled
        />
        <Step
          n={2}
          title="Add a license"
          body="Pick the license type, due date, and (optionally) the issuing agency."
          done={false}
          href="/dashboard/renewals?new=1"
          cta="Add license"
          enabled={hasLocations}
          disabledHint="Add a location first"
        />
        <Step
          n={3}
          title="Pick automation mode"
          body="Alert (we email reminders), Prep (we draft packets), or Auto (we file end-to-end)."
          done={false}
          href="/dashboard/settings"
          cta="Configure"
          enabled
        />
      </ol>

      <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-hairline pt-5 font-mono text-[11px] text-body">
        <span>Got a spreadsheet?</span>
        <Link
          href="/dashboard/locations"
          className="rounded-md border border-hairline bg-white px-3 py-1.5 uppercase tracking-wider text-body hover:text-ink"
        >
          Import locations from CSV
        </Link>
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  body,
  done,
  href,
  cta,
  enabled,
  disabledHint,
}: {
  n: number;
  title: string;
  body: string;
  done: boolean;
  href: string;
  cta: string;
  enabled: boolean;
  disabledHint?: string;
}) {
  return (
    <li
      className={clsx(
        "flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3.5 transition-colors md:flex-nowrap md:px-5 md:py-4",
        done
          ? "border-ok/30 bg-ok/5"
          : enabled
            ? "border-hairline bg-bgalt/40 hover:bg-bgalt"
            : "border-hairline bg-bgalt/20"
      )}
    >
      <div
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-medium",
          done
            ? "bg-ok text-white"
            : enabled
              ? "bg-ink text-white"
              : "bg-bgalt text-body ring-1 ring-hairline"
        )}
      >
        {done ? <Check /> : n}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-ink">{title}</span>
          {done && (
            <span className="rounded-full bg-ok/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">
              Done
            </span>
          )}
        </div>
        <p className="mt-1 text-[13px] leading-[1.5] text-body">{body}</p>
      </div>
      {enabled ? (
        <Link
          href={href}
          className="ml-auto shrink-0 rounded-full border border-accent bg-accent px-4 py-1.5 font-sans text-[13px] font-medium text-white hover:border-accent-deep hover:bg-accent-deep"
        >
          {done ? cta : `+ ${cta}`}
        </Link>
      ) : (
        <span
          title={disabledHint}
          className="ml-auto shrink-0 cursor-not-allowed rounded-full border border-hairline bg-white px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body"
        >
          {disabledHint ?? cta}
        </span>
      )}
    </li>
  );
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

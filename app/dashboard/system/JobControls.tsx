"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { requeueStale, purgeOldJobs } from "./actions";

export function JobControls() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() =>
          startTransition(async () => {
            const r = await requeueStale();
            if (r.ok) {
              router.refresh();
              if (r.n > 0) alert(`Requeued ${r.n} stale job(s).`);
              else alert("No stale jobs to requeue.");
            } else alert(r.error);
          })
        }
        disabled={pending}
        className={clsx(
          "rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink",
          pending && "opacity-70"
        )}
      >
        Requeue stale
      </button>
      <button
        onClick={() => {
          if (!confirm("Purge done/cancelled/failed jobs older than 7 days?")) return;
          startTransition(async () => {
            const r = await purgeOldJobs();
            if (r.ok) {
              router.refresh();
              alert(`Purged ${r.n} job row(s).`);
            } else alert(r.error);
          });
        }}
        disabled={pending}
        className={clsx(
          "rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink",
          pending && "opacity-70"
        )}
      >
        Purge old
      </button>
    </div>
  );
}

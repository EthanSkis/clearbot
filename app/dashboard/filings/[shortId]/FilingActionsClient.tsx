"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/Dialog";
import { advanceFilingStage, regeneratePacket, rejectFiling } from "../actions";
import { getSignedUrl } from "@/app/dashboard/documents/actions";

export function FilingActionsClient(props: {
  filingId: string;
  shortId: string;
  stage: string;
  packet: { id: string; storage_path: string | null } | null;
  isRejected: boolean;
  mode: "alert" | "prep" | "auto";
}) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  function refresh() {
    startTransition(() => router.refresh());
  }

  const advanceLabel =
    props.stage === "intake"
      ? "Mark prep"
      : props.stage === "prep"
        ? "Approve packet"
        : props.stage === "review"
          ? "Send to submit"
          : props.stage === "submit"
            ? "Mark confirmed"
            : props.stage === "confirm"
              ? "Mark done"
              : "Advance";

  return (
    <section className="flex flex-wrap items-center gap-2 rounded-xl border border-hairline bg-bgalt/40 px-4 py-3">
      {props.packet?.storage_path && (
        <button
          onClick={async () => {
            const r = await getSignedUrl(props.packet!.storage_path!);
            if (!r.ok) {
              await dialog.alert({ title: "Could not open packet", body: r.error, tone: "danger" });
              return;
            }
            window.open(r.url, "_blank", "noopener,noreferrer");
          }}
          className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          View packet
        </button>
      )}
      {(props.mode === "prep" || props.mode === "auto") && (
        <button
          onClick={async () => {
            const r = await regeneratePacket(props.filingId);
            if (!r.ok) {
              await dialog.alert({ title: "Could not enqueue packet", body: r.error, tone: "danger" });
            } else {
              dialog.toast({ body: "Packet regeneration queued." });
              refresh();
            }
          }}
          className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Regenerate packet
        </button>
      )}
      {!props.isRejected && props.stage !== "done" && (
        <button
          onClick={async () => {
            const r = await advanceFilingStage(props.filingId);
            if (!r.ok) {
              await dialog.alert({ title: "Could not advance", body: r.error, tone: "danger" });
            } else {
              dialog.toast({ body: `${props.shortId} advanced.` });
              refresh();
            }
          }}
          className="ml-auto rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep"
        >
          {advanceLabel}
        </button>
      )}
      {!props.isRejected && props.stage !== "done" && (
        <button
          onClick={async () => {
            const reason = await dialog.prompt({
              title: "Reject this filing",
              body: "Capture why so the workspace activity log has the trail.",
              label: "Reason",
              required: true,
              confirmLabel: "Reject",
            });
            if (!reason) return;
            const r = await rejectFiling(props.filingId, reason);
            if (!r.ok) {
              await dialog.alert({ title: "Could not reject", body: r.error, tone: "danger" });
            } else {
              dialog.toast({ body: "Filing rejected." });
              refresh();
            }
          }}
          className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Reject
        </button>
      )}
    </section>
  );
}

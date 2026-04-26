"use client";

import { useDialog } from "@/components/ui/Dialog";
import { getSignedUrl } from "@/app/dashboard/documents/actions";

export function OpenDocumentButton({ storagePath }: { storagePath: string | null }) {
  const dialog = useDialog();
  if (!storagePath) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-wider text-body/60">
        no file
      </span>
    );
  }
  return (
    <button
      onClick={async () => {
        const r = await getSignedUrl(storagePath);
        if (!r.ok) {
          await dialog.alert({ title: "Could not open document", body: r.error, tone: "danger" });
          return;
        }
        window.open(r.url, "_blank", "noopener,noreferrer");
      }}
      className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
    >
      Open
    </button>
  );
}

"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createClient } from "@/lib/supabase/client";
import { deleteDocument, getAuditPackUrls, getSignedUrl, registerDocument } from "./actions";

export type DocumentRow = {
  id: string;
  name: string;
  kind: "certificate" | "receipt" | "application" | "correspondence";
  size_bytes: number;
  created_at: string;
  storage_path: string | null;
  location: { name: string; city: string | null; state: string | null } | null;
  license: { license_type: string } | null;
};

const KIND_LABEL: Record<DocumentRow["kind"], string> = {
  certificate: "Certificate",
  receipt: "Receipt",
  application: "Application",
  correspondence: "Correspondence",
};

export function DocumentsClient({
  rows,
  workspaceId,
  storageQuotaGb,
}: {
  rows: DocumentRow[];
  workspaceId: string;
  storageQuotaGb: number;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | DocumentRow["kind"]>("all");
  const [uploading, setUploading] = useState(false);

  const totalBytes = rows.reduce((s, r) => s + r.size_bytes, 0);
  const usedGb = totalBytes / 1024 / 1024 / 1024;
  const usagePct = Math.min(100, (usedGb / storageQuotaGb) * 100);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q);
      const matchesKind = kindFilter === "all" || r.kind === kindFilter;
      return matchesSearch && matchesKind;
    });
  }, [rows, search, kindFilter]);

  const folderCounts = useMemo(() => {
    return rows.reduce<Record<DocumentRow["kind"], number>>(
      (acc, r) => {
        acc[r.kind] = (acc[r.kind] ?? 0) + 1;
        return acc;
      },
      { certificate: 0, receipt: 0, application: 0, correspondence: 0 }
    );
  }, [rows]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const supabase = createClient();
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const cleanName = file.name.slice(0, 200);
        const path = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) {
          alert(`Upload failed: ${uploadError.message}`);
          continue;
        }
        const kind = inferKind(cleanName);
        const r = await registerDocument({
          storagePath: path,
          name: cleanName,
          kind,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
        if (!r.ok) alert(r.error);
      }
      refresh();
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function downloadDocument(row: DocumentRow) {
    if (!row.storage_path) return;
    const r = await getSignedUrl(row.storage_path);
    if (!r.ok) {
      alert(r.error);
      return;
    }
    window.open(r.url, "_blank");
  }

  async function downloadAll() {
    const r = await getAuditPackUrls();
    if (!r.ok) {
      alert(r.error);
      return;
    }
    if (r.urls.length === 0) {
      alert("Nothing to export yet.");
      return;
    }
    // Open each URL in a new tab — simple but reliable without an extra zip lib.
    r.urls.forEach((u, i) => {
      setTimeout(() => window.open(u.url, "_blank"), i * 250);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadAll}
          className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Download all
        </button>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className={clsx(
            "rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white",
            uploading ? "opacity-70" : "hover:bg-accent-deep"
          )}
        >
          {uploading ? "Uploading…" : "+ Upload"}
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.keys(folderCounts) as DocumentRow["kind"][]).map((kind) => (
          <button
            key={kind}
            onClick={() => setKindFilter(kindFilter === kind ? "all" : kind)}
            className={clsx(
              "group flex items-center gap-3 rounded-xl border p-4 text-left shadow-card transition-colors",
              kindFilter === kind
                ? "border-accent bg-accent-soft"
                : "border-hairline bg-white hover:border-ink/20"
            )}
          >
            <FolderIcon kind={kind} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-ink">{KIND_LABEL[kind]}s</div>
              <div className="font-mono text-[11px] text-body">{folderCounts[kind]} files</div>
            </div>
          </button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] text-ink outline-none focus:border-accent"
            />
            {kindFilter !== "all" && (
              <button
                onClick={() => setKindFilter("all")}
                className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <div className="hidden grid-cols-[2.4fr_1fr_1.2fr_0.5fr_0.6fr_0.4fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
              <div>Document</div>
              <div>Kind</div>
              <div>Linked</div>
              <div className="text-right">Size</div>
              <div className="text-right">Uploaded</div>
              <div></div>
            </div>
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center font-mono text-[12px] text-body">
                No documents yet. Upload a certificate, receipt, or correspondence file to start an audit trail.
              </div>
            ) : (
              <ul className="divide-y divide-hairline">
                {filtered.map((d) => (
                  <li
                    key={d.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[2.4fr_1fr_1.2fr_0.5fr_0.6fr_0.4fr]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileIcon />
                      <div className="min-w-0">
                        <button
                          onClick={() => downloadDocument(d)}
                          className="block truncate text-left text-[13px] font-medium text-ink hover:text-accent-deep"
                        >
                          {d.name}
                        </button>
                        <div className="truncate font-mono text-[10px] text-body">
                          {d.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">
                        {KIND_LABEL[d.kind]}
                      </span>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      <div className="truncate text-[12px] text-ink">
                        {d.license?.license_type ?? "—"}
                      </div>
                      <div className="truncate font-mono text-[10px] text-body">
                        {d.location ? `${d.location.name} · ${d.location.city}, ${d.location.state}` : ""}
                      </div>
                    </div>
                    <div className="hidden text-right font-mono text-[11px] tabular-nums text-body md:block">
                      {formatBytes(d.size_bytes)}
                    </div>
                    <div className="hidden text-right font-mono text-[11px] text-body md:block">
                      {timeAgo(d.created_at)}
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={async () => {
                          if (!confirm(`Delete ${d.name}?`)) return;
                          const r = await deleteDocument(d.id);
                          if (!r.ok) alert(r.error);
                          else refresh();
                        }}
                        className="rounded border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Storage</div>
            <div className="mt-2 font-display text-[28px] font-light text-ink">
              {usedGb.toFixed(usedGb < 1 ? 2 : 1)} GB
            </div>
            <div className="mt-1 font-mono text-[11px] text-body">
              of {storageQuotaGb} GB included
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bgalt">
              <div className="h-full bg-accent" style={{ width: `${usagePct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Retention</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink">
              <li className="flex justify-between">
                <span>Certificates</span>
                <span className="font-mono text-body">Forever</span>
              </li>
              <li className="flex justify-between">
                <span>Receipts</span>
                <span className="font-mono text-body">10 years</span>
              </li>
              <li className="flex justify-between">
                <span>Correspondence</span>
                <span className="font-mono text-body">7 years</span>
              </li>
              <li className="flex justify-between">
                <span>Drafts</span>
                <span className="font-mono text-body">90 days</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">Audit pack</div>
            <p className="mt-2 text-[13px] leading-[1.55] text-ink">
              Generate signed URLs for every document in this workspace.
            </p>
            <button
              onClick={downloadAll}
              className="mt-3 w-full rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
            >
              Generate audit pack
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}

function inferKind(name: string): DocumentRow["kind"] {
  const lower = name.toLowerCase();
  if (lower.includes("receipt") || lower.includes("payment")) return "receipt";
  if (lower.includes("application") || lower.includes("renewal")) return "application";
  if (lower.endsWith(".eml") || lower.includes("email") || lower.includes("correspondence"))
    return "correspondence";
  return "certificate";
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 7 * 86_400_000) return `${Math.floor(ms / 86_400_000)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function FolderIcon({ kind }: { kind: DocumentRow["kind"] }) {
  const color =
    kind === "certificate"
      ? "#7ab833"
      : kind === "receipt"
        ? "#d97706"
        : kind === "application"
          ? "#111110"
          : "#6b6b6b";
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <rect x="4" y="10" width="32" height="24" rx="3" fill={color} opacity="0.12" />
      <rect x="4" y="10" width="32" height="24" rx="3" fill="none" stroke={color} strokeOpacity="0.4" />
      <path d="M4 12 L14 12 L16 14 L36 14" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b6b6b" strokeWidth="1.5" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

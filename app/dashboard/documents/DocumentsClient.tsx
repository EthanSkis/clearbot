"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import JSZip from "jszip";
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
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [auditPack, setAuditPack] = useState<AuditPackState | null>(null);
  const [viewer, setViewer] = useState<
    | { doc: DocumentRow; status: "loading" }
    | { doc: DocumentRow; status: "ready"; url: string }
    | { doc: DocumentRow; status: "error"; error: string }
    | null
  >(null);

  function patchUpload(id: string, patch: Partial<UploadEntry>) {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function dismissUpload(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token ?? apiKey;

    const queue = Array.from(files).map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const path = `${workspaceId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const id = `${path}`;
      return { id, file, path };
    });

    setUploads((prev) => [
      ...prev,
      ...queue.map(({ id, file }) => ({
        id,
        name: file.name,
        size: file.size,
        pct: 0,
        status: "uploading" as const,
      })),
    ]);

    let registeredAny = false;

    try {
      for (const { id, file, path } of queue) {
        const cleanName = file.name.slice(0, 200);
        const uploadResult = await uploadFileWithProgress({
          supabaseUrl,
          apiKey,
          accessToken,
          path,
          file,
          onProgress: (pct) => patchUpload(id, { pct }),
        });
        if (!uploadResult.ok) {
          patchUpload(id, { status: "error", error: uploadResult.error });
          continue;
        }
        patchUpload(id, { pct: 100, status: "registering" });
        const kind = inferKind(cleanName);
        const r = await registerDocument({
          storagePath: path,
          name: cleanName,
          kind,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
        if (!r.ok) {
          patchUpload(id, { status: "error", error: r.error });
          continue;
        }
        registeredAny = true;
        patchUpload(id, { status: "done" });
        const finishedId = id;
        setTimeout(() => dismissUpload(finishedId), 2500);
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
      if (registeredAny) refresh();
    }
  }

  async function openViewer(row: DocumentRow) {
    if (!row.storage_path) {
      setViewer({ doc: row, status: "error", error: "No file is attached to this document." });
      return;
    }
    setViewer({ doc: row, status: "loading" });
    const r = await getSignedUrl(row.storage_path);
    setViewer((current) => {
      if (!current || current.doc.id !== row.id) return current;
      if (!r.ok) return { doc: row, status: "error", error: r.error };
      return { doc: row, status: "ready", url: r.url };
    });
  }

  async function generateAuditPack() {
    if (auditPack && auditPack.phase !== "done" && auditPack.phase !== "error") return;
    setAuditPack({ phase: "preparing", total: 0, completed: 0 });
    const r = await getAuditPackUrls();
    if (!r.ok) {
      setAuditPack({ phase: "error", total: 0, completed: 0, error: r.error });
      return;
    }
    if (r.items.length === 0) {
      setAuditPack({
        phase: "error",
        total: 0,
        completed: 0,
        error: "Nothing to export yet — upload a document first.",
      });
      return;
    }
    const total = r.items.length;
    setAuditPack({ phase: "fetching", total, completed: 0 });

    const zip = new JSZip();
    const folder = (kind: AuditPackItem["kind"]) =>
      ({
        certificate: "certificates",
        receipt: "receipts",
        application: "applications",
        correspondence: "correspondence",
      })[kind];

    const manifestRows: string[][] = [
      ["filename", "kind", "license", "location", "uploaded_at", "size_bytes", "path_in_zip"],
    ];
    const usedNames = new Set<string>();
    let okCount = 0;

    for (let i = 0; i < r.items.length; i++) {
      const item = r.items[i];
      try {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const safeName = uniqueName(item.name, usedNames);
        const pathInZip = `${folder(item.kind)}/${safeName}`;
        zip.file(pathInZip, blob);
        manifestRows.push([
          safeName,
          item.kind,
          item.license_type ?? "",
          item.location ?? "",
          item.uploaded_at,
          String(item.size_bytes),
          pathInZip,
        ]);
        okCount++;
      } catch (err) {
        manifestRows.push([
          item.name,
          item.kind,
          item.license_type ?? "",
          item.location ?? "",
          item.uploaded_at,
          String(item.size_bytes),
          `(failed: ${err instanceof Error ? err.message : "unknown"})`,
        ]);
      }
      setAuditPack({ phase: "fetching", total, completed: i + 1 });
    }

    const manifestCsv = manifestRows
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    zip.file("manifest.csv", manifestCsv);
    zip.file(
      "README.txt",
      [
        `ClearBot audit pack`,
        `Workspace: ${r.workspace}`,
        `Generated: ${new Date(r.generatedAt).toLocaleString()}`,
        `Documents bundled: ${okCount} of ${total}`,
        ``,
        `Folder layout:`,
        `  certificates/   – issued license certificates`,
        `  receipts/       – payment receipts`,
        `  applications/   – submitted applications`,
        `  correspondence/ – emails and letters`,
        `  manifest.csv    – index of every file in this archive`,
      ].join("\n")
    );

    setAuditPack({ phase: "zipping", total, completed: total });
    const blob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      (meta) => {
        setAuditPack({
          phase: "zipping",
          total,
          completed: total,
          zipPct: meta.percent,
        });
      }
    );

    const stamp = new Date().toISOString().slice(0, 10);
    const safeWorkspace = r.workspace.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "workspace";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeWorkspace}-audit-pack-${stamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setAuditPack({ phase: "done", total, completed: total, ok: okCount });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={generateAuditPack}
          disabled={isAuditPackBusy(auditPack)}
          className={clsx(
            "rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink",
            isAuditPackBusy(auditPack) && "cursor-not-allowed opacity-60"
          )}
        >
          {auditPackButtonLabel(auditPack)}
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
                          onClick={() => openViewer(d)}
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
              One ZIP with every document grouped by kind, plus a manifest.csv index and a README. Ready for an auditor.
            </p>
            <button
              onClick={generateAuditPack}
              disabled={isAuditPackBusy(auditPack)}
              className={clsx(
                "mt-3 w-full rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white",
                isAuditPackBusy(auditPack) ? "cursor-not-allowed opacity-70" : "hover:bg-accent-deep"
              )}
            >
              {auditPackButtonLabel(auditPack)}
            </button>
          </div>
        </aside>
      </section>

      {viewer && <DocumentViewer state={viewer} onClose={() => setViewer(null)} />}
      <UploadProgressPanel
        uploads={uploads}
        onDismiss={dismissUpload}
      />
      <AuditPackPanel
        state={auditPack}
        onDismiss={() => setAuditPack(null)}
        hasUploads={uploads.length > 0}
      />
    </>
  );
}

type AuditPackState =
  | { phase: "preparing"; total: number; completed: number }
  | { phase: "fetching"; total: number; completed: number }
  | { phase: "zipping"; total: number; completed: number; zipPct?: number }
  | { phase: "done"; total: number; completed: number; ok: number }
  | { phase: "error"; total: number; completed: number; error: string };

type AuditPackItem = {
  id: string;
  name: string;
  kind: "certificate" | "receipt" | "application" | "correspondence";
  url: string;
  size_bytes: number;
  uploaded_at: string;
  location: string | null;
  license_type: string | null;
};

function isAuditPackBusy(state: AuditPackState | null) {
  return Boolean(state && state.phase !== "done" && state.phase !== "error");
}

function auditPackButtonLabel(state: AuditPackState | null) {
  if (!state) return "Generate audit pack";
  if (state.phase === "preparing") return "Preparing…";
  if (state.phase === "fetching") return `Bundling ${state.completed}/${state.total}…`;
  if (state.phase === "zipping") {
    const pct = state.zipPct !== undefined ? Math.floor(state.zipPct) : null;
    return pct !== null ? `Zipping ${pct}%…` : "Zipping…";
  }
  if (state.phase === "done") return "Generate audit pack";
  return "Try again";
}

function uniqueName(name: string, used: Set<string>) {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  let i = 2;
  while (used.has(`${stem} (${i})${ext}`)) i++;
  const result = `${stem} (${i})${ext}`;
  used.add(result);
  return result;
}

function AuditPackPanel({
  state,
  onDismiss,
  hasUploads,
}: {
  state: AuditPackState | null;
  onDismiss: () => void;
  hasUploads?: boolean;
}) {
  if (!state) return null;
  const pct =
    state.phase === "fetching"
      ? state.total > 0
        ? (state.completed / state.total) * 90
        : 0
      : state.phase === "zipping"
        ? 90 + ((state.zipPct ?? 0) / 100) * 10
        : state.phase === "done"
          ? 100
          : state.phase === "preparing"
            ? 4
            : 100;

  const heading =
    state.phase === "preparing"
      ? "Preparing audit pack…"
      : state.phase === "fetching"
        ? `Fetching ${state.completed} of ${state.total}…`
        : state.phase === "zipping"
          ? "Zipping…"
          : state.phase === "done"
            ? "Audit pack downloaded"
            : "Audit pack failed";

  const isBusy = state.phase !== "done" && state.phase !== "error";

  return (
    <div
      className={clsx(
        "fixed right-4 z-40 w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl",
        hasUploads ? "bottom-[348px]" : "bottom-4",
        state.phase === "error" ? "border-bad/40" : "border-hairline"
      )}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          {isBusy ? <Spinner /> : state.phase === "done" ? <CheckMark /> : <ErrorMark />}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Audit pack</div>
            <div className="font-display text-[14px] font-light text-ink">{heading}</div>
          </div>
        </div>
        {!isBusy && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded p-1 text-body hover:bg-bgalt hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-4 pb-3">
        <div className="h-1 overflow-hidden rounded-full bg-bgalt">
          <div
            className={clsx(
              "h-full transition-[width] duration-200 ease-out",
              state.phase === "error"
                ? "bg-bad"
                : state.phase === "done"
                  ? "bg-ok"
                  : "bg-accent"
            )}
            style={{ width: `${Math.max(2, pct)}%` }}
          />
        </div>
        {state.phase === "error" && (
          <div className="mt-2 rounded-md border border-bad/30 bg-bad/5 px-2 py-1 text-[11px] text-bad">
            {state.error}
          </div>
        )}
        {state.phase === "done" && (
          <div className="mt-2 font-mono text-[11px] text-body">
            {state.ok} of {state.total} document{state.total === 1 ? "" : "s"} bundled. Check your downloads folder.
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-bad">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

type UploadEntry = {
  id: string;
  name: string;
  size: number;
  pct: number;
  status: "uploading" | "registering" | "done" | "error";
  error?: string;
};

function uploadFileWithProgress({
  supabaseUrl,
  apiKey,
  accessToken,
  path,
  file,
  onProgress,
}: {
  supabaseUrl: string;
  apiKey: string;
  accessToken: string;
  path: string;
  file: File;
  onProgress: (pct: number) => void;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const url = `${supabaseUrl}/storage/v1/object/documents/${path
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.min(99, (e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve({ ok: true });
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body && typeof body.message === "string") message = body.message;
      } catch {
        /* ignore */
      }
      resolve({ ok: false, error: message });
    };
    xhr.onerror = () => resolve({ ok: false, error: "Network error during upload." });
    xhr.onabort = () => resolve({ ok: false, error: "Upload aborted." });
    xhr.send(file);
  });
}

function UploadProgressPanel({
  uploads,
  onDismiss,
}: {
  uploads: UploadEntry[];
  onDismiss: (id: string) => void;
}) {
  if (uploads.length === 0) return null;
  const active = uploads.filter((u) => u.status === "uploading" || u.status === "registering").length;
  return (
    <div className="fixed bottom-4 right-4 z-40 w-[360px] overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-2">
          {active > 0 ? <Spinner /> : <CheckMark />}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Uploads</div>
            <div className="font-display text-[14px] font-light text-ink">
              {active > 0
                ? `${active} of ${uploads.length} in progress`
                : `${uploads.length} complete`}
            </div>
          </div>
        </div>
        {active === 0 && (
          <button
            type="button"
            onClick={() => uploads.forEach((u) => onDismiss(u.id))}
            className="rounded p-1 text-body hover:bg-bgalt hover:text-ink"
            aria-label="Dismiss all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      <ul className="max-h-[280px] divide-y divide-hairline overflow-y-auto">
        {uploads.map((u) => (
          <li key={u.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{u.name}</div>
                <div className="font-mono text-[10px] text-body">
                  {formatBytes(u.size)} ·{" "}
                  {u.status === "uploading"
                    ? `${Math.floor(u.pct)}%`
                    : u.status === "registering"
                      ? "Finalizing…"
                      : u.status === "done"
                        ? "Done"
                        : "Error"}
                </div>
              </div>
              {u.status === "error" && (
                <button
                  type="button"
                  onClick={() => onDismiss(u.id)}
                  aria-label="Dismiss"
                  className="rounded p-1 text-body hover:bg-bgalt hover:text-ink"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              {u.status === "done" && <CheckMark />}
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-bgalt">
              <div
                className={clsx(
                  "h-full transition-[width] duration-200 ease-out",
                  u.status === "error"
                    ? "bg-bad"
                    : u.status === "done"
                      ? "bg-ok"
                      : u.status === "registering"
                        ? "animate-pulse bg-accent"
                        : "bg-accent"
                )}
                style={{
                  width: `${
                    u.status === "error" || u.status === "done" || u.status === "registering"
                      ? 100
                      : Math.max(2, u.pct)
                  }%`,
                }}
              />
            </div>
            {u.status === "error" && u.error && (
              <div className="mt-2 rounded-md border border-bad/30 bg-bad/5 px-2 py-1 text-[11px] text-bad">
                {u.error}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin text-accent">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-ok">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

type ViewerKind = "pdf" | "image" | "text" | "audio" | "video" | "office" | "html" | "other";

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "ico"];
const TEXT_EXT = [
  "txt", "csv", "tsv", "json", "md", "markdown", "log", "xml", "yml", "yaml",
  "ini", "toml", "env", "conf", "rtf", "tex", "eml", "ics",
  // code
  "js", "mjs", "cjs", "jsx", "ts", "tsx", "py", "rb", "go", "rs",
  "java", "kt", "swift", "c", "h", "cc", "cpp", "hpp", "cs",
  "css", "scss", "sass", "less", "html", "htm", "vue", "svelte",
  "sh", "bash", "zsh", "ps1", "bat", "cmd", "sql", "graphql", "gql",
  "php", "lua", "pl", "r", "scala", "dart", "diff", "patch",
];
const AUDIO_EXT = ["mp3", "wav", "ogg", "oga", "m4a", "flac", "aac", "weba"];
const VIDEO_EXT = ["mp4", "webm", "ogv", "mov", "m4v"];
const OFFICE_EXT = ["doc", "docx", "xls", "xlsx", "xlsm", "ppt", "pptx", "odt", "ods", "odp"];

function viewerKindFor(name: string): ViewerKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (AUDIO_EXT.includes(ext)) return "audio";
  if (VIDEO_EXT.includes(ext)) return "video";
  if (OFFICE_EXT.includes(ext)) return "office";
  if (ext === "html" || ext === "htm") return "html";
  if (TEXT_EXT.includes(ext)) return "text";
  return "other";
}

function DocumentViewer({
  state,
  onClose,
}: {
  state:
    | { doc: DocumentRow; status: "loading" }
    | { doc: DocumentRow; status: "ready"; url: string }
    | { doc: DocumentRow; status: "error"; error: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const { doc } = state;
  const kind = viewerKindFor(doc.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-ink/50 p-4 md:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">
              {KIND_LABEL[doc.kind]} · {formatBytes(doc.size_bytes)}
            </div>
            <div className="mt-0.5 truncate font-display text-[18px] font-light text-ink">
              {doc.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {state.status === "ready" && (
              <>
                <a
                  href={state.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                >
                  Open in tab
                </a>
                <a
                  href={state.url}
                  download={doc.name}
                  className="rounded-md border border-accent bg-accent px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white hover:bg-accent-deep"
                >
                  Download
                </a>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-2 text-body hover:bg-bgalt hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-auto bg-bgalt/40">
          {state.status === "loading" && (
            <div className="font-mono text-[12px] text-body">Generating signed URL…</div>
          )}
          {state.status === "error" && (
            <div className="rounded-md border border-bad/30 bg-bad/5 px-4 py-3 font-mono text-[12px] text-bad">
              {state.error}
            </div>
          )}
          {state.status === "ready" && kind === "pdf" && (
            <iframe
              src={state.url}
              title={doc.name}
              className="h-[78vh] w-full border-0 bg-white"
            />
          )}
          {state.status === "ready" && kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.url}
              alt={doc.name}
              className="max-h-[78vh] w-auto object-contain"
            />
          )}
          {state.status === "ready" && kind === "text" && (
            <iframe
              src={state.url}
              title={doc.name}
              className="h-[78vh] w-full border-0 bg-white"
            />
          )}
          {state.status === "ready" && kind === "html" && (
            <iframe
              src={state.url}
              title={doc.name}
              sandbox="allow-same-origin"
              className="h-[78vh] w-full border-0 bg-white"
            />
          )}
          {state.status === "ready" && kind === "audio" && (
            <div className="flex w-full flex-col items-center gap-4 px-6 py-12">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={state.url} className="w-full max-w-[480px]" />
              <p className="font-mono text-[11px] text-body">{doc.name}</p>
            </div>
          )}
          {state.status === "ready" && kind === "video" && (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              controls
              src={state.url}
              className="max-h-[78vh] w-full bg-ink object-contain"
            />
          )}
          {state.status === "ready" && kind === "office" && (
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(state.url)}`}
              title={doc.name}
              className="h-[78vh] w-full border-0 bg-white"
            />
          )}
          {state.status === "ready" && kind === "other" && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <FileIcon />
              <div className="font-display text-[18px] font-light text-ink">
                Preview not available for this file type.
              </div>
              <p className="max-w-[360px] text-[13px] text-body">
                Use Download or Open in tab to view {doc.name}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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

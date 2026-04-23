import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";

export const metadata: Metadata = { title: "Documents · ClearBot" };

type Doc = {
  id: string;
  name: string;
  kind: "Certificate" | "Receipt" | "Application" | "Correspondence";
  license: string;
  location: string;
  size: string;
  updated: string;
};

const DOCS: Doc[] = [
  { id: "D-0091", name: "Liquor_License_2026_Chicago.pdf", kind: "Certificate", license: "Liquor License", location: "Chicago, IL", size: "412 KB", updated: "2h ago" },
  { id: "D-0090", name: "Health_Permit_Austin_Q2.pdf", kind: "Certificate", license: "Health Permit", location: "Austin, TX", size: "287 KB", updated: "today" },
  { id: "D-0089", name: "Payment_Receipt_TX_DSHS.pdf", kind: "Receipt", license: "Health Permit", location: "Austin, TX", size: "94 KB", updated: "today" },
  { id: "D-0088", name: "Tobacco_Retailer_Miami_Renewal.pdf", kind: "Application", license: "Tobacco Retailer", location: "Miami, FL", size: "1.1 MB", updated: "1d ago" },
  { id: "D-0087", name: "Email_TXABC_2026-04-17.eml", kind: "Correspondence", license: "Liquor License", location: "Dallas, TX", size: "32 KB", updated: "4d ago" },
  { id: "D-0086", name: "Occupancy_Cert_Denver_2026.pdf", kind: "Certificate", license: "Building Occupancy", location: "Denver, CO", size: "602 KB", updated: "1w ago" },
  { id: "D-0085", name: "Sign_Permit_CHI_Receipt.pdf", kind: "Receipt", license: "Sign Permit", location: "Chicago, IL", size: "76 KB", updated: "1w ago" },
  { id: "D-0084", name: "Fire_Inspection_ATL_Report.pdf", kind: "Correspondence", license: "Fire Inspection", location: "Atlanta, GA", size: "1.4 MB", updated: "2w ago" },
];

const FOLDERS = [
  { name: "Certificates", count: 146, kind: "cert" as const },
  { name: "Agency receipts", count: 312, kind: "receipt" as const },
  { name: "Submitted applications", count: 164, kind: "app" as const },
  { name: "Correspondence", count: 89, kind: "mail" as const },
];

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="711 documents · 18.4 GB"
        title={<>Every filing, <span className="italic">forever.</span></>}
        subtitle="Every certificate, every receipt, every agency email — stored per-tenant, AES-256 at rest, immutable audit trail."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Download all (ZIP)
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              + Upload
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {FOLDERS.map((f) => (
          <div key={f.name} className="group flex items-center gap-3 rounded-xl border border-hairline bg-white p-4 shadow-card transition-colors hover:border-ink/20">
            <FolderIcon kind={f.kind} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-ink">{f.name}</div>
              <div className="font-mono text-[11px] text-body">{f.count} files</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <SectionHeader
            title="Recent documents"
            subtitle="Auto-linked to the license, location, and filing they belong to."
            right={
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  placeholder="Search documents…"
                  className="h-8 w-48 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] text-ink outline-none focus:border-accent"
                />
                <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                  Sort
                </button>
              </div>
            }
          />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <div className="hidden grid-cols-[2.4fr_1fr_1.2fr_0.5fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
              <div>Document</div>
              <div>Kind</div>
              <div>Linked</div>
              <div className="text-right">Size</div>
              <div className="text-right">Updated</div>
            </div>
            <ul className="divide-y divide-hairline">
              {DOCS.map((d) => (
                <li key={d.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3 md:grid-cols-[2.4fr_1fr_1.2fr_0.5fr_0.6fr]">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileIcon />
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">{d.name}</div>
                      <div className="truncate font-mono text-[10px] text-body">{d.id}</div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">
                      {d.kind}
                    </span>
                  </div>
                  <div className="hidden min-w-0 md:block">
                    <div className="truncate text-[12px] text-ink">{d.license}</div>
                    <div className="truncate font-mono text-[10px] text-body">{d.location}</div>
                  </div>
                  <div className="hidden text-right font-mono text-[11px] tabular-nums text-body md:block">{d.size}</div>
                  <div className="text-right font-mono text-[11px] text-body">{d.updated}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Storage</div>
            <div className="mt-2 font-display text-[28px] font-light text-ink">18.4 GB</div>
            <div className="mt-1 font-mono text-[11px] text-body">of 100 GB included</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-bgalt">
              <div className="h-full bg-accent" style={{ width: "18%" }} />
            </div>
          </div>
          <div className="rounded-2xl border border-hairline bg-white p-5 shadow-card">
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">Retention</div>
            <ul className="mt-3 space-y-2 text-[13px] text-ink">
              <li className="flex justify-between"><span>Certificates</span><span className="font-mono text-body">Forever</span></li>
              <li className="flex justify-between"><span>Receipts</span><span className="font-mono text-body">10 years</span></li>
              <li className="flex justify-between"><span>Correspondence</span><span className="font-mono text-body">7 years</span></li>
              <li className="flex justify-between"><span>Drafts</span><span className="font-mono text-body">90 days</span></li>
            </ul>
          </div>
          <div className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
            <div className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">Audit pack</div>
            <p className="mt-2 text-[13px] leading-[1.55] text-ink">
              Generate an auditor-ready PDF bundle with every filing, receipt, and agency confirmation for any date range.
            </p>
            <button className="mt-3 w-full rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Generate audit pack
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}

function FolderIcon({ kind }: { kind: "cert" | "receipt" | "app" | "mail" }) {
  const color = kind === "cert" ? "#7ab833" : kind === "receipt" ? "#d97706" : kind === "app" ? "#111110" : "#6b6b6b";
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

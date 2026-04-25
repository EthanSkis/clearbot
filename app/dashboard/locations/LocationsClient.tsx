"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { Pill } from "@/components/ui/Pill";
import { useDialog } from "@/components/ui/Dialog";
import {
  createLocation,
  deleteLocation,
  importLocationsCsv,
  updateLocation,
} from "./actions";

export type LocationRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  address_line1: string | null;
  zip: string | null;
  tag: string | null;
  opened_year: number | null;
  status: string;
  licenses: number;
  overdue: number;
  due: number;
  manager_name: string | null;
};

type Filter = "all" | "attention";

export function LocationsClient({ rows }: { rows: LocationRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialog = useDialog();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LocationRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null);
      setDrawerOpen(true);
    }
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.city ?? "").toLowerCase().includes(q) ||
        (r.state ?? "").toLowerCase().includes(q);
      const matchesFilter = filter === "all" || r.overdue + r.due > 0;
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const attentionCount = rows.filter((r) => r.overdue + r.due > 0).length;

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(row: LocationRow) {
    setEditing(row);
    setDrawerOpen(true);
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <>
      <FilterBar
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        all={rows.length}
        attention={attentionCount}
        onNew={openCreate}
        onImport={() => fileInputRef.current?.click()}
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="hidden grid-cols-[1.8fr_1fr_0.7fr_0.7fr_0.6fr_0.7fr_0.5fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>Location</div>
          <div>City · State</div>
          <div className="text-right">Licenses</div>
          <div>Health</div>
          <div>Tag</div>
          <div>Opened</div>
          <div className="text-right">Actions</div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <ul className="divide-y divide-hairline">
            {filtered.map((row) => {
              const health: "ok" | "warn" | "bad" =
                row.overdue > 0 ? "bad" : row.due > 0 ? "warn" : "ok";
              const label = row.overdue > 0
                ? `${row.overdue} overdue`
                : row.due > 0
                  ? `${row.due} due`
                  : "All current";
              return (
                <li
                  key={row.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[1.8fr_1fr_0.7fr_0.7fr_0.6fr_0.7fr_0.5fr]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-ink">{row.name}</div>
                    <div className="truncate font-mono text-[11px] text-body md:hidden">
                      {row.city}, {row.state}
                    </div>
                  </div>
                  <div className="hidden font-mono text-[12px] text-body md:block">
                    {row.city}, {row.state}
                  </div>
                  <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
                    {row.licenses}
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <Pill tone={health} withDot>
                      {label}
                    </Pill>
                  </div>
                  <div className="hidden md:block">
                    <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">
                      {row.tag}
                    </span>
                  </div>
                  <div className="hidden font-mono text-[11px] text-body md:block">
                    {row.opened_year ?? "—"}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="rounded border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await dialog.confirm({
                          title: `Remove ${row.name}?`,
                          body: "This deletes every license and filing tied to this location. This can't be undone.",
                          confirmLabel: "Delete",
                          tone: "danger",
                        });
                        if (!ok) return;
                        const r = await deleteLocation(row.id);
                        if (!r.ok) {
                          await dialog.alert({ title: "Could not delete location", body: r.error, tone: "danger" });
                        } else {
                          dialog.toast({ body: `Removed ${row.name}.`, tone: "success" });
                          refresh();
                        }
                      }}
                      className="rounded border border-bad/30 bg-bad/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-bad hover:bg-bad/10"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
          <span>
            Showing {filtered.length} of {rows.length}
          </span>
          {isPending && <span>Refreshing…</span>}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const text = await file.text();
          const parsed = parseCsv(text);
          const result = await importLocationsCsv(parsed);
          if (!result.ok) {
            await dialog.alert({ title: "Import failed", body: result.error, tone: "danger" });
          } else {
            dialog.toast({
              body: `Imported ${result.inserted} location${result.inserted === 1 ? "" : "s"}.`,
              tone: "success",
            });
            refresh();
          }
          e.target.value = "";
        }}
      />

      {drawerOpen && (
        <LocationDrawer
          editing={editing}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => {
            setDrawerOpen(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function FilterBar({
  search,
  setSearch,
  filter,
  setFilter,
  all,
  attention,
  onNew,
  onImport,
}: {
  search: string;
  setSearch: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
  all: number;
  attention: number;
  onNew: () => void;
  onImport: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={clsx(
          "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
          filter === "all"
            ? "border border-ink bg-ink text-white"
            : "border border-hairline bg-white text-body hover:text-ink"
        )}
      >
        All {all}
      </button>
      <button
        type="button"
        onClick={() => setFilter("attention")}
        className={clsx(
          "rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
          filter === "attention"
            ? "border border-ink bg-ink text-white"
            : "border border-hairline bg-white text-body hover:text-ink"
        )}
      >
        Needs attention · {attention}
      </button>
      <input
        type="search"
        placeholder="Filter…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="ml-auto h-8 w-48 rounded-md border border-hairline bg-white px-3 font-sans text-[12px] text-ink outline-none focus:border-accent"
      />
      <button
        onClick={onImport}
        className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
      >
        Import CSV
      </button>
      <button
        onClick={onNew}
        className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
      >
        + New location
      </button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
      <div className="font-display text-[20px] font-light text-ink">No locations yet.</div>
      <p className="max-w-[420px] text-[13px] text-body">
        Add your first location to start tracking renewals. We&apos;ll auto-derive licensing
        requirements from the address.
      </p>
      <button
        onClick={onCreate}
        className="mt-2 rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
      >
        + Add a location
      </button>
    </div>
  );
}

function LocationDrawer({
  editing,
  onClose,
  onSaved,
}: {
  editing: LocationRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [city, setCity] = useState(editing?.city ?? "");
  const [state, setState] = useState(editing?.state ?? "");
  const [zip, setZip] = useState(editing?.zip ?? "");
  const [address, setAddress] = useState(editing?.address_line1 ?? "");
  const [tag, setTag] = useState(editing?.tag ?? "Flagship");
  const [openedYear, setOpenedYear] = useState<string>(
    editing?.opened_year ? String(editing.opened_year) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name,
      city,
      state,
      addressLine1: address,
      zip,
      tag,
      openedYear: openedYear ? Number(openedYear) : null,
    };
    const result = editing
      ? await updateLocation(editing.id, payload)
      : await createLocation(payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-ink/40">
      <div className="flex w-full max-w-[460px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-hairline px-5 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-body">
              {editing ? "Edit location" : "New location"}
            </div>
            <div className="mt-0.5 font-display text-[20px] font-light text-ink">
              {editing ? editing.name : "Add a new location"}
            </div>
          </div>
          <button onClick={onClose} className="rounded p-2 text-body hover:bg-bgalt hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form id="location-form" onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto p-5">
          <Field label="Location name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wrigleyville Tap"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Street">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="3540 N Clark St"
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <input
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Chicago"
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
            <Field label="State">
              <input
                required
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="IL"
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
            <Field label="ZIP">
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="60613"
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opened year">
              <input
                value={openedYear}
                onChange={(e) => setOpenedYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                placeholder="2019"
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
            <Field label="Tag">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              >
                <option>Flagship</option>
                <option>Franchise</option>
                <option>Concept</option>
                <option>New build</option>
              </select>
            </Field>
          </div>

          {error && (
            <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">
              {error}
            </div>
          )}
        </form>

        <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-bgalt/40 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="location-form"
            disabled={saving}
            className={clsx(
              "rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white",
              saving ? "opacity-70" : "hover:bg-accent-deep"
            )}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create location"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </span>
      {children}
    </label>
  );
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]).map((c) => c.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const out: Record<string, string> = {};
    header.forEach((h, i) => {
      out[h] = (cells[i] ?? "").trim();
    });
    return out;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else if (ch === '"') {
      quoted = true;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

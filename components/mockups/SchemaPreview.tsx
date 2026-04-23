import { DATA_SCHEMA } from "@/lib/data";

export function SchemaPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg">
      <div className="flex items-center justify-between border-b border-hairline bg-bgalt/60 px-5 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-body">
          schema · public.licenses
        </span>
        <span className="font-mono text-[11px] text-body">
          {DATA_SCHEMA.length} columns
        </span>
      </div>
      <div className="grid grid-cols-[1.1fr_0.7fr_1.4fr] gap-4 border-b border-hairline px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
        <span>Column</span>
        <span>Type</span>
        <span>Note</span>
      </div>
      <ul className="divide-y divide-hairline">
        {DATA_SCHEMA.map((row) => (
          <li
            key={row.col}
            className="grid grid-cols-[1.1fr_0.7fr_1.4fr] items-center gap-4 px-5 py-3"
          >
            <span className="truncate font-mono text-[12px] text-ink">
              {row.col}
            </span>
            <span className="truncate font-mono text-[11px] text-accent-deep">
              {row.type}
            </span>
            <span className="truncate text-[12px] text-body">{row.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { LiveDot } from "@/components/ui/LiveDot";

const COL = {
  Product: ["Overview", "Coverage map", "Integrations", "Changelog"],
  Company: ["About", "Customers", "Careers", "Press"],
  Legal: ["Terms", "Privacy", "Security", "DPA"],
};

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-bg">
      <div className="mx-auto w-full max-w-content px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <a href="#top" className="flex items-center gap-2.5">
              <LiveDot size={8} />
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                ClearBot
              </span>
            </a>
            <p className="mt-3 max-w-[220px] font-mono text-[12px] leading-relaxed text-body">
              Business license renewals, automated.
            </p>
            <p className="mt-6 font-mono text-[11px] text-body">
              © {new Date().getFullYear()} ClearBot, Inc.
            </p>
          </div>
          {(Object.keys(COL) as (keyof typeof COL)[]).map((heading) => (
            <div key={heading}>
              <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-ink">
                {heading}
              </div>
              <ul className="space-y-2.5">
                {COL[heading].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-[13px] text-body transition-colors hover:text-ink"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

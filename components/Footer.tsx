import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

type LinkItem = { label: string; href: string };

const COL: Record<string, LinkItem[]> = {
  Product: [
    { label: "Overview", href: "/product" },
    { label: "Pricing", href: "/pricing" },
    { label: "Coverage map", href: "/map" },
    { label: "Data product", href: "/data" },
  ],
  Company: [
    { label: "Customers", href: "/#customers" },
    { label: "Book a call", href: "/book" },
    { label: "Sign in", href: "/login" },
    { label: "Email us", href: "mailto:ethan@clearbot.io" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-bg">
      <div className="mx-auto w-full max-w-content px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={22} />
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                ClearBot
              </span>
            </Link>
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
                  <li key={item.label}>
                    <FooterLink href={item.href}>{item.label}</FooterLink>
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

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("mailto:") || href.startsWith("http");
  const cls =
    "text-[13px] text-body transition-colors hover:text-ink";
  if (isExternal) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

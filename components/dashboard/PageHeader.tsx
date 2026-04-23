import { type ReactNode } from "react";
import { LiveDot } from "@/components/ui/LiveDot";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-body">
            <LiveDot size={6} />
            {eyebrow}
          </div>
        )}
        <h1 className="mt-2 font-display text-[clamp(26px,3.2vw,36px)] font-light leading-[1.05] tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-[620px] text-[14px] leading-[1.55] text-body">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-[22px] font-light leading-tight tracking-[-0.005em] text-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-[560px] text-[13px] leading-[1.55] text-body">
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

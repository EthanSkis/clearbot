import clsx from "clsx";
import { type ReactNode } from "react";

type Tone = "accent" | "ok" | "warn" | "bad" | "neutral";

const toneMap: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent-deep",
  ok: "bg-[#e7f7e9] text-ok",
  warn: "bg-[#fdf1d9] text-warn",
  bad: "bg-[#fde3e3] text-bad",
  neutral: "bg-bgalt text-body border border-hairline",
};

type Props = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  withDot?: boolean;
};

export function Pill({ children, tone = "neutral", className, withDot }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide",
        toneMap[tone],
        className
      )}
    >
      {withDot && (
        <span
          className={clsx(
            "h-1.5 w-1.5 rounded-full",
            tone === "ok" && "bg-ok",
            tone === "warn" && "bg-warn",
            tone === "bad" && "bg-bad",
            tone === "accent" && "bg-accent",
            tone === "neutral" && "bg-body"
          )}
        />
      )}
      {children}
    </span>
  );
}

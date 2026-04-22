import clsx from "clsx";

type Props = {
  className?: string;
  size?: number;
  color?: "accent" | "ok" | "warn" | "bad";
};

const colorMap = {
  accent: "bg-accent",
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
} as const;

export function LiveDot({ className, size = 8, color = "accent" }: Props) {
  return (
    <span
      className={clsx("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className={clsx(
          "absolute inset-0 rounded-full opacity-60 animate-ping",
          colorMap[color]
        )}
      />
      <span
        className={clsx(
          "relative inline-block rounded-full",
          colorMap[color]
        )}
        style={{ width: size, height: size }}
      />
    </span>
  );
}

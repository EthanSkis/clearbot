import clsx from "clsx";
import { type AnchorHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const base =
  "inline-flex items-center justify-center gap-2 font-sans font-medium rounded-full whitespace-nowrap transition-colors duration-150 select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-deep border border-accent hover:border-accent-deep",
  secondary:
    "bg-white text-ink border border-hairline hover:bg-bgalt",
  ghost: "text-ink hover:text-accent-deep",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-11 px-5 text-[14px]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: Props) {
  return (
    <a
      className={clsx(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </a>
  );
}

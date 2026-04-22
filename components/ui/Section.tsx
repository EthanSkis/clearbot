import clsx from "clsx";
import { type ReactNode } from "react";

type Props = {
  id?: string;
  children: ReactNode;
  alt?: boolean;
  className?: string;
  innerClassName?: string;
  full?: boolean;
};

export function Section({ id, children, alt, className, innerClassName, full }: Props) {
  return (
    <section
      id={id}
      className={clsx(
        "w-full",
        alt ? "bg-bgalt" : "bg-bg",
        "py-20 md:py-[120px]",
        className
      )}
    >
      <div
        className={clsx(
          full ? "w-full" : "mx-auto w-full max-w-content px-6",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

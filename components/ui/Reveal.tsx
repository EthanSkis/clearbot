"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
};

export function Reveal({ children, delay = 0, className, as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setShown(true));
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as;
  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={clsx(
        "transform-gpu transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}

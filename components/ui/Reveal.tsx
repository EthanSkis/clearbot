"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  ...rest
}: Props) {
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

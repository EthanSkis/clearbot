"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
} & Omit<HTMLMotionProps<"div">, "children" | "className">;

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  ...rest
}: Props) {
  const reduce = useReducedMotion();
  const narrow = useIsNarrow();
  const Comp = motion[as] as typeof motion.div;

  if (reduce || narrow) {
    return (
      <Comp className={className} {...rest}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}

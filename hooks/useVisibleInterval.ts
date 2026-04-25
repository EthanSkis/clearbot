"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useVisibleInterval(
  callback: () => void,
  ms: number,
  ref: RefObject<Element>
) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let id: number | null = null;
    let visible = false;
    let pageVisible = document.visibilityState === "visible";

    const start = () => {
      if (id == null && visible && pageVisible) {
        id = window.setInterval(() => cb.current(), ms);
      }
    };
    const stop = () => {
      if (id != null) {
        window.clearInterval(id);
        id = null;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && pageVisible) start();
        else stop();
      },
      { threshold: 0 }
    );
    io.observe(el);

    const onVis = () => {
      pageVisible = document.visibilityState === "visible";
      if (visible && pageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ms, ref]);
}

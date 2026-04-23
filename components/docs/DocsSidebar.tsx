"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { DOC_SECTIONS } from "./nav";

export function DocsSidebar() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const allIds = DOC_SECTIONS.flatMap((s) =>
      s.items.map((i) => i.href.slice(1))
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );
    allIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="lg:sticky lg:top-[96px] lg:h-[calc(100vh-96px)] lg:overflow-y-auto lg:pr-2">
      <nav className="space-y-6 border-b border-hairline pb-6 lg:border-b-0 lg:pb-0">
        {DOC_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-body">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const id = item.href.slice(1);
                const isActive = active === id;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={clsx(
                        "block rounded-md px-2.5 py-1.5 text-[13px] leading-tight transition-colors",
                        isActive
                          ? "bg-ink font-medium text-white"
                          : "text-body hover:bg-bgalt hover:text-ink"
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

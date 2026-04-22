"use client";

import { motion } from "framer-motion";
import { LiveDot } from "@/components/ui/LiveDot";

type Mode = "alert" | "prep" | "auto";

export function AutomationModeIllustration({ mode }: { mode: Mode }) {
  return (
    <div className="flex h-[180px] w-full items-center justify-center rounded-xl border border-hairline bg-bgalt/60 p-5">
      {mode === "alert" && <AlertVisual />}
      {mode === "prep" && <PrepVisual />}
      {mode === "auto" && <AutoVisual />}
    </div>
  );
}

function AlertVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[260px] rounded-lg border border-hairline bg-white p-3 shadow-card"
    >
      <div className="flex items-start gap-3">
        <LiveDot size={8} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Renewal alert · 14d
          </div>
          <div className="mt-1 truncate text-[13px] font-medium text-ink">
            Liquor License · Chicago, IL
          </div>
          <div className="mt-1 truncate font-mono text-[10px] text-body">
            Action required by Mar 14
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PrepVisual() {
  return (
    <div className="w-full max-w-[260px] rounded-lg border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">
        Renewal packet · ready
      </div>
      <div className="mt-3 space-y-2">
        {[
          { label: "Business name", w: "w-32" },
          { label: "License #", w: "w-20" },
          { label: "Address", w: "w-28" },
          { label: "Fee", w: "w-16" },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: i * 0.15 }}
            className="flex items-center justify-between border-b border-hairline pb-1.5"
          >
            <span className="font-mono text-[10px] text-body">{f.label}</span>
            <span className={`h-2 ${f.w} rounded-sm bg-ink/80`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AutoVisual() {
  return (
    <div className="w-full max-w-[260px] overflow-hidden rounded-lg border border-hairline bg-white shadow-card">
      <div className="flex items-center gap-1.5 border-b border-hairline bg-bgalt/60 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-bad/40" />
        <span className="h-2 w-2 rounded-full bg-warn/40" />
        <span className="h-2 w-2 rounded-full bg-ok/40" />
        <span className="ml-2 truncate font-mono text-[9px] text-body">
          tabc.texas.gov/renew
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="h-2 w-3/4 rounded-sm bg-ink/15" />
        <div className="h-2 w-2/3 rounded-sm bg-ink/15" />
        <div className="h-2 w-1/2 rounded-sm bg-ink/15" />
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "auto", opacity: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.6,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 1.4,
          }}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-white"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Submitted
        </motion.div>
      </div>
    </div>
  );
}

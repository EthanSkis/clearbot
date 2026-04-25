"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";

type Tone = "default" | "danger" | "success";

type ConfirmOptions = {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type AlertOptions = {
  title: string;
  body?: ReactNode;
  tone?: Tone;
  confirmLabel?: string;
};

type PromptOptions = {
  title: string;
  body?: ReactNode;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  required?: boolean;
};

type ToastOptions = {
  body: string;
  tone?: Tone;
  duration?: number;
};

type DialogState =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "alert"; opts: AlertOptions; resolve: () => void }
  | { kind: "prompt"; opts: PromptOptions; resolve: (v: string | null) => void };

type ToastEntry = { id: number; body: string; tone: Tone };

type Api = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: AlertOptions) => Promise<void>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
  toast: (opts: ToastOptions) => void;
};

const Ctx = createContext<Api | null>(null);

export function useDialog(): Api {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<Api>(
    () => ({
      confirm: (opts) =>
        new Promise<boolean>((resolve) => {
          setDialog({
            kind: "confirm",
            opts,
            resolve: (v) => {
              setDialog(null);
              resolve(v);
            },
          });
        }),
      alert: (opts) =>
        new Promise<void>((resolve) => {
          setDialog({
            kind: "alert",
            opts,
            resolve: () => {
              setDialog(null);
              resolve();
            },
          });
        }),
      prompt: (opts) =>
        new Promise<string | null>((resolve) => {
          setDialog({
            kind: "prompt",
            opts,
            resolve: (v) => {
              setDialog(null);
              resolve(v);
            },
          });
        }),
      toast: ({ body, tone = "default", duration = 3500 }) => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, body, tone }]);
        window.setTimeout(() => dismissToast(id), duration);
      },
    }),
    [dismissToast]
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {dialog && <DialogModal state={dialog} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </Ctx.Provider>
  );
}

function DialogModal({ state }: { state: DialogState }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const [value, setValue] = useState(
    state.kind === "prompt" ? state.opts.defaultValue ?? "" : ""
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (state.kind === "prompt") inputRef.current?.focus();
    else confirmRef.current?.focus();
  }, [state.kind]);

  function dismiss() {
    if (state.kind === "alert") state.resolve();
    else if (state.kind === "confirm") state.resolve(false);
    else state.resolve(null);
  }

  function accept() {
    if (state.kind === "alert") state.resolve();
    else if (state.kind === "confirm") state.resolve(true);
    else {
      if (state.opts.required && !value.trim()) {
        inputRef.current?.focus();
        return;
      }
      state.resolve(value);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key === "Enter" && state.kind !== "prompt") {
        e.preventDefault();
        accept();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, value]);

  const dangerTone =
    (state.kind === "confirm" && state.opts.tone === "danger") ||
    (state.kind === "alert" && state.opts.tone === "danger");
  const successTone = state.kind === "alert" && state.opts.tone === "success";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={state.opts.title}
      onClick={dismiss}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-hairline bg-white shadow-2xl"
      >
        <header className="flex items-start gap-3 border-b border-hairline px-5 py-4">
          <DialogIcon tone={dangerTone ? "danger" : successTone ? "success" : "default"} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[18px] font-light leading-tight text-ink">
              {state.opts.title}
            </h2>
            {state.opts.body && (
              <div className="mt-1 text-[13px] leading-[1.55] text-body">{state.opts.body}</div>
            )}
          </div>
        </header>

        {state.kind === "prompt" && (
          <div className="px-5 py-4">
            {state.opts.label && (
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-body">
                {state.opts.label}
                {!state.opts.required && (
                  <span className="ml-1 text-body/70">(optional)</span>
                )}
              </label>
            )}
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  accept();
                }
              }}
              placeholder={state.opts.placeholder}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 font-sans text-[13px] text-ink outline-none focus:border-accent"
            />
          </div>
        )}

        <footer className="flex items-center justify-end gap-2 border-t border-hairline bg-bgalt/40 px-5 py-3">
          {state.kind !== "alert" && (
            <button
              ref={cancelRef}
              type="button"
              onClick={dismiss}
              className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              {state.kind === "confirm"
                ? state.opts.cancelLabel ?? "Cancel"
                : state.opts.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={accept}
            className={clsx(
              "rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
              dangerTone
                ? "border-bad/40 bg-bad/10 text-bad hover:bg-bad/15"
                : successTone
                  ? "border-ok/40 bg-ok/10 text-ok hover:bg-ok/15"
                  : "border-accent bg-accent text-white hover:bg-accent-deep"
            )}
          >
            {state.kind === "confirm"
              ? state.opts.confirmLabel ?? "Confirm"
              : state.kind === "prompt"
                ? state.opts.confirmLabel ?? "Submit"
                : state.opts.confirmLabel ?? "OK"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function DialogIcon({ tone }: { tone: Tone }) {
  if (tone === "danger") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </span>
    );
  }
  if (tone === "success") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </span>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastEntry[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[110] flex w-full max-w-[360px] -translate-x-1/2 flex-col items-stretch gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={clsx(
            "pointer-events-auto flex items-start gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3 shadow-2xl",
            t.tone === "danger"
              ? "border-bad/40"
              : t.tone === "success"
                ? "border-ok/40"
                : "border-hairline"
          )}
        >
          <ToastIcon tone={t.tone} />
          <div className="flex-1 text-[13px] leading-snug text-ink">{t.body}</div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="rounded p-1 text-body hover:bg-bgalt hover:text-ink"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function ToastIcon({ tone }: { tone: Tone }) {
  if (tone === "danger") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bad/10 text-bad">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  if (tone === "success") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-deep">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </span>
  );
}

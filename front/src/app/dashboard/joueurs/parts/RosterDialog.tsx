"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function RosterDialog({
  title,
  subtitle,
  drawer = false,
  busy = false,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  drawer?: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
      className={`fixed border border-white/10 bg-dark-secondary p-0 text-white shadow-2xl backdrop:bg-black/65 backdrop:backdrop-blur-sm ${
        drawer
          ? "inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-none sm:w-[30rem] sm:rounded-l-2xl"
          : "inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg rounded-2xl"
      }`}
    >
      <div
        className={`flex min-h-0 flex-col ${drawer ? "h-full" : "max-h-[90dvh]"}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-5 sm:p-6">
          <div className="min-w-0">
            {subtitle && (
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-accent-green">
                {subtitle}
              </p>
            )}
            <h2 id={titleId} className="break-words text-xl font-semibold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fermer"
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-green disabled:opacity-40"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap gap-3 border-t border-white/10 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

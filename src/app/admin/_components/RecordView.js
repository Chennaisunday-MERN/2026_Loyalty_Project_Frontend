"use client";

import { LayoutGrid, List, X } from "lucide-react";

export function ViewToggle({ view, onChange }) {
  const base = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors";
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={`${base} ${view === "grid" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        <LayoutGrid size={14} />
        Grid
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`${base} ${view === "list" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
      >
        <List size={14} />
        List
      </button>
    </div>
  );
}

export function RecordCard({ title, subtitle, badge, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-shadow hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</div>}
        </div>
        {badge}
      </div>
      {children && <div className="mt-3 w-full space-y-1.5 text-sm text-slate-600">{children}</div>}
    </button>
  );
}

export function CardField({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <span className="truncate text-sm text-slate-700">{value}</span>
    </div>
  );
}

export function DetailModal({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 bg-slate-50 px-6 py-3">{footer}</div>}
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, Search } from "lucide-react";

/* ============================================================
   Shared UI kit — matches the Lead Operations Dashboard design
   (slate/blue palette, rounded-xl cards, soft shadows).
   Use these primitives on every SaleteamDasboard page so the
   look stays consistent.
   ============================================================ */

/* ---------- Page shell ---------- */

export function PageShell({ children, className = "" }) {
  return (
    <div className="px-4 py-6 sm:px-6">
      <div className={`mx-auto max-w-7xl space-y-6 ${className}`}>{children}</div>
    </div>
  );
}

/* ---------- Page header (eyebrow + title + subtitle + actions) ---------- */

export function PageHeader({ eyebrow, title, subtitle, actions, onBack }) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {onBack && <BackButton onClick={onBack} className="mb-3" />}
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ---------- Back button ---------- */

export function BackButton({ onClick, label = "Back", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 ${className}`}
    >
      <ChevronLeft size={16} className="text-slate-400" />
      {label}
    </button>
  );
}

/* ---------- Buttons ---------- */

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------- Card ---------- */

export function Card({ children, className = "", padded = true }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${padded ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Search input ---------- */

export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ---------- Status / value badge ---------- */

const BADGE_TONES = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700",
  slate: "bg-slate-100 text-slate-700",
};

export function Badge({ children, tone = "slate", className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${BADGE_TONES[tone] || BADGE_TONES.slate} ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------- Table primitives ---------- */

export function TableWrap({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return <td className={`border-b border-slate-100 px-4 py-3 text-slate-700 ${className}`}>{children}</td>;
}

/* ---------- State blocks ---------- */

export function LoadingBlock({ label = "Loading…" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
      {label}
    </div>
  );
}

export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>
  );
}

export function EmptyState({ title = "Nothing here yet", subtitle }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

/* ---------- Read-only field (for profile-style displays) ---------- */

export function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="flex items-center gap-2.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5">
        {Icon && <Icon size={18} className="shrink-0 text-slate-400" />}
        <div className="min-w-0 flex-1 text-sm font-medium text-slate-800">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminShell({ title, subtitle, actions, children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                type="button"
                onClick={() => router.push("/admin/adminDasboard")}
                className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Admin workspace</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </section>
        {children}
      </div>
    </div>
  );
}

export function AdminPanel({ title, subtitle, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {(title || subtitle) && (
        <div className="border-b border-slate-200 px-5 py-4">
          {title && <h2 className="text-base font-semibold text-slate-950">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export const adminInputClass = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";
export const adminPrimaryButtonClass = "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700";
export const adminSecondaryButtonClass = "rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100";

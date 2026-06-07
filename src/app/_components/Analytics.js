"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";

/* ---------- KPI stat card ---------- */

export function StatCard({ label, value, sub, icon: Icon, color = "text-slate-900", iconColor = "text-slate-400" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon size={16} className={iconColor} />}
      </div>
      <div className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/* ---------- Chart card wrapper ---------- */

export function ChartCard({ title, subtitle, icon: Icon, titleColor = "text-blue-700", iconBg = "bg-blue-50 text-blue-600", children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={`text-base font-semibold ${titleColor}`}>{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {Icon && <span className={`rounded-lg p-2 ${iconBg}`}><Icon size={16} /></span>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/* ---------- Donut chart (SVG) ---------- */

export function DonutChart({ data, centerLabel = "Total" }) {
  const entries = data.filter((d) => d.value > 0);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {total === 0 ? (
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          ) : (
            entries.map((d) => {
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const segment = (
                <circle
                  key={d.label}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return segment;
            })
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.label} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Bar chart (SVG) ---------- */

export function BarChart({ data, color = "#6ee7b7", height = 200 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = 4;

  return (
    <div>
      <div className="flex" style={{ height }}>
        <div className="flex w-8 flex-col justify-between pb-6 pr-2 text-right text-[10px] text-slate-400">
          {Array.from({ length: ticks + 1 }, (_, i) => (
            <span key={i}>{((max * (ticks - i)) / ticks).toFixed(1)}</span>
          ))}
        </div>
        <div className="flex flex-1 items-stretch">
          {data.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">No data</div>
          ) : (
            data.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-6 rounded-full sm:w-8"
                  style={{ height: `${(d.value / max) * (height - 40)}px`, backgroundColor: color, minHeight: d.value > 0 ? 6 : 0 }}
                  title={`${d.label}: ${d.value}`}
                />
                <span className="h-6 truncate text-center text-[10px] text-slate-500" style={{ maxWidth: 64 }}>{d.label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Line / area chart (SVG) ---------- */

export function LineChart({ data, stroke = "#6366f1", fill = "rgba(99,102,241,0.15)", height = 200 }) {
  const width = 600;
  const padX = 8;
  const padY = 12;
  const max = Math.max(1, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;
  const pointFor = (d, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - d.value / max) * (height - padY * 2);
    return [x, y];
  };
  const points = data.map(pointFor);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = points.length
    ? `${path} L${points[points.length - 1][0]},${height - padY} L${points[0][0]},${height - padY} Z`
    : "";

  return (
    <div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center text-sm text-slate-400" style={{ height }}>No data</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#e2e8f0" strokeWidth="1" />
          {area && <path d={area} fill={fill} />}
          <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill={stroke} />
          ))}
        </svg>
      )}
      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
        {data.map((d, i) => (
          <span key={i} className={data.length > 10 && i % 2 === 1 ? "hidden sm:inline" : ""}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Lead enquiry cards with filters ---------- */

const stageLabelMap = {
  "Enquiry-1stage": "New",
  "Enquiry-2stage": "Assigned",
  "Enquiry-3stage": "Quotation",
  "Enquiry-4thstage": "Converted",
};

const stageChipOrder = ["All", "New", "Assigned", "Quotation", "Converted"];

const priorityBadge = {
  High: "bg-red-500 text-white",
  Medium: "bg-amber-400 text-amber-950",
  Low: "bg-emerald-500 text-white",
};

const typeBadge = {
  Product: "bg-violet-50 text-violet-700",
  Project: "bg-blue-50 text-blue-700",
  Service: "bg-amber-50 text-amber-700",
};

export function normalizeLeadPriority(value) {
  const priority = String(value || "").toLowerCase();
  if (priority === "hot" || priority === "high") return "High";
  if (priority === "warm" || priority === "medium") return "Medium";
  return "Low";
}

export function stageOf(lead) {
  return stageLabelMap[lead.Status] || "New";
}

export function EnquiryCards({ leads, title = "Recent Enquiries", subtitle = "Click any card to view full details", renderActions, renderHeaderExtra, renderExtra, onView, pageSize }) {
  const [priorityFilter, setPriorityFilterState] = useState("All");
  const [typeFilter, setTypeFilterState] = useState("All");
  const [stageFilter, setStageFilterState] = useState("All");
  const [page, setPage] = useState(1);

  const setPriorityFilter = (value) => { setPriorityFilterState(value); setPage(1); };
  const setTypeFilter = (value) => { setTypeFilterState(value); setPage(1); };
  const setStageFilter = (value) => { setStageFilterState(value); setPage(1); };

  const stageCounts = useMemo(() => {
    const counts = { All: leads.length, New: 0, Assigned: 0, Quotation: 0, Converted: 0 };
    leads.forEach((lead) => { counts[stageOf(lead)] += 1; });
    return counts;
  }, [leads]);

  const filtered = useMemo(() => leads.filter((lead) => {
    if (stageFilter !== "All" && stageOf(lead) !== stageFilter) return false;
    if (priorityFilter !== "All" && normalizeLeadPriority(lead?.LeadDetails?.LeadPriority) !== priorityFilter) return false;
    if (typeFilter !== "All" && (lead?.LeadDetails?.EnquiryType || "N/A") !== typeFilter) return false;
    return true;
  }), [leads, stageFilter, priorityFilter, typeFilter]);

  const activeCount = leads.filter((lead) => stageOf(lead) !== "Converted").length;
  const selectClass = "rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none";

  const totalPages = pageSize ? Math.max(1, Math.ceil(filtered.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages);
  const paged = pageSize ? filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize) : filtered;

  const paginationRange = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    if (totalPages > 1) {
      range.unshift(1);
      range.push(totalPages);
    }
    return range;
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className={selectClass}>
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
            <option value="All">All Types</option>
            <option value="Product">Product</option>
            <option value="Project">Project</option>
            <option value="Service">Service</option>
          </select>
          <span className="rounded-full bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm">
            {activeCount} Active Lead{activeCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {stageChipOrder.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStageFilter(stage)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              stageFilter === stage
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {stage} ({stageCounts[stage] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
          No enquiries match the current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((lead) => (
            <LeadCard
              key={lead._id || lead.EnquiryNo}
              lead={lead}
              onView={onView}
              actions={renderActions ? renderActions(lead) : null}
              headerExtra={renderHeaderExtra ? renderHeaderExtra(lead) : null}
              extra={renderExtra ? renderExtra(lead) : null}
            />
          ))}
        </div>
      )}

      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-center">
          <nav className="inline-flex -space-x-px overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm" aria-label="Pagination">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center border-r border-slate-200 px-3 py-2 text-sm font-medium ${
                currentPage === 1 ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </button>
            {paginationRange().map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => (typeof p === "number" ? setPage(p) : null)}
                disabled={p === "..."}
                className={`relative inline-flex items-center border-r border-slate-200 px-4 py-2 text-sm font-medium ${
                  p === currentPage
                    ? "z-10 bg-slate-900 text-white"
                    : p === "..."
                    ? "cursor-default text-slate-400"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                currentPage === totalPages ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      )}
    </section>
  );
}

export function LeadCard({ lead, onView, actions, headerExtra, extra }) {
  const priority = normalizeLeadPriority(lead?.LeadDetails?.LeadPriority);
  const stage = stageOf(lead);
  const type = lead?.LeadDetails?.EnquiryType;
  const city = lead?.AddressDetails?.City;
  const state = lead?.AddressDetails?.State;
  const location = [city, state].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold uppercase tracking-wide">
              {lead?.LeadDetails?.companyName || "N/A"}
            </div>
            <div className="mt-0.5 truncate text-xs text-blue-100">{lead?.LeadDetails?.clientName || "N/A"}</div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerExtra}
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${priorityBadge[priority]}`}>
              {priority}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold">{stage}</span>
          <span className="text-[10px] font-medium text-blue-100">{lead.EnquiryNo}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-4 py-3 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-2">
            <Phone size={14} className="shrink-0 text-slate-400" />
            <span className="truncate">{lead?.ContactDetails?.MobileNumber || "N/A"}</span>
          </span>
          {type && <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${typeBadge[type] || "bg-slate-100 text-slate-600"}`}>{type}</span>}
        </div>
        <span className="inline-flex min-w-0 items-center gap-2">
          <Mail size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{lead?.ContactDetails?.PrimaryMail || "N/A"}</span>
        </span>
        <span className="inline-flex min-w-0 items-center gap-2">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{location || "N/A"}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <Calendar size={14} className="shrink-0 text-slate-400" />
          <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}</span>
        </span>
      </div>

      {extra && <div className="border-t border-slate-100 px-4 py-3">{extra}</div>}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5">
        <button
          type="button"
          onClick={() => onView && onView(lead)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
        >
          <Eye size={14} />
          View Full Details
        </button>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function LeadDeleteButton({ onDelete }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
    >
      <Trash2 size={14} />
      Delete
    </button>
  );
}

/* ---------- Detail dl helpers ---------- */

export function DetailItem({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value ?? "N/A"}</dd>
    </div>
  );
}

/* ---------- Lead detail modal (gradient design) ---------- */

function InfoRow({ label, value, full = false }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-0.5 break-words text-base font-semibold text-slate-900">{value || "N/A"}</div>
    </div>
  );
}

function InfoSection({ icon: Icon, iconColor, title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon size={18} className={iconColor} />
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function ConversionPrompt({ onYes, onNo }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
      <div className="mb-1 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-emerald-600" />
        <h3 className="text-lg font-bold text-slate-900">Customer Conversion</h3>
      </div>
      <p className="mb-4 text-sm text-slate-600">Has this enquiry been converted to a customer?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onYes}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-emerald-600"
        >
          <CheckCircle2 size={16} />
          Yes - Converted
        </button>
        <button
          type="button"
          onClick={onNo}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-red-700 hover:to-rose-600"
        >
          <XCircle size={16} />
          No - Not Converted
        </button>
      </div>
    </div>
  );
}

export function LeadDetailModal({ lead, open, onClose, conversionSection, footerExtra }) {
  if (!open || !lead) return null;
  const priority = normalizeLeadPriority(lead?.LeadDetails?.LeadPriority);
  const stage = stageOf(lead);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
          <h2 className="text-lg font-semibold">Enquiry #{lead.EnquiryNo}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-blue-100 hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto bg-slate-50/60 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 px-5 py-6 text-center">
              <div className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Stage</div>
              <div className="mt-2 text-2xl font-bold text-emerald-700">{stage}</div>
            </div>
            <div className="rounded-xl bg-violet-50 px-5 py-6 text-center">
              <div className="text-sm font-semibold uppercase tracking-widest text-violet-600">Priority</div>
              <div className="mt-2 text-2xl font-bold text-violet-700">{priority}</div>
            </div>
          </div>

          <InfoSection icon={Users} iconColor="text-indigo-600" title="Lead Information">
            <InfoRow label="Client Name" value={lead?.LeadDetails?.clientName} />
            <InfoRow label="Department" value={lead?.LeadDetails?.Department} />
            <InfoRow label="Company" value={lead?.LeadDetails?.companyName} />
            <InfoRow label="Enquiry Type" value={lead?.LeadDetails?.EnquiryType} />
            <InfoRow label="Lead Medium" value={lead?.LeadDetails?.LeadMedium} />
            <InfoRow label="Date" value={lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"} />
            <InfoRow label="Lead Condition" value={lead?.LeadDetails?.Leadcondition} />
            <InfoRow label="Assigned To" value={lead.Eid || "Unassigned"} />
          </InfoSection>

          <InfoSection icon={Activity} iconColor="text-emerald-600" title="Contact Information">
            <InfoRow label="Mobile Number" value={lead?.ContactDetails?.MobileNumber} />
            <InfoRow label="Alternate Number" value={lead?.ContactDetails?.AlternateMobileNumber} />
            <InfoRow label="Primary Mail" value={lead?.ContactDetails?.PrimaryMail} />
            <InfoRow label="Secondary Mail" value={lead?.ContactDetails?.SecondaryMail} />
          </InfoSection>

          <InfoSection icon={MapPin} iconColor="text-blue-600" title="Address Information">
            <InfoRow label="Address" value={lead?.AddressDetails?.Address} full />
            <InfoRow label="City" value={lead?.AddressDetails?.City} />
            <InfoRow label="State" value={lead?.AddressDetails?.State} />
            <InfoRow label="Country" value={lead?.AddressDetails?.Country} />
            <InfoRow label="Postal Code" value={lead?.AddressDetails?.PostalCode} />
          </InfoSection>

          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <div className="mb-2 flex items-center gap-2">
              <FileText size={18} className="text-amber-600" />
              <h3 className="text-lg font-bold text-slate-900">Remarks</h3>
            </div>
            <p className="text-sm text-slate-700">{lead?.DescriptionDetails || "Not in records"}</p>
          </div>

          {conversionSection}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          {footerExtra}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Chart data builders ---------- */

export function buildStageDonut(leads) {
  const counts = { New: 0, Assigned: 0, Quotation: 0, Converted: 0 };
  leads.forEach((lead) => { counts[stageOf(lead)] += 1; });
  return [
    { label: "New", value: counts.New, color: "#818cf8" },
    { label: "Assigned", value: counts.Assigned, color: "#6366f1" },
    { label: "Quotation", value: counts.Quotation, color: "#34d399" },
    { label: "Converted", value: counts.Converted, color: "#fbbf24" },
  ];
}

export function buildPriorityDonut(leads) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  leads.forEach((lead) => { counts[normalizeLeadPriority(lead?.LeadDetails?.LeadPriority)] += 1; });
  return [
    { label: "High", value: counts.High, color: "#ef4444" },
    { label: "Medium", value: counts.Medium, color: "#f59e0b" },
    { label: "Low", value: counts.Low, color: "#34d399" },
  ];
}

export function buildMediumBars(leads) {
  const counts = {};
  leads.forEach((lead) => {
    const medium = lead?.LeadDetails?.LeadMedium || "Unknown";
    counts[medium] = (counts[medium] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
}

export function buildDailyTrend(leads, days = 14) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    buckets.push({ key: day.toDateString(), label: day.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" }), value: 0 });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  leads.forEach((lead) => {
    if (!lead.createdAt) return;
    const day = new Date(lead.createdAt);
    day.setHours(0, 0, 0, 0);
    const i = index[day.toDateString()];
    if (i !== undefined) buckets[i].value += 1;
  });
  return buckets.map(({ label, value }) => ({ label, value }));
}

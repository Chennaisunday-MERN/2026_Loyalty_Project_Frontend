"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  FileText,
  KeyRound,
  Package,
  ReceiptText,
  ShoppingCart,
  UserPlus,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";

const API = "http://localhost:5005/api";

function normalizePriority(value) {
  const priority = String(value || "").toLowerCase();
  if (priority === "hot" || priority === "high") return "Hot";
  if (priority === "warm" || priority === "medium") return "Warm";
  return "Cold";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

function stageLabel(value) {
  const labels = {
    "Enquiry-1stage": "New",
    "Enquiry-2stage": "Assigned",
    "Enquiry-3stage": "Quotation",
    "Enquiry-4thstage": "Converted",
  };
  return labels[value] || value || "N/A";
}

export default function Dashboard() {
  const [token, setToken] = useState("");
  const [allLeads, setAllLeads] = useState([]);
  const [todayLeads, setTodayLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [convertedToday, setConvertedToday] = useState(0);
  const [notConvertedToday, setNotConvertedToday] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem("admintokens") || "");
  }, []);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    axios.get(`${API}/alldayleadenquiry`, { headers })
      .then((response) => setAllLeads(Array.isArray(response.data) ? response.data : []))
      .catch(() => setAllLeads([]));

    axios.get(`${API}/todayviewleadenquiry`, { headers })
      .then((response) => setTodayLeads(Array.isArray(response.data) ? response.data : []))
      .catch(() => setTodayLeads([]));

    axios.get(`${API}/adminviewallprofile`, { headers })
      .then((response) => setEmployees(response.data.getallprofile || []))
      .catch(() => setEmployees([]));

    axios.get(`${API}/admin-performance`, { headers })
      .then((response) => setPerformance(response.data.performance || []))
      .catch(() => setPerformance([]));

    axios.get(`${API}/cc/todayviewyescustomer`, { headers })
      .then((response) => setConvertedToday(Array.isArray(response.data) ? response.data.length : 0))
      .catch(() => setConvertedToday(0));

    axios.get(`${API}/cc/todayviewnocustomer`, { headers })
      .then((response) => setNotConvertedToday(Array.isArray(response.data) ? response.data.length : 0))
      .catch(() => setNotConvertedToday(0));
  }, [token]);

  const deleteLead = async (enquiryNo) => {
    if (!window.confirm(`Delete lead ${enquiryNo}? This cannot be undone.`)) return;
    try {
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      await axios.delete(`${API}/leadenquiry/${enquiryNo}`, { headers });
      setTodayLeads((previous) => previous.filter((lead) => lead.EnquiryNo !== enquiryNo));
      setAllLeads((previous) => previous.filter((lead) => lead.EnquiryNo !== enquiryNo));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  const metrics = useMemo(() => {
    const hot = allLeads.filter((lead) => normalizePriority(lead?.LeadDetails?.LeadPriority) === "Hot").length;
    const warm = allLeads.filter((lead) => normalizePriority(lead?.LeadDetails?.LeadPriority) === "Warm").length;
    const cold = allLeads.filter((lead) => normalizePriority(lead?.LeadDetails?.LeadPriority) === "Cold").length;
    const assigned = allLeads.filter((lead) => lead.Status === "Enquiry-2stage").length;
    const quotation = allLeads.filter((lead) => lead.Status === "Enquiry-3stage").length;
    return { total: allLeads.length, hot, warm, cold, assigned, quotation };
  }, [allLeads]);

  const topPerformers = performance.slice(0, 5);
  const groupedEmployees = useMemo(() => {
    const order = ["sales head", "Lead filler", "Sales Employee", "Inventory Manager", "Stock Filler", "Service Engineer", "Engineer"];
    const groups = {};
    employees.forEach((employee) => {
      const role = employee.role || "Other";
      groups[role] = groups[role] || [];
      groups[role].push(employee);
    });
    return [
      ...order.filter((role) => groups[role]).map((role) => [role, groups[role]]),
      ...Object.entries(groups).filter(([role]) => !order.includes(role)).sort(([a], [b]) => a.localeCompare(b)),
    ];
  }, [employees]);

  const importantLinks = [
    { label: "Leads", icon: ClipboardList, href: "/admin/AllLeadEnquiry", tone: "teal" },
    { label: "Customers", icon: Users, href: "/admin/Allcustomerget", tone: "blue" },
    { label: "Quotation Requests", icon: FileText, href: "/admin/Quotation?EnquiryNo", tone: "violet" },
    { label: "PO Requests", icon: ShoppingCart, href: "/admin/Purchaseorder", tone: "amber" },
    { label: "Product Requests", icon: Package, href: "/admin/ProductRequest", tone: "emerald" },
    { label: "Proforma Invoices", icon: ReceiptText, href: "/admin/Invoice", tone: "rose" },
  ];

  const navLinks = [
    { label: "Employees", icon: Users, href: "/admin/viewallprofile" },
    { label: "Inventory", icon: Package, href: "/SaleteamDasboard/Inventory" },
    { label: "Lead Enquiries", icon: ClipboardList, href: "/admin/AllLeadEnquiry" },
    { label: "Customers", icon: Users, href: "/admin/Allcustomerget" },
    { label: "Quotation Requests", icon: FileText, href: "/admin/Quotation?EnquiryNo" },
    { label: "Product Requests", icon: Package, href: "/admin/ProductRequest" },
    { label: "PO Requests", icon: ShoppingCart, href: "/admin/Purchaseorder" },
    { label: "Proforma Invoices", icon: ReceiptText, href: "/admin/Invoice" },
    { label: "Sales Orders", icon: BarChart3, href: "/admin/GetSO" },
    { label: "Resources", icon: BriefcaseBusiness, href: "/admin/Getresources" },
    { label: "Service Details", icon: Wrench, href: "/admin/ServiceDetails" },
    { label: "Work Visits", icon: Wrench, href: "/admin/GetAllworkvisit" },
    { label: "All Quotations", icon: FileText, href: "/admin/GetAllquotation" },
    { label: "Add Employees", icon: UserPlus, href: "/admin/register" },
    { label: "Reset Email", icon: KeyRound, href: "/admin/resetemail" },
    { label: "Reset Password", icon: KeyRound, href: "/admin/passwordreset" },
    { label: "Today Converted", icon: CheckCircle2, href: "/admin/Yes" },
    { label: "Today Not Converted", icon: XCircle, href: "/admin/No" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Admin analytics</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Business Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Lead volume, lead quality, conversion activity, and employee performance at a glance.</p>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Important Navigation</h2>
          <p className="text-sm text-slate-600">Colour-coded daily operational pages for quick identification.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {importantLinks.map((link) => <NavCard key={link.href} link={link} router={router} important />)}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total Leads" value={metrics.total} tone="slate" />
          <MetricCard label="Today Leads" value={todayLeads.length} tone="teal" />
          <MetricCard label="Hot Leads" value={metrics.hot} tone="red" />
          <MetricCard label="Warm Leads" value={metrics.warm} tone="amber" />
          <MetricCard label="Converted Today" value={convertedToday} tone="blue" />
          <MetricCard label="Lost Today" value={notConvertedToday} tone="violet" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">Today's Lead Enquiries</h2>
            <p className="text-sm text-slate-600">Only leads created today, newest first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Enquiry</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayLeads.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No leads created today.</td></tr>
                ) : todayLeads.map((lead) => {
                  const priority = normalizePriority(lead?.LeadDetails?.LeadPriority);
                  return (
                    <tr key={lead._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{lead.EnquiryNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{lead?.LeadDetails?.companyName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{lead?.LeadDetails?.Department || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{lead?.LeadDetails?.clientName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{lead?.ContactDetails?.MobileNumber || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3"><PriorityBadge priority={priority} /></td>
                      <td className="px-4 py-3">{stageLabel(lead.Status)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.EnquiryNo)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Employees</h2>
              <p className="text-sm text-slate-600">Grouped by role in one table.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Joining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedEmployees.length === 0 ? (
                    <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-500">No employees available.</td></tr>
                  ) : groupedEmployees.map(([role, roleEmployees]) => (
                    <React.Fragment key={role}>
                      <tr>
                        <td colSpan="4" className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                          {role} ({roleEmployees.length})
                        </td>
                      </tr>
                      {roleEmployees.map((employee) => {
                        const active = !employee.EOD || new Date(employee.EOD) >= new Date();
                        return (
                          <tr key={employee.Eid} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{employee.name || "N/A"}</div>
                              <div className="text-xs text-slate-500">{employee.Eid}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div>{employee.email || "N/A"}</div>
                              <div className="text-xs text-slate-500">{employee.contactnumber || "N/A"}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(employee.JOD)}</td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                {active ? "Active" : "Ended"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Top Employee Performance</h2>
            <p className="text-sm text-slate-600">Ranked by closed leads.</p>
            <div className="mt-4 space-y-3">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-slate-500">No performance data available.</p>
              ) : topPerformers.map((employee) => (
                <div key={employee.Eid} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{employee.name}</div>
                      <div className="text-xs text-slate-500">{employee.role} · {employee.Eid}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-700">{employee.closedLeads} closed</div>
                      <div className="text-xs text-slate-500">{employee.conversionRate}% close rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Navigation</h2>
          <p className="text-sm text-slate-600">Open detailed pages for daily operations and administration.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {navLinks.map((link) => <NavCard key={link.href} link={link} router={router} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  };
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tones[tone]}`}>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
    </div>
  );
}

function AnalysisBar({ label, value, total, color }) {
  const percent = Math.round((value / total) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value} · {percent}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-lg font-semibold text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function NotificationRow({ label, value, tone }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    red: "bg-red-50 text-red-700 border-red-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <div className={`flex items-center justify-between rounded-md border px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function NavCard({ link, router, important = false }) {
  const Icon = link.icon;
  return (
    <button
      onClick={() => router.push(link.href)}
      className={`flex min-h-20 items-center gap-3 rounded-md border px-4 py-3 text-left shadow-sm ${
        important
          ? "border-teal-200 bg-teal-50 hover:border-teal-400"
          : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50"
      }`}
    >
      <span className="rounded-md bg-white p-2 text-teal-700 shadow-sm"><Icon size={18} /></span>
      <span className="text-sm font-medium text-slate-800">{link.label}</span>
    </button>
  );
}

function PriorityBadge({ priority }) {
  const classes = {
    Hot: "border-red-200 bg-red-50 text-red-700",
    Warm: "border-amber-200 bg-amber-50 text-amber-700",
    Cold: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes[priority]}`}>
      {priority}
    </span>
  );
}

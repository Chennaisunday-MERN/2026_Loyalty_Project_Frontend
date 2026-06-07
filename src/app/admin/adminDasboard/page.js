"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PieChart,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  BarChart,
  ChartCard,
  DonutChart,
  LineChart,
  StatCard,
  buildDailyTrend,
  buildMediumBars,
  buildPriorityDonut,
  buildStageDonut,
  stageOf,
} from "../../_components/Analytics";

const API = "http://localhost:5005/api";

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

function normalizePriority(value) {
  const priority = String(value || "").toLowerCase();
  if (priority === "hot" || priority === "high") return "Hot";
  if (priority === "warm" || priority === "medium") return "Warm";
  return "Cold";
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

  const kpis = useMemo(() => {
    const total = allLeads.length;
    const closed = allLeads.filter((lead) => stageOf(lead) === "Converted").length;
    const pending = total - closed;
    const rate = total === 0 ? 0 : Math.round((closed / total) * 1000) / 10;
    return { total, closed, pending, rate };
  }, [allLeads]);

  const stageDonut = useMemo(() => buildStageDonut(allLeads), [allLeads]);
  const priorityDonut = useMemo(() => buildPriorityDonut(allLeads), [allLeads]);
  const conversionDonut = useMemo(() => {
    const pending = Math.max(todayLeads.length - convertedToday - notConvertedToday, 0);
    return [
      { label: "Customer Converted", value: convertedToday, color: "#34d399" },
      { label: "Not Converted", value: notConvertedToday, color: "#ef4444" },
      { label: "Pending", value: pending, color: "#f59e0b" },
    ];
  }, [todayLeads, convertedToday, notConvertedToday]);
  const mediumBars = useMemo(() => buildMediumBars(allLeads), [allLeads]);
  const dailyTrend = useMemo(() => buildDailyTrend(allLeads), [allLeads]);

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

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Business Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Lead volume, quality, conversions, and team performance at a glance.</p>
          </div>
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarDays size={16} />
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Leads" value={kpis.total} sub="All enquiries" icon={Users} iconColor="text-blue-500" />
          <StatCard label="Closed" value={kpis.closed} sub="Converted deals" icon={CheckCircle2} color="text-emerald-600" iconColor="text-emerald-500" />
          <StatCard label="Pending" value={kpis.pending} sub="In progress" icon={Activity} color="text-amber-600" iconColor="text-amber-500" />
          <StatCard label="Conv. Rate" value={`${kpis.rate}%`} sub="Success rate" icon={TrendingUp} color="text-violet-600" iconColor="text-violet-500" />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Enquiry Stages" subtitle="Current pipeline status" icon={Activity} titleColor="text-blue-700" iconBg="bg-blue-50 text-blue-600">
            <DonutChart data={stageDonut} />
          </ChartCard>
          <ChartCard title="Priority Levels" subtitle="Urgency distribution" icon={PieChart} titleColor="text-rose-600" iconBg="bg-rose-50 text-rose-500">
            <DonutChart data={priorityDonut} />
          </ChartCard>
          <ChartCard title="Conversion Status" subtitle="Customer conversion tracking (today)" icon={CheckCircle2} titleColor="text-emerald-600" iconBg="bg-emerald-50 text-emerald-500">
            <DonutChart data={conversionDonut} />
          </ChartCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Enquiry Type Distribution" subtitle="How leads are acquired - by channel/medium" icon={BarChart3} titleColor="text-emerald-700" iconBg="bg-emerald-50 text-emerald-600">
            <BarChart data={mediumBars} />
          </ChartCard>
          <ChartCard title="Daily Lead Trends" subtitle="Number of enquiries received each day" icon={TrendingUp} titleColor="text-blue-700" iconBg="bg-blue-50 text-blue-600">
            <LineChart data={dailyTrend} />
          </ChartCard>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Today's Lead Enquiries</h2>
            <p className="text-sm text-slate-500">Only leads created today, newest first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Enquiry</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayLeads.length === 0 ? (
                  <tr><td colSpan="7" className="px-5 py-10 text-center text-slate-500">No leads created today.</td></tr>
                ) : todayLeads.map((lead) => {
                  const priority = normalizePriority(lead?.LeadDetails?.LeadPriority);
                  return (
                    <tr key={lead._id} className="hover:bg-slate-50/75">
                      <td className="px-5 py-3 font-medium text-slate-900">{lead.EnquiryNo}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{lead?.LeadDetails?.companyName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{lead?.LeadDetails?.Department || "N/A"}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div>{lead?.LeadDetails?.clientName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{lead?.ContactDetails?.MobileNumber || "N/A"}</div>
                      </td>
                      <td className="px-5 py-3"><PriorityBadge priority={priority} /></td>
                      <td className="px-5 py-3 text-slate-600">{stageLabel(lead.Status)}</td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(lead.createdAt)}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.EnquiryNo)}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Employees</h2>
              <p className="text-sm text-slate-500">Grouped by role in one table.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Joining</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedEmployees.length === 0 ? (
                    <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">No employees available.</td></tr>
                  ) : groupedEmployees.map(([role, roleEmployees]) => (
                    <React.Fragment key={role}>
                      <tr>
                        <td colSpan="4" className="bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {role} ({roleEmployees.length})
                        </td>
                      </tr>
                      {roleEmployees.map((employee) => {
                        const active = !employee.EOD || new Date(employee.EOD) >= new Date();
                        return (
                          <tr key={employee.Eid} className="hover:bg-slate-50/75">
                            <td className="px-5 py-3">
                              <div className="font-medium text-slate-900">{employee.name || "N/A"}</div>
                              <div className="text-xs text-slate-500">{employee.Eid}</div>
                            </td>
                            <td className="px-5 py-3">
                              <div>{employee.email || "N/A"}</div>
                              <div className="text-xs text-slate-500">{employee.contactnumber || "N/A"}</div>
                            </td>
                            <td className="px-5 py-3 text-slate-500">{formatDate(employee.JOD)}</td>
                            <td className="px-5 py-3">
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

          <div className="self-start rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Users size={18} /></span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Top Employee Performance</h2>
                <p className="text-sm text-slate-500">Ranked by closed leads.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-slate-500">No performance data available.</p>
              ) : topPerformers.map((employee, index) => (
                <div key={employee.Eid} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{employee.name}</div>
                        <div className="text-xs text-slate-500">{employee.role} · {employee.Eid}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{employee.closedLeads} closed</div>
                      <div className="text-xs text-slate-500">{employee.conversionRate}% close rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
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

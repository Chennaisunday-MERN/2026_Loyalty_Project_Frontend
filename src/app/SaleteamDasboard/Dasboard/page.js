"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Activity,
  BarChart3,
  Boxes,
  CheckCircle2,
  FileText,
  PieChart,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  BarChart,
  ChartCard,
  ConversionPrompt,
  DonutChart,
  EnquiryCards,
  LeadDeleteButton,
  LeadDetailModal,
  LineChart,
  StatCard,
  buildDailyTrend,
  buildMediumBars,
  buildPriorityDonut,
  buildStageDonut,
  stageOf,
} from "../../_components/Analytics";

const API = "http://localhost:5005/api";

function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [token, setToken] = useState("");
  const [eid, setEid] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [otherEmployees, setOtherEmployees] = useState([]);
  const [assignSelections, setAssignSelections] = useState({});
  const [conversionStatus, setConversionStatus] = useState({});
  const [quotationIcons, setQuotationIcons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("admintokens") || "");
    setEid(localStorage.getItem("idstore") || "");
    setRole(localStorage.getItem("role") || "");
  }, []);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const fetchQuotationIcon = async (enquiryNo) => {
    try {
      const res = await axios.get(`${API}/getquots/${enquiryNo}`, { headers });
      if (res.data?.Status) {
        setQuotationIcons((previous) => ({ ...previous, [enquiryNo]: res.data.Status }));
      }
    } catch (err) {
      if (err.response?.status !== 404) console.error(err);
    }
  };

  const checkConversionStatus = async (items) => {
    const enquiryNos = items.map((item) => item.EnquiryNo).filter(Boolean);
    if (enquiryNos.length === 0) return;
    try {
      const response = await axios.get(
        `${API}/cc/getMultipleEnquiryStatuses?enquiryNos=${enquiryNos.join(",")}`,
        { headers }
      );
      const map = {};
      enquiryNos.forEach((enquiryNo) => {
        map[enquiryNo] = response.data?.[enquiryNo]?.shouldHideButtons ?? false;
      });
      setConversionStatus(map);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    if (!token || !role) return;
    setLoading(true);
    setError("");
    try {
      const [employeeRes, otherRes] = await Promise.all([
        axios.get(`${API}/getsalesemployeeEid`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/getotheremployeeEid`, { headers }).catch(() => ({ data: {} })),
      ]);
      setSalesEmployees(employeeRes.data?.getallEid || []);
      setOtherEmployees(otherRes.data?.getallothersEid || []);

      const response = role === "sales head"
        ? await axios.get(`${API}/headenquiry`, { headers })
        : await axios.get(`${API}/getenquiryforsaletam/${eid}`, { headers });

      const data = role === "sales head" ? response.data || [] : response.data?.getdatas || [];
      const sorted = sortNewest(Array.isArray(data) ? data : []);
      setEnquiries(sorted);
      await checkConversionStatus(sorted);
      sorted.forEach((item) => fetchQuotationIcon(item.EnquiryNo));
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 400) {
        setEnquiries([]);
      } else {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, role, eid]);

  const kpis = useMemo(() => {
    const total = enquiries.length;
    const closed = enquiries.filter((item) => conversionStatus[item.EnquiryNo] || stageOf(item) === "Converted").length;
    const pending = Math.max(total - closed, 0);
    const rate = total === 0 ? 0 : Math.round((closed / total) * 1000) / 10;
    return { total, closed, pending, rate };
  }, [enquiries, conversionStatus]);

  const stageDonut = useMemo(() => buildStageDonut(enquiries), [enquiries]);
  const priorityDonut = useMemo(() => buildPriorityDonut(enquiries), [enquiries]);
  const conversionDonut = useMemo(() => {
    const converted = enquiries.filter((item) => conversionStatus[item.EnquiryNo]).length;
    const pending = Math.max(enquiries.length - converted, 0);
    return [
      { label: "Customer Converted", value: converted, color: "#34d399" },
      { label: "Pending", value: pending, color: "#f59e0b" },
    ];
  }, [enquiries, conversionStatus]);
  const mediumBars = useMemo(() => buildMediumBars(enquiries), [enquiries]);
  const dailyTrend = useMemo(() => buildDailyTrend(enquiries), [enquiries]);

  const setAssigneeFor = (enquiryNo, value) => {
    setAssignSelections((previous) => ({ ...previous, [enquiryNo]: value }));
  };

  const assignLead = async (enquiryNo) => {
    const assignee = assignSelections[enquiryNo];
    if (!assignee) {
      alert("Select an employee to assign this enquiry.");
      return;
    }

    const endpoint = role === "sales head" ? "assignedto" : "assignedtoservice";
    try {
      await axios.put(`${API}/${endpoint}`, { Eid: assignee, EnquiryNo: [enquiryNo] }, { headers });
      setAssignSelections((previous) => ({ ...previous, [enquiryNo]: "" }));
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign enquiry.");
    }
  };

  const deleteLead = async (enquiryNo) => {
    if (role !== "sales head") return;
    if (!window.confirm(`Delete lead ${enquiryNo}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/leadenquiry/${enquiryNo}`, { headers });
      setEnquiries((previous) => previous.filter((item) => item.EnquiryNo !== enquiryNo));
      setSelectedLead((previous) => (previous?.EnquiryNo === enquiryNo ? null : previous));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  const employeeOptions = role === "sales head" ? salesEmployees : otherEmployees;

  const renderCardActions = (item) => {
    const isConverted = conversionStatus[item.EnquiryNo];
    const hasQuote = quotationIcons[item.EnquiryNo] === "Editaccess" || quotationIcons[item.EnquiryNo] === "quotsaccess";
    if (role === "Sales Employee") {
      return (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {!isConverted ? (
            <>
              <MiniButton label="Convert" onClick={() => router.push(`/SaleteamDasboard/customerconversion?EnquiryNo=${item.EnquiryNo}`)} />
              <MiniButton label="Lost" variant="secondary" onClick={() => router.push(`/SaleteamDasboard/customernotconverted?EnquiryNo=${item.EnquiryNo}`)} />
            </>
          ) : (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">Converted</span>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); router.push(`/SaleteamDasboard/Quotation?EnquiryNo=${item.EnquiryNo}`); }}
            title={hasQuote ? "View Quote" : "Create Quotation"}
            aria-label={hasQuote ? "View Quote" : "Create Quotation"}
            className={`rounded-md p-1.5 ${hasQuote ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <FileText size={15} />
          </button>
        </div>
      );
    }
    if (role === "sales head") {
      return <LeadDeleteButton onDelete={() => deleteLead(item.EnquiryNo)} />;
    }
    return null;
  };

  const renderAssign = (item) => (
    <div className="space-y-2">
      <select
        value={assignSelections[item.EnquiryNo] || ""}
        onChange={(event) => setAssigneeFor(item.EnquiryNo, event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{role === "sales head" ? "Assign to sales employee…" : "Assign service/project employee…"}</option>
        {employeeOptions.map((employee) => (
          <option key={employee.Eid} value={employee.Eid}>{employee.Eid} - {employee.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => assignLead(item.EnquiryNo)}
        disabled={!assignSelections[item.EnquiryNo]}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <UserPlus size={16} />
        Assign
      </button>
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{role || "Sales"} workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Lead Operations Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Track priority, ownership, progress, and conversion from one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/SaleteamDasboard/Inventory")}
              title="Inventory"
              aria-label="Inventory"
              className="rounded-md border border-slate-300 bg-white p-2.5 text-blue-700 shadow-sm hover:bg-blue-50"
            >
              <Boxes size={18} />
            </button>
            <button
              onClick={fetchData}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Leads" value={kpis.total} sub="All enquiries" icon={Users} iconColor="text-blue-500" />
          <StatCard label="Closed" value={kpis.closed} sub="Won + Lost deals" icon={CheckCircle2} color="text-emerald-600" iconColor="text-emerald-500" />
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
          <ChartCard title="Conversion Status" subtitle="Customer conversion tracking" icon={CheckCircle2} titleColor="text-emerald-600" iconBg="bg-emerald-50 text-emerald-500">
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

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
            Loading leads...
          </div>
        ) : (
          <EnquiryCards
            leads={enquiries}
            title="Lead Enquiries"
            subtitle="Click any card to view full details"
            onView={setSelectedLead}
            renderActions={renderCardActions}
            renderExtra={role === "sales head" ? renderAssign : undefined}
            pageSize={9}
          />
        )}

        <LeadDetailModal
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          conversionSection={
            selectedLead && role === "Sales Employee" && !conversionStatus[selectedLead.EnquiryNo] ? (
              <ConversionPrompt
                onYes={() => router.push(`/SaleteamDasboard/customerconversion?EnquiryNo=${selectedLead.EnquiryNo}`)}
                onNo={() => router.push(`/SaleteamDasboard/customernotconverted?EnquiryNo=${selectedLead.EnquiryNo}`)}
              />
            ) : null
          }
          footerExtra={
            selectedLead && role === "sales head" ? (
              <LeadDeleteButton onDelete={() => deleteLead(selectedLead.EnquiryNo)} />
            ) : selectedLead && role === "Sales Employee" ? (
              <div className="flex gap-2">
                <MiniButton
                  label={quotationIcons[selectedLead.EnquiryNo] === "Editaccess" || quotationIcons[selectedLead.EnquiryNo] === "quotsaccess" ? "View Quote" : "Quote"}
                  onClick={() => router.push(`/SaleteamDasboard/Quotation?EnquiryNo=${selectedLead.EnquiryNo}`)}
                />
                <MiniButton label="Status" variant="secondary" onClick={() => router.push(`/SaleteamDasboard/EnquiryStatus?EnquiryNo=${selectedLead.EnquiryNo}`)} />
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
}

function MiniButton({ label, onClick, variant = "primary" }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={variant === "primary"
        ? "rounded-md bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-slate-700"
        : "rounded-md border border-slate-300 px-2.5 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-100"}
    >
      {label}
    </button>
  );
}

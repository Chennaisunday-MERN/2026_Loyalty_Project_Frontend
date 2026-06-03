"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Globe2,
  Package,
  ReceiptText,
  ShoppingCart,
  UserCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

const API = "http://localhost:5005/api";

const priorityStyles = {
  High: "bg-red-50 text-red-700 border-red-200",
  Hot: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Warm: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cold: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const stageLabels = {
  "Enquiry-1stage": "New",
  "Enquiry-2stage": "Assigned",
  "Enquiry-3stage": "Quotation",
  "Enquiry-4thstage": "Converted",
};

function normalizePriority(value) {
  const priority = String(value || "").toLowerCase();
  if (priority === "hot") return "High";
  if (priority === "warm") return "Medium";
  if (priority === "cold") return "Low";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

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
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const [assignTo, setAssignTo] = useState("");
  const [conversionStatus, setConversionStatus] = useState({});
  const [quotationIcons, setQuotationIcons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const metrics = useMemo(() => {
    const total = enquiries.length;
    const high = enquiries.filter((item) => normalizePriority(item?.LeadDetails?.LeadPriority) === "High").length;
    const medium = enquiries.filter((item) => normalizePriority(item?.LeadDetails?.LeadPriority) === "Medium").length;
    const low = enquiries.filter((item) => normalizePriority(item?.LeadDetails?.LeadPriority) === "Low").length;
    const converted = enquiries.filter((item) => conversionStatus[item.EnquiryNo]).length;
    const pending = Math.max(total - converted, 0);
    return { total, high, medium, low, converted, pending };
  }, [enquiries, conversionStatus]);

  const toggleSelection = (enquiryNo) => {
    setSelectedEnquiries((previous) => (
      previous.includes(enquiryNo)
        ? previous.filter((item) => item !== enquiryNo)
        : [...previous, enquiryNo]
    ));
  };

  const assignSelected = async (event) => {
    event.preventDefault();
    if (!assignTo || selectedEnquiries.length === 0) {
      alert("Select at least one enquiry and employee.");
      return;
    }

    const endpoint = role === "sales head" ? "assignedto" : "assignedtoservice";
    try {
      await axios.put(`${API}/${endpoint}`, { Eid: assignTo, EnquiryNo: selectedEnquiries }, { headers });
      setAssignTo("");
      setSelectedEnquiries([]);
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign enquiries.");
    }
  };

  const deleteLead = async (enquiryNo) => {
    if (role !== "sales head") return;
    if (!window.confirm(`Delete lead ${enquiryNo}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/leadenquiry/${enquiryNo}`, { headers });
      setEnquiries((previous) => previous.filter((item) => item.EnquiryNo !== enquiryNo));
      setSelectedEnquiries((previous) => previous.filter((item) => item !== enquiryNo));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  const quickActions = [
    { label: "Profile", icon: UserRound, href: "/SaleteamDasboard/viewprofile" },
    ...(role === "Lead filler" ? [
      { label: "Enter Enquiry", icon: ClipboardList, href: "/SaleteamDasboard/Enquirypage" },
      { label: "View Leads", icon: Eye, href: "/SaleteamDasboard/Leadenquiryview" },
      { label: "Product Enquiries", icon: Globe2, href: "/SaleteamDasboard/ProductEnquiries" },
    ] : []),
    { label: "Converted", icon: CheckCircle2, href: "/SaleteamDasboard/CustomerConverted" },
    { label: "Not Converted", icon: XCircle, href: "/SaleteamDasboard/Cnc" },
    { label: "Customers", icon: Users, href: "/SaleteamDasboard/Getcustomerdetails" },
    { label: "Inventory", icon: Package, href: "/SaleteamDasboard/Inventory" },
    { label: "Product Request", icon: BriefcaseBusiness, href: "/SaleteamDasboard/Productrequest" },
    { label: "Purchase Orders", icon: ShoppingCart, href: "/SaleteamDasboard/GetPO" },
    { label: "PI", icon: ReceiptText, href: "/SaleteamDasboard/GetPI" },
    { label: "Quotations", icon: FileText, href: "/SaleteamDasboard/GetEidQuotation" },
    { label: "Sales Orders", icon: BarChart3, href: "/SaleteamDasboard/GetSO" },
  ];

  const employeeOptions = role === "sales head" ? salesEmployees : otherEmployees;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{role || "Sales"} workspace</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">Lead Operations Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">Newest lead enquiries appear first. Track priority, ownership, progress, and conversion from one place.</p>
            </div>
            <button
              onClick={fetchData}
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 lg:w-auto"
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Total Leads" value={metrics.total} tone="slate" />
          <MetricCard label="Hot / High" value={metrics.high} tone="red" />
          <MetricCard label="Warm / Medium" value={metrics.medium} tone="amber" />
          <MetricCard label="Cold / Low" value={metrics.low} tone="emerald" />
          <MetricCard label="Converted" value={metrics.converted} tone="blue" />
          <MetricCard label="Open" value={metrics.pending} tone="violet" />
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Work Boards</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="flex min-h-20 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50"
                >
                  <span className="rounded-md bg-white p-2 text-emerald-700 shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={assignSelected} className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Lead Pipeline</h2>
              <p className="text-sm text-slate-600">
                {role === "sales head"
                  ? "Select leads and assign them to sales employees."
                  : "Review assigned leads, convert customers, create quotations, and assign service work when needed."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={assignTo}
                onChange={(event) => setAssignTo(event.target.value)}
                className="min-w-64 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">{role === "sales head" ? "Assign to sales employee" : "Assign service/project employee"}</option>
                {employeeOptions.map((employee) => (
                  <option key={employee.Eid} value={employee.Eid}>{employee.Eid} - {employee.name}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!assignTo || selectedEnquiries.length === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Assign {selectedEnquiries.length ? `(${selectedEnquiries.length})` : ""}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Select</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Owner / Stage</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">Loading leads...</td></tr>
                ) : enquiries.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No leads available.</td></tr>
                ) : enquiries.map((item) => {
                  const priority = normalizePriority(item?.LeadDetails?.LeadPriority);
                  const isConverted = conversionStatus[item.EnquiryNo];
                  return (
                    <tr key={item._id} className="align-top hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.includes(item.EnquiryNo)}
                          onChange={() => toggleSelection(item.EnquiryNo)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900">{item?.LeadDetails?.companyName || "N/A"}</div>
                        <div className="text-slate-600">{item?.LeadDetails?.clientName || "N/A"}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.EnquiryNo}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-800">{item.Eid || "Unassigned"}</div>
                        <div className="mt-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{stageLabels[item.Status] || item.Status || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[priority]}`}>
                          {priority === "High" ? "Hot" : priority === "Medium" ? "Warm" : "Cold"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div>{item?.ContactDetails?.MobileNumber || "N/A"}</div>
                        <div className="text-slate-500">{item?.ContactDetails?.PrimaryMail || "N/A"}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        {role === "Sales Employee" ? (
                          <div className="flex flex-wrap gap-2">
                            {!isConverted ? (
                              <>
                                <ActionButton label="Convert" onClick={() => router.push(`/SaleteamDasboard/customerconversion?EnquiryNo=${item.EnquiryNo}`)} />
                                <ActionButton label="Lost" variant="secondary" onClick={() => router.push(`/SaleteamDasboard/customernotconverted?EnquiryNo=${item.EnquiryNo}`)} />
                              </>
                            ) : (
                              <span className="rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">Converted</span>
                            )}
                            <ActionButton
                              label={quotationIcons[item.EnquiryNo] === "Editaccess" || quotationIcons[item.EnquiryNo] === "quotsaccess" ? "View Quote" : "Quote"}
                              onClick={() => router.push(`/SaleteamDasboard/Quotation?EnquiryNo=${item.EnquiryNo}`)}
                            />
                            <ActionButton label="Status" variant="secondary" onClick={() => router.push(`/SaleteamDasboard/EnquiryStatus?EnquiryNo=${item.EnquiryNo}`)} />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-500">Select to assign</span>
                            {role === "sales head" && (
                              <button
                                type="button"
                                onClick={() => deleteLead(item.EnquiryNo)}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
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

function ActionButton({ label, onClick, variant = "primary" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={variant === "primary"
        ? "rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        : "rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"}
    >
      {label}
    </button>
  );
}

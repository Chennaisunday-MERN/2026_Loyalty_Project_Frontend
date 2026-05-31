"use client";

import { useState } from "react";
import axios from "axios";
import { AdminPanel, AdminShell, adminInputClass, adminPrimaryButtonClass } from "../_components/AdminShell";

function priorityClass(priority) {
  const normalized = String(priority || "").toLowerCase();
  if (normalized === "high" || normalized === "hot") return "border-red-200 bg-red-50 text-red-700";
  if (normalized === "medium" || normalized === "warm") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

const AllLeadEnquiry = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEnquiries = async (e) => {
    e.preventDefault();
    setEnquiries([]);
    setError(null);
    setLoading(true);

    const token = localStorage.getItem("admintokens");
    try {
      const response = await axios.get("http://localhost:5005/api/alldayleadenquiry", {
        params: { fromDate, toDate },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setEnquiries(Array.isArray(response.data) ? response.data : []);
      if (!response.data || response.data.length === 0) setError("No data available.");
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.response?.data?.message || "Unable to fetch lead enquiries.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (enquiryNo) => {
    if (!window.confirm(`Delete lead ${enquiryNo}? This cannot be undone.`)) return;
    const token = localStorage.getItem("admintokens");
    try {
      await axios.delete(`http://localhost:5005/api/leadenquiry/${enquiryNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setEnquiries((previous) => previous.filter((enquiry) => enquiry.EnquiryNo !== enquiryNo));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete lead.");
    }
  };

  return (
    <AdminShell title="Lead Enquiries" subtitle="Search, review, and manage lead enquiries by date range.">
      <AdminPanel title="Filters" subtitle="Choose a date range to view lead enquiries.">
        <form onSubmit={fetchEnquiries} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">From Date</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">To Date</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${adminInputClass} mt-1`} />
          </label>
          <button type="submit" className={adminPrimaryButtonClass}>
            {loading ? "Fetching..." : "Fetch Enquiries"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel title="Enquiries" subtitle={`${enquiries.length} records found`}>
        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Enquiry</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Medium</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-slate-500">No enquiries to display.</td></tr>
              ) : enquiries.map((enquiry) => (
                <tr key={enquiry._id || enquiry.EnquiryNo} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{enquiry.EnquiryNo || "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{enquiry?.LeadDetails?.companyName || "N/A"}</div>
                    <div className="text-xs text-slate-500">{enquiry?.LeadDetails?.Department || "N/A"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{enquiry?.LeadDetails?.clientName || "N/A"}</div>
                    <div className="text-xs text-slate-500">{enquiry?.ContactDetails?.MobileNumber || "N/A"}</div>
                  </td>
                  <td className="px-4 py-3">{enquiry?.LeadDetails?.LeadMedium || "N/A"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass(enquiry?.LeadDetails?.LeadPriority)}`}>
                      {enquiry?.LeadDetails?.LeadPriority || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(enquiry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => handleDelete(enquiry.EnquiryNo)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminShell>
  );
};

export default AllLeadEnquiry;

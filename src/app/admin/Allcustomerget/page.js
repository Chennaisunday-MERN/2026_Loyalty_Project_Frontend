"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AdminPanel, AdminShell, adminInputClass, adminSecondaryButtonClass } from "../_components/AdminShell";

const Getcustomerdetails = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedData, setExpandedData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setConversations([]);

    try {
      const token = localStorage.getItem("admintokens");
      if (!token) {
        setError("User not authenticated.");
        return;
      }

      const response = await axios.get("http://localhost:5005/api/cc/getconverteddata", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.customerData || [];
      setConversations(data);
      if (data.length === 0) setError("No customers found.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch data from server.");
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conversation) => {
    const query = searchQuery.toLowerCase();
    return (
      conversation.companyName?.toLowerCase().includes(query) ||
      conversation.PANnumber?.toLowerCase().includes(query) ||
      conversation.GSTNnumber?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminShell title="Customers" subtitle="Review converted customers and their enquiry conversion history.">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Customers" value={conversations.length} />
        <Metric label="Conversions" value={conversations.reduce((sum, item) => sum + (item.customerconvert?.length || 0), 0)} />
        <Metric label="Filtered" value={filteredConversations.length} />
      </div>

      <AdminPanel title="Customer Records" subtitle="Search by company name, PAN, or GST number.">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${adminInputClass} md:max-w-md`}
          />
          <button type="button" onClick={fetchData} className={adminSecondaryButtonClass}>
            Refresh
          </button>
        </div>

        {loading && <div className="py-10 text-center text-sm text-slate-500">Loading customers...</div>}
        {!loading && error && <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">PAN</th>
                  <th className="px-4 py-3">GSTN</th>
                  <th className="px-4 py-3">Conversions</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">No customers to display.</td>
                  </tr>
                ) : (
                  filteredConversations.map((conversation) => (
                    <tr key={conversation._id || conversation.PANnumber || conversation.companyName} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-950">{conversation.companyName || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-700">{conversation.PANnumber || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-700">{conversation.GSTNnumber || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-700">{conversation.customerconvert?.length || 0}</td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setExpandedData(conversation)} className="font-medium text-teal-700 hover:text-teal-900">
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {expandedData && (
        <AdminPanel title={expandedData.companyName || "Customer Details"} subtitle="Customer address and conversion information.">
          <div className="mb-5 grid gap-3 md:grid-cols-4">
            <Info label="PAN" value={expandedData.PANnumber} />
            <Info label="GSTN" value={expandedData.GSTNnumber} />
            <Info label="City" value={expandedData.AddressDetails?.City} />
            <Info label="State" value={expandedData.AddressDetails?.State} />
            <Info label="Country" value={expandedData.AddressDetails?.Country} />
            <Info label="Postal Code" value={expandedData.AddressDetails?.PostalCode} />
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
              <p className="mt-1 text-sm text-slate-900">{expandedData.AddressDetails?.Address || "N/A"}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Enquiry</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Opportunity</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Followup</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {(expandedData.customerconvert || []).map((customer, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">{customer?.EnquiryNo || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.clientName || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.CustomerDetails?.MobileNumber || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.CustomerDetails?.opportunitynumber || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.CustomerDetails?.PrimaryMail || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.Convertedstatus || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.Eid || "N/A"}</td>
                    <td className="px-4 py-3">{customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB") : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => setExpandedData(null)} className={`${adminSecondaryButtonClass} mt-5`}>
            Close Details
          </button>
        </AdminPanel>
      )}
    </AdminShell>
  );
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value || "N/A"}</p>
    </div>
  );
}

export default Getcustomerdetails;

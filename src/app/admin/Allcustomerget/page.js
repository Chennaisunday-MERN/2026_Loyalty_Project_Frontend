"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AdminPanel, AdminShell, adminInputClass, adminSecondaryButtonClass } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const Getcustomerdetails = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedData, setExpandedData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("grid");

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
    <AdminShell
      title="Customers"
      subtitle="Review converted customers and their enquiry conversion history."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
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

        {!loading && view === "grid" && (
          filteredConversations.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500">No customers to display.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredConversations.map((conversation) => (
                <RecordCard
                  key={conversation._id || conversation.PANnumber || conversation.companyName}
                  title={conversation.companyName || "N/A"}
                  subtitle={conversation.AddressDetails?.City || conversation.AddressDetails?.State || undefined}
                  badge={<ConversionBadge count={conversation.customerconvert?.length || 0} />}
                  onClick={() => setExpandedData(conversation)}
                >
                  <CardField label="PAN" value={conversation.PANnumber || "N/A"} />
                  <CardField label="GSTN" value={conversation.GSTNnumber || "N/A"} />
                  <CardField label="Conversions" value={conversation.customerconvert?.length || 0} />
                </RecordCard>
              ))}
            </div>
          )
        )}

        {!loading && view === "list" && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">PAN</th>
                  <th className="px-5 py-3">GSTN</th>
                  <th className="px-5 py-3">Conversions</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConversations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-500">No customers to display.</td>
                  </tr>
                ) : (
                  filteredConversations.map((conversation) => (
                    <tr
                      key={conversation._id || conversation.PANnumber || conversation.companyName}
                      className="cursor-pointer hover:bg-slate-50/75"
                      onClick={() => setExpandedData(conversation)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-950">{conversation.companyName || "N/A"}</td>
                      <td className="px-5 py-3 text-slate-700">{conversation.PANnumber || "N/A"}</td>
                      <td className="px-5 py-3 text-slate-700">{conversation.GSTNnumber || "N/A"}</td>
                      <td className="px-5 py-3 text-slate-700">{conversation.customerconvert?.length || 0}</td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedData(conversation);
                          }}
                          className="font-medium text-teal-700 hover:text-teal-900"
                        >
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

      <DetailModal
        open={!!expandedData}
        title={expandedData?.companyName || "Customer Details"}
        subtitle="Customer address and conversion information."
        onClose={() => setExpandedData(null)}
        footer={
          <button type="button" onClick={() => setExpandedData(null)} className={adminSecondaryButtonClass}>
            Close Details
          </button>
        }
      >
        {expandedData && (
          <>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <DetailField label="PAN" value={expandedData.PANnumber} />
              <DetailField label="GSTN" value={expandedData.GSTNnumber} />
              <DetailField label="City" value={expandedData.AddressDetails?.City} />
              <DetailField label="State" value={expandedData.AddressDetails?.State} />
              <DetailField label="Country" value={expandedData.AddressDetails?.Country} />
              <DetailField label="Postal Code" value={expandedData.AddressDetails?.PostalCode} />
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
                <dd className="mt-1 text-sm text-slate-900">{expandedData.AddressDetails?.Address || "N/A"}</dd>
              </div>
            </dl>

            <div className="mt-5 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Enquiry</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Opportunity</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Followup</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(expandedData.customerconvert || []).map((customer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/75">
                      <td className="px-5 py-3">{customer?.EnquiryNo || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.clientName || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.CustomerDetails?.MobileNumber || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.CustomerDetails?.opportunitynumber || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.CustomerDetails?.PrimaryMail || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.Convertedstatus || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.Eid || "N/A"}</td>
                      <td className="px-5 py-3">{customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-GB") : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DetailModal>
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

function ConversionBadge({ count }) {
  const tone = count > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
      {count} {count === 1 ? "conversion" : "conversions"}
    </span>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "N/A"}</dd>
    </div>
  );
}

export default Getcustomerdetails;

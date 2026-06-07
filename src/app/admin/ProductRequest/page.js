"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Loader2 } from "lucide-react";
import { AdminPanel, AdminShell } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const ProductRequests = () => {
  const [productRequests, setProductRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchProductRequests = async () => {
      try {
        const response = await axios.get("http://localhost:5005/api/productrequests");
        setProductRequests(response.data.productRequests || []);
      } catch (err) {
        setError("Error fetching product requests");
        console.error("Error fetching product requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductRequests();
  }, []);

  const counts = productRequests.reduce(
    (summary, request) => {
      const status = String(request.Status || "other").toLowerCase();
      summary.total += 1;
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 }
  );

  if (loading) {
    return (
      <AdminShell title="Product Requests" subtitle="Review requested products and quantities from the team.">
        <AdminPanel>
          <div className="flex items-center justify-center gap-3 py-16 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
            Loading requests...
          </div>
        </AdminPanel>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Product Requests" subtitle="Review requested products and quantities from the team.">
        <AdminPanel>
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-medium text-slate-800">{error}</p>
            <button onClick={() => window.location.reload()} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
              Try Again
            </button>
          </div>
        </AdminPanel>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Product Requests"
      subtitle="Review requested products and quantities from the team."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total" value={counts.total} tone="slate" />
        <Metric label="Pending" value={counts.pending} tone="amber" />
        <Metric label="Approved" value={counts.approved} tone="emerald" />
        <Metric label="Rejected" value={counts.rejected} tone="red" />
      </div>

      <AdminPanel title="Request List" subtitle={`${productRequests.length} product requests found`}>
        {view === "grid" ? (
          productRequests.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500">No product requests found.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {productRequests.map((request) => (
                <RecordCard
                  key={request._id}
                  title={request.name || "N/A"}
                  subtitle={request.email || "N/A"}
                  badge={<StatusBadge status={request.Status} />}
                  onClick={() => setSelected(request)}
                >
                  <CardField label="Company" value={request.companyName || "N/A"} />
                  <CardField label="Contact" value={request.contactpersonname || "N/A"} />
                  <CardField label="Employee ID" value={request.Employeeid || "N/A"} />
                  <CardField
                    label="Products"
                    value={`${(request.productDetails || []).length} item${(request.productDetails || []).length === 1 ? "" : "s"}`}
                  />
                </RecordCard>
              ))}
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Employee ID</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-slate-500">No product requests found.</td>
                  </tr>
                ) : (
                  productRequests.map((request) => (
                    <tr
                      key={request._id}
                      onClick={() => setSelected(request)}
                      className="cursor-pointer align-top hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-950">{request.name || "N/A"}</div>
                        <div className="text-xs text-slate-500">{request.email || "N/A"}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{request.companyName || "N/A"}</div>
                        <div className="text-xs text-slate-500">{request.contactpersonname || "N/A"}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-700">{request.Employeeid || "N/A"}</td>
                      <td className="px-5 py-3 text-slate-700">
                        {(request.productDetails || []).length} item{(request.productDetails || []).length === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={request.Status} />
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
        open={!!selected}
        title={selected?.name || "Product Request"}
        subtitle={selected?.email || undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Requester</dt>
                <dd className="text-sm text-slate-900">{selected.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="text-sm text-slate-900">{selected.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</dt>
                <dd className="text-sm text-slate-900">{selected.companyName || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact Person</dt>
                <dd className="text-sm text-slate-900">{selected.contactpersonname || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Employee ID</dt>
                <dd className="text-sm text-slate-900">{selected.Employeeid || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-0.5 text-sm text-slate-900">
                  <StatusBadge status={selected.Status} />
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</dt>
                <dd className="text-sm text-slate-900">{selected.Description || "N/A"}</dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Products</p>
              <div className="mt-2 space-y-2">
                {(selected.productDetails || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No products listed.</p>
                ) : (
                  (selected.productDetails || []).map((product, index) => (
                    <div key={index} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2">
                      <span className="font-medium text-slate-800">{product.productname || "Product"}</span>
                      <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">{product.quantity || 0} units</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </AdminShell>
  );
};

function Metric({ label, value, tone }) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-950",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    red: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
      {status || "N/A"}
    </span>
  );
}

function getStatusClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default ProductRequests;

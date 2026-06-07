"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AdminShell, adminSecondaryButtonClass } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const statusBadgeClass = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("complete") || normalized.includes("done") || normalized.includes("paid")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("pending") || normalized.includes("progress")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (normalized.includes("cancel") || normalized.includes("fail") || normalized.includes("unpaid")) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const StatusBadge = ({ value }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(value)}`}>
    {value}
  </span>
);

const ServiceEngineers = () => {
  const [serviceDetails, setServiceDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const token = localStorage.getItem("admintokens"); // Adjust if using cookies or other auth
        if (!token) {
          setError("Authentication token not found.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5005/api/getservicedetails", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setServiceDetails(response.data.getdata || []);
      } catch (err) {
        setError("Error fetching service details");
        console.error("Error fetching service details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, []);

  if (loading) {
    return (
      <AdminShell title="Service Details" subtitle="Service records submitted by engineers">
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
            <p className="mt-4 text-sm font-medium text-slate-500">Loading data...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell title="Service Details" subtitle="Service records submitted by engineers">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 ${adminSecondaryButtonClass}`}
          >
            Try Again
          </button>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Service Details"
      subtitle="Service records submitted by engineers"
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {view === "grid" ? (
        serviceDetails.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
            No service details found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serviceDetails.map((detail) => (
              <RecordCard
                key={detail._id}
                title={detail.clientName}
                subtitle={`EID: ${detail.Eid}`}
                badge={<StatusBadge value={detail.serviceStatus} />}
                onClick={() => setSelected(detail)}
              >
                <CardField label="Employee ID" value={detail.Employeeid} />
                <CardField label="Material" value={detail.Material} />
                <CardField label="Model" value={detail.Model} />
                <CardField label="Serial No" value={detail.SerialNo} />
                <CardField label="Billing" value={<StatusBadge value={detail.BillingStatus} />} />
              </RecordCard>
            ))}
          </div>
        )
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Service records</h2>
            <p className="text-sm text-slate-500">
              {serviceDetails.length} record{serviceDetails.length === 1 ? "" : "s"} on file
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Material</th>
                  <th className="px-5 py-3">Model</th>
                  <th className="px-5 py-3">Serial No</th>
                  <th className="px-5 py-3">Service Status</th>
                  <th className="px-5 py-3">Billing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceDetails.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                      No service details found.
                    </td>
                  </tr>
                ) : (
                  serviceDetails.map((detail) => (
                    <tr
                      key={detail._id}
                      onClick={() => setSelected(detail)}
                      className="cursor-pointer hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{detail.clientName}</div>
                        <div className="text-xs text-slate-500">EID: {detail.Eid}</div>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{detail.Material}</td>
                      <td className="px-5 py-3 text-slate-600">{detail.Model}</td>
                      <td className="px-5 py-3 text-slate-600">{detail.SerialNo}</td>
                      <td className="px-5 py-3">
                        <StatusBadge value={detail.serviceStatus} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge value={detail.BillingStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DetailModal
        open={!!selected}
        title={selected?.clientName}
        subtitle={selected ? `EID: ${selected.Eid}` : null}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Client</dt>
              <dd className="text-sm text-slate-900">{selected.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">EID</dt>
              <dd className="text-sm text-slate-900">{selected.Eid}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Employee ID</dt>
              <dd className="text-sm text-slate-900">{selected.Employeeid}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer Inward</dt>
              <dd className="text-sm text-slate-900">{selected.Customerinward}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantity</dt>
              <dd className="text-sm text-slate-900">{selected.quantity}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Material</dt>
              <dd className="text-sm text-slate-900">{selected.Material}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Model</dt>
              <dd className="text-sm text-slate-900">{selected.Model}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Serial No</dt>
              <dd className="text-sm text-slate-900">{selected.SerialNo}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Power Consumption</dt>
              <dd className="text-sm text-slate-900">{selected.powerconsumption}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Service Start</dt>
              <dd className="text-sm text-slate-900">{selected.servicestartdate}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Service End</dt>
              <dd className="text-sm text-slate-900">{selected.serviceenddate}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Service Status</dt>
              <dd className="mt-1 text-sm text-slate-900">
                <StatusBadge value={selected.serviceStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Billing Status</dt>
              <dd className="mt-1 text-sm text-slate-900">
                <StatusBadge value={selected.BillingStatus} />
              </dd>
            </div>
          </dl>
        )}
      </DetailModal>
    </AdminShell>
  );
};

export default ServiceEngineers;

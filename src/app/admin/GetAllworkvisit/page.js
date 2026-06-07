"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { AdminShell, adminSecondaryButtonClass } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const WorkvistAll = () => {
  const [serviceEngineers, setServiceEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchServiceEngineers = async () => {
      try {
        const response = await axios.get("http://localhost:5005/api/workvisit");
        setServiceEngineers(response.data.serviceEngineers);
      } catch (err) {
        setError("Error fetching service engineers");
        console.error("Error fetching service engineers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceEngineers();
  }, []);

  if (loading) {
    return (
      <AdminShell title="Work Visits" subtitle="Service engineer work visit records">
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
      <AdminShell title="Work Visits" subtitle="Service engineer work visit records">
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
      title="Work Visits"
      subtitle="Service engineer work visit records"
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {view === "grid" ? (
        serviceEngineers.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
            No service engineers found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {serviceEngineers.map((engineer) => (
              <RecordCard
                key={engineer._id}
                title={engineer.name}
                subtitle={engineer.companyName}
                onClick={() => setSelected(engineer)}
              >
                <CardField label="Machine" value={engineer.MachineName} />
                <CardField label="Product" value={engineer.ProductDescription} />
                <CardField
                  label="Complaint"
                  value={engineer.Problems[0]?.description || "No complaints"}
                />
              </RecordCard>
            ))}
          </div>
        )
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Service engineers</h2>
            <p className="text-sm text-slate-500">
              {serviceEngineers.length} record{serviceEngineers.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Engineer</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Machine</th>
                  <th className="px-5 py-3">Complaints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceEngineers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      No service engineers found.
                    </td>
                  </tr>
                ) : (
                  serviceEngineers.map((engineer) => (
                    <tr
                      key={engineer._id}
                      onClick={() => setSelected(engineer)}
                      className="cursor-pointer hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">{engineer.name}</td>
                      <td className="px-5 py-3 text-slate-600">{engineer.companyName}</td>
                      <td className="px-5 py-3 text-slate-600">{engineer.MachineName}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {engineer.Problems[0]?.description || "No complaints"}
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
        title={selected?.name}
        subtitle={selected?.companyName}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Engineer</dt>
              <dd className="text-sm text-slate-900">{selected.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Company</dt>
              <dd className="text-sm text-slate-900">{selected.companyName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Client</dt>
              <dd className="text-sm text-slate-900">{selected.clientName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Engineer ID</dt>
              <dd className="text-sm text-slate-900">{selected.Eid || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</dt>
              <dd className="text-sm text-slate-900">{selected.Date || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Location</dt>
              <dd className="text-sm text-slate-900">{selected.Location || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Machine</dt>
              <dd className="text-sm text-slate-900">{selected.MachineName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Financial year</dt>
              <dd className="text-sm text-slate-900">{selected.financialYear || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Product description</dt>
              <dd className="text-sm text-slate-900">{selected.ProductDescription || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Complaints</dt>
              <dd className="text-sm text-slate-900">
                {selected.Problems && selected.Problems.length > 0 ? (
                  <ul className="list-inside list-disc space-y-1">
                    {selected.Problems.map((problem, index) => (
                      <li key={index}>{problem.description || "—"}</li>
                    ))}
                  </ul>
                ) : (
                  "No complaints"
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Assessment</dt>
              <dd className="text-sm text-slate-900">{selected.Assessment || "No assessment provided"}</dd>
            </div>
          </dl>
        )}
      </DetailModal>
    </AdminShell>
  );
};

export default WorkvistAll;

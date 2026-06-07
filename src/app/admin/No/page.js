"use client"
import { useEffect, useState } from 'react';
import axios from 'axios';
import { AdminShell } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const TodayView = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem('admintokens');

  const fetchEnquiries = async () => {
    try {
      const response = await axios.get('http://localhost:5005/api/cc/todayviewnocustomer', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEnquiries(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const selectedEnquiry = selected !== null ? enquiries[selected] : null;

  const notConvertedBadge = (
    <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold border-red-200 bg-red-50 text-red-700">
      Not converted
    </span>
  );

  return (
    <AdminShell
      title="Lost Today"
      subtitle="Customers not converted today."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {view === "grid" ? (
        enquiries.length === 0 ? (
          <section className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
            No enquiries found.
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enquiries.map((enquiry, index) => (
              <RecordCard
                key={index}
                title={enquiry.EnquiryNo || 'N/A'}
                subtitle={enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : 'N/A'}
                badge={notConvertedBadge}
                onClick={() => setSelected(index)}
              >
                <CardField label="Enquiry No" value={enquiry.EnquiryNo || 'N/A'} />
                <CardField
                  label="Created At"
                  value={enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString() : 'N/A'}
                />
              </RecordCard>
            ))}
          </div>
        )
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Not converted enquiries</h2>
            <p className="text-sm text-slate-500">Enquiries marked as not converted today.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Enquiry No</th>
                  <th className="px-5 py-3">Created At</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-slate-500">
                      No enquiries found.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((enquiry, index) => (
                    <tr
                      key={index}
                      onClick={() => setSelected(index)}
                      className="cursor-pointer hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3 text-slate-900">{enquiry.EnquiryNo || 'N/A'}</td>
                      <td className="px-5 py-3 text-slate-600">{new Date(enquiry.createdAt).toLocaleString() || 'N/A'}</td>
                      <td className="px-5 py-3">{notConvertedBadge}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DetailModal
        open={selected !== null}
        title={selectedEnquiry ? `Enquiry ${selectedEnquiry.EnquiryNo || 'N/A'}` : ''}
        subtitle="Not converted today"
        onClose={() => setSelected(null)}
      >
        {selectedEnquiry && (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {Object.entries(selectedEnquiry).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{key}</dt>
                <dd className="text-sm text-slate-900">
                  {key === 'createdAt' || key === 'updatedAt'
                    ? (value ? new Date(value).toLocaleString() : 'N/A')
                    : formatValue(value)}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="text-sm text-slate-900">{notConvertedBadge}</dd>
            </div>
          </dl>
        )}
      </DetailModal>
    </AdminShell>
  );
};

export default TodayView;

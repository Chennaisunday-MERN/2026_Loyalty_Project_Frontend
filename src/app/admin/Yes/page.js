"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { AdminShell } from "../_components/AdminShell"
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView"

const Yes = () => {
  const [enquiries, setEnquiries] = useState([])
  const [array,setArray] = useState([]);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const token = localStorage.getItem('admintokens');


  const fetchEnquiries = async () => {
    try {
      const response = await axios.get('http://localhost:5005/api/cc/todayviewyescustomer', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      console.log("API Response:", response.data);
      console.log("customerconvert",response.data[0].customerconvert);
      setEnquiries(response.data);
      setArray(response.data.customerconvert)
    } catch (error) {
      console.error('Error fetching enquiries:', error.response || error.message);
    }
  }

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const hasEnquiries = Array.isArray(enquiries) && enquiries.length > 0;
  const selectedEnquiry = selected !== null && hasEnquiries ? enquiries[selected] : null;

  const convertedBadge = (enquiry) => (
    <span className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold border-emerald-200 bg-emerald-50 text-emerald-700">
      {enquiry?.customerconvert[0]?.Convertedstatus || 'N/A'}
    </span>
  );

  return (
    <AdminShell
      title="Converted Today"
      subtitle="Customers converted today."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {view === "grid" ? (
        hasEnquiries ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {enquiries.map((enquiry, index) => (
              <RecordCard
                key={index}
                title={enquiry?.customerconvert[0]?.clientName || 'N/A'}
                subtitle={enquiry?.AddressDetails?.City || 'N/A'}
                badge={convertedBadge(enquiry)}
                onClick={() => setSelected(index)}
              >
                <CardField label="City" value={enquiry?.AddressDetails?.City || 'N/A'} />
                <CardField label="Created" value={new Date(enquiry?.createdAt).toLocaleString() || 'N/A'} />
              </RecordCard>
            ))}
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-10 text-center text-slate-500">No enquiries found.</div>
          </section>
        )
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Converted enquiries</h2>
            <p className="text-sm text-slate-500">Enquiries marked as converted today.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Client Name</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Converted Status</th>
                  <th className="px-5 py-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasEnquiries ? (
                  enquiries.map((enquiry, index) => (
                    <tr
                      key={index}
                      className="cursor-pointer hover:bg-slate-50/75"
                      onClick={() => setSelected(index)}
                    >
                      <td className="px-5 py-3 text-slate-900">{enquiry?.customerconvert[0]?.clientName || 'N/A'}</td>
                      <td className="px-5 py-3 text-slate-600">{enquiry?.AddressDetails?.City || 'N/A'}</td>
                      <td className="px-5 py-3">{convertedBadge(enquiry)}</td>
                      <td className="px-5 py-3 text-slate-600">{new Date(enquiry?.createdAt).toLocaleString() || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      No enquiries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DetailModal
        open={selected !== null}
        title={selectedEnquiry?.customerconvert[0]?.clientName || 'N/A'}
        subtitle="Converted enquiry details"
        onClose={() => setSelected(null)}
      >
        {selectedEnquiry && (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Client Name</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.customerconvert[0]?.clientName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.AddressDetails?.Address || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Country</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.AddressDetails?.Country || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">City</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.AddressDetails?.City || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Postal Code</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.AddressDetails?.PostalCode || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">State</dt>
              <dd className="text-sm text-slate-900">{selectedEnquiry?.AddressDetails?.State || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Converted Status</dt>
              <dd className="text-sm text-slate-900">{convertedBadge(selectedEnquiry)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Created At</dt>
              <dd className="text-sm text-slate-900">{new Date(selectedEnquiry?.createdAt).toLocaleString() || 'N/A'}</dd>
            </div>
          </dl>
        )}
      </DetailModal>
    </AdminShell>
  )
}

export default Yes;

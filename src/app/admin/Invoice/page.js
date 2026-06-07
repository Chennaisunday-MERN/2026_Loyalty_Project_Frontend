"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminShell, AdminPanel } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const statusBadgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('paid') || value.includes('complete') || value.includes('approve')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (value.includes('pending') || value.includes('draft')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (value.includes('cancel') || value.includes('reject') || value.includes('overdue')) {
    return 'border-red-200 bg-red-50 text-red-700';
  }
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
    {status}
  </span>
);

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const invoicesPerPage = 9;
  const token = localStorage.getItem('admintokens');

  // Latest first: prefer issueDate, then createdAt, then ObjectId (encodes creation time)
  const sortedInvoices = [...invoices].sort((a, b) => {
    const aKey = a.issueDate ? new Date(a.issueDate).getTime() : a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bKey = b.issueDate ? new Date(b.issueDate).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aKey !== bKey) return bKey - aKey;
    return String(b._id || '').localeCompare(String(a._id || ''));
  });
  const totalPages = Math.ceil(sortedInvoices.length / invoicesPerPage);
  const pagedInvoices = sortedInvoices.slice(
    (currentPage - 1) * invoicesPerPage,
    currentPage * invoicesPerPage
  );

  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    setSelected(null);
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    if (currentPage - delta > 2) range.unshift("...");
    if (currentPage + delta < totalPages - 1) range.push("...");
    if (totalPages > 1) {
      range.unshift(1);
      range.push(totalPages);
    }
    return range;
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:5005/api-invoice/invoices', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setInvoices(response.data);
      } catch (err) {
        setError('Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <AdminShell title="Proforma Invoices" subtitle="Review issued proforma invoices and their line items.">
        <p className="text-sm text-slate-500">Loading...</p>
      </AdminShell>
    );
  }
  if (error) {
    return (
      <AdminShell title="Proforma Invoices" subtitle="Review issued proforma invoices and their line items.">
        <p className="text-sm text-red-600">{error}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Proforma Invoices"
      subtitle="Review issued proforma invoices and their line items."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {invoices.length === 0 && (
        <AdminPanel title="No invoices">
          <p className="text-sm text-slate-500">No proforma invoices found.</p>
        </AdminPanel>
      )}

      {invoices.length > 0 && view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pagedInvoices.map((invoice) => (
            <RecordCard
              key={invoice._id}
              title={invoice.referenceNumber}
              subtitle={`PI ID: ${invoice.piId}`}
              badge={<StatusBadge status={invoice.Status} />}
              onClick={() => setSelected(invoice)}
            >
              <CardField label="Customer" value={invoice.name} />
              <CardField label="Total Payable" value={`₹${invoice.totalPayable}`} />
              <CardField label="Issue Date" value={new Date(invoice.issueDate).toLocaleDateString()} />
              <CardField label="Financial Year" value={invoice.financialYear} />
            </RecordCard>
          ))}
        </div>
      )}

      {invoices.length > 0 && view === "list" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Invoices</h2>
            <p className="text-sm text-slate-500">Click a row to view full invoice details.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">PI ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Total Payable</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedInvoices.map((invoice) => (
                  <tr
                    key={invoice._id}
                    onClick={() => setSelected(invoice)}
                    className="cursor-pointer hover:bg-slate-50/75"
                  >
                    <td className="px-5 py-3 font-medium text-slate-900">{invoice.referenceNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{invoice.piId}</td>
                    <td className="px-5 py-3 text-slate-600">{invoice.name}</td>
                    <td className="px-5 py-3 text-slate-600">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-900">₹{invoice.totalPayable}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={invoice.Status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <nav className="inline-flex -space-x-px overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm" aria-label="Pagination">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center border-r border-slate-200 px-3 py-2 text-sm font-medium ${
                currentPage === 1 ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </button>
            {getPaginationRange().map((page, idx) => (
              <button
                key={idx}
                onClick={() => (typeof page === "number" ? changePage(page) : null)}
                disabled={page === "..."}
                className={`relative inline-flex items-center border-r border-slate-200 px-4 py-2 text-sm font-medium ${
                  page === currentPage
                    ? "z-10 bg-slate-900 text-white"
                    : page === "..."
                    ? "cursor-default text-slate-400"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                currentPage === totalPages ? "cursor-not-allowed text-slate-300" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      )}

      <DetailModal
        open={!!selected}
        title={selected?.referenceNumber}
        subtitle={selected ? `PI ID: ${selected.piId}` : undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-6">
            {/* Invoice details */}
            <div className="flex flex-col gap-4">
              <div>
                <StatusBadge status={selected.Status} />
              </div>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer Name</dt>
                  <dd className="text-sm text-slate-900">{selected.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Address</dt>
                  <dd className="text-sm text-slate-900">{selected.address}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">GST</dt>
                  <dd className="text-sm text-slate-900">{selected.gstField}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Your Ref</dt>
                  <dd className="text-sm text-slate-900">{selected.yourRef}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Jurisdiction</dt>
                  <dd className="text-sm text-slate-900">{selected.jurisdiction}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Certification</dt>
                  <dd className="text-sm text-slate-900">{selected.certification ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Goods Return</dt>
                  <dd className="text-sm text-slate-900">{selected.goodsReturn ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Interest Rate</dt>
                  <dd className="text-sm text-slate-900">{selected.interestRate}%</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Financial Year</dt>
                  <dd className="text-sm text-slate-900">{selected.financialYear}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Issue Date</dt>
                  <dd className="text-sm text-slate-900">{new Date(selected.issueDate).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {/* Line Items */}
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Item Name</th>
                      <th className="px-5 py-3">Quantity</th>
                      <th className="px-5 py-3">Unit Price</th>
                      <th className="px-5 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.rows.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/75">
                        <td className="px-5 py-3 text-slate-900">{item.itemName}</td>
                        <td className="px-5 py-3 text-slate-600">{item.quantity}</td>
                        <td className="px-5 py-3 text-slate-600">₹{item.unitPrice}</td>
                        <td className="px-5 py-3 text-slate-900">₹{item.total}</td>
                      </tr>
                    ))}
                    {selected.rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                          No line items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <dl className="w-full max-w-xs space-y-2">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">Subtotal</dt>
                  <dd className="text-sm text-slate-900">₹{selected.subtotal}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">Freight</dt>
                  <dd className="text-sm text-slate-900">₹{selected.freight}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">GST</dt>
                  <dd className="text-sm text-slate-900">₹{selected.gst}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-slate-500">Round Off</dt>
                  <dd className="text-sm text-slate-900">₹{selected.roundOff}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <dt className="text-sm font-semibold text-slate-900">Total Payable</dt>
                  <dd className="text-sm font-semibold text-slate-900">₹{selected.totalPayable}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </DetailModal>
    </AdminShell>
  );
};

export default InvoiceList;

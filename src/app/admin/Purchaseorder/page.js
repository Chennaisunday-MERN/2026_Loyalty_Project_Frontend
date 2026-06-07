'use client';

import axios from 'axios';
import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle, AlertTriangle, DollarSign, Package, Calendar, Tag, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminShell, adminSecondaryButtonClass } from '../_components/AdminShell';
import { ViewToggle, RecordCard, CardField, DetailModal } from '../_components/RecordView';

const FIELD_LABELS = {
  paymentTerms: 'Payment Terms',
  warrantyTerms: 'Warranty Terms',
  deliveryTerms: 'Delivery Terms',
  gst: 'GST',
  gstAmount: 'GST Amount',
  totalAmount: 'Total Amount',
  hsnCode: 'HSN Code',
  unitDescription: 'Unit Description',
  uom: 'UOM',
  quantity: 'Quantity',
  unitPrice: 'Unit Price',
  amount: 'Amount',
};

const Purchaseorder = () => {
  const [getdata, setGetdata] = useState([]);
  const [view, setView] = useState('grid');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const purchasesPerPage = 9;

  const token = typeof window !== 'undefined' ? localStorage.getItem('admintokens') : null;
  const router = useRouter();

  // Fetch data from API
  const fetchData = async () => {
    if (!token) {
      setErrorMessage('Error: Missing authorization token.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.get('http://localhost:5005/api-purchaseorder/getPO', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.length > 0) {
        setGetdata(response.data);
        setTotalPages(Math.ceil(response.data.length / purchasesPerPage));
        setSuccessMessage(`Successfully loaded ${response.data.length} purchase orders.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('No purchase orders found.');
        setGetdata([]);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(
        `Error fetching data: ${
          error.response
            ? JSON.stringify(error.response.data, null, 2)
            : error.message
        }`
      );
      setGetdata([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Get current page purchases
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * purchasesPerPage;
    const endIndex = startIndex + purchasesPerPage;
    return getdata.slice(startIndex, endIndex);
  };

  // Change page handler
  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;

    setCurrentPage(pageNumber);
    setSelected(null); // Close the detail modal when changing page
  };

  // Returns the appropriate icon for the field
  const getFieldIcon = (field) => {
    switch(field) {
      case 'warrantyTerms': return <Calendar size={14} className="text-slate-400" />;
      case 'deliveryTerms': return <Package size={14} className="text-slate-400" />;
      case 'paymentTerms': return <DollarSign size={14} className="text-slate-400" />;
      case 'gst': return <Tag size={14} className="text-slate-400" />;
      default: return null;
    }
  };

  // Generate pagination numbers
  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    if (totalPages > 1) {
      range.unshift(1);
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const currentPageData = getCurrentPageData();

  const poTitle = (item, index) =>
    `Purchase Order ${item.EnquiryNo || (((currentPage - 1) * purchasesPerPage) + index + 1)}`;

  const payableBadge = (item) => (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        item.payableAmount
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}
    >
      {item.payableAmount ? `Payable ${item.payableAmount}` : 'Pending'}
    </span>
  );

  return (
    <AdminShell
      title="PO Requests"
      subtitle="Review purchase order requests and their line items."
      actions={
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      }
    >
      {/* Status Messages */}
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
          <p className="text-sm text-slate-600">Loading purchase orders...</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={16} />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={16} />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        currentPageData.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {currentPageData.map((item, index) => (
              <RecordCard
                key={index}
                title={poTitle(item, index)}
                subtitle={item.Eid ? `ID ${item.Eid}` : 'No ID'}
                badge={payableBadge(item)}
                onClick={() => setSelected({ item, index })}
              >
                <CardField label="Payable Amount" value={item.payableAmount || '—'} />
                <CardField label="Total Amount" value={item.totalAmount || '—'} />
                <CardField label="Payment Terms" value={item.paymentTerms || '—'} />
                <CardField label="Products" value={item.rows ? item.rows.length : 0} />
              </RecordCard>
            ))}
          </div>
        ) : (
          !loading && (
            <section className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
              <p>There are currently no purchase orders available.</p>
              <button
                type="button"
                onClick={fetchData}
                className={`${adminSecondaryButtonClass} mt-4`}
              >
                Refresh
              </button>
            </section>
          )
        )
      )}

      {/* List view */}
      {view === 'list' && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Purchase orders</h2>
            <p className="text-sm text-slate-500">Click a row to view terms, amounts, and products.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Payable Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPageData.length > 0 ? (
                  currentPageData.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => setSelected({ item, index })}
                      className="cursor-pointer hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {poTitle(item, index)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{item.Eid || "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{item.payableAmount || "—"}</td>
                      <td className="px-5 py-3">{payableBadge(item)}</td>
                    </tr>
                  ))
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        <p>There are currently no purchase orders available.</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchData();
                          }}
                          className={`${adminSecondaryButtonClass} mt-4`}
                        >
                          Refresh
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Detail modal */}
      <DetailModal
        open={!!selected}
        title={selected ? poTitle(selected.item, selected.index) : ''}
        subtitle={selected && selected.item.Eid ? `ID ${selected.item.Eid}` : undefined}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                Purchase Order Details
              </h3>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {["paymentTerms", "warrantyTerms", "deliveryTerms", "gst", "gstAmount", "totalAmount"].map((field) => (
                  <div key={field}>
                    <dt className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {getFieldIcon(field)}
                      {FIELD_LABELS[field] || field}
                    </dt>
                    <dd className="text-sm text-slate-900">{selected.item[field] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Products Section */}
            {selected.item.rows && selected.item.rows.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Products
                  </h3>
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {selected.item.rows.length}
                  </span>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                          {["hsnCode", "unitDescription", "uom", "quantity", "unitPrice", "amount"].map((field) => (
                            <th key={field} className="px-5 py-3">
                              {FIELD_LABELS[field] || field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selected.item.rows.map((product, productIndex) => (
                          <tr key={productIndex} className="hover:bg-slate-50/75">
                            {["hsnCode", "unitDescription", "uom", "quantity", "unitPrice", "amount"].map((field) => (
                              <td key={field} className="px-5 py-3 text-slate-600">
                                {product[field] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <nav className="inline-flex -space-x-px overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm" aria-label="Pagination">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center border-r border-slate-200 px-3 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </button>

            {getPaginationRange().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' ? changePage(page) : null}
                disabled={page === "..."}
                className={`relative inline-flex items-center border-r border-slate-200 px-4 py-2 text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-slate-900 text-white'
                    : page === "..."
                    ? 'cursor-default text-slate-400'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      )}
    </AdminShell>
  );
};

export default Purchaseorder;

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminShell } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const statusBadgeClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (["approved", "accepted", "completed", "done", "paid"].some((s) => value.includes(s))) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["rejected", "cancelled", "canceled", "failed", "hot"].some((s) => value.includes(s))) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (["pending", "warm", "progress", "review"].some((s) => value.includes(s))) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(status)}`}>
    {status}
  </span>
);

const Quotations = () => {
    const [quotations, setQuotations] = useState([]);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("grid");
    const [selected, setSelected] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const quotationsPerPage = 9;

    // Latest first: prefer createdAt, fall back to ObjectId (encodes creation time)
    const sortedQuotations = [...quotations].sort((a, b) => {
      const aKey = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bKey = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aKey !== bKey) return bKey - aKey;
      return String(b._id || "").localeCompare(String(a._id || ""));
    });
    const totalPages = Math.ceil(sortedQuotations.length / quotationsPerPage);
    const pagedQuotations = sortedQuotations.slice(
      (currentPage - 1) * quotationsPerPage,
      currentPage * quotationsPerPage
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
      const fetchQuotations = async () => {
        try {
          const token = localStorage.getItem("admintokens");

          const response = await axios.get("http://localhost:5005/api/GetAllquotation", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          setQuotations(response.data.data);
        } catch (error) {
          setError(error.response?.data?.message || error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchQuotations();
    }, []);

    const handleBackClick = () => {
      router.push("/admin/adminDasboard");
    };

    if (loading) {
      return (
        <AdminShell title="All Quotations" subtitle="Review every quotation issued to customers.">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
            Loading...
          </div>
        </AdminShell>
      );
    }
    if (error) {
      return (
        <AdminShell title="All Quotations" subtitle="Review every quotation issued to customers.">
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Error: {error}
          </div>
        </AdminShell>
      );
    }

    return (
      <AdminShell
        title="All Quotations"
        subtitle="Review every quotation issued to customers."
        actions={<ViewToggle view={view} onChange={setView} />}
      >
        {view === "grid" ? (
          quotations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
              No quotations found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pagedQuotations.map((quotation) => (
                <RecordCard
                  key={quotation._id}
                  title={`Enquiry ${quotation.EnquiryNo}`}
                  subtitle={`Ref ${quotation.ReferenceNumber}`}
                  badge={<StatusBadge status={quotation.Status} />}
                  onClick={() => setSelected(quotation)}
                >
                  <CardField label="Payable" value={quotation.PayableAmount} />
                  <CardField label="Payment Due" value={`${quotation.Paymentdue} days`} />
                  <CardField label="Validity" value={quotation.validity} />
                  <CardField
                    label="Products"
                    value={`${quotation.products.length} item${quotation.products.length === 1 ? "" : "s"}`}
                  />
                </RecordCard>
              ))}
            </div>
          )
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Latest quotations</h2>
              <p className="text-sm text-slate-500">{quotations.length} quotation{quotations.length === 1 ? "" : "s"} on record</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Enquiry No</th>
                    <th className="px-5 py-3">Reference No</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Total Payable Amount</th>
                    <th className="px-5 py-3">Payment Due</th>
                    <th className="px-5 py-3">Validity</th>
                    <th className="px-5 py-3">Warranty</th>
                    <th className="px-5 py-3">Delivery</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3">GST</th>
                    <th className="px-5 py-3">Products</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-10 text-center text-slate-500">
                        No quotations found.
                      </td>
                    </tr>
                  )}
                  {pagedQuotations.map((quotation) => (
                    <tr
                      key={quotation._id}
                      className="cursor-pointer hover:bg-slate-50/75"
                      onClick={() => setSelected(quotation)}
                    >
                      <td className="px-5 py-3 text-slate-900">{quotation.EnquiryNo}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.ReferenceNumber}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={quotation.Status} />
                      </td>
                      <td className="px-5 py-3 text-slate-900">{quotation.PayableAmount}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.Paymentdue} days</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.validity}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.Warranty}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.Delivery}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.Discount}</td>
                      <td className="px-5 py-3 text-slate-600">{quotation.Gst}%</td>
                      <td className="px-5 py-3 text-slate-600">
                        {quotation.products.length} item{quotation.products.length === 1 ? "" : "s"}
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
          title={selected ? `Enquiry ${selected.EnquiryNo}` : ""}
          subtitle={selected ? `Reference ${selected.ReferenceNumber}` : ""}
          onClose={() => setSelected(null)}
        >
          {selected && (
            <div className="space-y-6">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Enquiry No</dt>
                  <dd className="text-sm text-slate-900">{selected.EnquiryNo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Reference No</dt>
                  <dd className="text-sm text-slate-900">{selected.ReferenceNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">
                    <StatusBadge status={selected.Status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Payable Amount</dt>
                  <dd className="text-sm text-slate-900">{selected.PayableAmount}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Payment Due</dt>
                  <dd className="text-sm text-slate-900">{selected.Paymentdue} days</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Validity</dt>
                  <dd className="text-sm text-slate-900">{selected.validity}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Warranty</dt>
                  <dd className="text-sm text-slate-900">{selected.Warranty}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Delivery</dt>
                  <dd className="text-sm text-slate-900">{selected.Delivery}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Discount</dt>
                  <dd className="text-sm text-slate-900">{selected.Discount}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">GST</dt>
                  <dd className="text-sm text-slate-900">{selected.Gst}%</dd>
                </div>
              </dl>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Products ({selected.products.length})
                </h3>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-3">#</th>
                          <th className="px-5 py-3">Description</th>
                          <th className="px-5 py-3">HSN Code</th>
                          <th className="px-5 py-3">Unit Description</th>
                          <th className="px-5 py-3">UOM</th>
                          <th className="px-5 py-3">Quantity</th>
                          <th className="px-5 py-3">Unit Price</th>
                          <th className="px-5 py-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selected.products.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                              No products.
                            </td>
                          </tr>
                        )}
                        {selected.products.map((product, idx) => (
                          <tr key={product._id} className="hover:bg-slate-50/75">
                            <td className="px-5 py-3 text-slate-500">{idx + 1}</td>
                            <td className="px-5 py-3 text-slate-900">{product.Description}</td>
                            <td className="px-5 py-3 text-slate-600">{product.HSNCode}</td>
                            <td className="px-5 py-3 text-slate-600">{product.UnitDescription}</td>
                            <td className="px-5 py-3 text-slate-600">{product.UOM}</td>
                            <td className="px-5 py-3 text-slate-600">{product.Quantity}</td>
                            <td className="px-5 py-3 text-slate-600">{product.UnitPrice}</td>
                            <td className="px-5 py-3 font-medium text-slate-900">{product.Total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DetailModal>
      </AdminShell>
    );
  };


export default Quotations;

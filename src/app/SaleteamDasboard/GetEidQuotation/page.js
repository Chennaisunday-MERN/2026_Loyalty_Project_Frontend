"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FileText, Eye } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  SearchInput,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
  Badge,
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../../_components/ui";

const statusTone = (status) => {
  const s = (status || "").toLowerCase();
  if (s.includes("access")) return "green";
  if (s.includes("req")) return "amber";
  if (s.includes("edit")) return "violet";
  return "blue";
};

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const Eid = typeof window !== "undefined" ? localStorage.getItem("idstore") : null;

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const token = localStorage.getItem("admintokens");
        const response = await axios.get(`http://localhost:5005/api/GetEidquotation/${Eid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuotations(response.data.data || []);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotations();
  }, []);

  const handleBackClick = () => {
    router.push("/SaleteamDasboard/Dasboard");
  };

  const filtered = quotations.filter((q) => {
    const term = search.toLowerCase();
    return (
      (q.ReferenceNumber || "").toLowerCase().includes(term) ||
      (q.EnquiryNo || "").toLowerCase().includes(term) ||
      (q.Status || "").toLowerCase().includes(term)
    );
  });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Quotations"
        subtitle="All quotations you have created. Open one to view the full details."
        onBack={handleBackClick}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {loading ? (
        <LoadingBlock label="Loading quotations…" />
      ) : selected ? (
        <QuotationDetail quotation={selected} onBack={() => setSelected(null)} />
      ) : quotations.length === 0 ? (
        <EmptyState title="No quotations yet" subtitle="Quotations you create will appear here." />
      ) : (
        <>
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, enquiry or status…"
            className="max-w-md"
          />

          <TableWrap>
            <thead>
              <tr>
                <Th>Reference No</Th>
                <Th>Enquiry No</Th>
                <Th>Status</Th>
                <Th>Items</Th>
                <Th>Payable Amount</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q._id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{q.ReferenceNumber || "—"}</Td>
                  <Td>{q.EnquiryNo || "—"}</Td>
                  <Td>
                    <Badge tone={statusTone(q.Status)}>{q.Status}</Badge>
                  </Td>
                  <Td>{q.products?.length || 0}</Td>
                  <Td className="font-semibold text-slate-900">
                    ₹{Number(q.PayableAmount || 0).toLocaleString("en-IN")}
                  </Td>
                  <Td>{q.createdAt ? new Date(q.createdAt).toLocaleDateString("en-GB") : "—"}</Td>
                  <Td>
                    <button
                      onClick={() => setSelected(q)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          {filtered.length === 0 && (
            <EmptyState title="No matching quotations" subtitle="Try a different search term." />
          )}
        </>
      )}
    </PageShell>
  );
};

/* ---------- Full quotation viewing page ---------- */

function QuotationDetail({ quotation, onBack }) {
  const meta = [
    { label: "Enquiry No", value: quotation.EnquiryNo },
    { label: "Reference No", value: quotation.ReferenceNumber },
    { label: "Financial Year", value: quotation.financialYear },
    { label: "Created", value: quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString("en-GB") : null },
    { label: "Payment Due", value: quotation.Paymentdue ? `${quotation.Paymentdue} days` : null },
    { label: "Validity", value: quotation.validity },
    { label: "Warranty", value: quotation.Warranty },
    { label: "Delivery", value: quotation.Delivery },
    { label: "Discount", value: quotation.Discount },
    { label: "GST", value: quotation.Gst ? `${quotation.Gst}%` : null },
    { label: "Freight", value: quotation.Freight },
    { label: "Additional Discount", value: quotation.discount },
  ];

  const products = quotation.products || [];

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <FileText size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{quotation.ReferenceNumber || "Quotation"}</h2>
            <p className="text-sm text-slate-500">Enquiry {quotation.EnquiryNo || "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={statusTone(quotation.Status)}>{quotation.Status}</Badge>
          <SecondaryButton onClick={onBack}>Back to list</SecondaryButton>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid gap-x-8 gap-y-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {meta.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-sm text-slate-800">{value || "—"}</p>
          </div>
        ))}
      </div>

      {/* Products */}
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Products ({products.length})</h3>
      <TableWrap>
        <thead>
          <tr>
            <Th>#</Th>
            <Th>HSN Code</Th>
            <Th>Description</Th>
            <Th>Unit Description</Th>
            <Th>UOM</Th>
            <Th>Qty</Th>
            <Th>Unit Price</Th>
            <Th>LP</Th>
            <Th>Total</Th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p._id || i} className="hover:bg-slate-50">
              <Td className="text-slate-500">{i + 1}</Td>
              <Td className="font-medium text-slate-900">{p.HSNCode || "—"}</Td>
              <Td>{p.Description || "—"}</Td>
              <Td>{p.UnitDescription || "—"}</Td>
              <Td>{p.UOM || "—"}</Td>
              <Td>{p.Quantity || "—"}</Td>
              <Td>₹{Number(p.UnitPrice || 0).toLocaleString("en-IN")}</Td>
              <Td>{p.LP || "—"}</Td>
              <Td className="font-medium text-slate-900">₹{Number(p.Total || 0).toLocaleString("en-IN")}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      {/* Totals */}
      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-xs space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">GST</span>
            <span className="font-medium text-slate-700">{quotation.Gst ? `${quotation.Gst}%` : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Freight</span>
            <span className="font-medium text-slate-700">₹{Number(quotation.Freight || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-semibold text-slate-700">Total Payable</span>
            <span className="text-lg font-bold text-blue-700">
              ₹{Number(quotation.PayableAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default Quotations;

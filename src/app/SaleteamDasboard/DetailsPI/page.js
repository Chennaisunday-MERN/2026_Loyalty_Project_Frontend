"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  LoadingBlock,
  ErrorBanner,
} from "../../_components/ui";

export default function InvoiceDetail() {
  const searchParams = useSearchParams();
  const piId = searchParams.get("piId");
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [editableInvoice, setEditableInvoice] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!piId) return;

    const fetchInvoiceData = async () => {
      const token = localStorage.getItem("admintokens");

      if (!token) {
        setError("Authorization token is missing");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5005/api-invoice/byPiId/${piId}`, // Fetch by PI ID
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInvoice(response.data);
        setEditableInvoice(response.data);
        
        if (response.data.items && Array.isArray(response.data.items)) {
          setRows(response.data.items);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Fetch failed");
      }
    };

    fetchInvoiceData();
  }, [piId]);

  const handleChange = (field, value) => {
    setEditableInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("admintokens");

    try {
      await axios.put(
        `http://localhost:5005/api-invoice/${piId}`,
        editableInvoice,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setInvoice(editableInvoice);
      setIsEditing(false);
      alert("Invoice updated successfully");

      // Navigate to the Edit PI page after saving the invoice
    } catch (err) {
      alert("Failed to save changes: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async () => {
    const token = localStorage.getItem("admintokens");
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      await axios.delete(`http://localhost:5005/api-invoice/${piId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Invoice deleted successfully");
      window.history.back();
    } catch (err) {
      alert("Failed to delete invoice: " + (err.response?.data?.message || err.message));
    }
  };

  if (error)
    return (
      <PageShell>
        <ErrorBanner>{error}</ErrorBanner>
      </PageShell>
    );
  if (!invoice)
    return (
      <PageShell>
        <LoadingBlock label="Loading invoice details…" />
      </PageShell>
    );

  const fieldsToShow = [
    { label: "PI ID", field: "piId" },
    { label: "Reference Number", field: "referenceNumber" },
    { label: "Customer Name", field: "name" },
    { label: "Status", field: "Status" },
    { label: "Address", field: "address" },
    { label: "GST Field", field: "gstField" },
    { label: "Your Reference", field: "yourRef" },
    { label: "Jurisdiction", field: "jurisdiction" },
    { label: "Certification", field: "certification" },
    { label: "Goods Return", field: "goodsReturn" },
    { label: "Interest Rate", field: "interestRate" },
    { label: "EID", field: "Eid" },
    { label: "Enquiry No", field: "EnquiryNo" },
    { label: "Subtotal", field: "subtotal" },
    { label: "Freight", field: "freight" },
    { label: "GST", field: "gst" },
    { label: "Round Off", field: "roundOff" },
    { label: "Total Payable", field: "totalPayable" },
    { label: "Financial Year", field: "financialYear" },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Invoice Details"
        subtitle="View and edit this proforma invoice."
        onBack={() => router.push('/SaleteamDasboard/Dasboard')}
        actions={
          isEditing ? (
            <>
              <PrimaryButton onClick={handleSave}>Save</PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setEditableInvoice(invoice);
                  setIsEditing(false);
                }}
              >
                Cancel
              </SecondaryButton>
            </>
          ) : (
            <>
              <PrimaryButton onClick={() => setIsEditing(true)}>Edit</PrimaryButton>
              <SecondaryButton onClick={handleDelete}>Delete</SecondaryButton>
              {/* PDF button removed from here */}
            </>
          )
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldsToShow.map(({ label, field }) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={
                    typeof editableInvoice[field] === "boolean"
                      ? editableInvoice[field].toString()
                      : editableInvoice[field] ?? ""
                  }
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <p className="text-sm font-medium text-slate-800">
                  {["issueDate", "createdAt", "updatedAt"].includes(field)
                    ? new Date(invoice[field]).toLocaleString()
                    : invoice[field]?.toString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div>
        <SecondaryButton onClick={() => router.push('/SaleteamDasboard/GetPI')}>
          Back to Invoices
        </SecondaryButton>
      </div>
    </PageShell>
  );
}
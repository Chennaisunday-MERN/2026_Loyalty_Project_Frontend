"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Pencil, X, Plus, Save } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
  LoadingBlock,
  EmptyState,
} from "../../_components/ui";

export default function EditPOPage() {
  const searchParams = useSearchParams();
  const poNumber = searchParams.get("poNumber");
  const router = useRouter();
  const [poData, setPoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const Eid = typeof window !== "undefined" ? localStorage.getItem("idstore") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;

  useEffect(() => {
    const fetchPO = async () => {
      if (!poNumber || !token) return;

      try {
        const res = await axios.get(
          `http://localhost:5005/api-purchaseorder/POGetAllPOfull?poNumber=${encodeURIComponent(poNumber)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPoData(res.data);
      } catch (err) {
        console.error("❌ Error fetching PO:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPO();
  }, [poNumber, token]);

  // Recalculate the order totals from the line items and GST percentage.
  const computeTotals = (rows, gst) => {
    const totalAmount = (rows || []).reduce(
      (sum, r) => sum + (parseFloat(r.amount) || 0),
      0
    );
    const gstValue = parseFloat(gst) || 0;
    const gstAmount = (totalAmount * gstValue) / 100;
    const payableAmount = totalAmount + gstAmount;
    return {
      totalAmount: totalAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      payableAmount: payableAmount.toFixed(2),
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPoData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "gst") {
        Object.assign(next, computeTotals(prev.rows, value));
      }
      return next;
    });
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...poData.rows];
    updatedRows[index][field] = value;

    // Editing Quantity or Unit Price auto-derives the row Amount.
    // Editing the Amount directly keeps the typed value as-is.
    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(updatedRows[index].quantity) || 0;
      const unitPrice = parseFloat(updatedRows[index].unitPrice) || 0;
      updatedRows[index].amount = (quantity * unitPrice).toFixed(2);
    }

    // Recompute the order totals from the (possibly manually edited) amounts.
    setPoData({ ...poData, rows: updatedRows, ...computeTotals(updatedRows, poData.gst) });
  };

  const handleAddProduct = () => {
    setPoData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          hsnCode: "",
          unitDescription: "",
          uom: "",
          quantity: 0,
          unitPrice: 0,
          amount: 0,
        },
      ],
    }));
  };

  const handleUpdate = async () => {
    try {
      const updatedData = {
        ...poData,
        Eid,
      };

      const res = await axios.put(
        `http://localhost:5005/api-purchaseorder/updatePO?poNumber=${encodeURIComponent(poNumber)}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`✅ New PO created: ${res.data.newPoNumber}`);
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Error updating PO:", err);
      alert("Error updating PO");
    }
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  if (loading) return <PageShell><LoadingBlock label="Loading Purchase Order..." /></PageShell>;
  if (!poData) return <PageShell><EmptyState title="No Purchase Order found." /></PageShell>;

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 read-only:bg-slate-100";
  const cellInputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 read-only:bg-slate-100";
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Procurement"
        title={`Purchase Order: ${poNumber}`}
        subtitle="Review and edit purchase order details."
        onBack={() => router.push("/SaleteamDasboard/GetPO")}
        actions={
          <SecondaryButton onClick={toggleEditMode}>
            {isEditing ? <X size={16} /> : <Pencil size={16} />}
            {isEditing ? "Cancel Edit" : "Edit PO"}
          </SecondaryButton>
        }
      />

      {/* General Terms */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">General Details</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { label: "Supplier Name", name: "SupplierName", type: "text" },
            { label: "Financial Year", name: "financialYear", type: "text", readOnly: true },
            { label: "Address", name: "Address", type: "textarea" },
            { label: "Ref Quote No", name: "RefQNo", type: "text" },
            { label: "GSTIN", name: "GSTIN", type: "text" },
            { label: "Quote Date", name: "QDate", type: "date" },
          ].map(({ label, name, type, readOnly = false }) => (
            <div key={name} className="flex flex-col">
              <label className={labelClass}>{label}</label>
              {type === "textarea" ? (
                <textarea
                  name={name}
                  value={poData[name] || ""}
                  onChange={handleChange}
                  readOnly={readOnly || !isEditing}
                  className={inputClass}
                />
              ) : (
                <input
                  type={type}
                  name={name}
                  value={poData[name] || ""}
                  onChange={handleChange}
                  readOnly={readOnly || !isEditing}
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Items Section */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-slate-900">Items</h3>
        <TableWrap>
          <thead>
            <tr>
              {["HSN Code", "Unit Description", "Description", "UOM", "Quantity", "Unit Price", "Amount"].map((header) => (
                <Th key={header}>{header}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poData.rows?.map((row, index) => (
              <tr key={row._id || index} className="hover:bg-slate-50">
                {["hsnCode", "unitDescription", "Description", "uom", "quantity", "unitPrice", "amount"].map((field) => (
                  <Td key={field}>
                    <input
                      type={field === "quantity" || field === "unitPrice" || field === "amount" ? "number" : "text"}
                      value={row[field] || ""}
                      onChange={(e) => handleRowChange(index, field, e.target.value)}
                      readOnly={!isEditing}
                      className={cellInputClass}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrap>

        {isEditing && (
          <SecondaryButton onClick={handleAddProduct}>
            <Plus size={16} />
            Add Product
          </SecondaryButton>
        )}
      </div>

      {/* Totals and Metadata */}
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Totals & Terms</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            { label: "Payable Amount", name: "payableAmount" },
            { label: "GST Amount", name: "gstAmount" },
            { label: "Total Amount", name: "totalAmount" },
            { label: "GST (%)", name: "gst" },
            { label: "PO Number", name: "poNumber" },
            { label: "Delivery Terms", name: "deliveryTerms" },
            { label: "Warranty Terms", name: "warrantyTerms" },
            { label: "Payment Terms", name: "paymentTerms" },
            { label: "LP", name: "LP" },
            { label: "discount", name: "discount" },
          ].map(({ label, name }) => (
            <div key={name} className="flex flex-col">
              <label className={labelClass}>{label}</label>
              <input
                type="text"
                name={name}
                value={poData[name] || ""}
                onChange={handleChange}
                readOnly={!isEditing}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <PrimaryButton onClick={handleUpdate}>
            <Save size={16} />
            Save New PO
          </PrimaryButton>
        </div>
      )}
    </PageShell>
  );
}

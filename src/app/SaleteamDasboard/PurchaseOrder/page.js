"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Save } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  ErrorBanner,
  TableWrap,
  Th,
  Td,
} from "../../_components/ui";

const PurchaseOrder = () => {
  const router = useRouter();
  const Eid = typeof window !== "undefined" ? localStorage.getItem("idstore") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;

  const [formData, setFormData] = useState({
    rows: [
      {
        hsnCode: "",
        unitDescription: "",
        uom: "",
        quantity: 0,
        unitPrice: 0,
        amount: 0,
      },
    ],
    gst: 0,
    gstAmount: 0,
    totalAmount: 0,
    payableAmount: 0,
    deliveryTerms: "",
    warrantyTerms: "",
    paymentTerms: "",
    financialYear: "",
    Address: "",
    SupplierName: "",
    LP:"",
    discount:"",
    RefQNo: "",
    QDate: "",
    GSTIN: "",
    Eid,
  });

  const [otherTerms, setOtherTerms] = useState({
    paymentTerms: "",
    warrantyTerms: "",
    deliveryTerms: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const calculateTotals = (products, gstValue) => {
    let totalAmount = 0;
    const gst = Number(gstValue);

    const updatedProducts = products.map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = quantity * unitPrice;
      const gstAmount = (amount * gst) / 100;
      const rowTotal = amount + gstAmount;

      totalAmount += amount;

      return {
        ...item,
        gst,
        amount: amount.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        totalAmount: rowTotal.toFixed(2),
      };
    });

    const totalGstAmount = (totalAmount * gst) / 100;
    const payableAmount = totalAmount + totalGstAmount;

    setFormData((prev) => ({
      ...prev,
      rows: updatedProducts,
      gst,
      totalAmount: totalAmount.toFixed(2),
      gstAmount: totalGstAmount.toFixed(2),
      payableAmount: payableAmount.toFixed(2),
    }));
  };

  const handleProductChange = (e, index) => {
    const { name, value } = e.target;
    const updatedRows = [...formData.rows];
    updatedRows[index][name] = value;

    setFormData((prev) => ({ ...prev, rows: updatedRows }));
    calculateTotals(updatedRows, formData.gst);
  };

  const handleGSTChange = (e) => {
    const gstValue = e.target.value;
    setFormData((prev) => ({ ...prev, gst: gstValue }));
    calculateTotals(formData.rows, gstValue);
  };

  const addProduct = () => {
    const newProduct = {
      hsnCode: "",
      unitDescription: "",
      uom: "",
      quantity: 0,
      unitPrice: 0,
      amount: 0,
    };
    setFormData((prev) => ({ ...prev, rows: [...prev.rows, newProduct] }));
  };

  const handleSelectChange = (e, field) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (value !== "Others") {
      setOtherTerms((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const financialYearPattern = /^(\d{2})-(\d{2})$/;
    if (!financialYearPattern.test(formData.financialYear)) {
      setErrorMessage("Please enter a valid financial year (e.g., 24-25).");
      setLoading(false);
      return;
    }

    if (!formData.paymentTerms || !formData.deliveryTerms || !formData.warrantyTerms) {
      setErrorMessage("All terms (Payment, Delivery, Warranty) must be filled out.");
      setLoading(false);
      return;
    }

    const finalFormData = { ...formData };

    ["paymentTerms", "warrantyTerms", "deliveryTerms"].forEach((term) => {
      if (formData[term] === "Others") {
        finalFormData[term] = otherTerms[term] || "Others";
      }
    });

    try {
      await axios.post("http://localhost:5005/api-purchaseorder/create-PO", finalFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      alert("Purchase Order submitted successfully!");
      router.push(`/SaleteamDasboard/Poppdf?Eid=${formData.Eid}`);

      // Reset form
      setFormData({
        rows: [
          {
            hsnCode: "",
            unitDescription: "",
            uom: "",
            quantity: 0,
            unitPrice: 0,
            amount: 0,
          },
        ],
        gst: 0,
        gstAmount: 0,
        totalAmount: 0,
        payableAmount: 0,
        deliveryTerms: "",
        warrantyTerms: "",
        paymentTerms: "",
        financialYear: "",
        Address: "",
        SupplierName: "",
        RefQNo: "",
        QDate: "",
        GSTIN: "",
        Eid,
      });

      setOtherTerms({
        paymentTerms: "",
        warrantyTerms: "",
        deliveryTerms: "",
      });

    } catch (err) {
      console.error("Error submitting:", err);
      setErrorMessage("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const fieldLabelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const cellInputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Procurement"
        title="Create Purchase Order"
        subtitle="Add line items, terms and supplier details to raise a PO."
        onBack={() => router.push('/SaleteamDasboard/Inventory')}
      />

      {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <TableWrap>
          <thead>
            <tr>
              {["HSN Code", "UnitDescription", "Description", "UOM", "Qty", "Unit Price", "Amount"].map((title) => (
                <Th key={title}>{title}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formData.rows.map((product, index) => (
              <tr key={index} className="hover:bg-slate-50">
                {["hsnCode", "unitDescription", "Description", "uom", "quantity", "unitPrice", "amount"].map((field) => (
                  <Td key={field}>
                    <input
                      type={["quantity", "unitPrice"].includes(field) ? "number" : "text"}
                      name={field}
                      value={product[field]}
                      onChange={(e) => handleProductChange(e, index)}
                      readOnly={field === "amount"}
                      className={field === "amount" ? `${cellInputClass} bg-slate-100` : cellInputClass}
                      placeholder={field}
                    />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <SecondaryButton onClick={addProduct}>
          <Plus size={16} />
          Add Product
        </SecondaryButton>

        <Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {["paymentTerms", "warrantyTerms", "deliveryTerms"].map((term) => (
              <div key={term}>
                <label className={`${fieldLabelClass} capitalize`}>
                  {term.replace("Terms", " Terms")}
                </label>
                <select
                  value={formData[term]}
                  onChange={(e) => handleSelectChange(e, term)}
                  className={fieldInputClass}
                >
                  <option value="">Select option</option>
                  <option value="100% against proforma Invoice">100% against proforma Invoice</option>
                  <option value="100% against delivery">100% against delivery</option>
                  <option value="30 days PDC">30 days PDC</option>
                  <option value="50% advance & 50% against delivery">50% advance & 50% against delivery</option>
                  <option value="Others">Others</option>
                </select>

                {formData[term] === "Others" && (
                  <input
                    type="text"
                    placeholder="Please specify"
                    value={otherTerms[term]}
                    onChange={(e) =>
                      setOtherTerms((prev) => ({ ...prev, [term]: e.target.value }))
                    }
                    className={`${fieldInputClass} mt-2`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="space-y-4">
            <div>
              <label className={fieldLabelClass}>Financial Year</label>
              <input
                type="text"
                name="financialYear"
                value={formData.financialYear}
                onChange={handleInputChange}
                className={fieldInputClass}
                placeholder="e.g., 24-25"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>GST (%)</label>
              <input
                type="number"
                value={formData.gst}
                onChange={handleGSTChange}
                className={fieldInputClass}
                placeholder="Enter GST percentage"
              />
            </div>
            <div>
              <label className={fieldLabelClass}>LP</label>
              <input
                type="text"
                name="LP"
                value={formData.LP}
                onChange={handleInputChange}
                className={fieldInputClass}
                placeholder="Enter LP"
              />
            </div>

            <div>
              <label className={fieldLabelClass}>Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                className={fieldInputClass}
                placeholder="Enter Discount Percentage"
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <h3 className="border-b border-slate-100 pb-2 text-base font-semibold text-slate-900">Order Summary</h3>
            <div className="flex justify-between text-sm text-slate-700">
              <span>Total Amount</span>
              <span>₹ {formData.totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-700">
              <span>GST Amount</span>
              <span>₹ {formData.gstAmount}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
              <span>Total Payable</span>
              <span>₹ {formData.payableAmount}</span>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <div>
            <label className={fieldLabelClass}>Address Details</label>
            <textarea
              name="Address"
              value={formData.Address}
              onChange={handleInputChange}
              className={fieldInputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>Customer Name</label>
            <input
              type="text"
              name="SupplierName"
              value={formData.SupplierName}
              onChange={handleInputChange}
              className={fieldInputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>GSTIN/UIN</label>
            <input
              type="text"
              name="GSTIN"
              value={formData.GSTIN}
              onChange={handleInputChange}
              className={fieldInputClass}
            />
          </div>

          <div>
            <label className={fieldLabelClass}>RefQNo</label>
            <input
              type="text"
              name="RefQNo"
              value={formData.RefQNo}
              onChange={handleInputChange}
              className={fieldInputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>QDate</label>
            <input
              type="date"
              name="QDate"
              value={formData.QDate}
              onChange={handleInputChange}
              className={fieldInputClass}
            />
          </div>
        </Card>

        <PrimaryButton type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0..." />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <Save size={16} />
              Submit Purchase Order
            </>
          )}
        </PrimaryButton>
      </form>
    </PageShell>
  );
};

export default PurchaseOrder;

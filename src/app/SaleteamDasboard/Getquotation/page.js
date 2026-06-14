"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Plus, Pencil, X, Save } from "lucide-react";
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
  ErrorBanner,
} from "../../_components/ui";

const Getquotation = () => {
  const searchparams = useSearchParams();
  const mode = searchparams.get("mode") || "view";
  const EnquiryNo = searchparams.get("EnquiryNo");
  const Eid = localStorage.getItem("idstore");
  const token = localStorage.getItem("admintokens");

  const [formData, setFormData] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [revisionNumber, setRevisionNumber] = useState("");
  const router = useRouter();
  const formRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let dataFromAPI2 = null;  // First, assume no data from the Edit API
        let dataFromAPI1 = null;  // For fallback to the Get API if necessary
  
        // Try fetching data from the quotationEditOne API first
        try {
          const response2 = await axios.get(
            `http://localhost:5005/api/quotationEditOne/${EnquiryNo}/${Eid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response2.data?.data) {
            dataFromAPI2 = response2.data.data;  // If data exists, use this
          }
        } catch (error) {
          console.log("Error fetching from quotationEditOne:", error.message);
        }
  
        // If no data from the Edit API, fallback to fetching from the quotationGetOne API
        if (!dataFromAPI2) {
          try {
            const response1 = await axios.get(
              `http://localhost:5005/api/quotationGetOne/${EnquiryNo}/${Eid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response1.data?.data) {
              dataFromAPI1 = response1.data.data;  // Use data from the Get API if available
            }
          } catch (error) {
            console.log("Error fetching from quotationGetOne:", error.message);
          }
        }
  
        // Combine data or fallback if none is found
        const loadedData = dataFromAPI2 || dataFromAPI1;
        if (loadedData) {
          setFormData({
            ...loadedData,
            products: loadedData.products || [],
          });
        } else {
          setError("No data available from both APIs.");
        }
      } catch (error) {
        console.error("Fetching error:", error.message);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [EnquiryNo, Eid, token]);
  

  

  // Recalculate the overall payable amount from the line items, freight and GST.
  const computePayable = (products, gst, freight) => {
    const overallTotal = products.reduce(
      (sum, p) => sum + (Number(p.Quantity) || 0) * (Number(p.UnitPrice) || 0),
      0
    );
    const taxableAmount = overallTotal + (Number(freight) || 0);
    const gstValue = Number(gst) || 0;
    const finalAmount = taxableAmount + (gstValue > 0 ? (taxableAmount * gstValue) / 100 : 0);
    return finalAmount.toFixed(2);
  };

  const handleChange = (e, index, field) => {
    const updatedProducts = [...formData.products];
    const value = e.target.value;

    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value,
    };

    // Auto-calculate Total
    const quantity = parseFloat(
      field === "Quantity" ? value : updatedProducts[index].Quantity
    );
    const unitPrice = parseFloat(
      field === "UnitPrice" ? value : updatedProducts[index].UnitPrice
    );
    if (!isNaN(quantity) && !isNaN(unitPrice)) {
      updatedProducts[index].Total = (quantity * unitPrice).toFixed(2);
    }

    setFormData((prevData) => ({
      ...prevData,
      products: updatedProducts,
      PayableAmount: computePayable(updatedProducts, prevData.Gst, prevData.Freight),
    }));
  };

  // Recalculate the payable amount when GST is edited.
  const handleFieldChange = (field, value) => {
    setFormData((prevData) => {
      const next = { ...prevData, [field]: value };
      if (field === "Gst" || field === "Freight") {
        next.PayableAmount = computePayable(prevData.products || [], field === "Gst" ? value : prevData.Gst, field === "Freight" ? value : prevData.Freight);
      }
      return next;
    });
  };

  const handleAddProduct = () => {
    const newProduct = {
      HSNCode: "",
      UnitDescription: "",
      Description: "",
      Quantity: "",
      UnitPrice: "",
      UOM: "",
      Total: "",
      LP: "",
    };

    setFormData((prevData) => ({
      ...prevData,
      products: [...(prevData.products || []), newProduct],
    }));
  };

  const handleEditToggle = () => {
    setIsEditing((prev) => !prev);
    setErrorMessage("");
  };

  const handleSave = async () => {
    const { EnquiryNo, ...updateFields } = formData;

    if (!EnquiryNo || !formData.PayableAmount || !formData.Status) {
      setErrorMessage("Error: Please fill in all the required fields.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const dataToSave = {
        EnquiryNo,
        ...updateFields,
      };

      if (revisionNumber.trim()) {
        dataToSave.revisedVersion = revisionNumber.trim();
      }

      const response = await axios.put(
        "http://localhost:5005/api/editQuotation",
        dataToSave,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        router.push("/SaleteamDasboard/Dasboard");
      } else {
        setErrorMessage("Failed to update the quotation.");
      }
    } catch (error) {
      console.error("Update error:", error.message);
      setErrorMessage("Failed to update the quotation.");
    } finally {
      setLoading(false);
    }
  };

  const fieldInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";
  const cellInputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  if (loading) return <PageShell><LoadingBlock label="Loading quotation…" /></PageShell>;
  if (error)
    return (
      <PageShell>
        <ErrorBanner>{error}</ErrorBanner>
      </PageShell>
    );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Quotation Details"
        subtitle="Review and edit quotation line items and terms."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
        actions={
          mode !== "pdf" ? (
            <>
              <SecondaryButton onClick={handleEditToggle}>
                {isEditing ? <X size={16} /> : <Pencil size={16} />}
                {isEditing ? "Cancel Edit" : "Edit"}
              </SecondaryButton>
              {isEditing && (
                <PrimaryButton onClick={handleSave}>
                  <Save size={16} />
                  Save
                </PrimaryButton>
              )}
            </>
          ) : null
        }
      />

      <form ref={formRef} className="space-y-6">
        {/* Products Table */}
        <TableWrap>
          <thead>
            <tr>
              <Th>HSN Code</Th>
              <Th>Unit Description</Th>
              <Th>Description</Th>
              <Th>Quantity</Th>
              <Th>Unit Price</Th>
              <Th>UOM</Th>
              <Th>Total</Th>
              <Th>LP</Th>
            </tr>
          </thead>
          <tbody>
            {formData.products.map((product, index) => (
              <tr key={index} className="hover:bg-slate-50">
                {["HSNCode", "UnitDescription", "Description", "Quantity", "UnitPrice", "UOM", "Total", "LP"].map(
                  (field) => (
                    <Td key={field} className={field === "HSNCode" ? "font-medium text-slate-900" : ""}>
                      {isEditing && field !== "Total" ? (
                        <input
                          type={["Quantity", "UnitPrice"].includes(field) ? "number" : "text"}
                          value={product[field] || ""}
                          onChange={(e) => handleChange(e, index, field)}
                          className={cellInputClass}
                        />
                      ) : (
                        product[field]
                      )}
                    </Td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </TableWrap>

        {/* Add Product */}
        {isEditing && (
          <SecondaryButton onClick={handleAddProduct}>
            <Plus size={16} />
            Add Product
          </SecondaryButton>
        )}

        {/* Other fields */}
        <Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {["Paymentdue", "validity", "Warranty", "Delivery", "Discount", "PayableAmount", "Gst", "Status"].map(
              (field) => (
                <div key={field}>
                  <label className={labelClass}>{field}</label>
                  <input
                    name={field}
                    value={formData[field] || ""}
                    onChange={(e) => handleFieldChange(field, e.target.value)}
                    className={fieldInputClass}
                    disabled={!isEditing || field === "PayableAmount"}
                  />
                </div>
              )
            )}

            {/* Revision Number */}
            {isEditing && (
              <div className="md:col-span-2">
                <label className={labelClass}>Revision Number (e.g. R1, R2)</label>
                <input
                  name="revisionNumber"
                  value={revisionNumber}
                  onChange={(e) => setRevisionNumber(e.target.value)}
                  placeholder="Enter revision (e.g., R1)"
                  className={fieldInputClass}
                />
                <p className="mt-1 text-sm text-slate-500">
                  Current Reference: {formData.ReferenceNumber || "None"}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Error Message */}
        {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}
      </form>
    </PageShell>
  );
};

export default Getquotation;

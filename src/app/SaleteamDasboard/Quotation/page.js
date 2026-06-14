"use client";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Plus, FileText, Edit, X, Calculator, Archive } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
} from "../../_components/ui";

const Home = () => {
  const Eid = typeof window !== "undefined" ? localStorage.getItem('idstore') : null;
  const token = typeof window !== "undefined" ? localStorage.getItem('admintokens') : null;

  const searchparams = useSearchParams();
  const EnquiryNo = searchparams.get('EnquiryNo');
  const isRevise = searchparams.get('revise') === 'true';
  const referenceToRevise = searchparams.get('ref');

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    products: [{ HSNCode: '', UnitDescription: '', Description: '', UOM: '', Quantity: '', UnitPrice: '', Total: '', LP: '' }],
    Eid: Eid,
    UpdatedEid: Eid,
    discount:'',
    EnquiryNo: EnquiryNo,
    Paymentdue: '',
    validity: '',
    Warranty: '',
    Delivery: '',
    Discount: '',
    Gst: 0,
    Freight: '',
    PayableAmount: 0,
    financialYear: '',
    isRevision: isRevise || false,
    referenceToRevise: referenceToRevise || '',
    Status: 'quotsreq'
  });

  const [customFields, setCustomFields] = useState({
    Paymentdue: false,
    Discount: false,
    Warranty: false,
    Delivery: false,
    validity: false,
  });

  const [popup, setPopup] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  useEffect(() => {
    if (EnquiryNo && Eid) {
      getdataresponse();
      getdataeditresponse();
    }
  }, [EnquiryNo, Eid]);
  
  const getdataresponse = async () => {
    try {
      const response = await axios.get(`http://localhost:5005/api/quotationGetOne/${EnquiryNo}/${Eid}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      if (response.data.data?.Status === 'quotsaccess') {
        setPopup(true);
      }
    } catch (err) {
      console.error('Error getting the quotation:', err);
    }
  };

  const getdataeditresponse = async () => {
    try {
      const response = await axios.get(`http://localhost:5005/api/quotationEditOne/${EnquiryNo}/${Eid}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      if (response.data.data?.Status === 'Editaccess') {
        setPopup(true);
      }
    } catch (err) {
      console.error('Error getting the quotation:', err);
    }
  };

  const calculateTotals = (products) => {
    let overallTotal = 0;
    const updatedProducts = products.map((product) => {
      const quantity = Number(product.Quantity) || 0;
      const unitPrice = Number(product.UnitPrice) || 0;
      const total = quantity * unitPrice;
      overallTotal += total;
      return { ...product, Total: total.toFixed(2) };
    });
    
    // Calculate the final amount including freight and GST if provided
    const freight = Number(formData.Freight) || 0;
    const taxableAmount = overallTotal + freight;
    let finalAmount = taxableAmount;
    if (formData.Gst && formData.Gst > 0) {
      const gstAmount = taxableAmount * (Number(formData.Gst) / 100);
      finalAmount += gstAmount;
    }

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
      PayableAmount: finalAmount.toFixed(2),
    }));
  };

  const handleProductChange = (e, index) => {
    const { name, value } = e.target;
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [name]: value };
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
    calculateTotals(updatedProducts);
  };

  const addProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { HSNCode: '', UnitDescription: '', Description: '', UOM: '', Quantity: '', UnitPrice: '', Total: '', LP: '' }],
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, products: updatedProducts }));
      calculateTotals(updatedProducts);
    }
  };

  const handleSelectChange = (e, field) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setCustomFields((prev) => ({ ...prev, [field]: value === 'Others' }));
  };

  const handleCustomChange = (e, field) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleGstChange = (e) => {
    const gstValue = e.target.value;
    setFormData((prev) => ({ ...prev, Gst: gstValue }));
    // Recalculate totals to include the new GST value
    calculateTotals(formData.products);
  };

  const handleFreightChange = (e) => {
    const freightValue = e.target.value;
    const overallTotal = formData.products.reduce(
      (sum, p) => sum + (Number(p.Quantity) || 0) * (Number(p.UnitPrice) || 0),
      0
    );
    const freight = Number(freightValue) || 0;
    const taxableAmount = overallTotal + freight;
    const gst = Number(formData.Gst) || 0;
    const finalAmount = taxableAmount + (gst > 0 ? (taxableAmount * gst) / 100 : 0);
    setFormData((prev) => ({
      ...prev,
      Freight: freightValue,
      PayableAmount: finalAmount.toFixed(2),
    }));
  };

  const validateForm = () => {
    if (!formData.financialYear) {
      setError("Financial year is required");
      return false;
    }
    
    if (formData.products.length === 0) {
      setError("At least one product is required");
      return false;
    }
    
    // Check if any product has missing required fields
    const invalidProducts = formData.products.filter(p => 
      !p.HSNCode || !p.UnitDescription || !p.Description || !p.UOM || !p.UnitPrice
    );
    
    if (invalidProducts.length > 0) {
      setError("All product fields (HSN Code, Unit Description, Description, UOM, Unit Price) are required");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5005/api/Quatation', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setLoading(false);
      setReferenceNumber(response.data.referenceNumber);
      alert('Quotation submitted successfully!');

      // Reset form after successful submission
      setFormData({
        products: [{ HSNCode: '', UnitDescription: '', Description: '', UOM: '', Quantity: '', UnitPrice: '', Total: '', LP: '' }],
        Eid: Eid,
        UpdatedEid: Eid,
        EnquiryNo: EnquiryNo,
        Paymentdue: '',
        validity: '',
        Warranty: '',
        Delivery: '',
        Discount: '',
        Gst: 0,
        Freight: '',
        PayableAmount: 0,
        financialYear: '',
        isRevision: false,
        referenceToRevise: '',
        discount:'',
        Status: 'quotsreq'
      });
      setCustomFields({
        Paymentdue: false,
        Discount: false,
        Warranty: false,
        Delivery: false,
        validity: false,
      });

    } catch (err) {
      setLoading(false);
      console.error('Error submitting the quotation:', err);
      setError(err.response?.data?.message || "Failed to submit quotation. Please try again.");
    }
  };

  const handlePDFGenerate = () => {
    router.push(`/SaleteamDasboard/PDF?EnquiryNo=${EnquiryNo}&Eid=${Eid}`);
  };

  const handleEdit = () => {
    router.push(`/SaleteamDasboard/Getquotation?EnquiryNo=${EnquiryNo}&mode=edit`);
  };

  // When a quotation already exists for this enquiry, show a dedicated card
  // instead of the creation form.
  const fieldInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const fieldLabelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  if (popup) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Sales"
          title="Create Quotation"
          subtitle="A quotation for this enquiry already exists."
          onBack={() => router.push('/SaleteamDasboard/Dasboard')}
        />
        <Card className="mx-auto max-w-xl text-center">
          <div className="flex justify-center pt-4">
            <Archive size={56} strokeWidth={1.75} className="text-amber-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Quotation Already Exists</h2>
          <p className="mt-2 text-sm text-slate-500">
            A quotation for this enquiry has already been created.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <PrimaryButton onClick={handlePDFGenerate} className="flex-1">
              <FileText size={16} />
              View PDF
            </PrimaryButton>
            <SecondaryButton onClick={handleEdit} className="flex-1">
              <Edit size={16} />
              Edit Quotation
            </SecondaryButton>
            <SecondaryButton onClick={() => router.push('/SaleteamDasboard/Dasboard')} className="flex-1">
              Back to Dashboard
            </SecondaryButton>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Create Quotation"
        subtitle="Add products, terms and charges to build a quotation."
        onBack={() => router.push('/SaleteamDasboard/Dasboard')}
      />

      {error && (
        <div className="rounded-md border-l-4 border-rose-500 bg-rose-50 p-4 text-rose-700">
          <div className="flex items-center">
            <X size={20} className="flex-shrink-0 text-rose-500" />
            <p className="ml-3 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {formData.isRevision && (
        <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-4 text-amber-800">
          <div className="flex">
            <Archive className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <p className="ml-3 text-sm font-medium">Revision Mode: Revising quotation <span className="rounded bg-amber-100 px-2 py-1 font-mono">{formData.referenceToRevise}</span></p>
          </div>
        </div>
      )}

      <form className="space-y-6">
        <Card>
          <label className={fieldLabelClass}>Financial Year <span className="text-rose-500">*</span></label>
          <input
            type="text"
            name="financialYear"
            value={formData.financialYear}
            onChange={(e) => setFormData((prev) => ({ ...prev, financialYear: e.target.value }))}
            placeholder="e.g. 25-26"
            className={`${fieldInputClass} md:w-1/3`}
            required
          />
        </Card>

        {/* Product Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Product Details</h2>
            <PrimaryButton onClick={addProduct}>
              <Plus size={16} />
              Add Product
            </PrimaryButton>
          </div>

          {formData.products.map((product, index) => (
            <Card key={index}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Product #{index + 1}</h3>
                {formData.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
                  >
                    <X size={16} />
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={fieldLabelClass}>HSN Code <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="HSNCode"
                    value={product.HSNCode}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="HSN Code"
                    className={fieldInputClass}
                    required
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>Unit Description <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="UnitDescription"
                    value={product.UnitDescription}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="Unit Description"
                    className={fieldInputClass}
                    required
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>Description <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="Description"
                    value={product.Description}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="Description"
                    className={fieldInputClass}
                    required
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>UOM <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    name="UOM"
                    value={product.UOM}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="UOM"
                    className={fieldInputClass}
                    required
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>Quantity</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={product.Quantity}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="Quantity"
                    className={fieldInputClass}
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>Unit Price <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500">₹</span>
                    </div>
                    <input
                      type="number"
                      name="UnitPrice"
                      value={product.UnitPrice}
                      onChange={(e) => handleProductChange(e, index)}
                      placeholder="0.00"
                      className={`${fieldInputClass} pl-8`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClass}>Total</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500">₹</span>
                    </div>
                    <input
                      type="text"
                      name="Total"
                      value={product.Total}
                      readOnly
                      className={`${fieldInputClass} bg-slate-100 pl-8 font-medium text-slate-700`}
                    />
                  </div>
                </div>

                <div>
                  <label className={fieldLabelClass}>LP</label>
                  <input
                    type="text"
                    name="LP"
                    value={product.LP || ''}
                    onChange={(e) => handleProductChange(e, index)}
                    placeholder="Enter LP value"
                    className={fieldInputClass}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Details */}
        <Card>
          <h2 className="mb-4 text-base font-semibold text-slate-900">Additional Details</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={fieldLabelClass}>Payment Due</label>
              <select
                name="Paymentdue"
                value={formData.Paymentdue}
                onChange={(e) => handleSelectChange(e, 'Paymentdue')}
                className={`${fieldInputClass} appearance-none bg-white`}
                style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"}}
              >
                <option value="">Select Payment Due</option>
                <option value="30">30 Days</option>
                <option value="60">60 Days</option>
                <option value="Others">Others</option>
              </select>
              {customFields.Paymentdue && (
                <input
                  type="text"
                  value={formData.Paymentdue}
                  onChange={(e) => handleCustomChange(e, 'Paymentdue')}
                  placeholder="Specify Custom Payment Due"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className={fieldLabelClass}>Validity</label>
              <select
                name="validity"
                value={formData.validity}
                onChange={(e) => handleSelectChange(e, 'validity')}
                className={`${fieldInputClass} appearance-none bg-white`}
                style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"}}
              >
                <option value="">Select Validity Period</option>
                <option value="1 week from the date of quotation.">1 Week from the Date of Quotation</option>
                <option value="Others">Others</option>
              </select>
              {customFields.validity && (
                <input
                  type="text"
                  name="validity"
                  value={formData.validity}
                  onChange={(e) => handleCustomChange(e, 'validity')}
                  placeholder="Specify validity period"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className={fieldLabelClass}>Warranty</label>
              <select
                name="Warranty"
                value={formData.Warranty}
                onChange={(e) => handleSelectChange(e, 'Warranty')}
                className={`${fieldInputClass} appearance-none bg-white`}
                style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"}}
              >
                <option value="">Select Warranty Period</option>
                <option value="1 Year from the date of supply">1 Year from the Date of Supply</option>
                <option value="6 months from the date of service">6 Months from the Date of Service</option>
                <option value="Others">Others</option>
              </select>
              {customFields.Warranty && (
                <input
                  type="text"
                  name="Warranty"
                  value={formData.Warranty}
                  onChange={(e) => handleCustomChange(e, 'Warranty')}
                  placeholder="Specify warranty terms"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className={fieldLabelClass}>Delivery</label>
              <select
                name="Delivery"
                value={formData.Delivery}
                onChange={(e) => handleSelectChange(e, 'Delivery')}
                className={`${fieldInputClass} appearance-none bg-white`}
                style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"}}
              >
                <option value="">Select Delivery Timeline</option>
                <option value="1 week from date of PO">1 Week from Date of PO</option>
                <option value="Week">Week</option>
                <option value="Day">Day</option>
                <option value="Others">Others</option>
              </select>
              {customFields.Delivery && (
                <input
                  type="text"
                  name="Delivery"
                  value={formData.Delivery}
                  onChange={(e) => handleCustomChange(e, 'Delivery')}
                  placeholder="Specify delivery timeline"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className={fieldLabelClass}>Discount</label>
              <select
                name="Discount"
                value={formData.Discount}
                onChange={(e) => handleSelectChange(e, 'Discount')}
                className={`${fieldInputClass} appearance-none bg-white`}
                style={{backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"gray\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"}}
              >
                <option value="">Select Discount Type</option>
                <option value="Discounted Price">Discounted Price</option>
                <option value="Mentioned above">Mentioned Above</option>
                <option value="Others">Others</option>
              </select>
              {customFields.Discount && (
                <input
                  type="text"
                  name="Discount"
                  value={formData.Discount}
                  onChange={(e) => handleCustomChange(e, 'Discount')}
                  placeholder="Specify discount details"
                  className={`${fieldInputClass} mt-2`}
                />
              )}
            </div>

            <div>
              <label className={fieldLabelClass}>GST (%)</label>
              <div className="relative">
                <input
                  type="number"
                  name="Gst"
                  value={formData.Gst}
                  onChange={handleGstChange}
                  placeholder="Enter GST percentage"
                  className={fieldInputClass}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-slate-500">%</span>
                </div>
              </div>
            </div>

            <div>
              <label className={fieldLabelClass}>Freight Charges</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-slate-500">₹</span>
                </div>
                <input
                  type="number"
                  name="Freight"
                  value={formData.Freight}
                  onChange={handleFreightChange}
                  placeholder="0.00"
                  className={`${fieldInputClass} pl-8`}
                />
              </div>
            </div>
          </div>

          {/* Payable Amount */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col items-end gap-4 sm:flex-row sm:justify-end">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2">
                <Calculator size={20} className="text-blue-600" />
                <span className="font-medium text-slate-700">GST Amount:</span>
                <span className="font-semibold text-blue-700">
                  ₹{(Number(formData.PayableAmount) - (Number(formData.PayableAmount) / (1 + Number(formData.Gst) / 100))).toFixed(2)}
                </span>
              </div>
              <div>
                <label className={fieldLabelClass}>Discount</label>
                <input
                  type="text"
                  name="discount"
                  value={formData.discount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discount: e.target.value }))}
                  placeholder="Enter discount"
                  className={fieldInputClass}
                />
              </div>

              <div className="flex flex-col items-end">
                <span className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Payable Amount</span>
                <div className="rounded-lg bg-blue-600 px-6 py-3 text-white shadow-sm">
                  <span className="text-xl font-bold">₹{Number(formData.PayableAmount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <PrimaryButton onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Quotation'}
          </PrimaryButton>
        </div>

        {/* Reference Number */}
        {referenceNumber && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 flex-shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Success! Your quotation has been submitted.</h3>
                <p className="mt-1 text-lg font-semibold">Reference Number: <span className="rounded bg-emerald-100 px-2 py-1 font-mono">{referenceNumber}</span></p>
              </div>
            </div>
          </div>
        )}

      </form>
    </PageShell>
  );
};

export default Home;
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Save } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  LoadingBlock,
  EmptyState,
} from "../../_components/ui";

export default function EnquiryPage() {
  const searchParams = useSearchParams();
  const EnquiryNo = searchParams.get("EnquiryNo");
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!EnquiryNo) return;

    const token = localStorage.getItem("admintokens");
    axios
      .get(`http://localhost:5005/api/cc/Enquiryget/${EnquiryNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setFormData(res.data.customerData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching:", err);
        setLoading(false);
      });
  }, [EnquiryNo]);

  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerConvertChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customerconvert: [
        {
          ...prev.customerconvert[0],
          [name]: value,
        },
      ],
    }));
  };

  const handleCustomerDetailsChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customerconvert: [
        {
          ...prev.customerconvert[0],
          CustomerDetails: {
            ...prev.customerconvert[0]?.CustomerDetails,
            [name]: value,
          },
        },
      ],
    }));
  };

  const handleBillingAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customerconvert: [
        {
          ...prev.customerconvert[0],
          BillingAddressDetails: {
            ...prev.customerconvert[0]?.BillingAddressDetails,
            [name]: value,
          },
        },
      ],
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      AddressDetails: {
        ...prev.AddressDetails,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = formData.customerconvert[0];
    const Eid = data.Eid;
    const CustomerId = formData.CustomerId;

    try {
      const token = localStorage.getItem("admintokens");
      await axios.put(
        `http://localhost:5005/api/cc/getcustomerconverstion/${Eid}/${data.EnquiryNo}/${CustomerId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Successfully updated!");
    } catch (err) {
      console.error("Update error:", err);
      alert("Error updating");
    }
  };

  if (loading) return <PageShell><LoadingBlock label="Loading..." /></PageShell>;
  if (!formData) return <PageShell><EmptyState title="No data found" /></PageShell>;

  const customer = formData.customerconvert?.[0] || {};
  const customerDetails = customer.CustomerDetails || {};
  const billing = customer.BillingAddressDetails || {};
  const address = formData.AddressDetails || {};

  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title={`Edit Enquiry: ${customer.EnquiryNo || ""}`}
        subtitle="Update converted customer enquiry details."
        onBack={() => router.push('/SaleteamDasboard/CustomerConverted')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top-level fields */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Enquiry</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Customer ID</label>
              <input type="text" value={formData.CustomerId} disabled className={`${inputClass} bg-slate-100`} />
            </div>
            <div>
              <label className={labelClass}>PAN Number</label>
              <input type="text" name="PANnumber" value={formData.PANnumber || ""} onChange={handleTopLevelChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>GSTN Number</label>
              <input type="text" name="GSTNnumber" value={formData.GSTNnumber || ""} onChange={handleTopLevelChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Company Name</label>
              <input type="text" name="companyName" value={formData.companyName || ""} onChange={handleTopLevelChange} className={inputClass} />
            </div>
          </div>
        </Card>

        {/* AddressDetails */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Address Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" name="Address" placeholder="Address" value={address.Address || ""} onChange={handleAddressChange} className={`${inputClass} md:col-span-2`} />
            <input type="text" name="City" placeholder="City" value={address.City || ""} onChange={handleAddressChange} className={inputClass} />
            <input type="text" name="Country" placeholder="Country" value={address.Country || ""} onChange={handleAddressChange} className={inputClass} />
            <input type="text" name="PostalCode" placeholder="Postal Code" value={address.PostalCode || ""} onChange={handleAddressChange} className={inputClass} />
            <input type="text" name="State" placeholder="State" value={address.State || ""} onChange={handleAddressChange} className={inputClass} />
          </div>
        </Card>

        {/* Customer Convert */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Customer Convert Info</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" name="clientName" placeholder="Client Name" value={customer.clientName || ""} onChange={handleCustomerConvertChange} className={inputClass} />
            <input type="text" name="DescriptionDetails" placeholder="Description" value={customer.DescriptionDetails || ""} onChange={handleCustomerConvertChange} className={inputClass} />
            <input type="text" name="Convertedstatus" placeholder="Converted Status" value={customer.Convertedstatus || ""} onChange={handleCustomerConvertChange} className={inputClass} />
            <input type="text" name="Status" placeholder="Status" value={customer.Status || ""} onChange={handleCustomerConvertChange} className={inputClass} />
          </div>
        </Card>

        {/* Customer Details */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Customer Contact Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" name="MobileNumber" placeholder="Mobile Number" value={customerDetails.MobileNumber || ""} onChange={handleCustomerDetailsChange} className={inputClass} />
            <input type="text" name="PrimaryMail" placeholder="Email" value={customerDetails.PrimaryMail || ""} onChange={handleCustomerDetailsChange} className={inputClass} />
            <input type="text" name="opportunitynumber" placeholder="Opportunity No" value={customerDetails.opportunitynumber || ""} onChange={handleCustomerDetailsChange} className={inputClass} />
          </div>
        </Card>

        {/* Billing Details */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Billing Address Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" name="BillingAddress" placeholder="Billing Address" value={billing.BillingAddress || ""} onChange={handleBillingAddressChange} className={`${inputClass} md:col-span-2`} />
            <input type="text" name="BillingCity" placeholder="Billing City" value={billing.BillingCity || ""} onChange={handleBillingAddressChange} className={inputClass} />
            <input type="text" name="BillingCountry" placeholder="Billing Country" value={billing.BillingCountry || ""} onChange={handleBillingAddressChange} className={inputClass} />
            <input type="text" name="BillingPostalCode" placeholder="Billing Postal Code" value={billing.BillingPostalCode || ""} onChange={handleBillingAddressChange} className={inputClass} />
            <input type="text" name="BillingState" placeholder="Billing State" value={billing.BillingState || ""} onChange={handleBillingAddressChange} className={inputClass} />
          </div>
        </Card>

        <div className="flex justify-end">
          <PrimaryButton type="submit">
            <Save size={16} />
            Update
          </PrimaryButton>
        </div>
      </form>
    </PageShell>
  );
}

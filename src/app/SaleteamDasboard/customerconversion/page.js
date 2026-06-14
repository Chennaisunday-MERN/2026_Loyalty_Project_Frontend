"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Save, Pencil, X } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  ErrorBanner,
} from "../../_components/ui";

const CustomerConversion = () => {
  const token = localStorage.getItem('admintokens');
  const Eid = localStorage.getItem('idstore');
  const searchParams = useSearchParams();

const EnquiryNo = searchParams.get('EnquiryNo')
console.log('Fetching EnquiryNo:', EnquiryNo);


  const [customer, setCustomer] = useState({
    EnquiryNo: EnquiryNo || '',
    PANnumber: '',
    GSTNnumber: '',
    CustomerDetails: {
      opportunitynumber: '',
    },
    BillingAddressDetails: {
      BillingAddress: 'No.27/1 VAIGAI COLONY 2ND IST, 12TH AVENUE,ASHOK NAGAR',
      BillingCountry: 'INDIA',
      BillingCity: 'CHENNAI',
      BillingPostalCode: '600083',
      BillingState: 'TAMILNADU'
    },
    DescriptionDetails: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fetchData, setFetchData] = useState(null);
  const [arrayData,setArrayData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [update,setUpdate] = useState(null);
  const [ updateId,setUpdateId] =useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setCustomer(prevState => ({
        ...prevState,
        [section]: {
          ...prevState[section],
          [field]: value,
        }
      }));
    } else {
      setCustomer(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  };
  const handleFilechange = (e) => {
    const { name, value } = e.target;
    console.log("Handling change for:", name, "with value:", value);
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFetchData(prevState => ({
        ...prevState,
        [section]: {
          ...prevState[section],
          [field]: value,
        }
      }));
    } else {
        setFetchData(prevState => {
            const updatedState = {
                ...prevState,
                [name]: value
            };
            console.log("Updated fetchData e:", updatedState);
            return updatedState;
        });
    }
};

const handlecustomerchange = (e)=>{
    const { name, value } = e.target;
    console.log("Handling change for:", name, "with value:", value);
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setArrayData(prevState => ({
        ...prevState,
        [section]: {
          ...prevState[section],
          [field]: value,
        }
      }));
    }else{
        setArrayData(prevState => {
        const updatedcState = {
            ...prevState,
            [name]: value
        }
    console.log("Updated cstate e:", updatedcState);
    return updatedcState;
})
}
}


  const fetchDataFromAPI = async (EnquiryNo) => {
    try {
      const response = await axios.get(`http://localhost:5005/api/cc/Enquiryget/${EnquiryNo}`, {
        headers: { 'Authorization': `Bearer ${token}`}
      });
      console.log("Fetched data:", response.data);
      setFetchData(response.data.customerData);
      setArrayData(response.data.customerData.customerconvert[0]);
      console.log('i get the customerconvert data',response.data.customerData.customerconvert[0]);
    } catch (err) {
      console.error("Error details: ", err.response || err.message);
      setError(`Error fetching data: ${err.response ? err.response.data : err.message}`);
    }
  };

  const updatedata = async (e) => {
    e.preventDefault();

    const updatedCustomer = {
      DescriptionDetails: arrayData.DescriptionDetails,
      clientName: arrayData.clientName,
      companyName: fetchData.companyName,
      Address: fetchData.Address,
      Country: fetchData.Country,
      MobileNumber:arrayData.CustomerDetails.MobileNumber,
      opportunitynumber:arrayData.CustomerDetails.opportunitynumber,
      PrimaryMail:arrayData.CustomerDetails.PrimaryMail,
      BillingAddress:arrayData.BillingAddressDetails.BillingAddress,
      BillingCountry:arrayData.BillingAddressDetails.BillingCountry,
      BillingCity:arrayData.BillingAddressDetails.BillingCity,
      BillingPostalCode:arrayData.BillingAddressDetails.BillingPostalCode,
      BillingState:arrayData.BillingAddressDetails.BillingState
    };

    try {
      const response = await axios.put(
        `http://localhost:5005/api/cc/getcustomerconverstion/${Eid}/${update}/${updateId}`,
        updatedCustomer,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log(response.data);
      alert("Customer data updated successfully!");
      router.push('/SaleteamDasboard/Dasboard');
    } catch (err) {
      console.error("Error updating data:", err);
      alert("Failed to update customer data. Please try again.");
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer.EnquiryNo || !customer.PANnumber || !customer.GSTNnumber ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!customer.CustomerDetails.opportunitynumber) {
      setError("Please provide all customer contact details.");
      return;
    }

    if (!customer.BillingAddressDetails.BillingAddress || !customer.BillingAddressDetails.BillingCountry || !customer.BillingAddressDetails.BillingCity || !customer.BillingAddressDetails.BillingPostalCode || !customer.BillingAddressDetails.BillingState) {
      setError("Please fill in the full billing address.");
      return;
    }

    setLoading(true);
    setSuccess(null);

    try {
      const response = await axios.post('http://localhost:5005/api/customerconversion', { Eid, ...customer }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      setSuccess("Customer conversion successful!");
      console.log('Data after submission:', response.data);
      alert("Successfully updated");

      const EnquiryNo = customer.EnquiryNo;
      if(EnquiryNo){
        fetchDataFromAPI(EnquiryNo);
      } else {
        setError("No enquiry data found.");
      }
    } catch (err) {
      setError("Failed to convert customer. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleclick = (EnquiryNo,CustomerId) =>{
    try{
      const enquiryno=EnquiryNo

      console.log("i get the table enquiryno",enquiryno);
      const customerid=CustomerId
      console.log("i get the customerid from the table",customerid);
      setUpdate(enquiryno);
      setUpdateId(customerid);
    }catch(err){
        console.log("i cannot get the enquiryno and customerid",err.message);
    }
  }

const handleBackClick = () => {
  router.push('/SaleteamDasboard/Dasboard')
}

  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Customer Conversion"
        subtitle="Convert a qualified lead into a customer record."
        onBack={handleBackClick}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      {!fetchData ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Lead Number</label>
                <input
                  type="text"
                  name="EnquiryNo"
                  value={customer.EnquiryNo}
                  onChange={handleChange}
                  required
                  className={`${inputClass} bg-slate-100`}
                  readOnly
                />
              </div>
              <div>
                <label className={labelClass}>PAN Number</label>
                <input
                  type="text"
                  name="PANnumber"
                  value={customer.PANnumber}
                  onChange={handleChange}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Opportunity Number</label>
                <input
                  type="text"
                  name="CustomerDetails.opportunitynumber"
                  value={customer.CustomerDetails.opportunitynumber}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>GSTN Number</label>
                <input
                  type="text"
                  name="GSTNnumber"
                  value={customer.GSTNnumber}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Billing Address</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Billing Address</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingAddress"
                  value={customer.BillingAddressDetails.BillingAddress}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing Country</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingCountry"
                  value={customer.BillingAddressDetails.BillingCountry}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing City</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingCity"
                  value={customer.BillingAddressDetails.BillingCity}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing Postal Code</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingPostalCode"
                  value={customer.BillingAddressDetails.BillingPostalCode}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing State</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingState"
                  value={customer.BillingAddressDetails.BillingState}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          <Card>
            <label className={labelClass}>Description</label>
            <input
              type="text"
              name="DescriptionDetails"
              value={customer.DescriptionDetails}
              onChange={handleChange}
              className={inputClass}
            />
          </Card>

          <div className="flex justify-end">
            <PrimaryButton type="submit" disabled={loading}>
              <Save size={16} />
              {loading ? 'Submitting...' : 'Submit'}
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <form onSubmit={updatedata} className="space-y-6">
          <Card>
            <h2 className="text-base font-semibold text-slate-900">Customer Details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>EnquiryNo</label>
                <input
                  type="text"
                  name="EnquiryNo"
                  value={arrayData.EnquiryNo}
                  onChange={handleFilechange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>CustomerId</label>
                <input
                  type="text"
                  name="CustomerId"
                  value={fetchData.CustomerId}
                  onChange={handleFilechange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={fetchData.companyName}
                  onChange={handleFilechange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Customer Address</label>
                <input
                  type="text"
                  name="AddressDetails.Address"
                  value={fetchData.AddressDetails.Address}
                  onChange={handleFilechange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Customer Country</label>
                <input
                  type="text"
                  name="AddressDetails.Country"
                  value={fetchData.AddressDetails.Country}
                  onChange={handleFilechange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={arrayData.clientName}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description Details</label>
                <input
                  type="text"
                  name="DescriptionDetails"
                  value={arrayData.DescriptionDetails}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="text"
                  name="CustomerDetails.MobileNumber"
                  value={arrayData.CustomerDetails.MobileNumber}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Opportunity Number</label>
                <input
                  type="text"
                  name="CustomerDetails.opportunitynumber"
                  value={arrayData.CustomerDetails.opportunitynumber}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Primary Mail</label>
                <input
                  type="text"
                  name="CustomerDetails.PrimaryMail"
                  value={arrayData.CustomerDetails.PrimaryMail}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Billing Address</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className={labelClass}>Billing Address</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingAddress"
                  value={arrayData.BillingAddressDetails.BillingAddress}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing Country</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingCountry"
                  value={arrayData.BillingAddressDetails.BillingCountry}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing City</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingCity"
                  value={arrayData.BillingAddressDetails.BillingCity}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing State</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingState"
                  value={arrayData.BillingAddressDetails.BillingState}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Billing Postal Code</label>
                <input
                  type="text"
                  name="BillingAddressDetails.BillingPostalCode"
                  value={arrayData.BillingAddressDetails.BillingPostalCode}
                  onChange={handlecustomerchange}
                  disabled={!isEditing}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <PrimaryButton
              type="submit"
              onClick={() => handleclick(arrayData.EnquiryNo, fetchData.CustomerId)}
              disabled={!isEditing}
            >
              <Save size={16} />
              Update
            </PrimaryButton>
            <SecondaryButton
              type="button"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X size={16} /> : <Pencil size={16} />}
              {isEditing ? 'Cancel Edit' : 'Edit'}
            </SecondaryButton>
          </div>
        </form>
      )}
    </PageShell>
  );
};

export default CustomerConversion;

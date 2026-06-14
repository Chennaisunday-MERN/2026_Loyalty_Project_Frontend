"use client";

import { useState, useEffect } from "react";
import axios from 'axios';
import { Send } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  ErrorBanner,
} from "../../_components/ui";

const SaleheadEnquiry = () => {
  const [enquiry, setEnquiry] = useState({
    LeadDetails: {
      clientName: '',
      Leadcondition: '',
      companyName: '',
      Department: '',
      LeadMedium: '',
      LeadPriority: '',
      EnquiryType: '',
    },
    ContactDetails: {
      MobileNumber: '',
      AlternateMobileNumber: '',
      PrimaryMail: '',
      SecondaryMail: '',
    },
    AddressDetails: {
      Address: '',
      Country: '',
      City: '',
      PostalCode: '',
      State: '',
    },
    DescriptionDetails: '',
    Eid: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [Eids, setEids] = useState([]);

  useEffect(() => {
    const fetchEids = async () => {
      try {
        const token = localStorage.getItem("admintokens");
        if (!token) {
          alert("No token found. Please login as an admin.");
          return;
        }
        const response = await axios.get('http://localhost:5005/api/getsalesheadEid', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        console.log('i got response', response.data.getallprofile);
        if (Array.isArray(response.data.getallprofile)) {
          setEids(response.data.getallprofile);
        } else {
          setEids([]);
        }

        console.log('i got the eids', response.data);
      } catch (err) {
        console.error('Error fetching EIDs:', err);
        setEids([]);
      }
    };
    fetchEids();
  }, []);

  const handlesubmit = async (e) => {
    e.preventDefault();

    if (!enquiry.LeadDetails.companyName || !enquiry.LeadDetails.clientName || !enquiry.LeadDetails.EnquiryType || !enquiry.LeadDetails.Leadcondition || !enquiry.ContactDetails.MobileNumber || !enquiry.ContactDetails.PrimaryMail) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const token = localStorage.getItem('admintokens');
    if (!token) {
      alert("No token found. Please login as an admin.");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5005/api/leadentry', enquiry, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      console.log(response.data);
      alert('Lead entry successfully submitted');

      setEnquiry({
        LeadDetails: {
          clientName: '',
          Leadcondition: '',
          companyName: '',
          Department: '',
          LeadMedium: '',
          LeadPriority: '',
          EnquiryType: '',
        },
        ContactDetails: {
          MobileNumber: '',
          AlternateMobileNumber: '',
          PrimaryMail: '',
          SecondaryMail: '',
        },
        AddressDetails: {
          Address: '',
          Country: '',
          City: '',
          PostalCode: '',
          State: '',
        },
        DescriptionDetails: '',
        Eid: '',
      });
    } catch (err) {
      console.log('Error submitting lead entry:', err);
      if (err.response) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('Something went wrong, please try again later.');
      }
    }
  };

  const handlechange = (e) => {
    const { name, value } = e.target;

    if (name === 'Eid' || name === 'DescriptionDetails') {
      setEnquiry((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      const [section, field] = name.split('.');

      setEnquiry((prevState) => ({
        ...prevState,
        [section]: {
          ...prevState[section],
          [field]: value,
        },
      }));
    }
  };

  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Sale Head Enquiry"
        subtitle="Capture a new lead and assign it to a sales head."
      />

      <form onSubmit={handlesubmit} className="space-y-6">
        {errorMessage && <ErrorBanner>{errorMessage}</ErrorBanner>}

        {/* Lead Details */}
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Lead Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                name="LeadDetails.companyName"
                placeholder="Type company name"
                onChange={handlechange}
                value={enquiry.LeadDetails.companyName}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contact Person</label>
              <input
                name="LeadDetails.clientName"
                placeholder="Type contact person"
                onChange={handlechange}
                value={enquiry.LeadDetails.clientName}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input
                name="LeadDetails.Department"
                placeholder="Type department"
                onChange={handlechange}
                value={enquiry.LeadDetails.Department}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lead Medium</label>
              <input
                name="LeadDetails.LeadMedium"
                placeholder="Type lead medium"
                onChange={handlechange}
                value={enquiry.LeadDetails.LeadMedium}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Lead Priority</label>
              <input
                name="LeadDetails.LeadPriority"
                placeholder="Type lead priority"
                onChange={handlechange}
                value={enquiry.LeadDetails.LeadPriority}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Enquiry Type</label>
              <select
                name="LeadDetails.EnquiryType"
                onChange={handlechange}
                value={enquiry.LeadDetails.EnquiryType}
                className={inputClass}
                required
              >
                <option value="">--Choose a type of enquiry--</option>
                <option value="Product">Product</option>
                <option value="Project">Project</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Lead Condition</label>
              <select
                name="LeadDetails.Leadcondition"
                onChange={handlechange}
                value={enquiry.LeadDetails.Leadcondition}
                className={inputClass}
                required
              >
                <option value="">--Choose a lead condition--</option>
                <option value="new">New</option>
                <option value="existing">Existing</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Contact Details */}
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Contact Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Mobile Number</label>
              <input
                name="ContactDetails.MobileNumber"
                placeholder="Enter mobile number"
                onChange={handlechange}
                value={enquiry.ContactDetails.MobileNumber}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Alternate Mobile Number</label>
              <input
                name="ContactDetails.AlternateMobileNumber"
                placeholder="Enter alternate mobile number"
                onChange={handlechange}
                value={enquiry.ContactDetails.AlternateMobileNumber}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Primary Mail</label>
              <input
                name="ContactDetails.PrimaryMail"
                placeholder="Enter primary email"
                onChange={handlechange}
                value={enquiry.ContactDetails.PrimaryMail}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Secondary Mail</label>
              <input
                name="ContactDetails.SecondaryMail"
                placeholder="Enter secondary email"
                onChange={handlechange}
                value={enquiry.ContactDetails.SecondaryMail}
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Address Details */}
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Address Details</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Address</label>
              <input
                name="AddressDetails.Address"
                placeholder="Enter address"
                onChange={handlechange}
                value={enquiry.AddressDetails.Address}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input
                name="AddressDetails.Country"
                placeholder="Enter country"
                onChange={handlechange}
                value={enquiry.AddressDetails.Country}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                name="AddressDetails.City"
                placeholder="Enter city"
                onChange={handlechange}
                value={enquiry.AddressDetails.City}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Postal Code</label>
              <input
                name="AddressDetails.PostalCode"
                placeholder="Enter postal code"
                onChange={handlechange}
                value={enquiry.AddressDetails.PostalCode}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                name="AddressDetails.State"
                placeholder="Enter state"
                onChange={handlechange}
                value={enquiry.AddressDetails.State}
                className={inputClass}
              />
            </div>
          </div>
        </Card>

        {/* Description and Sales Head ID */}
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Additional Information</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>Description</label>
              <textarea
                name="DescriptionDetails"
                placeholder="Enter any additional description"
                onChange={handlechange}
                value={enquiry.DescriptionDetails}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sales Head ID</label>
              <select
                name="Eid"
                value={enquiry.Eid}
                onChange={handlechange}
                className={inputClass}
                required
              >
                <option value="">Select Sales Head</option>
                {Eids.map((eid, index) => (
                  <option key={index} value={eid.Eid}>
                    {eid.Eid}-{eid.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <PrimaryButton type="submit">
            <Send size={16} />
            Submit Enquiry
          </PrimaryButton>
        </div>
      </form>
    </PageShell>
  );
};

export default SaleheadEnquiry;

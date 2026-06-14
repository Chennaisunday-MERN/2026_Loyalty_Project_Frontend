"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  ErrorBanner,
} from "../../_components/ui";

const CustomerNotConverted = () => {
  const [leadNumber, setLeadNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");
  const [Eid, setEid] = useState(""); // Added state for Eid

  const searchParams = useSearchParams();
  const EnquiryNo = searchParams.get('EnquiryNo');
  const router = useRouter();

  console.log("EnquiryNo:", EnquiryNo); // Debugging to ensure EnquiryNo is retrieved

  useEffect(() => {
    const savedToken = localStorage.getItem("admintokens");
    if (savedToken) {
      setToken(savedToken);
    } else {
      console.error("Token not found in localStorage.");
    }

    if (EnquiryNo) {
      setLeadNumber(EnquiryNo);
    }

    // Assuming you need to fetch the 'Eid' from somewhere (for example, the user is logged in):
    const savedEid = localStorage.getItem("idstore");
    if (savedEid) {
      setEid(savedEid);
    } else {
      console.error("Eid not found in localStorage.");
    }
  }, [EnquiryNo]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    if (!leadNumber || !remarks || !Eid) {
      setError("Lead number, remarks, and Eid are required.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5005/api/customernotconverted`,
        { EnquiryNo: leadNumber, remarks, Eid }, // Sending Eid as part of the request body
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      console.log("API Response:", response.data);
      setSubmitted(true);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error submitting lead:', err);
      console.error("Error details:", err.response); // Log full error response

      if (err.response && err.response.status === 403) {
        setError("Access denied. Invalid or expired token.");
      } else {
        setError("Failed to submit lead. Please try again.");
      }
    }
  };

  const handleBackClick = () => {
    router.push('/SaleteamDasboard/Dasboard');
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Lead Form"
        subtitle="Mark a lead as not converted and record the reason."
        onBack={handleBackClick}
      />

      <Card className="mx-auto max-w-lg">
        {error && <ErrorBanner>{error}</ErrorBanner>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitted && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Lead submitted successfully!
            </div>
          )}

          <div>
            <label htmlFor="leadNumber" className={labelClass}>Lead Number</label>
            <input
              type="text"
              id="leadNumber"
              value={leadNumber}
              className={`${inputClass} bg-slate-100`}
              readOnly
              required
            />
          </div>

          <div>
            <label htmlFor="remarks" className={labelClass}>Remarks</label>
            <textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <PrimaryButton type="submit" className="w-full">
            Submit
          </PrimaryButton>
        </form>
      </Card>
    </PageShell>
  );
};

export default CustomerNotConverted;

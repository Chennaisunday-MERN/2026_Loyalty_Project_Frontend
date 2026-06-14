"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import {
  PageShell,
  PageHeader,
  TableWrap,
  Th,
  Td,
  ErrorBanner,
} from "../../_components/ui";

const ViewleadEnquiryPage = () => {
  const [enquiryData, setEnquiryData] = useState([]);
  const [error, setError] = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const router = useRouter();

  useEffect(() => {
    if (!token || !role) {
      router.push("/login");
    }
  }, [token, role, router]);

  const fetchLeadEnquiryList = async () => {
    try {
      const response = await axios.get('http://localhost:5005/api/todayviewleadenquiry', {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      });
      console.log(response.data);
      if (response.data && response.data.length > 0) {
        setEnquiryData(response.data);
      }

    } catch (err) {
      console.error('Error fetching lead enquiry data:', err);
      setError("Failed to fetch lead enquiries data.");
    }
  };

  useEffect(() => {
    if (role === "Lead filler" || "md") {
      fetchLeadEnquiryList();
    } else {
      setError("You do not have permission to view the data.");
    }
  }, [role, token]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Lead Enquiry"
        subtitle="Lead enquiries received today."
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <TableWrap>
        <thead>
          <tr>
            <Th>Company Name</Th>
            <Th>Contact Person</Th>
            <Th>Department</Th>
            <Th>Lead Medium</Th>
            <Th>Lead Priority</Th>
            <Th>Enquiry Type</Th>
            <Th>Lead Condition</Th>
            <Th>Contact Number</Th>
            <Th>Alternate Phone</Th>
            <Th>Primary Mail</Th>
            <Th>Secondary Mail</Th>
            <Th>Address</Th>
            <Th>Country</Th>
            <Th>City</Th>
            <Th>Postal Code</Th>
            <Th>State</Th>
            <Th>Remarks</Th>
          </tr>
        </thead>
        <tbody>
          {enquiryData.length > 0 ? (
            enquiryData.map((data) => (
              <tr key={data._id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{data?.LeadDetails?.companyName || "N/A"}</Td>
                <Td>{data?.LeadDetails?.clientName || "N/A"}</Td>
                <Td>{data?.LeadDetails?.Department || "N/A"}</Td>
                <Td>{data?.LeadDetails?.LeadMedium || "N/A"}</Td>
                <Td>{data?.LeadDetails?.LeadPriority || "N/A"}</Td>
                <Td>{data?.LeadDetails?.EnquiryType || "N/A"}</Td>
                <Td>{data?.LeadDetails?.Leadcondition || "N/A"}</Td>
                <Td>{data?.ContactDetails?.MobileNumber || "N/A"}</Td>
                <Td>{data?.ContactDetails?.AlternateMobileNumber || "N/A"}</Td>
                <Td>{data?.ContactDetails?.PrimaryMail || "N/A"}</Td>
                <Td>{data?.ContactDetails?.SecondaryMail || "N/A"}</Td>
                <Td>{data?.AddressDetails?.Address || "N/A"}</Td>
                <Td>{data?.AddressDetails?.Country || "N/A"}</Td>
                <Td>{data?.AddressDetails?.City || "N/A"}</Td>
                <Td>{data?.AddressDetails?.PostalCode || "N/A"}</Td>
                <Td>{data?.AddressDetails?.State || "N/A"}</Td>
                <Td>{data?.DescriptionDetails || "N/A"}</Td>
              </tr>
            ))
          ) : (
            <tr>
              <Td colSpan="17" className="text-center text-slate-500">No enquiries available for today.</Td>
            </tr>
          )}
        </tbody>
      </TableWrap>
    </PageShell>
  );
};

export default ViewleadEnquiryPage;

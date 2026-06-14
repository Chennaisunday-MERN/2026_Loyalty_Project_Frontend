"use client"
import { useState , useEffect } from "react";
import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
} from "../../_components/ui";

const ViewEnquiryPage = () => {
  const [enquiryData, setEnquiryData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [EidToAssign, setEidToAssign] = useState("");
  const [saleEnquiryData, setSaleEnquiryData] = useState([]);
  const [selectedEnquiries, setSelectedEnquiries] = useState([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;
  const Eid = typeof window !== "undefined" ? localStorage.getItem("idstore") : null;
  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const router = useRouter();

  

  const handleSelectEnquiry = (EnquiryNo) => {
    setSelectedEnquiries((prevSelectedEnquiries) => {
      if (prevSelectedEnquiries.includes(EnquiryNo)) {
        return prevSelectedEnquiries.filter((id) => id !== EnquiryNo);
      } else {
        return [...prevSelectedEnquiries, EnquiryNo];
      }
    });
  };

  const handlesubmit = async (e) => {
    e.preventDefault();
    try {
      if (!EidToAssign) return alert("Please enter an Eid to assign.");
      if (selectedEnquiries.length === 0) return alert("Please select at least one enquiry.");

      const response = await axios.put(
        `http://localhost:5005/api/assignedto`,
        {
          Eid: EidToAssign,
          EnquiryNo: selectedEnquiries,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert(response.data.message || "Successfully updated");

      setEidToAssign("");
      setSelectedEnquiries([]);
      setEnquiryData([]);
    } catch (err) {
      console.error("Error in updating:", err);
      alert("Failed to update assignments");
    }
  };

  const handleComplete = (enquiryId) => {
    // Handle completion logic here
    alert(`Enquiry ${enquiryId} marked as complete.`);
  };

  const Quotation = () => {
    router.push('/SaleteamDasboard/Quotation');
  };

  const Salesorder = () => {
    router.push('/SaleteamDasboard/SalesOrder');
  };

  const perfoma = () => {
    router.push('/SaleteamDasboard/perfoma');
  };

  const actionButtons = (data) => (
    <div className="flex flex-col gap-2">
      <SecondaryButton onClick={() => handleComplete(data._id)}>Complete</SecondaryButton>
      <div className="flex gap-2">
        <SecondaryButton onClick={Quotation}>Quotation</SecondaryButton>
        <SecondaryButton onClick={Salesorder}>Sales Order</SecondaryButton>
        <SecondaryButton onClick={perfoma}>Perfoma</SecondaryButton>
      </div>
    </div>
  );

  return (
    (role === "sales head" || role === "Sales Employee") && (
      <PageShell>
        <PageHeader
          eyebrow="Leads"
          title="Enquiry Data"
          subtitle="Review enquiries and assign them to a sales engineer."
          onBack={() => router.push("/SaleteamDasboard/Dasboard")}
        />

        <form onSubmit={handlesubmit} className="space-y-6">
          {/* Table with header */}
          <TableWrap>
            <thead>
              <tr>
                {role === "sales head" && <Th>Select</Th>}
                <Th>Company Name</Th>
                <Th>Contact Person</Th>
                <Th>Department</Th>
                <Th>Lead Medium</Th>
                <Th>Lead Priority</Th>
                <Th>Enquiry Type</Th>
                <Th>Lead Condition</Th>
                <Th>Contact Number</Th>
                <Th>Alternate Phone Number</Th>
                <Th>Primary Mail</Th>
                <Th>Secondary Mail</Th>
                <Th>Address</Th>
                <Th>Country</Th>
                <Th>City</Th>
                <Th>Postal Code</Th>
                <Th>State</Th>
                <Th>Remarks</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {role === "sales head"
                ? enquiryData.length > 0
                  ? enquiryData.map((data) => (
                      <tr key={data._id} className="hover:bg-slate-50">
                        <Td>
                          <input
                            type="checkbox"
                            checked={selectedEnquiries.includes(data.EnquiryNo)}
                            onChange={() => handleSelectEnquiry(data.EnquiryNo)}
                            className="mx-auto"
                          />
                        </Td>
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
                        <Td>{actionButtons(data)}</Td>
                      </tr>
                    ))
                  : (
                    <tr>
                      <Td colSpan="19" className="text-center text-slate-500">No Enquiries Available</Td>
                    </tr>
                  )
                : saleEnquiryData.length > 0
                ? saleEnquiryData.map((data) => (
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
                      <Td>{actionButtons(data)}</Td>
                    </tr>
                  ))
                : (
                  <tr>
                    <Td colSpan="18" className="text-center text-slate-500">No Enquiries Available</Td>
                  </tr>
                )}
            </tbody>
          </TableWrap>

          {role === "sales head" && (
            <Card className="max-w-md">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Assigning Eid</label>
              <input
                type="text"
                name="Eid"
                value={EidToAssign}
                onChange={(e) => setEidToAssign(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <PrimaryButton type="submit" className="mt-4 w-full">
                Assign
              </PrimaryButton>
            </Card>
          )}
        </form>
      </PageShell>
    )
  );
};
 export default ViewEnquiryPage
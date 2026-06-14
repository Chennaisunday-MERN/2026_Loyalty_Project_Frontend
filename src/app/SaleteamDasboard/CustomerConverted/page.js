"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  SearchInput,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
  Badge,
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../../_components/ui";

const CompletedEnquiries = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setConversations([]);

    try {
      const token = localStorage.getItem("admintokens");
      const Eid = localStorage.getItem("idstore");
      if (!token) {
        setError("User not authenticated.");
        return;
      }

      const response = await axios.get(`http://localhost:5005/api/getenquiries/${Eid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.customerData?.allConversations || [];

      if (data.length > 0) {
        setConversations(data);
      } else {
        setError("No conversations found.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data from server.");
    } finally {
      setLoading(false);
    }
  };

 const handleClick = () => {
  router.push('/SaleteamDasboard/SalesOrder')
 }

 const handleEditcustomerClick = (EnquiryNo) => {
  router.push(`/SaleteamDasboard/Editcustomer?EnquiryNo=${EnquiryNo}`);
};



 const handleBackClick = () => {
  router.push('/SaleteamDasboard/Dasboard');
};

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Completed Enquiries"
        subtitle="Enquiries you have completed and their conversion status."
        onBack={handleBackClick}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {loading && <LoadingBlock label="Loading enquiries…" />}

      {!loading && (conversations.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>Enquiry No</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th>Converted Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{conversation.EnquiryNo}</Td>
                <Td>{conversation.clientName}</Td>
                <Td>{conversation.Status && <Badge tone="blue">{conversation.Status}</Badge>}</Td>
                <Td>{conversation.Convertedstatus && <Badge tone="green">{conversation.Convertedstatus}</Badge>}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <PrimaryButton onClick={() => handleClick(conversation.EnquiryNo)}>
                      Sales Order
                    </PrimaryButton>
                    <SecondaryButton onClick={() => handleEditcustomerClick(conversation.EnquiryNo)}>
                      Edit
                    </SecondaryButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        !error && <EmptyState title="No conversations to display" subtitle="Completed enquiries will appear here." />
      ))}
    </PageShell>
  );
};

export default CompletedEnquiries;

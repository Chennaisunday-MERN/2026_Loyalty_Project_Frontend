"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  SearchInput,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
  Badge,
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../../_components/ui";

const Getcustomerdetails = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState(null); // Track which row is expanded
  const [expandedData, setExpandedData] = useState(null); // Store the expanded data for display
  const [showTable, setShowTable] = useState(true); // State to control showing/hiding the table
  const [searchQuery, setSearchQuery] = useState(""); // Store the search query for companyName

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setConversations([]); // Reset the conversations before fetching new data

    try {
      const token = localStorage.getItem("admintokens");
      if (!token) {
        setError("User not authenticated.");
        return; // Exit early if user is not authenticated
      }

      const response = await axios.get(`http://localhost:5005/api/cc/getconverteddata`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.customerData || [];
      if (data.length > 0) {
        setConversations(data);
      } else {
        setError("No conversations found.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch data from server.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRowView = (index, conversation) => {
    if (expandedRow === index) {
      setExpandedRow(null);
      setExpandedData(null); // Reset the expanded data when collapsing
      setShowTable(true); // Show the table again when collapsing
    } else {
      setExpandedRow(index);
      setExpandedData(conversation); // Set the expanded data to be displayed in a separate box
      setShowTable(false); // Hide the table when expanding the row
    }
  };

  const handleBackClick = () => {
    router.push("/SaleteamDasboard/Dasboard");
  };

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.PANnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.GSTNnumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        subtitle="Converted enquiries and their company details."
        onBack={handleBackClick}
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {loading && <LoadingBlock label="Loading customers…" />}

      {/* Table view */}
      {!loading && showTable && (
        <>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, PAN or GSTN…"
            className="max-w-md"
          />

          {filteredConversations.length > 0 ? (
            <TableWrap>
              <thead>
                <tr>
                  <Th>PAN Number</Th>
                  <Th>GSTN Number</Th>
                  <Th>Company Name</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {filteredConversations.map((conversation, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <Td>{conversation.PANnumber || "N/A"}</Td>
                    <Td>{conversation.GSTNnumber || "N/A"}</Td>
                    <Td className="font-medium text-slate-900">{conversation.companyName || "N/A"}</Td>
                    <Td>
                      <button
                        onClick={() => toggleRowView(index, conversation)}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-800 focus:outline-none"
                      >
                        View More
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          ) : (
            !error && <EmptyState title="No customers to display" subtitle="Converted customers will appear here." />
          )}
        </>
      )}

      {/* Expanded detail view */}
      {expandedData && !showTable && expandedRow !== null && (
        <Card>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">{expandedData.companyName || "N/A"}</h2>
                <p className="text-sm text-slate-500">Customer details</p>
              </div>
            </div>
            <SecondaryButton onClick={() => toggleRowView(expandedRow, expandedData)}>View Less</SecondaryButton>
          </div>

          <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <DetailRow label="PAN Number" value={expandedData.PANnumber} />
            <DetailRow label="GSTN Number" value={expandedData.GSTNnumber} />
            <DetailRow label="Company Name" value={expandedData.companyName} />
            <DetailRow label="Address" value={expandedData.AddressDetails?.Address} />
            <DetailRow label="Country" value={expandedData.AddressDetails?.Country} />
            <DetailRow label="City" value={expandedData.AddressDetails?.City} />
            <DetailRow label="Postal Code" value={expandedData.AddressDetails?.PostalCode} />
            <DetailRow label="State" value={expandedData.AddressDetails?.State} />
          </div>

          {expandedData.customerconvert && expandedData.customerconvert.length > 0 && (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Customer Conversion Details</h4>
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Client Name</Th>
                    <Th>Mobile</Th>
                    <Th>Primary Email</Th>
                    <Th>Followup Person</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {expandedData.customerconvert.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <Td className="font-medium text-slate-900">{customer?.clientName || "N/A"}</Td>
                      <Td>{customer?.CustomerDetails?.MobileNumber || "N/A"}</Td>
                      <Td>{customer?.CustomerDetails?.PrimaryMail || "N/A"}</Td>
                      <Td>{customer?.Eid || "N/A"}</Td>
                      <Td>
                        {customer?.createdAt
                          ? new Date(customer.createdAt).toLocaleDateString("en-GB")
                          : "N/A"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
};

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-50 py-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">{value || "N/A"}</span>
    </div>
  );
}

export default Getcustomerdetails;

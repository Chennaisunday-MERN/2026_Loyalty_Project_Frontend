"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  TableWrap,
  Th,
  Td,
  LoadingBlock,
  EmptyState,
} from "../../_components/ui";

const Customernotconverted = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const employeeId = localStorage.getItem("idstore");

    const token = localStorage.getItem("admintokens"); // Get the token from localStorage

    const fetchCustomers = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5005/api/cc/not-converted/${employeeId}`, // Correct API endpoint
          {
            headers: {
              Authorization: `Bearer ${token}`, // Attach token for authorization
            },
          }
        );
        setCustomers(res.data); // Set the response data to customers
        console.log(res.data);
      } catch (error) {
        setError("Something went wrong while fetching the data"); // Handle errors
      } finally {
        setLoading(false); // Set loading to false after the request
      }
    };

    fetchCustomers(); // Call the fetchCustomers function
  }, []);

  const handleBackClick = () => {
    router.push("/SaleteamDasboard/Dasboard"); // Navigate back to the dashboard
  };

  const handleDelete = async (EnquiryNo) => {
    const token = localStorage.getItem("admintokens");

    if (!token) {
      alert("Authorization token is missing.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5005/api/cc/customernotconverted/${EnquiryNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove the deleted customer from state
      setCustomers(customers.filter(c => c.EnquiryNo !== EnquiryNo));
      alert("Customer deleted successfully.");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. Please try again.");
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Customers Not Converted"
        subtitle="Enquiries that did not convert, with their remarks."
        onBack={handleBackClick}
      />

      {loading && <LoadingBlock label="Loading customers…" />}

      {!loading && (customers.length > 0 ? (
        <TableWrap>
          <thead>
            <tr>
              <Th>Enquiry No</Th>
              <Th>Customer ID</Th>
              <Th>Remarks</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{customer.EnquiryNo}</Td>
                <Td>{customer.Eid}</Td>
                <Td>{customer.remarks}</Td>
                <Td>
                  <button
                    onClick={() => handleDelete(customer.EnquiryNo)}
                    className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                    aria-label="Delete customer"
                  >
                    <Trash2 size={16} />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No customers found." subtitle="Customers that were not converted will appear here." />
      ))}
    </PageShell>
  );
};

export default Customernotconverted;

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, FileText } from "lucide-react";
import {
  PageShell,
  PageHeader,
  TableWrap,
  Th,
  Td,
  LoadingBlock,
  EmptyState,
} from "../../_components/ui";

export default function SuppliersTable() {
  const [suppliersWithPOs, setSuppliersWithPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all suppliers
        const res = await axios.get("http://localhost:5005/api-purchaseorder/POGetAllSuppier", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const suppliers = res.data;

        // Fetch PO data for each supplier
        const suppliersWithPOsPromises = suppliers.map(async (supplier) => {
          try {
            const resPO = await axios.get(
              `http://localhost:5005/api-purchaseorder/POGetAllSuppPO/${supplier.SuppNO}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            return {
              ...supplier,
              purchaseOrders: resPO.data,
            };
          } catch (err) {
            console.error(`❌ Error fetching POs for ${supplier.SupplierName}:`, err);
            return {
              ...supplier,
              purchaseOrders: [],
            };
          }
        });

        const results = await Promise.all(suppliersWithPOsPromises);
        setSuppliersWithPOs(results);
      } catch (error) {
        console.error("❌ Error fetching supplier data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  const handleGeneratePDF = (poNumber) => {
    if (!poNumber) return;
    router.push(`/SaleteamDasboard/POPdf?poNumber=${poNumber}`);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Procurement"
        title="Supplier & Purchase Orders"
        subtitle="All suppliers and their associated purchase orders."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
      />

      {loading ? (
        <LoadingBlock label="Loading suppliers and purchase orders…" />
      ) : suppliersWithPOs.length === 0 ? (
        <EmptyState title="No suppliers to display" subtitle="Suppliers will appear here." />
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Supplier Name</Th>
              <Th>GSTIN</Th>
              <Th>PO Number</Th>
              <Th>PO Created Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {suppliersWithPOs.map((supplier) =>
              supplier.purchaseOrders.length > 0 ? (
                supplier.purchaseOrders.map((po, index) => (
                  <tr key={`${supplier._id}-${index}`} className="hover:bg-slate-50">
                    {index === 0 && (
                      <>
                        <Td
                          className="align-top font-medium text-slate-900"
                          rowSpan={supplier.purchaseOrders.length}
                        >
                          {supplier.SupplierName}
                        </Td>
                        <Td
                          className="align-top"
                          rowSpan={supplier.purchaseOrders.length}
                        >
                          {supplier.GSTIN}
                        </Td>
                      </>
                    )}
                    <Td>{po.poNumber}</Td>
                    <Td>{new Date(po.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          title="View / Edit"
                          onClick={() =>
                            router.push(`/SaleteamDasboard/Editview?poNumber=${po.poNumber}`)
                          }
                          className="rounded-md p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          title="Delete"
                          onClick={async () => {
                            if (
                              confirm(`Are you sure you want to delete PO: ${po.poNumber}?`)
                            ) {
                              try {
                                await axios.delete(
                                  `http://localhost:5005/api-purchaseorder/deletePO?poNumber=${po.poNumber}`,
                                  {
                                    headers: { Authorization: `Bearer ${token}` },
                                  }
                                );
                                alert("PO deleted successfully.");
                                window.location.reload();
                              } catch (error) {
                                console.error("❌ Error deleting PO:", error);
                                alert("Failed to delete PO.");
                              }
                            }
                          }}
                          className="rounded-md p-2 text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button
                          title="Download PDF"
                          onClick={() => handleGeneratePDF(po.poNumber)}
                          className="rounded-md p-2 text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr key={supplier._id} className="hover:bg-slate-50">
                  <Td className="font-medium text-slate-900">{supplier.SupplierName}</Td>
                  <Td>{supplier.GSTIN}</Td>
                  <Td className="text-center text-slate-500" colSpan={3}>
                    No Purchase Orders
                  </Td>
                </tr>
              )
            )}
          </tbody>
        </TableWrap>
      )}
    </PageShell>
  );
}

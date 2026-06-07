"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AdminShell } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

function statusBadgeClass(status) {
  const value = (status || "").toLowerCase();
  if (["completed", "delivered", "approved", "confirmed", "paid"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["cancelled", "canceled", "rejected", "failed"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (["pending", "processing", "draft", "open"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(
        status
      )}`}
    >
      {status || "N/A"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
}

function formatAmount(value) {
  return `₹${Number(value || 0).toLocaleString()}`;
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900">{value ?? "N/A"}</dd>
    </div>
  );
}

export default function AllSalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAllSalesOrders = async () => {
      const token = localStorage.getItem("admintokens");

      if (!token) {
        setError("Missing authentication token.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5005/api-salesorder/salesorders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("❌ Error fetching sales orders:", err);
        setError(err.response?.data?.error || "Failed to fetch sales orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSalesOrders();
  }, []);

  const countLabel = loading
    ? "Loading sales orders…"
    : `${orders.length} order${orders.length === 1 ? "" : "s"} found`;

  return (
    <AdminShell
      title="Sales Orders"
      subtitle="Review all sales orders and their current status."
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {view === "grid" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All sales orders</h2>
            <p className="text-sm text-slate-500">{countLabel}</p>
          </div>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
              Loading sales orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-slate-500 shadow-sm">
              No sales orders found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {orders.map((order, index) => (
                <RecordCard
                  key={index}
                  title={order.salesOrderId || "N/A"}
                  subtitle={order.salesOrderDetails?.customerName || "N/A"}
                  badge={<StatusBadge status={order.salesOrderDetails?.status} />}
                  onClick={() => setSelected(order)}
                >
                  <CardField
                    label="Quote #"
                    value={order.salesOrderDetails?.quoteNumber || "N/A"}
                  />
                  <CardField
                    label="Order date"
                    value={formatDate(order.salesOrderDetails?.salesOrderDate)}
                  />
                  <CardField
                    label="Grand total"
                    value={formatAmount(order.summary?.grandTotal)}
                  />
                </RecordCard>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">All sales orders</h2>
            <p className="text-sm text-slate-500">{countLabel}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Sales Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      Loading sales orders…
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                      No sales orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr
                      key={index}
                      className="cursor-pointer hover:bg-slate-50/75"
                      onClick={() => setSelected(order)}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">{order.salesOrderId}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {order.salesOrderDetails?.customerName || "N/A"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={order.salesOrderDetails?.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-900">
                        ₹{order.summary?.grandTotal?.toLocaleString() || "0"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DetailModal
        open={!!selected}
        title={selected?.salesOrderId || "Sales order"}
        subtitle={selected?.salesOrderDetails?.customerName || "N/A"}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Order details</h3>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <DetailField label="Sales Order ID" value={selected.salesOrderId || "N/A"} />
                <DetailField label="Employee ID" value={selected.Eid || "N/A"} />
                <DetailField
                  label="Customer"
                  value={selected.salesOrderDetails?.customerName || "N/A"}
                />
                <DetailField
                  label="Quote Number"
                  value={selected.salesOrderDetails?.quoteNumber || "N/A"}
                />
                <DetailField
                  label="Subject"
                  value={selected.salesOrderDetails?.subject || "N/A"}
                />
                <DetailField
                  label="Sales Order Date"
                  value={formatDate(selected.salesOrderDetails?.salesOrderDate)}
                />
                <DetailField
                  label="Status"
                  value={<StatusBadge status={selected.salesOrderDetails?.status} />}
                />
                <DetailField
                  label="Assigned To"
                  value={selected.salesOrderDetails?.assignedTo || "N/A"}
                />
                <DetailField
                  label="PO Number"
                  value={selected.salesOrderDetails?.poNumber || "N/A"}
                />
                <DetailField
                  label="PO Date"
                  value={formatDate(selected.salesOrderDetails?.poDate)}
                />
                <DetailField
                  label="Payment Terms"
                  value={selected.salesOrderDetails?.paymentTerms || "N/A"}
                />
                <DetailField
                  label="Terms & Conditions"
                  value={selected.termsAndConditions?.text || "N/A"}
                />
              </dl>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Items ({selected.items?.length || 0})
              </h3>
              {selected.items?.length ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Item</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">List Price</th>
                        <th className="px-4 py-2">Discount</th>
                        <th className="px-4 py-2">Tax</th>
                        <th className="px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selected.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-slate-900">{item.itemName || "N/A"}</td>
                          <td className="px-4 py-2 text-slate-600">{item.quantity ?? 0}</td>
                          <td className="px-4 py-2 text-slate-600">{formatAmount(item.listPrice)}</td>
                          <td className="px-4 py-2 text-slate-600">{formatAmount(item.discount)}</td>
                          <td className="px-4 py-2 text-slate-600">{formatAmount(item.tax)}</td>
                          <td className="px-4 py-2 text-slate-900">{formatAmount(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No items on this order.</p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary</h3>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                <DetailField label="Items Total" value={formatAmount(selected.summary?.itemsTotal)} />
                <DetailField
                  label="Discount Total"
                  value={formatAmount(selected.summary?.discountTotal)}
                />
                <DetailField
                  label="Shipping & Handling"
                  value={formatAmount(selected.summary?.shippingHandling)}
                />
                <DetailField
                  label="Pre-Tax Total"
                  value={formatAmount(selected.summary?.preTaxTotal)}
                />
                <DetailField
                  label="Taxes For Shipping"
                  value={formatAmount(selected.summary?.taxesForShipping)}
                />
                <DetailField
                  label="Transit Insurance"
                  value={formatAmount(selected.summary?.transitInsurance)}
                />
                <DetailField
                  label="Installation Charges"
                  value={formatAmount(selected.summary?.installationCharges)}
                />
                <DetailField
                  label="Tax For Installation"
                  value={formatAmount(selected.summary?.taxForInstallation)}
                />
                <DetailField
                  label="Adjustments"
                  value={formatAmount(selected.summary?.adjustments)}
                />
                <DetailField label="Grand Total" value={formatAmount(selected.summary?.grandTotal)} />
                <DetailField label="Created" value={formatDate(selected.createdAt)} />
                <DetailField label="Updated" value={formatDate(selected.updatedAt)} />
              </dl>
            </div>
          </div>
        )}
      </DetailModal>
    </AdminShell>
  );
}

"use client";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  PageHeader,
  Card,
  Badge,
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../../_components/ui";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const eid = localStorage.getItem('idstore');
        const token = localStorage.getItem('admintokens');

        if (!eid || !token) {
          setError('Missing Eid or authentication token.');
          setLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:5005/api-salesorder/salesorders/${eid}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setOrders(response.data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.error || 'Failed to fetch sales orders');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesOrders();
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Sales Orders"
        subtitle="Sales orders raised under your account."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
      />

      {loading ? (
        <LoadingBlock label="Loading sales orders…" />
      ) : error ? (
        <ErrorBanner>{error}</ErrorBanner>
      ) : orders.length === 0 ? (
        <EmptyState title="No sales orders found." subtitle="Sales orders you raise will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((order, index) => (
            <Card key={index}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <span className="text-sm font-semibold text-slate-900">{order.salesOrderId}</span>
                <Badge tone="blue">{order.salesOrderDetails.status}</Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Customer</span>
                  <span className="font-medium text-slate-800">{order.salesOrderDetails.customerName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Grand Total</span>
                  <span className="font-semibold text-slate-900">₹{order.summary.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import {
  PageShell,
  PageHeader,
  PrimaryButton,
  TableWrap,
  Th,
  Td,
  ErrorBanner,
} from "../../_components/ui";

const API = "http://localhost:5005/api";

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
}

function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "N/A";
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(number);
}

function productImageUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

export default function ProductEnquiriesPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("admintokens") || "";
    const storedRole = localStorage.getItem("role") || "";
    setToken(storedToken);
    setRole(storedRole);

    if (!storedToken || !storedRole) {
      router.push("/");
    }
  }, [router]);

  const headers = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  const canView = ["Lead filler", "md", "sales head"].includes(role);

  const fetchEnquiries = async () => {
    if (!token || !canView) return;
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/customer-website-enquiries`, { headers });
      setEnquiries(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customer website enquiries.");
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && role) {
      if (canView) {
        fetchEnquiries();
      } else {
        setLoading(false);
        setError("You do not have permission to view customer website enquiries.");
      }
    }
  }, [token, role, canView]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Product Enquiries"
        subtitle="Product enquiry submissions received from the public website."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
        actions={
          <PrimaryButton onClick={fetchEnquiries} disabled={loading || !canView}>
            <RefreshCw size={16} />
            Refresh
          </PrimaryButton>
        }
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Enquiries ({enquiries.length})
        </h2>

        <TableWrap>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Company</Th>
              <Th>Product</Th>
              <Th>Quantity</Th>
              <Th>GST</Th>
              <Th>Customer Message</Th>
              <Th>Requirements</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <Td className="text-center text-slate-500" colSpan="8">Loading enquiries...</Td>
              </tr>
            ) : enquiries.length === 0 ? (
              <tr>
                <Td className="text-center text-slate-500" colSpan="8">No customer website enquiries found.</Td>
              </tr>
            ) : enquiries.map((item) => {
              const imageUrl = productImageUrl(item?.product?.productimage);
              return (
                <tr key={item._id} className="align-top hover:bg-slate-50">
                  <Td className="whitespace-nowrap text-slate-600">{formatDate(item.createdAt)}</Td>
                  <Td>
                    <div className="font-medium text-slate-900">{item?.customerInfo?.name || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item?.customerInfo?.email || "N/A"}</div>
                    <div className="text-xs text-slate-500">{item?.customerInfo?.phone || "N/A"}</div>
                  </Td>
                  <Td>
                    <div className="font-medium text-slate-900">{item?.productInfo?.companyName || "N/A"}</div>
                  </Td>
                  <Td>
                    <div className="flex min-w-64 gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item?.product?.title || "Product"}
                          className="h-14 w-14 rounded-md border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-md border border-slate-200 bg-slate-100" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{item?.product?.title || "N/A"}</div>
                        <div className="text-xs text-slate-500">{formatPrice(item?.product?.price)}</div>
                        <div className="mt-1 max-w-xs text-xs text-slate-500">{item?.product?.description || "N/A"}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>{item?.productInfo?.quantity ?? "N/A"}</Td>
                  <Td>{item?.productInfo?.gstNumber || "N/A"}</Td>
                  <Td className="min-w-64 text-slate-700">{item?.customerInfo?.description || "N/A"}</Td>
                  <Td className="min-w-64 text-slate-700">{item?.productInfo?.additionalRequirements || "N/A"}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </div>
    </PageShell>
  );
}

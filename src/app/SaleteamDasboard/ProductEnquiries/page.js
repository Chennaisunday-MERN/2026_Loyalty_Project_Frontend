"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Customer website</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">Product Enquiries</h1>
              <p className="mt-1 text-sm text-slate-600">Product enquiry submissions received from the public website.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/SaleteamDasboard/Dasboard")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={fetchEnquiries}
                disabled={loading || !canView}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Enquiries ({enquiries.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">GST</th>
                  <th className="px-4 py-3">Customer Message</th>
                  <th className="px-4 py-3">Requirements</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-slate-500">Loading enquiries...</td>
                  </tr>
                ) : enquiries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-10 text-center text-slate-500">No customer website enquiries found.</td>
                  </tr>
                ) : enquiries.map((item) => {
                  const imageUrl = productImageUrl(item?.product?.productimage);
                  return (
                    <tr key={item._id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-950">{item?.customerInfo?.name || "N/A"}</div>
                        <div className="text-xs text-slate-600">{item?.customerInfo?.email || "N/A"}</div>
                        <div className="text-xs text-slate-600">{item?.customerInfo?.phone || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{item?.productInfo?.companyName || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
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
                            <div className="font-medium text-slate-950">{item?.product?.title || "N/A"}</div>
                            <div className="text-xs text-slate-600">{formatPrice(item?.product?.price)}</div>
                            <div className="mt-1 max-w-xs text-xs text-slate-500">{item?.product?.description || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{item?.productInfo?.quantity ?? "N/A"}</td>
                      <td className="px-4 py-3">{item?.productInfo?.gstNumber || "N/A"}</td>
                      <td className="min-w-64 px-4 py-3 text-slate-700">{item?.customerInfo?.description || "N/A"}</td>
                      <td className="min-w-64 px-4 py-3 text-slate-700">{item?.productInfo?.additionalRequirements || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Building, Users, FileText, Badge as BadgeIcon, Activity, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PageShell,
  PageHeader,
  Card,
  Badge,
  LoadingBlock,
  ErrorBanner,
  EmptyState,
} from "../../_components/ui";

const EmployeeDashboard = () => {
  const router = useRouter();
  const Eid = typeof window !== "undefined" ? localStorage.getItem("idstore") : null;

  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admintokens");

      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:5005/api/getUserData/${Eid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        setUserData(response.data);
      } else {
        setError("No user data found.");
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Eid) {
      fetchUserData();
    }
  }, [Eid]);

  const handleBackClick = () => {
    router.push("/SaleteamDasboard/Dasboard");
  };

  if (!Eid) return <p>No Eid found in localStorage</p>;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Procurement"
        title="Employee Dashboard"
        subtitle="Customer accounts and their product requests."
        onBack={handleBackClick}
      />

      {loading && <LoadingBlock label="Loading user data…" />}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {userData.length > 0 && userData.map((user, index) => (
        <Card key={index} padded={false} className="overflow-hidden">
          {/* User Header */}
          <div className="border-b border-slate-100 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.Eid} • {user.companyName}</p>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Mail className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
                <p className="text-sm text-slate-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Building className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
                <p className="text-sm text-slate-800">{user.companyName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Users className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Contact Person</p>
                <p className="text-sm text-slate-800">{user.contactpersonname}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <FileText className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description</p>
                <p className="text-sm text-slate-800">{user.Description}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <BadgeIcon className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employee ID</p>
                <p className="text-sm text-slate-800">{user.Employeeid}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Activity className="text-blue-500" size={20} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
                <Badge tone={user.Status === 'Active' ? 'green' : 'red'}>
                  {user.Status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <h3 className="mb-4 flex items-center text-base font-semibold text-slate-900">
              <Package className="mr-2 text-blue-500" size={20} />
              Product Details
            </h3>

            {Array.isArray(user.productDetails) && user.productDetails.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {user.productDetails.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <p className="font-medium text-slate-900">{item.productname}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-slate-500">Quantity</span>
                      <span className="text-sm font-medium text-slate-800">{item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-slate-500">No product details available</p>
            )}
          </div>
        </Card>
      ))}

      {userData.length === 0 && !loading && !error && (
        <EmptyState title="No user data to display" subtitle="Employee data will appear here." />
      )}
    </PageShell>
  );
};

export default EmployeeDashboard;

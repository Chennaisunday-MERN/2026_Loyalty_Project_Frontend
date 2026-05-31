"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Edit2, RefreshCcw, Search, Trash2 } from "lucide-react";
import {
  AdminPanel,
  AdminShell,
  adminInputClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from "../_components/AdminShell";

const Getresources = () => {
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("admintokens"));
  }, []);

  const fetchCompanyResources = async () => {
    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://localhost:5005/api/getCompanyresource", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else {
        setError("Invalid data format received from server.");
      }
    } catch (error) {
      console.error("Error details:", error);
      setError(error.response?.data?.message || "Error: Server issue, try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token !== null) fetchCompanyResources();
  }, [token]);

  const handleEdit = (Eid, resource) => {
    setEditData({ Eid, ...resource });
  };

  const handleSubmit = async (e, Eid) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5005/api/updateCompanyresource/${Eid}`,
        {
          EOD: editData.EOD,
          givenStatus: editData.givenStatus,
          Thingsname: editData.Thingsname,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.Eid === Eid
            ? {
                ...emp,
                CompanyResources: emp.CompanyResources.map((res) =>
                  res.productnumber === editData.productnumber
                    ? { ...res, EOD: editData.EOD, givenStatus: editData.givenStatus }
                    : res
                ),
              }
            : emp
        )
      );

      setEditData(null);
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update. Please try again.");
    }
  };

  const handleDelete = async (Eid, Thingsname) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      await axios.delete(`http://localhost:5005/api/deleteCompanyresource/${Eid}/${Thingsname}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.Eid === Eid
            ? {
                ...emp,
                CompanyResources: emp.CompanyResources.filter((res) => res.Thingsname !== Thingsname),
              }
            : emp
        )
      );
    } catch (error) {
      console.error("Delete Error:", error);
      alert("Failed to delete resource. Please try again.");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(searchLower) ||
      employee.Eid?.toLowerCase().includes(searchLower) ||
      employee.CompanyResources?.some(
        (resource) =>
          resource.Thingsname?.toLowerCase().includes(searchLower) ||
          resource.productnumber?.toLowerCase().includes(searchLower) ||
          resource.givenStatus?.toLowerCase().includes(searchLower)
      )
    );
  });

  const resourceCount = employees.reduce((sum, employee) => sum + (employee.CompanyResources?.length || 0), 0);

  return (
    <AdminShell
      title="Company Resources"
      subtitle="Track company assets issued to employees and update handover status."
      actions={
        <button type="button" onClick={fetchCompanyResources} className={adminSecondaryButtonClass}>
          <RefreshCcw size={16} />
          Refresh
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Employees" value={employees.length} />
        <Metric label="Resources" value={resourceCount} />
        <Metric label="Filtered" value={filteredEmployees.length} />
      </div>

      <AdminPanel title="Issued Resources" subtitle="Search by employee, employee ID, resource name, serial number, or status.">
        <div className="relative mb-4">
          <Search size={18} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${adminInputClass} pl-10`}
          />
        </div>

        {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading company resources...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <React.Fragment key={employee.Eid}>
                      {employee.CompanyResources && employee.CompanyResources.length > 0 ? (
                        employee.CompanyResources.map((resource, index) => (
                          <tr key={`${employee.Eid}-${index}`} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-950">{employee.name || "N/A"}</div>
                              <div className="text-xs text-slate-500">ID: {employee.Eid || "N/A"}</div>
                              <div className="text-xs text-slate-400">Joined: {formatDate(employee.JOD)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-950">{resource.Thingsname || "N/A"}</div>
                              <div className="text-xs text-slate-500">#{resource.productnumber || "N/A"}</div>
                              <div className="text-xs text-slate-400">End date: {formatDate(employee.EOD)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(resource.givenStatus)}`}>
                                {resource.givenStatus || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleEdit(employee.Eid, resource)} className="rounded-md border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100" aria-label="Edit resource">
                                  <Edit2 size={16} />
                                </button>
                                <button type="button" onClick={() => handleDelete(employee.Eid, resource.Thingsname)} className="rounded-md border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100" aria-label="Delete resource">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-950">{employee.name || "N/A"}</div>
                            <div className="text-xs text-slate-500">ID: {employee.Eid || "N/A"}</div>
                          </td>
                          <td colSpan="3" className="px-4 py-3 text-center text-slate-500">No company resources found.</td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                      {searchTerm ? "No matching resources found." : "No employee data found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-950">Edit Resource</h2>
              <p className="text-sm text-slate-600">{editData.Thingsname}</p>
            </div>
            <form onSubmit={(e) => handleSubmit(e, editData.Eid)} className="space-y-4 p-5">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">End Date</span>
                <input type="date" value={editData.EOD || ""} onChange={(e) => setEditData({ ...editData, EOD: e.target.value })} className={adminInputClass} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
                <select value={editData.givenStatus || ""} onChange={(e) => setEditData({ ...editData, givenStatus: e.target.value })} className={adminInputClass}>
                  <option value="">Select Status</option>
                  <option value="provided">Given</option>
                  <option value="handover">Handover</option>
                  <option value="bending">Bending</option>
                  <option value="nothandover">Not Handover</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditData(null)} className={adminSecondaryButtonClass}>
                  Cancel
                </button>
                <button type="submit" className={adminPrimaryButtonClass}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isNaN(date) ? "Invalid Date" : date.toLocaleDateString("en-GB");
}

function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case "provided":
    case "given":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "handover":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "bending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "nothandover":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default Getresources;

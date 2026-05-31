"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AdminPanel, AdminShell } from "../_components/AdminShell";

const roleOrder = ["sales head", "Lead filler", "Sales Employee", "Inventory Manager", "Stock Filler", "Service Engineer", "Engineer"];

const Viewallprofile = () => {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("admintokens");
    if (!token) {
      setError("No token found. Please login as an admin.");
      setLoading(false);
      return;
    }

    axios
      .get("http://localhost:5005/api/adminviewallprofile", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((response) => {
        if (response.data && response.data.getallprofile) {
          setProfileData(response.data.getallprofile);
        } else {
          setError("Unexpected response data");
        }
      })
      .catch((error) => {
        console.error("Error fetching profile data:", error);
        setError("Error fetching profile data");
      })
      .finally(() => setLoading(false));
  }, []);

  const groupedProfiles = profileData.reduce((groups, profile) => {
    const role = profile.role || "Other";
    if (!groups[role]) groups[role] = [];
    groups[role].push(profile);
    return groups;
  }, {});

  const orderedRoles = [
    ...roleOrder.filter((role) => groupedProfiles[role]),
    ...Object.keys(groupedProfiles).filter((role) => !roleOrder.includes(role)),
  ];

  return (
    <AdminShell title="Employees" subtitle="View employee profiles, documents, roles, and contact information.">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Employees" value={profileData.length} />
        <Metric label="Roles" value={orderedRoles.length} />
        <Metric label="With Documents" value={profileData.filter((profile) => profile.Fileupload).length} />
      </div>

      <AdminPanel title="Employee Directory" subtitle="Employees are grouped by role for quicker admin review.">
        {loading && <div className="py-12 text-center text-sm text-slate-500">Loading employee profiles...</div>}
        {!loading && error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!loading && !error && profileData.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">No profiles available.</div>
        )}
        {!loading && !error && orderedRoles.map((role) => (
          <section key={role} className="mb-8 last:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{role}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {groupedProfiles[role].length} employees
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">E-ID</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Joining</th>
                    <th className="px-4 py-3">Document</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {groupedProfiles[role].map((profile) => {
                    const fileUrl = profile.Fileupload ? `http://localhost:5005/api/uploads/${profile.Fileupload}` : null;
                    const profileImg = profile.profileimg ? `http://localhost:5005/api/uploads/${profile.profileimg}` : "";

                    return (
                      <tr key={profile._id || profile.Eid || profile.email} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                              {profileImg ? (
                                <img src={profileImg} alt={profile.name || "Employee"} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
                                  {String(profile.name || "?").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-950">{profile.name || "N/A"}</div>
                              <div className="text-xs text-slate-500">{profile.email || "N/A"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{profile.Eid || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600">{profile.contactnumber || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(profile.JOD)}</td>
                        <td className="px-4 py-3">
                          {fileUrl ? (
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:text-teal-900">
                              Open file
                            </a>
                          ) : (
                            <span className="text-slate-400">No file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </AdminPanel>
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

function formatDate(value) {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString();
}

export default Viewallprofile;

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AdminPanel, AdminShell } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const roleOrder = ["sales head", "Lead filler", "Sales Employee", "Inventory Manager", "Stock Filler", "Service Engineer", "Engineer"];

const Viewallprofile = () => {
  const [profileData, setProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);

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

  const selectedFileUrl = selected?.Fileupload ? `http://localhost:5005/api/uploads/${selected.Fileupload}` : null;
  const selectedProfileImg = selected?.profileimg ? `http://localhost:5005/api/uploads/${selected.profileimg}` : "";

  return (
    <AdminShell title="Employees" subtitle="View employee profiles, documents, roles, and contact information.">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Employees" value={profileData.length} />
        <Metric label="Roles" value={orderedRoles.length} />
        <Metric label="With Documents" value={profileData.filter((profile) => profile.Fileupload).length} />
      </div>

      <AdminPanel title="Employee Directory" subtitle="Employees are grouped by role for quicker admin review.">
        <div className="mb-4 flex justify-end">
          <ViewToggle view={view} onChange={setView} />
        </div>
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

            {view === "grid" ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedProfiles[role].map((profile) => (
                  <RecordCard
                    key={profile._id || profile.Eid || profile.email}
                    title={profile.name || "N/A"}
                    subtitle={profile.role || "N/A"}
                    badge={
                      profile.Fileupload ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Document
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          No file
                        </span>
                      )
                    }
                    onClick={() => setSelected(profile)}
                  >
                    <CardField label="E-ID" value={profile.Eid || "N/A"} />
                    <CardField label="Contact" value={profile.contactnumber || "N/A"} />
                    <CardField label="Joining" value={formatDate(profile.JOD)} />
                  </RecordCard>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">E-ID</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Joining</th>
                      <th className="px-5 py-3">Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {groupedProfiles[role].map((profile) => {
                      const fileUrl = profile.Fileupload ? `http://localhost:5005/api/uploads/${profile.Fileupload}` : null;
                      const profileImg = profile.profileimg ? `http://localhost:5005/api/uploads/${profile.profileimg}` : "";

                      return (
                        <tr
                          key={profile._id || profile.Eid || profile.email}
                          className="cursor-pointer hover:bg-slate-50/75"
                          onClick={() => setSelected(profile)}
                        >
                          <td className="px-5 py-3">
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
                          <td className="px-5 py-3 font-medium text-slate-700">{profile.Eid || "N/A"}</td>
                          <td className="px-5 py-3 text-slate-600">{profile.contactnumber || "N/A"}</td>
                          <td className="px-5 py-3 text-slate-600">{formatDate(profile.JOD)}</td>
                          <td className="px-5 py-3">
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-teal-700 hover:text-teal-900"
                              >
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
            )}
          </section>
        ))}
      </AdminPanel>

      <DetailModal
        open={!!selected}
        title={selected?.name || "Employee"}
        subtitle={selected?.role || "N/A"}
        onClose={() => setSelected(null)}
        footer={
          selectedFileUrl ? (
            <a
              href={selectedFileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              Open uploaded document
            </a>
          ) : (
            <span className="text-sm text-slate-400">No document uploaded</span>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                {selectedProfileImg ? (
                  <img src={selectedProfileImg} alt={selected.name || "Employee"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-500">
                    {String(selected.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{selected.name || "N/A"}</div>
                <div className="text-xs text-slate-500">{selected.email || "N/A"}</div>
              </div>
            </div>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
                <dd className="text-sm text-slate-900">{selected.name || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                <dd className="text-sm text-slate-900">{selected.role || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">E-ID</dt>
                <dd className="text-sm text-slate-900">{selected.Eid || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="text-sm text-slate-900">{selected.email || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Contact</dt>
                <dd className="text-sm text-slate-900">{selected.contactnumber || "N/A"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Joining Date</dt>
                <dd className="text-sm text-slate-900">{formatDate(selected.JOD)}</dd>
              </div>
            </dl>
          </div>
        )}
      </DetailModal>
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

"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE = "http://localhost:5005/api";

const emptyLead = {
  LeadDetails: {
    clientName: "",
    Leadcondition: "new",
    companyName: "",
    Department: "",
    LeadMedium: "Email",
    LeadPriority: "Low",
    EnquiryType: "",
  },
  ContactDetails: {
    MobileNumber: "",
    AlternateMobileNumber: "",
    PrimaryMail: "",
    SecondaryMail: "",
  },
  AddressDetails: {
    Address: "",
    Country: "",
    City: "",
    PostalCode: "",
    State: "",
  },
  DescriptionDetails: "",
};

const requiredFields = [
  "LeadDetails.clientName",
  "LeadDetails.Leadcondition",
  "LeadDetails.companyName",
  "LeadDetails.Department",
  "LeadDetails.LeadMedium",
  "LeadDetails.LeadPriority",
  "LeadDetails.EnquiryType",
  "ContactDetails.MobileNumber",
  "ContactDetails.PrimaryMail",
  "AddressDetails.Address",
  "AddressDetails.Country",
  "AddressDetails.City",
  "AddressDetails.PostalCode",
  "AddressDetails.State",
];

function normalizeLead(lead) {
  return {
    LeadDetails: { ...emptyLead.LeadDetails, ...(lead?.LeadDetails || {}) },
    ContactDetails: { ...emptyLead.ContactDetails, ...(lead?.ContactDetails || {}) },
    AddressDetails: { ...emptyLead.AddressDetails, ...(lead?.AddressDetails || {}) },
    DescriptionDetails: lead?.DescriptionDetails || "",
  };
}

function getValue(lead, path) {
  return path.split(".").reduce((current, key) => current?.[key], lead);
}

function priorityClass(priority) {
  if (priority === "High") return "bg-red-100 text-red-700 border-red-200";
  if (priority === "Medium") return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-700 border-green-200";
}

export default function EmailLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const [connection, setConnection] = useState({ connected: false, mailboxEmail: "" });
  const [drafts, setDrafts] = useState([]);
  const [salesHeads, setSalesHeads] = useState([]);
  const [days, setDays] = useState("0");
  const [statusFilter, setStatusFilter] = useState("draft");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [formLead, setFormLead] = useState(emptyLead);
  const [selectedEid, setSelectedEid] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem("admintokens");
    const storedRole = localStorage.getItem("role");
    setToken(storedToken || "");
    setRole(storedRole || "");

    if (!storedToken || storedRole !== "Lead filler") {
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (searchParams.get("connected")) {
      setMessage("Gmail connected successfully.");
    }
    if (searchParams.get("error")) {
      setError("Gmail connection failed. Please try again.");
    }
  }, [searchParams]);

  const fetchConnection = async () => {
    const response = await axios.get(`${API_BASE}/email-leads/gmail/status`, { headers: authHeaders });
    setConnection(response.data);
  };

  const fetchDrafts = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

    const response = await axios.get(`${API_BASE}/email-leads/drafts?${params.toString()}`, {
      headers: authHeaders,
    });
    setDrafts(response.data.drafts || []);
  };

  const fetchSalesHeads = async () => {
    const response = await axios.get(`${API_BASE}/getsalesheadEid`, { headers: authHeaders });
    setSalesHeads(response.data.getallprofile || []);
  };

  useEffect(() => {
    if (token && role === "Lead filler") {
      fetchConnection().catch(() => setError("Unable to load Gmail connection status."));
      fetchDrafts().catch(() => setError("Unable to load email lead drafts."));
      fetchSalesHeads().catch(() => setError("Unable to load Sales Head list."));
    }
  }, [token, role, statusFilter, priorityFilter]);

  const connectGmail = async () => {
    try {
      setError("");
      const response = await axios.get(`${API_BASE}/email-leads/gmail/connect`, { headers: authHeaders });
      window.location.href = response.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Unable to start Gmail connection.");
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const response = await axios.post(
        `${API_BASE}/email-leads/fetch`,
        { days: Number(days), maxResults: 50 },
        { headers: authHeaders }
      );
      setMessage(`Fetched ${response.data.fetched} emails. Created ${response.data.created} drafts. Skipped ${response.data.skipped} duplicates.`);
      await fetchDrafts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch Gmail records.");
    } finally {
      setLoading(false);
    }
  };

  const openDraft = (draft) => {
    setSelectedDraft(draft);
    setFormLead(normalizeLead(draft.extractedLead));
    setSelectedEid("");
    setError("");
    setMessage("");
  };

  const updateField = (path, value) => {
    const [section, field] = path.split(".");
    setFormLead((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: value,
      },
    }));
  };

  const localMissingFields = useMemo(() => (
    requiredFields.filter((field) => !String(getValue(formLead, field) || "").trim())
  ), [formLead]);

  const saveDraft = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      setError("");
      const response = await axios.put(
        `${API_BASE}/email-leads/drafts/${selectedDraft._id}`,
        {
          extractedLead: formLead,
          aiPriority: formLead.LeadDetails.LeadPriority,
          aiReason: selectedDraft.aiReason,
        },
        { headers: authHeaders }
      );
      setSelectedDraft(response.data.draft);
      setMessage("Draft saved.");
      await fetchDrafts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save draft.");
    } finally {
      setLoading(false);
    }
  };

  const createEnquiry = async () => {
    if (!selectedDraft) return;
    if (localMissingFields.length > 0) {
      setError(`Complete required fields: ${localMissingFields.join(", ")}`);
      return;
    }
    if (!selectedEid) {
      setError("Select a Sales Head before creating the enquiry.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.post(
        `${API_BASE}/email-leads/drafts/${selectedDraft._id}/create-enquiry`,
        { extractedLead: formLead, Eid: selectedEid },
        { headers: authHeaders }
      );
      setMessage(`Enquiry ${response.data.data.EnquiryNo} created successfully.`);
      setSelectedDraft(null);
      await fetchDrafts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create enquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Email Leads</h1>
            <p className="text-sm text-gray-600">Fetch shared Gmail records and review AI-classified lead drafts.</p>
          </div>
          <button
            onClick={() => router.push("/SaleteamDasboard/Dasboard")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back
          </button>
        </div>

        {message && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700">{message}</div>}
        {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Gmail Connection</h2>
            <p className="mt-2 text-sm text-gray-600">
              {connection.connected ? `Connected: ${connection.mailboxEmail}` : "Shared lead mailbox is not connected."}
            </p>
            <button
              onClick={connectGmail}
              className="mt-4 w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              {connection.connected ? "Reconnect Gmail" : "Connect Gmail"}
            </button>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Fetch Records</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[160px_160px_160px_1fr]">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Days</span>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="draft">Draft</option>
                  <option value="error">Needs Review</option>
                  <option value="created">Created</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Priority</span>
                <select
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <div className="flex items-end">
                <button
                  onClick={fetchEmails}
                  disabled={loading || !connection.connected}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? "Working..." : "Fetch Emails"}
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">Use 0 for current day only. Larger values fetch that many previous days.</p>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Drafts</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {drafts.length === 0 ? (
                <p className="p-5 text-sm text-gray-600">No email lead drafts found.</p>
              ) : drafts.map((draft) => (
                <button
                  key={draft._id}
                  onClick={() => openDraft(draft)}
                  className="block w-full px-5 py-4 text-left hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{draft.subject || "No subject"}</h3>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass(draft.aiPriority)}`}>
                      {draft.aiPriority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{draft.from || "Unknown sender"}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-500">{draft.snippet || draft.bodyPreview || "No preview"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>Status: {draft.status}</span>
                    <span>Confidence: {draft.aiConfidence}</span>
                    <span>Missing: {draft.missingFields?.length || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            {!selectedDraft ? (
              <p className="text-sm text-gray-600">Select a draft to review and create an enquiry.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Review Draft</h2>
                  <p className="mt-1 text-sm text-gray-600">{selectedDraft.aiReason || "No AI reason provided."}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Company Name" value={formLead.LeadDetails.companyName} onChange={(value) => updateField("LeadDetails.companyName", value)} />
                  <Field label="Contact Person" value={formLead.LeadDetails.clientName} onChange={(value) => updateField("LeadDetails.clientName", value)} />
                  <Field label="Department" value={formLead.LeadDetails.Department} onChange={(value) => updateField("LeadDetails.Department", value)} />
                  <Field label="Lead Medium" value={formLead.LeadDetails.LeadMedium} onChange={(value) => updateField("LeadDetails.LeadMedium", value)} />
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Lead Priority</span>
                    <select value={formLead.LeadDetails.LeadPriority} onChange={(event) => updateField("LeadDetails.LeadPriority", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Enquiry Type</span>
                    <select value={formLead.LeadDetails.EnquiryType} onChange={(event) => updateField("LeadDetails.EnquiryType", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="">Select</option>
                      <option value="Product">Product</option>
                      <option value="Project">Project</option>
                      <option value="Service">Service</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Lead Condition</span>
                    <select value={formLead.LeadDetails.Leadcondition} onChange={(event) => updateField("LeadDetails.Leadcondition", event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="new">New</option>
                      <option value="existing">Existing</option>
                    </select>
                  </label>
                  <Field label="Mobile Number" value={formLead.ContactDetails.MobileNumber} onChange={(value) => updateField("ContactDetails.MobileNumber", value)} />
                  <Field label="Alternate Mobile" value={formLead.ContactDetails.AlternateMobileNumber} onChange={(value) => updateField("ContactDetails.AlternateMobileNumber", value)} />
                  <Field label="Primary Mail" value={formLead.ContactDetails.PrimaryMail} onChange={(value) => updateField("ContactDetails.PrimaryMail", value)} />
                  <Field label="Secondary Mail" value={formLead.ContactDetails.SecondaryMail} onChange={(value) => updateField("ContactDetails.SecondaryMail", value)} />
                  <Field label="Address" value={formLead.AddressDetails.Address} onChange={(value) => updateField("AddressDetails.Address", value)} />
                  <Field label="Country" value={formLead.AddressDetails.Country} onChange={(value) => updateField("AddressDetails.Country", value)} />
                  <Field label="City" value={formLead.AddressDetails.City} onChange={(value) => updateField("AddressDetails.City", value)} />
                  <Field label="Postal Code" value={formLead.AddressDetails.PostalCode} onChange={(value) => updateField("AddressDetails.PostalCode", value)} />
                  <Field label="State" value={formLead.AddressDetails.State} onChange={(value) => updateField("AddressDetails.State", value)} />
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <textarea
                    value={formLead.DescriptionDetails}
                    onChange={(event) => setFormLead((previous) => ({ ...previous, DescriptionDetails: event.target.value }))}
                    className="mt-1 min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Sales Head</span>
                  <select value={selectedEid} onChange={(event) => setSelectedEid(event.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">Select Sales Head</option>
                    {salesHeads.map((head) => (
                      <option key={head.Eid} value={head.Eid}>{head.Eid} - {head.name}</option>
                    ))}
                  </select>
                </label>

                {localMissingFields.length > 0 && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Missing: {localMissingFields.join(", ")}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button onClick={saveDraft} disabled={loading} className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 disabled:opacity-50">Save Draft</button>
                  <button onClick={createEnquiry} disabled={loading || selectedDraft.status === "created"} className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-300">Create Enquiry</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
      />
    </label>
  );
}

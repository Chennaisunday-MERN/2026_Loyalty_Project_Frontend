"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  Badge,
  ErrorBanner,
} from "../../_components/ui";

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

function priorityTone(priority) {
  if (priority === "High") return "red";
  if (priority === "Medium") return "amber";
  return "green";
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

  const selectClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title="Email Leads"
        subtitle="Fetch shared Gmail records and review AI-classified lead drafts."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
      />

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
      )}
      {error && <ErrorBanner>{error}</ErrorBanner>}

      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <Card>
          <h2 className="text-base font-semibold text-slate-900">Gmail Connection</h2>
          <p className="mt-2 text-sm text-slate-500">
            {connection.connected ? `Connected: ${connection.mailboxEmail}` : "Shared lead mailbox is not connected."}
          </p>
          <PrimaryButton onClick={connectGmail} className="mt-4 w-full">
            {connection.connected ? "Reconnect Gmail" : "Connect Gmail"}
          </PrimaryButton>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-slate-900">Fetch Records</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[160px_160px_160px_1fr]">
            <div>
              <label className={labelClass}>Days</label>
              <input
                type="number"
                min="0"
                max="365"
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className={selectClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="error">Needs Review</option>
                <option value="created">Created</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className={selectClass}
              >
                <option value="">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex items-end">
              <PrimaryButton
                onClick={fetchEmails}
                disabled={loading || !connection.connected}
                className="w-full"
              >
                {loading ? "Working..." : "Fetch Emails"}
              </PrimaryButton>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Use 0 for current day only. Larger values fetch that many previous days.</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card padded={false}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Drafts</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {drafts.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No email lead drafts found.</p>
            ) : drafts.map((draft) => (
              <button
                key={draft._id}
                onClick={() => openDraft(draft)}
                className="block w-full px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{draft.subject || "No subject"}</h3>
                  <Badge tone={priorityTone(draft.aiPriority)}>{draft.aiPriority}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{draft.from || "Unknown sender"}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">{draft.snippet || draft.bodyPreview || "No preview"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Status: {draft.status}</span>
                  <span>Confidence: {draft.aiConfidence}</span>
                  <span>Missing: {draft.missingFields?.length || 0}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          {!selectedDraft ? (
            <p className="text-sm text-slate-500">Select a draft to review and create an enquiry.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Review Draft</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedDraft.aiReason || "No AI reason provided."}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LeadField label="Company Name" value={formLead.LeadDetails.companyName} onChange={(value) => updateField("LeadDetails.companyName", value)} />
                <LeadField label="Contact Person" value={formLead.LeadDetails.clientName} onChange={(value) => updateField("LeadDetails.clientName", value)} />
                <LeadField label="Department" value={formLead.LeadDetails.Department} onChange={(value) => updateField("LeadDetails.Department", value)} />
                <LeadField label="Lead Medium" value={formLead.LeadDetails.LeadMedium} onChange={(value) => updateField("LeadDetails.LeadMedium", value)} />
                <div>
                  <label className={labelClass}>Lead Priority</label>
                  <select value={formLead.LeadDetails.LeadPriority} onChange={(event) => updateField("LeadDetails.LeadPriority", event.target.value)} className={selectClass}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Enquiry Type</label>
                  <select value={formLead.LeadDetails.EnquiryType} onChange={(event) => updateField("LeadDetails.EnquiryType", event.target.value)} className={selectClass}>
                    <option value="">Select</option>
                    <option value="Product">Product</option>
                    <option value="Project">Project</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Lead Condition</label>
                  <select value={formLead.LeadDetails.Leadcondition} onChange={(event) => updateField("LeadDetails.Leadcondition", event.target.value)} className={selectClass}>
                    <option value="new">New</option>
                    <option value="existing">Existing</option>
                  </select>
                </div>
                <LeadField label="Mobile Number" value={formLead.ContactDetails.MobileNumber} onChange={(value) => updateField("ContactDetails.MobileNumber", value)} />
                <LeadField label="Alternate Mobile" value={formLead.ContactDetails.AlternateMobileNumber} onChange={(value) => updateField("ContactDetails.AlternateMobileNumber", value)} />
                <LeadField label="Primary Mail" value={formLead.ContactDetails.PrimaryMail} onChange={(value) => updateField("ContactDetails.PrimaryMail", value)} />
                <LeadField label="Secondary Mail" value={formLead.ContactDetails.SecondaryMail} onChange={(value) => updateField("ContactDetails.SecondaryMail", value)} />
                <LeadField label="Address" value={formLead.AddressDetails.Address} onChange={(value) => updateField("AddressDetails.Address", value)} />
                <LeadField label="Country" value={formLead.AddressDetails.Country} onChange={(value) => updateField("AddressDetails.Country", value)} />
                <LeadField label="City" value={formLead.AddressDetails.City} onChange={(value) => updateField("AddressDetails.City", value)} />
                <LeadField label="Postal Code" value={formLead.AddressDetails.PostalCode} onChange={(value) => updateField("AddressDetails.PostalCode", value)} />
                <LeadField label="State" value={formLead.AddressDetails.State} onChange={(value) => updateField("AddressDetails.State", value)} />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formLead.DescriptionDetails}
                  onChange={(event) => setFormLead((previous) => ({ ...previous, DescriptionDetails: event.target.value }))}
                  className={`${selectClass} min-h-24`}
                />
              </div>

              <div>
                <label className={labelClass}>Sales Head</label>
                <select value={selectedEid} onChange={(event) => setSelectedEid(event.target.value)} className={selectClass}>
                  <option value="">Select Sales Head</option>
                  {salesHeads.map((head) => (
                    <option key={head.Eid} value={head.Eid}>{head.Eid} - {head.name}</option>
                  ))}
                </select>
              </div>

              {localMissingFields.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Missing: {localMissingFields.join(", ")}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <SecondaryButton onClick={saveDraft} disabled={loading}>Save Draft</SecondaryButton>
                <PrimaryButton onClick={createEnquiry} disabled={loading || selectedDraft.status === "created"}>Create Enquiry</PrimaryButton>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}

function LeadField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

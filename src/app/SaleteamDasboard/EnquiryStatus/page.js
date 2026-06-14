"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import { User, IdCard, Info, Tag } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  Field,
  Badge,
  LoadingBlock,
  ErrorBanner,
} from "../../_components/ui";

const EnquiryStatus = () => {
  const [enquiryData, setEnquiryData] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const searchParams = useSearchParams();
  const EnquiryNo = searchParams.get("EnquiryNo");

  useEffect(() => {
    if (!EnquiryNo) {
      setError("EnquiryNo is missing");
      return;
    }

    const fetchEnquiries = async () => {
      setError(null);
      try {
        const token = localStorage.getItem("admintokens");
        if (!token) {
          setError("Authorization token is missing");
          return;
        }

        const response = await axios.get(
          `http://localhost:5005/api/cc/Enquirystatus/${EnquiryNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.data) {
          setEnquiryData(response.data);
        } else {
          setError("No data available for this enquiry.");
        }
      } catch (err) {
        setError("Error fetching enquiry status");
        console.error("Error:", err);
      }
    };

    fetchEnquiries();
  }, [EnquiryNo]);

  const handleBackClick = () => {
    router.push("/SaleteamDasboard/Dasboard");
  };

  if (error)
    return (
      <PageShell>
        <ErrorBanner>{error}</ErrorBanner>
      </PageShell>
    );
  if (!enquiryData)
    return (
      <PageShell>
        <LoadingBlock label="Loading enquiry status…" />
      </PageShell>
    );

  const data = enquiryData.data;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Leads"
        title={`Enquiry Status for ${enquiryData.EnquiryNo}`}
        subtitle="Current status and details of this enquiry."
        onBack={handleBackClick}
      />

      {data ? (
        <Card className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source</p>
              <h2 className="text-base font-semibold text-slate-900">{enquiryData.source}</h2>
            </div>
            <Badge tone="blue">{data.Status || "N/A"}</Badge>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Status" icon={Tag}>{data.Status || "N/A"}</Field>
            <Field label="Client Name" icon={User}>{data.clientName || "N/A"}</Field>

            {data.DescriptionDetails && (
              <Field label="Additional Info" icon={Info}>{data.DescriptionDetails}</Field>
            )}

            {data.Convertedstatus && (
              <Field label="Converted Status" icon={Tag}>{data.Convertedstatus}</Field>
            )}

            <Field label="EID" icon={IdCard}>{data.Eid || "N/A"}</Field>
          </div>
        </Card>
      ) : (
        <Card className="mx-auto max-w-3xl text-center text-slate-600">
          <p>No data available for this enquiry.</p>
        </Card>
      )}
    </PageShell>
  );
};

export default EnquiryStatus;

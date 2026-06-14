"use client";
import { useRef, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Head from "next/head";
import { Download } from "lucide-react";
import { PageHeader, PrimaryButton, LoadingBlock, ErrorBanner } from "../../_components/ui";

export default function Poppdf() {
  const contentRef = useRef(null);
  const searchParams = useSearchParams();
  const Eid = searchParams.get("Eid");

  const [getdata, setGetdata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfReady, setPdfReady] = useState(false);
  const router = useRouter();

  // Load html2pdf script
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => setPdfReady(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // Fetch PO data (most recent PO for this Eid)
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("admintokens");
      if (!token || !Eid) return;

      try {
        const poRes = await axios.get(
          `http://localhost:5005/api-purchaseorder/POGetOne/${Eid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGetdata(poRes.data || null);
      } catch (err) {
        console.error("Error fetching data", err);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [Eid]);

  const formatCurrency = (amount) => {
    const n = Number(amount);
    if (isNaN(n)) return "₹ 0.00";
    return "₹ " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const pdfOptions = () => ({
    margin: [5, 5, 5, 5],
    filename: `PurchaseOrder_${(getdata?.poNumber || "PO").replace(/\//g, "_")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
    // Keep boxes/sections and table rows whole across page breaks.
    pagebreak: { mode: ["css", "legacy"], avoid: [".avoid-break", "tr", "thead", "img"] },
  });

  const generatePDF = () => {
    if (!pdfReady || !window.html2pdf) {
      alert("PDF library not ready yet. Please try again in a few seconds.");
      return;
    }
    if (!contentRef.current) {
      alert("PDF content is not ready.");
      return;
    }
    setTimeout(() => {
      window.html2pdf().from(contentRef.current).set(pdfOptions()).save();
    }, 100);
  };

  if (loading) return <LoadingBlock label="Loading…" />;
  if (error) return <ErrorBanner>{error}</ErrorBanner>;

  return (
    <div>
      <Head>
        <title>Purchase Order - {getdata?.poNumber || ""}</title>
        <meta name="description" content="Purchase Order PDF Generator" />
        <style>
          {`
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @page { size: A4; margin: 0; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          table, tr, td, th, thead, tbody, tfoot {
            page-break-inside: avoid; break-inside: avoid;
          }
          thead { display: table-header-group; }
          `}
        </style>
      </Head>

      <main className="p-4 max-w-5xl mx-auto">
        <PageHeader
          eyebrow="Procurement"
          title="Purchase Order"
          subtitle="Preview and download the purchase order."
          onBack={() => router.push("/SaleteamDasboard/Inventory")}
          actions={
            <PrimaryButton onClick={generatePDF}>
              <Download size={16} />
              Generate PDF
            </PrimaryButton>
          }
        />

        {/* ===== PDF Content ===== */}
        <div ref={contentRef} className="mt-6 bg-white" style={{ maxWidth: "210mm", margin: "0 auto" }}>
          {/* Letterhead */}
          <div className="px-6 pt-6 pb-2 avoid-break">
            <div className="flex items-center gap-4">
              <img src="/logo123.png" alt="Loyalty Automation Logo" className="h-14 w-auto object-contain" />
              <div className="leading-tight">
                <h1 className="text-2xl font-extrabold text-red-600 tracking-wide">LOYALTY AUTOMATION PVT.LTD.</h1>
                <p className="text-xs font-semibold text-blue-800">
                  No. 27/1, Vaigai Colony 2nd Street, 12th Avenue Ashok Nagar, Ch-83.
                </p>
                <p className="text-xs font-semibold text-blue-800">
                  Ph: 044 43838063, 9551687011 &nbsp; Mail id: loyaltyautomation@gmail.com
                </p>
              </div>
            </div>
            <p className="text-red-600 font-bold text-sm mt-1">GST:33AACCL4592K1ZA</p>
          </div>

          {/* Title */}
          <div className="text-center py-3 avoid-break">
            <h2 className="text-2xl font-bold tracking-wide text-gray-900">PURCHASE ORDER</h2>
          </div>

          {/* PO No / Date */}
          <div className="flex justify-between items-center px-6 py-2 bg-gray-100 border-y border-gray-300 text-sm avoid-break">
            <span><span className="font-bold">PO No:</span> {getdata?.poNumber || "N/A"}</span>
            <span><span className="font-bold">PO Date:</span> {formatDate(getdata?.createdAt)}</span>
          </div>

          {/* Supplier */}
          <div className="flex bg-indigo-50 border-b border-gray-300 avoid-break">
            <div className="w-1/2 px-4 py-3">
              <p className="text-xs font-bold text-gray-600 uppercase mb-1">Supplier</p>
              <p className="text-lg font-bold text-blue-900">{getdata?.SupplierName || "N/A"}</p>
              {getdata?.SuppNO && (
                <p className="text-sm text-gray-700 mt-1">Contact: {getdata.SuppNO}</p>
              )}
            </div>
            <div className="w-1/2 px-4 py-3 text-sm text-gray-800">
              <p>{getdata?.Address || ""}</p>
              {getdata?.GSTIN && (
                <p className="font-bold text-gray-900 mt-2">GSTIN: {getdata.GSTIN}</p>
              )}
              {getdata?.RefQNo && (
                <p className="mt-2">Ref Q.No: {getdata.RefQNo}{getdata?.QDate ? ` (${formatDate(getdata.QDate)})` : ""}</p>
              )}
            </div>
          </div>

          {/* Bill To / Ship To */}
          <div className="flex border-b border-gray-300 avoid-break">
            <div className="w-1/2 border-r border-gray-300">
              <div className="font-bold text-blue-900 px-4 pt-3 text-sm">BILL TO</div>
              <div className="px-4 pb-3 pt-1 text-sm text-gray-800">
                <p className="font-bold">Loyalty Automation Pvt Ltd</p>
                <p>277/-G FLOOR, VAIGAI COLONY 2nd CROSS ST,</p>
                <p>12th Avenue, Ashok Nagar, Chennai.,</p>
                <p>Tamil Nadu, 600083,</p>
                <p>India</p>
                <p className="font-bold mt-1">GSTIN: 33AACCL4592K1ZA</p>
              </div>
            </div>
            <div className="w-1/2">
              <div className="font-bold text-blue-900 px-4 pt-3 text-sm">SHIP TO</div>
              <div className="px-4 pb-3 pt-1 text-sm text-gray-800">
                <p className="font-bold">Loyalty Automation Pvt Ltd</p>
                <p>277/-G FLOOR, VAIGAI COLONY 2nd CROSS ST,</p>
                <p>12th Avenue, Ashok Nagar, Chennai.,</p>
                <p>Tamil Nadu, 600083,</p>
                <p>India</p>
                <p className="font-bold mt-1">GSTIN: 33AACCL4592K1ZA</p>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="px-6 py-4">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="border border-gray-400 px-2 py-2 text-center font-bold w-12">No.</th>
                  <th className="border border-gray-400 px-2 py-2 text-left font-bold">Description</th>
                  <th className="border border-gray-400 px-2 py-2 text-center font-bold">HSN/SAC</th>
                  <th className="border border-gray-400 px-2 py-2 text-center font-bold">Quantity</th>
                  <th className="border border-gray-400 px-2 py-2 text-right font-bold">Unit Price</th>
                  <th className="border border-gray-400 px-2 py-2 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {getdata?.rows?.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-2 py-2 text-center align-top">{index + 1}</td>
                    <td className="border border-gray-400 px-2 py-2 align-top">
                      <p className="font-bold text-blue-900">{item?.unitDescription}</p>
                      {item?.Description && <p className="text-gray-600">{item.Description}</p>}
                    </td>
                    <td className="border border-gray-400 px-2 py-2 text-center align-top">{item?.hsnCode}</td>
                    <td className="border border-gray-400 px-2 py-2 text-center align-top">
                      {item?.quantity} {item?.uom}
                    </td>
                    <td className="border border-gray-400 px-2 py-2 text-right align-top">{formatCurrency(item?.unitPrice)}</td>
                    <td className="border border-gray-400 px-2 py-2 text-right align-top">{formatCurrency(item?.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="avoid-break">
                  <td colSpan="5" className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-700">Sub Total</td>
                  <td className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-700">{formatCurrency(getdata?.totalAmount)}</td>
                </tr>
                <tr className="avoid-break">
                  <td colSpan="5" className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-700">
                    GST @ {getdata?.gst ?? 18}%
                  </td>
                  <td className="border border-gray-400 px-2 py-2 text-right font-semibold text-gray-700">{formatCurrency(getdata?.gstAmount)}</td>
                </tr>
                <tr className="avoid-break">
                  <td colSpan="5" className="border border-gray-400 px-2 py-3 text-right text-lg font-bold text-gray-900">TOTAL:</td>
                  <td className="border border-gray-400 px-2 py-3 text-right text-lg font-bold text-gray-900">{formatCurrency(getdata?.payableAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms & Signatory */}
          <div className="flex justify-between items-start px-6 pt-2 pb-6 avoid-break">
            <div className="w-1/2 text-sm">
              <p className="font-bold text-gray-900 mb-2">Terms &amp; Conditions:</p>
              <p className="mb-1"><span className="font-bold">Delivery:</span> {getdata?.deliveryTerms || "N/A"}</p>
              <p className="mb-1"><span className="font-bold">Payment:</span> {getdata?.paymentTerms || "N/A"}</p>
              <p className="mb-1"><span className="font-bold">Warranty:</span> {getdata?.warrantyTerms || "N/A"}</p>
            </div>
            <div className="w-1/2 flex flex-col items-end text-right">
              <p className="font-bold text-gray-900">FOR LOYALTY AUTOMATION PVT.LTD.</p>
              <img src="/LoyaltySeal.jpeg" alt="Company Seal" className="h-24 w-24 object-contain my-1" />
              <p className="font-bold text-gray-900">Authorised Signatory</p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 pb-6 text-center text-xs text-gray-600 avoid-break">
            <p>
              Contact No: 044 43838063, +91 9840129532 &nbsp; Email: info@loyaltyautomation.com, loyaltyautomation@gmail.com
            </p>
            <p>
              loyaltyapisales21@gmail.com, loyaltyautomation@gmail.com &nbsp; Website: www.loyaltyautomation.com
            </p>
            <p>Regd Office: No. 27/1, Vaigai Colony 2nd Street, 12th Avenue Ashok Nagar, Chennai - 600 083</p>
            <p className="font-bold text-gray-800 mt-1">GSTIN: 33AACCL4592K1ZA</p>
            <div className="flex justify-center items-center gap-8 mt-4">
              <img src="/deltas.jpg" alt="Delta" className="h-8 object-contain" />
              <img src="/Schneider.png" alt="Schneider" className="h-8 object-contain" />
              <img src="/phoenix.png" alt="Phoenix" className="h-8 object-contain" />
              <img src="/motovario.png" alt="Motovario" className="h-8 object-contain" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

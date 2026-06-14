"use client";
import { useRef, useEffect, useState } from "react";
import Head from "next/head";
import { useSearchParams,useRouter } from "next/navigation";
import axios from "axios";
import { Mail, Download } from "lucide-react";
import { PageHeader, PrimaryButton, SecondaryButton } from "../../_components/ui";

export default function Home() {
  const contentRef = useRef(null);
  const search = useSearchParams();
  const EnquiryNo = search.get("EnquiryNo");
  const Eid = search.get("Eid");
  const [getdata, setGetdata] = useState(null);
  const [getcustomerdata, setGetcustomerdata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Email-PDF modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // { type: 'success' | 'error', message }

  const token = localStorage.getItem("admintokens");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => console.log("html2pdf loaded");
      document.body.appendChild(script);
      return () => document.body.removeChild(script);
    }
  }, []);

  useEffect(() => {
    if (EnquiryNo && Eid) {
      
      getcustomerdetails();
    }
  }, [EnquiryNo, Eid]);

  const getcustomerdetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5005/api/getoneenquiries/${EnquiryNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setGetcustomerdata(response.data);
        const primaryMail = response.data?.ContactDetails?.PrimaryMail;
        if (primaryMail) setRecipientEmail(primaryMail);
      }
    } catch (err) {
      console.error("Error getting customer details:", err);
      setError("Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let dataFromAPI2 = null;  // Try to fetch from the Edit API first
        let dataFromAPI1 = null;  // Fallback to the Get API if needed
  
        // Try fetching data from the quotationEditOne API first
        try {
          const response2 = await axios.get(
            `http://localhost:5005/api/quotationEditOne/${EnquiryNo}/${Eid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response2.data?.data?.Status === "Editaccess") {
            dataFromAPI2 = response2.data.data;  // If valid data exists, use this
          }
        } catch (error) {
          console.log("Error fetching from quotationEditOne:", error.message);
        }
  
        // If no data from the Edit API, fallback to fetching from the quotationGetOne API
        if (!dataFromAPI2) {
          try {
            const response1 = await axios.get(
              `http://localhost:5005/api/quotationGetOne/${EnquiryNo}/${Eid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response1.data?.data?.Status === "quotsaccess") {
              dataFromAPI1 = response1.data.data;  // Use data from the Get API if valid
            }
          } catch (error) {
            console.log("Error fetching from quotationGetOne:", error.message);
          }
        }
  
        // If no data is found from the above APIs, fallback to fetching from quotationLatestOne
        if (!dataFromAPI2 && !dataFromAPI1) {
          try {
            const response3 = await axios.get(
              `http://localhost:5005/api/quotationLatestOne/${EnquiryNo}/${Eid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response3.data?.data) {
              dataFromAPI1 = response3.data.data;  // Fallback to latest quotation data
            } else {
              setError("No valid data found in the latest quotation.");
            }
          } catch (error) {
            console.log("Error fetching from quotationLatestOne:", error.message);
            setError("Failed to load latest quotation data.");
          }
        }
  
        // Combine data or fallback if none is found
        const loadedData = dataFromAPI2 || dataFromAPI1;
        if (loadedData) {
          setGetdata({
            ...loadedData,
            products: loadedData.products || [],
          });
        } else {
          setError("No data available from all APIs.");
        }
      } catch (error) {
        console.error("Fetching error:", error.message);
        setError("Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData(); // Trigger the data fetching process
  }, [EnquiryNo, Eid, token]);
  

  const pdfFileName = `commercial_offer_${EnquiryNo}.pdf`;

  const pdfOptions = () => ({
    margin: [5, 5, 5, 5], // Reduced margins
    filename: pdfFileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, logging: true, useCORS: true }, // Reduced scale for better fit
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    },
    // Prevent boxes/sections and table rows from being split across pages.
    // `avoid-all` keeps every block intact; `.avoid-break` and `tr` are
    // pushed to the next page whole instead of being sliced mid-element.
    pagebreak: { mode: ["css", "legacy"], avoid: [".avoid-break", "tr", "thead", "img"] },
  });

  const generatePDF = () => {
    const element = contentRef.current;
    if (window.html2pdf) {
      window.html2pdf().from(element).set(pdfOptions()).save();
    } else {
      alert("PDF library not loaded yet. Please try again.");
    }
  };

  // Render the on-screen commercial offer to a PDF Blob (same content the
  // user sees / downloads) so it can be attached to an email.
  const generatePDFBlob = async () => {
    const element = contentRef.current;
    if (!window.html2pdf) {
      throw new Error("PDF library not loaded yet. Please try again.");
    }
    return window.html2pdf().from(element).set(pdfOptions()).outputPdf("blob");
  };

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());

  const handleSendEmail = async () => {
    setEmailStatus(null);

    if (!validateEmail(recipientEmail)) {
      setEmailStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setSendingEmail(true);
    try {
      const blob = await generatePDFBlob();

      const formData = new FormData();
      formData.append("pdf", blob, pdfFileName);
      formData.append("email", recipientEmail.trim());
      formData.append("referenceNumber", getdata?.ReferenceNumber || "");
      formData.append("enquiryNo", EnquiryNo || "");

      const response = await axios.post(
        "http://localhost:5005/api-quotation/send-pdf",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setEmailStatus({
        type: "success",
        message: response.data?.message || `Commercial offer sent to ${recipientEmail.trim()}.`,
      });
    } catch (err) {
      console.error("Error emailing PDF:", err);
      setEmailStatus({
        type: "error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to send the commercial offer. Please try again.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateTotal = () => {
    if (!getdata?.products) return 0;
    return getdata.products.reduce((sum, item) => sum + (parseFloat(item.Total) || 0), 0);
  };

  // Format currency to Indian Rupees
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount).replace(/^(\D+)/, "₹ ");
  };

  const freightCharges = () => parseFloat(getdata?.Freight || 0) || 0;
  const subtotalWithFreight = () => calculateTotal() + freightCharges();
  const gstAmount = () => subtotalWithFreight() * (parseFloat(getdata?.Gst || 18) / 100);
  const finalTotal = () => subtotalWithFreight() + gstAmount();

  // Convert an amount to Indian-style words (e.g. "Sixteen Thousand ... Rupees")
  const numberToWords = (amount) => {
    const n = Math.round(amount || 0);
    if (n === 0) return "Zero Rupees";
    const ones = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
      "Eighteen", "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const twoDigits = (x) =>
      x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? " " + ones[x % 10] : ""}`;
    const threeDigits = (x) => {
      const h = Math.floor(x / 100);
      const rest = x % 100;
      return `${h ? ones[h] + " Hundred" + (rest ? " " : "") : ""}${rest ? twoDigits(rest) : ""}`;
    };
    let result = "";
    const crore = Math.floor(n / 10000000);
    let rem = n % 10000000;
    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;
    const thousand = Math.floor(rem / 1000);
    const hundred = rem % 1000;
    if (crore) result += `${threeDigits(crore)} Crore `;
    if (lakh) result += `${twoDigits(lakh)} Lakh `;
    if (thousand) result += `${twoDigits(thousand)} Thousand `;
    if (hundred) result += `${threeDigits(hundred)} `;
    return `${result.trim()} Rupees`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Commercial Offer | Loyalty Automation</title>
        <meta name="description" content="Generate modern commercial offer PDF" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>
          {`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          @page {
            size: A4;
            margin: 0;
          }
          .page-break {
            page-break-after: always;
          }
          /* Keep boxes/sections and table rows whole across PDF page breaks */
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          table, tr, td, th, thead, tbody, tfoot {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-row-group;
          }
          body {
            font-family: 'Inter', sans-serif;
          }`}
        </style>
      </Head>

      <main className="container mx-auto py-6 px-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded shadow-md">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-600 font-medium">Loading your data...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <PageHeader
              eyebrow="Sales"
              title="Commercial Offer Generator"
              subtitle="Preview, download, or email the commercial offer."
              onBack={() => router.push("/SaleteamDasboard/Dasboard")}
              actions={
                <>
                  <SecondaryButton
                    onClick={() => {
                      setEmailStatus(null);
                      setEmailModalOpen(true);
                    }}
                    disabled={loading}
                  >
                    <Mail size={16} />
                    Email PDF
                  </SecondaryButton>
                  <PrimaryButton onClick={generatePDF} disabled={loading}>
                    <Download size={16} />
                    Download PDF
                  </PrimaryButton>
                </>
              }
            />

  
          {/* PDF Content */}
          <div ref={contentRef} className="bg-white shadow-2xl rounded-xl overflow-hidden" style={{ maxWidth: "210mm", margin: "0 auto" }}>
            {/* Company Letterhead Header */}
            <div className="px-8 pt-8 pb-2">
              <div className="flex items-center gap-5">
                <img
                  src="/logo123.png"
                  alt="Loyalty Automation Logo"
                  className="h-16 w-auto object-contain"
                />
                <div className="leading-tight">
                  <h1 className="text-2xl font-extrabold text-red-600 tracking-wide">
                    LOYALTY AUTOMATION PVT.LTD.
                  </h1>
                  <p className="text-sm font-semibold text-blue-800">
                    No. 27/1, Vaigai Colony 2nd Street, 12th Avenue Ashok Nagar, Ch-83.
                  </p>
                  <p className="text-sm font-semibold text-blue-800">
                    Ph: 044 43838063, 9551687011 &nbsp; Mail id: loyaltyautomation@gmail.com
                  </p>
                </div>
              </div>
            </div>

            <p className="text-red-600 font-bold ml-10">GST: 33AACCL4592K1ZA</p>

  
            {/* Main Content */}
            <div className="p-8">
              {/* Client & Company Info */}
              <div className="flex justify-between mb-10">
                {/* Quote To */}
               
  
                {/* Company Info */}
               
              </div>

              {/* Introduction */}
              <div className="mb-10">
                <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center border-b pb-2 border-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  INTRODUCTION
                </h2>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 avoid-break">
                  <p className="text-gray-700 leading-relaxed">
                    We acknowledge with thanks for receipt of your enquiry. The industry is right on the threshold
                    of the fourth industrial revolution. Automation is being followed by the digitalization of production.
                  </p>
                  <p className="my-4">
                    <span className="font-medium text-blue-700">The Goal:</span> An increase of productivity, efficiency, speed, and quality,
                    resulting in higher competitiveness for companies on their way to the future of industry.
                  </p>
                  <p className="mb-4 text-gray-700">
                    Here you will find Loyalty Automation System comprehensive offering for
                    automation technology and the digitalization of production.
                  </p>
                  <p className="text-gray-700">
                    Loyalty Automation is at the forefront of Automation. We strive to develop innovative and reliable products
                    to meet the needs of our customers in every manufacturing industry.
                  </p>
                </div>
              </div>
  
              {/* Our Products */}
              <div className="mb-10">
                <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                  
                  OUR PRODUCTS & SERVICES
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 avoid-break">
                    <div className="flex items-start mb-2">
                    
                      <div>
                        <p className="font-bold text-blue-800">Service Center</p>
                        <p className="text-gray-700 mt-1 text-sm">All Brands Service</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 avoid-break">
                    <div className="flex items-start mb-2">
                     
                      <div>
                        <p className="font-bold text-blue-800">Control Panels</p>
                        <p className="text-gray-700 mt-1 text-sm">Custom design</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 avoid-break">
                    <div className="flex items-start mb-2">
                     
                      <div>
                        <p className="font-bold text-blue-800">Retrofitting</p>
                        <p className="text-gray-700 mt-1 text-sm">Modernization</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300 avoid-break">
                    <div className="flex items-start mb-2">
                    
                      <div>
                        <p className="font-bold text-blue-800">DC Drive & RTD</p>
                        <p className="text-gray-700 mt-1 text-sm">Custom solutions</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Partner Logos */}
              <div className="mb-10">
                <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                 
                  CHANNEL PARTNERS
                </h2>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 avoid-break">
                  <div className="flex justify-between items-center flex-wrap">
                    <div className="w-1/4 p-4">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow h-20 flex items-center justify-center">
                        <img src="/deltas.jpg" alt="Delta" className="mx-auto h-12 object-contain" />
                      </div>
                    </div>
                    <div className="w-1/4 p-4">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow h-20 flex items-center justify-center">
                        <img src="/Schneider.png" alt="Schneider" className="mx-auto h-12 object-contain" />
                      </div>
                    </div>
                    <div className="w-1/4 p-4">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow h-20 flex items-center justify-center">
                        <img src="/phoenix.png" alt="Phoenix" className="mx-auto h-12 object-contain" />
                      </div>
                    </div>
                    <div className="w-1/4 p-4">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow h-20 flex items-center justify-center">
                        <img src="/motovario.png" alt="Motovario" className="mx-auto h-12 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  

{/* Reference Number & Date */}
<div className="bg-gray-50 px-8 py-4 border-b border-gray-100 shadow-sm mb-4 avoid-break">
              <div className="flex justify-between items-center">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-64">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Reference Number</span>
                  
                  <p className="font-bold text-gray-800 mt-1">{getdata?.ReferenceNumber || "N/A"}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-64 text-right">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Date</span>
                  <p className="font-bold text-gray-800 mt-1">{getdata?.createdAt ? formatDate(getdata.createdAt) : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="w-1/2 pr-6">
                  <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                   
                    QUOTE TO
                  </h2>
                  {getcustomerdata && getcustomerdata.LeadDetails ? (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-600 shadow-sm avoid-break">
                      <p className="font-bold text-gray-800">{getcustomerdata.LeadDetails.companyName}</p>
                      {getcustomerdata.AddressDetails && (
                        <div className="text-gray-600 mt-2">
                          <p>{getcustomerdata.AddressDetails.Address},</p>
                          <p>{getcustomerdata.AddressDetails.City}-{getcustomerdata.AddressDetails.PostalCode},</p>
                          <p>{getcustomerdata.AddressDetails.State}.</p>
                          <div className="mt-3 flex items-center">
                            <span className="font-semibold text-blue-700">Attn:</span> 
                            <span className="ml-2">{getcustomerdata.LeadDetails.clientName || "N/A"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
                  )}
                </div>

              {/* Products Table */}
              <div className="mb-10">
              <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200 mt-4">COMMERCIAL OFFER</h2>

                <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200">
                  <table className="w-full border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <th className="py-3 px-4 text-center border-2 border-black font-semibold">S.No</th>
                        <th className="py-3 px-4 text-left border-2 border-black font-semibold">Description</th>
                        <th className="py-3 px-4 text-center border-2 border-black font-semibold">Quantity</th>
                        <th className="py-3 px-4 text-center border-2 border-black font-semibold">HSN Code</th>
                        <th className="py-3 px-4 text-right border-2 border-black font-semibold">Rate</th>
                        <th className="py-3 px-4 text-right border-2 border-black font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getdata?.products?.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-3 px-4 border-2 border-black text-center text-gray-800">{index + 1}</td>
                          <td className="py-3 px-4 border-2 border-black text-left text-gray-800">
                            <p><b>{item?.UnitDescription}</b><br/>{item?.Description}</p>
                          </td>
                          <td className="py-3 px-4 border-2 border-black text-center text-gray-800">
                            {item?.Quantity || "0"} {item?.UOM || ""}
                          </td>
                          <td className="py-3 px-4 border-2 border-black text-center text-gray-800">{item?.HSNCode || "N/A"}</td>
                          <td className="py-3 px-4 border-2 border-black text-right text-gray-800">
                            {item?.UnitPrice ? formatCurrency(parseFloat(item.UnitPrice)) : "₹ 0.00"}
                          </td>
                          <td className="py-3 px-4 border-2 border-black text-right text-gray-800">
                            {item?.Total ? formatCurrency(parseFloat(item.Total)) : "₹ 0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-2 border-black bg-gray-50">
                        <td colSpan="5" className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">Sub Total</td>
                        <td className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">
                          {formatCurrency(calculateTotal())}
                        </td>
                      </tr>
                      {freightCharges() > 0 && (
                        <tr className="border-2 border-black bg-gray-50">
                          <td colSpan="5" className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">Freight Charges</td>
                          <td className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">
                            {formatCurrency(freightCharges())}
                          </td>
                        </tr>
                      )}
                      <tr className="border-2 border-black bg-gray-50">
                        <td colSpan="5" className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">
                          GST @ {getdata?.Gst || "18"}%
                        </td>
                        <td className="py-2 px-4 text-right font-bold text-gray-700 border-2 border-black">
                          {formatCurrency(gstAmount())}
                        </td>
                      </tr>
                      <tr className="border-2 border-black bg-gradient-to-r from-blue-50 to-indigo-50">
                        <td colSpan="5" className="py-3 px-4 text-right font-bold text-gray-800 border-2 border-black">Final Total</td>
                        <td className="py-3 px-4 text-right font-bold text-blue-700 border-2 border-black">
                          {formatCurrency(finalTotal())}
                        </td>
                      </tr>
                      <tr className="border-2 border-black bg-white">
                        <td colSpan="6" className="py-2 px-4 text-left text-gray-800 border-2 border-black">
                          <span className="font-semibold">Final Total in Words:</span> {numberToWords(finalTotal())}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
  
                {/* Terms & Conditions + Bank Details */}
                <div className="mb-4 text-s avoid-break">
                  <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">TERMS &amp; CONDITIONS</h2>
                  <div className="flex flex-wrap -mx-2 items-start avoid-break">
                    <div className="w-1/2 px-2 mb-4">
                      <div className="p-5 bg-gray-50 rounded-xl avoid-break">
                        <p className="mb-3"><span className="font-bold text-gray-900">Payment:</span> {getdata?.Paymentdue || "N/A"}</p>
                        <p className="mb-3"><span className="font-bold text-gray-900">Validity:</span> {getdata?.validity || "N/A"}</p>
                        <p className="mb-3"><span className="font-bold text-gray-900">Warranty:</span> {getdata?.Warranty || "N/A"}</p>
                        <p className="mb-3"><span className="font-bold text-gray-900">Delivery:</span> {getdata?.Delivery || "N/A"}</p>
                      </div>
                    </div>
                    <div className="w-1/2 px-2 mb-4">
                      {/* Bank Details */}
                      <div className="p-5 bg-blue-100 rounded-xl border-2 border-black avoid-break">
                        <p className="font-bold text-gray-900 text-center text-lg pb-2 mb-3 border-b border-gray-400">Bank Details :</p>
                        <p className="mb-2 font-bold text-gray-900">Company Name : LOYALTY AUTOMATION PVT LTD.</p>
                        <p className="mb-2 font-bold text-gray-900">Bank Name : PUNJAB NATIONAL BANK</p>
                        <p className="mb-2 font-bold text-gray-900">Branch : NANDANAM</p>
                        <p className="mb-2 font-bold text-gray-900">Account No : 4389002100015380</p>
                        <p className="mb-2 font-bold text-gray-900">RTGS/NEFT IFSC : PUNB0438900</p>
                        <p className="mb-2 font-bold text-gray-900">Type of Account : CURRENT</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Closing */}
                <div className="mb-8 text-center text-xs">
                  <p className="text-lg font-medium text-blue-600">We look forward to the pleasure of receiving your valued order</p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600 avoid-break">
                  <p>
                    Contact No: 044 43838063, +91 9840129532 &nbsp; Email: info@loyaltyautomation.com, loyaltyautomation@gmail.com
                  </p>
                  <p>
                    loyaltyapisales21@gmail.com, loyaltyautomation@gmail.com &nbsp; Website: www.loyaltyautomation.com
                  </p>
                  <p>
                    Regd Office: No. 27/1, Vaigai Colony 2nd Street, 12th Avenue Ashok Nagar, Chennai - 600 083
                  </p>
                  <p className="font-bold text-gray-800 mt-1">GSTIN: 33AACCL4592K1ZA</p>
                  <div className="flex justify-center items-center gap-8 mt-4">
                    <img src="/deltas.jpg" alt="Delta" className="h-8 object-contain" />
                    <img src="/Schneider.png" alt="Schneider" className="h-8 object-contain" />
                    <img src="/phoenix.png" alt="Phoenix" className="h-8 object-contain" />
                    <img src="/motovario.png" alt="Motovario" className="h-8 object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Email PDF Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Email Commercial Offer</h2>
              </div>
              <button
                onClick={() => setEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={sendingEmail}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              The commercial offer PDF{getdata?.ReferenceNumber ? ` (${getdata.ReferenceNumber})` : ""} will be sent as an attachment to the address below.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
              disabled={sendingEmail}
            />

            {emailStatus && (
              <div
                className={`mb-3 p-3 rounded-lg text-sm ${
                  emailStatus.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                }`}
              >
                {emailStatus.message}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                disabled={sendingEmail}
              >
                {emailStatus?.type === "success" ? "Close" : "Cancel"}
              </button>
              <button
                onClick={handleSendEmail}
                className={`px-5 py-2.5 rounded-lg text-white flex items-center gap-2 transition-all ${
                  sendingEmail
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg"
                }`}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </>
                ) : (
                  "Send Email"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
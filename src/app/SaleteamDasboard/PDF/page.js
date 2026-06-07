"use client";
import { useRef, useEffect, useState } from "react";
import Head from "next/head";
import { useSearchParams,useRouter } from "next/navigation";
import axios from "axios";

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
  

  const generatePDF = () => {
    const element = contentRef.current;
    const opt = {
      margin: [5, 5, 5, 5], // Reduced margins
      filename: `commercial_offer_${EnquiryNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, logging: true }, // Reduced scale for better fit
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      },
    };

    if (window.html2pdf) {
      window.html2pdf().from(element).set(opt).save();
    } else {
      alert("PDF library not loaded yet. Please try again.");
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <Head>
        <title>Commercial Offer | SK Sales</title>
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
            <div className="flex justify-between items-center mb-6">
            <button
          onClick={() => router.push("/SaleteamDasboard/Dasboard")}
          className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
              <h1 className="text-2xl font-bold text-gray-800">Commercial Offer Generator</h1>
              <button
                onClick={generatePDF}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow hover:shadow-lg transition-all duration-300 flex items-center"
                disabled={loading}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
            </div>

  
          {/* PDF Content */}
          <div ref={contentRef} className="bg-white shadow-2xl rounded-xl overflow-hidden" style={{ maxWidth: "210mm", margin: "0 auto" }}>
            {/* Header Section with modern gradient */}
            <div className="relative">
              <div className="relative py-12 px-8">

                <div className="flex justify-between items-center">
                  <div className="text-white">
                 
                  </div>
                  <div>
                  <img 
  src="/p4.jpeg" 
  alt="SK Sales Logo" 
  className="w-full h-auto object-contain"
/>

                  </div>
                </div>
                
                {/* Abstract design elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-20 -mb-20"></div>
              </div>
            </div>
  
            <p className="text-red-600 font-bold  ml-10">GST No: 27AAECL1234F1ZV</p>

  
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
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <p className="text-gray-700 leading-relaxed">
                    We acknowledge with thanks for receipt of your enquiry. The industry is right on the threshold
                    of the fourth industrial revolution. Automation is being followed by the digitalization of production.
                  </p>
                  <p className="my-4">
                    <span className="font-medium text-blue-700">The Goal:</span> An increase of productivity, efficiency, speed, and quality,
                    resulting in higher competitiveness for companies on their way to the future of industry.
                  </p>
                  <p className="mb-4 text-gray-700">
                    Here you will find SK Sales comprehensive offering for
                    automation technology and the digitalization of production.
                  </p>
                  <p className="text-gray-700">
                    SK Sales is at the forefront of Automation. We strive to develop innovative and reliable products
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
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
                    <div className="flex items-start mb-2">
                    
                      <div>
                        <p className="font-bold text-blue-800">Service Center</p>
                        <p className="text-gray-700 mt-1 text-sm">All Brands Service</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
                    <div className="flex items-start mb-2">
                     
                      <div>
                        <p className="font-bold text-blue-800">Control Panels</p>
                        <p className="text-gray-700 mt-1 text-sm">Custom design</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
                    <div className="flex items-start mb-2">
                     
                      <div>
                        <p className="font-bold text-blue-800">Retrofitting</p>
                        <p className="text-gray-700 mt-1 text-sm">Modernization</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-md border border-blue-100 hover:shadow-lg transition-shadow transform hover:-translate-y-1 duration-300">
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
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
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
<div className="bg-gray-50 px-8 py-4 border-b border-gray-100 shadow-sm mb-4">
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
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-600 shadow-sm">
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
              <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200 mt-4">QUOTATION DETAILS</h2>

                <div className="overflow-hidden rounded-xl shadow-lg border border-gray-200">
                  <table className="w-full border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                        <th className="py-3 px-4 text-left border-2 border-black font-semibold">S.No</th>
                        <th className="py-3 px-4 text-left border-2 border-black font-semibold">HSN</th>
                        <th className="py-3 px-4 text-left border-2 border-black font-semibold">Description</th>
                        <th className="py-3 px-4 text-center border-2 border-black font-semibold">UOM</th>
                        <th className="py-3 px-4 text-center border-2 border-black font-semibold">Qty</th>
                        <th className="py-3 px-4 border-2 border-black font-semibold">Unit Price</th>
                        <th className="py-3 px-4 border-2 border-black font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getdata?.products?.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-3 px-4 border-2 border-black text-left text-gray-800">{index + 1}</td>
                          <td className="py-3 px-4 border-2 border-black text-left text-gray-800">{item?.HSNCode || "N/A"}</td>
                          <td className="py-3 px-4 border-2 border-black text-left text-gray-800"><p><b>{item?.UnitDescription}</b><br/> {item?.Description}</p></td>
                          <td className="py-3 px-4 border-2 border-black text-center text-gray-800">{item?.UOM || "N/A"}</td>
                          <td className="py-3 px-4 border-2 border-black text-center text-gray-800">{item?.Quantity || "0"}</td>
                          <td className="py-3 border-2 border-black text-gray-800 w-[100px]">
                            {item?.UnitPrice ? formatCurrency(parseFloat(item.UnitPrice)) : "₹ 0.00"}
                          </td>
                          <td className="py-3 border-2 border-black px-2 w-[100px] text-gray-800">
                            {item?.Total ? formatCurrency(parseFloat(item.Total)) : "₹ 0.00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan="6" className="py-3 px-4 text-right font-bold text-gray-700">Subtotal:</td>
                        <td className="py-3 px-4 w-[120px] font-bold text-gray-700">
                          {formatCurrency(calculateTotal())}
                        </td>
                      </tr>



                      
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan="6" className="py-3 px-4 text-right font-bold text-gray-700">
                          GST @ {getdata?.Gst || "18"}%:
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-700">
                          {formatCurrency(calculateTotal() * (parseFloat(getdata?.Gst || 18) / 100))}
                        </td>
                      </tr>
                      <tr className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <td colSpan="6" className="py-4 px-4 text-right font-bold text-gray-800">TOTAL AMOUNT:</td>
                        <td className="py-4 px-4 text-right font-bold text-blue-700">
                          {formatCurrency(calculateTotal() * (1 + parseFloat(getdata?.Gst || 18) / 100))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
  
                {/* Terms & Conditions - More compact */}
                <div className="mb-4 text-s">
                  <h2 className="text-base font-bold text-gray-700 mb-2 pb-1 border-b border-gray-200">TERMS & CONDITIONS</h2>
                  <div className="flex flex-wrap -mx-2">
                    <div className="w-1/2 px-2 mb-4">
                      <div className="p-4 bg-gray-50 rounded-lg h-full">
                        <p className="mb-2"><span className="font-semibold">Discount:</span> {getdata?.Discount || "N/A"}</p>
                        <p className="mb-2"><span className="font-semibold">Delivery:</span> {getdata?.Delivery || "N/A"}</p>
                        <p className="mb-2"><span className="font-semibold">Payment:</span> {getdata?.Paymentdue || "N/A"}</p>
                      </div>
                    </div>
                    <div className="w-1/2 px-2 mb-4">
                      <div className="p-4 bg-gray-50 rounded-lg h-full">
                        <p className="mb-2"><span className="font-semibold">Validity:</span> {getdata?.validity || "N/A"}</p>
                        <p className="mb-2"><span className="font-semibold">Warranty:</span> {getdata?.Warranty || "N/A"}</p>
                        <p className="mb-2"><span className="font-semibold">GST:</span> {getdata?.Gst || "18"}% Extra</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Closing */}
                <div className="mb-8 text-center text-xs">
                  <p className="text-lg font-medium text-blue-600">We look forward to the pleasure of receiving your valued order</p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 pt-6 text-sm text-gray-600 flex justify-between">
                  <div>
                    <p>SK Sales</p>
                    <p>GST: 33AACCL4592K1ZA</p>
                  </div>
                  <div className="text-right">
                    <p>Email: loyaltyautomation@gmail.com</p>
                    <p>Phone: +91 XXXXX XXXXX</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
"use client";
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from "next/navigation";
import html2pdf from 'html2pdf.js';
import { toWords } from 'number-to-words';
import { ArrowLeft, Download } from 'lucide-react';
import { LoadingBlock, ErrorBanner, SecondaryButton } from "../../_components/ui";

const PDFPage = () => {
  const contentRef = useRef();
  const buttonRef = useRef();
  const [consigneeData, setConsigneeData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const piId = searchParams.get('piId'); // Fetch PI ID from URL
  const router = useRouter();

  // Fetch invoice data based on PI ID
  useEffect(() => {
    if (!piId) {
      setError("Invoice ID is missing");
      setLoading(false);
      return;
    }

    const fetchInvoiceData = async () => {
      const token = localStorage.getItem("admintokens");

      if (!token) {
        setError("Authorization token is missing");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5005/api-invoice/byPiId/${piId}`, // Use PI ID here
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        setInvoiceData(response.data);
        
        // If there are invoice items/rows, set them
        if (response.data.items && Array.isArray(response.data.items)) {
          setRows(response.data.items);
        } else {
          setRows([
            { sno: 1, hsnCode: "Sample Product", unitDescription: "Sample Description", uom: "Nos", quantity: 1, unitPrice: response.data.subtotal || 0, total: response.data.subtotal || 0 }
          ]);
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load invoice data");
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [piId]);

  const handleDownload = () => {
    buttonRef.current.style.display = 'none';

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: 'Proforma_Invoice.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    };

    html2pdf().set(opt).from(contentRef.current).save().finally(() => {
      buttonRef.current.style.display = 'block';
    });
  };

  const handleBack = () => {
    router.push(`/invoice/detail?piId=${piId}`);
  };

  if (loading) return <div className="px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl"><LoadingBlock label="Loading invoice data..." /></div></div>;
  if (error) return <div className="px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl"><ErrorBanner>{error}</ErrorBanner></div></div>;
  if (!invoiceData) return <div className="px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl"><ErrorBanner>No invoice data found</ErrorBanner></div></div>;

    // Calculating the totals and other necessary values
    const subtotal = Number(rows.reduce((acc, item) => Number(acc) + Number(item.total), 0));
    const freightAmount = Number(invoiceData.freight || 0);
    const gstAmount = (subtotal + freightAmount) * (Number(invoiceData.gst || 0) / 100);
    const totalPayable = Math.round(subtotal + freightAmount + gstAmount).toFixed(2);
    const roundoff = (Number(subtotal + freightAmount + gstAmount) - Math.round(totalPayable)).toFixed(2);
    const totalPayableInWords = toWords(Number(totalPayable)).toUpperCase();
  
    return (
      <div className="bg-gray-100 mx-3 min-h-screen">
        <div ref={contentRef} className="bg-white border-black border-2 m-3 mx-auto rounded shadow" style={{ width: '760px' }}>
          <div className="border-b-2 border-black pb-1 mb-2">
            <div className="flex justify-between items-center border-b-2 border-black px-6">
              <p className="text-lg font-bold">GST No: 33AACCL4592K1ZA</p>
              <div className="flex space-x-2">
                <img src="/phoenix.png" alt="Phoenix" className="w-28 h-16 object-contain" />
                <img src="/deltas.jpg" alt="Delta" className="w-28 h-16 object-contain" />
                <img src="/Schneider.png" alt="Schneider" className="w-28 h-16 object-contain" />
              </div>
            </div>
            <img src="/p4.jpeg" className="w-full h-auto object-contain" alt="Header" />
          </div>
  
          <h2 className="text-center text-red-600 text-xl font-bold pb-5 border-b-2 border-black">PROFORMA INVOICE</h2>
  
          <div className="flex border-b-2 border-black mb-4">
            <div className="w-1/2 p-4">
              <h3 className="font-bold">Consignee:</h3>
              <p className="font-bold">{invoiceData.name}</p>
              <p className="font-bold">{invoiceData.address}</p>
              <p className="font-bold">GSTIN: {invoiceData.gstField}</p>
            </div>
            <div className="w-1/2 pl-4 border-l-2 border-black pt-2">
              <table className="w-full">
                <tbody>
                  <tr><td className="font-bold">Our Ref No.</td><td>: {invoiceData.referenceNumber}</td></tr>
                  <tr><td className="font-bold">Date</td><td>: {invoiceData.issueDate ? new Date(invoiceData.issueDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                  <tr><td className="font-bold">Your Ref</td><td>: {invoiceData.yourRef}</td></tr>
                  <tr><td className="font-bold">Date</td><td>: {new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <table className="w-full text-sm border border-black">
            <thead className="bg-gray-200">
              <tr className="bg-blue-700 text-white">
                <th className="border border-black p-2">S.No</th>
                <th className="border border-black p-2">Product</th>
                <th className="border border-black p-2">Unit Description</th>
                <th className="border border-black p-2">UOM</th>
                <th className="border border-black p-2">Qty</th>
                <th className="border border-black p-2">Unit Price</th>
                <th className="border border-black p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u, i) => (
                <tr key={i}>
                  <td className="border border-black p-2">{u.sno}</td>
                  <td className="border border-black p-2">{u.hsnCode}</td>
                  <td className="border border-black p-2">{u.unitDescription}</td>
                  <td className="border border-black p-2">{u.uom}</td>
                  <td className="border border-black p-2">{u.quantity}</td>
                  <td className="border border-black p-2">{u.unitPrice}</td>
                  <td className="border border-black p-2">{u.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
  
          <div className="mt-4 flex justify-end border-t-2 border-b-2 border-black">
            <div className="text-md w-[410px] mb-5 font-semibold text-[17px]">
              <h3 className="font-bold">Terms & Conditions:</h3>
              <ol className="pl-4">
                <li>1. Goods once sold will not be taken back.</li>
                <li>2. Interest @{invoiceData.interestRate || 24}% p.a. will be charged if the payment is not made in the stipulated time.</li>
                <li>3. Subject to {invoiceData.jurisdiction || "Chennai"} Jurisdiction only.</li>
                <li>4. {invoiceData.certification || "Certified that the particulars given above are true."}</li>
                {invoiceData.goodsReturn && <li>5. {invoiceData.goodsReturn}</li>}
              </ol>
            </div>
            <table className="text-sm w-1/2 ml-20 border-l-2 border-black">
              <tbody>
                <tr><td className="border border-black p-2">Sub Total</td><td className="border border-black p-2">{subtotal}</td></tr>
                <tr><td className="border border-black p-2">Freight</td><td className="border border-black p-2">{freightAmount}</td></tr>
                <tr><td className="border border-black p-2">GST</td><td className="border border-black p-2">{gstAmount.toFixed(2)}</td></tr>
                <tr><td className="border border-black p-2 font-semibold">Round Off</td><td className="border border-black p-2">{roundoff}</td></tr>
                <tr><td className="border border-black p-2 font-bold text-blue-800">Total Payable</td><td className="border border-black p-2 font-bold text-blue-800">{totalPayable}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between mt-6 pb-5">
            <div className="w-1/2 text-md">
              <h3 className="font-bold">Amount In Words:</h3>
              <p className='font-semibold'>{totalPayableInWords}</p>
            </div>
            <div className="flex justify-end mr-10">
            <div className="flex flex-col items-end text-right">
              <strong className="text-base font-bold">FOR LOYALITY AUTOMATION PVT.LTD.</strong>
              <img src="/sign.jpeg" alt="signature" className="h-16 mt-2 w-32" />
              <h6 className="text-base font-semibold">Authorised Signatory</h6>
            </div>
          </div>
          </div>
        </div>
        <div className="flex justify-between mt-5 pb-6">
          <SecondaryButton onClick={handleBack}>
            <ArrowLeft size={16} />
            Go Back
          </SecondaryButton>
          <button
            ref={buttonRef}
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    );
  };
  

export default PDFPage;
"use client";
import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from "next/navigation";
import html2pdf from 'html2pdf.js';
import { toWords } from 'number-to-words';

const PDFPage = ({ rows, freight, gst, invoiceData, name, address, gstNumber }) => {
  const contentRef = useRef();
  const [consigneeData, setConsigneeData] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const Enquiry = searchParams.get('EnquiryNo');
  const router = useRouter();

  useEffect(() => {
    if (invoiceData?.EnquiryNo || Enquiry) {
      fetchConsigneeData(invoiceData?.EnquiryNo || Enquiry);
    } else {
      setError("EnquiryNo is missing.");
    }
  }, [invoiceData, Enquiry]);

  const fetchConsigneeData = async (EnquiryNo) => {
    try {
      const token = localStorage.getItem("admintokens");
      const response = await axios.get(`http://localhost:5005/api/cc/Enquiryget/${EnquiryNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data?.customerData) {
        const customerData = response.data.customerData;
        const conversation = customerData.customerconvert.find(
          (item) => item.EnquiryNo === EnquiryNo
        );

        if (conversation) {
          setConsigneeData(conversation.BillingAddressDetails);
        } else {
          setError("Conversation not found for provided EnquiryNo.");
        }
      } else {
        setError("No customer data found.");
      }
    } catch (err) {
      setError("Failed to load consignee data.");
    }
  };

  const buttonRef = useRef();

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

  // Parse values directly as numbers to avoid type issues
  const subtotal = Number(rows.reduce((acc, item) => Number(acc) + Number(item.total || 0), 0).toFixed(2));
  const freightAmount = Number(freight || 0);
  
  // Use the passed GST value directly - it's already calculated
  const gstAmount = Number(gst);
  
  // Calculate total and round off
  const totalBeforeRounding = subtotal + freightAmount + gstAmount;
  const totalPayable = Math.round(totalBeforeRounding).toFixed(2);
  const roundoff = (totalBeforeRounding - Number(totalPayable)).toFixed(2);
  
  const totalPayableInWords = toWords(Number(totalPayable)).toUpperCase();

  return (
    <div ref={contentRef} className="bg-gray-100 mx-3 min-h-screen">
         <button
          onClick={() => router.push('/SaleteamDasboard/Dasboard')}
          className="inline-flex items-center gap-1.5 mb-6 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
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
      <div className="bg-white border border-black m-3 mx-auto rounded shadow" style={{ width: '760px' }}>
        <div className="border-b border-black pb-1 mb-2">
          <div className="flex justify-between items-center border-b border-black px-6">
            <p className="text-lg font-bold">GST No: 33AACCL4592K1ZA</p>
            <div className="flex space-x-3">
              <img src="/phoenix.png" alt="Phoenix" className="w-20 h-10 object-contain" />
              <img src="/deltas.jpg" alt="Delta" className="w-20 h-10 object-contain" />
              <img src="/Schneider.png" alt="Schneider" className="w-20 h-10 object-contain" />
            </div>
          </div>
          <img src="/p4.jpeg" className="w-full h-auto object-contain" alt="Header" />
        </div>

        <h2 className="text-center text-red-600 text-xl font-bold pb-5 border-b border-black">PROFORMA INVOICE</h2>

        <div className="flex border-b border-black mb-4">
          <div className="w-1/2 p-8">
            <h3 className="font-bold">Consignee:</h3>
            <>
              <p className="font-bold">{name}</p>
              <p className="font-bold">{address}</p>
              <p className="font-bold">GSTIN : {gstNumber}</p>
            </>
          </div>
          <div className="w-1/2 pl-4 border-l border-black">
            <table className="w-full">
              <tbody>
                <tr><td className="font-bold">Our Ref No.</td><td>: {invoiceData?.referenceNumber}</td></tr>
                <tr><td className="font-bold">Date</td><td>: {invoiceData?.issueDate ? new Date(invoiceData.issueDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</td></tr>
                <tr><td className="font-bold">Your Ref</td><td>: {invoiceData?.yourRef}</td></tr>
                <tr><td className="font-bold">Date</td><td>: {new Date().toLocaleDateString('en-IN')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="w-full text-sm border border-black">
          <thead className="bg-gray-200">
            <tr className="bg-blue-700 text-white">
              <th className="border border-black p-2">S.No</th>
              <th className="border border-black p-2">Model</th>
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

        <div className="mt-4 flex justify-end border-t border-b border-black">
          <div className="text-md w-[410px] mb-5 font-semibold text-[17px]">
            <h3 className="font-bold">Terms & Conditions:</h3>
            <ol className="pl-4">
              <li>1. Goods once sold will not be taken back.</li>
              <li>2. Interest @24% p.a. will be charged if the payment is not made in the stipulated time.</li>
              <li>3. Subject to Chennai Jurisdiction only.</li>
              <li>4. Certified that the particulars given above are true.</li>
            </ol>
          </div>
          <table className="text-sm w-1/2 ml-20 border-black">
            <tbody>
              <tr><td className="border border-black p-2">Sub Total</td><td className="border border-black p-2">{subtotal.toFixed(2)}</td></tr>
              <tr><td className="border border-black p-2">Freight</td><td className="border border-black p-2">{freightAmount.toFixed(2)}</td></tr>
              <tr><td className="border border-black p-2">GST</td><td className="border border-black p-2">{gstAmount.toFixed(2)}</td></tr>
              <tr><td className="border border-black p-2 font-semibold">Round Off</td><td className="border border-black p-2">{roundoff}</td></tr>
              <tr><td className="border border-black p-2 font-bold text-blue-800 text-xl">Amount Payable</td><td className="border border-black p-2 font-bold text-blue-800 text-xl">{totalPayable}</td></tr>
            </tbody>
          </table>
        </div>

        <p className="mt-[-6px] pb-3 text-[18px] border-black border-b">
          <strong className="text-[18px]">Amount (In Words):</strong> {totalPayableInWords} ONLY
        </p>

        <div className="mt-8 flex justify-end text-right font-bold text-xl">
          <div>
            <p>For SK SALES</p>
            <div className="mt-2 mr-9 flex justify-end items-center">
              <img src="/LoyaltySeal.jpeg" alt="Authorized Signatory" className="w-20 h-auto object-contain" />
            </div>
            <p className="mb-4 text-sm">Authorized Signatory</p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          ref={buttonRef}
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default PDFPage;
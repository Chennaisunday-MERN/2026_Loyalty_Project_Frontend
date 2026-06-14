"use client";
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import html2pdf from 'html2pdf.js';
import { toWords } from 'number-to-words';
import {
  PageShell,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
  Badge,
  LoadingBlock,
  ErrorBanner,
} from "../../_components/ui";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedInvoiceForPDF, setSelectedInvoiceForPDF] = useState(null);
  const [pdfRows, setPdfRows] = useState([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const router = useRouter();
  const pdfContentRef = useRef();

  // Get the token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('admintokens');
    setToken(storedToken);
  }, []);

  // Fetch invoices when token is set
  useEffect(() => {
    if (!token) return;
    const fetchInvoices = async () => {
      try {
        const response = await axios.get('http://localhost:5005/api-invoice/invoices', {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        setInvoices(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, [token]);

  const handleViewMore = (piId) => {
    router.push(`/SaleteamDasboard/DetailsPI?piId=${piId}`);
  };

 // Function to fetch full invoice data for PDF generation with enhanced GST handling
const handleGeneratePDF = async (piId) => {
  if (!token) {
    alert("Authorization token is missing");
    return;
  }

  try {
    const response = await axios.get(
      `http://localhost:5005/api-invoice/byPiId/${piId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const invoiceData = response.data;
    console.log("Invoice data:", invoiceData);
    
    // Add debug logging to understand the GST field type and value
    console.log("GST field type:", typeof invoiceData.gst);
    console.log("GST field raw value:", invoiceData.gst);
    
    // Force the GST field to be a proper number
    if (invoiceData.gst !== undefined) {
      // Use parseFloat to ensure we have a number, not a string
      const parsedGst = parseFloat(invoiceData.gst);
      
      if (!isNaN(parsedGst)) {
        // Convert from decimal to percentage if needed
        if (parsedGst > 0 && parsedGst < 1) {
          invoiceData.gst = parsedGst * 100;
        } else {
          invoiceData.gst = parsedGst;
        }
      } else {
        // If parsing failed, set a default
        console.warn("GST value couldn't be parsed, using default");
        invoiceData.gst = 18;
      }
    } else {
      // If no GST field, set a default
      invoiceData.gst = 18;
    }
    
    console.log("Final GST value after parsing:", invoiceData.gst);
    
    setSelectedInvoiceForPDF(invoiceData);

    let productItems = [];

    // Find product items from known keys
    if (invoiceData.rows && Array.isArray(invoiceData.rows) && invoiceData.rows.length > 0) {
      productItems = invoiceData.rows;
    } else if (invoiceData.items && Array.isArray(invoiceData.items) && invoiceData.items.length > 0) {
      productItems = invoiceData.items;
    } else if (invoiceData.products && Array.isArray(invoiceData.products) && invoiceData.products.length > 0) {
      productItems = invoiceData.products;
    } else if (invoiceData.lineItems && Array.isArray(invoiceData.lineItems) && invoiceData.lineItems.length > 0) {
      productItems = invoiceData.lineItems;
    } else if (Array.isArray(invoiceData) && invoiceData.length > 0 && invoiceData[0].hasOwnProperty('unitPrice')) {
      productItems = invoiceData;
      
      // If the response is an array of items, try to extract invoice metadata
      const firstItem = invoiceData[0];
      const extractedInvoice = {
        ...firstItem,
        piId: piId
      };
      
      // If there's GST info in the first item, ensure it's properly parsed as a number
      if (firstItem.gst !== undefined) {
        const parsedItemGst = parseFloat(firstItem.gst);
        if (!isNaN(parsedItemGst)) {
          if (parsedItemGst > 0 && parsedItemGst < 1) {
            extractedInvoice.gst = parsedItemGst * 100;
          } else {
            extractedInvoice.gst = parsedItemGst;
          }
        } else {
          extractedInvoice.gst = 18;
        }
      } else {
        extractedInvoice.gst = 18;
      }
      
      setSelectedInvoiceForPDF(extractedInvoice);
    }

    if (productItems.length > 0) {
      const mappedRows = productItems.map((item, index) => {
        // Helper function for property extraction
        const getProperty = (possibleKeys, defaultValue) => {
          for (const key of possibleKeys) {
            if (item[key] !== undefined && item[key] !== null) return item[key];
          }
          return defaultValue;
        };

        // Extract item properties
        const hsnCode = getProperty([
          'hsnCode', 'hsn', 'HSNCode', 'HSN', 'hsnSacCode', 'hsncode'
        ], `HSN ${index + 1}`);

        const unitDescription = getProperty([
          'productName', 'name', 'product', 'productId', 'itemName',
          'unitDescription', 'description', 'desc', 'productDescription', 'itemDescription'
        ], `Description ${index + 1}`);

        const quantity = parseFloat(getProperty(['quantity', 'qty', 'amount'], 1));
        const unitPrice = parseFloat(getProperty(['unitPrice', 'price', 'rate', 'unitRate'], 0));
        const total = parseFloat(getProperty(['total', 'totalPrice', 'amount'], quantity * unitPrice));
        const uom = getProperty(['uom', 'unit', 'unitOfMeasure'], 'Nos');

        return {
          sno: index + 1,
          hsnCode,
          unitDescription,
          uom,
          quantity,
          unitPrice,
          total
        };
      });

      setPdfRows(mappedRows);
    } else {
      // Try fallback endpoints if no products found
      const endpoints = [
        `http://localhost:5005/api-invoice/products/${piId}`,
        `http://localhost:5005/api-invoice/invoice-products/${piId}`,
        `http://localhost:5005/api-invoice/invoice-items/${piId}`
      ];

      let productsFound = false;

      for (const endpoint of endpoints) {
        if (productsFound) break;

        try {
          const productsResponse = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = productsResponse.data;
          const products = Array.isArray(data) ? data : data.products;

          if (products && Array.isArray(products) && products.length > 0) {
            console.log("Found products in fallback endpoint");
            
            const mappedFallbackRows = products.map((product, index) => {
              const getProperty = (possibleKeys, defaultValue) => {
                for (const key of possibleKeys) {
                  if (product[key] !== undefined && product[key] !== null) return product[key];
                }
                return defaultValue;
              };

              // Ensure all numeric values are properly parsed
              const quantity = parseFloat(getProperty(['quantity', 'qty', 'amount'], 1));
              const unitPrice = parseFloat(getProperty(['unitPrice', 'price', 'rate'], 0));
              const total = parseFloat(getProperty(['total', 'totalPrice', 'amount'], quantity * unitPrice));

              return {
                sno: index + 1,
                hsnCode: getProperty(['hsnCode', 'hsn', 'HSNCode', 'HSN', 'hsnSacCode'], `HSN ${index + 1}`),
                unitDescription: getProperty(['productName', 'name', 'product', 'description'], `Description ${index + 1}`),
                uom: getProperty(['uom', 'unit', 'unitOfMeasure'], 'Nos'),
                quantity,
                unitPrice,
                total
              };
            });

            setPdfRows(mappedFallbackRows);
            productsFound = true;
          }
        } catch (endpointErr) {
          console.log(`Error fetching from ${endpoint}:`, endpointErr.message);
        }
      }

      if (!productsFound) {
        console.warn("No product details found in any endpoint, setting default PDF row.");
        setPdfRows([
          {
            sno: 1,
            hsnCode: "HSN Code N/A",
            unitDescription: "No product data available",
            uom: "Nos",
            quantity: 1,
            unitPrice: parseFloat(invoiceData.subtotal || 0),
            total: parseFloat(invoiceData.subtotal || 0)
          }
        ]);
      }
    }

    setShowPdfModal(true);
  } catch (err) {
    console.error("Error fetching invoice:", err);
    alert("Failed to load invoice data: " + (err.response?.data?.message || err.message));
  }
};
  

  const handleDownloadPDF = () => {
    if (!pdfContentRef.current) return;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `Proforma_Invoice_${selectedInvoiceForPDF.piId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    };

    html2pdf().set(opt).from(pdfContentRef.current).save().finally(() => {
      setShowPdfModal(false);
    });
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Invoices"
        subtitle="Proforma invoices and their current status."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
      />

      {loading && <LoadingBlock label="Loading invoices…" />}
      {error && <ErrorBanner>Error: {error}</ErrorBanner>}

      {!loading && !error && (
        <TableWrap>
          <thead>
            <tr>
              <Th>Reference</Th>
              <Th>Name</Th>
              <Th>Date</Th>
              <Th>Total</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{invoice.referenceNumber}</Td>
                <Td>{invoice.name}</Td>
                <Td>{new Date(invoice.issueDate).toLocaleDateString()}</Td>
                <Td>₹{Number(invoice.totalPayable || 0).toFixed(2)}</Td>
                <Td>
                  <Badge tone={invoice.Status === 'POreq' ? 'amber' : 'green'}>
                    {invoice.Status}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <SecondaryButton onClick={() => handleViewMore(invoice.piId)}>
                      View More
                    </SecondaryButton>
                    <PrimaryButton onClick={() => handleGeneratePDF(invoice.piId)}>
                      Generate PDF
                    </PrimaryButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      {/* PDF Modal */}
      {showPdfModal && selectedInvoiceForPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-full max-w-5xl max-h-screen overflow-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Invoice Preview</h2>
              <div className="flex items-center gap-2">
                <PrimaryButton onClick={handleDownloadPDF}>
                  Download PDF
                </PrimaryButton>
                <SecondaryButton onClick={() => setShowPdfModal(false)}>
                  Close
                </SecondaryButton>
              </div>
            </div>
            
            {/* PDF Content */}
            <div ref={pdfContentRef} className="bg-white border-black border-2 mx-auto" style={{ width: '760px' }}>
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
                  <p className="font-bold">{selectedInvoiceForPDF.name}</p>
                  <p className="font-bold">{selectedInvoiceForPDF.address}</p>
                  <p className="font-bold">GSTIN: {selectedInvoiceForPDF.gstField}</p>
                </div>
                <div className="w-1/2 pl-4 border-l-2 border-black pt-2">
                  <table className="w-full">
                    <tbody>
                      <tr><td className="font-bold">Our Ref No.</td><td>: {selectedInvoiceForPDF.referenceNumber}</td></tr>
                      <tr><td className="font-bold">Date</td><td>: {selectedInvoiceForPDF.issueDate ? new Date(selectedInvoiceForPDF.issueDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                      <tr><td className="font-bold">Your Ref</td><td>: {selectedInvoiceForPDF.yourRef}</td></tr>
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
                  {pdfRows.map((u, i) => (
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

              {(() => {
  const subtotal = pdfRows.reduce((acc, item) => acc + parseFloat(item.total || 0), 0);
  const freightAmount = parseFloat(selectedInvoiceForPDF.freight || 0);

  let gstAmount;
  let gstLabel;

  const rawGst = parseFloat(selectedInvoiceForPDF.gst);

  if (!isNaN(rawGst) && rawGst > 100) {
    // GST is an amount (e.g., ₹800)
    gstAmount = rawGst;
    gstLabel = "GST (Amount)";
  } else {
    // GST is a percentage (e.g., 18 or 0.18)
    let gstRate = !isNaN(rawGst) ? rawGst : 18;
    if (gstRate < 1) gstRate *= 100;
    gstAmount = (subtotal + freightAmount) * (gstRate / 100);
    gstLabel = `GST @ ${gstRate}%`;
  }

  const totalBeforeRounding = subtotal + freightAmount + gstAmount;
  const totalPayable = Math.round(totalBeforeRounding).toFixed(2);
  const roundoff = (totalBeforeRounding - Math.round(totalBeforeRounding)).toFixed(2);
  const totalPayableInWords = toWords(Number(totalPayable)).toUpperCase();

  return (
    <>
      <div className="mt-4 flex justify-end border-t-2 border-b-2 border-black">
        <div className="text-md w-[410px] mb-5 font-semibold text-[17px]">
          <h3 className="font-bold">Terms & Conditions:</h3>
          <ol className="pl-4">
            <li>1. Goods once sold will not be taken back.</li>
            <li>2. Interest @{selectedInvoiceForPDF.interestRate || 24}% p.a. will be charged if the payment is not made in the stipulated time.</li>
            <li>3. Subject to {selectedInvoiceForPDF.jurisdiction || "Chennai"} Jurisdiction only.</li>
            <li>4. {selectedInvoiceForPDF.certification || "Certified that the particulars given above are true."}</li>
            {selectedInvoiceForPDF.goodsReturn && <li>5. {selectedInvoiceForPDF.goodsReturn}</li>}
          </ol>
        </div>
        <table className="text-sm w-1/2 ml-20 border-l-2 border-black">
          <tbody>
            <tr><td className="border border-black p-2">Sub Total</td><td className="border border-black p-2">₹{subtotal.toFixed(2)}</td></tr>
            <tr><td className="border border-black p-2">Freight</td><td className="border border-black p-2">₹{freightAmount.toFixed(2)}</td></tr>
            <tr><td className="border border-black p-2">{gstLabel}</td><td className="border border-black p-2">₹{gstAmount.toFixed(2)}</td></tr>
            <tr><td className="border border-black p-2 font-semibold">Round Off</td><td className="border border-black p-2">₹{roundoff}</td></tr>
            <tr><td className="border border-black p-2 font-bold text-blue-800">Total Payable</td><td className="border border-black p-2 font-bold text-blue-800">₹{totalPayable}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-6 pb-5">
        <div className="w-1/2 text-md">
          <h3 className="font-bold">Amount In Words:</h3>
          <p className='font-semibold'>{totalPayableInWords} ONLY</p>
        </div>
        <div className="flex justify-end mr-10">
          <div className="flex flex-col items-end text-right">
            <strong className="text-base font-bold">FOR LOYALITY AUTOMATION PVT.LTD.</strong>
            <img src="/sign.jpeg" alt="signature" className="h-16 mt-2" />
          </div>
        </div>
      </div>
    </>
  );
})()}



            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
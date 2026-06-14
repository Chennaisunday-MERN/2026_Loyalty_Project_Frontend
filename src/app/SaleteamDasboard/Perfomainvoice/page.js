"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import PDFPage from './pdf';
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
  TableWrap,
  Th,
  Td,
} from '../../_components/ui';

const App = () => {
  const [rows, setRows] = useState([{
    sno: '',
    hsnCode: '',
    unitDescription: '',
    uom: '',
    quantity: '',
    unitPrice: '',
    gst: '18',
    total: 0,
  }]);

  const [goodsReturn, setGoodsReturn] = useState('Yes');
  const [interestRate, setInterestRate] = useState('24%');
  const [jurisdiction, setJurisdiction] = useState('Chennai');
  const [certification, setCertification] = useState('True');
  const [freight, setFreight] = useState('');
  const [gstPercentage, setGstPercentage] = useState('18');
  const [calculatedGst, setCalculatedGst] = useState('0');
  const [financialYear, setFinancialYear] = useState('24-25');
  const [generatedRefNumber, setGeneratedRefNumber] = useState('');
  const [invoiceData, setInvoiceData] = useState(null);
  const [pdfPage, setPdfPage] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const [yourRef, setYourRef] = useState('');
  const [issueDate, setIssueDate] = useState('');

  const token = typeof window !== "undefined" ? localStorage.getItem('admintokens') : null;
  const Eid = typeof window !== "undefined" ? localStorage.getItem('idstore') : null;
  const router = useRouter();
  const search = useSearchParams();
  const EnquiryNo = search.get('EnquiryNo');

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token]);

  useEffect(() => {
    // When gstPercentage changes, update all rows
    const updatedRows = rows.map(row => ({
      ...row,
      gst: gstPercentage,
    }));
    setRows(updatedRows);
  }, [gstPercentage]);

  useEffect(() => {
    const gstValue = calculateTotalGST();
    setCalculatedGst(gstValue);
  }, [rows, freight, gstPercentage]);

  const handleTermsChange = (e, field) => {
    switch (field) {
      case 'goodsReturn': setGoodsReturn(e.target.value); break;
      case 'interestRate': setInterestRate(e.target.value); break;
      case 'jurisdiction': setJurisdiction(e.target.value); break;
      case 'certification': setCertification(e.target.value); break;
      default: break;
    }
  };

  const handleRowChange = (index, e, field) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = e.target.value;

    if (['quantity', 'unitPrice'].includes(field)) {
      const quantity = parseFloat(updatedRows[index].quantity) || 0;
      const unitPrice = parseFloat(updatedRows[index].unitPrice) || 0;
      const total = quantity * unitPrice;
      updatedRows[index].total = total.toFixed(2);
    }

    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, {
      sno: '', hsnCode: '', unitDescription: '', uom: '', quantity: '',
      unitPrice: '', gst: gstPercentage, total: 0
    }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const updatedRows = [...rows];
      updatedRows.splice(index, 1);
      setRows(updatedRows);
    }
  };

  const calculateSubtotal = () => {
    return rows.reduce((acc, row) => acc + parseFloat(row.total || 0), 0);
  };

  const calculateTotalGST = () => {
    const subtotal = calculateSubtotal();
    const freightValue = parseFloat(freight || 0);
    const gstAmount = ((subtotal + freightValue) * parseFloat(gstPercentage || 0)) / 100;
    return gstAmount.toFixed(2);
  };

  const calculateTotalPayable = () => {
    const subtotal = calculateSubtotal();
    const freightValue = parseFloat(freight || 0);
    const gstAmount = parseFloat(calculatedGst);
    return (subtotal + freightValue + gstAmount).toFixed(2);
  };

  const calculateRoundOff = () => {
    const totalPayable = parseFloat(calculateTotalPayable());
    return (Math.round(totalPayable) - totalPayable).toFixed(2);
  };

  const isFormFilled = financialYear && goodsReturn && interestRate && jurisdiction &&
    certification && rows.every(row =>
      row.hsnCode && row.unitDescription && row.uom && row.quantity && row.unitPrice
    ) && name && address && gstNumber && yourRef && issueDate;

  const createInvoice = async () => {
    const goodsReturnBool = goodsReturn === 'Yes';
    const interestRateNum = parseFloat(interestRate.replace('%', ''));

    const orderData = {
      goodsReturn: goodsReturnBool,
      interestRate: interestRateNum,
      jurisdiction,
      certification,
      Eid,
      EnquiryNo,
      name,
      address,
      gstField: gstNumber,
      yourRef,
      issueDate,
      rows: rows.map(row => ({
        itemName: row.unitDescription,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        gst: parseFloat(gstPercentage),
        total: row.total
      })),
      freight: parseFloat(freight || 0),
      gst: parseFloat(calculatedGst),
      subtotal: calculateSubtotal(),
      roundOff: parseFloat(calculateRoundOff()),
      totalPayable: parseFloat(calculateTotalPayable()),
      financialYear,
    };

    try {
      const response = await axios.post('http://localhost:5005/api-invoice/invoice', orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setGeneratedRefNumber(response.data.referenceNumber);
      setInvoiceData(response.data.invoice);
      setPdfPage(true);
    } catch (error) {
      console.error("Invoice creation failed:", error.response?.data || error.message);
    }
  };

  const fieldInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const fieldLabelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";
  const cellInputClass =
    "w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <>
      {!pdfPage ? (
        <PageShell>
          <PageHeader
            eyebrow="Sales"
            title="Proforma Invoice"
            subtitle="Enter customer, invoice and line-item details to create an invoice."
            onBack={() => router.push('/SaleteamDasboard/Inventory')}
          />

          {/* Customer Details */}
          <Card>
            <h3 className="text-base font-semibold text-slate-900">Customer Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={fieldLabelClass}>Customer Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>GST Number</label>
                <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={fieldInputClass} />
              </div>
            </div>
          </Card>

          {/* Invoice Details */}
          <Card>
            <h3 className="text-base font-semibold text-slate-900">Invoice Details</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={fieldLabelClass}>Financial Year</label>
                <input value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>Goods Return</label>
                <select value={goodsReturn} onChange={(e) => handleTermsChange(e, 'goodsReturn')} className={fieldInputClass}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className={fieldLabelClass}>Interest Rate</label>
                <input value={interestRate} onChange={(e) => handleTermsChange(e, 'interestRate')} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>Jurisdiction</label>
                <input value={jurisdiction} onChange={(e) => handleTermsChange(e, 'jurisdiction')} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>Certification</label>
                <select value={certification} onChange={(e) => handleTermsChange(e, 'certification')} className={fieldInputClass}>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              </div>
              <div>
                <label className={fieldLabelClass}>Your Ref</label>
                <input value={yourRef} onChange={(e) => setYourRef(e.target.value)} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Freight</label>
                <input type="number" value={freight} onChange={(e) => setFreight(e.target.value)} className={fieldInputClass} />
              </div>
              <div>
                <label className={fieldLabelClass}>GST Percentage</label>
                <input
                  type="number"
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
            </div>
          </Card>

          {/* Product Table */}
          <TableWrap>
            <thead>
              <tr>
                {['S.No', 'HSN Code', 'Unit Description', 'UOM', 'Quantity', 'Unit Price', 'Total', ''].map((heading) => (
                  <Th key={heading}>{heading}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  {['sno', 'hsnCode', 'unitDescription', 'uom', 'quantity', 'unitPrice'].map((field) => (
                    <Td key={field}>
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) => handleRowChange(index, e, field)}
                        className={cellInputClass}
                      />
                    </Td>
                  ))}
                  <Td className="font-medium text-slate-900">{row.total}</Td>
                  <Td>
                    <button
                      type="button"
                      className="text-sm font-medium text-rose-600 hover:text-rose-700"
                      onClick={() => removeRow(index)}
                    >
                      Remove
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          {/* Add row button */}
          <div className="flex justify-end">
            <SecondaryButton onClick={addRow}>
              <Plus size={16} />
              Add Row
            </SecondaryButton>
          </div>

          {/* Subtotal and Total Calculation */}
          <Card>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={fieldLabelClass}>Subtotal</label>
                <input
                  type="text"
                  value={calculateSubtotal().toFixed(2)}
                  readOnly
                  className={`${fieldInputClass} bg-slate-100`}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Total GST</label>
                <input
                  type="text"
                  value={calculatedGst}
                  readOnly
                  className={`${fieldInputClass} bg-slate-100`}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Total Payable</label>
                <input
                  type="text"
                  value={calculateTotalPayable()}
                  readOnly
                  className={`${fieldInputClass} bg-slate-100`}
                />
              </div>
              <div>
                <label className={fieldLabelClass}>Round Off</label>
                <input
                  type="text"
                  value={calculateRoundOff()}
                  readOnly
                  className={`${fieldInputClass} bg-slate-100`}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <PrimaryButton
              disabled={!isFormFilled}
              onClick={createInvoice}
            >
              Create Invoice
            </PrimaryButton>
          </div>
        </PageShell>
      ) : (
        <PDFPage
        invoice={invoiceData}
        rows={rows}
        freight={freight}
        gst={calculatedGst}
        invoiceData={invoiceData}
        name={name}
        address={address}
        gstNumber={gstNumber}
      />
      )}
    </>
  );
};

export default App;
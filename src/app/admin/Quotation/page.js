"use client";

import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Save, CheckCircle, AlertTriangle, DollarSign, Package, Calendar, Tag, Percent, ChevronRight } from 'lucide-react';
import { AdminShell, AdminPanel, adminInputClass, adminPrimaryButtonClass, adminSecondaryButtonClass } from "../_components/AdminShell";
import { ViewToggle, RecordCard, CardField, DetailModal } from "../_components/RecordView";

const Quotation = () => {
  const [getdata, setGetdata] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [view, setView] = useState("grid");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const quotationsPerPage = 9;

  const search = useSearchParams();
  const EnquiryNo = search.get('EnquiryNo');
  const pageParam = search.get('page');
  const token = typeof window !== 'undefined' ? localStorage.getItem('admintokens') : null;
  const router = useRouter();

  // Set page from URL parameter if available
  useEffect(() => {
    if (pageParam) {
      const pageNumber = parseInt(pageParam);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        setCurrentPage(pageNumber);
      }
    }
  }, [pageParam]);

  const fetchData = async () => {
    if (!token) {
      setErrorMessage('Error: Missing authorization token.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const [response1, response2] = await Promise.allSettled([
        axios.get('http://localhost:5005/api/quationgeteditmany', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('http://localhost:5005/api/quationgetmany', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      let editManyData = [];
      let manyData = [];

      if (response1.status === 'fulfilled') {
        editManyData = response1.value?.data?.formeditedquotation || [];
      }

      if (response2.status === 'fulfilled') {
        manyData = response2.value?.data?.formattedQuotations || [];
      }

      let combinedData = [];

      if (editManyData.length > 0 && manyData.length > 0) {
        const validData1 = editManyData.filter(
          (item) => item.Status !== 'Editaccess' && item.Status !== 'quotsaccess'
        );
        combinedData = [...validData1, ...manyData];
      } else if (editManyData.length > 0) {
        const validData1 = editManyData.filter(
          (item) => item.Status !== 'Editaccess' && item.Status !== 'quotsaccess'
        );
        combinedData = validData1;
      } else if (manyData.length > 0) {
        combinedData = manyData;
      } else {
        setErrorMessage('No quotations available from both APIs.');
        setGetdata([]);
        return;
      }

      if (combinedData.length > 0) {
        setGetdata(combinedData);
        setTotalPages(Math.ceil(combinedData.length / quotationsPerPage));
        setSuccessMessage(`Successfully loaded ${combinedData.length} quotations.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('No valid quotations available.');
        setGetdata([]);
      }
    } catch (error) {
      setErrorMessage(
        `Error fetching data: ${
          error.response
            ? JSON.stringify(error.response.data, null, 2)
            : error.message
        }`
      );
      setGetdata([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, EnquiryNo]);

  // Get current page quotations
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * quotationsPerPage;
    const endIndex = startIndex + quotationsPerPage;
    return getdata.slice(startIndex, endIndex);
  };

  // Change page handler
  const changePage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;

    setCurrentPage(pageNumber);
    setExpandedItems({}); // Reset expanded items when changing page
    setEditIndex(null); // Reset edit mode when changing page

    // Update URL with page parameter
    const params = new URLSearchParams(search);
    params.set('page', pageNumber);
    router.push(`?${params.toString()}`);
  };

  const handleInputChange = (index, field, value, productIndex = null) => {
    const updatedData = [...getdata];
    const actualIndex = (currentPage - 1) * quotationsPerPage + index;

    if (productIndex !== null) {
      updatedData[actualIndex].products[productIndex] = {
        ...updatedData[actualIndex].products[productIndex],
        [field]: value,
      };
    } else {
      updatedData[actualIndex] = { ...updatedData[actualIndex], [field]: value };
    }
    setGetdata(updatedData);
  };

  const handleProductChange = (index, productIndex, field, value) => {
    const updatedData = [...getdata];
    const actualIndex = (currentPage - 1) * quotationsPerPage + index;

    updatedData[actualIndex].products[productIndex] = {
      ...updatedData[actualIndex].products[productIndex],
      [field]: value,
    };
    setGetdata(updatedData);
  };

  const handleViewMore = (index) => {
    setExpandedItems(prev => {
      // Create a new object with all values set to false (collapse all)
      const newExpandedItems = {};

      // Toggle the clicked item
      newExpandedItems[index] = !prev[index];

      return newExpandedItems;
    });
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setErrorMessage('');
  };

  const handleSave = async (index) => {
    const actualIndex = (currentPage - 1) * quotationsPerPage + index;
    const item = { ...getdata[actualIndex] };

    // Check the structure of item and EnquiryNo
    console.log('Item:', item);
    const { EnquiryNo, ...updateFields } = item;

    if (!EnquiryNo || !item.PayableAmount || !item.Status) {
      setErrorMessage('Error: Please fill in all the required fields.');
      return;
    }

    item.Status = 'Editaccess';
    setLoading(true);
    setErrorMessage('');

    try {
      console.log('Sending PUT request with data:', { EnquiryNo, ...updateFields });
      const response = await axios.put(
        'http://localhost:5005/api/mdeditQuotation',
        { EnquiryNo, ...updateFields },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response data:', response.data);

      if (response.status === 200) {
        const updatedGetData = [...getdata];
        updatedGetData[actualIndex] = response.data;
        setGetdata(updatedGetData);
        setEditIndex(null);
        setSuccessMessage('Quotation updated successfully!');
      } else {
        setErrorMessage('Failed to update the quotation.');
      }
    } catch (error) {
      console.error('Error during update:', error);  // Log the error details
      setErrorMessage('Failed to update the quotation.');
    } finally {
      setLoading(false);
    }
  };


  const handleVerify = async (index) => {
    const actualIndex = (currentPage - 1) * quotationsPerPage + index;
    const item = { ...getdata[actualIndex] };
    const { EnquiryNo, Status } = item;

    if (!EnquiryNo) {
      setErrorMessage('Error: EnquiryNo is missing.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      let apiEndpoint = '';
      if (Status === 'quotsreq') {
        apiEndpoint = `http://localhost:5005/api/Quatationreq/${EnquiryNo}`;
    } else if (Status === 'Editreq') {
        apiEndpoint = `http://localhost:5005/api/editAccessQuotation/${EnquiryNo}`;
    } else if (Status === 'quotsaccess') {
        // Prevent updating `quotsaccess` status
        setErrorMessage('Cannot modify quotations with status "quotsaccess".');
        return;
    } else {
        setErrorMessage('Invalid status for verification.');
        return;
    }


      const response = await axios.put(apiEndpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        const updatedGetData = [...getdata];
        updatedGetData.splice(actualIndex, 1);
        setGetdata(updatedGetData);
        setTotalPages(Math.ceil((updatedGetData.length) / quotationsPerPage));

        // If current page is now empty and it's not the first page, go to previous page
        if (getCurrentPageData().length === 0 && currentPage > 1) {
          changePage(currentPage - 1);
        }

        setSuccessMessage('Quotation verified successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage('Failed to verify the quotation.');
      }
    } catch (error) {
      setErrorMessage('Failed to verify the quotation.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'quotsreq':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'Editreq':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }
  }

  // Returns the appropriate icon for the field
  const getFieldIcon = (field) => {
    switch(field) {
      case 'Warranty': return <Calendar size={14} className="text-slate-400" />;
      case 'Delivery': return <Package size={14} className="text-slate-400" />;
      case 'Discount': return <Percent size={14} className="text-slate-400" />;
      case 'Paymentdue': return <DollarSign size={14} className="text-slate-400" />;
      case 'validity': return <Calendar size={14} className="text-slate-400" />;
      case 'Gst': return <Tag size={14} className="text-slate-400" />;
      default: return null;
    }
  };

  // Generate pagination numbers
  const getPaginationRange = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift("...");
    }
    if (currentPage + delta < totalPages - 1) {
      range.push("...");
    }

    if (totalPages > 1) {
      range.unshift(1);
    }
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const currentPageData = getCurrentPageData();

  const fieldInputClass = `${adminInputClass} disabled:bg-slate-50 disabled:text-slate-500`;

  const selectedItem = selected !== null ? currentPageData[selected] : null;

  const detailFields = ["Warranty", "Delivery", "Discount", "Paymentdue", "validity", "Gst"];
  const productFields = ["HSNCode", "UnitDescription", "UOM", "Quantity", "UnitPrice", "Total"];

  return (
    <AdminShell
      title="Quotation Requests"
      subtitle={`Review, edit, and verify quotation requests. Page ${currentPage} of ${totalPages}.`}
      actions={<ViewToggle view={view} onChange={setView} />}
    >
      {/* Status Messages */}
      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"></div>
          <p className="text-sm text-slate-600">Loading quotations...</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="shrink-0 text-red-600" size={18} />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle className="shrink-0 text-emerald-600" size={18} />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {/* Quotation Records */}
      {currentPageData.length > 0 ? (
        view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {currentPageData.map((item, index) => (
              <RecordCard
                key={index}
                title={`Quotation ${item.EnquiryNo || (((currentPage - 1) * quotationsPerPage) + index + 1)}`}
                subtitle={item.Eid ? `ID: ${item.Eid}` : null}
                badge={
                  item.Status ? (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(item.Status)}`}>
                      {item.Status}
                    </span>
                  ) : null
                }
                onClick={() => setSelected(index)}
              >
                <CardField label="Payable Amount" value={item.PayableAmount || "—"} />
                <CardField label="Validity" value={item.validity || "—"} />
                <CardField label="Delivery" value={item.Delivery || "—"} />
                <CardField label="Products" value={item.products?.length || 0} />
              </RecordCard>
            ))}
          </div>
        ) : (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold text-slate-900">Quotation Requests</h2>
              <p className="text-sm text-slate-500">Click a row to view full details.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Enquiry No</th>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Payable Amount</th>
                    <th className="px-5 py-3">Validity</th>
                    <th className="px-5 py-3">Products</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPageData.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => setSelected(index)}
                      className="cursor-pointer hover:bg-slate-50/75"
                    >
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {item.EnquiryNo || (((currentPage - 1) * quotationsPerPage) + index + 1)}
                      </td>
                      <td className="px-5 py-3">{item.Eid || "—"}</td>
                      <td className="px-5 py-3">{item.PayableAmount || "—"}</td>
                      <td className="px-5 py-3">{item.validity || "—"}</td>
                      <td className="px-5 py-3">{item.products?.length || 0}</td>
                      <td className="px-5 py-3">
                        {item.Status ? (
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(item.Status)}`}>
                            {item.Status}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : (
        <AdminPanel title="Quotation Requests" subtitle="No quotation data available">
          <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
            <div className="rounded-full border border-slate-200 bg-slate-50 p-3">
              <AlertTriangle size={24} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No Quotation Data</h3>
            <p className="max-w-md text-sm text-slate-500">There are currently no quotations available. Please try again later or create a new quotation.</p>
            <button onClick={fetchData} className={adminSecondaryButtonClass}>
              Refresh
            </button>
          </div>
        </AdminPanel>
      )}

      {/* Pagination controls - Bottom */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <nav className="inline-flex -space-x-px overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" aria-label="Pagination">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center border-r border-slate-200 px-3 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'cursor-not-allowed bg-slate-50 text-slate-400'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronLeft size={16} />
              <span className="sr-only">Previous</span>
            </button>

            {getPaginationRange().map((page, idx) => (
              <button
                key={idx}
                onClick={() => typeof page === 'number' ? changePage(page) : null}
                disabled={page === "..."}
                className={`relative inline-flex items-center border-r border-slate-200 px-4 py-2 text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-slate-900 text-white'
                    : page === "..."
                    ? 'cursor-default bg-white text-slate-400'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-3 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'cursor-not-allowed bg-slate-50 text-slate-400'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ChevronRight size={16} />
              <span className="sr-only">Next</span>
            </button>
          </nav>
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        open={!!selectedItem}
        title={
          selectedItem
            ? `Quotation ${selectedItem.EnquiryNo || (((currentPage - 1) * quotationsPerPage) + selected + 1)}`
            : ""
        }
        subtitle={
          selectedItem ? (
            <span className="inline-flex items-center gap-2">
              {selectedItem.Status && (
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(selectedItem.Status)}`}>
                  {selectedItem.Status}
                </span>
              )}
              {editIndex === selected && (
                <span className="text-xs font-medium text-slate-500">Editing</span>
              )}
            </span>
          ) : null
        }
        onClose={() => setSelected(null)}
        footer={
          selectedItem ? (
            <div className="flex items-center justify-end gap-2">
              {editIndex === selected ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave(selected);
                  }}
                  className={`${adminPrimaryButtonClass} inline-flex items-center gap-1.5`}
                >
                  <Save size={14} /> Save
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(selected);
                  }}
                  className={`${adminSecondaryButtonClass} inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50`}
                  disabled={editIndex !== null && editIndex !== selected}
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVerify(selected);
                  setSelected(null);
                }}
                className={`${adminPrimaryButtonClass} inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50`}
                disabled={editIndex !== null}
              >
                <CheckCircle size={14} /> Verify
              </button>
            </div>
          ) : null
        }
      >
        {selectedItem && (
          editIndex === selected ? (
            /* Edit form for the selected record */
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">ID</label>
                  <input
                    type="text"
                    value={selectedItem.Eid || ""}
                    onChange={(e) => handleInputChange(selected, "Eid", e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Payable Amount</label>
                  <input
                    type="text"
                    value={selectedItem.PayableAmount || ""}
                    onChange={(e) => handleInputChange(selected, "PayableAmount", e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-900">Quotation Details</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {detailFields.map((field) => (
                    <div key={field}>
                      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        {getFieldIcon(field)}
                        {field}
                      </label>
                      <input
                        type="text"
                        value={selectedItem[field] || ""}
                        onChange={(e) => handleInputChange(selected, field, e.target.value)}
                        className={fieldInputClass}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {selectedItem.products && selectedItem.products.length > 0 && (
                <div className="border-t border-slate-200 pt-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">Products</h3>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {selectedItem.products.length}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {selectedItem.products.map((product, productIndex) => (
                      <div key={productIndex} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                          {productFields.map((field) => (
                            <div key={field}>
                              <label className="mb-1 block text-sm font-medium text-slate-700">{field}</label>
                              <input
                                type="text"
                                value={product[field] || ""}
                                onChange={(e) => handleProductChange(selected, productIndex, field, e.target.value)}
                                className={fieldInputClass}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Read-only details */
            <div className="space-y-6">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {[
                  ["Enquiry No", selectedItem.EnquiryNo],
                  ["ID", selectedItem.Eid],
                  ["Payable Amount", selectedItem.PayableAmount],
                  ["Warranty", selectedItem.Warranty],
                  ["Delivery", selectedItem.Delivery],
                  ["Discount", selectedItem.Discount],
                  ["Payment Due", selectedItem.Paymentdue],
                  ["Validity", selectedItem.validity],
                  ["GST", selectedItem.Gst],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
                    <dd className="text-sm text-slate-900">{value || "—"}</dd>
                  </div>
                ))}
              </dl>

              {selectedItem.products && selectedItem.products.length > 0 && (
                <div className="border-t border-slate-200 pt-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Package size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">Products</h3>
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {selectedItem.products.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                          {productFields.map((field) => (
                            <th key={field} className="px-5 py-3">{field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedItem.products.map((product, productIndex) => (
                          <tr key={productIndex}>
                            {productFields.map((field) => (
                              <td key={field} className="px-5 py-3 text-slate-900">
                                {product[field] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </DetailModal>
    </AdminShell>
  );
};

export default Quotation;

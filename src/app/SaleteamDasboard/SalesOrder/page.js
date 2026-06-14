"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import {
  PageShell,
  PageHeader,
  Card,
  PrimaryButton,
  SecondaryButton,
} from "../../_components/ui";

const Salesorder = () => {
  const Eid = typeof window !== "undefined" ? localStorage.getItem('idstore') : null;
  const [formData, setFormData] = useState({
    Eid,
    salesOrderDetails: {
      customerName: "",
      quoteNumber: "",
      subject: "",
      salesOrderDate: "",
      status: "Pending",
      customStatus: "",
      assignedTo: "",
      poNumber: "",
      poDate: "",
      paymentTerms: "",
    },
    termsAndConditions: {
      text: "",
    },
    items: [
      {
        itemName: "",
        quantity: 0,
        listPrice: 0,
        discount: 0,
        tax: 0,
        totalPrice: 0,
      },
    ],
    summary: {
      itemsTotal: 0,
      discountTotal: 0,
      shippingHandling: 0,
      preTaxTotal: 0,
      taxesForShipping: 0,
      transitInsurance: 0,
      installationCharges: 0,
      taxForInstallation: 0,
      adjustments: 0,
      grandTotal: 0,
    },
  });

  const [token, setToken] = useState("");
  const [products, setProducts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("admintokens");
    setToken(storedToken);

    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5005/api-inventory/get-product');
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split("."); // Split to handle nested fields

    if (section === "salesOrderDetails") {
      if (field === "status" && value === "Custom") {
        // When "Custom" is selected, don't update the status yet
        setFormData(prevData => ({
          ...prevData,
          salesOrderDetails: {
            ...prevData.salesOrderDetails,
            // We don't update status here, we'll wait for customStatus to be entered
          }
        }));
      } else if (field === "customStatus") {
        // When updating customStatus, also update the main status field
        setFormData(prevData => ({
          ...prevData,
          salesOrderDetails: {
            ...prevData.salesOrderDetails,
            [field]: value,
            status: value // Also update the status field with the custom value
          }
        }));
      } else {
        setFormData(prevData => ({
          ...prevData,
          salesOrderDetails: {
            ...prevData.salesOrderDetails,
            [field]: value, // Update the specific field
          }
        }));
      }
    } else if (section === "summary") {
      setFormData((prevData) => ({
        ...prevData,
        summary: {
          ...prevData.summary,
          [field]: parseFloat(value) || 0,
        },
      }));
    } else if (section === "termsAndConditions") {
      setFormData((prevData) => ({
        ...prevData,
        termsAndConditions: {
          ...prevData.termsAndConditions,
          [field]: value, // Update the text field
        },
      }));
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleNestedChange = (e, index, field) => {
    const { value } = e.target;
    const updatedItems = [...formData.items];
    updatedItems[index][field] = parseFloat(value) || 0; // Ensure that the value is a number

    // Automatically calculate the total price whenever a field changes
    if (field === "quantity" || field === "listPrice" || field === "discount" || field === "tax") {
      const { quantity, listPrice, discount, tax } = updatedItems[index];
      
      // Calculate total price (you can add more factors if needed)
      const totalPrice = (quantity * listPrice) - discount + tax;
      updatedItems[index].totalPrice = totalPrice;
    }

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemName: "",
          quantity: 0,
          listPrice: 0,
          discount: 0,
          tax: 0,
          totalPrice: 0,
        },
      ],
    });
  };

  const handleItemSelect = (e, index) => {
    const itemName = e.target.value;

    const selectedProduct = products.find(product => product.Model === itemName);

    const updatedItems = [...formData.items];
    if (selectedProduct) {
      updatedItems[index] = {
        ...updatedItems[index],
        itemName: selectedProduct.Model,
        listPrice: selectedProduct.price, // You can also set other details like price or description here
      };
    }
    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  // Helper function to prepare data before submission
  const prepareDataForSubmission = () => {
    // Create a copy of the formData to modify
    const submissionData = JSON.parse(JSON.stringify(formData));
    
    // Remove the customStatus field as it's only used for UI, not needed in the API
    if (submissionData.salesOrderDetails.customStatus) {
      delete submissionData.salesOrderDetails.customStatus;
    }
    
    return submissionData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data by removing UI-only fields
      const submissionData = prepareDataForSubmission();
      
      // First save to database
      const response = await axios.post(
        "http://localhost:5005/api-salesorder/create-salesorder",
        submissionData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      // Then generate PDF
      generatePDF();
      
      alert("Sales Order Created Successfully and PDF Generated!");
      
      // Reset form
      setFormData({
        Eid,
        salesOrderDetails: {
          customerName: "",
          quoteNumber: "",
          subject: "",
          salesOrderDate: "",
          status: "Pending",
          customStatus: "",
          assignedTo: "",
          poNumber: "",
          poDate: "",
          paymentTerms: "",
        },
        termsAndConditions: {
          text: "",
        },
        items: [
          {
            itemName: "",
            quantity: 0,
            listPrice: 0,
            discount: 0,
            tax: 0,
            totalPrice: 0,
          },
        ],
        summary: {
          itemsTotal: 0,
          discountTotal: 0,
          shippingHandling: 0,
          preTaxTotal: 0,
          taxesForShipping: 0,
          transitInsurance: 0,
          installationCharges: 0,
          taxForInstallation: 0,
          adjustments: 0,
          grandTotal: 0,
        },
      });
    } catch (error) {
      console.error("Error creating sales order:", error);
      alert("Failed to create sales order.");
    }
  };

  const generatePDF = () => {
    try {
      console.log("Generating PDF with data:", formData);

      const doc = new jsPDF();
      const {
        customerName,
        quoteNumber,
        subject,
        salesOrderDate,
        status,
        assignedTo,
        poNumber,
        poDate,
        paymentTerms
      } = formData.salesOrderDetails;

      // Color scheme
      const primaryColor = "#4f46e5";
      const secondaryColor = "#64748b";
      const lightGray = "#f1f5f9";

      // Page margins
      const marginX = 14;
      const contentWidth = 182; // 210 - 2*14

      // --- Header ---
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SALES ORDER", marginX, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("SK Sales", 210 - marginX, 10, { align: "right" });
      doc.text("No.27/1 Vaigai Colony", 210 - marginX, 14, { align: "right" });
      doc.text("2nd Street, 12th Ave, Ashok Nagar", 210 - marginX, 18, { align: "right" });
      doc.text("Chennai - 600083", 210 - marginX, 22, { align: "right" });
      doc.text("loyaltyautomation@gmail.com", 210 - marginX, 26, { align: "right" });

      // --- Order Info Section ---
      let y = 40;
      doc.setFillColor(lightGray);
      doc.roundedRect(marginX, y, contentWidth, 40, 2, 2, 'F');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ORDER INFORMATION", marginX + 2, y + 8);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      y += 16;
      doc.text(`Customer: ${customerName || 'N/A'}`, marginX + 2, y);
      doc.text(`Quote #: ${quoteNumber || 'N/A'}`, marginX + 2, y + 6);
      doc.text(`Subject: ${subject || 'N/A'}`, marginX + 2, y + 12);
      doc.text(`Order Date: ${salesOrderDate || 'N/A'}`, marginX + 2, y + 18);

      doc.text(`Status: ${status || 'N/A'}`, 120, y);
      doc.text(`PO Number: ${poNumber || 'N/A'}`, 120, y + 6);
      doc.text(`PO Date: ${poDate || 'N/A'}`, 120, y + 12);
      doc.text(`Payment Terms: ${paymentTerms || 'N/A'}`, 120, y + 18);

      // --- Items Table ---
      if (formData.items && formData.items.length > 0) {
        const headers = [["Item", "Qty", "Unit Price", "Discount", "Tax", "Total"]];
        const items = formData.items.map(item => [
          item.itemName || 'N/A',
          item.quantity || 0,
          `Rs. ${item.listPrice.toFixed(2)}`,
          `Rs. ${item.discount.toFixed(2)}`,
          `Rs. ${item.tax.toFixed(2)}`,
          `Rs. ${item.totalPrice.toFixed(2)}`
        ]);

        autoTable(doc, {
          startY: y + 42,
          head: headers,
          body: items,
          theme: 'grid',
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 30
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          styles: {
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 60 },
            5: { halign: 'right' }
          }
        });

        // --- Summary ---
        const {
          itemsTotal,
          discountTotal,
          shippingHandling,
          preTaxTotal,
          taxesForShipping,
          grandTotal
        } = formData.summary;

        const yPos = doc.lastAutoTable.finalY + 10;

        doc.setFillColor(lightGray);
        doc.roundedRect(120, yPos, 76, 42, 2, 2, 'F');

        const labels = [
          "Subtotal:",
          "Discount:",
          "Shipping & Handling:",
          "Pre-tax Total:",
          "Tax:"
        ];

        const values = [
          itemsTotal,
          discountTotal,
          shippingHandling,
          preTaxTotal,
          taxesForShipping
        ];

        doc.setFontSize(9);
        doc.setTextColor(secondaryColor);

        labels.forEach((label, idx) => {
          doc.text(label, 124, yPos + 8 + idx * 8);
          doc.text(`Rs. ${parseFloat(values[idx]).toFixed(2)}`, 192, yPos + 8 + idx * 8, { align: "right" });
        });

        // Grand Total
        doc.setDrawColor(primaryColor);
        doc.line(124, yPos + 41, 196, yPos + 41);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor);
        doc.text("GRAND TOTAL:", 124, yPos + 49);
        doc.text(`Rs. ${parseFloat(grandTotal).toFixed(2)}`, 192, yPos + 49, { align: "right" });

        // --- Terms ---
        const termsY = yPos + 65;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions", marginX, termsY);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(secondaryColor);
        const termsText = formData.termsAndConditions.text || 
          "Standard terms apply. Items are subject to availability. Payment due as per agreement.";
        const splitTerms = doc.splitTextToSize(termsText, 180);
        doc.text(splitTerms, marginX, termsY + 6);
      } else {
        doc.text("No items available for the order.", marginX, 90);
      }

      // --- Footer ---
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(primaryColor);
        doc.line(marginX, 280, 210 - marginX, 280);
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor);
        doc.text("Thank you for your business", marginX, 287);
        doc.text(`Page ${i} of ${pageCount}`, 210 - marginX, 287, { align: "right" });
      }

      doc.save("sales_order.pdf");

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF.");
    }
  };

  const handleBackClick = () => {
    router.push('/SaleteamDasboard/CustomerConverted');
  };

  const fieldInputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const fieldLabelClass =
    "mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Create Sales Order"
        subtitle="Capture order details, items and summary, then generate a PDF."
        onBack={handleBackClick}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sales Order Details */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Sales Order Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "customerName",
              "quoteNumber",
              "subject",
              "salesOrderDate",
              "assignedTo",
              "poNumber",
              "poDate",
              "paymentTerms",
            ].map((field) => (
              <div key={field}>
                <label className={fieldLabelClass}>
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type={field === "salesOrderDate" || field === "poDate" ? "date" : "text"}
                  name={`salesOrderDetails.${field}`}
                  value={formData.salesOrderDetails[field] || ""}
                  onChange={handleChange}
                  className={fieldInputClass}
                  required
                />
              </div>
            ))}

            {/* Status as a dropdown with custom option */}
            <div>
              <label className={fieldLabelClass}>Status</label>
              <select
                name="salesOrderDetails.status"
                value={["Pending", "Confirmed", "Shipped", "Delivered"].includes(formData.salesOrderDetails.status)
                  ? formData.salesOrderDetails.status
                  : "Custom"}
                onChange={handleChange}
                className={fieldInputClass}
                required
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>

              {/* Show custom status input if "Custom" is selected */}
              {!["Pending", "Confirmed", "Shipped", "Delivered"].includes(formData.salesOrderDetails.status) && (
                <input
                  type="text"
                  name="salesOrderDetails.customStatus"
                  value={formData.salesOrderDetails.customStatus}
                  onChange={handleChange}
                  placeholder="Enter custom status"
                  className={`${fieldInputClass} mt-2`}
                  required
                />
              )}
            </div>
          </div>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Terms and Conditions</h3>
          <textarea
            name="termsAndConditions.text"
            value={formData.termsAndConditions.text}
            onChange={handleChange}
            className={`${fieldInputClass} mt-4`}
            rows="5"
            placeholder="Enter Terms and Conditions"
          />
        </Card>

        {/* Items */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Items</h3>
          <div className="mt-4 space-y-4">
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                <div>
                  <label className={fieldLabelClass}>Item Name</label>
                  <select
                    className={fieldInputClass}
                    value={item.itemName}
                    onChange={(e) => handleItemSelect(e, index)}
                  >
                    <option value="">Select Item</option>
                    {products.map((product, i) => (
                      <option key={i} value={product.Model}>
                        {product.Model}
                      </option>
                    ))}
                  </select>
                </div>
                {["quantity", "listPrice", "discount", "tax", "totalPrice"].map((field) => (
                  <div key={field}>
                    <label className={fieldLabelClass}>
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                      type="number"
                      value={item[field]}
                      onChange={(e) => handleNestedChange(e, index, field)}
                      className={field === "totalPrice" ? `${fieldInputClass} bg-slate-100` : fieldInputClass}
                      required={field !== "discount" && field !== "tax"}
                      readOnly={field === "totalPrice"}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <SecondaryButton onClick={handleAddItem}>
              <Plus size={16} />
              Add Item
            </SecondaryButton>
          </div>
        </Card>

        {/* Summary */}
        <Card>
          <h3 className="text-base font-semibold text-slate-900">Summary</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["itemsTotal", "discountTotal", "shippingHandling", "preTaxTotal", "taxesForShipping",
              "transitInsurance", "installationCharges", "taxForInstallation", "adjustments", "grandTotal"].map((field) => (
              <div key={field}>
                <label className={fieldLabelClass}>
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                <input
                  type="number"
                  name={`summary.${field}`}
                  value={formData.summary[field]}
                  onChange={handleChange}
                  className={fieldInputClass}
                  required
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <PrimaryButton type="submit">
            Submit &amp; Generate PDF
          </PrimaryButton>
        </div>
      </form>
    </PageShell>
  );
};

export default Salesorder;
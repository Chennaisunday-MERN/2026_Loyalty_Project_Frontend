"use client";
import React, { useState, useEffect } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { PageShell, PageHeader, Card, PrimaryButton, LoadingBlock, ErrorBanner } from "../../_components/ui";

const Getpdf = () => {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchParams = useSearchParams();
  const enqid = searchParams.get("EnquiryNo");
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("admintokens") : null;
  const Eid = typeof window !== "undefined" ? localStorage.getItem("Eid") : null; // Assuming Eid is stored in localStorage

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5005/api/quotationEditOne/${enqid}/${Eid}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.data && response.data.data) {
          setFormData(response.data.data);
        } else {
          throw new Error("Data not available in /quotationEditOne");
        }
      } catch (error) {
        console.warn("Failed to fetch from /quotationEditOne. Trying /quotationGetOne...");
        try {
          const fallbackResponse = await axios.get(
            `http://localhost:5005/api/quotationGetOne/${enqid}/${Eid}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (fallbackResponse.data && fallbackResponse.data.data) {
            setFormData(fallbackResponse.data.data);
          } else {
            throw new Error("Data not available in /quotationGetOne");
          }
        } catch (fallbackError) {
          console.error("Failed to fetch data from both APIs:", fallbackError);
          setError(fallbackError.response?.data?.message || "Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (enqid && Eid && token) {
      fetchData();
    }
  }, [enqid, Eid, token]);

  const handleConvertToPDF = async () => {
    try {
      console.log("Generating PDF with data:", formData);

      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont("Helvetica");

      const page = pdfDoc.addPage([600, 800]);
      const { width, height } = page;

      let currentY = height - 50;
      page.drawText(`Quotation for Enquiry No: ${enqid}`, {
        x: 30,
        y: currentY,
        size: 18,
        font,
        color: rgb(0, 0, 0),
      });

      currentY -= 30;

      const tableHeaders = ["S. No", "HSN Code", "Unit Description", "UOM", "Quantity", "Unit Price", "Total"];
      const colWidths = [50, 80, 150, 60, 60, 80, 80];
      let xPosition = 30;

      tableHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: xPosition,
          y: currentY,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        xPosition += colWidths[index];
      });

      currentY -= 20;

      formData.forEach((row, index) => {
        xPosition = 30;
        const rowData = [
          index + 1,
          row.hsnCode,
          row.unitDescription,
          row.uom,
          row.quantity,
          row.unitPrice,
          (row.quantity * row.unitPrice).toFixed(2),
        ];
        rowData.forEach((cell, idx) => {
          page.drawText(cell.toString(), {
            x: xPosition,
            y: currentY,
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
          xPosition += colWidths[idx];
        });
        currentY -= 20;
      });

      currentY -= 20;
      page.drawText(
        `Total: Rs. ${formData.reduce((acc, row) => acc + (row.quantity * row.unitPrice), 0).toFixed(2)}`,
        {
          x: 30,
          y: currentY,
          size: 12,
          font,
          color: rgb(1, 0, 0),
        }
      );

      currentY -= 40;
      page.drawText(`Terms & Conditions:`, {
        x: 30,
        y: currentY,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });

      currentY -= 20;
      page.drawText(`1. Payments due within 30 days.`, { x: 30, y: currentY, size: 10, font });
      currentY -= 15;
      page.drawText(`2. Prices exclusive of taxes.`, { x: 30, y: currentY, size: 10, font });
      currentY -= 15;
      page.drawText(`3. Validity for 30 days.`, { x: 30, y: currentY, size: 10, font });

      const pdfBytes = await pdfDoc.save();
      console.log("PDF generated successfully!");

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Quotation_${enqid}.pdf`;
      link.click();

      console.log("PDF download triggered!");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Sales"
        title="Quotation Form"
        subtitle="Generate and download the quotation PDF."
        onBack={() => router.push("/SaleteamDasboard/Dasboard")}
      />

      <Card>
        {loading ? (
          <LoadingBlock label="Loading data…" />
        ) : error ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : (
          <PrimaryButton onClick={handleConvertToPDF}>
            <Download size={16} />
            Generate PDF
          </PrimaryButton>
        )}
      </Card>
    </PageShell>
  );
};

export default Getpdf;

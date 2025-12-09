/**
 * Petition export utilities (CSV and PDF)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateForInput } from "../../utils/dateUtils";

/**
 * Export petitions to CSV format
 * @param {Array} petitions - Array of petition objects
 * @param {Function} t - Translation function
 * @returns {Promise<void>}
 */
export const exportPetitionsToCSV = async (petitions, t) => {
  try {
    const headers = [
      t("viewAllPetitions.petitionNumber"),
      t("viewAllPetitions.propertyAddress"),
      t("viewAllPetitions.borrower"),
      t("viewAllPetitions.status"),
      t("viewAllPetitions.filingDate"),
      t("viewAllPetitions.lastUpdated"),
    ];
    
    const csvContent = [
      headers.join(","),
      ...petitions.map((petition) =>
        [
          petition.petitionNumber || petition.id,
          `"${petition.propertyAddress}"`,
          `"${petition.borrower}"`,
          petition.status,
          petition.filingDate,
          petition.lastUpdated,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `petitions_${formatDateForInput(new Date())}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(err?.message || "Failed to export CSV");
  }
};

/**
 * Export petitions to PDF format
 * @param {Array} petitions - Array of petition objects
 * @param {Function} t - Translation function
 * @returns {Promise<void>}
 */
export const exportPetitionsToPDF = async (petitions, t) => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(t("viewAllPetitions.title") + " Report", 14, 22);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

    // Prepare table data
    const headers = [
      t("viewAllPetitions.petitionNumber"),
      t("viewAllPetitions.propertyAddress"),
      t("viewAllPetitions.borrower"),
      t("viewAllPetitions.status"),
      t("viewAllPetitions.filingDate"),
      t("viewAllPetitions.lastUpdated"),
    ];
    
    const tableData = petitions.map((petition) => [
      petition.petitionNumber || petition.id,
      petition.propertyAddress,
      petition.borrower,
      petition.status,
      petition.filingDate,
      petition.lastUpdated,
    ]);

    // Add table using autoTable plugin
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [52, 73, 94], // Dark blue-gray color
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Light gray for alternating rows
      },
      margin: { top: 40 },
      columnStyles: {
        0: { cellWidth: 25 }, // Petition Number
        1: { cellWidth: 60 }, // Property Address
        2: { cellWidth: 30 }, // Borrower
        3: { cellWidth: 20 }, // Status
        4: { cellWidth: 25 }, // Filing Date
        5: { cellWidth: 25 }, // Last Updated
      },
    });

    // Add summary at the bottom
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(t("viewAllPetitions.totalPetitions", { count: petitions.length }), 14, finalY);

    // Save the PDF
    doc.save(`petitions_${formatDateForInput(new Date())}.pdf`);
  } catch (err) {
    throw new Error(err?.message || "Failed to export PDF");
  }
};

/**
 * Export petitions in specified format
 * @param {Array} petitions - Array of petition objects
 * @param {string} format - Export format ('csv' or 'pdf')
 * @param {Function} t - Translation function
 * @returns {Promise<void>}
 */
export const exportPetitions = async (petitions, format, t) => {
  if (format === "csv") {
    await exportPetitionsToCSV(petitions, t);
  } else if (format === "pdf") {
    await exportPetitionsToPDF(petitions, t);
  } else {
    throw new Error(`Unsupported export format: ${format}`);
  }
};


import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { LcboInvoice } from "./lcbo";

const money = (value: number) => `$${value.toFixed(2)}`;

export function createLcboPdf(invoice: LcboInvoice) {
  const document = new jsPDF({ format: "letter", unit: "pt" });
  const pageWidth = document.internal.pageSize.getWidth();

  document.setFillColor(24, 44, 37);
  document.rect(0, 0, pageWidth, 126, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(22);
  document.text("LCBO Invoice Calculation", 42, 48);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(209, 224, 217);
  document.text(`Order ${invoice.orderNumber}`, 42, 75);
  document.text(`Order date: ${invoice.orderDate}`, 42, 94);
  document.text(`Expected delivery: ${invoice.expectedDeliveryDate}`, 240, 94);

  const summary = [
    ["Calculated product total", money(invoice.totals.calculatedProductTotal)],
    ["Delivery fee", money(invoice.totals.deliveryFee)],
    ["HST included", money(invoice.totals.hstIncluded)],
    ["Container deposit", money(invoice.totals.containerDepositIncluded)],
    ["Invoice total", money(invoice.totals.total)],
  ];

  autoTable(document, {
    startY: 150,
    head: [["Invoice summary", "Amount"]],
    body: summary,
    theme: "plain",
    margin: { left: 42, right: 42 },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 7 },
    headStyles: { fillColor: [232, 240, 235], textColor: [24, 87, 68], fontStyle: "bold" },
    bodyStyles: { textColor: [42, 50, 47] },
    columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    didParseCell: ({ section, row, cell }) => {
      if (section === "body" && row.index === summary.length - 1) {
        cell.styles.fillColor = [24, 44, 37];
        cell.styles.textColor = [255, 255, 255];
        cell.styles.fontStyle = "bold";
      }
    },
  });

  const summaryTable = document as jsPDF & { lastAutoTable: { finalY: number } };
  autoTable(document, {
    startY: summaryTable.lastAutoTable.finalY + 26,
    head: [["Product", "Qty", "Unit", "Deposit", "Net unit", "Product total"]],
    body: invoice.items.map((item) => [
      `${item.name}\nLCBO #${item.lcboNumber} - ${item.sizeMl} mL`,
      String(item.quantityFulfilled),
      money(item.unitPrice),
      money(item.bottleDeposit),
      `$${item.netUnitPrice.toFixed(4)}`,
      money(item.calculatedTotal),
    ]),
    theme: "striped",
    margin: { left: 42, right: 42, bottom: 38 },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 6, valign: "middle" },
    headStyles: { fillColor: [24, 87, 68], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [246, 248, 246] },
    columnStyles: {
      0: { cellWidth: 218 },
      1: { cellWidth: 34, halign: "center" },
      2: { cellWidth: 68, halign: "right" },
      3: { cellWidth: 62, halign: "right" },
      4: { cellWidth: 72, halign: "right" },
      5: { cellWidth: 74, halign: "right", fontStyle: "bold" },
    },
    didDrawPage: () => {
      const pageNumber = document.getNumberOfPages();
      const pageHeight = document.internal.pageSize.getHeight();
      document.setFont("helvetica", "normal");
      document.setFontSize(8);
      document.setTextColor(110, 120, 116);
      document.text(`EZ Invoice  |  Page ${pageNumber}`, pageWidth - 42, pageHeight - 18, {
        align: "right",
      });
    },
  });

  return new Uint8Array(document.output("arraybuffer"));
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { LcboInvoice } from "./lcbo";

const money = (value: number) => `$${value.toFixed(2)}`;
const signedMoney = (value: number) => {
  if (value === 0) return money(0);
  return `${value > 0 ? "+" : "-"}${money(Math.abs(value))}`;
};
const navy: [number, number, number] = [11, 31, 58];
const blue: [number, number, number] = [35, 111, 180];
const lightBlue: [number, number, number] = [235, 245, 253];

function drawInvoiceLogo(document: jsPDF, x: number, y: number, width: number) {
  const scale = width / 48;

  document.setDrawColor(159, 211, 255);
  document.setLineWidth(4.6 * scale);
  document.setLineCap("round");
  document.setLineJoin("round");
  document.lines(
    [
      [14 * scale, 0],
      [5 * scale, 2.5 * scale],
      [6.2 * scale, 7 * scale],
    ],
    x + 4 * scale,
    y + 7 * scale,
    [1, 1],
    "S",
    false,
  );
  document.lines(
    [
      [12 * scale, 0],
      [5 * scale, 2.5 * scale],
      [5 * scale, 5.5 * scale],
    ],
    x + 4 * scale,
    y + 18 * scale,
    [1, 1],
    "S",
    false,
  );
  document.lines(
    [
      [10 * scale, 0],
      [5 * scale, 2.5 * scale],
      [3.2 * scale, 3.5 * scale],
      [21.8 * scale, -26 * scale],
    ],
    x + 4 * scale,
    y + 29 * scale,
    [1, 1],
    "S",
    false,
  );
}

export function createLcboPdf(invoice: LcboInvoice) {
  const document = new jsPDF({ format: "letter", unit: "pt" });
  const pageWidth = document.internal.pageSize.getWidth();

  document.setFillColor(...navy);
  document.rect(0, 0, pageWidth, 126, "F");
  drawInvoiceLogo(document, 42, 31, 40);
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(22);
  document.text("LCBO Invoice Calculation", 88, 50);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(211, 230, 247);
  document.text(`Order ${invoice.orderNumber}`, 42, 74);
  document.text(`Order date: ${invoice.orderDate}`, 42, 94);
  document.text(
    invoice.expectedDeliveryDate
      ? `Expected delivery: ${invoice.expectedDeliveryDate}`
      : "Expected delivery: Not provided",
    330,
    94,
  );

  autoTable(document, {
    startY: 150,
    head: [["Product", "Ordered", "Unit", "Deposit", "Fulfilled", "Net unit", "Product total"]],
    body: invoice.items.map((item) => [
      `${item.name}\nLCBO #${item.lcboNumber} - ${item.sizeMl} mL`,
      String(item.quantityOrdered),
      money(item.unitPrice),
      money(item.bottleDeposit),
      String(item.quantityFulfilled),
      `$${item.netUnitPrice.toFixed(4)}`,
      money(item.calculatedTotal),
    ]),
    theme: "striped",
    margin: { left: 42, right: 42, bottom: 38 },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 6, textColor: navy, valign: "middle" },
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: lightBlue },
    columnStyles: {
      0: { cellWidth: 176 },
      1: { cellWidth: 48, halign: "center" },
      2: { cellWidth: 60, halign: "right" },
      3: { cellWidth: 58, halign: "right" },
      4: { cellWidth: 48, halign: "center" },
      5: { cellWidth: 64, halign: "right" },
      6: { cellWidth: 74, halign: "right", fontStyle: "bold" },
    },
    didDrawCell: ({ column, cell }) => {
      if (column.index === 4) {
        document.setDrawColor(...blue);
        document.setLineWidth(0.7);
        document.line(cell.x, cell.y, cell.x, cell.y + cell.height);
      }
    },
    didDrawPage: () => {
      const pageNumber = document.getNumberOfPages();
      const pageHeight = document.internal.pageSize.getHeight();
      document.setFont("helvetica", "normal");
      document.setFontSize(8);
      document.setTextColor(...navy);
      document.text(`EZ Invoice  |  Page ${pageNumber}`, pageWidth - 42, pageHeight - 18, {
        align: "right",
      });
    },
  });

  const productTable = document as jsPDF & { lastAutoTable: { finalY: number } };
  const summary = [
    ["Calculated product total", money(invoice.totals.calculatedProductTotal)],
    ["Delivery fee", invoice.totals.deliveryFee === null ? "Not provided" : money(invoice.totals.deliveryFee)],
    ["HST included", money(invoice.totals.hstIncluded)],
    ["Container deposit", money(invoice.totals.containerDepositIncluded)],
    ["Calculated invoice total", money(invoice.totals.calculatedInvoiceTotal)],
    ["LCBO invoice total", money(invoice.totals.total)],
    ["Difference", signedMoney(invoice.totals.difference)],
  ];

  autoTable(document, {
    startY: productTable.lastAutoTable.finalY + 22,
    head: [["Invoice summary", "Amount"]],
    body: summary,
    theme: "plain",
    margin: { left: 42, right: 42, bottom: 38 },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 5, textColor: navy },
    headStyles: { fillColor: lightBlue, textColor: navy, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 390 },
      1: { cellWidth: 138, halign: "right", fontStyle: "bold" },
    },
    didParseCell: ({ section, row, column, cell }) => {
      if (column.index === 1) cell.styles.halign = "right";
      if (section === "body" && row.index === summary.length - 2) {
        cell.styles.fillColor = navy;
        cell.styles.textColor = [255, 255, 255];
        cell.styles.fontStyle = "bold";
      }
      if (section === "body" && row.index === summary.length - 1) {
        cell.styles.fillColor = lightBlue;
        cell.styles.textColor = navy;
        cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => {
      const pageNumber = document.getNumberOfPages();
      const pageHeight = document.internal.pageSize.getHeight();
      document.setFont("helvetica", "normal");
      document.setFontSize(8);
      document.setTextColor(...navy);
      document.text(`EZ Invoice  |  Page ${pageNumber}`, pageWidth - 42, pageHeight - 18, {
        align: "right",
      });
    },
  });

  return new Uint8Array(document.output("arraybuffer"));
}

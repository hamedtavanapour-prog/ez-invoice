import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import type { BeerStoreInvoice } from "./beer-store";

const money = (value: number) => `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const navy: [number, number, number] = [11, 31, 58];
const blue: [number, number, number] = [35, 111, 180];
const lightBlue: [number, number, number] = [235, 245, 253];

function drawInvoiceLogo(document: jsPDF, x: number, y: number, width: number) {
  const scale = width / 48;
  document.setDrawColor(159, 211, 255);
  document.setLineWidth(4.6 * scale);
  document.setLineCap("round");
  document.setLineJoin("round");
  document.lines([[14 * scale, 0], [5 * scale, 2.5 * scale], [6.2 * scale, 7 * scale]], x + 4 * scale, y + 7 * scale, [1, 1], "S", false);
  document.lines([[12 * scale, 0], [5 * scale, 2.5 * scale], [5 * scale, 5.5 * scale]], x + 4 * scale, y + 18 * scale, [1, 1], "S", false);
  document.lines([[10 * scale, 0], [5 * scale, 2.5 * scale], [3.2 * scale, 3.5 * scale], [21.8 * scale, -26 * scale]], x + 4 * scale, y + 29 * scale, [1, 1], "S", false);
}

export function createBeerStorePdf(invoice: BeerStoreInvoice) {
  const document = new jsPDF({ format: "letter", unit: "pt" });
  const pageWidth = document.internal.pageSize.getWidth();

  document.setFillColor(...navy);
  document.rect(0, 0, pageWidth, 126, "F");
  drawInvoiceLogo(document, 42, 31, 40);
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(22);
  document.text("Beer Store Invoice Summary", 88, 50);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(211, 230, 247);
  document.text(`Invoice ${invoice.invoiceNumber}`, 88, 74);
  document.text(`Delivery date: ${invoice.deliveryDate}`, 42, 94);

  autoTable(document, {
    startY: 150,
    head: [["Product", "Size", "Pack code", "Package", "Shipped", "Unit price", "Line total"]],
    body: invoice.items.map((item) => [
      `${item.name}\nArticle #${item.articleNumber}`,
      `${item.sizeValue} ${item.sizeUnit}`,
      item.packageCode,
      item.packageUnit,
      String(item.quantityShipped),
      money(item.unitPrice),
      money(item.extendedPrice),
    ]),
    theme: "striped",
    margin: { left: 42, right: 42, bottom: 38 },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 6, textColor: navy, valign: "middle" },
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: lightBlue },
    columnStyles: {
      0: { cellWidth: 172 },
      1: { cellWidth: 54 },
      2: { cellWidth: 62 },
      3: { cellWidth: 54, halign: "center" },
      4: { cellWidth: 52, halign: "center" },
      5: { cellWidth: 66, halign: "right" },
      6: { cellWidth: 68, halign: "right", fontStyle: "bold" },
    },
    didDrawPage: () => drawFooter(document, pageWidth),
  });

  const productTable = document as jsPDF & { lastAutoTable: { finalY: number } };
  const summary: string[][] = [
    ["Bottle quantity (bottles, cans and other)", String(invoice.packages.bottleQuantity)],
    ["Bottle deposit", money(invoice.packages.bottleDeposit)],
    ["Keg quantity", String(invoice.packages.kegQuantity)],
    ["Keg deposit", money(invoice.packages.kegDeposit)],
    ["HST", money(invoice.totals.hst)],
  ];
  if (invoice.totals.emergencyOrderFee !== null) {
    summary.push(["Emergency order fee", money(invoice.totals.emergencyOrderFee)]);
  }
  summary.push(
    ["Fuel charge", money(invoice.totals.fuelCharge)],
    ["Delivery fee", money(invoice.totals.deliveryFee)],
    ["Order total", money(invoice.totals.orderTotal)],
  );

  autoTable(document, {
    startY: productTable.lastAutoTable.finalY + 22,
    head: [["Invoice summary", "Amount"]],
    body: summary,
    theme: "plain",
    margin: { left: 42, right: 42, bottom: 38 },
    styles: { font: "helvetica", fontSize: 10, cellPadding: 5, textColor: navy },
    headStyles: { fillColor: lightBlue, textColor: navy, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 390 }, 1: { cellWidth: 138, halign: "right", fontStyle: "bold" } },
    didParseCell: ({ section, row, column, cell }) => {
      if (column.index === 1) cell.styles.halign = "right";
      if (section === "body" && row.index === summary.length - 1) {
        cell.styles.fillColor = navy;
        cell.styles.textColor = [255, 255, 255];
        cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => drawFooter(document, pageWidth),
  });

  return new Uint8Array(document.output("arraybuffer"));
}

function drawFooter(document: jsPDF, pageWidth: number) {
  const pageHeight = document.internal.pageSize.getHeight();
  document.setFont("helvetica", "normal");
  document.setFontSize(8);
  document.setTextColor(...navy);
  document.text(`EZ Invoice  |  Page ${document.getNumberOfPages()}`, pageWidth - 42, pageHeight - 18, { align: "right" });
}

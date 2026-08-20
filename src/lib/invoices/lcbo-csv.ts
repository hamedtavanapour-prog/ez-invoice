import type { LcboInvoice } from "./lcbo";

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createLcboCsv(invoice: LcboInvoice) {
  const rows: Array<Array<string | number>> = [
    ["LCBO Invoice Calculation"],
    ["Order Number", invoice.orderNumber],
    ["Order Date", invoice.orderDate],
    ["Expected Delivery Date", invoice.expectedDeliveryDate],
    [],
    [
      "Item Name",
      "LCBO Number",
      "Size mL",
      "Quantity Fulfilled",
      "Unit Price",
      "Bottle Deposit",
      "Net Unit Price",
      "Calculated Total",
    ],
    ...invoice.items.map((item) => [
      item.name,
      item.lcboNumber,
      item.sizeMl,
      item.quantityFulfilled,
      item.unitPrice.toFixed(2),
      item.bottleDeposit.toFixed(2),
      item.netUnitPrice.toFixed(4),
      item.calculatedTotal.toFixed(2),
    ]),
    [],
    ["Calculated Product Total", invoice.totals.calculatedProductTotal.toFixed(2)],
    ["Invoice Total", invoice.totals.total.toFixed(2)],
    ["Delivery Fee", invoice.totals.deliveryFee.toFixed(2)],
    ["HST Included", invoice.totals.hstIncluded.toFixed(2)],
    ["Container Deposit", invoice.totals.containerDepositIncluded.toFixed(2)],
  ];

  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

import assert from "node:assert/strict";
import test from "node:test";

import { createLcboPdf } from "./lcbo-pdf.ts";
import type { LcboInvoice } from "./lcbo.ts";

const invoice: LcboInvoice = {
  orderNumber: "12345678",
  orderDate: "2026-08-01 16:26",
  expectedDeliveryDate: "2026-08-05",
  items: [{
    name: "PRODUCT RESERVE",
    lcboNumber: "456095",
    quantityOrdered: 3,
    quantityFulfilled: 2,
    unitPrice: 30.12,
    bottleDeposit: 0.2,
    sizeMl: 750,
    expectedDeliveryDate: "2026-08-05",
    netUnitPrice: 26.4778761062,
    calculatedTotal: 52.96,
  }],
  totals: {
    deliveryFee: 5,
    total: 60.24,
    hstIncluded: 7.58,
    containerDepositIncluded: 0.4,
    calculatedProductTotal: 52.96,
    calculatedInvoiceTotal: 65.94,
    difference: -5.7,
  },
};

test("creates a valid LCBO calculation PDF", () => {
  const pdf = createLcboPdf(invoice);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 4)), "%PDF");
  assert.ok(pdf.byteLength > 2_000);
});

test("creates an LCBO PDF without an order number", () => {
  const pdf = createLcboPdf({ ...invoice, orderNumber: null });
  assert.equal(new TextDecoder().decode(pdf.slice(0, 4)), "%PDF");
  assert.ok(pdf.byteLength > 2_000);
});

test("creates an LCBO PDF without an order date", () => {
  const pdf = createLcboPdf({ ...invoice, orderDate: null });
  assert.equal(new TextDecoder().decode(pdf.slice(0, 4)), "%PDF");
  assert.ok(pdf.byteLength > 2_000);
});

import assert from "node:assert/strict";
import test from "node:test";

import { createLcboCsv } from "./lcbo-csv.ts";
import type { LcboInvoice } from "./lcbo.ts";

const invoice: LcboInvoice = {
  orderNumber: "12345678",
  orderDate: "2026-08-01 16:26",
  expectedDeliveryDate: "2026-08-05",
  items: [
    {
      name: 'PRODUCT, "RESERVE"',
      lcboNumber: "456095",
      quantityFulfilled: 2,
      unitPrice: 30.12,
      bottleDeposit: 0.2,
      sizeMl: 750,
      expectedDeliveryDate: "2026-08-05",
      netUnitPrice: 26.4778761062,
      calculatedTotal: 52.96,
    },
  ],
  totals: {
    deliveryFee: 5,
    total: 60.24,
    hstIncluded: 7.58,
    containerDepositIncluded: 0.4,
    calculatedProductTotal: 52.96,
  },
};

test("exports LCBO results with escaped names and fixed decimal precision", () => {
  const csv = createLcboCsv(invoice);

  assert.match(csv, /"PRODUCT, ""RESERVE"""/);
  assert.match(csv, /26\.4779/);
  assert.match(csv, /HST Included,7\.58/);
  assert.doesNotMatch(csv, /Delivery Tax/);
});

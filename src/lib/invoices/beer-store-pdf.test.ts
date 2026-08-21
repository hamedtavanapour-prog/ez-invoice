import assert from "node:assert/strict";
import test from "node:test";

import { createBeerStorePdf } from "./beer-store-pdf.ts";
import type { BeerStoreInvoice } from "./beer-store.ts";

const invoice: BeerStoreInvoice = {
  invoiceNumber: "9305990191",
  deliveryDate: "04-Aug-2026",
  items: [{
    articleNumber: "3917355",
    name: "CORONA CERO",
    rawDescription: "CORONA CERO, 330ML 24EB BTL",
    sizeValue: 330,
    sizeUnit: "ML",
    packageCode: "24EB",
    packageUnit: "BTL",
    quantityShipped: 4,
    unitPrice: 38.96,
    extendedPrice: 155.84,
  }],
  packages: { bottleQuantity: 9, bottleDeposit: 21.6, kegQuantity: 6, kegDeposit: 300 },
  totals: { hst: 362.14, emergencyOrderFee: null, fuelCharge: 15.43, deliveryFee: 36.05, orderTotal: 3469.09 },
};

test("creates a valid Beer Store summary PDF", () => {
  const pdf = createBeerStorePdf(invoice);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 4)), "%PDF");
  assert.ok(pdf.byteLength > 2_000);
});

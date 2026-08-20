import assert from "node:assert/strict";
import test from "node:test";

import { calculateLcboItem, parseLcboInvoiceText } from "./lcbo.ts";

const sampleText = `
Your order # 12345678 has been shipped.
ORDER DATE
2026-08-01 16:26
ITEM DESCRIPTION PRICE
FIRST PRODUCT NAME
CONTINUED NAME
LCBO#: 456095
Quantity Ordered: 2
Quantity Fulfilled: 2
Unit Price: $30.12
Bottle Deposit(incl.): $0.20
Size mL: 750
Expected Delivery Date: 2026-08-05
$60.24
SECOND PRODUCT
LCBO#: 17835
Quantity Fulfilled: 24
$177.12
-- 2 of 3 --
ITEM DESCRIPTION PRICE
Unit Price: $7.38
Bottle Deposit(incl.): $0.10
Size mL: 200
Expected Delivery Date: 2026-08-05
Delivery Fee: $5.00
Delivery Tax: $0.65
Total: $249.50
HST Included in Total: $28.70
Container Deposit Included in Total: $2.80
`;

test("calculates a product after removing deposit and HST", () => {
  const result = calculateLcboItem({
    unitPrice: 30.12,
    bottleDeposit: 0.2,
    quantityFulfilled: 2,
  });

  assert.equal(result.calculatedTotal, 52.96);
  assert.ok(Math.abs(result.netUnitPrice - 26.4778761062) < 0.000001);
});

test("parses LCBO fields, multi-line names, and page-split items", () => {
  const invoice = parseLcboInvoiceText(sampleText);

  assert.equal(invoice.orderNumber, "12345678");
  assert.equal(invoice.orderDate, "2026-08-01 16:26");
  assert.equal(invoice.expectedDeliveryDate, "2026-08-05");
  assert.equal(invoice.items.length, 2);
  assert.equal(invoice.items[0].name, "FIRST PRODUCT NAME CONTINUED NAME");
  assert.equal(invoice.items[1].unitPrice, 7.38);
  assert.equal(invoice.items[1].calculatedTotal, 154.62);
  assert.equal(invoice.totals.calculatedProductTotal, 207.58);
  assert.equal(invoice.totals.deliveryFee, 5);
  assert.equal(invoice.totals.hstIncluded, 29.35);
  assert.equal("deliveryTax" in invoice.totals, false);
});

import assert from "node:assert/strict";
import test from "node:test";

import { calculateBeerStoreItem, parseBeerStoreInvoiceText } from "./beer-store.ts";

function invoiceText({ emergency = false, cans = false } = {}) {
  return `
9305990191\tInvoice Number
04-Aug-2026\tDelivery Date
70062067424976   3917355   CORONA CERO, 330ML 24EB BTL   4   4   38.96   155.84
017856   062067382444   2597355   CORONA, 330ML 24EB BTL REFILL   5   5   72.96   364.80
70083641303092   2388300   CREEMORE LAGER, 50L 50FK KEG   2   2   199.95   399.90
${cans ? "70054133908457   3193000   GUINNESS 0.0, 440ML 24LC CAN   2   2   40.00   80.00" : ""}
Bottles ${cans ? 4 : 9} ${cans ? "9.60" : "21.60"} 57.44
Cans ${cans ? 2 : 0} ${cans ? "4.80" : "0.00"} 0.00
Kegs 6 300.00 298.01
Other 0 0.00 6.69
TOTALS 15 321.60 362.14
Order Total $3,469.09
${emergency ? "Emergency Order Fee $175.00" : ""}
FuelCharge(Flat Amt) $15.43
Delivery Fee $36.05
`;
}

test("parses Beer Store products, package details, and totals", () => {
  const invoice = parseBeerStoreInvoiceText(invoiceText());

  assert.equal(invoice.invoiceNumber, "9305990191");
  assert.equal(invoice.deliveryDate, "04-Aug-2026");
  assert.equal(invoice.items.length, 3);
  assert.deepEqual(invoice.items[0], {
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
    deposit: 2.4,
    netUnitPrice: 32.35398230088496,
    calculatedTotal: 129.42,
  });
  assert.equal(invoice.items[1].rawDescription.endsWith("REFILL"), true);
  assert.equal(invoice.items[1].packageUnit, "BTL");
  assert.equal(invoice.items[2].sizeValue, 50);
  assert.equal(invoice.items[2].sizeUnit, "L");
  assert.equal(invoice.items[2].packageUnit, "KEG");
  assert.deepEqual(invoice.packages, { bottleQuantity: 9, bottleDeposit: 21.6, kegQuantity: 6, kegDeposit: 300 });
  assert.deepEqual(invoice.totals, {
    hst: 362.14,
    emergencyOrderFee: null,
    fuelCharge: 15.43,
    deliveryFee: 36.05,
    orderTotal: 3469.09,
    calculatedProductTotal: 707.03,
    calculatedInvoiceTotal: 1442.25,
    difference: 2026.84,
  });
});

test("combines bottles, cans, and other while keeping kegs separate", () => {
  const invoice = parseBeerStoreInvoiceText(invoiceText({ cans: true }));
  assert.equal(invoice.items.at(-1)?.packageUnit, "CAN");
  assert.equal(invoice.packages.bottleQuantity, 6);
  assert.equal(invoice.packages.bottleDeposit, 14.4);
  assert.equal(invoice.packages.kegQuantity, 6);
});

test("reads an optional emergency order fee when present", () => {
  const invoice = parseBeerStoreInvoiceText(invoiceText({ emergency: true }));
  assert.equal(invoice.totals.emergencyOrderFee, 175);
});

test("parses a product description when the comma is omitted", () => {
  const invoice = parseBeerStoreInvoiceText(
    invoiceText().replace("CREEMORE LAGER, 50L 50FK KEG", "MICHELOB ULTRA 58.6L 58.6PK KEG"),
  );
  assert.equal(invoice.items[2].name, "MICHELOB ULTRA");
  assert.equal(invoice.items[2].sizeValue, 58.6);
  assert.equal(invoice.items[2].packageCode, "58.6PK");
});

test("uses a $30 deposit for a 30 L keg", () => {
  const calculation = calculateBeerStoreItem({
    sizeValue: 30,
    sizeUnit: "L",
    packageCode: "30PK",
    packageUnit: "KEG",
    quantityShipped: 2,
    unitPrice: 300,
  });

  assert.equal(calculation.deposit, 30);
  assert.equal(calculation.calculatedTotal, 477.88);
});

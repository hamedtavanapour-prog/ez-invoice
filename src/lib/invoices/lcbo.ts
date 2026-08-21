export type LcboItem = {
  name: string;
  lcboNumber: string;
  quantityOrdered: number;
  quantityFulfilled: number;
  unitPrice: number;
  bottleDeposit: number;
  sizeMl: number;
  expectedDeliveryDate: string | null;
  netUnitPrice: number;
  calculatedTotal: number;
};

export type LcboInvoice = {
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  items: LcboItem[];
  totals: {
    deliveryFee: number | null;
    total: number;
    hstIncluded: number;
    containerDepositIncluded: number;
    calculatedProductTotal: number;
    calculatedInvoiceTotal: number;
    difference: number;
  };
};

const FIELD_PREFIX = /^(?:LCBO#|Quantity Ordered|Quantity Fulfilled|Unit Price|Bottle Deposit|Size mL|Expected Delivery Date|Subtotal|Delivery Fee|Delivery Tax|Total|HST Included|Container Deposit)/i;

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseMoney(value: string) {
  return Number(value.replace(/[$,\s]/g, ""));
}

function requireMatch(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match?.[1]) throw new Error(`Could not read ${label} from this LCBO invoice.`);
  return match[1].trim();
}

function isPageArtifact(line: string) {
  return (
    /^https?:\/\//i.test(line) ||
    /^-- \d+ of \d+ --$/.test(line) ||
    /^Page \d+ of \d+(?:\s+https?:\/\/.*)?$/i.test(line) ||
    /^\d{4}-\d{2}-\d{2},\s+\d{1,2}:\d{2}\s+(?:AM|PM)$/i.test(line) ||
    /^\d{1,2}\/\d{1,2}\/\d{2},.*Gmail -/i.test(line) ||
    /^\d+\/\d+$/.test(line)
  );
}

function isNameBoundary(line: string) {
  return (
    /^\$[\d,]+\.\d{2}$/.test(line) ||
    FIELD_PREFIX.test(line) ||
    /^(?:BILL TO|ITEM DESCRIPTION(?:\s+PRICE)?|PRICE|Order Details)$/i.test(line)
  );
}

function readItemName(lines: string[], lcboIndex: number) {
  const nameLines: string[] = [];

  for (let index = lcboIndex - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (isPageArtifact(line)) continue;
    if (isNameBoundary(line)) break;

    const withoutPrice = line.replace(/\s+\$[\d,]+\.\d{2}\s*$/, "").trim();
    if (withoutPrice) nameLines.unshift(withoutPrice);
  }

  if (!nameLines.length) throw new Error("Could not read an LCBO item name.");
  return nameLines.join(" ").replace(/\s+/g, " ");
}

export function calculateLcboItem(
  item: Pick<LcboItem, "unitPrice" | "bottleDeposit" | "quantityFulfilled">,
) {
  const netUnitPrice = (item.unitPrice - item.bottleDeposit) / 1.13;
  return {
    netUnitPrice,
    calculatedTotal: roundCurrency(netUnitPrice * item.quantityFulfilled),
  };
}

export function parseLcboInvoiceText(rawText: string): LcboInvoice {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const orderNumber =
    rawText.match(/Your order\s*#\s*(\d+)/i)?.[1] ??
    requireMatch(rawText, /ORDER NUMBER\s+(\d+)/i, "order number");
  const orderDate = requireMatch(
    rawText,
    /\b(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\b/,
    "order date",
  );

  const lcboIndexes = lines.reduce<number[]>((indexes, line, index) => {
    if (/^LCBO#:\s*\d+/i.test(line)) indexes.push(index);
    return indexes;
  }, []);

  if (!lcboIndexes.length) {
    throw new Error("No LCBO products were found. Use the shipped-order invoice PDF.");
  }

  const items = lcboIndexes.map((lcboIndex, itemIndex): LcboItem => {
    const nextIndex = lcboIndexes[itemIndex + 1] ?? lines.length;
    const itemText = lines.slice(lcboIndex, nextIndex).join("\n");
    const quantityOrdered = Number(
      requireMatch(itemText, /Quantity Ordered:\s*(\d+)/i, "quantity ordered"),
    );
    const quantityFulfilled = Number(
      requireMatch(itemText, /Quantity Fulfilled:\s*(\d+)/i, "quantity fulfilled"),
    );
    const unitPrice = parseMoney(
      requireMatch(itemText, /Unit Price:\s*(\$[\d,.]+)/i, "unit price"),
    );
    const bottleDeposit = parseMoney(
      requireMatch(
        itemText,
        /Bottle Deposit\s*\(incl\.\):\s*(\$[\d,.]+)/i,
        "bottle deposit",
      ),
    );
    const calculation = calculateLcboItem({
      unitPrice,
      bottleDeposit,
      quantityFulfilled,
    });

    return {
      name: readItemName(lines, lcboIndex),
      lcboNumber: requireMatch(itemText, /^LCBO#:\s*(\d+)/im, "LCBO number"),
      quantityOrdered,
      quantityFulfilled,
      unitPrice,
      bottleDeposit,
      sizeMl: Number(requireMatch(itemText, /Size mL:\s*(\d+)/i, "bottle size")),
      expectedDeliveryDate:
        itemText.match(/Expected Delivery Date:\s*(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null,
      ...calculation,
    };
  });

  const total = parseMoney(
    requireMatch(rawText, /^Total\s*:\s*(\$[\d,.]+)/im, "invoice total"),
  );
  const deliveryFeeMatch = rawText.match(/^Delivery\s+Fee\s*:\s*(\$[\d,.]+)/im)?.[1];
  const deliveryFee = deliveryFeeMatch ? parseMoney(deliveryFeeMatch) : null;
  const deliveryTaxMatch = rawText.match(/^Delivery\s+Tax\s*:\s*(\$[\d,.]+)/im)?.[1];
  const deliveryTax = deliveryTaxMatch ? parseMoney(deliveryTaxMatch) : 0;
  const invoiceHstIncluded = parseMoney(
    requireMatch(
      rawText,
      /^HST\s+Included\s+in\s+Total\s*:\s*(\$[\d,.]+)/im,
      "included HST",
    ),
  );
  const containerDepositIncluded = parseMoney(
    requireMatch(
      rawText,
      /^Container\s+Deposit\s+Included\s+in\s+Total\s*:\s*(\$[\d,.]+)/im,
      "container deposit total",
    ),
  );
  const calculatedProductTotal = roundCurrency(
    items.reduce((sum, item) => sum + item.calculatedTotal, 0),
  );
  const calculatedInvoiceTotal =
    calculatedProductTotal +
    (deliveryFee ?? 0) +
    roundCurrency(invoiceHstIncluded + deliveryTax) +
    containerDepositIncluded;

  return {
    orderNumber,
    orderDate,
    expectedDeliveryDate:
      items.find((item) => item.expectedDeliveryDate)?.expectedDeliveryDate ?? null,
    items,
    totals: {
      deliveryFee,
      total,
      hstIncluded: roundCurrency(invoiceHstIncluded + deliveryTax),
      containerDepositIncluded,
      calculatedProductTotal,
      calculatedInvoiceTotal: roundCurrency(calculatedInvoiceTotal),
      difference: roundCurrency(total - calculatedInvoiceTotal),
    },
  };
}

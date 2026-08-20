export type LcboItem = {
  name: string;
  lcboNumber: string;
  quantityFulfilled: number;
  unitPrice: number;
  bottleDeposit: number;
  sizeMl: number;
  expectedDeliveryDate: string;
  netUnitPrice: number;
  calculatedTotal: number;
};

export type LcboInvoice = {
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: LcboItem[];
  totals: {
    deliveryFee: number;
    total: number;
    hstIncluded: number;
    containerDepositIncluded: number;
    calculatedProductTotal: number;
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
      quantityFulfilled,
      unitPrice,
      bottleDeposit,
      sizeMl: Number(requireMatch(itemText, /Size mL:\s*(\d+)/i, "bottle size")),
      expectedDeliveryDate: requireMatch(
        itemText,
        /Expected Delivery Date:\s*(\d{4}-\d{2}-\d{2})/i,
        "expected delivery date",
      ),
      ...calculation,
    };
  });

  const total = parseMoney(
    requireMatch(rawText, /^Total:\s*(\$[\d,.]+)/im, "invoice total"),
  );
  const deliveryFee = parseMoney(
    requireMatch(rawText, /^Delivery Fee:\s*(\$[\d,.]+)/im, "delivery fee"),
  );
  const deliveryTax = parseMoney(
    requireMatch(rawText, /^Delivery Tax:\s*(\$[\d,.]+)/im, "delivery tax"),
  );
  const invoiceHstIncluded = parseMoney(
    requireMatch(rawText, /^HST Included in Total:\s*(\$[\d,.]+)/im, "included HST"),
  );
  const containerDepositIncluded = parseMoney(
    requireMatch(
      rawText,
      /^Container Deposit Included in Total:\s*(\$[\d,.]+)/im,
      "container deposit total",
    ),
  );

  return {
    orderNumber,
    orderDate,
    expectedDeliveryDate: items[0].expectedDeliveryDate,
    items,
    totals: {
      deliveryFee,
      total,
      hstIncluded: roundCurrency(invoiceHstIncluded + deliveryTax),
      containerDepositIncluded,
      calculatedProductTotal: roundCurrency(
        items.reduce((sum, item) => sum + item.calculatedTotal, 0),
      ),
    },
  };
}

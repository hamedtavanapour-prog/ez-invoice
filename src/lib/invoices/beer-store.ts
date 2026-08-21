export type BeerStoreSizeUnit = "ML" | "L";
export type BeerStorePackageUnit = "BTL" | "CAN" | "KEG";

export type BeerStoreItem = {
  articleNumber: string;
  name: string;
  rawDescription: string;
  sizeValue: number;
  sizeUnit: BeerStoreSizeUnit;
  packageCode: string;
  packageUnit: BeerStorePackageUnit;
  quantityShipped: number;
  unitPrice: number;
  extendedPrice: number;
  deposit: number;
  netUnitPrice: number;
  calculatedTotal: number;
};

export type BeerStoreInvoice = {
  invoiceNumber: string;
  deliveryDate: string;
  items: BeerStoreItem[];
  packages: {
    bottleQuantity: number;
    bottleDeposit: number;
    kegQuantity: number;
    kegDeposit: number;
  };
  totals: {
    hst: number;
    emergencyOrderFee: number | null;
    fuelCharge: number;
    deliveryFee: number;
    orderTotal: number;
    calculatedProductTotal: number;
    calculatedInvoiceTotal: number;
    difference: number;
  };
};

const moneyValue = (value: string) => Number(value.replace(/[$,]/g, ""));
const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function requireMatch(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match?.[1]) throw new Error(`Could not read ${label} from The Beer Store invoice.`);
  return match[1].trim();
}

function parseDescription(rawDescription: string) {
  const comma = rawDescription.indexOf(",");
  const tokens = rawDescription.replace(",", " ").trim().split(/\s+/);
  const sizeIndex = tokens.findIndex((token) => /^(\d+(?:\.\d+)?)(ML|L)$/i.test(token));
  const name = comma >= 1
    ? rawDescription.slice(0, comma).trim()
    : tokens.slice(0, sizeIndex).join(" ");
  const details = tokens.slice(sizeIndex);
  const size = details[0]?.match(/^(\d+(?:\.\d+)?)(ML|L)$/i);
  const packageIndex = details.findIndex((token) => /^(BTL|CAN|KEG)$/i.test(token));

  if (!name || sizeIndex < 1 || !size || packageIndex < 2) {
    throw new Error(`Could not read the size or package type for “${rawDescription}”.`);
  }

  return {
    name,
    sizeValue: Number(size[1]),
    sizeUnit: size[2].toUpperCase() as BeerStoreSizeUnit,
    packageCode: details.slice(1, packageIndex).join(" "),
    packageUnit: details[packageIndex].toUpperCase() as BeerStorePackageUnit,
  };
}

function packageRow(text: string, label: "Bottles" | "Cans" | "Kegs" | "Other") {
  const pattern = new RegExp(`^${label}\\s+(\\d+)\\s+([\\d,]+\\.\\d{2})\\s+[\\d,]+\\.\\d{2}\\s*$`, "mi");
  const match = text.match(pattern);
  if (!match) throw new Error(`Could not read the ${label.toLowerCase()} package summary from The Beer Store invoice.`);
  return { quantity: Number(match[1]), deposit: moneyValue(match[2]) };
}

export function calculateBeerStoreItem(
  item: Pick<BeerStoreItem, "sizeValue" | "sizeUnit" | "packageCode" | "packageUnit" | "quantityShipped" | "unitPrice">,
) {
  let deposit: number;

  if (item.packageUnit === "KEG") {
    if (item.sizeUnit !== "L") throw new Error("Could not calculate a keg deposit without a litre size.");
    if (item.sizeValue >= 50) deposit = 50;
    else if (item.sizeValue === 30) deposit = 30;
    else throw new Error(`The deposit rule for a ${item.sizeValue} L keg is not configured.`);
  } else {
    const packQuantity = Number(item.packageCode.match(/^\d+/)?.[0]);
    if (!packQuantity) throw new Error(`Could not read the case quantity from package code “${item.packageCode}”.`);
    deposit = roundCurrency(packQuantity * 0.1);
  }

  const netUnitPrice = (item.unitPrice - deposit) / 1.13;
  return {
    deposit,
    netUnitPrice,
    calculatedTotal: roundCurrency(netUnitPrice * item.quantityShipped),
  };
}

export function parseBeerStoreInvoiceText(text: string): BeerStoreInvoice {
  const invoiceNumber = requireMatch(text, /^\s*(\d+)\s+Invoice Number\s*$/mi, "invoice number");
  const deliveryDate = requireMatch(text, /^\s*([^\r\n\t]+?)\s+Delivery Date\s*$/mi, "delivery date");

  const itemPattern = /^(?:(\d{6})\s+)?(\d{12,14})\s+(\d{7})\s+(.+?)\s+(\d+)\s+(\d+)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/gmi;
  const items: BeerStoreItem[] = [];
  for (const match of text.matchAll(itemPattern)) {
    const rawDescription = match[4].trim();
    const description = parseDescription(rawDescription);
    const baseItem = {
      articleNumber: match[3],
      rawDescription,
      ...description,
      quantityShipped: Number(match[6]),
      unitPrice: moneyValue(match[7]),
      extendedPrice: moneyValue(match[8]),
    };
    items.push({ ...baseItem, ...calculateBeerStoreItem(baseItem) });
  }
  if (items.length === 0) throw new Error("Could not read any products from The Beer Store invoice.");

  const bottles = packageRow(text, "Bottles");
  const cans = packageRow(text, "Cans");
  const kegs = packageRow(text, "Kegs");
  const other = packageRow(text, "Other");
  const totalsRow = text.match(/^TOTALS\s+\d+\s+[\d,]+\.\d{2}\s+([\d,]+\.\d{2})\s*$/mi);
  if (!totalsRow) throw new Error("Could not read the HST total from The Beer Store invoice.");

  const emergency = text.match(/Emergency Order Fee\s+\$?([\d,]+\.\d{2})/i);
  const fuelCharge = requireMatch(text, /Fuel\s*Charge\s*(?:\([^)]*\))?\s+\$?([\d,]+\.\d{2})/i, "fuel charge");
  const deliveryFee = requireMatch(text, /Delivery Fee\s+\$?([\d,]+\.\d{2})/i, "delivery fee");
  const orderTotal = requireMatch(text, /Order Total\s+\$?([\d,]+\.\d{2})/i, "order total");
  const hst = moneyValue(totalsRow[1]);
  const emergencyOrderFee = emergency ? moneyValue(emergency[1]) : null;
  const parsedFuelCharge = moneyValue(fuelCharge);
  const parsedDeliveryFee = moneyValue(deliveryFee);
  const parsedOrderTotal = moneyValue(orderTotal);
  const bottleDeposit = roundCurrency(bottles.deposit + cans.deposit + other.deposit);
  const calculatedProductTotal = roundCurrency(items.reduce((sum, item) => sum + item.calculatedTotal, 0));
  const calculatedInvoiceTotal = roundCurrency(
    calculatedProductTotal + bottleDeposit + kegs.deposit + hst +
    (emergencyOrderFee ?? 0) + parsedFuelCharge + parsedDeliveryFee,
  );

  return {
    invoiceNumber,
    deliveryDate,
    items,
    packages: {
      bottleQuantity: bottles.quantity + cans.quantity + other.quantity,
      bottleDeposit,
      kegQuantity: kegs.quantity,
      kegDeposit: kegs.deposit,
    },
    totals: {
      hst,
      emergencyOrderFee,
      fuelCharge: parsedFuelCharge,
      deliveryFee: parsedDeliveryFee,
      orderTotal: parsedOrderTotal,
      calculatedProductTotal,
      calculatedInvoiceTotal,
      difference: roundCurrency(parsedOrderTotal - calculatedInvoiceTotal),
    },
  };
}

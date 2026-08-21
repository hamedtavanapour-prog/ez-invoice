import { createBeerStorePdf } from "@/lib/invoices/beer-store-pdf";
import type { BeerStoreInvoice } from "@/lib/invoices/beer-store";

export const runtime = "nodejs";
const MAX_INVOICE_LENGTH = 256 * 1024;

function isBeerStoreInvoice(value: unknown): value is BeerStoreInvoice {
  if (!value || typeof value !== "object") return false;
  const invoice = value as Partial<BeerStoreInvoice>;
  return (
    typeof invoice.invoiceNumber === "string" &&
    typeof invoice.deliveryDate === "string" &&
    Array.isArray(invoice.items) && invoice.items.length > 0 &&
    invoice.items.every((item) =>
      item && typeof item === "object" &&
      typeof item.deposit === "number" &&
      typeof item.netUnitPrice === "number" &&
      typeof item.calculatedTotal === "number"
    ) &&
    typeof invoice.packages?.bottleQuantity === "number" &&
    typeof invoice.packages?.bottleDeposit === "number" &&
    typeof invoice.packages?.kegQuantity === "number" &&
    typeof invoice.packages?.kegDeposit === "number" &&
    typeof invoice.totals?.hst === "number" &&
    (typeof invoice.totals?.emergencyOrderFee === "number" || invoice.totals?.emergencyOrderFee === null) &&
    typeof invoice.totals?.fuelCharge === "number" &&
    typeof invoice.totals?.deliveryFee === "number" &&
    typeof invoice.totals?.orderTotal === "number" &&
    typeof invoice.totals?.calculatedProductTotal === "number" &&
    typeof invoice.totals?.calculatedInvoiceTotal === "number" &&
    typeof invoice.totals?.difference === "number"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const serializedInvoice = formData.get("invoice");
    if (typeof serializedInvoice !== "string" || serializedInvoice.length > MAX_INVOICE_LENGTH) {
      return Response.json({ error: "The invoice results are missing or too large." }, { status: 400 });
    }
    const invoice: unknown = JSON.parse(serializedInvoice);
    if (!isBeerStoreInvoice(invoice)) {
      return Response.json({ error: "The invoice results are invalid." }, { status: 400 });
    }

    const pdf = createBeerStorePdf(invoice);
    const safeInvoiceNumber = invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "") || "invoice";
    return new Response(pdf, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="beer-store-invoice-${safeInvoiceNumber}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return Response.json({ error: "The PDF could not be created." }, { status: 400 });
  }
}

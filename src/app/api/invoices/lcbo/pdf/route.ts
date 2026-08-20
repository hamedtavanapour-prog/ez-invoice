import { createLcboPdf } from "@/lib/invoices/lcbo-pdf";
import type { LcboInvoice } from "@/lib/invoices/lcbo";

export const runtime = "nodejs";

const MAX_INVOICE_LENGTH = 256 * 1024;

function isLcboInvoice(value: unknown): value is LcboInvoice {
  if (!value || typeof value !== "object") return false;
  const invoice = value as Partial<LcboInvoice>;
  return (
    typeof invoice.orderNumber === "string" &&
    typeof invoice.orderDate === "string" &&
    typeof invoice.expectedDeliveryDate === "string" &&
    Array.isArray(invoice.items) &&
    invoice.items.length > 0 &&
    Boolean(invoice.totals) &&
    typeof invoice.totals?.total === "number" &&
    typeof invoice.totals?.calculatedProductTotal === "number"
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
    if (!isLcboInvoice(invoice)) {
      return Response.json({ error: "The invoice results are invalid." }, { status: 400 });
    }

    const pdf = createLcboPdf(invoice);
    const safeOrderNumber = invoice.orderNumber.replace(/[^a-zA-Z0-9_-]/g, "") || "invoice";

    return new Response(pdf, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="lcbo-order-${safeOrderNumber}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return Response.json({ error: "The PDF could not be created." }, { status: 400 });
  }
}

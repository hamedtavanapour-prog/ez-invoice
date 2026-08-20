import { PDFParse } from "pdf-parse";

import { parseLcboInvoiceText } from "@/lib/invoices/lcbo";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PDF_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const invoice = formData.get("invoice");

    if (!(invoice instanceof File)) {
      return Response.json({ error: "Choose an LCBO invoice PDF." }, { status: 400 });
    }
    if (invoice.type !== "application/pdf" && !invoice.name.toLowerCase().endsWith(".pdf")) {
      return Response.json({ error: "The LCBO parser currently accepts PDF invoices." }, { status: 415 });
    }
    if (invoice.size > MAX_PDF_BYTES) {
      return Response.json({ error: "The invoice PDF must be 4 MB or smaller." }, { status: 413 });
    }

    const parser = new PDFParse({ data: Buffer.from(await invoice.arrayBuffer()) });

    try {
      const extracted = await parser.getText();
      const result = parseLcboInvoiceText(extracted.text);
      return Response.json(result);
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The LCBO invoice could not be processed.";
    return Response.json({ error: message }, { status: 422 });
  }
}

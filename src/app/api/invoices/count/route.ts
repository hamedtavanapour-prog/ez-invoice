import { getProcessedInvoiceCount } from "@/lib/invoices/count";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const count = await getProcessedInvoiceCount();

  return Response.json(
    { count },
    { headers: { "Cache-Control": "no-store" } },
  );
}

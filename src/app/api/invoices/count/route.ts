import {
  getProcessedInvoiceCount,
  incrementProcessedInvoiceCount,
} from "@/lib/invoices/count";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const count = await getProcessedInvoiceCount();

  return Response.json(
    { count: count ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST() {
  const count = await incrementProcessedInvoiceCount();

  return Response.json(
    { count: count ?? 0 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

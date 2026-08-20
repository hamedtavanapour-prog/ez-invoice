export type InvoiceSupplier = "lcbo" | "beer-store";

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sourceText?: string;
};

export type ExtractedInvoice = {
  supplier: InvoiceSupplier;
  invoiceNumber?: string;
  invoiceDate?: string;
  subtotal?: number;
  total?: number;
  lines: InvoiceLine[];
  raw: Record<string, unknown>;
};

export type CalculationLine = {
  label: string;
  amount: number;
  explanation?: string;
};

export type InvoiceCalculation = {
  supplier: InvoiceSupplier;
  finalTotal: number;
  breakdown: CalculationLine[];
};

export type InvoiceCalculator = (
  invoice: ExtractedInvoice,
) => InvoiceCalculation;

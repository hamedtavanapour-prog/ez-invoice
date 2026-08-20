"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

import type { LcboInvoice } from "@/lib/invoices/lcbo";

type Supplier = "lcbo" | "beer-store";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const preciseMoney = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75z" />
      <path d="M13 3.75v5h5M9.5 13h6M9.5 16h4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19.5h14" />
    </svg>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function InvoiceWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [supplier, setSupplier] = useState<Supplier>("lcbo");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<LcboInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function acceptFile(nextFile?: File) {
    setNotice(null);
    setResult(null);
    if (!nextFile) return;

    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Use the LCBO shipped-order invoice as a PDF.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("The invoice PDF must be 4 MB or smaller.");
      return;
    }

    setError(null);
    setFile(nextFile);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  async function handleProcess() {
    if (!file) return;
    if (supplier !== "lcbo") {
      setNotice("The Beer Store rules are next. Choose LCBO to process this invoice.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsProcessing(true);

    try {
      const body = new FormData();
      body.set("invoice", file);
      const response = await fetch("/api/invoices/lcbo", { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as
        | (LcboInvoice & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? `The invoice service returned an error (${response.status}).`);
      }
      if (!payload) {
        throw new Error("The invoice service returned an empty response. Please try again.");
      }

      setResult(payload);
    } catch (processingError) {
      setResult(null);
      setError(
        processingError instanceof Error
          ? processingError.message
          : "The invoice could not be processed.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[color:var(--surface)/0.92]">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--brand)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(26,87,68,0.2)]">EZ</div>
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em]">EZ Invoice</p>
              <p className="text-[11px] text-[var(--muted)]">Invoice calculator</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
            LCBO ready
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">One invoice. Clear numbers.</p>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">Upload once. Get the complete breakdown.</h1>
        </div>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-6" aria-label="Invoice upload">
          <div className="grid items-stretch gap-5 lg:grid-cols-[minmax(260px,0.85fr)_minmax(420px,1.5fr)_190px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold">Invoice type</p><p className="mt-1 text-xs text-[var(--muted)]">Choose the supplier rules.</p></div>
                <span className="rounded-full bg-[var(--soft-green)] px-3 py-1 text-[10px] font-semibold text-[var(--brand)]">Step 1</span>
              </div>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Invoice supplier">
                <button type="button" role="radio" aria-checked={supplier === "lcbo"} onClick={() => { setSupplier("lcbo"); setNotice(null); setResult(null); }} className={`supplier-button ${supplier === "lcbo" ? "supplier-button-active" : ""}`}>
                  <span className="supplier-mark bg-[#7b1e3b]">L</span><span><strong>LCBO</strong><small>Liquor</small></span>
                </button>
                <button type="button" role="radio" aria-checked={supplier === "beer-store"} onClick={() => { setSupplier("beer-store"); setResult(null); setNotice("The Beer Store calculation rules have not been added yet."); }} className={`supplier-button ${supplier === "beer-store" ? "supplier-button-active" : ""}`}>
                  <span className="supplier-mark bg-[#e4a400] text-[#322600]">B</span><span><strong>Beer Store</strong><small>Beer</small></span>
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold">Upload invoice</p><p className="mt-1 text-xs text-[var(--muted)]">LCBO shipped-order PDF, up to 4 MB.</p></div>
                <span className="rounded-full bg-[var(--canvas)] px-3 py-1 text-[10px] font-semibold text-[var(--muted)]">Step 2</span>
              </div>
              <div
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`upload-zone upload-zone-horizontal ${isDragging ? "upload-zone-active" : ""}`}
              >
                <input ref={inputRef} className="sr-only" type="file" accept=".pdf,application/pdf" onChange={handleInput} />
                {file ? (
                  <div className="flex w-full items-center gap-4 text-left">
                    <span className="file-icon"><FileIcon /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{file.name}</strong><small className="mt-1 block text-xs text-[var(--muted)]">{formatBytes(file.size)} · Ready to process</small></span>
                    <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--soft-green)]" onClick={() => inputRef.current?.click()}>Replace</button>
                  </div>
                ) : (
                  <button type="button" className="flex w-full items-center justify-center gap-4 text-left" onClick={() => inputRef.current?.click()}>
                    <span className="upload-icon"><UploadIcon /></span><span><strong className="block text-sm">Drop your invoice here</strong><span className="mt-1 block text-xs text-[var(--muted)]">or click to choose a PDF</span></span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <button type="button" disabled={!file || isProcessing} onClick={handleProcess} className="primary-button">
                {isProcessing ? "Reading invoice…" : "Process invoice"}{!isProcessing && <span aria-hidden="true">→</span>}
              </button>
              <p className="mt-3 text-center text-[10px] leading-4 text-[var(--muted)]">Processed securely and not stored.</p>
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          {notice && <p className="mt-4 rounded-xl bg-[var(--soft-green)] px-4 py-3 text-sm leading-5 text-[var(--brand)]" role="status">{notice}</p>}
        </section>

        <section className="mt-8" aria-live="polite" aria-label="Invoice calculation results">
          {result ? (
            <div className="overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)]">
              <div className="flex flex-col gap-5 border-b border-[var(--line)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <div className="flex items-center gap-3"><h2 className="text-2xl font-semibold tracking-[-0.03em]">Order {result.orderNumber}</h2><span className="rounded-full bg-[var(--soft-green)] px-3 py-1 text-[11px] font-medium text-[var(--brand)]">{result.items.length} items</span></div>
                  <p className="mt-2 text-sm text-[var(--muted)]">Order date {result.orderDate}{result.expectedDeliveryDate ? ` · Expected ${formatDate(result.expectedDeliveryDate)}` : " · Delivery date not provided"}</p>
                </div>
                <form action="/api/invoices/lcbo/pdf" method="post">
                  <input type="hidden" name="invoice" value={JSON.stringify(result)} />
                  <button className="download-button" type="submit"><DownloadIcon />Download PDF</button>
                </form>
              </div>

              <div className="grid gap-4 bg-[#fafaf6] p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-4 xl:grid-cols-7">
                <div className="rounded-2xl bg-[var(--ink)] p-5 text-white sm:col-span-2 lg:col-span-1"><p className="text-xs text-white/60">Calculated product total</p><p className="mt-3 text-[26px] font-semibold tracking-[-0.04em]">{money.format(result.totals.calculatedProductTotal)}</p></div>
                <SummaryValue label="Delivery fee" value={result.totals.deliveryFee === null ? "Not provided" : money.format(result.totals.deliveryFee)} />
                <SummaryValue label="HST included" value={money.format(result.totals.hstIncluded)} />
                <SummaryValue label="Container deposit" value={money.format(result.totals.containerDepositIncluded)} />
                <SummaryValue label="Calculated invoice total" value={money.format(result.totals.calculatedInvoiceTotal)} />
                <SummaryValue label="LCBO invoice total" value={money.format(result.totals.total)} />
                <SummaryValue label="Difference" value={money.format(result.totals.difference)} />
              </div>

              <div className="px-6 py-7 sm:px-8">
                <div className="result-grid hidden border-b border-[var(--line)] px-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] md:grid">
                  <span>Product</span><span>Ordered</span><span>Unit price</span><span>Deposit</span><span className="result-group-divider">Fulfilled</span><span>Net unit</span><span className="text-right">Product total</span>
                </div>
                <div>
                  {result.items.map((item) => (
                    <article key={item.lcboNumber} className="result-grid border-b border-[var(--line)] px-4 py-5 last:border-0 md:grid md:items-center">
                      <div className="mb-4 md:mb-0"><h3 className="text-base font-semibold leading-5">{item.name}</h3><p className="mt-1 text-xs text-[var(--muted)]">LCBO #{item.lcboNumber} · {item.sizeMl} mL</p></div>
                      <ResultValue label="Quantity ordered" value={String(item.quantityOrdered)} />
                      <ResultValue label="Unit price" value={money.format(item.unitPrice)} />
                      <ResultValue label="Deposit" value={`− ${money.format(item.bottleDeposit)}`} />
                      <div className="result-group-divider"><ResultValue label="Fulfilled" value={String(item.quantityFulfilled)} /></div>
                      <ResultValue label="Net unit" value={preciseMoney.format(item.netUnitPrice)} />
                      <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4 md:mt-0 md:block md:border-0 md:pt-0 md:text-right"><span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] md:hidden">Product total</span><strong className="text-lg text-[var(--brand)]">{money.format(item.calculatedTotal)}</strong></div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-[30px] border border-dashed border-[#bcc5c0] bg-[color:var(--surface)/0.72] px-6 text-center">
              <div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--soft-green)] text-xl font-semibold text-[var(--brand)]">03</span><h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">Your full results will appear here</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Upload an LCBO invoice above to see the larger product table, totals, and downloadable PDF.</p></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 flex items-center justify-between text-sm md:mb-0 md:block"><span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] md:hidden">{label}</span><strong className="font-medium">{value}</strong></div>;
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"><span className="block text-xs text-[var(--muted)]">{label}</span><strong className="mt-3 block text-xl tracking-[-0.02em]">{value}</strong></div>;
}

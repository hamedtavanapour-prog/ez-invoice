"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { LcboInvoice } from "@/lib/invoices/lcbo";
import type { BeerStoreInvoice } from "@/lib/invoices/beer-store";
import { InvoiceLogo } from "./invoice-logo";

type Supplier = "lcbo" | "beer-store";
type InvoiceResult =
  | { supplier: "lcbo"; invoice: LcboInvoice }
  | { supplier: "beer-store"; invoice: BeerStoreInvoice };

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

const wholeNumber = new Intl.NumberFormat("en-CA");

function formatSignedMoney(value: number) {
  if (value === 0) return money.format(0);
  return `${value > 0 ? "+" : "−"}${money.format(Math.abs(value))}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatBeerStoreDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14" />
    </svg>
  );
}

function BottleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M10 3h4v4l2.5 3.5v8.25A2.25 2.25 0 0114.25 21h-4.5a2.25 2.25 0 01-2.25-2.25V10.5L10 7V3z" />
      <path d="M9.5 13h5" />
    </svg>
  );
}

function BeerGlassIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M6 6h10l-1 14H7L6 6z" />
      <path d="M16 9h1.5a2.5 2.5 0 010 5H16M8.5 3.5h.01M12 3h.01M15 4h.01" />
      <path d="M7 9h8.5" />
    </svg>
  );
}

function ResultsShell({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)] sm:rounded-[30px]">{children}</div>;
}

function ResultsHeader({ title, details, itemCount, endpoint, invoice }: { title: string; details: string; itemCount: number; endpoint: string; invoice: LcboInvoice | BeerStoreInvoice }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-3 py-4 sm:items-center sm:px-8 sm:py-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3"><h2 className="text-lg font-semibold tracking-[-0.03em] sm:text-2xl">{title}</h2><span className="rounded-full bg-[var(--soft-blue)] px-2.5 py-1 text-[10px] font-medium text-[var(--brand)] sm:px-3 sm:text-[11px]">{itemCount} items</span></div>
        <p className="mt-1.5 text-xs leading-5 text-[var(--muted)] sm:mt-2 sm:text-sm">{details}</p>
      </div>
      <form action={endpoint} method="post" className="shrink-0">
        <input type="hidden" name="invoice" value={JSON.stringify(invoice)} />
        <button className="download-button" type="submit"><DownloadIcon /><span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span></button>
      </form>
    </div>
  );
}

function LcboResults({ result }: { result: LcboInvoice }) {
  const details = [
    result.orderDate ? `Order date ${result.orderDate}` : "Order date not provided",
    result.expectedDeliveryDate
      ? `Expected ${formatDate(result.expectedDeliveryDate)}`
      : "Delivery date not provided",
  ].join(" · ");

  return (
    <ResultsShell>
      <ResultsHeader title={result.orderNumber ? `Order ${result.orderNumber}` : "LCBO order"} details={details} itemCount={result.items.length} endpoint="/api/invoices/lcbo/pdf" invoice={result} />
      <div className="summary-grid grid grid-cols-2 gap-3 bg-[var(--summary-bg)] p-4 sm:grid-cols-3 sm:p-6 md:grid-cols-4 lg:p-8 xl:grid-cols-7">
        <SummaryFeature label="Calculated product total" value={money.format(result.totals.calculatedProductTotal)} />
        <SummaryValue label="Delivery fee" value={result.totals.deliveryFee === null ? "Not provided" : money.format(result.totals.deliveryFee)} />
        <SummaryValue label="HST included" value={money.format(result.totals.hstIncluded)} />
        <SummaryValue label="Container deposit" value={money.format(result.totals.containerDepositIncluded)} />
        <SummaryValue label="Calculated invoice total" value={money.format(result.totals.calculatedInvoiceTotal)} />
        <SummaryValue label="LCBO invoice total" value={money.format(result.totals.total)} />
        <SummaryValue label="Difference" value={formatSignedMoney(result.totals.difference)} />
      </div>
      <div className="px-3 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div className="result-grid hidden border-b border-[var(--line)] px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] lg:grid">
          <span>Product</span><span>Ordered</span><span>Unit price</span><span>Deposit</span><span className="result-group-divider">Fulfilled</span><span>Net unit</span><span className="text-right">Product total</span>
        </div>
        {result.items.map((item) => (
          <article key={item.lcboNumber} className="result-grid border-b border-[var(--line)] px-1 py-3 last:border-0 sm:px-3 sm:py-4 lg:grid lg:items-center lg:py-5">
            <div className="mb-3 lg:mb-0"><h3 className="text-sm font-semibold leading-5 sm:text-base">{item.name}</h3><p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">LCBO #{item.lcboNumber} · {item.sizeMl} mL</p></div>
            <ResultValue label="Quantity ordered" value={String(item.quantityOrdered)} />
            <ResultValue label="Unit price" value={money.format(item.unitPrice)} />
            <ResultValue label="Deposit" value={`− ${money.format(item.bottleDeposit)}`} />
            <div className="result-group-divider"><ResultValue label="Fulfilled" value={String(item.quantityFulfilled)} /></div>
            <ResultValue label="Net unit" value={preciseMoney.format(item.netUnitPrice)} />
            <ResultTotal label="Product total" value={money.format(item.calculatedTotal)} />
          </article>
        ))}
      </div>
    </ResultsShell>
  );
}

function BeerStoreResults({ result }: { result: BeerStoreInvoice }) {
  return (
    <ResultsShell>
      <ResultsHeader title={`Invoice ${result.invoiceNumber}`} details={`Delivery date ${formatBeerStoreDate(result.deliveryDate)}`} itemCount={result.items.length} endpoint="/api/invoices/beer-store/pdf" invoice={result} />
      <div className="summary-grid beer-summary-grid grid grid-cols-2 gap-3 bg-[var(--summary-bg)] p-4 sm:grid-cols-3 sm:p-6 md:grid-cols-4 lg:p-8 xl:grid-cols-5">
        <SummaryFeature label="Calculated product total" value={money.format(result.totals.calculatedProductTotal)} />
        <SummaryValue label="Bottle/can deposit total" value={money.format(result.packages.bottleDeposit)} description={`For all ${result.packages.bottleQuantity} shipped package units`} />
        <SummaryValue label="Keg deposit total" value={money.format(result.packages.kegDeposit)} description={`For all ${result.packages.kegQuantity} shipped kegs`} />
        <SummaryValue label="HST" value={money.format(result.totals.hst)} />
        {result.totals.emergencyOrderFee !== null
          ? <SummaryValue label="Emergency order fee" value={money.format(result.totals.emergencyOrderFee)} />
          : null}
        <SummaryValue label="Fuel charge" value={money.format(result.totals.fuelCharge)} />
        <SummaryValue label="Delivery fee" value={money.format(result.totals.deliveryFee)} />
        <SummaryValue label="Calculated invoice total" value={money.format(result.totals.calculatedInvoiceTotal)} />
        <SummaryValue label="Beer Store invoice total" value={money.format(result.totals.orderTotal)} />
        <SummaryValue label="Difference" value={formatSignedMoney(result.totals.difference)} />
      </div>
      <div className="px-3 py-3 sm:px-6 sm:py-7 lg:px-8">
        <div className="beer-result-grid hidden border-b border-[var(--line)] px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] lg:grid">
          <span>Product</span><span>Size</span><span>Package</span><span>Shipped</span><span>Unit price</span><span>Deposit</span><span className="result-group-divider">Net unit</span><span className="text-right">Product total</span>
        </div>
        {result.items.map((item) => (
          <article key={item.articleNumber} className="beer-result-grid border-b border-[var(--line)] px-1 py-3 last:border-0 sm:px-3 sm:py-4 lg:grid lg:items-center lg:py-5">
            <div className="mb-3 lg:mb-0"><h3 className="text-sm font-semibold leading-5 sm:text-base">{item.name}</h3><p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">Article #{item.articleNumber} · {item.packageCode}</p></div>
            <ResultValue label="Size" value={`${item.sizeValue} ${item.sizeUnit}`} />
            <ResultValue label="Package" value={item.packageUnit} />
            <ResultValue label="Shipped" value={String(item.quantityShipped)} />
            <ResultValue label="Unit price" value={money.format(item.unitPrice)} />
            <ResultValue label="Deposit" value={`− ${money.format(item.deposit)}`} />
            <div className="result-group-divider"><ResultValue label="Net unit" value={preciseMoney.format(item.netUnitPrice)} /></div>
            <ResultTotal label="Product total" value={money.format(item.calculatedTotal)} />
          </article>
        ))}
      </div>
    </ResultsShell>
  );
}

function ResultTotal({ label, value }: { label: string; value: string }) {
  return <div className="mt-2 flex items-center justify-between border-t border-[var(--line)] pt-2 lg:mt-0 lg:block lg:border-0 lg:pt-0 lg:text-right"><span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] lg:hidden">{label}</span><strong className="text-base text-[var(--brand)] sm:text-lg">{value}</strong></div>;
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

function SunIcon() {
  return (
    <svg aria-hidden="true" className="theme-toggle-icon theme-toggle-sun" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56m11.02 11.02 1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="theme-toggle-icon theme-toggle-moon" viewBox="0 0 24 24" fill="none">
      <path d="M19.5 15.2A7.7 7.7 0 018.8 4.5 8 8 0 1019.5 15.2z" />
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
  const [result, setResult] = useState<InvoiceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [processedInvoiceCount, setProcessedInvoiceCount] = useState(0);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }

    const scrollToTop = () => window.scrollTo(0, 0);
    const frame = window.requestAnimationFrame(scrollToTop);
    const timer = window.setTimeout(scrollToTop, 0);
    window.addEventListener("pageshow", scrollToTop);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("pageshow", scrollToTop);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadProcessedInvoiceCount() {
      try {
        const response = await fetch("/api/invoices/count", { cache: "no-store" });
        const payload = (await response.json()) as { count?: unknown };

        if (
          isActive &&
          response.ok &&
          typeof payload.count === "number" &&
          Number.isSafeInteger(payload.count) &&
          payload.count >= 0
        ) {
          setProcessedInvoiceCount(payload.count);
        }
      } catch {
        // The invoice calculator remains available when the optional counter is offline.
      }
    }

    void loadProcessedInvoiceCount();

    return () => {
      isActive = false;
    };
  }, []);

  function acceptFile(nextFile?: File) {
    setResult(null);
    if (!nextFile) return;

    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose an invoice PDF from the selected supplier.");
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

  async function countProcessingRequest() {
    try {
      const response = await fetch("/api/invoices/count", {
        method: "POST",
        cache: "no-store",
        keepalive: true,
      });
      const payload = (await response.json()) as { count?: unknown };

      if (
        response.ok &&
        typeof payload.count === "number" &&
        Number.isSafeInteger(payload.count) &&
        payload.count >= 0
      ) {
        setProcessedInvoiceCount(payload.count);
      }
    } catch {
      // Counting never prevents the invoice itself from being processed.
    }
  }

  async function handleProcess() {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    void countProcessingRequest();

    try {
      const body = new FormData();
      body.set("invoice", file);
      const response = await fetch(`/api/invoices/${supplier}`, { method: "POST", body });
      const payload = (await response.json().catch(() => null)) as
        | ((LcboInvoice | BeerStoreInvoice) & { error?: string })
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? `The invoice service returned an error (${response.status}).`);
      }
      if (!payload) {
        throw new Error("The invoice service returned an empty response. Please try again.");
      }

      setResult(supplier === "lcbo"
        ? { supplier, invoice: payload as LcboInvoice }
        : { supplier, invoice: payload as BeerStoreInvoice });
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
    <div data-theme={isDark ? "dark" : "light"} className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[color:var(--surface)/0.92]">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="Refresh EZ Invoice"
            className="flex cursor-pointer items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand)]"
          >
            <InvoiceLogo className="h-8 w-10" />
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em]">EZ Invoice</p>
              <p className="text-[11px] text-[var(--muted)]">Invoice calculator</p>
            </div>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              className="theme-toggle"
              onClick={() => setIsDark((current) => !current)}
            >
              <SunIcon />
              <MoonIcon />
              <span className="theme-toggle-thumb" aria-hidden="true" />
            </button>
            <a className="rounded-lg px-2 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--soft-blue)] hover:text-[var(--brand)] sm:px-3" href="#privacy">Privacy</a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="mb-6 grid gap-5 sm:mb-8 lg:grid-cols-[minmax(0,1fr)_170px] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">One invoice. Clear numbers.</p>
            <h1 className="text-balance text-[30px] font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl">Upload once. Get the complete breakdown.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">Turn LCBO and Beer Store invoices into clear breakdowns and downloadable reports in seconds.</p>
          </div>

          <section
            aria-label="Happy customer count"
            aria-live="polite"
            className="w-[170px] px-2 py-1 lg:justify-self-end"
          >
            <div className="flex items-center justify-between gap-3">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-[var(--soft-blue)] text-lg">😊</span>
              <strong className="text-2xl tracking-[-0.04em] text-[var(--brand)]">
                {wholeNumber.format(processedInvoiceCount)}
              </strong>
            </div>
            <p className="mt-3 border-t border-[var(--line)] pt-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Happy customers</p>
          </section>
        </div>

        <section className="rounded-[18px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--card-shadow)] sm:rounded-[28px] sm:p-6" aria-label="Invoice upload">
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(260px,0.85fr)_minmax(420px,1.5fr)_190px] lg:gap-5">
            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold">Invoice type</p><p className="mt-1 text-xs text-[var(--muted)]">Choose the supplier rules.</p></div>
                <span className="rounded-full bg-[var(--soft-blue)] px-3 py-1 text-[10px] font-semibold text-[var(--brand)]">Step 1</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3" role="radiogroup" aria-label="Invoice supplier">
                <button type="button" role="radio" aria-checked={supplier === "lcbo"} onClick={() => { setSupplier("lcbo"); setError(null); setResult(null); }} className={`supplier-button ${supplier === "lcbo" ? "supplier-button-active" : ""}`}>
                  <span className="supplier-mark supplier-mark-lcbo"><BottleIcon /></span><span><strong>LCBO</strong><small>Liquor</small></span>
                </button>
                <button type="button" role="radio" aria-checked={supplier === "beer-store"} onClick={() => { setSupplier("beer-store"); setError(null); setResult(null); }} className={`supplier-button ${supplier === "beer-store" ? "supplier-button-active" : ""}`}>
                  <span className="supplier-mark supplier-mark-beer"><BeerGlassIcon /></span><span><strong>Beer Store</strong><small>Beer</small></span>
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between">
                <div><p className="text-sm font-semibold">Upload invoice</p><p className="mt-1 text-xs text-[var(--muted)]">{supplier === "lcbo" ? "LCBO shipped-order" : "Beer Store"} PDF, up to 4 MB.</p></div>
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
                  <div className="flex min-w-0 w-full items-center gap-3 text-left sm:gap-4">
                    <span className="file-icon"><FileIcon /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{file.name}</strong><small className="mt-1 block text-xs text-[var(--muted)]">{formatBytes(file.size)} · Ready to process</small></span>
                    <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--soft-blue)]" onClick={() => inputRef.current?.click()}>Replace</button>
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
              <p className="mt-3 text-center text-[10px] leading-4 text-[var(--muted)]">Invoice details aren’t stored. Only the anonymous total is counted.</p>
            </div>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
        </section>

        <section className="mt-6 sm:mt-8" aria-live="polite" aria-label="Invoice calculation results">
          {result ? (
            result.supplier === "lcbo"
              ? <LcboResults result={result.invoice} />
              : <BeerStoreResults result={result.invoice} />
          ) : (
            <div className="grid min-h-[300px] place-items-center rounded-[24px] border border-dashed border-[var(--dash)] bg-[color:var(--surface)/0.72] px-5 text-center sm:min-h-[360px] sm:rounded-[30px] sm:px-6">
              <div className="max-w-md"><h2 className="text-2xl font-semibold tracking-[-0.03em]">Your full results will appear here</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">Upload a {supplier === "lcbo" ? "LCBO" : "Beer Store"} invoice above to see the product table, totals, and downloadable PDF.</p></div>
            </div>
          )}
        </section>
        </div>
      </main>

      <footer id="privacy" className="scroll-mt-6 bg-[var(--footer-bg)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <div className="flex items-center gap-3">
                <InvoiceLogo className="h-8 w-10" onDark />
                <div><p className="text-sm font-semibold">EZ Invoice</p><p className="mt-0.5 text-xs text-white/55">Clear invoice calculations</p></div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">A focused tool for reviewing invoice calculations without creating an account or building a record of your invoices.</p>
            </div>

            <section aria-labelledby="privacy-title" className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 sm:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9fd3ff]">Privacy by design</p>
              <h2 id="privacy-title" className="mt-2 text-xl font-semibold tracking-[-0.02em]">Your invoice remains yours.</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">Invoice files are processed only to complete your current calculation. EZ Invoice stores one anonymous total of successful calculations, but never saves the uploaded file, extracted invoice data, or generated report. The result displayed on this page exists only for the current page session and is cleared when you refresh or close it.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-medium text-white/75">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">No account required</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">No invoice storage</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5">Anonymous totals only</span>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>EZ Invoice</p>
            <p>Private invoice calculations, built for clarity.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return <div className="result-value mb-3 flex items-center justify-between text-sm lg:mb-0 lg:block"><span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] lg:hidden">{label}</span><strong className="font-medium">{value}</strong></div>;
}

function SummaryValue({ label, value, description }: { label: string; value: string; description?: string }) {
  return <div className="summary-value flex min-h-24 flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:rounded-2xl"><span className="summary-label block min-h-7 text-[11px] leading-4 text-[var(--muted)]">{label}{description ? <small className="summary-description">{description}</small> : null}</span><strong className="summary-number mt-auto block pt-2 text-lg tracking-[-0.02em] sm:text-xl">{value}</strong></div>;
}

function SummaryFeature({ label, value }: { label: string; value: string }) {
  return <div className="summary-feature flex min-h-24 flex-col rounded-xl bg-[var(--contrast-card)] p-4 text-white sm:rounded-2xl"><p className="summary-label min-h-7 text-[11px] leading-4 text-white/60">{label}</p><p className="summary-number mt-auto pt-2 text-xl font-semibold tracking-[-0.04em] sm:text-[22px]">{value}</p></div>;
}

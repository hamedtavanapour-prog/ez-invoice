"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

import type { LcboInvoice } from "@/lib/invoices/lcbo";

type Supplier = "lcbo" | "beer-store";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const money = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
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
      const payload = (await response.json()) as LcboInvoice & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "The invoice could not be processed.");
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
            <div className="grid size-9 place-items-center rounded-xl bg-[var(--brand)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(26,87,68,0.2)]">
              EZ
            </div>
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

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(360px,0.82fr)_minmax(500px,1.18fr)] lg:gap-10">
        <div>
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
              One invoice. Clear numbers.
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl">
              Turn supplier invoices into usable totals.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              Upload an LCBO or The Beer Store invoice. The tool will extract the details, apply your rules, and show the final breakdown.
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">1. Choose invoice type</p>
                <p className="mt-1 text-xs text-[var(--muted)]">This selects the calculation rules.</p>
              </div>
              <span className="rounded-full bg-[var(--soft-green)] px-3 py-1 text-[11px] font-semibold text-[var(--brand)]">
                Step 1 of 2
              </span>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Invoice supplier">
              <button type="button" role="radio" aria-checked={supplier === "lcbo"} onClick={() => { setSupplier("lcbo"); setNotice(null); setResult(null); }} className={`supplier-button ${supplier === "lcbo" ? "supplier-button-active" : ""}`}>
                <span className="supplier-mark bg-[#7b1e3b]">L</span>
                <span><strong>LCBO</strong><small>Liquor invoice</small></span>
              </button>
              <button type="button" role="radio" aria-checked={supplier === "beer-store"} onClick={() => { setSupplier("beer-store"); setResult(null); setNotice("The Beer Store calculation rules have not been added yet."); }} className={`supplier-button ${supplier === "beer-store" ? "supplier-button-active" : ""}`}>
                <span className="supplier-mark bg-[#e4a400] text-[#322600]">B</span>
                <span><strong>The Beer Store</strong><small>Beer invoice</small></span>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold">2. Upload invoice</p>
              <p className="mt-1 text-xs text-[var(--muted)]">LCBO shipped-order PDF, up to 4 MB.</p>
            </div>

            <div
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone ${isDragging ? "upload-zone-active" : ""}`}
            >
              <input ref={inputRef} className="sr-only" type="file" accept=".pdf,application/pdf" onChange={handleInput} />

              {file ? (
                <div className="flex w-full items-center gap-4 text-left">
                  <span className="file-icon"><FileIcon /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm">{file.name}</strong>
                    <small className="mt-1 block text-xs text-[var(--muted)]">{formatBytes(file.size)} · Ready to process</small>
                  </span>
                  <button type="button" className="rounded-lg px-3 py-2 text-xs font-semibold text-[var(--brand)] hover:bg-[var(--soft-green)]" onClick={() => inputRef.current?.click()}>
                    Replace
                  </button>
                </div>
              ) : (
                <button type="button" className="flex flex-col items-center" onClick={() => inputRef.current?.click()}>
                  <span className="upload-icon"><UploadIcon /></span>
                  <strong className="mt-4 text-sm">Drop your invoice here</strong>
                  <span className="mt-1 text-xs text-[var(--muted)]">or click to choose a file</span>
                </button>
              )}
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
            {notice && <p className="mt-3 rounded-xl bg-[var(--soft-green)] px-4 py-3 text-sm leading-5 text-[var(--brand)]" role="status">{notice}</p>}

            <button type="button" disabled={!file || isProcessing} onClick={handleProcess} className="primary-button mt-5">
              {isProcessing ? "Reading invoice…" : "Process invoice"} {!isProcessing && <span aria-hidden="true">→</span>}
            </button>
            <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
              The PDF is processed for this result and is not stored.
            </p>
          </div>
        </div>

        <aside className="lg:pt-29" aria-live="polite">
          <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)]">
            <div className="border-b border-[var(--line)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {result ? `Expected delivery · ${formatDate(result.expectedDeliveryDate)}` : "Calculation result"}
                  </p>
                  {result && <p className="mt-1 text-xs text-[var(--muted)]">Order {result.orderNumber} · {result.orderDate}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${result ? "bg-[var(--soft-green)] text-[var(--brand)]" : "bg-[var(--canvas)] text-[var(--muted)]"}`}>
                  {result ? `${result.items.length} items` : isProcessing ? "Reading" : "Waiting"}
                </span>
              </div>
            </div>
            {result ? (
              <div>
                <div className="max-h-[570px] overflow-y-auto">
                  {result.items.map((item) => (
                    <article key={item.lcboNumber} className="border-b border-[var(--line)] px-6 py-5 last:border-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-semibold leading-5">{item.name}</h2>
                          <p className="mt-1 text-[11px] text-[var(--muted)]">LCBO #{item.lcboNumber} · {item.sizeMl} mL</p>
                        </div>
                        <strong className="whitespace-nowrap text-base text-[var(--brand)]">{money.format(item.calculatedTotal)}</strong>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4">
                        <ResultValue label="Fulfilled" value={String(item.quantityFulfilled)} />
                        <ResultValue label="Unit price" value={money.format(item.unitPrice)} />
                        <ResultValue label="Deposit" value={`− ${money.format(item.bottleDeposit)}`} />
                        <ResultValue label="Net unit" value={money.format(item.netUnitPrice)} />
                      </div>
                    </article>
                  ))}
                </div>
                <div className="border-t border-[var(--line)] bg-[#fafaf6] p-6">
                  <div className="rounded-2xl bg-[var(--ink)] p-5 text-white">
                    <p className="text-xs text-white/60">Calculated product total</p>
                    <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">{money.format(result.totals.calculatedProductTotal)}</p>
                    <p className="mt-3 text-[11px] text-white/55">(Unit price − deposit) ÷ 1.13 × fulfilled quantity</p>
                  </div>
                  <div className="mt-5 grid gap-3 text-xs sm:grid-cols-3">
                    <SummaryValue label="Invoice total" value={money.format(result.totals.total)} />
                    <SummaryValue label="HST included" value={money.format(result.totals.hstIncluded)} />
                    <SummaryValue label="Container deposit" value={money.format(result.totals.containerDepositIncluded)} />
                  </div>
                </div>
              </div>
            ) : (
            <div className="p-6">
              <div className="rounded-2xl bg-[var(--ink)] p-5 text-white">
                <p className="text-xs text-white/60">Calculated product total</p>
                <p className="mt-2 text-4xl font-semibold tracking-[-0.04em]">—</p>
                <p className="mt-4 text-xs text-white/50">Results will appear after processing</p>
              </div>
              <div className="mt-6 space-y-4">
                {["Invoice subtotal", "Fees & deposits", "Adjustments", "Calculated amount"].map((label) => (
                  <div key={label} className="flex items-center justify-between border-b border-[var(--line)] pb-4 last:border-0">
                    <span className="text-sm text-[var(--muted)]">{label}</span>
                    <span className="h-3 w-16 rounded-full bg-[var(--canvas)]" />
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[["01", "Upload"], ["02", "Extract"], ["03", "Calculate"]].map(([number, label]) => (
              <div key={number} className="rounded-2xl border border-[var(--line)] bg-[color:var(--surface)/0.7] px-2 py-4">
                <span className="text-[10px] font-bold text-[var(--brand)]">{number}</span>
                <p className="mt-1 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function ResultValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block font-medium">{value}</strong>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
      <span className="block text-[10px] text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}

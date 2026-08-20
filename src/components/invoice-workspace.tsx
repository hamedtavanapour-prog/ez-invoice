"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

type Supplier = "lcbo" | "beer-store";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

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

  function acceptFile(nextFile?: File) {
    setNotice(null);
    if (!nextFile) return;

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Use a PDF, JPG, PNG, or WEBP invoice.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setError("The invoice must be smaller than 10 MB.");
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

  function handleProcess() {
    setNotice(
      "Upload flow is ready. Add your invoice rules next and this button will return the calculated totals.",
    );
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[color:var(--surface)/0.92]">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 sm:px-8">
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
            Foundation ready
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)] lg:gap-16">
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
              <button type="button" role="radio" aria-checked={supplier === "lcbo"} onClick={() => setSupplier("lcbo")} className={`supplier-button ${supplier === "lcbo" ? "supplier-button-active" : ""}`}>
                <span className="supplier-mark bg-[#7b1e3b]">L</span>
                <span><strong>LCBO</strong><small>Liquor invoice</small></span>
              </button>
              <button type="button" role="radio" aria-checked={supplier === "beer-store"} onClick={() => setSupplier("beer-store")} className={`supplier-button ${supplier === "beer-store" ? "supplier-button-active" : ""}`}>
                <span className="supplier-mark bg-[#e4a400] text-[#322600]">B</span>
                <span><strong>The Beer Store</strong><small>Beer invoice</small></span>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold">2. Upload invoice</p>
              <p className="mt-1 text-xs text-[var(--muted)]">PDF or a clear photo, up to 10 MB.</p>
            </div>

            <div
              onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`upload-zone ${isDragging ? "upload-zone-active" : ""}`}
            >
              <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={handleInput} />

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

            <button type="button" disabled={!file} onClick={handleProcess} className="primary-button mt-5">
              Process invoice <span aria-hidden="true">→</span>
            </button>
            <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
              Your invoice will be stored privately and can be removed after processing.
            </p>
          </div>
        </div>

        <aside className="lg:pt-29">
          <div className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--card-shadow)]">
            <div className="border-b border-[var(--line)] px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Calculation result</p>
                <span className="rounded-full bg-[var(--canvas)] px-3 py-1 text-[11px] font-medium text-[var(--muted)]">Waiting</span>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-2xl bg-[var(--ink)] p-5 text-white">
                <p className="text-xs text-white/60">Final total</p>
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

comment on table public.invoice_metrics is
  'A single anonymous aggregate count of invoice processing requests.';

comment on function public.increment_invoice_count() is
  'Atomically increments the anonymous processing-request total for server-side use.';

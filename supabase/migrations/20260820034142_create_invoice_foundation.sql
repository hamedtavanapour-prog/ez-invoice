create table public.invoice_jobs (
  id uuid primary key default gen_random_uuid(),
  supplier text not null check (supplier in ('lcbo', 'beer-store')),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'extracting', 'ready', 'failed')),
  storage_path text not null unique,
  original_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  extracted_data jsonb,
  calculation_result jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoice_jobs enable row level security;

revoke all on table public.invoice_jobs from anon, authenticated;

comment on table public.invoice_jobs is
  'Private processing records for uploaded LCBO and Beer Store invoices.';

create table public.invoice_metrics (
  id text primary key default 'global' check (id = 'global'),
  processed_count bigint not null default 0 check (processed_count >= 0),
  updated_at timestamptz not null default now()
);

insert into public.invoice_metrics (id, processed_count)
values ('global', 0);

alter table public.invoice_metrics enable row level security;

revoke all on table public.invoice_metrics from anon, authenticated;

create or replace function public.increment_invoice_count()
returns bigint
language sql
security definer
set search_path = ''
as $$
  update public.invoice_metrics
  set
    processed_count = processed_count + 1,
    updated_at = now()
  where id = 'global'
  returning processed_count;
$$;

revoke all on function public.increment_invoice_count() from public, anon, authenticated;
grant execute on function public.increment_invoice_count() to service_role;

comment on table public.invoice_metrics is
  'A single anonymous aggregate count of successfully processed invoices.';

comment on function public.increment_invoice_count() is
  'Atomically increments the anonymous processed invoice total for server-side use.';

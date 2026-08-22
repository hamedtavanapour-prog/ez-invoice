create or replace function public.increment_invoice_count()
returns bigint
language sql
security definer
set search_path = ''
as $$
  insert into public.invoice_metrics (id, processed_count)
  values ('global', 1)
  on conflict (id) do update
  set
    processed_count = public.invoice_metrics.processed_count + 1,
    updated_at = now()
  returning processed_count;
$$;

revoke all on function public.increment_invoice_count() from public, anon, authenticated;
grant execute on function public.increment_invoice_count() to service_role;

comment on function public.increment_invoice_count() is
  'Atomically increments the anonymous processing-request total and recreates the global row if needed.';

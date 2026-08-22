# EZ Invoice

A single-page LCBO and The Beer Store invoice calculator built with Next.js, Supabase, and Vercel.

## Foundation included

- Responsive invoice upload workspace
- Supplier selection and client-side file validation
- Typed extraction and calculation contracts
- Supabase client configuration
- Privacy-safe aggregate count of invoice processing requests
- Private `invoice_jobs` migration with RLS enabled
- Environment template for Vercel and local development

The extraction provider and supplier-specific calculation rules are intentionally left open until the invoice examples and rules are defined.

## Local setup

Copy `.env.example` to `.env.local` and add the public URL, publishable key, and server-only secret key from Supabase. Older Supabase projects can use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`. Never expose either server-only key through a `NEXT_PUBLIC_` variable.

Apply the migrations in `supabase/migrations` to the connected Supabase project. The invoice counter stores only one aggregate number; it does not create a record for each invoice or retain invoice contents.

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

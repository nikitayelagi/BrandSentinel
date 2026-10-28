# BrandSentinel (Round 2 MVP skeleton)
Next.js 14 + TypeScript + Supabase (Postgres, pgvector-ready) + optional Anthropic model.

## Run
1. Create a free project at supabase.com; in the SQL editor run `supabase/schema.sql` (creates tables, RLS, demo GlowCo data).
2. `cp .env.example .env.local` and fill in the Supabase URL and service-role key (Settings > API). `ANTHROPIC_API_KEY` is optional.
3. `npm install && npm run dev`, then open http://localhost:3000

## What works
Paste text or upload DOCX / text-based PDF; rule-based checks plus optional AI step with a code verifier; five statuses; accept/edit/dispute; submit, approve or request changes with server-side rules; audit log rows in Postgres.

## Not done yet (do next)
- Supabase Auth login: `role` is a dropdown sent by the client; derive it from `profiles` instead (RLS policies are already in the schema).
- Knowledge Base screen (add/edit items; currently via Supabase table editor), embeddings for pgvector retrieval (column exists; keyword matching is the plan's fallback).
- Version history UI, masking of confidential passages, test set and metrics, Round 3 image review and analytics.

-- ==============================================================================
-- SurveyForm: Certificate of Recognition & QR Verification Migration
-- Run this script in the Supabase Dashboard SQL Editor
-- ==============================================================================

-- 1. Add certificate_code to survey_responses
alter table if exists public.survey_responses 
  add column if not exists certificate_code text unique;

create index if not exists idx_survey_responses_cert_code 
  on public.survey_responses(certificate_code);

-- 2. Create survey_certificates table
create table if not exists public.survey_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text unique not null,
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  recipient_name text not null,
  recipient_role text,
  survey_title text not null,
  issued_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- 3. Create indexes for quick certificate verification lookups
create index if not exists idx_survey_certificates_code 
  on public.survey_certificates(certificate_code);

create index if not exists idx_survey_certificates_survey_id 
  on public.survey_certificates(survey_id);

create index if not exists idx_survey_certificates_response_id 
  on public.survey_certificates(response_id);

-- 4. Enable Row Level Security (RLS)
alter table public.survey_certificates enable row level security;

-- 5. Policies for certificates:
-- Anyone can read and verify certificates (needed for public QR scanning)
create policy "Allow public to view certificates"
  on public.survey_certificates for select
  using (true);

-- Anyone who completes a survey can insert their certificate
create policy "Allow inserting certificates"
  on public.survey_certificates for insert
  with check (true);

-- Allow admins/owners full control
create policy "Allow all operations for certificates"
  on public.survey_certificates for all
  using (true)
  with check (true);


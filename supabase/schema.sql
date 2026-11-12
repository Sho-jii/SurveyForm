-- ==============================================================================
-- SurveyForm Platform Schema
-- ==============================================================================

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  instructions text,
  schema jsonb not null default '{}'::jsonb,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  respondent_name text,
  respondent_role text,
  answers jsonb not null default '{}'::jsonb,
  completion_status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_surveys_slug on public.surveys(slug);
create index if not exists idx_surveys_created_at on public.surveys(created_at desc);
create index if not exists idx_survey_responses_survey_id on public.survey_responses(survey_id);
create index if not exists idx_survey_responses_created_at on public.survey_responses(created_at desc);
create index if not exists idx_survey_responses_answers_gin on public.survey_responses using gin (answers);

-- Enable Row Level Security
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

-- Policies for surveys:
-- 1. Public can read published surveys
create policy "Allow public to view published surveys"
  on public.surveys for select
  using (status = 'published');

-- 2. Allow creator/authenticated/management access
create policy "Allow full access to surveys"
  on public.surveys for all
  using (true)
  with check (true);

-- Policies for survey_responses:
-- 1. Anyone can submit survey responses
create policy "Allow anyone to insert survey responses"
  on public.survey_responses for insert
  with check (true);

-- 2. Allow viewing and editing survey responses
create policy "Allow reading survey responses"
  on public.survey_responses for select
  using (true);

create policy "Allow updating survey responses"
  on public.survey_responses for update
  using (true)
  with check (true);

create policy "Allow deleting survey responses"
  on public.survey_responses for delete
  using (true);

-- ------------------------------------------------------------------------------
-- Certificate of Recognition & QR Verification
-- ------------------------------------------------------------------------------
alter table if exists public.survey_responses 
  add column if not exists certificate_code text unique;

create index if not exists idx_survey_responses_cert_code 
  on public.survey_responses(certificate_code);

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

create index if not exists idx_survey_certificates_code on public.survey_certificates(certificate_code);
create index if not exists idx_survey_certificates_survey_id on public.survey_certificates(survey_id);

alter table public.survey_certificates enable row level security;

create policy "Allow public to view certificates"
  on public.survey_certificates for select
  using (true);

create policy "Allow inserting certificates"
  on public.survey_certificates for insert
  with check (true);

-- -----------------------------------------------------------------------------
-- STORAGE & SIGNATORY CONFIGURATION
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signatures',
  'signatures',
  true,
  5242880,
  array['image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/webp', 'image/svg+xml'];

create policy "Public signatures are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'signatures');

create policy "Anyone can upload a signature"
  on storage.objects for insert
  with check (bucket_id = 'signatures');

create policy "Anyone can update signatures"
  on storage.objects for update
  using (bucket_id = 'signatures');

create policy "Anyone can delete signatures"
  on storage.objects for delete
  using (bucket_id = 'signatures');

alter table public.surveys 
add column if not exists signatory_name text default 'JARIB M. SIOCO',
add column if not exists signatory_title text default 'Lead Researcher & Platform Architect',
add column if not exists signatory_organization text default 'HITOVIS Research Project',
add column if not exists signatory_signature_url text;

alter table public.survey_certificates
add column if not exists signatory_name text default 'JARIB M. SIOCO',
add column if not exists signatory_title text default 'Lead Researcher & Platform Architect',
add column if not exists signatory_organization text default 'HITOVIS Research Project',
add column if not exists signatory_signature_url text;




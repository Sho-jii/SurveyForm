-- ==============================================================================
-- HITOVIS / UNIVERSAL SURVEY PLATFORM
-- Storage Bucket & Custom Signatory Migration Script
-- ==============================================================================
-- Description:
-- 1. Creates the 'signatures' Supabase Storage bucket for custom survey creator signatures.
-- 2. Sets public read and upload RLS policies on storage.objects.
-- 3. Adds signatory details columns to 'surveys' and 'survey_certificates'.
-- ==============================================================================

-- 1. CREATE 'signatures' STORAGE BUCKET
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'signatures',
  'signatures',
  true,
  5242880, -- 5 MB limit
  array['image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/webp', 'image/svg+xml'];

-- 2. STORAGE OBJECT RLS POLICIES
-- Drop existing policies if they exist to prevent duplication
drop policy if exists "Public signatures are viewable by everyone" on storage.objects;
drop policy if exists "Anyone can upload a signature" on storage.objects;
drop policy if exists "Anyone can update signatures" on storage.objects;
drop policy if exists "Anyone can delete signatures" on storage.objects;

-- Allow public read access to all signature images in the 'signatures' bucket
create policy "Public signatures are viewable by everyone"
on storage.objects for select
using (bucket_id = 'signatures');

-- Allow inserting signature files into the 'signatures' bucket
create policy "Anyone can upload a signature"
on storage.objects for insert
with check (bucket_id = 'signatures');

-- Allow updating signature files
create policy "Anyone can update signatures"
on storage.objects for update
using (bucket_id = 'signatures');

-- Allow deleting signature files
create policy "Anyone can delete signatures"
on storage.objects for delete
using (bucket_id = 'signatures');

-- 3. ADD SIGNATORY COLUMNS TO 'surveys'
alter table public.surveys 
add column if not exists signatory_name text default 'JARIB M. SIOCO',
add column if not exists signatory_title text default 'Lead Researcher & Platform Architect',
add column if not exists signatory_organization text default 'HITOVIS Research Project',
add column if not exists signatory_signature_url text;

-- 4. ADD SIGNATORY COLUMNS TO 'survey_certificates'
alter table public.survey_certificates
add column if not exists signatory_name text default 'JARIB M. SIOCO',
add column if not exists signatory_title text default 'Lead Researcher & Platform Architect',
add column if not exists signatory_organization text default 'HITOVIS Research Project',
add column if not exists signatory_signature_url text;

-- Refresh schema cache notification
notify pgrst, 'reload schema';


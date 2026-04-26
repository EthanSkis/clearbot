-- =============================================================
-- Phase 2 — Form templates (one canonical PDF per agency × license_type)
-- =============================================================
create table if not exists public.form_templates (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references public.agencies (id) on delete cascade,
  license_type    text not null,
  name            text not null,
  version         text not null default 'v1',
  pdf_storage_path text,                  -- bucket: form-templates
  field_mappings  jsonb not null default '{}'::jsonb,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (agency_id, license_type, version)
);
create index if not exists form_templates_agency_id_idx on public.form_templates (agency_id);
create index if not exists form_templates_license_type_idx on public.form_templates (license_type);

drop trigger if exists form_templates_set_updated_at on public.form_templates;
create trigger form_templates_set_updated_at before update on public.form_templates
  for each row execute function public.set_updated_at();

alter table public.form_templates enable row level security;
-- Templates are global reference data; any authed user may read them.
drop policy if exists form_templates_read on public.form_templates;
create policy form_templates_read on public.form_templates
  for select to authenticated using (true);
-- Inserts/updates happen via service-role only (admin onboarding scripts).

-- Bucket for the source PDFs. Private; downloaded by the worker via service-role.
insert into storage.buckets (id, name, public, file_size_limit)
values ('form-templates', 'form-templates', false, 26214400)
on conflict (id) do nothing;
-- Generated packets reuse the existing 'documents' bucket so they show up in
-- the audit pack and documents UI alongside everything else.

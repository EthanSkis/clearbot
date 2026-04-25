-- =============================================================
-- Global agency registry (read-only for all authed users)
-- =============================================================
create table if not exists public.agencies (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  jurisdiction_level  text not null check (jurisdiction_level in ('federal','state','county','municipal')),
  state               text,
  description         text,
  portal_url          text,
  status              text not null default 'live',
  filings_count       int not null default 0,
  last_changed_at     timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists agencies_state_idx on public.agencies (state);

create table if not exists public.agency_changes (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references public.agencies (id) on delete cascade,
  kind        text not null check (kind in ('form','fee','deadline','portal')),
  detail      text not null,
  occurred_at timestamptz not null default now()
);
create index if not exists agency_changes_agency_id_idx on public.agency_changes (agency_id);
create index if not exists agency_changes_occurred_at_idx on public.agency_changes (occurred_at desc);

alter table public.agencies enable row level security;
alter table public.agency_changes enable row level security;

drop policy if exists agencies_read on public.agencies;
create policy agencies_read on public.agencies for select to authenticated using (true);

drop policy if exists agency_changes_read on public.agency_changes;
create policy agency_changes_read on public.agency_changes for select to authenticated using (true);

-- Seed a representative slice of the agency catalog
insert into public.agencies (code, name, jurisdiction_level, state, portal_url, filings_count)
values
  ('TX TABC', 'Texas Alcoholic Beverage Commission', 'state', 'TX', 'https://www.tabc.texas.gov', 24),
  ('CA ABC',  'California Dept. of Alcoholic Beverage Control', 'state', 'CA', 'https://www.abc.ca.gov', 19),
  ('IL LCC',  'Illinois Liquor Control Commission', 'state', 'IL', 'https://www2.illinois.gov/ilcc', 17),
  ('FL DBPR', 'Florida Dept. of Business & Professional Regulation', 'state', 'FL', 'https://www.myfloridalicense.com', 14),
  ('NY DTF',  'New York Dept. of Taxation & Finance', 'state', 'NY', 'https://www.tax.ny.gov', 12),
  ('CO DOR',  'Colorado Dept. of Revenue', 'state', 'CO', 'https://cdor.colorado.gov', 9),
  ('GA DOR',  'Georgia Dept. of Revenue', 'state', 'GA', 'https://dor.georgia.gov', 7),
  ('WA LCB',  'Washington Liquor & Cannabis Board', 'state', 'WA', 'https://lcb.wa.gov', 5),
  ('TX DSHS', 'Texas Dept. of State Health Services', 'state', 'TX', 'https://www.dshs.texas.gov', 11),
  ('NYC DOH', 'NYC Dept. of Health & Mental Hygiene', 'municipal', 'NY', 'https://www1.nyc.gov/site/doh', 8),
  ('LA County EH', 'Los Angeles County Environmental Health', 'county', 'CA', 'https://ph.lacounty.gov/eh', 6),
  ('Chicago DOB', 'Chicago Dept. of Buildings', 'municipal', 'IL', 'https://www.chicago.gov/city/en/depts/bldgs.html', 4),
  ('City of Austin', 'City of Austin Development Services', 'municipal', 'TX', 'https://www.austintexas.gov/department/development-services', 3),
  ('Atlanta Fire', 'Atlanta Fire Rescue Department', 'municipal', 'GA', 'https://www.atlantaga.gov/government/departments/fire-rescue', 3),
  ('Dallas County HHS', 'Dallas County Health & Human Services', 'county', 'TX', 'https://www.dallascounty.org/departments/dchhs', 3),
  ('Denver BLDG', 'Denver Community Planning & Development', 'municipal', 'CO', 'https://www.denvergov.org/Government/Agencies-Departments-Offices/Community-Planning-and-Development', 2),
  ('TTB', 'Alcohol & Tobacco Tax & Trade Bureau', 'federal', null, 'https://www.ttb.gov', 12),
  ('FDA', 'Food & Drug Administration', 'federal', null, 'https://www.fda.gov', 8),
  ('DEA', 'Drug Enforcement Administration', 'federal', null, 'https://www.dea.gov', 4),
  ('FAA', 'Federal Aviation Administration', 'federal', null, 'https://www.faa.gov', 2)
on conflict (code) do nothing;

insert into public.agency_changes (agency_id, kind, detail, occurred_at)
select id, k::text, d::text, ts::timestamptz from (
  values
    ('NYC DOH', 'form',     'HMH-203 revised to 2026.04 · 2 new signature fields', now() - interval '12 minutes'),
    ('TX TABC', 'fee',      'Retail Dealer fee +$25 effective May 1', now() - interval '58 minutes'),
    ('IL LCC',  'deadline', 'Cook County liquor deadline advanced 5 days', now() - interval '2 hours'),
    ('FL DBPR', 'portal',   'MyFloridaLicense portal cert renewed · all flows re-validated', now() - interval '1 day'),
    ('CA ABC',  'form',     'ABC-257 new attestation checkbox · existing filings re-prepared', now() - interval '2 days')
) as v(code, k, d, ts)
join public.agencies a on a.code = v.code
on conflict do nothing;

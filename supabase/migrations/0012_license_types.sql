-- =============================================================
-- License-type catalog (read-only for all authed users)
-- =============================================================
-- Until now `licenses.license_type` was a free-text column. That made the
-- "Auto-detect agency" option in the New License drawer impossible to honor
-- and meant the marketing claim of "1,200+ canonical types" had nothing to
-- back it. This migration introduces a canonical catalog: each row binds a
-- license type to its issuing agency, default cycle, and default fee, so
-- the UI can offer a typed combobox and the server can resolve the agency
-- without guesswork.
--
-- The seed below covers the 20 agencies already loaded in 0003. It is
-- intentionally a starter set — additional types are added by future
-- migrations rather than by code.

create table if not exists public.license_types (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  category            text not null,
  jurisdiction_level  text not null check (jurisdiction_level in ('federal','state','county','municipal')),
  state               text,
  agency_id           uuid references public.agencies (id) on delete set null,
  default_cycle_days  int not null default 365,
  default_fee_cents   int not null default 0,
  description         text,
  created_at          timestamptz not null default now()
);
create index if not exists license_types_state_idx       on public.license_types (state);
create index if not exists license_types_agency_id_idx   on public.license_types (agency_id);
create index if not exists license_types_category_idx    on public.license_types (category);

alter table public.license_types enable row level security;
drop policy if exists license_types_read on public.license_types;
create policy license_types_read on public.license_types
  for select to authenticated using (true);

-- Optional canonical pointer from a tenant's license to the catalog row.
-- Keeping the free-text `license_type` column lets users record exotic or
-- locally-named permits the catalog hasn't grown to cover yet.
alter table public.licenses
  add column if not exists license_type_id uuid references public.license_types (id) on delete set null;
create index if not exists licenses_license_type_id_idx on public.licenses (license_type_id);

-- =============================================================
-- Seed
-- =============================================================
insert into public.license_types
  (code, name, category, jurisdiction_level, state, agency_id, default_cycle_days, default_fee_cents, description)
select v.code, v.name, v.category, v.jurisdiction_level, v.state, a.id, v.cycle, v.fee, v.description
from (values
  -- Texas Alcoholic Beverage Commission
  ('tx-tabc-mb',   'Mixed Beverage Permit (MB)',                       'alcohol_retail',       'state', 'TX', 'TX TABC',          730,  750000, 'On-premise mixed beverage sales for restaurants and bars.'),
  ('tx-tabc-bg',   'Wine & Beer Retailer''s Permit (BG)',              'alcohol_retail',       'state', 'TX', 'TX TABC',          730,  140000, 'On-premise wine & beer sales.'),
  ('tx-tabc-bq',   'Wine & Beer Retailer''s Off-Premise Permit (BQ)',  'alcohol_retail',       'state', 'TX', 'TX TABC',          730,   70000, 'Off-premise wine & beer sales.'),
  ('tx-tabc-be',   'Beer Retailer''s On-Premise License (BE)',         'alcohol_retail',       'state', 'TX', 'TX TABC',          730,   70000, 'On-premise beer-only sales.'),
  ('tx-tabc-bf',   'Beer Retailer''s Off-Premise License (BF)',        'alcohol_retail',       'state', 'TX', 'TX TABC',          730,   40000, 'Off-premise beer-only sales.'),
  ('tx-tabc-bp',   'Brewpub License (BP)',                             'alcohol_manufacturer', 'state', 'TX', 'TX TABC',          730,  150000, 'Brewing and on-premise sale of beer/ale.'),
  ('tx-tabc-cb',   'Caterer''s Permit (CB)',                           'alcohol_retail',       'state', 'TX', 'TX TABC',          730,  150000, 'Off-site catering sale of alcoholic beverages.'),

  -- California Department of Alcoholic Beverage Control
  ('ca-abc-21',    'Type 21 — Off-Sale General',                       'alcohol_retail',       'state', 'CA', 'CA ABC',           365,   30000, 'Liquor store license — off-premises beer/wine/spirits.'),
  ('ca-abc-20',    'Type 20 — Off-Sale Beer & Wine',                   'alcohol_retail',       'state', 'CA', 'CA ABC',           365,   25000, 'Off-premises beer and wine only.'),
  ('ca-abc-41',    'Type 41 — On-Sale Beer & Wine Eating Place',       'alcohol_retail',       'state', 'CA', 'CA ABC',           365,   38500, 'Restaurant beer and wine.'),
  ('ca-abc-47',    'Type 47 — On-Sale General Eating Place',           'alcohol_retail',       'state', 'CA', 'CA ABC',           365,  105500, 'Restaurant full liquor.'),
  ('ca-abc-48',    'Type 48 — On-Sale General Public Premises',        'alcohol_retail',       'state', 'CA', 'CA ABC',           365,   89500, 'Bar / nightclub full liquor (21+).'),
  ('ca-abc-23',    'Type 23 — Small Beer Manufacturer',                'alcohol_manufacturer', 'state', 'CA', 'CA ABC',           365,   40000, 'Microbrewery up to 60,000 barrels/yr.'),

  -- Illinois Liquor Control Commission
  ('il-lcc-1a',    'Class 1A Tavern Liquor License',                   'alcohol_retail',       'state', 'IL', 'IL LCC',           365,  175000, 'Bar / tavern license.'),
  ('il-lcc-2',     'Class 2 Restaurant Liquor License',                'alcohol_retail',       'state', 'IL', 'IL LCC',           365,  150000, 'Restaurant on-premise liquor.'),
  ('il-lcc-bp',    'Brew Pub License',                                 'alcohol_manufacturer', 'state', 'IL', 'IL LCC',           365,  100000, 'Brewing + on-premise sales.'),
  ('il-lcc-cat',   'Catering Liquor License',                          'alcohol_retail',       'state', 'IL', 'IL LCC',           365,   75000, 'Off-site liquor catering.'),

  -- Florida DBPR
  ('fl-dbpr-4cop', '4COP Quota License',                               'alcohol_retail',       'state', 'FL', 'FL DBPR',          365,  182000, 'Full liquor on/off-premise (quota-restricted).'),
  ('fl-dbpr-2cop', '2COP Beer & Wine On/Off Premises',                 'alcohol_retail',       'state', 'FL', 'FL DBPR',          365,   39200, 'Beer and wine on/off premises.'),
  ('fl-dbpr-1aps', '1APS Package Beer Off-Premises',                   'alcohol_retail',       'state', 'FL', 'FL DBPR',          365,   11200, 'Package beer off-premise only.'),

  -- New York (filed via NYSLA but tax obligations via DTF; using DTF until SLA is seeded)
  ('ny-dtf-op',    'On-Premises Liquor License',                       'alcohol_retail',       'state', 'NY', 'NY DTF',           730,  409800, 'Bar/restaurant on-premise liquor.'),
  ('ny-dtf-rw',    'Restaurant Wine License',                          'alcohol_retail',       'state', 'NY', 'NY DTF',           730,   96000, 'Restaurant wine only.'),
  ('ny-dtf-bw',    'Beer & Wine Product License',                      'alcohol_retail',       'state', 'NY', 'NY DTF',           730,   46200, 'Beer and wine product license.'),

  -- Colorado DOR Liquor Enforcement
  ('co-dor-hr',    'Hotel & Restaurant Liquor License',                'alcohol_retail',       'state', 'CO', 'CO DOR',           365,   75000, 'Hotel/restaurant liquor.'),
  ('co-dor-tav',   'Tavern Liquor License',                            'alcohol_retail',       'state', 'CO', 'CO DOR',           365,   75000, 'Tavern / bar liquor.'),
  ('co-dor-rls',   'Retail Liquor Store License',                      'alcohol_retail',       'state', 'CO', 'CO DOR',           365,   30000, 'Liquor store off-premise.'),

  -- Georgia DOR Alcohol & Tobacco
  ('ga-dor-rcd',   'Retail Consumption Dealer License',                'alcohol_retail',       'state', 'GA', 'GA DOR',           365,   50000, 'On-premise liquor sales.'),
  ('ga-dor-rpd',   'Retail Package Dealer License',                    'alcohol_retail',       'state', 'GA', 'GA DOR',           365,   50000, 'Off-premise package liquor.'),

  -- Washington Liquor & Cannabis Board
  ('wa-lcb-bw-r',  'Beer & Wine Restaurant License',                   'alcohol_retail',       'state', 'WA', 'WA LCB',           365,   40000, 'Restaurant beer and wine.'),
  ('wa-lcb-sbw',   'Spirits/Beer/Wine Restaurant Service License',     'alcohol_retail',       'state', 'WA', 'WA LCB',           365,  200000, 'Full-service restaurant liquor.'),

  -- Texas DSHS
  ('tx-dshs-rfp',  'Retail Food Establishment Permit',                 'food_service',         'state', 'TX', 'TX DSHS',          365,   25800, 'Brick-and-mortar food service.'),
  ('tx-dshs-mfu',  'Mobile Food Unit Permit',                          'food_mobile',          'state', 'TX', 'TX DSHS',          365,   25800, 'Food truck / mobile unit.'),
  ('tx-dshs-fhc',  'Food Handler Certification',                       'health',               'state', 'TX', 'TX DSHS',          730,     700, 'Per-employee food handler card.'),

  -- NYC Department of Health
  ('nyc-doh-fse',  'Food Service Establishment Permit',                'food_service',         'municipal', 'NY', 'NYC DOH',      730,   28000, 'Restaurant food service permit.'),
  ('nyc-doh-fpc',  'Food Protection Certificate',                      'health',               'municipal', 'NY', 'NYC DOH',     1825,   11400, 'Manager-on-duty food safety cert.'),
  ('nyc-doh-mfv',  'Mobile Food Vending Permit',                       'food_mobile',          'municipal', 'NY', 'NYC DOH',      730,   20000, 'Mobile vendor permit (capped supply).'),

  -- LA County Environmental Health
  ('la-cty-r1',    'Restaurant Health Permit — Risk 1',                'food_service',         'county', 'CA', 'LA County EH',    365,   34900, 'Lowest-risk food service.'),
  ('la-cty-r2',    'Restaurant Health Permit — Risk 2',                'food_service',         'county', 'CA', 'LA County EH',    365,   61200, 'Mid-risk food service.'),
  ('la-cty-r3',    'Restaurant Health Permit — Risk 3',                'food_service',         'county', 'CA', 'LA County EH',    365,  103600, 'Highest-risk food service.'),
  ('la-cty-cart',  'Mobile Food Cart Permit',                          'food_mobile',          'county', 'CA', 'LA County EH',    365,   34900, 'Pushcart / mobile food unit.'),

  -- Chicago Department of Buildings (foodservice routed through DOB intake here)
  ('chi-dob-ppa',  'Public Place of Amusement License',                'entertainment',        'municipal', 'IL', 'Chicago DOB',  730,   38500, 'PPA license for music/entertainment venues.'),
  ('chi-dob-rfe',  'Retail Food Establishment License',                'food_service',         'municipal', 'IL', 'Chicago DOB',  730,   66000, 'City of Chicago retail food.'),

  -- City of Austin
  ('atx-mfv',      'Mobile Food Vendor Permit',                        'food_mobile',          'municipal', 'TX', 'City of Austin', 365, 20000, 'Austin mobile vendor permit.'),
  ('atx-omv',      'Outdoor Music Venue Permit',                       'entertainment',        'municipal', 'TX', 'City of Austin', 365, 40000, 'Outdoor music venue permit.'),

  -- Atlanta Fire Rescue
  ('atl-fire-i',   'Annual Fire Inspection Certificate',               'fire',                 'municipal', 'GA', 'Atlanta Fire',  365, 15000, 'Annual occupancy inspection.'),
  ('atl-fire-h',   'Hood Suppression System Permit',                   'fire',                 'municipal', 'GA', 'Atlanta Fire',  365, 12500, 'Kitchen hood suppression certification.'),

  -- Dallas County HHS
  ('dal-mfe',      'Mobile Food Establishment Permit',                 'food_mobile',          'county', 'TX', 'Dallas County HHS', 365, 25800, 'Dallas County mobile food permit.'),

  -- Denver Building Department
  ('den-bldg-cou', 'Certificate of Occupancy Update',                  'building',             'municipal', 'CO', 'Denver BLDG',  1825, 25000, 'Re-issuance after material change.'),

  -- TTB (federal alcohol)
  ('ttb-bn',       'Brewer''s Notice',                                 'federal_alcohol',      'federal', null, 'TTB',           1825,      0, 'Federal brewing facility approval.'),
  ('ttb-dsp',      'Distilled Spirits Plant Permit',                   'federal_alcohol',      'federal', null, 'TTB',           1825,      0, 'Federal distillery permit.'),
  ('ttb-wbp',      'Wholesaler Basic Permit',                          'federal_alcohol',      'federal', null, 'TTB',           1825,      0, 'Federal wholesaler/importer permit.'),
  ('ttb-fwlt',     'Federal Wholesale Liquor Tax Stamp',               'federal_alcohol',      'federal', null, 'TTB',            365,  25000, 'Annual special occupational tax stamp.'),

  -- FDA
  ('fda-ffr',      'Food Facility Registration',                       'federal_food',         'federal', null, 'FDA',            730,      0, 'Biennial FDA food facility registration.'),

  -- DEA
  ('dea-224',      'DEA Form 224 — Practitioner Registration',         'federal_dea',          'federal', null, 'DEA',           1095,  88800, '3-year practitioner controlled-substances registration.'),
  ('dea-225',      'DEA Form 225 — Manufacturer/Distributor',          'federal_dea',          'federal', null, 'DEA',            365, 313800, 'Annual mfr/distributor registration.')
) as v(code, name, category, jurisdiction_level, state, agency_code, cycle, fee, description)
join public.agencies a on a.code = v.agency_code
on conflict (code) do nothing;

-- =============================================================
-- Idaho coverage — Boise + McCall (first state with full data + reminders)
-- =============================================================
-- Seeds the agencies, license-type catalog rows, and form-template
-- placeholders required for a Boise- or McCall-based bar/restaurant operator
-- with a full liquor program to onboard, get renewal reminders, and have
-- packet generation attempt to run end-to-end.
--
-- Portal RPA for these agencies is not implemented yet; the worker adapter
-- stubs return `not_implemented` exactly like the existing TX TABC / CA ABC
-- placeholders so the registry stays complete for future work.
--
-- Note on health districts: both Ada County (Boise) and Valley County
-- (McCall) sit in Idaho's Public Health District 4 — Central District
-- Health — so a single regional agency covers both cities' food permits.

-- -------------------------------------------------------------
-- Agencies
-- -------------------------------------------------------------
insert into public.agencies (code, name, jurisdiction_level, state, portal_url, filings_count)
values
  ('ID ISLD',     'Idaho State Liquor Division',                                 'state',     'ID', 'https://liquor.idaho.gov',          0),
  ('ID ISP ABC',  'Idaho State Police — Alcohol Beverage Control',               'state',     'ID', 'https://isp.idaho.gov/abc',         0),
  ('ID TAX',      'Idaho State Tax Commission',                                  'state',     'ID', 'https://tax.idaho.gov',             0),
  ('ID DHW',      'Idaho Department of Health & Welfare',                        'state',     'ID', 'https://healthandwelfare.idaho.gov', 0),
  ('ID CDH',      'Central District Health (Ada + Valley counties)',             'county',    'ID', 'https://cdh.idaho.gov',             0),
  ('Boise Clerk', 'City of Boise — City Clerk',                                  'municipal', 'ID', 'https://www.cityofboise.org',       0),
  ('McCall Clerk','City of McCall — City Clerk',                                 'municipal', 'ID', 'https://www.mccall.id.us',          0)
on conflict (code) do nothing;

-- -------------------------------------------------------------
-- License-type catalog
-- -------------------------------------------------------------
insert into public.license_types
  (code, name, category, jurisdiction_level, state, agency_id, default_cycle_days, default_fee_cents, description)
select v.code, v.name, v.category, v.jurisdiction_level, v.state, a.id, v.cycle, v.fee, v.description
from (values
  -- Idaho State Liquor Division (the gating "by-the-drink" full-bar license; quota-restricted)
  ('id-isld-retail',      'Retail Liquor License (by the drink)',          'alcohol_retail',   'state',     'ID', 'ID ISLD',      365,  75000, 'State retail liquor license — full bar by the drink. Quota-restricted in Idaho.'),

  -- Idaho State Police, Bureau of Alcohol Beverage Control
  ('id-isp-beer-onoff',   'Beer License (on/off premise)',                 'alcohol_retail',   'state',     'ID', 'ID ISP ABC',   365,  20000, 'State beer license issued by ISP ABC.'),
  ('id-isp-wine-bythe',   'Wine License (by the drink)',                   'alcohol_retail',   'state',     'ID', 'ID ISP ABC',   365,  20000, 'State wine license issued by ISP ABC.'),

  -- Central District Health (food permit for Ada + Valley counties — Boise & McCall)
  ('id-cdh-food',         'Food Establishment Permit (CDH)',               'food_service',     'county',    'ID', 'ID CDH',       365,  25000, 'Health-district food establishment permit covering Ada (Boise) and Valley (McCall) counties.'),

  -- City of Boise
  ('id-boise-business',   'City of Boise — Business License',              'business_general', 'municipal', 'ID', 'Boise Clerk',  365,   5000, 'City of Boise general business license.'),
  ('id-boise-liquor',     'City of Boise — Liquor License',                'alcohol_retail',   'municipal', 'ID', 'Boise Clerk',  365, 100000, 'City of Boise liquor license — issued alongside the state ISLD retail license.'),

  -- City of McCall
  ('id-mccall-business',  'City of McCall — Business License',             'business_general', 'municipal', 'ID', 'McCall Clerk', 365,   5000, 'City of McCall general business license.'),
  ('id-mccall-liquor',    'City of McCall — Liquor License',               'alcohol_retail',   'municipal', 'ID', 'McCall Clerk', 365,  50000, 'City of McCall liquor license — issued alongside the state ISLD retail license.')
) as v(code, name, category, jurisdiction_level, state, agency_code, cycle, fee, description)
join public.agencies a on a.code = v.agency_code
on conflict (code) do nothing;

-- -------------------------------------------------------------
-- Form-template placeholders
-- -------------------------------------------------------------
-- One row per renewal-bearing license type. The PDF blobs themselves are
-- uploaded out-of-band to the `form-templates` bucket at the listed paths;
-- field_mappings is a starter skeleton that will be tightened once the real
-- agency forms are vendored. With no PDF present, the packet generator
-- falls back to its synthetic-PDF path, so reminders + intake still work.
insert into public.form_templates (agency_id, license_type, name, version, pdf_storage_path, field_mappings, notes)
select a.id, v.license_type, v.name, 'v1', v.pdf_path, v.mappings::jsonb, v.notes
from (values
  ('ID ISLD',      'id-isld-retail',     'ISLD Retail Liquor License Renewal',                'id/id-isld-retail-v1.pdf',     '{"license_number":"License No.","legal_name":"Licensee","dba":"DBA","address":"Premises Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from liquor.idaho.gov.'),
  ('ID ISP ABC',   'id-isp-beer-onoff',  'ISP ABC Beer License Renewal',                      'id/id-isp-beer-onoff-v1.pdf',  '{"license_number":"License No.","legal_name":"Licensee","dba":"DBA","address":"Premises Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from isp.idaho.gov/abc.'),
  ('ID ISP ABC',   'id-isp-wine-bythe',  'ISP ABC Wine License Renewal',                      'id/id-isp-wine-bythe-v1.pdf',  '{"license_number":"License No.","legal_name":"Licensee","dba":"DBA","address":"Premises Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from isp.idaho.gov/abc.'),
  ('ID CDH',       'id-cdh-food',        'CDH Food Establishment Permit Renewal',             'id/id-cdh-food-v1.pdf',        '{"license_number":"Permit No.","legal_name":"Operator","dba":"Establishment Name","address":"Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from cdh.idaho.gov.'),
  ('Boise Clerk',  'id-boise-business',  'City of Boise Business License Renewal',            'id/id-boise-business-v1.pdf',  '{"license_number":"License No.","legal_name":"Business","dba":"DBA","address":"Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from cityofboise.org.'),
  ('Boise Clerk',  'id-boise-liquor',    'City of Boise Liquor License Renewal',              'id/id-boise-liquor-v1.pdf',    '{"license_number":"License No.","legal_name":"Licensee","dba":"DBA","address":"Premises Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from cityofboise.org.'),
  ('McCall Clerk', 'id-mccall-business', 'City of McCall Business License Renewal',           'id/id-mccall-business-v1.pdf', '{"license_number":"License No.","legal_name":"Business","dba":"DBA","address":"Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from mccall.id.us.'),
  ('McCall Clerk', 'id-mccall-liquor',   'City of McCall Liquor License Renewal',             'id/id-mccall-liquor-v1.pdf',   '{"license_number":"License No.","legal_name":"Licensee","dba":"DBA","address":"Premises Address","city":"City","state":"State","zip":"ZIP","expiry_date":"Expires"}', 'PDF pending vendoring from mccall.id.us.')
) as v(agency_code, license_type, name, pdf_path, mappings, notes)
join public.agencies a on a.code = v.agency_code
on conflict (agency_id, license_type, version) do nothing;

-- =============================================================
-- Workspace-scoped data
-- =============================================================

create table if not exists public.locations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          text not null,
  address_line1 text,
  city          text,
  state         text,
  zip           text,
  manager_id    uuid references auth.users (id) on delete set null,
  opened_year   int,
  tag           text default 'Flagship',
  status        text not null default 'active' check (status in ('active','closed','archived')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists locations_workspace_id_idx on public.locations (workspace_id);
create index if not exists locations_state_idx on public.locations (state);

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at before update on public.locations
  for each row execute function public.set_updated_at();

alter table public.locations enable row level security;
drop policy if exists locations_select on public.locations;
create policy locations_select on public.locations for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists locations_insert on public.locations;
create policy locations_insert on public.locations for insert to authenticated
  with check (public.is_workspace_member(workspace_id));
drop policy if exists locations_update on public.locations;
create policy locations_update on public.locations for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
drop policy if exists locations_delete on public.locations;
create policy locations_delete on public.locations for delete to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin','manager','ops'));

-- Licenses
create table if not exists public.licenses (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  location_id     uuid not null references public.locations (id) on delete cascade,
  agency_id       uuid references public.agencies (id) on delete set null,
  license_type    text not null,
  license_number  text,
  issued_at       date,
  expires_at      date,
  cycle_days      int not null default 365,
  fee_cents       int not null default 0,
  status          text not null default 'active' check (status in ('active','pending','revoked','lapsed')),
  automation_mode text not null default 'auto' check (automation_mode in ('alert','prep','auto')),
  source_url      text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists licenses_workspace_id_idx on public.licenses (workspace_id);
create index if not exists licenses_location_id_idx on public.licenses (location_id);
create index if not exists licenses_expires_at_idx on public.licenses (expires_at);

drop trigger if exists licenses_set_updated_at on public.licenses;
create trigger licenses_set_updated_at before update on public.licenses
  for each row execute function public.set_updated_at();

alter table public.licenses enable row level security;
drop policy if exists licenses_all on public.licenses;
create policy licenses_all on public.licenses for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Filings
create table if not exists public.filings (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references public.workspaces (id) on delete cascade,
  license_id          uuid not null references public.licenses (id) on delete cascade,
  location_id         uuid not null references public.locations (id) on delete cascade,
  agency_id           uuid references public.agencies (id) on delete set null,
  short_id            text not null,
  stage               text not null default 'intake' check (stage in ('intake','prep','review','submit','confirm','done','rejected')),
  mode                text not null default 'auto' check (mode in ('alert','prep','auto')),
  fee_cents           int not null default 0,
  filed_at            timestamptz,
  cycle_days_taken    int,
  confirmation_number text,
  owner_id            uuid references auth.users (id) on delete set null,
  status              text not null default 'in_flight' check (status in ('in_flight','confirmed','pending','rejected')),
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (workspace_id, short_id)
);
create index if not exists filings_workspace_id_idx on public.filings (workspace_id);
create index if not exists filings_license_id_idx on public.filings (license_id);
create index if not exists filings_stage_idx on public.filings (stage);
create index if not exists filings_filed_at_idx on public.filings (filed_at desc);

drop trigger if exists filings_set_updated_at on public.filings;
create trigger filings_set_updated_at before update on public.filings
  for each row execute function public.set_updated_at();

alter table public.filings enable row level security;
drop policy if exists filings_all on public.filings;
create policy filings_all on public.filings for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Documents (metadata; bytes live in Supabase Storage)
create table if not exists public.documents (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  location_id   uuid references public.locations (id) on delete set null,
  license_id    uuid references public.licenses (id) on delete set null,
  filing_id     uuid references public.filings (id) on delete set null,
  name          text not null,
  kind          text not null default 'certificate' check (kind in ('certificate','receipt','application','correspondence')),
  mime_type     text,
  size_bytes    bigint not null default 0,
  storage_path  text,
  retention_until date,
  uploaded_by   uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists documents_workspace_id_idx on public.documents (workspace_id);
create index if not exists documents_kind_idx on public.documents (kind);
create index if not exists documents_created_at_idx on public.documents (created_at desc);

alter table public.documents enable row level security;
drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Integrations
create table if not exists public.integrations (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  provider        text not null,
  category        text not null,
  status          text not null default 'connected' check (status in ('connected','syncing','error','disconnected')),
  config          jsonb not null default '{}'::jsonb,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, provider)
);
drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at before update on public.integrations
  for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;
drop policy if exists integrations_all on public.integrations;
create policy integrations_all on public.integrations for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Webhooks
create table if not exists public.webhooks (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  url             text not null,
  event           text not null default 'license.state_changed',
  signing_secret  text not null,
  active          boolean not null default true,
  last_fired_at   timestamptz,
  last_status     text,
  created_at      timestamptz not null default now()
);

alter table public.webhooks enable row level security;
drop policy if exists webhooks_all on public.webhooks;
create policy webhooks_all on public.webhooks for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- API keys
create table if not exists public.api_keys (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  name            text not null,
  key_prefix      text not null,
  key_hash        text not null,
  scope           text not null default 'read_write' check (scope in ('read','read_write')),
  created_by      uuid references auth.users (id) on delete set null,
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.api_keys enable row level security;
drop policy if exists api_keys_all on public.api_keys;
create policy api_keys_all on public.api_keys for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Activity log
create table if not exists public.activity_log (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  actor_id      uuid references auth.users (id) on delete set null,
  actor_label   text,
  type          text not null check (type in ('filed','prepared','alert','agency','payment','team','integration','setting','document')),
  title         text not null,
  detail        text,
  metadata      jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists activity_log_workspace_id_idx on public.activity_log (workspace_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;
drop policy if exists activity_log_select on public.activity_log;
create policy activity_log_select on public.activity_log for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists activity_log_insert on public.activity_log;
create policy activity_log_insert on public.activity_log for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

-- Billing
create table if not exists public.payment_methods (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  kind          text not null default 'wire' check (kind in ('wire','ach','card')),
  label         text not null,
  last4         text,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.payment_methods enable row level security;
drop policy if exists payment_methods_all on public.payment_methods;
create policy payment_methods_all on public.payment_methods for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.workspace_role(workspace_id) in ('owner','admin','finance'));

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  short_id        text not null,
  period_label    text not null,
  period_start    date not null,
  period_end      date not null,
  amount_cents    int not null,
  status          text not null default 'pending' check (status in ('pending','paid','failed')),
  method          text,
  issued_at       timestamptz not null default now(),
  paid_at         timestamptz,
  unique (workspace_id, short_id)
);
create index if not exists invoices_workspace_id_idx on public.invoices (workspace_id);

alter table public.invoices enable row level security;
drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select to authenticated
  using (public.is_workspace_member(workspace_id));
drop policy if exists invoices_modify on public.invoices;
create policy invoices_modify on public.invoices for all to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin','finance'))
  with check (public.workspace_role(workspace_id) in ('owner','admin','finance'));

-- Notification preferences (per member)
create table if not exists public.notification_prefs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  member_id     uuid not null references public.workspace_members (id) on delete cascade,
  channel_email boolean not null default true,
  channel_sms   boolean not null default false,
  channel_slack boolean not null default false,
  slack_channel text,
  lead_days     int not null default 45,
  escalation_hours int not null default 48,
  unique (workspace_id, member_id)
);

alter table public.notification_prefs enable row level security;
drop policy if exists notification_prefs_all on public.notification_prefs;
create policy notification_prefs_all on public.notification_prefs for all to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- Helpers
create or replace function public.next_filing_short_id(wsid uuid)
returns text language plpgsql as $$
declare
  n int;
begin
  select coalesce(max(replace(short_id, 'CB-', ''))::int, 40000) + 1 into n
  from public.filings where workspace_id = wsid and short_id ~ '^CB-[0-9]+$';
  return 'CB-' || lpad(n::text, 5, '0');
end;
$$;

create or replace function public.next_invoice_short_id(wsid uuid, period_iso text)
returns text language plpgsql as $$
begin
  return 'INV-' || replace(period_iso, '-', '');
end;
$$;

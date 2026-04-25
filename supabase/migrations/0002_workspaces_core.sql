-- =============================================================
-- ClearBot core multi-tenant schema
-- =============================================================

-- Workspaces (tenants)
create table if not exists public.workspaces (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete restrict,
  name            text not null,
  slug            text unique,
  legal_entity    text,
  brand_logo_url  text,
  timezone        text not null default 'America/Chicago',
  plan            text not null default 'essential',
  status          text not null default 'active',
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);

-- Workspace members
create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null default 'manager' check (role in ('owner','admin','finance','manager','ops','legal')),
  scope         jsonb not null default '{}'::jsonb,
  status        text not null default 'active' check (status in ('active','suspended')),
  last_active_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- Workspace invites
create table if not exists public.workspace_invites (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  email         text not null,
  role          text not null default 'manager',
  scope         jsonb not null default '{}'::jsonb,
  token         text not null unique,
  invited_by    uuid references auth.users (id) on delete set null,
  expires_at    timestamptz not null default (now() + interval '14 days'),
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists workspace_invites_workspace_id_idx on public.workspace_invites (workspace_id);
create index if not exists workspace_invites_email_idx on public.workspace_invites (email);

-- Membership helpers
create or replace function public.is_workspace_member(wsid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = wsid and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.workspace_role(wsid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.workspace_members
  where workspace_id = wsid and user_id = auth.uid()
  limit 1;
$$;

-- updated_at touch
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- Auto-add owner as a member on workspace creation
create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new.id, new.owner_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- Backfill profile.company from sign-up metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta_company text;
begin
  meta_company := coalesce(
    new.raw_user_meta_data ->> 'company',
    new.raw_user_meta_data ->> 'workspace_name'
  );

  insert into public.profiles (id, email, full_name, company, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    meta_company,
    new.raw_user_meta_data ->> 'role'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- RLS for workspaces & members
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id) or owner_id = auth.uid());

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.workspace_role(id) in ('owner','admin'))
  with check (public.workspace_role(id) in ('owner','admin'));

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists members_insert on public.workspace_members;
create policy members_insert on public.workspace_members
  for insert to authenticated
  with check (
    public.workspace_role(workspace_id) in ('owner','admin')
    or user_id = auth.uid()
  );

drop policy if exists members_update on public.workspace_members;
create policy members_update on public.workspace_members
  for update to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin') or user_id = auth.uid())
  with check (public.workspace_role(workspace_id) in ('owner','admin') or user_id = auth.uid());

drop policy if exists members_delete on public.workspace_members;
create policy members_delete on public.workspace_members
  for delete to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin'));

drop policy if exists invites_select on public.workspace_invites;
create policy invites_select on public.workspace_invites
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists invites_insert on public.workspace_invites;
create policy invites_insert on public.workspace_invites
  for insert to authenticated
  with check (public.workspace_role(workspace_id) in ('owner','admin'));

drop policy if exists invites_update on public.workspace_invites;
create policy invites_update on public.workspace_invites
  for update to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin'))
  with check (public.workspace_role(workspace_id) in ('owner','admin'));

drop policy if exists invites_delete on public.workspace_invites;
create policy invites_delete on public.workspace_invites
  for delete to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin'));

-- Allow self-insert into profiles as a fallback to the trigger
drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

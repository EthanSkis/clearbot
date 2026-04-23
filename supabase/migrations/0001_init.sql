-- ClearBot initial schema
-- Apply via Supabase dashboard → SQL editor, or:
--   supabase db push  (if using the Supabase CLI linked to your project)

-- ============================================================================
-- profiles: app-facing mirror of auth.users
-- ============================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  company    text,
  role       text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- bookings: demo-call submissions from /book (public insert, authed self-read)
-- ============================================================================
create table if not exists public.bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete set null,
  name         text not null,
  email        text not null,
  company      text not null,
  locations    text not null,
  notes        text,
  scheduled_at timestamptz not null,
  timezone     text not null,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);

create index if not exists bookings_scheduled_at_idx on public.bookings (scheduled_at);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

alter table public.bookings enable row level security;

-- Anyone (including anon) may submit a booking from the public /book page.
create policy "bookings_public_insert"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- Authed users can read only their own bookings.
create policy "bookings_self_select"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);

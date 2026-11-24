-- Vidflow schema. Row Level Security on every table: a user only sees and changes their own rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  k text,
  intended_plan text,
  source text,
  answers jsonb not null default '{}'::jsonb,
  caption_style text not null default 'pop',
  brand_color text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  try_id text,
  ip_hash text,
  source_type text not null check (source_type in ('youtube', 'file', 'text')),
  source_url text,
  file_name text,
  title text,
  duration numeric,
  status text not null default 'working' check (status in ('working', 'ready', 'failed')),
  error text,
  analysis jsonb,
  caption_style text not null default 'pop',
  counted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id, created_at desc);
create index if not exists projects_try_idx on public.projects (try_id, created_at desc);
create index if not exists projects_ip_idx on public.projects (ip_hash, created_at desc);

-- cache of analyses for the same public video (saves AI cost); server only
create table if not exists public.analysis_cache (
  source_key text primary key,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.analysis_cache enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own projects read" on public.projects;
create policy "own projects read" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "own projects update" on public.projects;
create policy "own projects update" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own projects delete" on public.projects;
create policy "own projects delete" on public.projects for delete using (auth.uid() = user_id);
-- inserts go through the server (quotas + rate limits), with the service role

-- profile row for every new account
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- private bucket for the audio tracks of uploaded videos (server reads them with the service role)
insert into storage.buckets (id, name, public, file_size_limit)
values ('audio', 'audio', false, 52428800)
on conflict (id) do nothing;

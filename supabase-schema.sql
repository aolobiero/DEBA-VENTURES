create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  company_name text not null,
  phone text not null,
  request_type text not null,
  subject text not null,
  details text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  admin_replies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email))),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.client_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles" on public.profiles for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Public can create client requests" on public.client_requests;
create policy "Public can create client requests" on public.client_requests for insert to anon, authenticated
with check (true);

drop policy if exists "Admins can read client requests" on public.client_requests;
create policy "Admins can read client requests" on public.client_requests for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update client requests" on public.client_requests;
create policy "Admins can update client requests" on public.client_requests for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins can delete client requests" on public.client_requests;
create policy "Admins can delete client requests" on public.client_requests for delete to authenticated
using ((select public.is_admin()));

drop policy if exists "Public can subscribe to newsletter" on public.newsletter_subscribers;
create policy "Public can subscribe to newsletter" on public.newsletter_subscribers for insert to anon, authenticated
with check (true);

drop policy if exists "Admins can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can read newsletter subscribers" on public.newsletter_subscribers for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Admins can update newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can update newsletter subscribers" on public.newsletter_subscribers for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create index if not exists client_requests_created_at_idx on public.client_requests (created_at desc);
create index if not exists newsletter_subscribers_created_at_idx on public.newsletter_subscribers (created_at desc);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'client_requests') then
    alter publication supabase_realtime add table public.client_requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'newsletter_subscribers') then
    alter publication supabase_realtime add table public.newsletter_subscribers;
  end if;
end
$$;

-- After creating the admin Auth user, run:
-- insert into public.profiles (id, role) values ('AUTH_USER_UUID', 'admin')
-- on conflict (id) do update set role = 'admin';

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
  ) then
    create type public.app_role as enum ('director', 'secretary', 'teacher', 'student');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'membership_status'
  ) then
    create type public.membership_status as enum ('active', 'inactive', 'invited');
  end if;
end
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  legal_name text,
  document_number text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint schools_slug_lowercase check (slug = lower(slug)),
  constraint schools_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.school_memberships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (school_id, user_id)
);

create index if not exists idx_school_memberships_school_id
  on public.school_memberships (school_id);

create index if not exists idx_school_memberships_user_id
  on public.school_memberships (user_id);

create index if not exists idx_school_memberships_role
  on public.school_memberships (role);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_schools_updated_at on public.schools;
create trigger set_schools_updated_at
before update on public.schools
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_school_memberships_updated_at on public.school_memberships;
create trigger set_school_memberships_updated_at
before update on public.school_memberships
for each row
execute procedure public.set_current_timestamp_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set full_name = coalesce(excluded.full_name, profiles.full_name),
      email = excluded.email,
      avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

insert into public.profiles (id, full_name, email, avatar_url)
select
  users.id,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name'
  ),
  users.email,
  users.raw_user_meta_data ->> 'avatar_url'
from auth.users as users
on conflict (id) do update
set full_name = coalesce(excluded.full_name, profiles.full_name),
    email = excluded.email,
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc', now());

create or replace function public.is_active_school_member(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships membership
    where membership.school_id = target_school_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_school_role(
  target_school_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships membership
    where membership.school_id = target_school_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.shares_school_with_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships current_membership
    join public.school_memberships target_membership
      on target_membership.school_id = current_membership.school_id
    where current_membership.user_id = auth.uid()
      and current_membership.status = 'active'
      and target_membership.user_id = target_user_id
      and target_membership.status = 'active'
  );
$$;

revoke all on function public.is_active_school_member(uuid) from public;
grant execute on function public.is_active_school_member(uuid) to authenticated;

revoke all on function public.has_school_role(uuid, public.app_role[]) from public;
grant execute on function public.has_school_role(uuid, public.app_role[]) to authenticated;

revoke all on function public.shares_school_with_user(uuid) from public;
grant execute on function public.shares_school_with_user(uuid) to authenticated;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.school_memberships enable row level security;

drop policy if exists "school_members_can_view_their_schools" on public.schools;
create policy "school_members_can_view_their_schools"
on public.schools
for select
to authenticated
using (public.is_active_school_member(id));

drop policy if exists "school_admins_can_update_their_schools" on public.schools;
create policy "school_admins_can_update_their_schools"
on public.schools
for update
to authenticated
using (public.has_school_role(id, array['director', 'secretary']::public.app_role[]))
with check (public.has_school_role(id, array['director', 'secretary']::public.app_role[]));

drop policy if exists "users_can_view_profiles_from_same_school" on public.profiles;
create policy "users_can_view_profiles_from_same_school"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.shares_school_with_user(id)
);

drop policy if exists "users_can_update_own_profile" on public.profiles;
create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "users_can_view_own_memberships" on public.school_memberships;
create policy "users_can_view_own_memberships"
on public.school_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "school_admins_can_view_memberships" on public.school_memberships;
create policy "school_admins_can_view_memberships"
on public.school_memberships
for select
to authenticated
using (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
);

drop policy if exists "school_admins_can_insert_memberships" on public.school_memberships;
create policy "school_admins_can_insert_memberships"
on public.school_memberships
for insert
to authenticated
with check (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
);

drop policy if exists "school_admins_can_update_memberships" on public.school_memberships;
create policy "school_admins_can_update_memberships"
on public.school_memberships
for update
to authenticated
using (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
)
with check (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
);

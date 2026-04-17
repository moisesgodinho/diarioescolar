do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'platform_role'
  ) then
    create type public.platform_role as enum ('owner', 'admin', 'support');
  end if;
end
$$;

alter table public.schools
add column if not exists created_by_user_id uuid references auth.users(id);

create table if not exists public.platform_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_platform_staff_role
  on public.platform_staff (role);

drop trigger if exists set_platform_staff_updated_at on public.platform_staff;
create trigger set_platform_staff_updated_at
before update on public.platform_staff
for each row
execute procedure public.set_current_timestamp_updated_at();

create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_staff staff
    where staff.user_id = auth.uid()
      and staff.status = 'active'
  );
$$;

create or replace function public.has_platform_role(
  allowed_roles public.platform_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_staff staff
    where staff.user_id = auth.uid()
      and staff.status = 'active'
      and staff.role = any(allowed_roles)
  );
$$;

create or replace function public.assign_platform_staff(
  target_user_id uuid,
  target_role public.platform_role,
  target_status public.membership_status default 'active'
)
returns public.platform_staff
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_row public.platform_staff;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_platform_role(array['owner']::public.platform_role[]) then
    raise exception 'Only platform owners can manage platform staff';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'Target user not found in auth.users';
  end if;

  insert into public.platform_staff (user_id, role, status)
  values (target_user_id, target_role, target_status)
  on conflict (user_id) do update
  set role = excluded.role,
      status = excluded.status,
      updated_at = timezone('utc', now())
  returning * into assigned_row;

  return assigned_row;
end;
$$;

create or replace function public.create_school_with_director(
  school_name text,
  school_slug text,
  director_user_id uuid,
  school_legal_name text default null,
  school_document_number text default null
)
returns public.schools
language plpgsql
security definer
set search_path = public
as $$
declare
  created_school public.schools;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.has_platform_role(array['owner', 'admin']::public.platform_role[]) then
    raise exception 'Only platform owner or admin can create schools';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = director_user_id
  ) then
    raise exception 'Director user not found in auth.users';
  end if;

  insert into public.schools (
    name,
    slug,
    legal_name,
    document_number,
    created_by_user_id
  )
  values (
    school_name,
    lower(trim(school_slug)),
    school_legal_name,
    school_document_number,
    auth.uid()
  )
  returning * into created_school;

  insert into public.school_memberships (school_id, user_id, role, status)
  values (created_school.id, director_user_id, 'director', 'active')
  on conflict (school_id, user_id) do update
  set role = 'director',
      status = 'active',
      updated_at = timezone('utc', now());

  return created_school;
end;
$$;

revoke all on function public.is_platform_staff() from public;
grant execute on function public.is_platform_staff() to authenticated;

revoke all on function public.has_platform_role(public.platform_role[]) from public;
grant execute on function public.has_platform_role(public.platform_role[]) to authenticated;

revoke all on function public.assign_platform_staff(uuid, public.platform_role, public.membership_status) from public;
grant execute on function public.assign_platform_staff(uuid, public.platform_role, public.membership_status) to authenticated;

revoke all on function public.create_school_with_director(text, text, uuid, text, text) from public;
grant execute on function public.create_school_with_director(text, text, uuid, text, text) to authenticated;

alter table public.platform_staff enable row level security;

drop policy if exists "platform_staff_can_view_platform_staff" on public.platform_staff;
create policy "platform_staff_can_view_platform_staff"
on public.platform_staff
for select
to authenticated
using (public.is_platform_staff());

drop policy if exists "platform_owners_can_insert_platform_staff" on public.platform_staff;
create policy "platform_owners_can_insert_platform_staff"
on public.platform_staff
for insert
to authenticated
with check (public.has_platform_role(array['owner']::public.platform_role[]));

drop policy if exists "platform_owners_can_update_platform_staff" on public.platform_staff;
create policy "platform_owners_can_update_platform_staff"
on public.platform_staff
for update
to authenticated
using (public.has_platform_role(array['owner']::public.platform_role[]))
with check (public.has_platform_role(array['owner']::public.platform_role[]));

drop policy if exists "platform_owners_can_delete_platform_staff" on public.platform_staff;
create policy "platform_owners_can_delete_platform_staff"
on public.platform_staff
for delete
to authenticated
using (public.has_platform_role(array['owner']::public.platform_role[]));

drop policy if exists "school_members_can_view_their_schools" on public.schools;
create policy "school_members_can_view_their_schools"
on public.schools
for select
to authenticated
using (
  public.is_active_school_member(id)
  or public.is_platform_staff()
);

drop policy if exists "school_admins_can_update_their_schools" on public.schools;
create policy "school_admins_can_update_their_schools"
on public.schools
for update
to authenticated
using (
  public.has_school_role(id, array['director', 'secretary']::public.app_role[])
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
)
with check (
  public.has_school_role(id, array['director', 'secretary']::public.app_role[])
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
);

drop policy if exists "platform_staff_can_insert_schools" on public.schools;
create policy "platform_staff_can_insert_schools"
on public.schools
for insert
to authenticated
with check (
  public.has_platform_role(array['owner', 'admin']::public.platform_role[])
);

drop policy if exists "platform_staff_can_delete_schools" on public.schools;
create policy "platform_staff_can_delete_schools"
on public.schools
for delete
to authenticated
using (
  public.has_platform_role(array['owner']::public.platform_role[])
);

drop policy if exists "users_can_view_profiles_from_same_school" on public.profiles;
create policy "users_can_view_profiles_from_same_school"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.shares_school_with_user(id)
  or public.is_platform_staff()
);

drop policy if exists "users_can_update_own_profile" on public.profiles;
create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
)
with check (
  id = auth.uid()
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
);

drop policy if exists "users_can_view_own_memberships" on public.school_memberships;
create policy "users_can_view_own_memberships"
on public.school_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_platform_role(array['owner', 'admin', 'support']::public.platform_role[])
);

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
  or public.has_platform_role(array['owner', 'admin', 'support']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
)
with check (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
);

drop policy if exists "school_admins_can_delete_memberships" on public.school_memberships;
create policy "school_admins_can_delete_memberships"
on public.school_memberships
for delete
to authenticated
using (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
  or public.has_platform_role(array['owner', 'admin']::public.platform_role[])
);

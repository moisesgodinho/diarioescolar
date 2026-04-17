alter type public.platform_role add value if not exists 'education_secretary';

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

  if not public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[]) then
    raise exception 'Only platform owner, education secretary or admin can create schools';
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

drop policy if exists "school_admins_can_update_their_schools" on public.schools;
create policy "school_admins_can_update_their_schools"
on public.schools
for update
to authenticated
using (
  public.has_school_role(id, array['director', 'secretary']::public.app_role[])
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
)
with check (
  public.has_school_role(id, array['director', 'secretary']::public.app_role[])
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
);

drop policy if exists "platform_staff_can_insert_schools" on public.schools;
create policy "platform_staff_can_insert_schools"
on public.schools
for insert
to authenticated
with check (
  public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
);

drop policy if exists "users_can_update_own_profile" on public.profiles;
create policy "users_can_update_own_profile"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
)
with check (
  id = auth.uid()
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
);

drop policy if exists "users_can_view_own_memberships" on public.school_memberships;
create policy "users_can_view_own_memberships"
on public.school_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_platform_role(array['owner', 'education_secretary', 'admin', 'support']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'education_secretary', 'admin', 'support']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
)
with check (
  public.has_school_role(
    school_id,
    array['director', 'secretary']::public.app_role[]
  )
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
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
  or public.has_platform_role(array['owner', 'education_secretary', 'admin']::public.platform_role[])
);

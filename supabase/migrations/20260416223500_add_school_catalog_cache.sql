create table if not exists public.school_catalog_cache (
  inep_code text primary key,
  school_name text not null,
  city text not null,
  state text not null,
  city_ibge_code text,
  zone text not null check (zone in ('Urbana', 'Rural')),
  education_stages text[] not null default '{}',
  address text,
  neighborhood text,
  phone text,
  administrative_dependency text,
  operational_status text,
  source_year integer,
  raw_data jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_school_catalog_cache_city_ibge
  on public.school_catalog_cache (city_ibge_code);

create index if not exists idx_school_catalog_cache_city_state
  on public.school_catalog_cache (state, city);

create index if not exists idx_school_catalog_cache_synced_at
  on public.school_catalog_cache (synced_at desc);

drop trigger if exists set_school_catalog_cache_updated_at on public.school_catalog_cache;
create trigger set_school_catalog_cache_updated_at
before update on public.school_catalog_cache
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.school_catalog_cache enable row level security;

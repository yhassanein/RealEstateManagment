-- ====================================================
-- Real Estate Management App — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ====================================================

-- UUID extension
create extension if not exists "uuid-ossp";

-- ====================================================
-- profiles (extends auth.users)
-- ====================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null,
  role         text not null check (role in ('owner', 'tenant')),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'tenant')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================
-- properties
-- ====================================================
create table public.properties (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  address      text not null,
  city         text not null,
  state        text not null,
  zip          text not null,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ====================================================
-- units
-- ====================================================
create table public.units (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  unit_number  text not null,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ====================================================
-- tenants
-- ====================================================
create table public.tenants (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  unit_id       uuid not null references public.units(id) on delete cascade,
  property_id   uuid not null references public.properties(id) on delete cascade,
  move_in_date  date,
  move_out_date date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(profile_id, unit_id)
);

-- ====================================================
-- leases
-- ====================================================
create table public.leases (
  id            uuid primary key default uuid_generate_v4(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  property_id   uuid not null references public.properties(id),
  storage_path  text not null,
  file_name     text not null,
  start_date    date,
  end_date      date,
  uploaded_at   timestamptz not null default now()
);

-- ====================================================
-- maintenance_requests
-- ====================================================
create type maintenance_status as enum ('open', 'in_progress', 'resolved');

create table public.maintenance_requests (
  id           uuid primary key default uuid_generate_v4(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  property_id  uuid not null references public.properties(id),
  unit_id      uuid not null references public.units(id),
  title        text not null,
  description  text not null,
  status       maintenance_status not null default 'open',
  owner_notes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ====================================================
-- maintenance_photos
-- ====================================================
create table public.maintenance_photos (
  id            uuid primary key default uuid_generate_v4(),
  request_id    uuid not null references public.maintenance_requests(id) on delete cascade,
  storage_path  text not null,
  file_name     text not null,
  uploaded_at   timestamptz not null default now()
);

-- ====================================================
-- Row Level Security
-- ====================================================
alter table public.profiles             enable row level security;
alter table public.properties           enable row level security;
alter table public.units                enable row level security;
alter table public.tenants              enable row level security;
alter table public.leases               enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.maintenance_photos   enable row level security;

-- profiles
create policy "own_profile_select" on public.profiles
  for select using (auth.uid() = id);

create policy "own_profile_update" on public.profiles
  for update using (auth.uid() = id);

create policy "owner_see_tenant_profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.tenants t
      join public.properties p on t.property_id = p.id
      where t.profile_id = profiles.id and p.owner_id = auth.uid()
    )
  );

-- properties
create policy "owner_full_properties" on public.properties
  for all using (owner_id = auth.uid());

create policy "tenant_read_own_property" on public.properties
  for select using (
    exists (
      select 1 from public.tenants t
      where t.property_id = properties.id and t.profile_id = auth.uid() and t.is_active = true
    )
  );

-- units
create policy "owner_full_units" on public.units
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = units.property_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant_read_own_unit" on public.units
  for select using (
    exists (
      select 1 from public.tenants t
      where t.unit_id = units.id and t.profile_id = auth.uid() and t.is_active = true
    )
  );

-- tenants
create policy "owner_full_tenants" on public.tenants
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = tenants.property_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant_read_own_record" on public.tenants
  for select using (profile_id = auth.uid());

-- leases
create policy "owner_full_leases" on public.leases
  for all using (
    exists (
      select 1 from public.tenants t
      join public.properties p on t.property_id = p.id
      where t.id = leases.tenant_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant_read_own_lease" on public.leases
  for select using (
    exists (
      select 1 from public.tenants t
      where t.id = leases.tenant_id and t.profile_id = auth.uid()
    )
  );

-- maintenance_requests
create policy "owner_full_maintenance" on public.maintenance_requests
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = maintenance_requests.property_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant_insert_maintenance" on public.maintenance_requests
  for insert with check (
    exists (
      select 1 from public.tenants t
      where t.id = maintenance_requests.tenant_id and t.profile_id = auth.uid() and t.is_active = true
    )
  );

create policy "tenant_read_own_maintenance" on public.maintenance_requests
  for select using (
    exists (
      select 1 from public.tenants t
      where t.id = maintenance_requests.tenant_id and t.profile_id = auth.uid()
    )
  );

-- maintenance_photos
create policy "owner_read_photos" on public.maintenance_photos
  for select using (
    exists (
      select 1 from public.maintenance_requests mr
      join public.properties p on mr.property_id = p.id
      where mr.id = maintenance_photos.request_id and p.owner_id = auth.uid()
    )
  );

create policy "tenant_insert_photos" on public.maintenance_photos
  for insert with check (
    exists (
      select 1 from public.maintenance_requests mr
      join public.tenants t on mr.tenant_id = t.id
      where mr.id = maintenance_photos.request_id and t.profile_id = auth.uid()
    )
  );

create policy "tenant_read_own_photos" on public.maintenance_photos
  for select using (
    exists (
      select 1 from public.maintenance_requests mr
      join public.tenants t on mr.tenant_id = t.id
      where mr.id = maintenance_photos.request_id and t.profile_id = auth.uid()
    )
  );

-- ====================================================
-- Storage bucket policies (run after creating buckets)
-- Buckets to create in Dashboard > Storage:
--   - "leases"            (private)
--   - "maintenance-photos" (private)
-- ====================================================

create policy "owner_upload_leases" on storage.objects
  for insert with check (
    bucket_id = 'leases'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "owner_read_leases" on storage.objects
  for select using (
    bucket_id = 'leases'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "owner_delete_leases" on storage.objects
  for delete using (
    bucket_id = 'leases'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "tenant_read_own_lease_file" on storage.objects
  for select using (
    bucket_id = 'leases'
    and exists (
      select 1 from public.leases l
      join public.tenants t on l.tenant_id = t.id
      where l.storage_path = name and t.profile_id = auth.uid()
    )
  );

create policy "tenant_upload_photos" on storage.objects
  for insert with check (
    bucket_id = 'maintenance-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'tenant')
  );

create policy "owner_read_photos_storage" on storage.objects
  for select using (
    bucket_id = 'maintenance-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'owner')
  );

create policy "tenant_read_own_photos_storage" on storage.objects
  for select using (
    bucket_id = 'maintenance-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'tenant')
  );

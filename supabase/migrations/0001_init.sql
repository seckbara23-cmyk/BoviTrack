-- BoviTrack — Phase 8: initial schema
-- Animal is the central entity; every module attaches to it.
-- Multi-tenant: data is scoped per farm (see 0002_rls.sql).

create extension if not exists pgcrypto;

-- ------------------------------------------------------------------
-- Enums (mirror the domain used by the UI)
-- ------------------------------------------------------------------
create type user_role       as enum ('super_admin','farm_admin','field_agent','veterinarian','viewer');
create type animal_sex      as enum ('M','F');
create type animal_status   as enum ('active','sold','deceased','lost');
create type location_risk   as enum ('normale','sortie','ancienne','alerte');
create type alert_type      as enum ('vol','disparition','intrusion','sanitaire');
create type alert_status    as enum ('nouvelle','recherche','autorites','retrouve','cloturee');
create type alert_severity  as enum ('low','medium','high','critical');
create type care_status     as enum ('a_faire','en_cours','termine','urgent','suivi');
create type vaccine_status  as enum ('a_faire','en_retard','fait','programme');
create type breeding_status as enum ('a_confirmer','gestation','a_surveiller','mise_bas_proche','terminee','echec');
create type birth_status    as enum ('a_enregistrer','enregistre','suivi_requis','mort_ne');
create type sale_status     as enum ('negociation','confirmee','paiement_attente','transfert_attente','transfere','annule');

-- ------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- farm_id binds a user to their farm (null for super_admin).
-- ------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  full_name  text not null default '',
  role       user_role not null default 'viewer',
  farm_id    uuid,                       -- FK added after farms is created
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- farms
-- ------------------------------------------------------------------
create table public.farms (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  region     text,
  department text,
  village    text,
  owner_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_farm_id_fkey
  foreign key (farm_id) references public.farms (id) on delete set null;

-- ------------------------------------------------------------------
-- owners (livestock owners within a farm)
-- ------------------------------------------------------------------
create table public.owners (
  id        uuid primary key default gen_random_uuid(),
  farm_id   uuid not null references public.farms (id) on delete cascade,
  full_name text not null,
  phone     text,
  village   text
);

-- ------------------------------------------------------------------
-- animals — the core entity
-- ------------------------------------------------------------------
create table public.animals (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references public.farms (id) on delete cascade,
  owner_id    uuid references public.owners (id) on delete set null,
  animal_code text not null,             -- e.g. SN-BOV-2026-0001
  rfid_tag    text,
  qr_code     text,
  name        text,
  breed       text,
  sex         animal_sex,
  birth_year  int,
  color       text,
  status      animal_status not null default 'active',
  created_at  timestamptz not null default now(),
  unique (farm_id, animal_code)
);

-- ------------------------------------------------------------------
-- locations — position history with risk level
-- ------------------------------------------------------------------
create table public.locations (
  id            uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references public.animals (id) on delete cascade,
  location_name text,
  latitude      double precision,
  longitude     double precision,
  risk_status   location_risk not null default 'normale',
  recorded_at   timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- security_alerts — anti-theft
-- ------------------------------------------------------------------
create table public.security_alerts (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references public.animals (id) on delete cascade,
  alert_type  alert_type not null default 'vol',
  status      alert_status not null default 'nouvelle',
  severity    alert_severity not null default 'high',
  last_known_location text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- care_records — health
-- ------------------------------------------------------------------
create table public.care_records (
  id           uuid primary key default gen_random_uuid(),
  animal_id    uuid not null references public.animals (id) on delete cascade,
  diagnosis    text,
  treatment    text,
  veterinarian text,
  status       care_status not null default 'a_faire',
  date         date not null default current_date
);

-- ------------------------------------------------------------------
-- vaccine_records
-- ------------------------------------------------------------------
create table public.vaccine_records (
  id           uuid primary key default gen_random_uuid(),
  animal_id    uuid not null references public.animals (id) on delete cascade,
  vaccine_name text not null,
  due_date     date,
  done_date    date,
  agent        text,
  batch_number text,
  status       vaccine_status not null default 'a_faire'
);

-- ------------------------------------------------------------------
-- breeding_records
-- ------------------------------------------------------------------
create table public.breeding_records (
  id               uuid primary key default gen_random_uuid(),
  female_animal_id uuid not null references public.animals (id) on delete cascade,
  male_animal_id   uuid references public.animals (id) on delete set null,
  status           breeding_status not null default 'a_confirmer',
  expected_birth   date,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- birth_records
-- ------------------------------------------------------------------
create table public.birth_records (
  id               uuid primary key default gen_random_uuid(),
  calf_animal_id   uuid references public.animals (id) on delete set null,
  mother_animal_id uuid not null references public.animals (id) on delete cascade,
  breeding_id      uuid references public.breeding_records (id) on delete set null,
  birth_date       date,
  status           birth_status not null default 'a_enregistrer'
);

-- ------------------------------------------------------------------
-- sale_records
-- ------------------------------------------------------------------
create table public.sale_records (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references public.animals (id) on delete cascade,
  seller_name text,
  buyer_name  text,
  price_fcfa  bigint,
  market      text,
  status      sale_status not null default 'negociation',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- documents — receipts, certificates, ID docs (storage refs)
-- ------------------------------------------------------------------
create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references public.animals (id) on delete cascade,
  doc_type    text,
  title       text,
  storage_path text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- timeline_events — cross-module chronological history
-- ------------------------------------------------------------------
create table public.timeline_events (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references public.animals (id) on delete cascade,
  event_type  text not null,
  description text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Indexes on foreign keys / lookups
-- ------------------------------------------------------------------
create index on public.profiles (farm_id);
create index on public.owners (farm_id);
create index on public.animals (farm_id);
create index on public.animals (owner_id);
create index on public.locations (animal_id);
create index on public.security_alerts (animal_id);
create index on public.care_records (animal_id);
create index on public.vaccine_records (animal_id);
create index on public.breeding_records (female_animal_id);
create index on public.breeding_records (male_animal_id);
create index on public.birth_records (mother_animal_id);
create index on public.birth_records (calf_animal_id);
create index on public.sale_records (animal_id);
create index on public.documents (animal_id);
create index on public.timeline_events (animal_id);

-- ------------------------------------------------------------------
-- Auth: auto-create a profile when a new auth user signs up
-- ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'viewer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

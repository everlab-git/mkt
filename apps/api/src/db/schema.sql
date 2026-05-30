-- Freya CMS (MVP) — schema inicial
-- Observação: este schema assume que a aplicação define `app.user_id` por request
-- (ex: `SET LOCAL app.user_id = '<uuid>'`) para habilitar RLS sem depender do Supabase Auth.

create extension if not exists pgcrypto;

-- Usuários
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz default now(),
  role       text default 'editor'
);

-- Sites
create table if not exists sites (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references users(id) on delete cascade,
  name       text not null,
  slug       text unique not null,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pages
create table if not exists pages (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid references sites(id) on delete cascade,
  name       text not null,
  slug       text not null,
  type       text not null,
  status     text default 'draft',
  nav        text default 'none',
  behavior   text default 'same',
  content    jsonb default '{}'::jsonb,
  seo        jsonb default '{}'::jsonb,
  order_idx  int  default 0,
  parent_id  uuid references pages(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(site_id, slug)
);

-- Audit Log (append-only, imutável)
create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  timestamp  timestamptz not null default now(),
  user_id    uuid references users(id) on delete set null,
  action     text not null,
  resource   text,
  ip_hash    text,
  metadata   jsonb,
  signature  text not null
);

-- Políticas RLS
alter table audit_log enable row level security;
drop policy if exists audit_insert_only on audit_log;
create policy audit_insert_only on audit_log
  for insert
  with check (true);

alter table sites enable row level security;
drop policy if exists sites_owner on sites;
create policy sites_owner on sites
  for all
  using (owner_id = current_setting('app.user_id')::uuid);

alter table pages enable row level security;
drop policy if exists pages_via_site on pages;
create policy pages_via_site on pages
  for all
  using (site_id in (select id from sites where owner_id = current_setting('app.user_id')::uuid));


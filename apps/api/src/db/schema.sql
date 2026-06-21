-- Freya CMS (MVP) — schema inicial
-- Observação: este schema assume que a aplicação define `app.user_id` por request
-- (ex: `SET LOCAL app.user_id = '<uuid>'`) para habilitar RLS sem depender do Supabase Auth.

create extension if not exists pgcrypto;

-- Usuários
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  name       text,
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
  theme      jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sites add column if not exists logo_url text;
alter table sites add column if not exists goal text;
alter table sites add column if not exists languages jsonb not null default '{"default":"pt-BR","enabled":["pt-BR"]}'::jsonb;

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
  block_types text[] not null default '{}',
  seo        jsonb default '{}'::jsonb,
  order_idx  int  default 0,
  parent_id  uuid references pages(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(site_id, slug)
);

create table if not exists project_members (
  site_id     uuid not null references sites(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  role        text not null default 'member',
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (site_id, user_id),
  constraint project_members_role_check check (role in ('owner', 'member'))
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

create table if not exists login_codes (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  code_hash         text not null,
  expires_at        timestamptz not null,
  used_at           timestamptz,
  attempts          int not null default 0,
  requested_ip_hash text,
  created_at        timestamptz not null default now()
);

create table if not exists sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  token_hash      text not null unique,
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null,
  last_seen_at    timestamptz not null default now(),
  created_ip_hash text
);

-- Políticas RLS
alter table audit_log enable row level security;
drop policy if exists audit_insert_only on audit_log;
create policy audit_insert_only on audit_log
  for insert
  with check (true);

alter table sites enable row level security;
drop policy if exists sites_owner on sites;
drop policy if exists sites_members on sites;
create policy sites_members on sites
  for all
  using (
    exists (
      select 1
      from project_members pm
      where pm.site_id = sites.id
        and pm.user_id = current_setting('app.user_id')::uuid
    )
    or owner_id = current_setting('app.user_id')::uuid
  );

alter table pages enable row level security;
drop policy if exists pages_via_site on pages;
drop policy if exists pages_via_membership on pages;
create policy pages_via_membership on pages
  for all
  using (
    exists (
      select 1
      from project_members pm
      where pm.site_id = pages.site_id
        and pm.user_id = current_setting('app.user_id')::uuid
    )
    or site_id in (
      select id
      from sites
      where owner_id = current_setting('app.user_id')::uuid
    )
  );

alter table project_members enable row level security;
drop policy if exists project_members_select_via_membership on project_members;
create policy project_members_select_via_membership on project_members
  for select
  using (
    user_id = current_setting('app.user_id')::uuid
    or exists (
      select 1
      from sites s
      where s.id = project_members.site_id
        and s.owner_id = current_setting('app.user_id')::uuid
    )
  );

drop policy if exists project_members_insert_owner on project_members;
create policy project_members_insert_owner on project_members
  for insert
  with check (
    exists (
      select 1
      from sites s
      where s.id = project_members.site_id
        and s.owner_id = current_setting('app.user_id')::uuid
    )
  );

drop policy if exists project_members_update_owner on project_members;
create policy project_members_update_owner on project_members
  for update
  using (
    exists (
      select 1
      from sites s
      where s.id = project_members.site_id
        and s.owner_id = current_setting('app.user_id')::uuid
    )
  )
  with check (
    exists (
      select 1
      from sites s
      where s.id = project_members.site_id
        and s.owner_id = current_setting('app.user_id')::uuid
    )
  );

drop policy if exists project_members_delete_owner on project_members;
create policy project_members_delete_owner on project_members
  for delete
  using (
    exists (
      select 1
      from sites s
      where s.id = project_members.site_id
        and s.owner_id = current_setting('app.user_id')::uuid
    )
  );

create index if not exists idx_pages_content_gin on pages using gin (content);
create index if not exists idx_pages_block_types_gin on pages using gin (block_types);
create index if not exists idx_login_codes_email_created_at on login_codes (email, created_at desc);
create index if not exists idx_sessions_user_id on sessions (user_id);
create index if not exists idx_sessions_token_hash on sessions (token_hash);
create index if not exists idx_project_members_user_id on project_members (user_id);
create index if not exists idx_project_members_site_id on project_members (site_id);

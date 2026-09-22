create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  logo_url text,
  primary_color text,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'member',
  password_hash text,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  company text,
  type text not null default 'lead',
  source text,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_org_idx on contacts(organization_id);
create index if not exists contacts_org_status_idx on contacts(organization_id, status);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  unique (organization_id, name)
);

create table if not exists contact_tags (
  contact_id uuid not null references contacts(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_org_idx on activities(organization_id);
create index if not exists activities_contact_idx on activities(contact_id, created_at desc);

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  color text,
  unique (organization_id, name)
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  assigned_to uuid references users(id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  assigned_to uuid references users(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  channel text not null,
  status text not null default 'open',
  unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  direction text not null,
  body text not null,
  subject text,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

create unique index if not exists messages_external_id_idx on messages(organization_id, external_id) where external_id is not null;

create table if not exists custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  field_key text not null,
  field_type text not null default 'text',
  unique (organization_id, field_key)
);

create table if not exists custom_field_values (
  custom_field_id uuid not null references custom_fields(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  value text,
  primary key (custom_field_id, contact_id)
);

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  conditions jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

insert into pipeline_stages (organization_id, name, position)
select o.id, s.name, s.position
from organizations o
cross join (values ('New',1),('Contacted',2),('Qualified',3),('Won',4)) as s(name,position)
where o.slug = 'fullerton-automotive'
on conflict (organization_id, name) do nothing;

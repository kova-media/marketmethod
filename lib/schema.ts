import { getDb } from './db'

const statements = [
  `create extension if not exists pgcrypto`,
  `create table if not exists organizations (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, industry text, logo_url text, primary_color text, sender_name text, sender_email text, reply_to_email text, sms_from_number text, created_at timestamptz not null default now())`,
  `alter table organizations add column if not exists sender_name text`,
  `alter table organizations add column if not exists sender_email text`,
  `alter table organizations add column if not exists reply_to_email text`,
  `alter table organizations add column if not exists sms_from_number text`,
  `create table if not exists users (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, email text not null, name text not null, role text not null default 'member', password_hash text, created_at timestamptz not null default now(), unique(organization_id,email))`,
  `create table if not exists password_resets (id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade, token text not null unique, expires_at timestamptz not null, used_at timestamptz, created_at timestamptz not null default now())`,
  `create index if not exists password_resets_user_idx on password_resets(user_id)`,
  `create table if not exists user_invites (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, email text not null, role text not null default 'member', token text not null unique, expires_at timestamptz not null, accepted_at timestamptz, created_by uuid references users(id) on delete set null, created_at timestamptz not null default now())`,
  `create index if not exists user_invites_org_idx on user_invites(organization_id)`,
  `create index if not exists user_invites_org_email_idx on user_invites(organization_id,lower(email))`,
  `create table if not exists contacts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, first_name text not null, last_name text, email text, phone text, company text, type text not null default 'lead', source text, status text not null default 'new', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
  `create index if not exists contacts_org_idx on contacts(organization_id)`,
  `create index if not exists contacts_org_lower_email_idx on contacts(organization_id,lower(email)) where email is not null`,
  `create index if not exists users_org_lower_email_idx on users(organization_id,lower(email))`,
  `create index if not exists contacts_org_status_idx on contacts(organization_id,status)`,
  `create table if not exists tags (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, unique(organization_id,name))`,
  `create table if not exists contact_tags (contact_id uuid not null references contacts(id) on delete cascade, tag_id uuid not null references tags(id) on delete cascade, primary key(contact_id,tag_id))`,
  `create table if not exists activities (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, user_id uuid references users(id) on delete set null, type text not null, title text not null, body text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now())`,
  `create index if not exists activities_contact_idx on activities(contact_id,created_at desc)`,
  `create table if not exists pipeline_stages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, position integer not null default 0, color text, unique(organization_id,name))`,
  `create table if not exists tasks (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid references contacts(id) on delete set null, assigned_to uuid references users(id) on delete set null, title text not null, description text, due_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now())`,
  `create table if not exists appointments (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid references contacts(id) on delete set null, assigned_to uuid references users(id) on delete set null, title text not null, starts_at timestamptz not null, ends_at timestamptz, status text not null default 'scheduled', notes text, created_at timestamptz not null default now())`,
  `create table if not exists conversations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, channel text not null, status text not null default 'open', unread_count integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now())`,
  `alter table conversations add column if not exists unread_count integer not null default 0`,
  `create table if not exists messages (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, conversation_id uuid not null references conversations(id) on delete cascade, direction text not null, body text not null, subject text, external_id text, metadata jsonb not null default '{}'::jsonb, sent_at timestamptz not null default now())`,
  `alter table messages add column if not exists subject text`,
  `alter table messages add column if not exists external_id text`,
  `alter table messages add column if not exists metadata jsonb not null default '{}'::jsonb`,
  `create unique index if not exists messages_external_id_idx on messages(organization_id, external_id) where external_id is not null`,
  `create table if not exists custom_fields (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, field_key text not null, field_type text not null default 'text', unique(organization_id,field_key))`,
  `create table if not exists custom_field_values (custom_field_id uuid not null references custom_fields(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, value text, primary key(custom_field_id,contact_id))`,
  `create table if not exists automations (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, name text not null, trigger_type text not null, conditions jsonb not null default '[]'::jsonb, actions jsonb not null default '[]'::jsonb, enabled boolean not null default true, created_at timestamptz not null default now())`,
  `create table if not exists vehicles (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, year integer, make text, model text, vin text, mileage integer, license_plate text, notes text, created_at timestamptz not null default now())`,
  `create table if not exists service_records (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, vehicle_id uuid references vehicles(id) on delete cascade, service_date date not null default current_date, service_type text not null, mileage integer, amount numeric(12,2), notes text, next_recommended_date date, next_recommended_mileage integer, created_at timestamptz not null default now())`,
  `create table if not exists properties (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, name text, address text, city text, state text, postal_code text, notes text, created_at timestamptz not null default now())`,
  `create table if not exists service_history (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, contact_id uuid not null references contacts(id) on delete cascade, property_id uuid references properties(id) on delete cascade, service_date date not null default current_date, service_type text not null, amount numeric(12,2), notes text, next_recommended_date date, created_at timestamptz not null default now())`,
  `create table if not exists automation_events (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, automation_id uuid references automations(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, event_type text not null, status text not null default 'completed', details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now())`,
  `create table if not exists automation_jobs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references organizations(id) on delete cascade, automation_id uuid references automations(id) on delete cascade, contact_id uuid references contacts(id) on delete cascade, event_type text not null, actions jsonb not null default '[]'::jsonb, payload jsonb not null default '{}'::jsonb, run_at timestamptz not null, status text not null default 'pending', attempts integer not null default 0, last_error text, created_at timestamptz not null default now(), completed_at timestamptz)`,
  `alter table automation_jobs add column if not exists started_at timestamptz`,
  `create index if not exists automation_jobs_due_idx on automation_jobs(status,run_at)`,
  `create index if not exists activities_org_created_idx on activities(organization_id,created_at desc)`,
  `create index if not exists activities_org_contact_created_idx on activities(organization_id,contact_id,created_at desc)`,
  `create index if not exists tasks_org_open_due_idx on tasks(organization_id,completed_at,due_at)`,
  `create index if not exists tasks_org_contact_open_idx on tasks(organization_id,contact_id,completed_at)`,
  `create index if not exists appointments_org_starts_idx on appointments(organization_id,starts_at)`,
  `create index if not exists appointments_org_contact_starts_idx on appointments(organization_id,contact_id,starts_at)`,
  `create index if not exists conversations_org_updated_idx on conversations(organization_id,updated_at desc)`,
  `create index if not exists conversations_org_contact_channel_idx on conversations(organization_id,contact_id,channel,status)`,
  `create index if not exists messages_conversation_sent_idx on messages(conversation_id,sent_at asc)`,
  `create index if not exists messages_org_sent_idx on messages(organization_id,sent_at desc)`,
  `create index if not exists vehicles_org_contact_idx on vehicles(organization_id,contact_id)`,
  `create index if not exists service_records_org_contact_date_idx on service_records(organization_id,contact_id,service_date desc)`,
  `create index if not exists properties_org_contact_idx on properties(organization_id,contact_id)`,
  `create index if not exists service_history_org_contact_date_idx on service_history(organization_id,contact_id,service_date desc)`,
  `create index if not exists custom_field_values_contact_idx on custom_field_values(contact_id)`,
  `create index if not exists automation_events_org_created_idx on automation_events(organization_id,created_at desc)`,
  `create index if not exists automation_jobs_org_status_run_idx on automation_jobs(organization_id,status,run_at)`,
  `create index if not exists automation_jobs_running_started_idx on automation_jobs(status,started_at) where status='running'`,
]

let initialized = false

export async function ensureSchema() {
  if (initialized) return
  const sql: any = getDb()
  for (const statement of statements) await sql.query(statement)
  initialized = true
}

// CRM schema bootstrap is intentionally idempotent.

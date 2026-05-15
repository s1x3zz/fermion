-- Migration 001: projects table
-- Run this in the Supabase SQL editor or via supabase db push.

create table if not exists public.projects (
  id          uuid         primary key,
  user_id     uuid         not null references auth.users (id) on delete cascade,
  name        text         not null,
  description text,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  thumbnail   text,                          -- base64 PNG
  circuit     jsonb        not null default '{"components":[],"wires":[],"netlist":[]}',
  metadata    jsonb        not null default '{"componentCount":0,"wireCount":0,"simulatorVersion":"0.1.0"}'
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists projects_updated_at_idx on public.projects (user_id, updated_at desc);

-- Row-level security ──────────────────────────────────────────────────────────

alter table public.projects enable row level security;

-- Users can read their own projects
create policy "users can read own projects"
  on public.projects for select
  using (auth.uid() = user_id);

-- Users can insert their own projects
create policy "users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

-- Users can update their own projects
create policy "users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own projects
create policy "users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

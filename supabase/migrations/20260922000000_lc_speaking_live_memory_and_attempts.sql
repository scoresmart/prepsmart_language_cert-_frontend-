-- Live speaking examiner: what it remembers about a candidate across tests,
-- one row per test (complete or ended early), and private per-part recordings.
-- Applied to project sepzceaicoldqhyxxzff on 2026-09-22.

create table if not exists public.lc_speaking_candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.lc_speaking_candidate_profiles enable row level security;
create policy "Candidates read own speaking profile" on public.lc_speaking_candidate_profiles
  for select using (auth.uid() = user_id);
create policy "Candidates insert own speaking profile" on public.lc_speaking_candidate_profiles
  for insert with check (auth.uid() = user_id);
create policy "Candidates update own speaking profile" on public.lc_speaking_candidate_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.lc_speaking_live_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references public.speaking_sets(id) on delete set null,
  question_number integer,
  title text,
  level text,
  session_id text,
  status text not null default 'in_progress' check (status in ('in_progress','completed','ended_early')),
  end_reason text,
  parts_reached integer[] not null default '{}',
  transcript jsonb not null default '[]'::jsonb,
  recordings jsonb not null default '[]'::jsonb,
  profile jsonb not null default '{}'::jsonb,
  summary jsonb,
  score jsonb,
  practice_attempt_id uuid,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lc_speaking_live_attempts_user_idx
  on public.lc_speaking_live_attempts (user_id, created_at desc);
alter table public.lc_speaking_live_attempts enable row level security;
create policy "Candidates read own live attempts" on public.lc_speaking_live_attempts
  for select using (auth.uid() = user_id);
create policy "Candidates insert own live attempts" on public.lc_speaking_live_attempts
  for insert with check (auth.uid() = user_id);
create policy "Candidates update own live attempts" on public.lc_speaking_live_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins read live attempts" on public.lc_speaking_live_attempts
  for select using ((select role from public.profiles where id = auth.uid()) = any (array['admin'::app_role,'tutor'::app_role]));

insert into storage.buckets (id, name, public, file_size_limit)
values ('lc-speaking-recordings', 'lc-speaking-recordings', false, 52428800)
on conflict (id) do nothing;

create policy "LC candidates upload own speaking recordings" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lc-speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "LC candidates read own speaking recordings" on storage.objects
  for select to authenticated
  using (bucket_id = 'lc-speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "LC candidates replace own speaking recordings" on storage.objects
  for update to authenticated
  using (bucket_id = 'lc-speaking-recordings' and (storage.foldername(name))[1] = auth.uid()::text);

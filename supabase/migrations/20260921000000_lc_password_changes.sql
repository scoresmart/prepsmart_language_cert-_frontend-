-- Latest password change per user, shown on the LC admin Users page.
-- Written only by the lc-admin-users edge function (service role); RLS on with no policies blocks client access.
create table if not exists public.lc_password_changes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  changed_at timestamptz not null default now(),
  changed_by text not null check (changed_by in ('user', 'admin')),
  changed_by_admin_id uuid references auth.users(id) on delete set null
);

alter table public.lc_password_changes enable row level security;

comment on table public.lc_password_changes is 'PrepSmart LC: when and by whom each user''s password was last changed. Managed by the lc-admin-users edge function.';

-- PrepSmart LC Stripe billing.
-- Access itself stays in public.student_access (subject = 'Language Cert'); these tables only map
-- Supabase users to Stripe objects. Written by the lc-billing / lc-stripe-webhook edge functions
-- (service role); students may only read their own rows.

create table if not exists public.lc_stripe_customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.lc_stripe_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_customer_id text not null,
  price_id text,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lc_stripe_subscriptions_user_id_idx on public.lc_stripe_subscriptions (user_id);

alter table public.lc_stripe_customers enable row level security;
alter table public.lc_stripe_subscriptions enable row level security;

create policy "LC users read own stripe customer" on public.lc_stripe_customers
  for select to authenticated using (user_id = auth.uid());

create policy "LC users read own stripe subscriptions" on public.lc_stripe_subscriptions
  for select to authenticated using (user_id = auth.uid());

-- Keep in sync with src/lib/adminAccess.ts
create policy "LC admins read all stripe subscriptions" on public.lc_stripe_subscriptions
  for select to authenticated using (
    public.get_user_role(auth.uid()) = 'admin'::app_role
    or lower(auth.jwt() ->> 'email') in ('contact@scoresmartpte.com', 'scoresmartpte@gmail.com')
  );

-- Students may update their own student_access rows (exam details). Without this, they could also
-- extend or re-activate their own LC access, or move another course row onto Language Cert.
-- Only LC rows are affected; service role (auth.uid() is null) and admins are unrestricted.
create or replace function public.protect_lc_access_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.get_user_role(auth.uid()) = 'admin'::app_role then
    return new;
  end if;
  if old.subject::text = 'Language Cert' or new.subject::text = 'Language Cert' then
    new.subject := old.subject;
    new.status := old.status;
    new.course_type := old.course_type;
    new.course_expiry_at := old.course_expiry_at;
    new.practice_portal_only := old.practice_portal_only;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_lc_access_fields on public.student_access;
create trigger protect_lc_access_fields
  before update on public.student_access
  for each row execute function public.protect_lc_access_fields();

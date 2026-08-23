-- La Voce: database schema for Supabase
-- Supabase の SQL Editor でこのファイルの内容を丸ごと実行してください。
-- （このプロジェクトを初めてデプロイする場合は、これ1本を実行すれば全て揃います）

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  occupation text,
  school text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- subscriptions ----------
-- 現在は無料公開中のため使っていませんが、後で有料化する時のために残してあります。
-- ステータスの書き込みは Stripe Webhook（サービスロール経由）のみが行う想定。
create table if not exists public.subscriptions (
  user_id uuid references auth.users on delete cascade primary key,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'none', -- none | trialing | active | past_due | canceled
  trial_end timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------- entries (体調記録) ----------
create table if not exists public.entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  throat_condition int,
  voice_quality int,
  throat_symptoms text[] default '{}',
  sleep_hours numeric,
  sleep_quality int,
  water_intake numeric,
  meal_notes text,
  location text,
  temperature numeric,
  humidity numeric,
  activity_type text,
  activity_duration numeric,
  repertoire text,
  performance_quality int,
  ease int,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, date)
);

alter table public.entries enable row level security;

create policy "Users can manage own entries"
  on public.entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- 新規ユーザー登録時に profiles / subscriptions の行を自動作成 ----------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, occupation, school)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'occupation',
    new.raw_user_meta_data->>'school'
  );
  insert into public.subscriptions (user_id, status)
  values (new.id, 'none');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 自分を管理者にする場合は、Table Editor で該当ユーザーの is_admin を true に変更してください。
-- （セキュリティのため、アプリ内から自分を管理者に昇格させる機能はあえて用意していません）

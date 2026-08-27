-- ============================================================================
-- 行動ログ（計測とユーザー調査仕様.md §3）
--
-- ★健康の値をここに入れないでください。
--   入れた瞬間に、この表全体が要配慮個人情報になります。
--   入れてよいのは「どの項目を入れたか」という項目名までで、
--   「その項目の値」は入れられません。判定は lib/events.js が持っています。
--
-- ★13か月で消します（§3.5）。それ以上持つ理由がありません。
--   削除は app/api/cron/purge-events で毎日走ります。
-- ============================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  at timestamptz not null default now(),
  tz text,
  session_id text,
  platform text
);

-- §3.1 の指定どおり
create index if not exists events_user_at_idx on public.events (user_id, at desc);
create index if not exists events_name_at_idx on public.events (name, at desc);

alter table public.events enable row level security;

-- 本人だけが自分の行動ログを書ける。★読み取りは管理画面（service role）だけ。
--   本人に読ませる必要が無く、読めると「見られている」感じだけが増えるため。
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'events' and policyname = 'Users can insert own events') then
    create policy "Users can insert own events"
      on public.events for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.events is
  '行動ログ。★健康の値を入れないこと（計測とユーザー調査仕様 §3.3）。13か月で削除。';

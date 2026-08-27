-- ============================================================================
-- 行動ログ（計測とユーザー調査仕様.md §3）
--
-- ★この表は、以前から存在します。
--   古い実装が event_type / payload という列に書いていました。
--   仕様 §3.1 の名前は name / props / at で、食い違っています。
--
--   ★前回の版はここで失敗しました。create table if not exists は、
--     表が既にあると「黙って何もしません」。列は古いままなのに、
--     続く create index が新しい列名（at）を指すため落ちます。
--     schema.sql は現物ではない、と CLAUDE.md が警告しているとおりでした。
--     現物を確かめずに書いた私の誤りです。
--
-- ★この版は、表がどちらの形でも通ります。
--   1. 表が無ければ作る
--   2. 足りない列だけを足す
--   3. 古い列に入っている中身を、新しい列へ写す（★消しません）
--   4. そのあとで索引とポリシーを作る
--
--   古い列（event_type / payload）は残します。写し違いがあったときに
--   戻せるようにするためです。落ち着いたら別途消してください。
--
-- ★健康の値をここに入れないでください（§3.3）。
--   入れた瞬間に、この表全体が要配慮個人情報になります。
--   判定は lib/events.js が実行時に行います。
-- ============================================================================

-- 【いまの形を確認したいとき】これを先に実行すると、列の一覧が出ます。
--   select column_name, data_type
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'events'
--    order by ordinal_position;

-- ---------------------------------------------------------------------------
-- 1. 表が無ければ作る（あれば何もしない）
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade
);

-- ---------------------------------------------------------------------------
-- 2. 足りない列を足す。★既にある列には触れません。
-- ---------------------------------------------------------------------------
alter table public.events add column if not exists name       text;
alter table public.events add column if not exists props      jsonb not null default '{}'::jsonb;
alter table public.events add column if not exists at         timestamptz not null default now();
alter table public.events add column if not exists tz         text;
alter table public.events add column if not exists session_id text;
alter table public.events add column if not exists platform   text;

-- ---------------------------------------------------------------------------
-- 3. 古い列の中身を、新しい列へ写す。★古い列は消しません。
--    列が無い環境でも落ちないよう、存在を確かめてから実行します。
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'events' and column_name = 'event_type') then
    execute 'update public.events set name = event_type where name is null and event_type is not null';
  end if;

  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'events' and column_name = 'payload') then
    execute 'update public.events set props = payload where props = ''{}''::jsonb and payload is not null';
  end if;

  -- 時刻の列は created_at かもしれない。あればそちらを使う。
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'events' and column_name = 'created_at') then
    execute 'update public.events set at = created_at where created_at is not null';
  end if;
end $$;

-- 旧 record_save は、仕様の名前 record_saved に合わせる（§3.2 の15種類）。
update public.events set name = 'record_saved' where name = 'record_save';

-- ---------------------------------------------------------------------------
-- 4. ここまで来て初めて、索引とポリシーを作る（§3.1 の指定どおり）
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. 確認
-- ---------------------------------------------------------------------------
select count(*) as 総数,
       count(*) filter (where name is null) as 名前が空,
       count(*) filter (where name = 'record_saved') as record_saved
  from public.events;

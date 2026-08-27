-- ============================================================================
-- 学ぶ画面：間隔をあけた復習
-- （作業指示-学ぶ画面を勉強できるものにする.md §3・§7）
--
-- ★既存の article_progress に、列を足すだけです。表は作り直しません。
--   いま入っているのは user_id / article_id / read_at で、読んだかどうかを
--   持っています。それは消しません。
--
-- ★events のときの失敗をふまえています。create table if not exists は、
--   表が既にあると黙って何もしません。列は古いまま、あとの文が新しい列を
--   指して落ちます。ここでは最初から add column if not exists で足します。
--
-- ★§9 で禁じられていること（この表で守ること）
--   ・正答率・点数・連続日数を持たない → 集計できる列を作らない
--   ・復習を有料にしない → プランの列を作らない
--   ・通知で催促しない → 通知用の列を作らない
-- ============================================================================

-- 表が無い環境のために、最小の形だけ用意する（あれば何もしない）
create table if not exists public.article_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  article_id text not null
);

-- ---------------------------------------------------------------------------
-- 復習のための列。★既にある列には触れません。
-- ---------------------------------------------------------------------------
alter table public.article_progress add column if not exists first_read_at  timestamptz;
alter table public.article_progress add column if not exists box            smallint not null default 0;
alter table public.article_progress add column if not exists next_due_at    date;
alter table public.article_progress add column if not exists last_answered_at timestamptz;

-- box は 0〜4（0=未読 1=直後 2=1日 3=7日 4=21日以降）
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_box_check') then
    alter table public.article_progress
      add constraint article_progress_box_check check (box between 0 and 4);
  end if;
end $$;

-- 既に読んでいる記事は、読了直後の段階から始める（読んだ事実を活かす）
update public.article_progress
   set first_read_at = read_at,
       box = 1,
       next_due_at = (read_at at time zone 'Asia/Tokyo')::date + 1
 where read_at is not null and box = 0;

-- 1人1記事につき1行
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'article_progress_user_article_key') then
    alter table public.article_progress
      add constraint article_progress_user_article_key unique (user_id, article_id);
  end if;
end $$;

create index if not exists article_progress_due_idx
  on public.article_progress (user_id, next_due_at);

alter table public.article_progress enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'article_progress' and policyname = 'Users can manage own article progress') then
    create policy "Users can manage own article progress"
      on public.article_progress for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

comment on column public.article_progress.box is
  '復習の段階。0=未読 1=直後 2=1日 3=7日 4=21日以降。★正答率は持たない（§9-5）。';

-- 確認
select count(*) as 総数,
       count(*) filter (where box > 0) as 復習の対象,
       count(*) filter (where next_due_at is not null) as 次回が入っている
  from public.article_progress;

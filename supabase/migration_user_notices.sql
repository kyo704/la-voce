-- ============================================================================
-- 1回だけ出す知らせを、1つの表でまとめる
--
--   ★これまでは、知らせを1つ足すたびに profiles へ列を1本足していました
--     （occupation_notice_shown_at / age_question_shown_at /
--       survey_day7_shown_at）。知らせが増えるたびに移行が要り、
--     そのたびに「コードは出たが SQL はまだ」の窓が開きます。
--     2026-08-30 に、その窓で本番の保存が2回止まりました。
--
--   ★これからは、この表に1行入れるだけです。列は増えません。
--
--   ★既存の3つの列は、このままにします（消しません）。
--     動いているものを、時間の無いときに触らないためです。
--     2つの仕組みがしばらく並びますが、害はありません。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

create table if not exists public.user_notices (
  user_id    uuid        not null references auth.users on delete cascade,
  notice_key text        not null,
  shown_at   timestamptz not null default now(),
  primary key (user_id, notice_key)
);

-- ★同じ知らせを2回入れない、が主キーで保証されます。
--   入れ直しは on conflict do nothing で済みます。

alter table public.user_notices enable row level security;

-- ★本人だけ。先生にも管理者にも、読む道を作りません。
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'user_notices'
                   and policyname = 'Users can view own notices') then
    create policy "Users can view own notices"
      on public.user_notices for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'user_notices'
                   and policyname = 'Users can insert own notices') then
    create policy "Users can insert own notices"
      on public.user_notices for insert with check (auth.uid() = user_id);
  end if;
  -- ★update / delete のポリシーは作りません。
  --   「1回だけ出した」という記録を、あとから消せないようにするためです。
end $$;

comment on table public.user_notices is
  '1回だけ出す知らせの記録。鍵の正は lib/notices.js。★列を増やさずに知らせを増やすための表。';
comment on column public.user_notices.notice_key is
  '知らせの鍵。★lib/notices.js の NOTICE_KEYS にあるものだけ。画面に文字列を直接書かないこと。';

-- 確認
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'user_notices'
 order by ordinal_position;

select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'user_notices'
 order by policyname;

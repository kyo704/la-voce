-- ============================================================================
-- 年齢の答えを変えた記録（判断の回答-年齢確認とアカウント削除 §1-3）
--
--   ★なぜ要るか
--     18歳になった人が、永久に弾かれ続けないように、本人が設定で
--     is_under_18 を変えられるようにします。
--     ★安全に関わる判定なので、変えたことを残します。
--       いつ・どちらからどちらへ。
--
--   ★A-5 の監査ログ（誰が誰の健康データを見たか）とは別物です。
--     あちらは配布のあとでよい、とされています。これは配布前です。
--     ★同じ表にしないこと。目的も、消してよい時期も違います。
--
--   ★IPは保存しません（EUの下地づくり §3-2 と同じ扱い）。
--   ★行を消しません。変えた事実そのものが記録です。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

create table if not exists public.age_answer_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- ★null は「答えていない」。3つの状態すべてを記録します。
  from_value boolean,
  to_value boolean,
  changed_at timestamptz not null default now()
);

create index if not exists age_answer_changes_user_idx
  on public.age_answer_changes (user_id, changed_at desc);

alter table public.age_answer_changes enable row level security;

do $$
begin
  -- ★本人だけ。教師にも管理者にも、読む道を作りません。
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'age_answer_changes'
                   and policyname = 'Users can view own age changes') then
    create policy "Users can view own age changes"
      on public.age_answer_changes for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'age_answer_changes'
                   and policyname = 'Users can insert own age changes') then
    create policy "Users can insert own age changes"
      on public.age_answer_changes for insert with check (auth.uid() = user_id);
  end if;
  -- ★update と delete のポリシーは作りません。書いたら消せない・変えられない。
end $$;

comment on table public.age_answer_changes is
  '年齢の答え（is_under_18）を変えた記録。★行を消さないこと。★IPを保存しないこと。A-5 の監査ログとは別。';
comment on column public.age_answer_changes.from_value is
  '変える前の値。★null は「答えていなかった」。';

-- 確認
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'age_answer_changes'
 order by ordinal_position;

select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'age_answer_changes'
 order by cmd;

-- ============================================================================
-- 群のラベル（profiles.cohort）
--
--   出典 docs/lavoce-テスターへの先行公開と群のラベル.md §3
--
--   ★なぜ急ぐか
--     画面が違う人を、同じ継続率の分母に入れられないためです。
--     ★あとから遡って分けることはできません。
--     配布が始まってからでは、その期間ぶんが永久に取り返せません。
--
--   ★これは課金ではありません。
--     売っていません。値段も支払いも期限もありません。
--     権利と課金の線引き.md の凍結（G3 完了まで）は破っていません。
--
--   tester    坂本さんが選んで先行公開した人（15〜20人）
--   general   自分で登録した、坂本さんと直接関係のない人
--   founder   坂本さんと直接関係のある既存ユーザー
--
--   ★既定は 'general' です。分からない人を tester にしないこと。
--   ★利用者には見せません（§4）。管理画面と集計のためだけの列です。
--
--   ★is_tester は消しません。読み替えが済むまで両方置きます。
--     先に消すと、まだ is_tester を読んでいる画面が壊れます。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行の前に数える（★記録として残してください）
-- ---------------------------------------------------------------------------
select count(*) filter (where is_tester)     as "いまテスターの人",
       count(*) filter (where not is_tester) as "それ以外",
       count(*)                              as "合計"
  from public.profiles;

-- ---------------------------------------------------------------------------
-- ② 列を足す
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists cohort text not null default 'general';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_cohort_check') then
    alter table public.profiles
      add constraint profiles_cohort_check
      check (cohort in ('tester', 'general', 'founder'));
  end if;
end $$;

comment on column public.profiles.cohort is
  '群のラベル（tester / general / founder）。★継続率を群ごとに分けるために要る。あとから遡って分けられないので、配布の前に入れる。★利用者には見せない。課金ではない。正は lib/entitlements.js。';

-- 「いつからその群か」を残す。★あとから遡れないため。
alter table public.profiles
  add column if not exists cohort_since timestamptz;

-- ---------------------------------------------------------------------------
-- ③ 変更の記録（★age_answer_changes と同じ形。身元は入れません）
-- ---------------------------------------------------------------------------
create table if not exists public.cohort_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  from_value text,
  to_value text not null,
  changed_at timestamptz not null default now()
);

create index if not exists cohort_changes_user_idx
  on public.cohort_changes (user_id, changed_at desc);

alter table public.cohort_changes enable row level security;

do $$
begin
  -- ★本人だけが読めます。書き換えと削除のポリシーは作りません。
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'cohort_changes'
                   and policyname = 'Users can view own cohort changes') then
    create policy "Users can view own cohort changes"
      on public.cohort_changes for select using (auth.uid() = user_id);
  end if;
end $$;

comment on table public.cohort_changes is
  '群のラベルを変えた記録。★行を消さないこと。★IPを保存しないこと。age_answer_changes と同じ形。';

-- ---------------------------------------------------------------------------
-- ④ ★いまのテスターを引き継ぐ（3人ぶんの付与を失わないため）
--
--    ★is_tester が true の人を、そのまま tester にします。
--      アドレスで指定しません。既に立っている印を、そのまま写します。
--      （アドレスを書き写すと、打ち間違えたときに取りこぼします）
-- ---------------------------------------------------------------------------
update public.profiles
   set cohort = 'tester',
       cohort_since = coalesce(cohort_since, now())
 where is_tester = true
   and cohort <> 'tester';

-- 引き継いだことを、記録にも残す
insert into public.cohort_changes (user_id, from_value, to_value)
select id, 'general', 'tester'
  from public.profiles
 where is_tester = true
   and not exists (
     select 1 from public.cohort_changes c
      where c.user_id = public.profiles.id and c.to_value = 'tester'
   );

-- ---------------------------------------------------------------------------
-- ⑤ 確かめる
-- ---------------------------------------------------------------------------
-- ★①の「いまテスターの人」と、ここの tester の数が一致すること
select cohort as "群", count(*) as "人数"
  from public.profiles
 group by 1
 order by 2 desc;

-- ★is_tester と cohort が食い違っている人が0であること
select count(*) as "食い違い（0であること）"
  from public.profiles
 where (is_tester and cohort <> 'tester')
    or (not is_tester and cohort = 'tester');

-- 誰が tester か（★確認のため。管理画面でも見られます）
select u.email, p.cohort, p.cohort_since
  from public.profiles p
  join auth.users u on u.id = p.id
 where p.cohort = 'tester'
 order by p.cohort_since;

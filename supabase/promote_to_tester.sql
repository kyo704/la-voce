-- ============================================================================
-- 一般の方を「テスター」に上げる（★毎回これ1本を使い回します）
--
--   使い方
--     ① 下の「★ここだけ書き換える」の1行に、メールアドレスを入れる
--     ② 全文を選んで実行する
--     ③ 出てきた表の「結果」を読む
--
--   ★書き換えるのは1か所だけです。ほかにアドレスは出てきません。
--     2か所に書く形にすると、片方を直し忘れたときに、
--     ★別の人の状態を見て「変更できました」と読んでしまいます。
--
--   ★1回の実行で、確認と変更の両方をやります。
--     ・見つからなければ、何も変わりません（更新の対象が0行になります）
--     ・すでにテスターなら、記録を二重に足しません
--       （同じ変更が並ぶと「いつからテスターか」が読めなくなるため）
--     ・最後の表から、何が起きたかが必ず分かります
--
--   ★founder について（docs/lavoce-テスターへの先行公開と群のラベル.md §3-1）
--     坂本さんが個別に声をかけた方は、tester でも founder でもあります。
--     機能の判断に使うのは cohort なので、★tester を入れます。
--     lib/entitlements.js では tester と founder は同じだけ見えますが、
--     継続率の分母をそろえるために tester と数えます。
--     general → tester に変わった事実と時刻は、cohort_changes に残ります。
--
--   ★実行するのは坂本さんです（本番の認証情報を使うため）。
-- ============================================================================

with target_email as (
  -- ┌──────────────────────────────────────────────────────────────────────┐
  -- │ ★ここだけ書き換える                                                  │
  -- └──────────────────────────────────────────────────────────────────────┘
  select 'ここにメールアドレス@example.com'::text as email
),

-- ---------------------------------------------------------------------------
-- ① そのアカウントがあるか、いまの群は何かを見る
--    ★大文字小文字と前後の空白は無視します（貼り付けの事故を防ぐため）
-- ---------------------------------------------------------------------------
person as (
  select u.id,
         u.email,
         p.cohort       as cohort_now,
         p.cohort_since as since_now
    from target_email m
    join auth.users u      on lower(u.email) = lower(btrim(m.email))
    join public.profiles p on p.id = u.id
),

-- ---------------------------------------------------------------------------
-- ② テスターでない人だけを、変更の対象にする
-- ---------------------------------------------------------------------------
to_change as (
  select * from person where cohort_now is distinct from 'tester'
),

-- ---------------------------------------------------------------------------
-- ③ 群を変える
-- ---------------------------------------------------------------------------
updated as (
  update public.profiles p
     set cohort = 'tester',
         cohort_since = now()
    from to_change t
   where p.id = t.id
  returning p.id,
            t.cohort_now   as cohort_before,
            p.cohort       as cohort_after,
            p.cohort_since as changed_at
),

-- ---------------------------------------------------------------------------
-- ④ 変更の記録を残す（★あとから遡れないので、必ず同時に入れます）
-- ---------------------------------------------------------------------------
logged as (
  insert into public.cohort_changes (user_id, from_value, to_value)
  select id, cohort_before, 'tester' from updated
  returning user_id, from_value, to_value, changed_at
)

-- ---------------------------------------------------------------------------
-- ⑤ 何が起きたかを表示する（★必ず1行返ります）
-- ---------------------------------------------------------------------------
select
  case
    when not exists (select 1 from person)  then '✗ 見つかりません（何も変えていません）'
    when exists (select 1 from updated)     then '✓ テスターに変更しました'
    else                                         '― すでにテスターでした（何も変えていません）'
  end                                                        as "結果",
  (select btrim(email) from target_email)                    as "メールアドレス",
  coalesce((select cohort_before from updated),
           (select cohort_now    from person),
           '(アカウントなし)')                                 as "前の群",
  coalesce((select cohort_after  from updated),
           (select cohort_now    from person),
           '(アカウントなし)')                                 as "後の群",
  coalesce((select changed_at    from updated),
           (select since_now     from person))                as "その群になった時刻",
  (select count(*) from logged)                              as "記録に足した行数";

-- ============================================================================
-- ⑥ 直近の変更の記録（★上の1行と食い違っていないかを見ます）
--
--   ★ここにメールアドレスは書きません。いちばん新しい記録を出すだけです。
--     いま実行したぶんが、いちばん上に来ます。
-- ============================================================================
select c.changed_at   as "時刻",
       u.email        as "メールアドレス",
       c.from_value   as "前",
       c.to_value     as "後"
  from public.cohort_changes c
  join auth.users u on u.id = c.user_id
 order by c.changed_at desc
 limit 5;

-- ============================================================================
-- ⑦ いまの群ごとの人数（★15〜20人の枠に収まっているかを見ます）
-- ============================================================================
select cohort as "群", count(*) as "人数"
  from public.profiles
 group by cohort
 order by 2 desc;

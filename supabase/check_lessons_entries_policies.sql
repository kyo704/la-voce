-- ============================================================================
-- lessons と entries のポリシーを、いまの姿のまま見る（2026-09-03）
--
--   ★何も変えません。見るだけです。
--
--   ★なぜ、これを一緒に持ち帰るのか
--     この2つの表では、手で当てられたポリシーが原因で
--     ★実際に他人の行が見えていました。
--
--       lessons（2026-09-02）
--         4本すべてが (org_id IS NULL) OR … で始まっていました。
--         ★PERMISSIVE は OR で足し合わされるので、org_id が null の行では
--           左が真になり、can_view_ops が★一度も呼ばれませんでした。
--         紐付け経由のレッスンは org_id が null です。つまり
--         ★先生と生徒の1対1のレッスンが、全員に見えていました。
--
--       entries（2026-09-02）
--         "Teachers can view active students entries" が残っていて、
--         ★先生が生徒の記録の行そのものを読めていました。
--         select("*") はすべての列を返すので、
--         ★「先生には決して渡さない11列」も渡っていました。
--         その前日に関数（get_student_entries）だけを消して
--         ★「構造として済んでいる」と私が言ったのは、誤りでした。
--         ポリシーを一度も見ていなかったためです。
--
--   ★だから、migration_lesson_held.sql を流す前に、これを見てください。
--     held は「先生だけが書ける」ことを前提にしています。
--     その前提は★lessons の UPDATE ポリシーが担っています。
--     ポリシーが想定と違えば、★生徒が自分のレッスンを「実施した」に
--     できてしまいます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① lessons のポリシー（★全部）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
 order by cmd, policyname;

-- ★UPDATE のポリシーだけを取り出します。held を書けるのは誰かが、ここで決まります。
select policyname as "★held を書ける条件", qual as "USING"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons' and cmd = 'UPDATE';

-- ---------------------------------------------------------------------------
-- ② entries のポリシー（★本人のものだけであること）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
 order by cmd, policyname;

-- ★0行であること。先生に届く道が残っていてはいけません。
select policyname as "★先生向けのポリシー（0行であること）", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
   and (coalesce(qual::text, '') like '%teacher_student_links%'
     or coalesce(qual::text, '') like '%assignments%'
     or coalesce(with_check::text, '') like '%teacher_student_links%');

-- ---------------------------------------------------------------------------
-- ③ ★「列が null なら誰でも」の形が、どこかに残っていないか
--
--   lessons で実際に起きた形です。ほかの表にも無いかを見ます。
--   ★0行であること。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       qual as "USING"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual::text, '') ~ '\( *\w+ +IS +NULL *\) +OR'
     or coalesce(with_check::text, '') ~ '\( *\w+ +IS +NULL *\) +OR')
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ④ ★RLS を素通りする関数が、この2つの表を読んでいないか
--
--   SECURITY DEFINER の関数は、呼んだ人のポリシーを無視します。
--   ★出てきたものは、1つずつ中身を確かめてください。
-- ---------------------------------------------------------------------------
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       case when pg_get_functiondef(p.oid) like '%search_path%'
            then 'あり' else '★search_path が無い' end as "search_path"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prosecdef
   and (pg_get_functiondef(p.oid) like '%public.entries%'
     or pg_get_functiondef(p.oid) like '%public.lessons%')
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑤ ★実地の確認（これが本当の答えです）
--
--   ★ふつうの利用者のセッションで実行してください。
--     service_role では RLS を素通りするので、確かめになりません。
--   ★claims を先、role をあとに。順番を逆にすると効きません。
-- ---------------------------------------------------------------------------

-- ⑤-1 生徒が、他人の記録を読めないこと
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<生徒の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★他人の記録（0であること）"
--   from public.entries where user_id <> auth.uid();
-- rollback;

-- ⑤-2 生徒が、自分のレッスンの held を書けないこと
--     ★migration_lesson_held.sql を流したあとに実行してください。
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<生徒の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.lessons set held = true
--  where id = '<その生徒のレッスンの uuid>'
-- returning id as "★生徒が書けてしまった行（0行であること）";
-- rollback;

-- ============================================================================
-- ★下書き（まだ流さないでください）：profiles の漏れを、いますぐ塞ぐ案
--
--   ★これは選択肢のひとつです。実行の可否は、運営者と Opus のご判断です。
--   ★私からは、両方の道の中身と、それぞれで何が起きるかだけをお示しします。
--
--   ■ 何が起きているか
--     ポリシー profiles_connected_display_name（SELECT）
--       USING: are_connected(auth.uid(), id)
--     ★名前は「display_name だけ」と読めますが、RLS は★行単位です。
--       列は絞れません。行が読めれば、その行の★全部が読めます。
--         allergies / regular_medications / conditions（既往症）/
--         health_notes / is_under_18 / cycle_show_on_home / line_user_id …
--     ★lessons・entries に続いて、今日3件目の同じ誤解です。
--
--   ■ ★このポリシーを消すと、何が変わるか（確かめました）
--     3か所が profiles を引いています。いずれも
--       .select("id, display_name, vocal_profession")
--     の2列＋idだけで、★全列を要る場所は1つもありません。
--       9733行  先生が、自分の生徒の名前を引く
--       9937行  生徒が、担当の先生の名前を引く
--       10284行 生徒が、レッスンの先生の名前を引く
--
--     ★消しても、内部のIDが画面に出ることはありません。
--       2026-09-02 に、その道はすでに塞いであります
--       （VocalTracker.jsx:10114-10119 のコメント）。
--       ・先生の欄 … 「先生」（teacherWithHonorific の UNKNOWN_TEACHER_LABEL）
--       ・そのほか … 「名前を読み込めませんでした」（NAME_UNKNOWN_LABEL）
--     ★つまり、失われるのは★名前の表示だけです。
--       「53ef27ed…」のような uuid には戻りません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 消す前の姿を残す（★これを先に控えてください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

-- ★are_connected の中身も、消す前に控えてください。
--   ★あとで同じ範囲の関数を作るときに、これが要ります。
select pg_get_functiondef(p.oid) as "are_connected の中身（★控えてください）"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'are_connected';

-- ---------------------------------------------------------------------------
-- ② 消す
--
--   ★関数（are_connected）そのものは消しません。
--     ★あとで同じ範囲の関数を作るときの、唯一の手がかりだからです。
--     ポリシーから呼ばれなくなれば、それだけで漏れは止まります。
--   ★ほかの表のポリシーから呼ばれていないことを、先に確かめてください（③）。
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_connected_display_name" on public.profiles;

-- ---------------------------------------------------------------------------
-- ③ 残ってよいのは、本人だけの2本です
-- ---------------------------------------------------------------------------
select policyname as "残っているポリシー", cmd as "操作", qual as "USING"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;
-- ★for select … auth.uid() = id
--   for update … auth.uid() = id
--   ★この2本だけであること。

-- ★are_connected が、ほかの表のポリシーからも呼ばれていないこと。
select tablename as "★まだ are_connected を使っている表（0行であること）",
       policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual::text,'') like '%are_connected%'
     or coalesce(with_check::text,'') like '%are_connected%');

-- ---------------------------------------------------------------------------
-- ④ ★実地の確認（これが本当の答えです）
--
--   ★+g4t2 のセッションで実行してください。
--     service_role では RLS を素通りするので、確かめになりません。
-- ---------------------------------------------------------------------------
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"0648585d-42f7-4d26-b47c-878beba15fa0","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★見える profiles の行数（1であること。直す前は2）"
--   from public.profiles;
-- rollback;

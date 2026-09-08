-- ============================================================================
-- ★★急ぎの直し ── 「実施の記録」が保存できなくなっています（2026年9月8日）
--
--   ★★私の誤りです。★先ほどの SQL の③で、こう書きました。
--
--       revoke update on public.lessons from authenticated;
--       grant update (attendance, attendance_at, attendance_by) ...
--
--   ★★lessons を update するところが、★もう1つ ありました。
--       handleSetLessonHeld …… { held: nextHeld }（★実施の記録）
--   ★その列の権限を、★剥がしたまま 返していませんでした。
--   ★★いま、先生が「実施」を押しても、★0行しか変わりません。
--     ★画面にはエラーが出ません（RLS も権限も、静かに0行にします）。
--
--   ★このSQLで、★要る列だけを 返します。
--
--   ★★あわせて、★坂本さんのご指摘（★古いポリシーとの関係）へのお答えを、
--     ★下の⓪に 書きました。★先にお読みください。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ ★★ご指摘へのお答え（★先に、確かめていただくための問い合わせ）
--
--   ★★お尋ね
--     「古い UPDATE のポリシー（USING あり・WITH CHECK なし）が、
--       ★列ごとの GRANT を すり抜けるのではないか」
--
--   ★★お答え ── ★すり抜けません。
--     ★権限（GRANT）と 行の決まり（RLS）は、★別の2枚の門です。
--     ★★両方を通らないと、書けません。★ポリシーは、権限を与えません。
--     ★だから「attendance の GRANT が無い相手」は、
--       ★どんなポリシーが在っても、★attendance を書けません。
--
--   ★★ただし、★別の問題が あります。★こちらは そのとおりです。
--     ★★RLS の「許す」ポリシーは、★OR で足されます。
--       ★私が足した lessons_attendance_teacher_update は「許す」側です。
--       ★★だから、★狭めることが できません。★広げることしか できません。
--     ★どの行を書けるかを決めているのは、★古い2枚のほうです。
--     ★★私のポリシーは、★良くて 重複、★悪ければ 広げただけです。
--
--   ★★「WITH CHECK: false」の読み方
--     ★あの列は「WITH CHECK の式が在るか」を出しています。
--     ★★false は「式が無い」であって、「常に拒否」では ありません。
--     ★PostgreSQL は、★WITH CHECK が無いとき、★USING の式を 代わりに使います。
--     ★だから「何でも書ける」状態では ありません。
--     ★★ですが、★「新しい行に何を入れてよいか」を、★誰も決めていません。
--       ★それが、★Opus の「WITH CHECK の無い UPDATE は欠陥です」の意味です。
--
--   ★★次にすること（★このSQLでは やりません）
--     ★古い2枚の中身を、★下の問い合わせで 出してください。
--     ★中身を見てから、★どう直すかを ご相談します。
--     ★★中身を見ずに、★書き替えません。
-- ---------------------------------------------------------------------------
select '⓪ 古いポリシーの中身' as "段階",
       policyname as "名前", cmd as "操作", permissive as "許す/拒む",
       qual as "USING の式",
       with_check as "WITH CHECK の式"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
 order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- ① ★急ぎの直し ── 「実施の記録」の列を、返します
--
--   ★★アプリが update する列は、★この4つだけです（★コードで数えました）。
--       held　　　　　　… 実施の記録
--       attendance　　　… 出欠
--       attendance_at
--       attendance_by
--   ★★insert では note / scheduled_at / link_id / org_id … も使いますが、
--     ★update しているところは ありません。
--   ★★ですので、★update は この4列だけ 返します。
--     ★日時や相手を あとから書き替える道は、★作りません。
-- ---------------------------------------------------------------------------
grant update (held, attendance, attendance_at, attendance_by)
  on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- ② 確かめ
-- ---------------------------------------------------------------------------
select '② 列ごとの UPDATE' as "段階", grantee as "相手", column_name as "書ける列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
 order by 1, 2, 3;

-- ★★表ぜんたいの UPDATE が、★戻っていないこと。
select '② 表ぜんたいの UPDATE' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE';

-- ★★もし、これでも何かが保存できなくなっていたら、★この1行で 元に戻せます。
--   ★（★コメントを外して、実行してください）
-- grant update on public.lessons to authenticated;

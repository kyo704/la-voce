-- ============================================================================
-- 出欠まわりの、直し（2026年9月8日・★2回目）
--
--   ★★1回目の直し（held を返す）は、★誤りでした。★捨ててください。
--     ★lessons に held という列は、★はじめから 在りません。
--
--   ★★ここですることは、★1つだけです。
--       ★私が足したポリシーを、★消します。
--   ★★列を足しません。★権限も、これ以上 渡しません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ ★★「実施の記録」は、どこに在るか ── ★どこにも在りません
--
--   ★調べました。
--     ・lessons に held の列は 在りません（★坂本さんの一覧のとおり）
--     ・supabase/migration_lesson_held.sql は ★書かれていません
--       （★supabase/check_lessons_entries_policies.sql が
--         ★「これを流す前に見てください」と書いている相手が、無い）
--     ・画面（実施した／しなかった）と lib/lessonCounts.js と 見張りは、
--       ★どれも 作られています
--
--   ★★つまり、★入れ物だけが 作られませんでした。
--     ★「実施した」を押すと 42703 で失敗し、★console に出て 終わります。
--     ★画面には、何も出ません。
--   ★★この機能は、★最初から 一度も動いていません。
--     ★★私は「私の SQL が壊した」と申し上げました。★誤りでした。
--       ★お詫びして、訂正します。
--
--   ★★列は、足しません。
--     ★attendance（came / absent / canceled）が、★同じことを指します。
--     ★1つの決めを、★2つの列で持たないためです。
--     ★画面と数え上げを、★attendance を読む形に直しました（★アプリ側）。
--       came　　　… 実施した
--       canceled　… しなかった
--       null　　　… まだ答えていない
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ① ★★私が足したポリシーを、消します
--
--   ★★坂本さんのご指摘のとおりでした。
--     ★RLS の「許す」ポリシーは、★OR で足されます。
--     ★だから、★私の1枚は、★狭めることが できません。
--
--   ★★そのうえ、★広げていました。
--     私の USING　 auth.uid() = teacher_id  or  exists(link …)
--     古い①　　　 exists(link …)
--     古い②　　　 org_id is not null and can_view_ops(auth.uid(), org_id, student_id)
--
--     ★★「auth.uid() = teacher_id」が、★古い2枚に無い道です。
--       ★org の行では、★can_view_ops を通らずに 書けてしまいます。
--       ★教室から外れた先生でも、★teacher_id が自分のままなら 書けます。
--
--   ★★だから、★消します。★古い2枚で じゅうぶんです。
-- ---------------------------------------------------------------------------
drop policy if exists lessons_attendance_teacher_update on public.lessons;

-- ---------------------------------------------------------------------------
-- ② ★WITH CHECK が無いことについて ── ★いまは、直さなくてよいと考えます
--
--   ★★古い2枚には、WITH CHECK の式が ありません。
--     ★PostgreSQL は、無いとき ★USING を 代わりに使います。
--     ★だから「何でも書ける」では ありません。
--
--   ★★そして いま、★列ごとの GRANT が 効いています。
--       grant update (attendance, attendance_at, attendance_by)
--     ★★link_id も org_id も teacher_id も student_id も、★書けません。
--       ★だから「別の教室へ動かす」ことが、★そもそも できません。
--     ★★WITH CHECK が守るはずだった相手が、★権限の側で 塞がっています。
--
--   ★★とはいえ、★「新しい行に何を入れてよいか」を、
--     ★誰も 明示していないことに 変わりはありません。
--     ★もし列ごとの GRANT を いつか広げるなら、★そのとき必ず 書いてください。
--
--   ★★いま書き替えないのは、★古い2枚を作り直すと、
--     ★delete の道も 一緒に触ることになるためです（★for all ではなく for update
--       ★かどうかを、★中身を見ないと決められません）。
--   ★★下の③で、★その1点だけ 確かめてください。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ③ 確かめ
-- ---------------------------------------------------------------------------
select '③ ポリシー' as "段階", policyname as "名前", cmd as "操作",
       permissive as "許す/拒む",
       (with_check is not null) as "WITH CHECK の式が在るか"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
 order by cmd, policyname;

-- ★★私のポリシーが、消えていること。
select '③ 私のポリシー' as "段階",
       count(*) as "★0 でなければ、消えていません"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
   and policyname = 'lessons_attendance_teacher_update';

-- ★★書ける列が、3つだけであること。
select '③ 書ける列' as "段階", grantee as "相手", column_name as "列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
 order by 1, 2;

select '③ 表ぜんたいの UPDATE' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE';

-- ★★held の列が、無いままであること（★足していないことの確かめ）。
select '③ held' as "段階",
       count(*) as "★0 のままで、正しいです"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons' and column_name = 'held';

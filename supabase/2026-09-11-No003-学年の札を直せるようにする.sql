-- ============================================================================
-- 修正 No.003 ★学年の 札（grade_label）を 直せる ように する
--
--   ★何が 起きて いるか
--     ★画面は `memberships.grade_label` を、★ブラウザから 直に 書いて います
--       （★components/VocalTracker.jsx:11737）。
--     ★★けれど authenticated に、★その 列の UPDATE が 付いて いません。
--     ★★だから **どの 役職でも**、★学年の 札を 直せません。
--        ★10役職 とも `42501 permission denied for table memberships`。
--     ★★見つかったのは 2026-09-11、★§3 の 総当たりの 途中です。
--        ★頼まれた 範囲の 外で、★たまたま 出て きました。
--
--   ★なぜ 列ごとに 付けるのか
--     ★★表ごとに UPDATE を 付けると、★post_id も role も 一緒に 開きます。
--     ★★9月11日の 教訓 ── ★表の 許しが 残って いると、★列の 許しは 黙って 負けます。
--        ★だから 表ごとの UPDATE は **付けません**。★列だけに 付けます。
--     ★★いま authenticated が 持つ 列ごとの UPDATE は `role` だけ です
--        （★実地で 確かめました。★role は 通り、★grade_label は 通りません）。
--
--   ★決まり（RLS）は そのまま です
--     ★★この SQL は 決まりを 1本も 触りません。
--     ★★誰が 直せるかは、★これまでどおり memberships の 決まりが 決めます。
--        ★許しは「その 列に 手が 届くか」だけ。★門は 決まりの ほうです。
--
--   ★★1つずつ 流して ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★いま どうなって いるか（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select column_name as "列", privilege_type as "何を", grantee as "誰に"
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'memberships'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
order by column_name;

-- ★★期待（★直す 前）── `role` だけ が 出る。


-- ────────────────────────────────────────────────────────────────
-- ② ★表ごとの UPDATE が 付いて いない ことを 確かめる
--    ★★付いて いたら、★②の 先へ 進まないで ください。
--      ★★列の 許しを 足しても 意味が ありません（★広い ほうが 勝ちます）。
--      ★★その ときは お知らせ ください。★先に 剥がす 手を 書きます。
-- ────────────────────────────────────────────────────────────────
select grantee as "誰に", privilege_type as "何を"
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'memberships'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- ★★期待 ── **0行**。


-- ────────────────────────────────────────────────────────────────
-- ③ ★学年の 札だけに、★書く 許しを 付ける
-- ────────────────────────────────────────────────────────────────
grant update (grade_label) on public.memberships to authenticated;


-- ────────────────────────────────────────────────────────────────
-- ④ ★確かめ（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select column_name as "列", privilege_type as "何を", grantee as "誰に"
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'memberships'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
order by column_name;

-- ★★期待（★直した あと）── `grade_label` と `role` の 2行。


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★表ごとの UPDATE が、★増えて いない ことを もう一度
--    ★★③で うっかり 広い 許しを 付けて いない か の 検めです。
-- ────────────────────────────────────────────────────────────────
select grantee as "誰に", privilege_type as "何を"
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'memberships'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

-- ★★期待 ── **0行**（★①の ときと 同じ）。


-- ────────────────────────────────────────────────────────────────
-- ⑥ ★戻し方（★もし 何か あった とき）
-- ────────────────────────────────────────────────────────────────
-- revoke update (grade_label) on public.memberships from authenticated;

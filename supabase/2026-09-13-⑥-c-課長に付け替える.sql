-- ============================================================================
-- ⑥-(c) ★坂本さんを 課長に 付け替える（★設定の 画面を 見る ため）
--
--   ★確かめた こと（2026-09-13）
--     ★① `staff` は 台帳が 許す 値です
--        （★CHECK は owner／admin／teacher／staff）。
--     ★② 課長の できこと … bill／sched_all／shukketsu／koma／post
--        ★★`meibo` を 持ちません。★だから (c) が 試せます。
--     ★③ 運営モードの 入口は `mayEnterOps(mm.role)` ＝ 名前の ちから で 出ます。
--        ★`BY_ROLE['staff']` は `["schedule"]` で 空では ないので、★入口は 出ます。
--     ★④ 中の タブは できこと で 決まります（`gate = permsOfMember(...)`）。
--        ★`TAB_RULES` の 設定は `koma／master／post／bill` の どれか。
--        ★★課長は koma・post・bill を 持つので、★**設定の タブは 出ます。**
--     ★⑤ 名簿の タブは `meibo` が 要ります。★課長には 出ません。
--        ★★どのみち 名簿は いま 誰も 出せないので、★差し支え ありません。
--     ★⑥ 学年の 引き金（guard_grade_label）は `grade_label` が
--        ★変わった ときだけ 働きます。★ここでは 働きません。
--     ★⑦ 止める 決まり（memberships_update_needs_can_post）は
--        ★SQL エディタ（裏口）を 素通りします。
--
--   ★★足した 手当て
--     ★★元の 書き方は、★課長の 役職が 見つからない とき `post_id` に
--       ★**空**を 入れて しまいます。★役職が 外れ、★設定の タブも 消えます。
--       ★★黙って 壊れるので、★見つからない ときは **1行も 変えない** 形に しました。
--
--   ★★1つずつ 流して ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★いまの 姿（★読むだけ・★あとで くらべる ため）
-- ────────────────────────────────────────────────────────────────
select m.role                            as "名前の ちから",
       coalesce(q.name, '（役職 なし）')  as "役職",
       coalesce(q.perms::text, '—')      as "できこと"
from public.organizations o
join public.memberships m on m.org_id = o.id
join auth.users u on u.id = m.user_id
left join public.org_posts q on q.id = m.post_id
where o.name = '★実機テスト（消してよい）'
  and u.email = 'kyo0703opera@gmail.com';

-- ★★期待 ── 1行。★admin ／ 学部長。


-- ────────────────────────────────────────────────────────────────
-- ② ★課長の 役職が 本当に あるか（★読むだけ）
--    ★★0行 なら、★③を 流さないで ください。★②で 止まります。
-- ────────────────────────────────────────────────────────────────
select q.id as "課長の 役職の id", q.perms as "できこと"
from public.org_posts q
join public.organizations o on o.id = q.org_id
where o.name = '★実機テスト（消してよい）' and q.name = '課長';

-- ★★期待 ── 1行。★できことに `"post": true` と `"meibo"` が 無い こと。


-- ────────────────────────────────────────────────────────────────
-- ③ ★付け替える
--    ★★`exists` を 付けて います。★課長の 役職が 無ければ 1行も 変えません。
--      ★★空を 入れて 黙って 壊す ことが ありません。
-- ────────────────────────────────────────────────────────────────
update public.memberships m
   set role = 'staff',
       post_id = q.id
  from public.organizations o,
       auth.users u,
       public.org_posts q
 where o.id = m.org_id
   and u.id = m.user_id
   and q.org_id = o.id
   and q.name = '課長'
   and o.name = '★実機テスト（消してよい）'
   and u.email = 'kyo0703opera@gmail.com';

-- ★★期待 ── UPDATE 1。★0 なら 何かが 合って いません。★お知らせ ください。


-- ────────────────────────────────────────────────────────────────
-- ④ ★確かめ（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select m.role                            as "名前の ちから",
       coalesce(q.name, '（役職 なし）')  as "役職",
       (q.perms ->> 'post')::boolean     as "ひとの 役職を 変える",
       coalesce((q.perms ->> 'meibo')::boolean, false)      as "名簿（★無い はず）",
       coalesce((q.perms ->> 'shukketsu')::boolean, false)  as "出席（★ある はず）"
from public.organizations o
join public.memberships m on m.org_id = o.id
join auth.users u on u.id = m.user_id
left join public.org_posts q on q.id = m.post_id
where o.name = '★実機テスト（消してよい）'
  and u.email = 'kyo0703opera@gmail.com';

-- ★★期待 ── staff ／ 課長 ／ true ／ false ／ true


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★戻し方（★(c) が 済んだら、★学部長に 戻す ばあい）
-- ────────────────────────────────────────────────────────────────
-- update public.memberships m
--    set role = 'admin', post_id = q.id
--   from public.organizations o, auth.users u, public.org_posts q
--  where o.id = m.org_id and u.id = m.user_id and q.org_id = o.id
--    and q.name = '学部長'
--    and o.name = '★実機テスト（消してよい）'
--    and u.email = 'kyo0703opera@gmail.com';

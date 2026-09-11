-- ============================================================================
-- §3 ★50通り ── ★第2層（台帳）★まず 実態を 読む
--
--   ★★1行も 書きません。★読むだけ です。
--     ★★BEGIN / ROLLBACK は 使いません（★9月11日の 教訓。
--       ★★SQL エディタは 巻き戻しませんでした）。
--
--   ★★先に 実態を 見る 理由 ── ★私は 今日 2度 当てずっぽうで 落としました
--     ★（owner_id／'member'）。★台帳を 読む 手が 無い ぶん、★先に 見ます。
--
--   ★★5つの表の 実際の 姿（★コードから 確かめた もの）
--     ★名簿　　　　　　 public.enrollments
--     ★役職と 所属　　　public.memberships（post_id 列）／public.org_posts
--     ★レッスンの 日程　public.lessons
--     ★レッスンの 出席　public.lessons の attendance 列　★★同じ 表です
--     ★行事　　　　　　 public.org_events
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★5つの表に、★どんな 決まりが かかって いるか
--    ★★permissive は または、★restrictive は かつ で つながります。
-- ────────────────────────────────────────────────────────────────
select tablename as "表", policyname as "決まりの 名前",
       permissive as "または/かつ", cmd as "何に",
       coalesce(qual, '（無し）') as "読める 条件",
       coalesce(with_check, '（無し）') as "書ける 条件"
from pg_policies
where schemaname = 'public'
  and tablename in ('enrollments', 'memberships', 'org_posts', 'lessons', 'org_events')
order by tablename, permissive desc, cmd, policyname;


-- ────────────────────────────────────────────────────────────────
-- ② ★その 決まりの うち、★できこと（perms）を 見て いるのは 何本か
--    ★★has_can を 使って いる 決まりだけが、★役職の できことを 見て います。
--    ★★それ 以外は、★名前の ちから（role）だけで 決めて います。
-- ────────────────────────────────────────────────────────────────
select tablename as "表",
       count(*) as "決まり 全部",
       count(*) filter (where coalesce(qual,'') like '%has_can%'
                           or coalesce(with_check,'') like '%has_can%') as "できことを 見る",
       count(*) filter (where coalesce(qual,'') like '%role%'
                           or coalesce(with_check,'') like '%role%') as "名前の ちからを 見る"
from pg_policies
where schemaname = 'public'
  and tablename in ('enrollments', 'memberships', 'org_posts', 'lessons', 'org_events')
group by tablename
order by tablename;


-- ────────────────────────────────────────────────────────────────
-- ③ ★列ごとの 許し（GRANT）が あるか
--    ★★出席（lessons.attendance）と 日程（lessons の 時刻）は 同じ 表です。
--      ★★行の 決まりでは 分けられません（★行の 決まりは 列を 隠せません）。
--      ★★分けるには、★列ごとの 許し か、★security definer の 関数が 要ります。
--    ★★ここが 空なら ── ★「日程を 直せる 方は、★出席も 付けられる」です。
-- ────────────────────────────────────────────────────────────────
select table_name as "表", grantee as "誰に", privilege_type as "何を",
       column_name as "どの 列"
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('lessons', 'enrollments', 'memberships', 'org_posts', 'org_events')
  and grantee in ('authenticated', 'anon')
order by table_name, grantee, column_name;


-- ────────────────────────────────────────────────────────────────
-- ④ ★表ごとの 許し（★列ごとの 許しが 効くには、★先に これを 剥がす 必要が あります）
--    ★★2026-09-11の 教訓 ── ★表の 許しが 残って いると、★列の 許しは 黙って 負けます。
-- ────────────────────────────────────────────────────────────────
select table_name as "表", grantee as "誰に",
       string_agg(privilege_type, ', ' order by privilege_type) as "何を"
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('lessons', 'enrollments', 'memberships', 'org_posts', 'org_events')
  and grantee in ('authenticated', 'anon')
group by table_name, grantee
order by table_name, grantee;


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★10校の 姿を、★もう一度（★道具に 渡す ため）
-- ────────────────────────────────────────────────────────────────
select o.name as "学校", q.name as "役職", m.role as "名前の ちから",
       o.id as "学校の id"
from public.organizations o
join public.org_posts q on q.org_id = o.id
join public.memberships m on m.org_id = o.id
where o.name like '★50通り-%'
order by o.name;

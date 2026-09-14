-- ============================================================================
-- ★役割（role）に 寄りかかって いる 決まりを 読む（★読むだけ）
--   ★出どころ Opus 裁定 その23・項目3／項目4（★9月15日の 関門）
--   ★1行も 書きません。
-- ============================================================================

-- ① enrollments の 4つ（SELECT／INSERT／UPDATE／DELETE）を ぜんぶ
select policyname as "決まり", permissive as "または/かつ", cmd as "何に",
       roles::text as "誰に",
       coalesce(qual,'（無し）') as "読める 条件",
       coalesce(with_check,'（無し）') as "書ける 条件"
from pg_policies
where schemaname='public' and tablename='enrollments'
order by cmd, policyname;

-- ② 台帳ぜんたい ── 役割に 寄る 決まりを 数える
select tablename as "表",
       count(*) as "決まり ぜんぶ",
       count(*) filter (where coalesce(qual,'')||coalesce(with_check,'')
                        like '%is_org_owner_or_admin%') as "is_org_owner_or_admin",
       count(*) filter (where coalesce(qual,'')||coalesce(with_check,'')
                        like '%''owner''%') as "owner を 直に",
       count(*) filter (where coalesce(qual,'')||coalesce(with_check,'')
                        like '%has_can%') as "has_can"
from pg_policies
where schemaname='public'
group by tablename
having count(*) filter (where coalesce(qual,'')||coalesce(with_check,'')
                        like '%is_org_owner_or_admin%'
                           or coalesce(qual,'')||coalesce(with_check,'')
                        like '%''owner''%') > 0
order by 3 desc, tablename;

-- ★★この 表の 合計が、★安全管理の 書類に 書く「総当たり」の 母数です。

-- ③ 役割に 寄る 決まりを、★1本ずつ
select tablename as "表", policyname as "決まり", cmd as "何に",
       coalesce(qual,'') as "読める 条件",
       coalesce(with_check,'') as "書ける 条件"
from pg_policies
where schemaname='public'
  and (coalesce(qual,'')||coalesce(with_check,'') like '%is_org_owner_or_admin%'
    or coalesce(qual,'')||coalesce(with_check,'') like '%''owner''%')
order by tablename, cmd, policyname;

-- ④ memberships の 決まりが enrollments を 引いて いないか
--    ★★42P17（終わらない 繰り返し）を 避ける ため（★項目2）。
select policyname as "決まり", cmd as "何に",
       coalesce(qual,'')||' / '||coalesce(with_check,'') as "条件"
from pg_policies
where schemaname='public' and tablename='memberships'
  and (coalesce(qual,'')||coalesce(with_check,'') like '%enrollments%');
-- ★★期待 ── 0行。1行でも あれば、★enrollments の 決まりで
--   memberships を 引く ときに 回ります。お知らせ ください。

-- ⑤ has_can が memberships を どう 引いて いるか（★同じ 心配）
select pg_get_functiondef(p.oid) as "has_can の 中身"
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='has_can';
-- ★★security definer なら、★決まりを 飛び越えるので 回りません。

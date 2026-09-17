-- ===========================================================================
-- ★問い ── ★「（移行）先生」の 役職と、★その方たちの いま
--
--   ★★`org_posts` の `perms` が 空（`{}`）の 役職が 2件 ある、と 伺いました。
--   ★★3人が それを 持って います（★53ef27ed / 40fb914f / 5f9cf956）。
--
--   ★★★入れる かどうかを、★**台帳の 側から** 確かめます。
--     ★★画面の 側は `tabsForPerms(perms)` です。★1枚も 出なければ 入れません。
--     ★★できことが 空なら、★どの タブの 決まりにも 当たりません。
--
--   ★★★読むだけ です。★1文字も 書きません。
-- ===========================================================================

-- 【一】★空の できことを 持つ 役職
select p.id, p.org_id, o.name as 教室, p.name as 役職,
       p.perms,
       (p.perms is null or p.perms = '{}'::jsonb
         or jsonb_typeof(p.perms) = 'object' and p.perms = '{}'::jsonb) as 空か
from public.org_posts p
left join public.organizations o on o.id = p.org_id
order by p.name;

-- 【二】★その 役職を 持つ 方（★人数と、★もとの 役割）
select p.name as 役職, m.role as もとの役割, count(*) as 人数
from public.memberships m
join public.org_posts p on p.id = m.post_id
group by p.name, m.role
order by p.name, m.role;

-- 【三】★★「入れるか」を、★台帳の 側で 数えます
--   ★★タブの 決まり（`lib/opsPerms.js` の `TAB_RULES`）に 当たる できことを
--     ★1つでも 持って いるか。★持って いなければ、★画面に 1枚も 出ません。
select p.name as 役職,
       count(m.*) as 人数,
       bool_or(
         p.perms ?| array['meibo','sched_all','sched_mine','bill','monka_write',
                          'gyoji','renraku_all','monka_read','koma','master','post']
       ) as 運営に入れるか
from public.org_posts p
left join public.memberships m on m.post_id = p.id
group by p.name
order by 運営に入れるか, p.name;

-- 【四】★その 3人が、★ほかに 役職を 持って いないか
select m.user_id, o.name as 教室, m.role as もとの役割, p.name as 役職, p.perms
from public.memberships m
left join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
where m.user_id in ('53ef27ed-0000-0000-0000-000000000000')  -- ★頭だけ 伺って います
   or m.user_id::text like '53ef27ed%'
   or m.user_id::text like '40fb914f%'
   or m.user_id::text like '5f9cf956%'
order by m.user_id;

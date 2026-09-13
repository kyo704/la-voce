-- ============================================================================
-- ★名簿の 直し ① ── ★いまの 姿を 見せる（★読むだけ）
--
--   ★出どころ Opus 裁定 その21（★㋑）── ★生徒は enrollments に 居る。
--     ★★memberships に role='student' も status 列も 足さない。
--     ★★OpsRoster を enrollments から 読む 形に 書き直す。
--
--   ★★書き直す **前に**、★実際の 姿を 出します。
--     ★★9月13日、★私は 3度 まちがえました ──
--       ★① 種まき不足と 見立てた
--       ★② role を 空に しろと 言った（★NOT NULL でした）
--       ★③ 名簿が 誰を 並べるのかを 読まずに 言った
--     ★★どれも「台帳を 見ずに 決めた」ためです。
--
--   ★★1行も 書きません。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★2つの 表の 列（★9月11日に 数えた ものと 突き合わせる ため）
-- ────────────────────────────────────────────────────────────────
select table_name        as "表",
       ordinal_position  as "番",
       column_name       as "列",
       data_type         as "型",
       is_nullable       as "空でよいか",
       column_default    as "既定"
from information_schema.columns
where table_schema = 'public'
  and table_name in ('memberships', 'enrollments')
order by table_name, ordinal_position;

-- ★★9月11日の 数え ── memberships 10列／enrollments 6列。
--   ★★ちがって いたら、★そこが 見落としです。


-- ────────────────────────────────────────────────────────────────
-- ② ★決まりごと（CHECK・NOT NULL・重なり止め・つながり先）
-- ────────────────────────────────────────────────────────────────
select c.conrelid::regclass::text as "表",
       c.conname                  as "決まりの 名前",
       case c.contype
         when 'c' then '中身の 決まり（CHECK）'
         when 'u' then '重ならない（UNIQUE）'
         when 'p' then '行の 名前（PRIMARY KEY）'
         when 'f' then 'つながり先（FOREIGN KEY）'
         else c.contype::text
       end                        as "たぐい",
       pg_get_constraintdef(c.oid) as "中身"
from pg_constraint c
where c.conrelid in ('public.memberships'::regclass, 'public.enrollments'::regclass)
order by c.conrelid::regclass::text, c.contype, c.conname;


-- ────────────────────────────────────────────────────────────────
-- ③ ★enrollments の status に、★実際に 入って いる 値
--    ★★**ここが いちばん 大事です。**
--    ★★無い 値を 画面に 書くと、★9月13日と 同じ ことが 起きます。
-- ────────────────────────────────────────────────────────────────
select coalesce(status, '（空）') as "ようす",
       count(*)                   as "行の 数",
       count(distinct org_id)     as "学校の 数"
from public.enrollments
group by status
order by count(*) desc;

-- ★★出た 値だけを 画面で 使います。★思いついた 値を 足しません。


-- ────────────────────────────────────────────────────────────────
-- ④ ★本物の 学校ごとの 数（★使い捨てを 外す）
-- ────────────────────────────────────────────────────────────────
select o.name                                              as "学校",
       o.kind                                              as "たぐい",
       (select count(*) from public.memberships m
         where m.org_id = o.id)                             as "memberships",
       (select count(*) from public.enrollments e
         where e.org_id = o.id)                             as "enrollments",
       (select count(*) from public.enrollments e
         where e.org_id = o.id and e.status = 'active')     as "うち active",
       (select count(*) from public.memberships m
         where m.org_id = o.id and m.grade_label is not null) as "学年の 札"
from public.organizations o
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
  and o.name not like '★実機テスト%'
order by (select count(*) from public.enrollments e where e.org_id = o.id) desc,
         o.name;

-- ★★enrollments が 0 の 学校は、★書き直しても 名簿が 空の ままです。
--   ★★「直したのに 出ない」を 先に 見分ける ため に 数えます。


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★学年の 札は、★どちらの 表に あるか
--    ★★No.004 で memberships.grade_label に 引き金を 立てました。
--    ★★生徒が enrollments に 居るなら、★札の 置き場が 合って いません。
--    ★★裁定 その18 と その21 の つなぎ目です。
-- ────────────────────────────────────────────────────────────────
select 'memberships.grade_label' as "置き場",
       count(*) filter (where grade_label is not null) as "入って いる 行",
       count(*)                                        as "行 ぜんぶ"
from public.memberships
union all
select 'enrollments に 学年の 列が あるか',
       (select count(*) from information_schema.columns
         where table_schema = 'public' and table_name = 'enrollments'
           and column_name like '%grade%'),
       null;

-- ★★memberships の 札が 0 なら、★置き場を 移しても 失う ものは ありません。
--   ★★0 で なければ、★誰の 札かを 見てから 決めます。

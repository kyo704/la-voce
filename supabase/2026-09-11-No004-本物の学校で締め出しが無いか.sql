-- ============================================================================
-- No.004 ★本物の 学校で、★誰かを 締め出して いないか（★読むだけ）
--
--   ★なぜ
--     ★★引き金は `has_can(org_id, 'meibo')` だけを 見ます。
--       ★**役職（post）を 持って いない 方は、★名前の ちからが owner でも
--         ★通りません。** ★それが お決めの とおりです。
--     ★★だから、★役職の 無い 学校では 学年の 札を 直せなく なります。
--
--   ★★使い捨ての 学校は 外します（★★50通り・★はじめの1人テスト）。
--   ★★1行も 書きません。★数えて 並べるだけ です。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★学校ごとに、★3つ 数える
--    ★★札の ある 方　　　… grade_label が 入って いる 方
--    ★★名簿を 預かる 方　… meibo を 持つ 役職の 方（★引き金が 通す 方）
--    ★★役職の 無い 方　　… post_id が 空の 方
-- ────────────────────────────────────────────────────────────────
with mine as (
  select m.org_id, m.user_id, m.grade_label, m.role, m.post_id,
         coalesce((q.perms ->> 'meibo')::boolean, false) as has_meibo
  from public.memberships m
  left join public.org_posts q on q.id = m.post_id
)
select o.name                                                as "学校",
       count(*)                                              as "在籍の 方",
       count(*) filter (where x.grade_label is not null)     as "札の ある 方",
       count(*) filter (where x.has_meibo)                   as "名簿を 預かる 方",
       count(*) filter (where x.post_id is null)             as "役職の 無い 方",
       case
         when count(*) filter (where x.grade_label is not null) > 0
          and count(*) filter (where x.has_meibo) = 0
         then '★★締め出し'
         when count(*) filter (where x.has_meibo) = 0
         then '★これから 締め出し（★札が 入った 時点で）'
         else 'ー'
       end                                                   as "見立て"
from public.organizations o
join mine x on x.org_id = o.id
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
group by o.name, o.id
order by
  (count(*) filter (where x.grade_label is not null) > 0
   and count(*) filter (where x.has_meibo) = 0) desc,
  o.name;

-- ★★見立ての 読み方
--   ★「★★締め出し」　　… ★いま 札が あるのに、★直せる 方が 居ません。
--   ★「★これから」　　　… ★まだ 札は 無い。★入れた 途端に 直せなく なります。
--   ★「ー」　　　　　　　… ★直せる 方が 居ます。


-- ────────────────────────────────────────────────────────────────
-- ② ★①で「★★締め出し」が 出た 学校の、★中の 人を 見る
--    ★★<ORG名> を、★①で 出た 学校の 名前に 置き換えて ください。
--    ★★お名前は 出しません。★役職と 札の 有無 だけ 見ます。
-- ────────────────────────────────────────────────────────────────
-- select m.role                          as "名前の ちから",
--        coalesce(q.name, '（役職 なし）') as "役職",
--        (m.grade_label is not null)     as "札が ある",
--        coalesce((q.perms ->> 'meibo')::boolean, false) as "名簿を 預かる"
-- from public.memberships m
-- join public.organizations o on o.id = m.org_id
-- left join public.org_posts q on q.id = m.post_id
-- where o.name = '<ORG名>'
-- order by q.sort_order nulls last;


-- ────────────────────────────────────────────────────────────────
-- ③ ★学校ぜんたいの 姿（★1行）
-- ────────────────────────────────────────────────────────────────
with mine as (
  select m.org_id, m.grade_label,
         coalesce((q.perms ->> 'meibo')::boolean, false) as has_meibo
  from public.memberships m
  left join public.org_posts q on q.id = m.post_id
), per as (
  select o.id,
         count(*) filter (where x.grade_label is not null) as labelled,
         count(*) filter (where x.has_meibo)               as keepers
  from public.organizations o
  join mine x on x.org_id = o.id
  where o.name not like '★50通り-%'
    and o.name not like '★はじめの1人テスト%'
  group by o.id
)
select count(*)                                             as "本物の 学校",
       count(*) filter (where keepers > 0)                  as "預かる 方が 居る",
       count(*) filter (where keepers = 0)                  as "預かる 方が 居ない",
       count(*) filter (where labelled > 0 and keepers = 0) as "★★いま 締め出し"
from per;

-- ★★「★★いま 締め出し」が 0 なら、★No.004 は 誰も 締め出して いません。
-- ★★0 で なければ、★その 学校を お知らせ ください。
--   ★★黙って 直しません。★どう するかは お決めです。

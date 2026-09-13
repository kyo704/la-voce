-- ============================================================================
-- ★本物の 学校の 役職を 見る（★読むだけ）
--
--   ★なぜ
--     ★★使い捨ての 学校で、★学部長が `post` を 持って いました。
--       ★★裁定 その19（★No.005）── ★学部長は `post` を 持ちません。
--     ★★本物の 学校でも 同じ ことが 起きて いないかを 見ます。
--
--   ★★ここで 分かって おきたい こと
--     ★★これは **不具合とは 限りません**。
--       ★★学校は 自分で 役職を 作れ、★鍵も 足せます（★`add`／`perm`）。
--       ★★「ひな型と ちがう」は「まちがい」では ありません。
--       ★★見たいのは「**思って いたのと ちがう ところ**」だけ です。
--
--   ★★1行も 書きません。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★本物の 学校の 役職を、★ぜんぶ 並べる
--    ★★使い捨ての 学校は 外します。
-- ────────────────────────────────────────────────────────────────
select o.name                                     as "学校",
       q.name                                     as "役職",
       q.sort_order                               as "並び",
       (select count(*) from public.memberships m
         where m.post_id = q.id)                  as "この 役職の 方",
       q.perms                                    as "できこと"
from public.organizations o
join public.org_posts q on q.org_id = o.id
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
  and o.name not like '★実機テスト%'
order by o.name, q.sort_order;


-- ────────────────────────────────────────────────────────────────
-- ② ★ひな型と ちがう ところ だけ を 出す
--
--    ★★ひな型（lib/opsPerms.js の TEMPLATE_POSTS）を そのまま 書き写します。
--    ★★同じ 名前の 役職だけを くらべます。
--      ★★学校が 自分で 付けた 名前は、★くらべる 相手が ありません。
--      ★★その ぶんは ③で 別に 出します。
-- ────────────────────────────────────────────────────────────────
with hinagata(name, perms) as (values
  ('学長',   '{"bill":true,"bill_pay":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
  ('副学長', '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
  ('事務長', '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
  ('学部長', '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true}'::jsonb),
  ('学科長', '{"meibo":true,"sched_all":true,"gyoji":true,"shukketsu":true,"koma":true}'::jsonb),
  ('教授',   '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
  ('准教授', '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
  ('講師',   '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
  ('課長',   '{"bill":true,"sched_all":true,"shukketsu":true,"koma":true,"post":true}'::jsonb),
  ('職員',   '{"sched_all":true,"shukketsu":true,"koma":true}'::jsonb)
)
select o.name                                      as "学校",
       q.name                                      as "役職",
       -- ★ひな型に 無いのに 付いて いる 鍵
       (select coalesce(string_agg(k, ', ' order by k), '—')
          from jsonb_object_keys(q.perms) k
         where (q.perms ->> k)::boolean is true
           and coalesce((h.perms ->> k)::boolean, false) is not true)
                                                   as "★増えて いる 鍵",
       -- ★ひな型に あるのに 付いて いない 鍵
       (select coalesce(string_agg(k, ', ' order by k), '—')
          from jsonb_object_keys(h.perms) k
         where (h.perms ->> k)::boolean is true
           and coalesce((q.perms ->> k)::boolean, false) is not true)
                                                   as "★減って いる 鍵"
from public.organizations o
join public.org_posts q on q.org_id = o.id
join hinagata h on h.name = q.name
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
  and o.name not like '★実機テスト%'
  and q.perms is distinct from h.perms
order by o.name, q.sort_order;

-- ★★期待 ── **0行**。★1行も 出なければ、★ひな型の ままです。
-- ★★出た ときは、★増えて いる 鍵を ご覧ください。
--   ★★とくに `post` と `master` は、★学校ぜんぶに かかる 重い 鍵です。


-- ────────────────────────────────────────────────────────────────
-- ③ ★学校が 自分で 作った 役職（★ひな型に 名前が 無い もの）
-- ────────────────────────────────────────────────────────────────
select o.name as "学校", q.name as "役職", q.perms as "できこと"
from public.organizations o
join public.org_posts q on q.org_id = o.id
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
  and o.name not like '★実機テスト%'
  and q.name not in ('学長','副学長','事務長','学部長','学科長',
                     '教授','准教授','講師','課長','職員')
order by o.name, q.sort_order;

-- ★★出ても 不具合では ありません。★学校は 役職を 作れます。
--   ★★ただし「誰が いつ 作ったか」の 控えは、★いま ありません。


-- ────────────────────────────────────────────────────────────────
-- ④ ★`post` を 持つ 役職を、★本物の 学校ぜんぶで 数える
--    ★★いちばん 重い 鍵なので、★1つの 表に します。
-- ────────────────────────────────────────────────────────────────
select o.name as "学校", q.name as "役職",
       (select count(*) from public.memberships m where m.post_id = q.id) as "その 方",
       case when q.name in ('学長','副学長','事務長','課長')
            then 'ー' else '★★ひな型では 持ちません' end as "見立て"
from public.organizations o
join public.org_posts q on q.org_id = o.id
where o.name not like '★50通り-%'
  and o.name not like '★はじめの1人テスト%'
  and o.name not like '★実機テスト%'
  and (q.perms ->> 'post')::boolean is true
order by o.name, q.sort_order;

-- ★★「★★ひな型では 持ちません」が 出た 役職が、★見るべき ところです。

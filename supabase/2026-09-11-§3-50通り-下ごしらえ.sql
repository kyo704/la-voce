-- ============================================================================
-- §3 ★50通りの 総当たり ── ★下ごしらえ
--
--   ★★10役職 × 5つの表 ＝ 50通り。★それを 1回の 実行で 回せる ように します。
--
--   ★★考え方 ── ★1つの 学校で 役職を 10回 付け替えると、
--     ★★坂本さんと 私の あいだを 10往復 することに なります。
--     ★★そこで **捨ててよい 学校を 10個** 作り、
--       ★使い捨ての 方を、★10校に 1つずつ 別の 役職で 入れます。
--     ★★その方は 同時に 10の 役職を 持つので、★道具が 1回で 50通り 回せます。
--
--   ★★触るのは、★名前が「★50通り」で 始まる 学校だけです。
--     ★本物の 学校・本物の 方には、★1行も 触れません。
--
--   ★★終わったら ⑥で すべて 消します。
--   ★★1つずつ 流してください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ⓪ ★まず、★列の 名前を 見せてください
--
--   ★★2026-09-11、★私は ここを owner_id と 書いて 落としました。
--     ★★確かめずに 書きました。★坂本さんの ご指摘の とおり created_by です。
--     ★★台帳を 読む 手が 無い ぶん、★思い出しで 書かない こと。
--   ★★kind が 要るか どうかも、★ここで 分かります。
-- ────────────────────────────────────────────────────────────────
select column_name as "列", data_type as "型",
       is_nullable as "空でよいか", column_default as "既定"
from information_schema.columns
where table_schema = 'public' and table_name = 'organizations'
order by ordinal_position;


-- ────────────────────────────────────────────────────────────────
-- ① ★捨ててよい 学校を 10個 作る（★役職 1つに つき 1校）
--
--   ★★列は created_by です（★owner_id では ありません）。
--   ★★kind は 入れて いません。★⓪で「空でよいか = NO」かつ「既定 = 空」
--     ★★だった ときだけ、★下の 2行目の 印を 外して ください。
-- ────────────────────────────────────────────────────────────────
insert into public.organizations (name, created_by)
--                              , kind          ← ★要るときは この行の 印を 外し、
--                                                 ★下の select にも p.kind を 足す
select '★50通り-' || lpad(i::text, 2, '0') || '-' || p.name,
       'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
from (values
  (1,'学長'),(2,'副学長'),(3,'事務長'),(4,'学部長'),(5,'学科長'),
  (6,'教授'),(7,'准教授'),(8,'講師'),(9,'課長'),(10,'職員')
) as p(i, name);


-- ────────────────────────────────────────────────────────────────
-- ② ★各校に、★その 役職を 1つだけ 作る
--    ★★中身は lib/opsPerms.js の TEMPLATE_POSTS と 同じです。
-- ────────────────────────────────────────────────────────────────
insert into public.org_posts (org_id, name, sort_order, perms)
select o.id, p.name, 0, p.perms
from public.organizations o
join (values
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
) as p(name, perms) on o.name like '★50通り-%-' || p.name
where o.name like '★50通り-%';


-- ────────────────────────────────────────────────────────────────
-- ③ ★使い捨ての 方を、★10校に 1つずつ 入れる
--    ★★role は member です。★役職の ちからだけを 確かめる ため、
--      ★★owner／admin の 名前による ちからを 混ぜません。
-- ────────────────────────────────────────────────────────────────
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'member', q.id
from public.organizations o
join public.org_posts q on q.org_id = o.id
where o.name like '★50通り-%'
on conflict (org_id, user_id) do update set role = 'member', post_id = excluded.post_id;


-- ────────────────────────────────────────────────────────────────
-- ④ ★確かめ ── ★10校 できて いますか
-- ────────────────────────────────────────────────────────────────
select o.name as "学校", q.name as "役職", m.role as "名前の ちから",
       (select count(*) from jsonb_each(q.perms) where value = 'true'::jsonb) as "できこと",
       o.id as "学校の id"
from public.organizations o
join public.org_posts q on q.org_id = o.id
join public.memberships m on m.org_id = o.id
where o.name like '★50通り-%'
order by o.name;

-- ★★期待 ── 10行。★名前の ちからは すべて member。
--   ★学長 10・副学長 9・事務長 9・学部長 8・学科長 5・
--   ★教授 4・准教授 4・講師 4・課長 5・職員 3。
--   ★★この 10行を、★そのまま お戻しください（★道具が 学校の id を 使います）。


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★台帳側の 50通り（★①の 表）
--    ★★これは 下ごしらえでは なく、★答えそのものです。
--      ★別ファイル 2026-09-11-§3-50通り-台帳の側.sql で お出しします。
-- ────────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────────
-- ⑥ ★お片づけ（★50通りが 終わってから）
--    ★★消すのは、★名前が「★50通り」で 始まる 学校だけです。
-- ────────────────────────────────────────────────────────────────
-- delete from public.memberships
--   where org_id in (select id from public.organizations where name like '★50通り-%');
-- delete from public.org_posts
--   where org_id in (select id from public.organizations where name like '★50通り-%');
-- delete from public.organizations where name like '★50通り-%';

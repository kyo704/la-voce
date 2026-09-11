-- ============================================================================
-- §3 ★50通りの 総当たり ── ★役職を 1つずつ 付け替える
--
--   ★★10役職 × 5つの表（名簿／役職と所属／レッスンの日程／レッスンの出席／行事）
--   ★★API側を 確かめる あいだ、★使い捨ての 方の 役職を 1つずつ 入れ替えます。
--
--   ★★使うのは 捨ててよい 学校だけです。★本物の 学校には 触れません。
--   ★★終わったら ⑤で すべて 元に 戻します。
--
--   ★★1つずつ 流してください（★まとめて 流さないで ください）。
--     ★★9月11日、★create policy を まとめて 流して 行き詰まりました。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★まず、★使い捨ての 学校を 1つ 作ります
--    ★★もう お作りの ものが あれば、★①は 飛ばして ②へ。
-- ────────────────────────────────────────────────────────────────
insert into public.organizations (name, owner_id)
values ('★50通りテスト（消してよい）', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2')
returning id, name;

-- ★★↑ 出てきた id を 控えてください。★以下 <ORG> と 書きます。


-- ────────────────────────────────────────────────────────────────
-- ② ★その学校に、★使い捨ての 方を 入れます（★役職は まだ 無し）
--    ★★<ORG> を、★①で 出た id に 置き換えてください。
-- ────────────────────────────────────────────────────────────────
insert into public.memberships (org_id, user_id, role, post_id)
values ('<ORG>', 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'member', null)
on conflict (org_id, user_id) do update set role = 'member', post_id = null;


-- ────────────────────────────────────────────────────────────────
-- ③ ★10の 役職を 作ります
--    ★★APIの template は 使いません。★あれは「学校を 作った方」しか 通れず、
--      ★★いま わざと role を member に しているためです。
--    ★★中身は lib/opsPerms.js の TEMPLATE_POSTS と 同じです。
-- ────────────────────────────────────────────────────────────────
insert into public.org_posts (org_id, name, sort_order, perms) values
 ('<ORG>', '学長',   0, '{"bill":true,"bill_pay":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
 ('<ORG>', '副学長', 1, '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
 ('<ORG>', '事務長', 2, '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true,"post":true}'::jsonb),
 ('<ORG>', '学部長', 3, '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true}'::jsonb),
 ('<ORG>', '学科長', 4, '{"meibo":true,"sched_all":true,"gyoji":true,"shukketsu":true,"koma":true}'::jsonb),
 ('<ORG>', '教授',   5, '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
 ('<ORG>', '准教授', 6, '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
 ('<ORG>', '講師',   7, '{"sched_mine":true,"monka_write":true,"shukketsu":true,"koma_mine":true}'::jsonb),
 ('<ORG>', '課長',   8, '{"bill":true,"sched_all":true,"shukketsu":true,"koma":true,"post":true}'::jsonb),
 ('<ORG>', '職員',   9, '{"sched_all":true,"shukketsu":true,"koma":true}'::jsonb);


-- ────────────────────────────────────────────────────────────────
-- ④ ★確かめ ── ★10 できて いますか
-- ────────────────────────────────────────────────────────────────
select sort_order + 1 as "番", name as "役職",
       (select count(*) from jsonb_each(perms) where value = 'true'::jsonb) as "できこと"
from public.org_posts
where org_id = '<ORG>'
order by sort_order;

-- ★★期待 ── 10行。★学長 10・副学長 9・事務長 9・学部長 8・学科長 5・
--   ★教授 4・准教授 4・講師 4・課長 5・職員 3。


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★お片づけ（★50通りが 終わってから）
--    ★★消すのは、★この 使い捨ての 学校だけです。
-- ────────────────────────────────────────────────────────────────
-- delete from public.memberships where org_id = '<ORG>';
-- delete from public.org_posts   where org_id = '<ORG>';
-- delete from public.organizations where id   = '<ORG>';

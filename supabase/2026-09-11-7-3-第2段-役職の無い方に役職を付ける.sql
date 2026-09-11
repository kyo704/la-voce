-- ============================================================================
-- §7-3　★第2段　── ★役職の 無い 方に、★役職を 付ける
--
--   ★★第1段で 分かった こと（★坂本さんの 実行・2026-09-11）
--     ★食い違いは **ぜんぶ「★狭くなる」**でした。
--     ★「★★広くなる」は **1つも ありません**でした。
--     ★★そして、★どれも **役職を 持って いない 方**でした。
--
--   ★★つまり、★いま 起きて いるのは こう いう ことです。
--     ★★その 方たちは、★**役割（role）だけで 通って います**。
--     ★★決まりを has_can（＝できこと）に 移すと、★通らなく なります。
--     ★★★穴は 閉じます。★けれど、★**その 方の 仕事も 止まります**。
--
--   ★★だから、★切り替える **前に**、★役職を 付けます。
--     ★出どころ　坂本さんの お決め
--       「見えないものを 先に 作る → ★入口を 増やす → 権限を 最後に」
--     ★★これが「入口を 増やす」です。★権限（決まり）は まだ 触りません。
--
--   ★★★①②は 読むだけ です。★③から 書きます。
--     ★★①②を 見て、★お決めを いただいてから ③を 流して ください。
-- ============================================================================


-- ===========================================================================
-- ① ★誰に 付ける ことに なるか（★読むだけ）
-- ===========================================================================
select
  o.name   as "教室",
  m.role   as "役割",
  count(*) as "役職の 無い 方の 数"
from public.memberships m
join public.organizations o on o.id = m.org_id
where m.post_id is null
group by o.name, m.role
order by o.name, m.role;

-- ★★1人ずつ。★誰に 何が 付くのかを、★目で 見て ください。
select
  o.name as "教室",
  m.role as "いまの 役割",
  case m.role
    when 'owner'   then '（移行）学校ぜんぶ'
    when 'admin'   then '（移行）学校ぜんぶ（お金を 除く）'
    when 'staff'   then '（移行）事務'
    when 'teacher' then '（移行）先生'
    else null
  end   as "★付ける 役職",
  m.user_id as "その方"
from public.memberships m
join public.organizations o on o.id = m.org_id
where m.post_id is null
order by o.name, m.role;


-- ===========================================================================
-- ② ★付ける 役職の 中身（★読むだけ・★ここが 肝です）
--
--   ★★いまの 決まりが 通して いる ものを、★そのまま 写します。
--     ★★増やしません。★減らしません。
--     ★★だから、★付けた あとも「できる こと」は 1つも 変わりません。
--     ★★変わるのは、★**見張りの 軸**だけです（★role → できこと）。
--
--   ★★出どころ　第1段の ⑤で 使った 対応です。★そこに 並べた 10だけ を 写します。
--     owner   … meibo・sched_all・gyoji・renraku_all・bill・bill_pay・master・post・koma
--     admin   … meibo・sched_all・gyoji・renraku_all・master・koma
--     staff   … sched_all・koma
--     teacher … ★**1つも ありません**（★空の 役職）
--
--   ★★★ここで、★1度 書きかけて 直した ことが あります。★残して おきます。
--     ★★はじめ、★teacher に sched_mine・monka_write・shukketsu・koma_mine を、
--       ★staff に shukketsu を 付けよう と しました。
--     ★★けれど、★それは **広くなる** 側の 変更です。
--       ★★いまの サーバは、★role から その 4つを 通して いません。
--       ★★付ければ、★いま できない ことが できる ように なります。
--     ★★しかも、★⑥の 突き合わせでは **見つかりません**。
--       ★★⑥が くらべるのは「学校ぜんぶに かかる もの」10 だけ です。
--       ★★自分の ぶん（sched_mine など）は、★そこに 入って いません。
--     ★★★見張りに かからない ところで 広げる ── ★いちばん 危ない 形です。
--
--   ★★だから、★**⑥が くらべる 10 だけ**を 写します。
--     ★★自分の ぶんの できことは、★1つも 付けません。
--     ★★要る ことが 分かったら、★そのとき 1つずつ 足します。
--       ★★足す ときは、★何が 変わるかが はっきり します。
-- ===========================================================================
select * from (values
  ('owner',   '（移行）学校ぜんぶ',
   '{"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"bill":true,"bill_pay":true,"master":true,"post":true,"koma":true}'),
  ('admin',   '（移行）学校ぜんぶ（お金を 除く）',
   '{"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"master":true,"koma":true}'),
  ('staff',   '（移行）事務',
   '{"sched_all":true,"koma":true}'),
  ('teacher', '（移行）先生',
   '{}')
) as t(役割, 役職の名前, できること);


-- ===========================================================================
-- ③ ★★ここから 書きます ── ★役職を 作る
--
--   ★★その 教室に、★同じ 名前の 役職が 無い ときだけ 作ります。
--   ★★人には まだ 付けません。★作るだけ です。
--   ★★sort_order は 900 番台に します。★もとから ある 役職の 下に 並びます。
-- ===========================================================================
insert into public.org_posts (org_id, name, perms, sort_order)
select distinct
  m.org_id,
  v.name,
  v.perms::jsonb,
  v.ord
from public.memberships m
join (values
  ('owner',   '（移行）学校ぜんぶ', 900,
   '{"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"bill":true,"bill_pay":true,"master":true,"post":true,"koma":true}'),
  ('admin',   '（移行）学校ぜんぶ（お金を 除く）', 901,
   '{"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"master":true,"koma":true}'),
  ('staff',   '（移行）事務', 902,
   '{"sched_all":true,"koma":true}'),
  ('teacher', '（移行）先生', 903, '{}')
) as v(role, name, ord, perms) on v.role = m.role
where m.post_id is null
  and not exists (
    select 1 from public.org_posts p
     where p.org_id = m.org_id and p.name = v.name
  );


-- ===========================================================================
-- ④ ★人に 付ける
--
--   ★★役職を 持って いない 方 だけ です。
--   ★★もう 持って いる 方には 触れません。★上書きしません。
-- ===========================================================================
update public.memberships m
   set post_id = p.id
  from public.org_posts p
 where p.org_id = m.org_id
   and m.post_id is null
   and p.name = case m.role
     when 'owner'   then '（移行）学校ぜんぶ'
     when 'admin'   then '（移行）学校ぜんぶ（お金を 除く）'
     when 'staff'   then '（移行）事務'
     when 'teacher' then '（移行）先生'
   end;


-- ===========================================================================
-- ⑤ ★★付いたかの 確かめ（★役職の 無い 方が 0 に なる こと）
-- ===========================================================================
select
  m.role                                    as "役割",
  count(*)                                  as "人数",
  count(*) filter (where m.post_id is null)  as "★役職が 無い 方（★0 で あって ほしい）"
from public.memberships m
group by m.role
order by m.role;


-- ===========================================================================
-- ⑥ ★★★いちばん 大事な 確かめ ── ★食い違いが 0 に なる こと
--
--   ★★第1段の ⑤と 同じ 突き合わせです。
--   ★★**0行** に なれば、★決まりを 移しても 誰も 困りません。
--   ★★1行でも 残れば、★そこを 先に 直します。★移しては いけません。
-- ===========================================================================
with 人 as (
  select m.org_id, m.user_id, m.role, p.name as post_name, p.perms as perms
  from public.memberships m
  left join public.org_posts p on p.id = m.post_id
),
くらべ as (
  select
    人.org_id, 人.role, 人.post_name, k.perm,
    case k.perm
      when 'meibo'       then 人.role in ('owner','admin')
      when 'sched_all'   then 人.role in ('owner','admin','staff')
      when 'gyoji'       then 人.role in ('owner','admin')
      when 'renraku_all' then 人.role in ('owner','admin')
      when 'bill'        then 人.role = 'owner'
      when 'bill_pay'    then 人.role = 'owner'
      when 'master'      then 人.role in ('owner','admin')
      when 'post'        then 人.role = 'owner'
      when 'koma'        then 人.role in ('owner','admin','staff')
      when 'monka_read'  then false
      else false
    end as いまの判じ,
    coalesce((人.perms -> k.perm)::text, 'false') = 'true' as これからの判じ
  from 人
  cross join (values ('meibo'),('sched_all'),('gyoji'),('renraku_all'),
                     ('bill'),('bill_pay'),('master'),('post'),
                     ('koma'),('monka_read')) as k(perm)
)
select
  role as "役割", post_name as "役職", perm as "できこと",
  いまの判じ as "いま", これからの判じ as "これから",
  case
    when いまの判じ and not これからの判じ then '★狭くなる'
    when not いまの判じ and これからの判じ then '★★広くなる'
    else ''
  end as "★ちがい"
from くらべ
where いまの判じ <> これからの判じ
order by role, post_name, perm;


-- ===========================================================================
-- ⑦ ★戻し方（★流しません。★要る ときだけ）
--
--   ★★付けた 役職を 外し、★作った 役職を 消します。
--   ★★「（移行）」で 始まる 名前の ものだけ です。
--   ★★もとから あった 役職には 触れません。
--
-- update public.memberships m set post_id = null
--   from public.org_posts p
--  where p.id = m.post_id and p.name like '（移行）%';
--
-- delete from public.org_posts where name like '（移行）%';
-- ===========================================================================

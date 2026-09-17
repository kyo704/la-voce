-- ===========================================================================
-- ★「（移行）先生」の 役職に、★できことを 入れる（★2026-09-18）
--
--   ★★いま `perms` が 空（`{}`）です。★その 役職の 方は
--     ★招かれた 教室の 運営画面に **1枚も** 出ません（★確かめ済み・【三】false）。
--
--   ★★★入れる もの ── ★「講師」と 同じ 4つ（★坂本さん 承認・2026-09-18）。
--     ★出どころ `lib/opsPerms.js` の `TEMPLATE_POSTS`（★裁定 §7 の 見本）。
--     ★★教授・准教授・講師の 3つ とも、★この 4つ で 同じ です。
--
--       sched_mine   … 自分の レッスンの 日程を 組む
--       monka_write  … 自分の 門下に 書く
--       shukketsu    … レッスンの 出席を つける
--       koma_mine    … 自分の コマを 決める（学校の コマの 中で）
--
--   ★★★学校ぜんぶに かかる できこと は 入れません。
--     （meibo／bill／bill_pay／sched_all／gyoji／renraku_all／
--       monka_read／koma／master／post）
--     ★★「先生」に 学校ぜんぶの 名簿や お金を 渡す 理由が ありません。
--     ★★渡しすぎは、★取り上げるより 直しにくい です。
--
--   ★★`perms` は jsonb で、★`{"meibo": true}` の 形 です（★配列では ありません）。
--
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★入れる 前（★読むだけ）
-- ---------------------------------------------------------------------------
select p.id, o.name as 教室, p.name as 役職, p.perms,
       (select count(*) from public.memberships m where m.post_id = p.id) as 人数
from public.org_posts p
left join public.organizations o on o.id = p.org_id
where p.name = '（移行）先生'
order by o.name;

-- ---------------------------------------------------------------------------
-- 【二】★できことを 入れる
--
--   ★★★名で 絞ります ── `p.name = '（移行）先生'`。
--     ★★`perms` が 空の もの **ぜんぶ** に しません。
--       ★★ほかにも 空の 役職が あった とき、★巻き込みます。
--       ★★いま 直すのは この 2件 だけ、と 決まって います。
--   ★★★もう 入って いる ものは 触りません（`p.perms = '{}'::jsonb` で 絞ります）。
--     ★★あとから 誰かが 手で 入れて いた とき、★上書きしない ため です。
-- ---------------------------------------------------------------------------
update public.org_posts p
   set perms = jsonb_build_object(
         'sched_mine',  true,
         'monka_write', true,
         'shukketsu',   true,
         'koma_mine',   true
       )
 where p.name = '（移行）先生'
   and (p.perms is null or p.perms = '{}'::jsonb);

-- ---------------------------------------------------------------------------
-- 【三】★入った ことの 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------
select p.id, o.name as 教室, p.name as 役職, p.perms,
       (select count(*) from public.memberships m where m.post_id = p.id) as 人数,
       (p.perms ?| array['meibo','sched_all','sched_mine','bill','monka_write',
                         'gyoji','renraku_all','monka_read','koma','master','post'])
         as 運営に入れるか
from public.org_posts p
left join public.organizations o on o.id = p.org_id
where p.name = '（移行）先生'
order by o.name;

-- ★★「運営に入れるか」が true に なれば、★入りました。
-- ★★出る タブは ── ★ホーム ／ 日程 ／ 門下 ／ 連絡 の 4枚 です。
--   ★★名簿・行事・設定は 出ません（★学校ぜんぶの できことを 入れて いない ため）。

-- ---------------------------------------------------------------------------
-- 【四】★★学校ぜんぶの できことを 渡して いない ことの 確かめ（★読むだけ）
--
--   ★★ここが true に なって いたら、★入れすぎ です。
-- ---------------------------------------------------------------------------
select p.name as 役職,
       (p.perms ?| array['meibo','bill','bill_pay','sched_all','gyoji',
                         'renraku_all','monka_read','koma','master','post'])
         as 学校ぜんぶの力を持っているか
from public.org_posts p
where p.name = '（移行）先生';

-- ★★★false で なければ なりません。

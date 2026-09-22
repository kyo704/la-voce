-- ★FX9 ── 本番に 残って いた 試しの データを 消します（2026-09-23）
--
--   ★★★坂本さんの ご承認 …… 「all clear。全て削除」。
--   ★★★**取り消せません。**★消した 行は 戻りません。
--
--   ★数えて から 書きました（2026-09-23）──
--     12の 試しの 学校 の どれにも、★**ほかの 利用者は 0人** です。
--     ★名簿の 人も 在籍の 人も、★ぜんぶ `kyo0703opera…` の 口 でした。
--
--   ★消えるのは、★学校に ぶら下がる もの ぜんぶ です（ON DELETE CASCADE）──
--     名簿（memberships）／在籍（enrollments）／受け持ち（assignments）／
--     レッスン（lessons）／連絡（org_messages）／行事（org_events）／役職（org_posts）ほか
--
--   ★★人（auth.users）は 消しません。★学校 だけ です。

begin;

-- ① 試しの 学校 12（★50通り-01〜10 と「消してよい」2つ）
delete from public.organizations
 where name like '★50通り-%' or name like '%消してよい%';

-- ② 部屋の 家具（★FX9 #2・#3）── ★`+forcode` の 試しの 口 **だけ**
--   ★★★坂本さん ご本人の 部屋は **触りません**。
--     ★ご自分で 置かれた もの です（★FX9 の 一覧に 書いた とおり）。
update public.profiles
   set character_equipped = character_equipped - 'furniture' - 'furniturePositions'
                                               - 'interior' - 'interiorPositions'
 where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

commit;

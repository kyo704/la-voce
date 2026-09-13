-- ============================================================================
-- ⑥ ★実機で 確かめる ── ★使い捨ての 学校を 1つ 用意する
--
--   ★何の ため
--     ★★坂本さんご自身の 目で、★3つを ご覧いただく ため です。
--       ★(a) 学部長が、★人の 役職を 変えようと する　→ ★止まる はず
--       ★(c) 課長が、★持って いない 鍵を 足そうと する → ★止まる はず
--       ★(b) は 本物の 学校で（★ご自分の owner の 力で・正当な 操作）
--
--   ★★本物の 学校には 1行も 触りません。
--     ★★作るのは「★実機テスト（消してよい）」という 名の 学校 1つ だけ。
--     ★★終わったら ⑨で すべて 消します。
--
--   ★★なぜ 使い捨てが 要るか
--     ★★(a) を 見るには、★**学部長の 役職**が 要ります。
--     ★★坂本さんは 本物の 学校の owner です。
--       ★★本物の 学校で ご自分を 学部長に 下げるのは、★してはいけません。
--       ★★だから、★捨ててよい 学校で だけ 学部長に なって いただきます。
--
--   ★★1つずつ 流して ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ⓪ ★坂本さんの id を 確かめる（★読むだけ）
--    ★★私は 思い出しで id を 書きません。★台帳に 尋ねます。
--    ★★お使いの お名前（メール）が ちがう ときは、★ここを 直して ください。
-- ────────────────────────────────────────────────────────────────
select id as "坂本さんの id", email as "お名前", created_at as "はじめた 日"
from auth.users
where email = 'kyo0703opera@gmail.com';

-- ★★期待 ── 1行。★0行 なら、★メールが ちがいます。★先へ 進まないで ください。


-- ────────────────────────────────────────────────────────────────
-- ① ★使い捨ての 学校を 1つ 作る
--    ★★`kind` は 書きません。★既定の 'solo' が 入ります。
-- ────────────────────────────────────────────────────────────────
insert into public.organizations (name, created_by)
select '★実機テスト（消してよい）', u.id
from auth.users u
where u.email = 'kyo0703opera@gmail.com'
  and not exists (
    select 1 from public.organizations o where o.name = '★実機テスト（消してよい）'
  );


-- ────────────────────────────────────────────────────────────────
-- ② ★役職を 2つ 作る
--
--    ★学部長 … `post` を 持たない。`master` を 持つ。
--              ★★(a) で 止まる ことを 見る ため。
--    ★課長　 … `post` を 持つ。`meibo`／`master`／`gyoji`／`renraku_all` を 持たない。
--              ★★(c) で「持って いない 鍵は 渡せない」を 見る ため。
--
--    ★★中身は lib/opsPerms.js の TEMPLATE_POSTS と 同じ です。
-- ────────────────────────────────────────────────────────────────
insert into public.org_posts (org_id, name, sort_order, perms)
select o.id, p.name, p.ord, p.perms
from public.organizations o
join (values
  ('学部長', 0, '{"bill":true,"meibo":true,"sched_all":true,"gyoji":true,"renraku_all":true,"shukketsu":true,"koma":true,"master":true}'::jsonb),
  ('課長',   1, '{"bill":true,"sched_all":true,"shukketsu":true,"koma":true,"post":true}'::jsonb)
) as p(name, ord, perms) on true
where o.name = '★実機テスト（消してよい）'
  and not exists (
    select 1 from public.org_posts q where q.org_id = o.id and q.name = p.name
  );


-- ────────────────────────────────────────────────────────────────
-- ③ ★坂本さんを、★**学部長**で お入れする
--    ★★名前の ちからは admin（★期待表の base の とおり）。
-- ────────────────────────────────────────────────────────────────
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, u.id, 'admin', q.id
from public.organizations o
join auth.users u on u.email = 'kyo0703opera@gmail.com'
join public.org_posts q on q.org_id = o.id and q.name = '学部長'
where o.name = '★実機テスト（消してよい）'
on conflict (org_id, user_id) do update
  set role = excluded.role, post_id = excluded.post_id;


-- ────────────────────────────────────────────────────────────────
-- ④ ★相手を 1人 お入れする（★使い捨ての アカウント）
--    ★★ご自分に 対して 試すと、★「自分だから 通った／止まった」のか
--      ★★分からなく なります。★別の 方に 対して 試して いただきます。
--    ★★この 方は 役職を 持ちません（★付け替える 相手に なります）。
-- ────────────────────────────────────────────────────────────────
insert into public.memberships (org_id, user_id, role, post_id)
select o.id, 'f7520dc1-9154-4524-a350-ba0bcddbf0b2', 'teacher', null
from public.organizations o
where o.name = '★実機テスト（消してよい）'
on conflict (org_id, user_id) do update
  set role = 'teacher', post_id = null;


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★確かめ（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select coalesce(q.name, '（役職 なし）') as "役職",
       m.role                            as "名前の ちから",
       case when u.email = 'kyo0703opera@gmail.com' then '★坂本さん' else '使い捨て' end as "どなた",
       o.id                              as "学校の id"
from public.organizations o
join public.memberships m on m.org_id = o.id
join auth.users u on u.id = m.user_id
left join public.org_posts q on q.id = m.post_id
where o.name = '★実機テスト（消してよい）'
order by q.sort_order nulls last;

-- ★★期待 ── 2行。
--   ★学部長／admin／★坂本さん
--   ★（役職 なし）／teacher／使い捨て


-- ════════════════════════════════════════════════════════════════
--   ★★ここで 一度 止めて、★実機で (a) を ご覧ください。
--
--   ★(a) の 見かた
--     ① もっと の 画面 →「★実機テスト（消してよい）の運営」を 押す
--     ② 下の「名簿」を 押す
--     ③ 使い捨ての 方の 行を 開く
--     ④ 「役職」の ところを 押す
--     ★★期待 ── ★**押せない か、★断りが 出る。**
--       ★OpsRoster は「渡せない 役職は 灰色。押すと わけを 出します」と
--       ★書いて います。★隠しません。
--     ★★もし 役職を 付けられて しまったら、★そこで 止めて お知らせください。
--       ★★それは §7 と 同じ 重さの 穴です。
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- ⑥ ★(a) が 済んだら、★坂本さんを **課長** に 付け替える
--    ★★(c) を 見る ため です。
-- ────────────────────────────────────────────────────────────────
-- update public.memberships m
--    set role = 'staff',
--        post_id = (select q.id from public.org_posts q
--                    join public.organizations o on o.id = q.org_id
--                   where o.name = '★実機テスト（消してよい）' and q.name = '課長')
--  from public.organizations o, auth.users u
--  where o.id = m.org_id and u.id = m.user_id
--    and o.name = '★実機テスト（消してよい）'
--    and u.email = 'kyo0703opera@gmail.com';


-- ════════════════════════════════════════════════════════════════
--   ★★⑥を 流したら、★実機で (c) を ご覧ください。
--
--   ★(c) の 見かた
--     ① 一度 運営モードを 出て、★入り直して ください（★読み直す ため）
--     ② 下の「設定」を 押す
--     ③ 役職の ところで「学部長」を 開く
--     ④ 「名簿を 見る・直す（meibo）」を 入れようと する
--     ★★期待 ── ★**断りが 出る。**
--       ★「学校全部に かかる ことは、自分が 持っていないと 渡せません。」
--     ★★念の ため ── ★「レッスンの 出席を つける（shukketsu）」は
--       ★課長も 持って いるので、★**入る はず** です。
--       ★★何でも 止めて いるのでは ない、という 確かめ です。
-- ════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════
--   ★★(b) は **本物の 学校**で お願いします。
--     ★★ご自分の owner の 力で、★名簿から どなたかの 役職を 変える。
--     ★★正当な 操作です。★元に 戻して いただければ 跡は 残りません。
-- ════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- ⑨ ★お片づけ（★3つ とも 済んでから）
--    ★★消すのは「★実機テスト（消してよい）」だけ です。
--    ★★順は この とおりに して ください（★つながり先を 先に 消す）。
-- ────────────────────────────────────────────────────────────────
-- delete from public.memberships
--   where org_id in (select id from public.organizations
--                     where name = '★実機テスト（消してよい）');
-- delete from public.org_posts
--   where org_id in (select id from public.organizations
--                     where name = '★実機テスト（消してよい）');
-- delete from public.organizations
--   where name = '★実機テスト（消してよい）';

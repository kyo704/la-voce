-- ============================================================================
-- forcode の 口座を「先生役」に する（2026-09-14）
--
--   ★目的 ㋑（別の 口座で 先生役）を、★Vercel の 環境変数を 1つも 変えずに 行う。
--
--   ★対象 kyo0703opera+forcode@gmail.com
--          f7520dc1-9154-4524-a350-ba0bcddbf0b2
--
-- ★★大事な こと
--   このファイルは BEGIN / ROLLBACK を ★使いません。
--   ★Supabase の SQL エディタは ROLLBACK を 効かせませんでした（2026-09-XX）。
--   ★見るだけの 第1部と、★書く 第2部を、★はっきり 分けています。
--   ★★第1部だけを 流して、★中身を 見てから、★第2部を 流してください。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ★第1部 ── 見るだけ。★1文字も 書きません。
-- ----------------------------------------------------------------------------

-- ①-1 対象の 口座が 存在するか。★いまの 札の 状態。
select
  p.id,
  p.display_name                       as お名前,
  coalesce(p.teacher_beta_access,false) as 先生ベータ,
  coalesce(p.is_admin,false)            as 管理者,
  p.deleted_at                          as 退会,
  u.email                               as メール
from public.profiles p
left join auth.users u on u.id = p.id
where p.id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
-- ★0行なら、★この id の 口座は ありません。★第2部を 流しても 何も 起きません。


-- ①-2 いま 先生ベータを 持っている 方の 一覧（★人数の 確認）。
select
  p.id,
  p.display_name as お名前,
  u.email        as メール
from public.profiles p
left join auth.users u on u.id = p.id
where coalesce(p.teacher_beta_access,false) = true
order by p.display_name nulls last;


-- ①-3 ★layoutV2 の 名簿に 入っているかは、★SQL では 分かりません。
--     ★環境変数は 台帳の 外に あります。
--     ★確かめ方は、下の「★門の 内か 外か」を ご覧ください。


-- ----------------------------------------------------------------------------
-- ★第2部 ── 書きます。★第1部で ①-1 が 1行 返ってから 流してください。
-- ----------------------------------------------------------------------------

update public.profiles
set teacher_beta_access = true
where id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
  and deleted_at is null;
-- ★deleted_at is null を 付けています。★退会された 口座に 札を 立てないため。


-- ----------------------------------------------------------------------------
-- ★第3部 ── 確かめ。★第2部の あとに 流してください。
-- ----------------------------------------------------------------------------

select
  p.id,
  coalesce(p.teacher_beta_access,false) as 先生ベータ,
  u.email                               as メール
from public.profiles p
left join auth.users u on u.id = p.id
where p.id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
-- ★先生ベータ が true に なっていれば、★済みです。


-- ============================================================================
-- ★戻したく なったとき
--
--   update public.profiles
--   set teacher_beta_access = false
--   where id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';
--
-- ★★この札は、★つながりを 消しません。
--   ★既に つながっている 生徒は、★札を 外しても 見えたままです
--   （lib/featureFlags.js の canSeeTeacherFeatures ── 共有を 解除する 手段まで
--     消えて しまわない ように、そう 決められています）。
-- ============================================================================

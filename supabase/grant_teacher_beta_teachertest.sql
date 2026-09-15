-- ============================================================================
-- 先生役の 試し口座に、★先生ベータの 札を 立てる（2026-09-15）
--
-- ★対象 kyo0703opera+teachertest@gmail.com
--        adcab9c5-c35c-423a-a71f-cb6c12b2efe0
--
-- ★★なぜ 要るか ── `lib/featureFlags.js:18` の `canSeeBetaFeatures` が、
--   ★「生徒を招待する（テスト機能）」の 節を 守って います。
--
-- ★★BEGIN / ROLLBACK は 使いません（★SQLエディタが 効かせない ため）。
-- ★★第1部は 見るだけ です。★第2部から 書きます。
--
-- ★★★先に すませて いただく こと（★これが 無いと 何も できません）
--   ★確認メール（kyo0703opera+teachertest@gmail.com 宛）の リンクを 押す。
--   ★★本番は `mailer_autoconfirm: false` です。★押すまで ログインできません。
--   ★★いま「Email not confirmed」で 弾かれる ことを 確かめて あります。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ★第1部 ── 見るだけ
-- ----------------------------------------------------------------------------

select
  u.id,
  u.email                                 as "メール",
  (u.email_confirmed_at is not null)      as "★確認済みか",
  coalesce(p.teacher_beta_access, false)  as "先生ベータ",
  coalesce(p.is_under_18::text, '(未回答)') as "18歳未満か",
  p.deleted_at                            as "退会"
from auth.users u
left join public.profiles p on p.id = u.id
where u.id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0';
-- ★★「確認済みか」が false の あいだは、★下を 流しても ログインできません。
-- ★★`profiles` の 行は、`handle_new_user` の 引き金が 作ります。
--   ★0行 なら、★まだ 引き金が 走って いません（★確認前の ことが あります）。


-- ----------------------------------------------------------------------------
-- ★第2部 ── 書きます
-- ----------------------------------------------------------------------------

update public.profiles
set teacher_beta_access = true
where id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0'
  and deleted_at is null;
-- ★退会した 行に 札を 立てない ため、★deleted_at を 見て います。


-- ----------------------------------------------------------------------------
-- ★第3部 ── 確かめ
-- ----------------------------------------------------------------------------

select
  u.email                                as "メール",
  coalesce(p.teacher_beta_access, false) as "先生ベータ"
from public.profiles p
join auth.users u on u.id = p.id
where p.id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0';
-- ★true に なって いれば 済みです。


-- ============================================================================
-- ★★門に **足さないで** ください
--
--   ★`NEXT_PUBLIC_LAYOUT_V2_USER_IDS` に この id を 入れると、
--   ★★下の 帯が 5つに なり、★レッスンの 札が 消えます。
--   ★★そうなると、★招待コードを 出す 道が 1本も 無く なります。
--     ★それが、★+forcode で 起きて いる ことです（★2026-09-15 に 実測）。
--
-- ★片づけ（★確かめが 済んだら）
--   update public.profiles set teacher_beta_access = false
--    where id = 'adcab9c5-c35c-423a-a71f-cb6c12b2efe0';
--   ★★札を 外しても、★できた つながりは 消えません（★lib/featureFlags.js の 決め）。
-- ============================================================================

-- ============================================================================
-- No.020 ② ── 使われて いない `accept_invitation` を 片づける（2026-09-15）
--
-- ★お裁き 坂本さん（2026-09-15）──「実機確認 完了。★片づけて よい」
--
-- ★★BEGIN / ROLLBACK は 使いません（★SQLエディタが 効かせない ため）。
-- ★★第1部は 見るだけ です。★第2部から 書きます。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ★なぜ 落として よいか（★記録は No.020 ② に あります）
--
--   ★① 倉庫の 紙に **1行も ありません**。★SQLエディタで 作られた もの です。
--   ★② 画面からの 呼び出しは **0件**。
--        ★呼ばれて いるのは `accept_teacher_invitation` だけ（VocalTracker.jsx:11281）。
--   ★③ 2026-09-15、★本物の ブラウザで 招待の 流れが 通りました。
--        ★先生 adcab9c5… → 生徒 f7520dc1… ／ コード PNJE7MJZ
--        ★teacher_student_links に 1行（active）。
--        ★teacher_invitations.used_at と accepted_at が **同じ 時刻**。
--        ★同じ コードの 2度目は 400 INVITATION_NOT_USABLE。
--
-- ★★★中身を 写して いません。
--   ★`accept_invitation` は、★未成年の 判定を **関数の 中**に 持って いました。
--   ★いまの 決めは「★引き金 1つ」です（`migration_block_minor_teacher_link.sql`）。
--   ★★写すと、★同じ 判断が 2か所に なります。★取ったのは 錠の 考え方 だけ です。
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- ★第1部 ── 落とす 前に、★もう一度 呼び手を 探す（★見るだけ）
--
--   ★★「たぶん 無い」で 落としません。★その 場で 数えます。
-- ----------------------------------------------------------------------------

-- ①-1 ★ほかの 関数の 中から 呼ばれて いないか
select p.proname as "呼ぶ 関数", p.prosecdef as "definer"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname <> 'accept_invitation'
   and p.prosrc like '%accept_invitation%';
-- ★★0行 で ある こと。

-- ①-2 ★決まりの 中から 呼ばれて いないか
select tablename as "表", policyname as "決まり", cmd as "何に"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%accept_invitation%';
-- ★★0行 で ある こと。

-- ①-3 ★引き金に 付いて いないか
select t.tgname as "引き金", c.relname as "表"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_proc  p on p.oid = t.tgfoid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and not t.tgisinternal
   and p.proname = 'accept_invitation';
-- ★★0行 で ある こと。
-- ★★★①-1〜①-3 の どれかに 行が 出たら、★**落とさないで ください**。
--   ★その 呼び手を 先に 直します。

-- ①-4 ★いま 在る こと と、★引数の 形
select p.proname as "関数",
       pg_get_function_identity_arguments(p.oid) as "引数",
       p.prosecdef as "definer",
       pg_get_userbyid(p.proowner) as "所有者"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'accept_invitation';
-- ★★1行 出る はず です。★引数が `text` で あることを 見て ください。


-- ----------------------------------------------------------------------------
-- ★第2部 ── 落とす
--
--   ★★引数まで 書きます。★書かないと、★同じ 名前の 別の 関数を
--     ★巻き添えに する ことが あります。
-- ----------------------------------------------------------------------------

drop function if exists public.accept_invitation(text);


-- ----------------------------------------------------------------------------
-- ★第3部 ── 確かめ（★見るだけ）
-- ----------------------------------------------------------------------------

-- ③-1 ★消えた こと
select count(*) as "残り"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'accept_invitation';
-- ★★0 で ある こと。

-- ③-2 ★**生きて いる ほう**が、★無事で ある こと
select p.proname as "関数",
       pg_get_function_identity_arguments(p.oid) as "引数",
       p.prosecdef as "definer"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'accept_teacher_invitation';
-- ★★1行 出る こと。★これが 画面の 使う ほう です。
-- ★★消して しまって いないか、★必ず ここで 見て ください。


-- ============================================================================
-- ★落とした あと、★1度 叩いて 確かめる（★画面でも、REST でも）
--
--   ★ありもしない コードで `accept_teacher_invitation` を 呼び、
--   ★`INVITATION_NOT_USABLE` が 返る こと。
--   ★★返れば、★生きて いる ほうは 無事 です。
-- ============================================================================

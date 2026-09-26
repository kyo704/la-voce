-- 20260924_77 C群を 作るための 仕上げ（★台帳は ほぼ 揃っていました）
-- 確かめた結果（2026-09-24・本番）:
--   ★C群39画面が 使う 表 29 → ★29とも あります
--   ★関数 24本（画面から 呼ぶもの）→ ★24とも あります
--   ★書けない2表（koen_kid_contacts・export_log）→ ★関数経由が 正しい形（set_kid_contact・record_export）
--   ★保護者は 連絡先を 見た記録を 読める（★ポリシーに 入っていました。私の 早合点）
-- ★残っていたのは ★1つだけ でした（下の ①）
-- ★65・76 のあと

-- ① ★公演の 運営が「連絡先を 見た記録」を 読めない
--    いまの ポリシー: ★保護者 ＝ 読める／★自分が 見た分 ＝ 読める
--    ★足りないもの: ★運営（koen_can_manage）が ★その公演の ぶんを 読む
--    ★裁定194 §2 で「★公演の運営と その子の保護者」と 決めました
drop policy if exists koen_kid_reads_select on public.koen_kid_contact_reads;
create policy koen_kid_reads_select on public.koen_kid_contact_reads for select to authenticated
  using (
    exists (select 1 from public.koen_kids k
             where k.id = koen_kid_contact_reads.kid_id and k.guardian_user_id = auth.uid())
    or viewer_user_id = auth.uid()
    or public.koen_can_manage(koen_kid_contact_reads.koen_id)   -- ★足した
  );

-- ② ★記事の「読んだ印」── ★作りません（★2026-09-24 に 考え直しました）
--   ★はじめ mark_article_read を 書こうとしました。★誤りでした
--   ★本番の article_progress は ★復習のための 箱です
--     列: user_id, article_id, box, next_due_at, last_answered_at
--     ★「読んだ印」では なく、★間隔をあけて 復習する 仕組み（box 方式）
--   ★そして ★「読んだ本数」を 数える表は ★どこにも ありません
--     → ★これは ★抜けでは なく ★決めごと です
--     ★読んだ本数を 出すと、★それ自体が 点数に なります（裁定119 の 考え）
--   ★C群の「記事」「もっと深く」「深い記事」は ★読むだけの 画面で よい
--     ★article_notes（書き込み）だけ 使います

-- 確かめ（★試しの環境で ★実際に 当てて 試しました・2026-09-24）
-- ★はじめ ★ポリシーの式を 真似た 関数で 試していました。★本物では ありません
--   → ★本物の ポリシーを 当てて、★利用者に なりきって（set_config で jwt を 差し替え）
--      ★読みました。★8項目 すべて 期待どおり:
--   ①保護者=1 ②見た本人=1 ★③その公演の運営=1（★足した分）★④よその公演の人=0
--   ★⑤未認証（anon）=エラー
--   ★⑥保護者が 消そうとする=permission denied（★消す ポリシーが 無い）
--   ★⑦消えていない=1行 残る
--   ★⑧運営が 直に 書く=permission denied（★書くのは 関数だけ）
-- ★記事は 読むだけ。★読んだ本数を 返す関数は ★ありません（★作りません）

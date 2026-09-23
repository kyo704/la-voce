-- ★★★Opus の sql/24 の ⑤ だけ。★**まだ 当てて いません**。
--   ★前提 …… ① 本番に record_export が ある こと（sql/06）
--            ② org_billing_log を 画面から 直に 書かなく する こと
--   ★いま どちらも 揃って いません。★揃ってから 当てます。

-- ⑤ 記録の表への直接の書き込みを閉じる（裁定161 FX8。★06 の record_export を当ててから）
--    2026-09-23 に本番で確かめた「まだ開いている所」
drop policy if exists post_change_log_insert  on public.post_change_log;
drop policy if exists org_billing_log_insert  on public.org_billing_log;
drop policy if exists export_log_insert       on public.export_log;
revoke insert, update, delete, truncate on public.post_change_log, public.org_billing_log, public.export_log from anon, authenticated;
-- 記録ではないが、同じ形で開いていた表
revoke insert, update, delete, truncate on public.koen_session_changes from anon, authenticated;   -- 履歴は引き金だけが書く
revoke insert, update, delete, truncate on public.cohort_changes        from anon, authenticated;   -- ポリシーが無く、書ける権限だけ残っていた

-- 確かめ（実在の試しの利用者で）
-- 画面から役職を変える → post_change_log に person で「誰が」が残る
-- サーバが set_config('app.actor_id', <id>, true) のあとに変える → 同じく person
-- サーバが入れ忘れ → system・null（処理は通る）
-- 画面が app.actor_id に他人の id を入れる → 記録は auth.uid() の本人（偽れない）
-- 3つの記録の表に画面から insert → 権限エラー
-- koen_session_changes・cohort_changes に画面から insert → 権限エラー

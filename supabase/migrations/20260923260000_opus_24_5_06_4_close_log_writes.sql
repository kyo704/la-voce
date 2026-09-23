-- ★★★記録の 表への「画面からの 書き込み」を 閉じます
--   （★Opus の sql/24 ⑤ ＝ sql/06 ④ の 上位・2026-09-23）。
--
--   ★★前提は そろいました ──
--     ① `record_export` が 本番に あります（sql/34 ④・2026-09-23）
--     ② 画面の 直の 書き込みを 外しました（★お決め「A 承認」）──
--          app/api/org/posts/route.js:79（post_change_log）
--          components/VocalTracker.jsx:12222（org_billing_log）
--     ③ 台帳の 引き金が 書きます ──
--          memberships_log_post_change ／ org_billing_log_change
--   ★★★試しの 台帳で、★引き金が 書く ことを 確かめて あります。
--     ★本番の 行は、★次に どなたかが 役職や ご請求の 宛先を 変えた ときに 増えます。
--       ★★確かめの ために 偽の 変更を 作る ことは しません（★記録は 消せません）。
--
--   ★★読む 道（select）は 残します。★画面は いまも 記録を 読みます
--     （components/VocalTracker.jsx:12110）。

drop policy if exists post_change_log_insert  on public.post_change_log;
drop policy if exists org_billing_log_insert  on public.org_billing_log;
drop policy if exists export_log_insert       on public.export_log;
revoke insert, update, delete, truncate on public.post_change_log, public.org_billing_log, public.export_log from anon, authenticated;
-- 記録ではないが、同じ形で開いていた表
revoke insert, update, delete, truncate on public.koen_session_changes from anon, authenticated;   -- 履歴は引き金だけが書く
revoke insert, update, delete, truncate on public.cohort_changes        from anon, authenticated;   -- ポリシーが無く、書ける権限だけ残っていた

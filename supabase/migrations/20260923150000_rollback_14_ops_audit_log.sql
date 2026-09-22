-- ★sql/14（管理の 操作の 記録）を 戻します（2026-09-23）
--
--   ★★★わけ …… ★**学校を 消せなく なりました**。
--     `delete from organizations`
--       → 連鎖で `org_events` などが 消える
--         → `*_audit` の 引き金が 動く
--           → `ops_audit_log` に 入れようと する。★その 学校は もう 無い
--             → `ops_audit_log_org_id_fkey` に 当たって 落ちる
--     ★★`closeOrg`（教室を 閉じる）も 止まりました。
--     ★★★坂本さんの ご承認 …… 「今すぐ sql/14 を 戻してください」。
--
--   ★★直した ものを Opus から いただいたら、★もう 一度 当てます。
--   ★★何度 流しても 同じに なります。

begin;

drop trigger if exists enrollments_audit      on public.enrollments;
drop trigger if exists lesson_rounds_audit    on public.lesson_rounds;
drop trigger if exists memberships_audit      on public.memberships;
drop trigger if exists org_billing_audit      on public.org_billing;
drop trigger if exists org_events_audit       on public.org_events;
drop trigger if exists org_invitations_audit  on public.org_invitations;
drop trigger if exists org_places_audit       on public.org_places;
drop trigger if exists org_posts_audit        on public.org_posts;

drop function if exists public.audit_row();
drop function if exists public.purge_ops_audit_log(integer);

-- ★★表も 消します。★本番の 行は 0 でした（2026-09-23 に 数えました）。
drop table if exists public.ops_audit_log;

commit;

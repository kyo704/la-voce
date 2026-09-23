-- 20260922_09 org_message_reads を消す（裁定159 §8。開いた記録は monka_read_log の1本）
-- ★CHECK_FIRST: リポジトリに org_message_reads の呼び出しが0件であること（grep）。本番の行数 0（2026-09-22）
drop table if exists public.org_message_reads;

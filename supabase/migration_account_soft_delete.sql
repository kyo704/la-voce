-- ============================================================================
-- La Voce: アカウント削除の猶予期間（作業指示-公開前の実装.md A-4）
--
-- Supabase の SQL Editor で実行してください（何度実行しても安全です）。
--
-- A-4 の要件:
--   ・30日間は復元できる（誤操作の救済）
--   ・30日後に物理削除
--   ・教室の側から見えなくなるのは即時。30日待たない
--
-- deleted_at が入っている間は「削除申請済み」。ログインすると復元を尋ねます。
-- 30日を過ぎたものは /api/cron/purge-deleted が物理削除します。
-- ============================================================================

alter table public.profiles
  add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  '削除申請の日時。30日間は復元可能。過ぎたら cron が物理削除する。共有は申請時点で即座に切れる。';

-- 猶予期間の対象を定期処理が引くので、索引を張っておく。
create index if not exists profiles_deleted_at_idx
  on public.profiles (deleted_at)
  where deleted_at is not null;

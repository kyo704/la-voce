-- ============================================================================
-- La Voce: かんたん記録／しっかり記録の切り替えを保存する列
--
-- Supabase の SQL Editor で実行してください（何度実行しても安全です）。
--
-- 統合実行ルートv4 G2-8 / 改善タスクv2 P1-1。
-- 「30秒で終わる道が常にある」（v4 §2 瞬間④）を実現するための設定で、
-- 端末ではなく本人に紐づくべきものなので profiles に持たせます。
--
-- 既定は 'full'（しっかり記録）。既存ユーザーの見え方は変わりません。
-- ============================================================================

alter table public.profiles
  add column if not exists record_mode text not null default 'full';

-- 想定外の値が入らないようにする（'simple' | 'full' のみ）。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_record_mode_check'
  ) then
    alter table public.profiles
      add constraint profiles_record_mode_check check (record_mode in ('simple', 'full'));
  end if;
end $$;

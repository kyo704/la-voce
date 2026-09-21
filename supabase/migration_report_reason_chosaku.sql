-- ============================================================================
-- 通報の種類に「著作権・実演家の権利」を足す（裁定157 T6・2026-09-21）
--
--   なぜ
--     公開ページに本番の録画（YouTube の URL）を埋められるようにします。
--     権利者から申し立てがあったとき、受け取る口が要ります。
--     受け取る口が無いと、申し立ては別の道（メール・法的手続き）で来ます。
--
--   足すだけです。6つは1つも減らしません。
--     既にある行はどれも触りません。
--
--   何度流しても同じです。
-- ============================================================================

alter table public.matching_reports
  drop constraint if exists matching_reports_reason_check;

alter table public.matching_reports
  add constraint matching_reports_reason_check check (reason in (
    'shitsukoku', 'kankei_nai_hanashi', 'hoka_de_renraku',
    'okane', 'kowai',
    -- ★2026-09-21 に足しました（裁定157 T6）。
    'chosakuken',
    'sonohoka'));

comment on constraint matching_reports_reason_check on public.matching_reports is
  '通報の種類。7つ。chosakuken は著作権・実演家の権利（裁定157 T6・2026-09-21 に追加）。';

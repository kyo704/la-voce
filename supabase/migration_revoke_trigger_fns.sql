-- ★引き金の 関数から `execute` を 取り上げます（★道具が 書きました）。
-- ★引き金から 呼ぶ ぶんには 要りません。
-- ★直に 呼んでも「trigger functions can only be called as triggers」で 止まります。

revoke all on function public.assert_student_is_adult() from public, anon, authenticated;
revoke all on function public.evaluation_scores_guard() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

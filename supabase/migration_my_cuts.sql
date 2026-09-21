-- ============================================================================
-- La Voce / Woolsong ── ★見えなくした 方の 一覧（★見本 `SC['伴奏をさがす']` の 節）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ 関数に するか（★裁定 その122）
--   ★★画面は `matching_cuts` を 直に 引きません。
--   ★★お名前が 要ります。★`profiles` との 突き合わせが 要ります。
--     ★★画面で 2つ 引いて 繋ぐと、★「誰の 名を 引いてよいか」が 画面の 判断に なります。
--   ★★★ここで 返すのは、★**自分が 切った 相手** の 名 だけ です。
--
-- ★★★切った ことは、★ご本人 だけの ものです（★裁定 その94 §5）。
--   ★★相手にも 運営にも、★この 道は ありません。
-- ============================================================================

create or replace function public.get_my_cuts()
returns table (
  target_user_id uuid,
  display_name text,
  kind text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select c.target_user_id, pr.display_name, c.kind, c.created_at
  from public.matching_cuts c
  join public.profiles pr on pr.id = c.target_user_id
  where c.user_id = auth.uid()
  order by c.created_at desc
$$;

revoke all on function public.get_my_cuts() from public, anon;
grant execute on function public.get_my_cuts() to authenticated;

comment on function public.get_my_cuts() is
  '★自分が 切った 相手の 一覧（★見本「見えなくした 方」）。'
  '★ご本人 だけ。★相手にも 運営にも 道は ありません。';

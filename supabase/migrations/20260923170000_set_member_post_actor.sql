-- ★役職を 変える 道（★裁定173 の 形で・2026-09-23）
--
--   ★★★裁定173 は こう 書いて います ──
--     「サーバは、★利用者の 処理を 始める ときに 1行 入れる
--        select set_config('app.actor_id', <id>, true);」
--
--   ★★★ところが、★**それでは 残りません**（★2026-09-23 に 確かめました）。
--     ★`supabase-js`（PostgREST）は、★1つの 呼びを **1つの 取引** で 走らせます。
--     ★★`set_config(…, true)` は その 取引の 中だけ です。
--     ★★★別の 呼びで `update` を すると、★印は もう 消えて います。
--
--     ★試しの 台帳で 並べました ──
--       別々の 呼び …… changed_by = ★null
--       同じ 取引 ……… changed_by = ★残る
--
--   ★★だから、★**2つを 1つの 関数に 入れます**。
--     ★★裁定173 の `actor_id()` は そのまま 使います。★仕組みは 変えて いません。
--     ★★変えたのは「どこで 印を 置くか」だけ です。

begin;

create or replace function public.set_member_post(
  p_org_id uuid, p_user_id uuid, p_post_id uuid, p_actor uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_done boolean;
begin
  -- ★★「誰が」を 入れ忘れた 処理は 通しません。
  --   ★★裁定173 は「入れ忘れた 処理は 'system' として 残る」と 書いて います。
  --     ★★けれど 役職の 変更は、★誰が やったか 分からないと 意味が ありません（★同じ 裁定）。
  --     ★★★だから ここでは **断ります**。★`system` に しません。
  if p_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  if p_org_id is null or p_user_id is null then raise exception 'BAD_ARGS'; end if;

  -- ★★この 取引の 中だけ の 印。★次の 呼びに 残りません。
  perform set_config('app.actor_id', p_actor::text, true);

  update public.memberships set post_id = p_post_id
   where org_id = p_org_id and user_id = p_user_id;
  get diagnostics v_done = row_count;
  return v_done;
end $$;

-- ★★サーバ（service_role）だけ が 呼びます。★画面からは 呼べません。
--   ★★`p_actor` を 画面から 渡せると、★誰にでも なりすませます。
revoke all on function public.set_member_post(uuid, uuid, uuid, uuid)
  from public, anon, authenticated;

commit;

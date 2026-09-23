-- ★★★Opus の sql/34 の ③ だけ。★**まだ 当てて いません**。
--   ★わけ …… ★ひな型を 作った 方が、★自分に「学長」を 付けられなく なります
--            （★試しの 台帳で 確かめました → NO_POST_PERM）。
--   ★お返しの 中身は docs/reports/2026-09-23-sql34.md に 書きました。

-- ③ set_member_post を 作り直す（★戻り値は boolean）
--   ※2026-09-23 に本番を確認: 当たっている関数は すでに boolean を返す形だった（Code の直しが入っている）。
--     ここでは BUG1（can_grant_post）と 印の置き方を そろえるために 作り直す。引数の形は同じ
drop function if exists public.set_member_post(uuid, uuid, uuid, uuid);
create or replace function public.set_member_post(
  p_org_id  uuid,
  p_user_id uuid,
  p_post_id uuid,
  p_actor   uuid default null
)
returns boolean                       -- ★成功なら true だけを返す。失敗は例外（画面は done !== true のままでよい）
language plpgsql security definer set search_path to 'public' as $$
declare
  v_actor uuid;
  v_target_role text;
  v_from_post uuid;
begin
  v_actor := coalesce(auth.uid(), p_actor);      -- ★画面からの操作は auth.uid() が勝つ（偽れない）
  if v_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  perform set_config('app.actor_id', v_actor::text, true);   -- ★同じ取引の中で印を置く

  if not public.has_can_user(v_actor, p_org_id, 'post') then raise exception 'NO_POST_PERM'; end if;

  select m.role, m.post_id into v_target_role, v_from_post
    from public.memberships m where m.org_id = p_org_id and m.user_id = p_user_id;
  if v_target_role is null then raise exception 'NOT_A_MEMBER'; end if;
  if v_target_role = 'owner' then raise exception 'CANNOT_CHANGE_OWNER'; end if;

  -- ★BUG1 の直し: 渡す人（v_actor）で判定する
  if not public.can_grant_post_user(v_actor, p_org_id, p_post_id) then
    raise exception 'CANNOT_GRANT_WIDER_THAN_SELF';
  end if;

  if v_from_post is not distinct from p_post_id then
    return true;                       -- ★変わらないときも true（画面は「済み」と読める）
  end if;
  update public.memberships m set post_id = p_post_id
   where m.org_id = p_org_id and m.user_id = p_user_id;
  return true;                         -- 記録は引き金が書く（ここでは書かない）
end $$;
revoke all on function public.set_member_post(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.set_member_post(uuid, uuid, uuid, uuid) to authenticated;


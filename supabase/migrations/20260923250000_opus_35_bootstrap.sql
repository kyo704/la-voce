-- ★★★Opus の sql/35 の ①② だけ（★2026-09-23）。
--
--   ★★★③（log_post_change の 差し替え）は **入れて いません**。
--     ★いま 本番に ある 形（sql/24 ②）は、★`changed_by_kind` も 書きます ──
--       case when v_actor is null then 'system' else 'person' end
--     ★★sql/35 ③ の insert に、★その 列が ありません。
--       ★`changed_by_kind` は 空を 許し、★既定も ありません（★本番で 数えました）。
--       ★★★だから 入れると **null** に なり、★「人が やった」「サーバが やった」の
--         ★見分けが 消えます。
--     ★お答え B（actor_id() を 使ってよい）は、★すでに 入って います。★変える 必要が ありません。
--
--   ★★★④「いま やらない こと」は、★もう 済んで います（★お決め「A 承認」・2026-09-23）──
--     ★route.js:79 と VocalTracker.jsx:12222 の 直の 書き込みを 外しました
--     ★引き金 memberships_log_post_change ／ org_billing_log_change を 付けました
--     ★★だから 二重には なりません。
--
--   ★①② は Opus の 字の まま です。★変えて いません。

-- ① 学校を立ち上げている最中か（★作った人が、自分に最初の役職を付けるときだけ true）
create or replace function public.is_org_bootstrap(p_actor uuid, p_org_id uuid, p_target uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select p_actor = p_target                                   -- ★自分に付けるときだけ
     and exists (select 1 from public.organizations o
                  where o.id = p_org_id and o.created_by = p_actor)   -- 作った本人
     and not exists (select 1 from public.memberships m
                      where m.org_id = p_org_id and m.post_id is not null);  -- ★まだ誰も役職を持っていない
$$;
revoke all on function public.is_org_bootstrap(uuid, uuid, uuid) from public, anon, authenticated;

-- ② set_member_post（引数と戻り値は いまの本番と同じ。中身だけ足す）
create or replace function public.set_member_post(
  p_org_id  uuid,
  p_user_id uuid,
  p_post_id uuid,
  p_actor   uuid default null
)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare
  v_actor uuid;
  v_target_role text;
  v_boot boolean;
  v_done boolean;
begin
  -- 「誰が」を入れ忘れた処理は通さない（役職の変更は、誰がやったか分からないと意味がない）
  v_actor := coalesce(auth.uid(), p_actor);
  if v_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  if p_org_id is null or p_user_id is null then raise exception 'BAD_ARGS'; end if;
  perform set_config('app.actor_id', v_actor::text, true);   -- ★同じ取引の中で印を置く

  v_boot := public.is_org_bootstrap(v_actor, p_org_id, p_user_id);

  -- ★立ち上げの最中は、下の2つを飛ばす（2026-09-11 の直しを打ち消さないため）
  if not v_boot then
    if not public.has_can_user(v_actor, p_org_id, 'post') then raise exception 'NO_POST_PERM'; end if;

    select m.role into v_target_role from public.memberships m
     where m.org_id = p_org_id and m.user_id = p_user_id;
    if v_target_role is null then raise exception 'NOT_A_MEMBER'; end if;
    if v_target_role = 'owner' and v_actor <> p_user_id then raise exception 'CANNOT_CHANGE_OWNER'; end if;

    -- 自分が持っていない「学校ぜんぶにかかること」は渡せない（★渡す人で判定する）
    if not public.can_grant_post_user(v_actor, p_org_id, p_post_id) then
      raise exception 'CANNOT_GRANT_WIDER_THAN_SELF';
    end if;
  end if;

  update public.memberships set post_id = p_post_id
   where org_id = p_org_id and user_id = p_user_id;
  get diagnostics v_done = row_count;
  return v_done;                    -- ★いまの本番と同じ（行が無ければ false）
end $$;
revoke all on function public.set_member_post(uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.set_member_post(uuid, uuid, uuid, uuid) to service_role;
-- ★authenticated には渡さない（いまと同じ。守りは画面側＋この関数の二重）


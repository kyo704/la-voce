-- 20260923_32 役職を変える関数（裁定173。★24 を当てたあとに当てる）
-- 背景: 画面（app/api/org/posts/route.js の3か所）は set_member_post を呼ぶ形に変わっているが、
--       本番に この関数が無い（2026-09-23 Opus 確認）→ ★役職の変更が止まっている可能性がある
-- 要点: 印（app.actor_id）は ★同じ取引の中で置く。サーバから別の呼び出しで置くと消える（裁定173 の訂正）

-- ★24（actor_id）が無いと、この下は意味をなさないので先に確かめて止める
do $$
begin
  if to_regprocedure('public.actor_id()') is null then
    raise exception 'NEED_24: 先に sql/24（actor_id）を当ててください';
  end if;
end $$;

create or replace function public.set_member_post(
  p_org_id  uuid,
  p_user_id uuid,
  p_post_id uuid,          -- null にすると 役職を外す
  p_actor   uuid default null   -- サーバが「誰の操作か」を渡す。画面から直接呼ぶときは null でよい
)
returns table(ok boolean, reason text)
language plpgsql security definer set search_path to 'public' as $$
declare
  v_actor uuid;
  v_target_role text;
  v_from_post uuid;
begin
  -- ① 「誰の操作か」を決める（★画面からの操作は auth.uid() が勝つ。偽れない）
  v_actor := coalesce(auth.uid(), p_actor);
  if v_actor is null then
    return query select false, 'NOT_AUTHENTICATED'; return;
  end if;
  -- ★同じ取引の中で 印を置く。これで引き金（log_post_change）が「誰が」を残せる
  perform set_config('app.actor_id', v_actor::text, true);

  -- ② 変える人に 役職を渡す権限があるか
  if not public.has_can_user(v_actor, p_org_id, 'post') then
    return query select false, 'NO_POST_PERM'; return;
  end if;

  -- ③ 相手が その学校にいるか
  select m.role, m.post_id into v_target_role, v_from_post
    from public.memberships m where m.org_id = p_org_id and m.user_id = p_user_id;
  if v_target_role is null then
    return query select false, 'NOT_A_MEMBER'; return;
  end if;

  -- ④ 持ち主（owner）の役職は、この関数では変えない（契約者の移し替えは別の関数）
  if v_target_role = 'owner' then
    return query select false, 'CANNOT_CHANGE_OWNER'; return;
  end if;

  -- ⑤ ★自分が持っていない「学校ぜんぶにかかること」は渡せない（裁定その19・既存の can_grant_post と同じ考え）
  if not public.can_grant_post(p_org_id, p_post_id) then
    return query select false, 'CANNOT_GRANT_WIDER_THAN_SELF'; return;
  end if;

  -- ⑥ 変える（変わらないなら何もしない＝記録も増やさない）
  if v_from_post is not distinct from p_post_id then
    return query select true, 'NO_CHANGE'; return;
  end if;
  update public.memberships m set post_id = p_post_id
   where m.org_id = p_org_id and m.user_id = p_user_id;
  -- ★記録は 引き金（memberships_log_post_change）が書く。ここでは書かない（二重に残さない）

  return query select true, ''::text;
end $$;
revoke all on function public.set_member_post(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.set_member_post(uuid, uuid, uuid, uuid) to authenticated;
-- service_role は既定で実行できる（サーバから呼ぶときは p_actor に本人の id を渡す）

-- 確かめ（実在の試しの利用者で）
-- post を持つ事務が、先生の役職を変える → ok。post_change_log に1行（changed_by＝その事務・種類 person）
-- サーバから p_actor を渡して呼ぶ → 同じく person で残る
-- post を持たない人が呼ぶ → NO_POST_PERM
-- 学校にいない人を指す → NOT_A_MEMBER
-- 持ち主（owner）を指す → CANNOT_CHANGE_OWNER
-- 自分が持っていない「学校ぜんぶにかかること」を含む役職を渡す → CANNOT_GRANT_WIDER_THAN_SELF
-- 同じ役職をもう一度渡す → NO_CHANGE（記録が増えない）
-- ★画面が 引数の名前・順番・返す値をこの形で呼んでいるか、Code が確かめる
--   （違えば 名前だけ直すか、Opus に返す。中身の考え方は変えない）

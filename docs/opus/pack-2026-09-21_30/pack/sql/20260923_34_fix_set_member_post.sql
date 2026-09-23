-- 20260923_34 set_member_post の直し2件 ＋ 記録の表の NOT NULL ＋ record_export
-- Code が本番で見つけたもの（2026-09-23）:
--   BUG1 事務長が課長に役職を渡せない。can_grant_post の中の has_can が auth.uid() を見るため、
--        サーバ（service role）から呼ぶと null になり、正しく判定されない
--   BUG2 ★戻り値の形。PostgREST は [{"ok":true,...}] を返すが、画面は done !== true で見ている
--        → 成功しても 画面は失敗と読む（逆向きの重大な不具合）
--   BUG3 sql/24 の引き金が changed_by = null を書こうとするが、その列は NOT NULL（23502 で役職の変更ごと止まる）
--   ほか  record_export が本番に無い（画面から呼ばれている）→ 書き出しが失敗している可能性

-- ① 「誰が」を引数で受ける形の can_grant_post（既存のものは残す。画面から使うのはそのまま）
create or replace function public.can_grant_post_user(p_user_id uuid, p_org_id uuid, p_post_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select case
    when p_post_id is null then true
    else not exists (
      select 1
      from public.org_posts t
      cross join lateral jsonb_object_keys(t.perms) as k(perm)
      where t.id = p_post_id
        and t.org_id = p_org_id
        and (t.perms -> k.perm)::text = 'true'
        and k.perm = any (public.school_wide_perms())
        and not public.has_can_user(p_user_id, p_org_id, k.perm)   -- ★auth.uid() ではなく 渡された人で見る
    )
  end;
$$;
revoke all on function public.can_grant_post_user(uuid, uuid, uuid) from public, anon;
grant execute on function public.can_grant_post_user(uuid, uuid, uuid) to authenticated;

-- ② 記録の列を 空にできるようにする（BUG3。sql/06 の一部を先に出す。何度当ててもよい）
alter table public.post_change_log alter column changed_by     drop not null;
alter table public.post_change_log alter column target_user_id drop not null;

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

-- ④ record_export（本番に無い。画面から呼ばれている）。★閉じる作業（sql/06 ④）はしない
create or replace function public.record_export(p_org_id uuid, p_what text, p_rows integer)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.memberships m where m.org_id = p_org_id and m.user_id = auth.uid()) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_what is null or btrim(p_what) = '' or p_rows is null or p_rows < 0 then raise exception 'BAD_ARGS'; end if;
  insert into public.export_log(org_id, user_id, what, rows, created_at)
  values (p_org_id, auth.uid(), left(p_what, 200), p_rows, now());
end $$;
revoke all on function public.record_export(uuid, text, integer) from public, anon;
grant execute on function public.record_export(uuid, text, integer) to authenticated;

-- ⑤ ★いま閉じないもの（Code の指摘のとおり）
--   org_billing_log・post_change_log・export_log への 画面からの insert を閉じるのは sql/06 ④。
--   いま閉じると、契約者の引き継ぎ（画面から org_billing_log に直接書いている）が壊れる。
--   ★順番: 画面を record_export と引き金に移す → そのあとで 06 ④ を当てる

-- ★本番で確かめた前提（2026-09-23 Opus）:
--   school_wide_perms は bill・bill_pay・meibo・sched_all・gyoji・renraku_all・monka_read・master・post・koma の10個
--   has_can_user(uuid,uuid,text) は実在／org_posts.perms は jsonb／export_log の列は id・org_id・user_id・what・rows・created_at

-- 確かめ（実在の試しの利用者で）
-- 事務長が課長に役職を渡す → ★true（BUG1 の場）。post_change_log に1行（誰が・person）
-- サーバから p_actor を渡す → 同じく true
-- 役職の札を持たない人 → NO_POST_PERM（例外）
-- 持ち主（owner）を指す → CANNOT_CHANGE_OWNER
-- 自分が持っていない「学校ぜんぶにかかること」を渡す → CANNOT_GRANT_WIDER_THAN_SELF
-- 同じ役職をもう一度 → true（画面は「済み」と読む）
-- ★画面の done !== true の判定が、そのまま使えること（成功で true・失敗で例外）
-- record_export: 学校の人が呼ぶ → export_log に1行／学校の外の人 → NOT_A_MEMBER

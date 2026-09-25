-- 20260923_35 set_member_post の作り直し（2026-09-11 の直しを打ち消さない形）＋ log_post_change を actor_id() に
-- Code の指摘（2026-09-23）:
--   ★34③ をそのまま当てると、「自分に学長を付ける」が NO_POST_PERM で失敗する
--     （学校を作った直後、作った人はまだ役職を持っていない＝鶏と卵）
--   ★06① は log_post_change を auth.uid() に戻してしまう（裁定173 の直しが消える）
-- 本番で確かめた前提（2026-09-23 Opus）:
--   set_member_post を実行できるのは ★service_role だけ（authenticated・anon は false）
--   → 守りは画面（サーバ）側にある。ここでの確かめは ★二重の備え（万一サーバが間違えたときに止める）
--   役職を1つも持たない学校が1つある（作りかけ）。持ち主（owner）で役職が空の行が1つある

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

-- ③ 記録の引き金を actor_id() に（★06① の差し替え。auth.uid() に戻さない）
--   Code の問い B への答え: ★はい、actor_id() を使ってください（裁定173）
create or replace function public.log_post_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_actor uuid := public.actor_id();
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  insert into public.post_change_log(org_id, target_user_id, from_post_id, from_post_name,
                                     to_post_id, to_post_name, changed_at, changed_by)
  values (new.org_id, new.user_id,
          old.post_id, (select name from public.org_posts where id = old.post_id),
          new.post_id, (select name from public.org_posts where id = new.post_id),
          now(), v_actor);
  return new;
end $$;
revoke all on function public.log_post_change() from public, anon, authenticated;
-- ★引き金を実際に付けるのは、画面の直接 insert を止めたあと（下の「いまやらないこと」）

-- ④ ★いまやらないこと（Code の A の承認が出てから）
--   ・memberships への引き金を付ける（route.js:79 が今も直接 insert しているので、付けると ★二重の記録になる）
--   ・org_billing_log の引き金（VocalTracker.jsx:12222 が直接書いている）
--   ・sql/06 ④（画面からの insert を閉じる）→ 契約者の引き継ぎが壊れる
--   順番: 画面の2か所を 関数・引き金の経路に移す → 引き金を付ける → 閉じる

-- 確かめ（試しの環境で）
-- ★立ち上げ: 学校を作った人が、自分に学長を付ける → 通る（NO_POST_PERM にならない）
--   その学校に すでに誰かの役職がある → 立ち上げ扱いにならない（ふつうの確かめが働く）
--   他人に付けようとする → 立ち上げ扱いにならない
-- ふつう: 事務長が課長に付ける → 通る／役職の札が無い人 → NO_POST_PERM
--   自分が持っていない「学校ぜんぶにかかること」を渡す → CANNOT_GRANT_WIDER_THAN_SELF
--   持ち主（owner）を他人が変える → CANNOT_CHANGE_OWNER（★自分自身なら通る＝立ち上げの続き）
-- 記録: 引き金を付けた試し環境で、post_change_log の changed_by に ★その人が入る（null にならない）

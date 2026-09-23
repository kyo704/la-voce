-- ★★★Opus の sql/34 の ①②④（★2026-09-23）。
--
--   ★★★③（set_member_post の 作り直し）は **入れて いません**。
--     ★試しの 台帳で 動かして、★行き止まりが 1つ 戻る ことを 確かめました ──
--
--       「★自分に 学長を 付ける（route.js:166）」 → ★断り NO_POST_PERM
--
--     ★★③ は `has_can_user(v_actor, org, 'post')` を 求めます。
--       ★`has_can_user` は「役職を 持ち、★その 役職に その できことが ある」を 見ます。
--       ★★ひな型を 作った その方は、★まだ 役職を 持って いません。
--       ★★★だから、★自分に「学長」を 付けられません。
--
--     ★これは、★2026-09-11 に 直した 行き止まりと 同じ もの です
--       （app/api/org/posts/route.js:149-157 の 註）──
--       「★新しい 学校が、★誰も 学長の いない まま 始まっていました」
--
--     ★★route.js:166 は 断られても 止まりません（`if (!e2)`）。
--       ★★役職 10本は できます。★けれど 誰も 名乗れません。★黙って そう なります。
--
--   ★★★直して いません。★Opus に お返しします。
--     ★③ は supabase/pending/opus_34_3_set_member_post.sql に 置きました。
--
--   ★①②④ は Opus の 字の まま です。★変えて いません。

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


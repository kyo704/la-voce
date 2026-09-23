-- ★試作 ── 役職を 変えた「誰が」を 残す（★sql/06 ① の 問い・㋑の 形）
--   ★★★試しの 台帳だけ。★本番には 当てません。
--
--   ★問い …… 役職を 変える 道は ぜんぶ `service_role` です。
--     ★引き金の 中の `auth.uid()` は **null** に なります。
--     ★★裁定160 の「誰が・いつ・何を」の「誰が」が 消えます。
--
--   ★㋑の 形 …… サーバが「いま 誰が している か」を 置き、★引き金が それを 読む。
--     ★★置き場は `set_config('app.actor', …, true)`（★その 取引の 中だけ）。
--
--   ★★★ところが ── ★PostgREST は 1つの 呼びを 1つの 取引で 走らせます。
--     ★`supabase.from(...).update(...)` の 前に `set_config` を 置く 道が ありません。
--     ★★だから、★**2つを 1つの 関数に 入れる** ことに なります。
--     ★★★つまり ㋑は、★「関数が 両方 する」形に 行き着きます。

begin;

create or replace function public.log_post_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_actor uuid;
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  -- ★★`auth.uid()` が あれば それ。★無ければ サーバが 置いた 印。
  --   ★★`current_setting(…, true)` …… ★無くても 落ちません（★第2引数が true）。
  v_actor := coalesce(auth.uid(), nullif(current_setting('app.actor', true), '')::uuid);
  insert into public.post_change_log(org_id, target_user_id, from_post_id, from_post_name,
                                     to_post_id, to_post_name, changed_at, changed_by)
  values (new.org_id, new.user_id,
          old.post_id, (select name from public.org_posts where id = old.post_id),
          new.post_id, (select name from public.org_posts where id = new.post_id),
          now(), v_actor);
  return new;
end $$;
revoke all on function public.log_post_change() from public, anon, authenticated;

drop trigger if exists memberships_log_post_change on public.memberships;
create trigger memberships_log_post_change after update of post_id on public.memberships
  for each row execute function public.log_post_change();

-- ★サーバが 呼ぶ 道。★中で 印を 置いてから 変えます。
--   ★★`service_role` だけ に 渡します。★画面からは 呼べません。
create or replace function public.set_member_post(p_membership_id uuid, p_post_id uuid, p_actor uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $$
begin
  if p_actor is null then raise exception 'ACTOR_REQUIRED'; end if;
  perform set_config('app.actor', p_actor::text, true);   -- ★その 取引の 中だけ
  update public.memberships set post_id = p_post_id where id = p_membership_id;
  return found;
end $$;
revoke all on function public.set_member_post(uuid, uuid, uuid) from public, anon, authenticated;

commit;

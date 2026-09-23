-- ★★★sql/35 ③ の 直しの 案（★2026-09-23・Code）。
--
--   ★★Opus の sql/35 ③ は、★insert に `changed_by_kind` が ありません。
--     ★その 列は 空を 許し、★既定も ありません（★本番で 数えました）。
--     ★★だから 当てると **null** に なり、★「人が やった／サーバが やった」の 見分けが 消えます。
--
--   ★★★直しは **1行** です ──
--         insert into public.post_change_log(… , changed_by, changed_by_kind)
--         values (… , v_actor, case when v_actor is null then 'system' else 'person' end);
--
--   ★★★下は、★**いま 本番に 当たって いる 形**を そのまま 書き出した ものです。
--     ★`actor_id()` を 使って います（★お答え B の とおり）。
--     ★`changed_by_kind` も 入って います。
--     ★★★つまり ── ★sql/35 ③ を この 形に 直すと、★本番と 同じに なります。
--       ★★いま 当てる 必要は ありません。★当てても 何も 変わりません。
--
--   ★★確かめ（★試しの 台帳・2026-09-23）──
--       サーバが set_member_post で 変える → changed_by=あり ／ person
--       印を 置かずに 直に 変える ……… → changed_by=null ／ system
--       同じ 役職を もう一度 ………… → 行 0

set local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.log_post_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_actor uuid := public.actor_id();
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  insert into public.post_change_log(org_id, target_user_id, from_post_id, from_post_name, to_post_id, to_post_name,
                                     changed_at, changed_by, changed_by_kind)
  values (new.org_id, new.user_id,
          old.post_id, (select name from public.org_posts where id = old.post_id),
          new.post_id, (select name from public.org_posts where id = new.post_id),
          now(), v_actor, case when v_actor is null then 'system' else 'person' end);
  return new;
end $function$;
revoke all on function public.log_post_change() from public, anon, authenticated;

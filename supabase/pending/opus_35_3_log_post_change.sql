-- ★★★Opus の sql/35 の ③ だけ。★**当てて いません**。
--   ★わけ …… ★insert に `changed_by_kind` が ありません。
--            ★その 列は 空を 許し、★既定も ありません → ★null に なります。
--            ★★「人／サーバ」の 見分けが 消えます（sql/24 ② が 入れた もの）。
--   ★直し方 …… ★insert に changed_by_kind を 足す だけ です。★考えは 変えません。

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


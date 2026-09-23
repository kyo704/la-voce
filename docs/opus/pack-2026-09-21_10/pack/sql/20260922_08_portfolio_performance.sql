-- 20260922_08 公開ページ・録画・本番の記録（裁定167 B1・B2・C3）
-- 本番: portfolios は visibility='self' だけ・portfolio_recordings 0行・performances の org_event_id 0行（2026-09-22）→ 壊すものは無い

-- B2 録画は YouTube の URL だけ（裁定157 T6）
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'portfolio_recordings_youtube_only') then
    alter table public.portfolio_recordings add constraint portfolio_recordings_youtube_only
      check (url ~* '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/');
  end if;
end $$;

-- B1 公開ページは、この関数だけで読む（サーバが表を直接読まない）
--    切った相手・止められている人は出さない（さがすと同じ matching_visible）。見る人がログインしていなければ、止められているかだけ見る
create or replace function public.get_public_portfolio(p_slug text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v_owner uuid; v_viewer uuid := auth.uid();
begin
  select p.user_id into v_owner from public.portfolios p where p.public_slug = p_slug and p.visibility = 'public';
  if v_owner is null then return null; end if;
  if public.matching_suspended(v_owner) then return null; end if;
  if v_viewer is not null and v_viewer <> v_owner and not public.matching_visible(v_viewer, v_owner) then return null; end if;
  return (
    select jsonb_build_object(
      'display_name', p.display_name, 'instrument', p.instrument, 'bio', p.bio, 'regions', p.regions,
      'entries', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'detail', e.detail) order by e.sort_order) from public.portfolio_entries e where e.user_id = v_owner), '[]'::jsonb),
      'recordings', coalesce((select jsonb_agg(jsonb_build_object('title', r.title, 'url', r.url, 'detail', r.detail) order by r.sort_order)
                               from public.portfolio_recordings r where r.user_id = v_owner), '[]'::jsonb))
    from public.portfolios p where p.user_id = v_owner);
end $$;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;   -- ★公開ページは未ログインでも見られる（意図どおり。中で絞る）
-- 出す列は名指し（kind・title・detail）。id・user_id・created_at は出さない（2026-09-22 本番の列で確認）

-- C3 本番の記録に結びつけられるのは、自分が在籍している学校の行事だけ
drop policy if exists performances_own on public.performances;
create policy performances_own on public.performances for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (org_event_id is null or exists (
      select 1 from public.org_events e join public.enrollments en on en.org_id = e.org_id
      where e.id = performances.org_event_id and en.student_id = auth.uid() and en.status = 'active'))
  );

-- 確かめ
-- 録画に https://vimeo.com/... → check 違反／https://youtu.be/... → 通る
-- visibility='self' の slug → null／public で本人が止められている → null／切った相手がログインして見る → null
-- 在籍していない学校の org_event_id を付ける → 拒否

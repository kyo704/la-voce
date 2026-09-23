-- 20260923_63 busy_at が 学校を1つしか見ていなかった（★56 の直し）
-- 見つけたもの（2026-09-23・Opus が自分で見直して）:
--   busy_at は「日程の札を持つ学校」を ★limit 1 で1つだけ選んでいた
--   → ★掛け持ちの人（非常勤の先生・2つの学校に通う学生）だと、
--      ★どちらか片方しか見えない。しかも ★どちらが選ばれるかは 決まっていない
--   ★本番には すでに 3人います（複数の学校に所属）
-- 決めたこと:
--   ★学校は 呼ぶ側が 渡す（p_org）。こちらで選ばない
--   理由: 先生は「いま どの学校の日程を組んでいるか」を 分かって呼んでいる。
--         ★こちらが勝手に選ぶと、★別の学校の予定を 混ぜて見せることになる
--   ★渡された学校に 札が無ければ 0行（いままでどおり）
-- ★2026-09-23 追記: ★56 の本体に 取り込みました。
--   ★これから当てる人は 56 だけで足ります。
--   ★古い 56（学校を limit 1 で選ぶ形）を すでに当ててしまった場合だけ、このファイルを当ててください

drop function if exists public.busy_at(uuid, timestamptz, timestamptz, uuid);

create or replace function public.busy_at(
  p_org uuid, p_user uuid, p_from timestamptz, p_to timestamptz, p_place uuid default null)
returns table(kind text, starts_at timestamptz, ends_at timestamptz, who text)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  -- ★渡された学校で 札を見る（こちらで学校を選ばない）
  if p_org is null or not public.has_can(p_org,'sched_all') then return; end if;

  return query
  select v.kind, v.starts_at, v.ends_at, null::text
    from public.schedule_view v
   where v.org_id = p_org
     and (v.user_id = p_user or (p_place is not null and v.place_id = p_place))
     and v.starts_at < p_to and v.ends_at > p_from;

  -- ★授業は「その学校に出すと決めた人」だけ。★科目名も教室名も出さない
  return query
  select '授業'::text,
         (d.d::date + make_interval(mins => pr.start_min)) at time zone 'Asia/Tokyo',
         (d.d::date + make_interval(mins => pr.end_min))   at time zone 'Asia/Tokyo', null::text
    from generate_series(p_from::date, p_to::date, interval '1 day') as d(d)
    join public.my_timetable t on t.user_id = p_user
     and t.weekday = extract(isodow from d.d)::int
    join public.my_periods pr on pr.id = t.period_id
   where exists (select 1 from public.timetable_share s
                  where s.user_id = p_user and s.shares and s.org_id = p_org)
     and (d.d::date + make_interval(mins => pr.start_min)) at time zone 'Asia/Tokyo' < p_to
     and (d.d::date + make_interval(mins => pr.end_min))   at time zone 'Asia/Tokyo' > p_from;
end $$;
revoke all on function public.busy_at(uuid, uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.busy_at(uuid, uuid, timestamptz, timestamptz, uuid) to authenticated;

-- ★学生の同意も 学校ごと（56 の表はそのまま。1人1行なので 学校を変えると 上書きになる）
--   → ★学校ごとに持てる形に直す（掛け持ちの学生が「A大学には出す・B大学には出さない」を選べる）
alter table public.timetable_share drop constraint if exists timetable_share_pkey;
alter table public.timetable_share alter column org_id set not null;
alter table public.timetable_share add primary key (user_id, org_id);

-- 確かめ（試しの環境で）
-- 2つの学校に所属する先生が、A校を渡す → ★A校の予定だけ／B校を渡す → B校の予定だけ
-- 札の無い学校を渡す → 0行
-- 学生が A校にだけ「授業を出す」→ ★A校では出る・B校では出ない
-- ★以前の形（学校を渡さない）では、どちらが出るか 決まっていなかった

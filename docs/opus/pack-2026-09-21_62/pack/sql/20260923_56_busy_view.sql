-- 20260923_56 予定の景色と 重なりの検出（P2・裁定183）
-- ★書く前に本番で分かったこと（2026-09-23）:
--   ① my_timetable（学生の時間割）は ★完全に個人のもの（ポリシーは本人だけ・org_id が無い・13行）
--      → ★学校からは見えない。Fable の案「授業との衝突を見せる」は ★そのままでは作れない
--      → ★学生の同意で「予定あり」とだけ出す形にする（下の①）。既定は オフ
--   ② 学校の側に「学生の履修」の表は ★無い（org_periods は 時限の定義だけ）
--   ③ 公演の稽古は koen_sessions（starts_at・ends_at・place はテキスト）
--   ④ 部屋は org_places（名前だけ。時間の予約表は 無い）→ 部屋の重なりは ★レッスンと行事の place から見る
--   ⑥ ★時刻の型の落とし穴（試しの環境で 実際に数えて 見つけた）:
--      generate_series(日付, 日付, interval) は ★timestamptz を返す。
--      timestamptz に at time zone を付けると ★逆向きに変換される（UTC→JST）ので、
--      ★9時間ずれて 1件も当たらなかった。
--      → ★d.d::date にしてから 足す（date + interval は 素の timestamp → at time zone で JST→UTC）
--      ★読んだだけでは 絶対に気づけない種類の誤りでした
--   ⑤ ★my_timetable.period_id は ★my_periods（本人の時限表）を指す。org_periods ではない
--      （2026-09-23 に 試しの環境で 実際に入れてみて 外部キー違反で分かった。
--       ★読んだだけでは「時限表＝学校のもの」と思い込んでいた）
-- ★10・12・18 のあと

-- ① 学生が「授業の時間を 予定ありとして出す」同意（★既定オフ・学生だけが決める）
create table if not exists public.timetable_share (
  user_id    uuid not null references auth.users(id) on delete cascade,
  org_id     uuid not null references public.organizations(id) on delete cascade,
  shares     boolean not null default false,   -- ★既定オフ
  updated_at timestamptz not null default now(),
  primary key (user_id, org_id)                 -- ★学校ごとに持てる（掛け持ちの学生のため）
);
alter table public.timetable_share enable row level security;
revoke all on public.timetable_share from anon, authenticated;
grant select, insert, update on public.timetable_share to authenticated;
drop policy if exists timetable_share_own on public.timetable_share;
create policy timetable_share_own on public.timetable_share for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- ★先生・事務は この表を読めない。読むのは 下の関数（security definer）だけ
-- ★消すポリシーは置かない（取り消しは shares=false。記録は残す）

-- ② 予定の景色（★学校のものだけ。個人の公演は入れない・裁定183）
create or replace view public.schedule_view as
  -- レッスン
  select l.org_id, l.teacher_id as user_id, l.place_id, l.scheduled_at as starts_at,
         l.scheduled_at + make_interval(mins => coalesce(l.duration_minutes,30)) as ends_at,
         'レッスン'::text as kind
    from public.lessons l where l.org_id is not null and l.teacher_id is not null
  union all
  select l.org_id, l.student_id, l.place_id, l.scheduled_at,
         l.scheduled_at + make_interval(mins => coalesce(l.duration_minutes,30)), 'レッスン'
    from public.lessons l where l.org_id is not null and l.student_id is not null
  union all
  -- 学校の行事（人は結び付かない。場所と時間だけ）
  select e.org_id, null::uuid, null::uuid,
         (e.event_date + coalesce(e.start_time,'00:00'::time)) at time zone 'Asia/Tokyo',
         (e.event_date + coalesce(e.end_time,'23:59'::time)) at time zone 'Asia/Tokyo', '行事'
    from public.org_events e where e.withdrawn_at is null
  union all
  -- ★学校の公演の稽古だけ（org_id のあるもの）
  select k.org_id, m.user_id, null::uuid, s.starts_at,
         coalesce(s.ends_at, s.starts_at + interval '2 hours'), '稽古'
    from public.koen_sessions s
    join public.koen k on k.id = s.koen_id
    left join public.koen_members m on m.koen_id = k.id and m.left_at is null
   where s.canceled_at is null and k.org_id is not null;   -- ★個人の公演は入れない

-- ★ビューの守り（2026-09-23 に 試しの環境で 穴に気づいて足した）
--   ビューは 既定で ★作った人（postgres）の権限で動く＝★RLS を素通りする
--   しかも authenticated に ★読む権限が既定で付く
--   → 直さないと、★ログインした誰もが 全学校のレッスンと稽古を読めた
alter view public.schedule_view set (security_invoker = true);   -- ★呼ぶ人の権限で動かす（PG15以降）
revoke all on public.schedule_view from anon, authenticated;      -- ★画面からは読ませない
-- 読むのは 下の関数（security definer）だけ。★本番は PostgreSQL 17.6（確認済み）

-- ③ 重なりを返す1本（★教えるだけ。自動で動かさない）
--   ★学校は 呼ぶ側が渡す（p_org）。こちらで選ばない
--   （2026-09-23: はじめ「札を持つ学校を limit 1 で選ぶ」形にしていたが、
--     ★掛け持ちの人で どちらが出るか決まらなかった。本番に既に3人いる）
create or replace function public.busy_at(
  p_org uuid, p_user uuid, p_from timestamptz, p_to timestamptz, p_place uuid default null)
returns table(kind text, starts_at timestamptz, ends_at timestamptz, who text)
language plpgsql stable security definer set search_path to 'public' as $$
begin
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
    join public.my_periods pr on pr.id = t.period_id      -- ★本人の時限表（org_periods ではない）
   where exists (select 1 from public.timetable_share s
                  where s.user_id = p_user and s.shares and s.org_id = p_org)
     and (d.d::date + make_interval(mins => pr.start_min)) at time zone 'Asia/Tokyo' < p_to
     and (d.d::date + make_interval(mins => pr.end_min))   at time zone 'Asia/Tokyo' > p_from;
end $$;
revoke all on function public.busy_at(uuid, uuid, timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.busy_at(uuid, uuid, timestamptz, timestamptz, uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 同じ時間にレッスンがある人 → 「レッスン」1行／★相手の名前は返らない
-- ★個人の公演（org_id なし）の稽古 → ★出ない
-- 授業: 学生が出すと決めていない → ★出ない／決めている → 「授業」とだけ出る（科目名なし）
-- 日程の札を持たない人が呼ぶ → 0行
-- ★健康の列が 1つも返らない

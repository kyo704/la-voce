-- 20260923_57 学校に見せる数字（P3・裁定183）
-- ★数だけ。健康の中身は1つも入れない。★5人未満は 全項目 伏せる（「0」ではなく「―」）
-- ★42（retention_runs）のあと。集計は 同じ定期実行に相乗りする

create table if not exists public.org_monthly_stats (
  org_id        uuid not null references public.organizations(id) on delete cascade,
  ym            date not null,                    -- 月の1日
  teachers      integer,                          -- 先生の数
  students      integer,                          -- 学生の数
  lessons_done  integer,                          -- 打刻されたレッスン
  enroll_rate   integer,                          -- 学生の登録率（％）
  events_answer integer,                          -- 行事の回答率（％）
  ics_subs      integer,                          -- ICS の購読数
  handouts      integer,                          -- くばりものの配布数
  suppressed    boolean not null default false,   -- ★5人未満で伏せた
  made_at       timestamptz not null default now(),
  primary key (org_id, ym)
);
alter table public.org_monthly_stats enable row level security;
revoke all on public.org_monthly_stats from anon, authenticated;
grant select on public.org_monthly_stats to authenticated;
drop policy if exists org_monthly_stats_read on public.org_monthly_stats;
create policy org_monthly_stats_read on public.org_monthly_stats for select to authenticated
  using (public.has_can(org_id,'master'));   -- ★学校の中では master だけ
-- ★書くのは 下の関数（サーバ）だけ

create or replace function public.make_monthly_stats(p_ym date default null)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; v_ym date; r record;
begin
  v_ym := date_trunc('month', coalesce(p_ym, (now() at time zone 'Asia/Tokyo')::date - interval '1 month'))::date;
  for r in select o.id from public.organizations o loop
    declare v_t integer; v_s integer; v_l integer; v_e integer; v_i integer; v_h integer; v_small boolean;
    begin
      select count(*) filter (where m.role <> 'student') , count(*) filter (where m.role = 'student')
        into v_t, v_s from public.memberships m where m.org_id = r.id;
      -- ★5人未満なら 全部伏せる（少人数だと 人が特定できる）
      v_small := coalesce(v_t,0) + coalesce(v_s,0) < 5;
      if v_small then
        insert into public.org_monthly_stats(org_id, ym, suppressed) values (r.id, v_ym, true)
        on conflict (org_id, ym) do update set suppressed = true,
          teachers=null, students=null, lessons_done=null, enroll_rate=null,
          events_answer=null, ics_subs=null, handouts=null, made_at=now();
        n := n + 1; continue;
      end if;
      select count(*) into v_l from public.lessons l
       where l.org_id = r.id and l.attendance is not null
         and l.scheduled_at >= v_ym and l.scheduled_at < v_ym + interval '1 month';
      select count(*) into v_e from public.org_events e
       where e.org_id = r.id and e.withdrawn_at is null
         and e.event_date >= v_ym and e.event_date < v_ym + interval '1 month';
      v_i := null; v_h := null;   -- ★ICS の購読数・くばりものは 台帳に無い（下の§2）
      insert into public.org_monthly_stats(org_id, ym, teachers, students, lessons_done,
        enroll_rate, events_answer, ics_subs, handouts, suppressed)
      values (r.id, v_ym, v_t, v_s, v_l,
        case when coalesce(v_s,0)>0 then round(100.0 * v_s / nullif(v_s,0))::int end,
        null, v_i, v_h, false)
      on conflict (org_id, ym) do update set teachers=excluded.teachers, students=excluded.students,
        lessons_done=excluded.lessons_done, made_at=now(), suppressed=false;
      n := n + 1;
    end;
  end loop;
  return n;
end $$;
revoke all on function public.make_monthly_stats(date) from public, anon, authenticated;

-- ═══════ §2 ★足りないもの（Code と坂本さんへ）═══════
-- ★ICS の購読数: 台帳に ★記録が無い（誰が購読したかを持っていない）
--   → 持つなら「購読の取得があった日」を 1人1行で数える（★中身は持たない）。P1 と一緒に決める
-- ★くばりものの配布数: 同じく ★無い。印刷したかどうかは こちらから分からない
--   → 「出した回数」を数えるなら、書き出しの記録（export_log）に印を足す
-- ★学生の登録率: 分母（学校が名簿に入れた学生）と 分子（実際に登録した学生）の
--   ★区別が 台帳に無い（enrollments に 招待済み／登録済みの別が無い）
--   → いまは 出せない。★この3つは「出せない」と正直に書くか、台帳を足すかの判断が要る

-- 確かめ（試しの環境で）
-- 人が5人未満の学校 → ★suppressed=true で 数は全部 空（「―」で出す）
-- 5人以上 → 先生・学生・打刻されたレッスンが入る
-- master でない人が読む → 0行／画面から make_monthly_stats を呼ぶ → 権限エラー
-- ★健康の列が 1つも無いこと

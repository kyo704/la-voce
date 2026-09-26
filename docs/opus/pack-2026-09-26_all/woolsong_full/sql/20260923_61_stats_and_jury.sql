-- 20260923_61 P3 の仕上げ（毎月呼ぶ・3項目の決着）＋ P5 の割り当ての関数
-- 坂本さんの決定（2026-09-23）: ①ICS は記録する ②くばりものは数えない ③学生の登録率はやめる
-- ★57・59・60・42 のあと
-- ★列名と値を本番で確かめた（2026-09-23）:
--   enrollments: grade_year／status は ★'active'・'paused'・'left'（★'enrolled' ではない）
--   profiles: kana・display_name

-- ════════ P3 ════════
-- ① 使わない列を外す（★数えないと決めたもの）
alter table public.org_monthly_stats drop column if exists handouts;      -- ★くばりもの: 数えない
alter table public.org_monthly_stats drop column if exists enroll_rate;   -- ★登録率: やめる

-- ② 集計を 決定に合わせて作り直す（★ICS は 60 の関数から取る）
create or replace function public.make_monthly_stats(p_ym date default null)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; v_ym date; r record;
        v_t int; v_s int; v_l int; v_e int; v_i int; v_small boolean;
begin
  v_ym := date_trunc('month', coalesce(p_ym, (now() at time zone 'Asia/Tokyo')::date - interval '1 month'))::date;
  for r in select o.id from public.organizations o loop
    select count(*) filter (where m.role <> 'student'), count(*) filter (where m.role = 'student')
      into v_t, v_s from public.memberships m where m.org_id = r.id;
    v_small := coalesce(v_t,0) + coalesce(v_s,0) < 5;          -- ★5人未満は全部伏せる
    if v_small then
      insert into public.org_monthly_stats(org_id, ym, suppressed) values (r.id, v_ym, true)
      on conflict (org_id, ym) do update set suppressed = true, teachers=null, students=null,
        lessons_done=null, events_answer=null, ics_subs=null, made_at=now();
      n := n + 1; continue;
    end if;
    select count(*) into v_l from public.lessons l
     where l.org_id = r.id and l.attendance is not null
       and l.scheduled_at >= v_ym and l.scheduled_at < v_ym + interval '1 month';
    select count(*) into v_e from public.org_events e
     where e.org_id = r.id and e.withdrawn_at is null
       and e.event_date >= v_ym and e.event_date < v_ym + interval '1 month';
    v_i := public.ics_subs_count(r.id, v_ym);                   -- ★60 から
    insert into public.org_monthly_stats(org_id, ym, teachers, students, lessons_done,
                                         events_answer, ics_subs, suppressed)
    values (r.id, v_ym, v_t, v_s, v_l, v_e, v_i, false)
    on conflict (org_id, ym) do update set teachers=excluded.teachers, students=excluded.students,
      lessons_done=excluded.lessons_done, events_answer=excluded.events_answer,
      ics_subs=excluded.ics_subs, suppressed=false, made_at=now();
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.make_monthly_stats(date) from public, anon, authenticated;

-- ③ ★毎月 呼ぶ（掃除と同じ道に相乗り。sql/42・53 の run_retention を置き換える）
create or replace function public.run_retention()
returns table(job text, removed integer)
language plpgsql security definer set search_path to 'public' as $$
declare n integer; v_job text;
        v_jobs text[] := array['ops_audit_log','code_attempts','closed_school_logs','evaluation_reviews'];
begin
  foreach v_job in array v_jobs loop
    begin
      n := case v_job
             when 'ops_audit_log'      then public.purge_ops_audit_log()
             when 'code_attempts'      then public.purge_code_attempts()
             when 'closed_school_logs' then public.purge_closed_school_logs()
             when 'evaluation_reviews' then public.purge_evaluation_reviews()
           end;
      insert into public.retention_runs(job, removed) values (v_job, coalesce(n,0));
      job := v_job; removed := coalesce(n,0); return next;
    exception when others then
      insert into public.retention_runs(job, ok, note) values (v_job, false, sqlerrm);
    end;
  end loop;
  -- ★月の1日だけ 集計する（同じ道で呼ぶので、呼ぶ仕組みは1つで済む）
  if extract(day from (now() at time zone 'Asia/Tokyo')) = 1 then
    begin
      n := public.make_monthly_stats();
      insert into public.retention_runs(job, removed) values ('monthly_stats', coalesce(n,0));
      job := 'monthly_stats'; removed := coalesce(n,0); return next;
    exception when others then
      insert into public.retention_runs(job, ok, note) values ('monthly_stats', false, sqlerrm);
    end;
  end if;
end $$;
revoke all on function public.run_retention() from public, anon, authenticated;

-- ════════ P5 ════════
-- ④ 枠を並べる（★学年→声種→五十音。順位や成績で並べない）
create or replace function public.jury_layout(p_event uuid, p_start timestamptz, p_minutes integer default 12,
                                              p_gap integer default 3, p_rooms integer default 1)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; i integer := 0; r record; v_at timestamptz;
begin
  select e.org_id into v_org from public.org_events e where e.id = p_event;
  if v_org is null then raise exception 'NO_SUCH_EVENT'; end if;
  if not public.has_can(v_org,'saiten') then raise exception 'NOT_SAITEN'; end if;
  if exists (select 1 from public.jury_slots s where s.event_id = p_event) then raise exception 'ALREADY_LAID_OUT'; end if;

  for r in
    -- ★display_name が空の人がいる（試しの環境で 空の紙が出た）→ name で補う
    select en.student_id, coalesce(p.display_name, p.name) as display_name
      from public.enrollments en
      left join public.profiles p on p.id = en.student_id
     where en.org_id = v_org and en.status = 'active'   -- ★本番の値は active/paused/left（enrolled ではない）
     -- ★本番で確かめた列（2026-09-23）: enrollments は grade_year／profiles は kana・display_name
     order by en.grade_year nulls last, p.kana nulls last, p.display_name nulls last   -- 学年 → 五十音
  loop
    v_at := p_start + make_interval(mins => (i / greatest(p_rooms,1)) * (p_minutes + p_gap));
    insert into public.jury_slots(org_id, event_id, student_id, student_name_at, starts_at, minutes, ord)
    values (v_org, p_event, r.student_id, coalesce(r.display_name,'（名前なし）'), v_at, p_minutes, i);
    i := i + 1;
  end loop;
  return i;
end $$;
revoke all on function public.jury_layout(uuid, timestamptz, integer, integer, integer) from public, anon;
grant execute on function public.jury_layout(uuid, timestamptz, integer, integer, integer) to authenticated;

-- ⑤ 枠の重なりを ★教える（P2 の景色を使う。★自動で動かさない）
create or replace function public.jury_conflicts(p_event uuid)
returns table(slot_id uuid, student_name text, starts_at timestamptz, kind text)
language sql stable security definer set search_path to 'public' as $$
  select s.id, coalesce(s.student_name_at,'—'), s.starts_at, v.kind
    from public.jury_slots s
    join public.schedule_view v on v.org_id = s.org_id and v.user_id = s.student_id
   where s.event_id = p_event
     and public.has_can(s.org_id,'saiten')
     and v.starts_at < s.starts_at + make_interval(mins => s.minutes)
     and v.ends_at   > s.starts_at;
$$;
revoke all on function public.jury_conflicts(uuid) from public, anon;
grant execute on function public.jury_conflicts(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- P3: 5人以上の学校 → 先生・学生・打刻・行事・ICS が入る／5人未満 → 全部 空
--     月の1日に run_retention → monthly_stats の行が増える／★1日以外は 増えない
-- P5: jury_layout(行事, 10:00, 12分, 3分あけ, 部屋1) → 学生の数だけ枠ができ、★12分ずつずれる
--     部屋2 → ★2人ずつ同じ時刻
--     2回目 → ALREADY_LAID_OUT（★黙って二重に作らない）
--     採点の札が無い人 → NOT_SAITEN
--     jury_conflicts → その学生の ★レッスンや稽古と重なる枠だけ出る

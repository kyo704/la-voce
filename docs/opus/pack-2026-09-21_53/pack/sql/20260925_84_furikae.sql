-- 20260925_84 振替（裁定138 R3）── ★C群に 入れる（2026-09-25 坂本さんの 判断）
-- 裁定138 R3:「★何日前まで・月何回までを 教室が 決める。★空き枠を 出す。★理由は 聞かない」
-- ★時期は「R1 のあと」でしたが、★R1 の 台帳は もう あります（sql/10・69）
-- ★79・81 のあと

-- ① 教室の 決め（★何日前まで・月何回まで）
alter table public.org_settings add column if not exists furikae_days_before integer not null default 2;
alter table public.org_settings add column if not exists furikae_per_month integer not null default 2;
alter table public.org_settings add column if not exists furikae_enabled boolean not null default false;
-- ★既定は 切（裁定73：何もしなければ 使えない）

-- ② 振替の 記録
create table if not exists public.lesson_furikae (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  from_lesson uuid not null references public.lessons(id) on delete cascade,
  to_lesson   uuid references public.lessons(id) on delete set null,   -- ★決まるまで 空
  asked_at    timestamptz not null default now(),
  decided_at  timestamptz,
  status      text not null default 'asked' check (status in ('asked','done','withdrawn')),
  student_name_at text
);
create index if not exists lesson_furikae_student_idx on public.lesson_furikae(student_id, asked_at desc);
alter table public.lesson_furikae enable row level security;
revoke all on public.lesson_furikae from anon, authenticated;
grant select on public.lesson_furikae to authenticated;
drop policy if exists lesson_furikae_mine on public.lesson_furikae;
create policy lesson_furikae_mine on public.lesson_furikae for select to authenticated
  using (student_id = auth.uid()
         or exists (select 1 from public.lessons l
                     where l.id = from_lesson and l.teacher_id = auth.uid())
         or public.has_can(org_id,'sched_all'));
-- ★★理由の 列は ★作りません（裁定138 R3「理由は 聞かない」）

-- ③ 空き枠（★先生の 空いている コマ）
create or replace function public.furikae_slots(p_org uuid, p_teacher uuid, p_from date, p_to date)
returns table(starts_at timestamptz, minutes integer)
language sql stable security definer set search_path to 'public' as $$
  select l.scheduled_at, l.duration_minutes
    from public.lessons l
   where l.org_id = p_org and l.teacher_id = p_teacher
     and l.student_id is null                       -- ★誰も 入っていない 枠
     and l.scheduled_at::date between p_from and p_to
   order by l.scheduled_at;
$$;
revoke all on function public.furikae_slots(uuid, uuid, date, date) from public, anon;
grant execute on function public.furikae_slots(uuid, uuid, date, date) to authenticated;

-- ④ 振替を 申し込む（★学生）
create or replace function public.ask_furikae(p_lesson uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v record; v_set record; n integer; v_id uuid;
begin
  select l.* into v from public.lessons l where l.id = p_lesson and l.student_id = auth.uid();
  if v.id is null then raise exception 'NOT_YOURS'; end if;
  select coalesce(s.furikae_enabled,false) as on, coalesce(s.furikae_days_before,2) as days,
         coalesce(s.furikae_per_month,2) as per_month
    into v_set from public.org_settings s where s.org_id = v.org_id;
  if not coalesce(v_set.on,false) then raise exception 'FURIKAE_OFF: この教室は 振替を 使っていません'; end if;
  if v.scheduled_at < now() + make_interval(days => v_set.days) then
    raise exception 'TOO_LATE: %日前までに お願いします', v_set.days;
  end if;
  select count(*) into n from public.lesson_furikae f
   where f.student_id = auth.uid() and f.status <> 'withdrawn'
     and date_trunc('month', f.asked_at) = date_trunc('month', now());
  if n >= v_set.per_month then raise exception 'TOO_MANY: 1か月に %回までです', v_set.per_month; end if;

  insert into public.lesson_furikae(org_id, student_id, from_lesson, student_name_at)
  values (v.org_id, auth.uid(), p_lesson,
          (select coalesce(nullif(btrim(coalesce(p.display_name,'')),''),
                           nullif(btrim(coalesce(p.name,'')),'')) from public.profiles p where p.id = auth.uid()))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.ask_furikae(uuid) from public, anon;
grant execute on function public.ask_furikae(uuid) to authenticated;

-- 確かめ（試しの環境で・★なりきって）
-- 切ってある教室 → FURIKAE_OFF／★既定は 切
-- 2日前を 過ぎている → TOO_LATE
-- 月3回目 → TOO_MANY（★教室が 決めた 数）
-- 他人の レッスン → NOT_YOURS
-- ★理由を しまう列は ありません
-- 空き枠 → ★誰も 入っていない コマだけ 出る

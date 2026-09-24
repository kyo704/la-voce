-- 20260923_25 公演の画面に要る関数（稽古を組む・出欠をつける・当日の一枚）
-- 裁定141・143・147・148。★画面で計算せず、台帳で返す（先生の重なり・学生の重なりの考え方は レッスンと同じ）

-- ① 稽古を組むときの「重なり」。自動で動かさない。印を返すだけ（裁定139 と同じ考え）
create or replace function public.koen_conflicts(p_koen uuid)
returns table(session_id uuid, member_id uuid, member_name text, kind text, other_title text, other_starts_at timestamptz)
language sql stable security definer set search_path to 'public' as $$
  with s as (
    select x.id, x.starts_at, coalesce(x.ends_at, x.starts_at + interval '2 hours') as ends_at
      from public.koen_sessions x where x.koen_id = p_koen and x.canceled_at is null
  ),
  m as (select id, user_id, name_at from public.koen_members where koen_id = p_koen and left_at is null and user_id is not null)
  -- ほかの公演の稽古・本番との重なり
  select s.id, m.id, m.name_at, 'koen'::text, k2.title, s2.starts_at
    from s join m on true
    join public.koen_members m2 on m2.user_id = m.user_id and m2.left_at is null and m2.koen_id <> p_koen
    join public.koen_sessions s2 on s2.koen_id = m2.koen_id and s2.canceled_at is null
    join public.koen k2 on k2.id = s2.koen_id
   where public.koen_can_manage(p_koen)
     and s2.starts_at < s.ends_at and coalesce(s2.ends_at, s2.starts_at + interval '2 hours') > s.starts_at
  union all
  -- レッスンとの重なり（本人が 学生でも 先生でも）
  select s.id, m.id, m.name_at, 'lesson'::text, 'レッスン'::text, l.scheduled_at
    from s join m on true
    join public.lessons l on (l.student_id = m.user_id or l.teacher_id = m.user_id)
   where public.koen_can_manage(p_koen)
     and l.scheduled_at < s.ends_at
     and l.scheduled_at + make_interval(mins => coalesce(l.duration_minutes, 30)) > s.starts_at;
$$;
revoke all on function public.koen_conflicts(uuid) from public, anon;
grant execute on function public.koen_conflicts(uuid) to authenticated;

-- ② 出欠をまとめてつける（1人ずつ押すのと同じ結果。★率を出さない・色で警告しない）
create or replace function public.set_attendance(p_session uuid, p_rows jsonb)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; r jsonb; n integer := 0;
begin
  select s.koen_id into v_koen from public.koen_sessions s where s.id = p_session;
  if v_koen is null then raise exception 'NO_SUCH_SESSION'; end if;
  if not public.koen_can_manage(v_koen) then raise exception 'NOT_STAFF'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    if (r ->> 'status') not in ('present','absent','late','excused') then raise exception 'BAD_STATUS'; end if;
    insert into public.koen_attendance(session_id, member_id, kid_id, status, marked_by)
    values (p_session, nullif(r ->> 'member_id','')::uuid, nullif(r ->> 'kid_id','')::uuid, r ->> 'status', public.actor_id())
    on conflict (session_id, member_id, kid_id) do update
      set status = excluded.status, marked_at = now(), marked_by = excluded.marked_by;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.set_attendance(uuid, jsonb) from public, anon;
grant execute on function public.set_attendance(uuid, jsonb) to authenticated;

-- ③ 当日の一枚（進行・入り・楽屋を1回で。★子どもは集合と解散を必ず含める）
create or replace function public.koen_day_sheet(p_koen uuid, p_on date)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.koen_can_see(p_koen) then return null; end if;
  return jsonb_build_object(
    'runsheet', coalesce((select jsonb_agg(jsonb_build_object('at', r.at_time, 'what', r.what, 'who', r.who)
                                            order by r.at_time, r.sort_order)
                            from public.koen_runsheet r where r.koen_id = p_koen), '[]'::jsonb),
    'calls', coalesce((select jsonb_agg(jsonb_build_object(
                          'at', c.call_at, 'dismiss_at', c.dismiss_at, 'note', c.note,
                          'who', coalesce(m.name_at, k.nickname, w.label),
                          'is_kid', (c.kid_id is not null)) order by c.call_at)
                         from public.koen_calls c
                         left join public.koen_members m on m.id = c.member_id
                         left join public.koen_kids    k on k.id = c.kid_id
                         left join public.koen_rows    w on w.id = c.row_id
                        where c.koen_id = p_koen and (c.call_at at time zone 'Asia/Tokyo')::date = p_on), '[]'::jsonb),
    'rooms', coalesce((select jsonb_agg(jsonb_build_object(
                          'name', rm.name, 'for_kids', rm.for_kids,
                          'who', coalesce((select jsonb_agg(coalesce(m2.name_at, k2.nickname, w2.label))
                                             from public.koen_room_members rv
                                             left join public.koen_members m2 on m2.id = rv.member_id
                                             left join public.koen_kids    k2 on k2.id = rv.kid_id
                                             left join public.koen_rows    w2 on w2.id = rv.row_id
                                            where rv.room_id = rm.id), '[]'::jsonb))
                          order by rm.sort_order)
                        from public.koen_rooms rm where rm.koen_id = p_koen), '[]'::jsonb));
end $$;
revoke all on function public.koen_day_sheet(uuid, date) from public, anon;
grant execute on function public.koen_day_sheet(uuid, date) to authenticated;

-- 確かめ（実在の試しの利用者で）
-- 重なり: 同じ人が2つの公演で同じ時間に組まれている → 1行返る／レッスンと重なる → 1行返る／運営でない人が呼ぶ → 0行
-- 出欠: まとめて付けられる／同じ人に2回付けると上書き（行は増えない）／状態の綴りが違うと BAD_STATUS
-- 当日の一枚: 子どもの呼び出しに 解散の時刻が入っている／出演者でない人が呼ぶ → null
-- ★返る中身に 体調・記録の列が1つも無いこと

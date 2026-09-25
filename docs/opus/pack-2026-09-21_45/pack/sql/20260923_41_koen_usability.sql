-- 20260923_41 公演を使いやすくする4つ（坂本さん承認 2026-09-23）
--   ① 出演者から見た「自分の予定」（他人の予定は見せない）
--   ② 代役（アンダースタディ）── 本役が休んだ日に、代役が呼び出しに入る
--   ③ 香盤表の書き出し（紙で配る団体のため。PDFのもとになるデータ）
--   ④ 過去の公演から ★枠だけ写す（名前は写さない。裁定144 と両立させる）
-- ★29・33・38 のあと。本番で確認済み: 代役の列（is_understudy・covers_slot_id）と期限の列は既にある

-- ★38（time_from・time_to）が無いと ④ が失敗するので、先に確かめて止める
do $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='koen_rows' and column_name='time_from') then
    raise exception 'NEED_38: 先に sql/38（収録・発表会）を当ててください';
  end if;
end $$;

-- ════════ ① 自分の予定 ════════
-- 「自分がいつ呼ばれるか」だけを返す。★他の出演者の予定は返さない
create or replace function public.my_koen_schedule(p_koen uuid default null)
returns table(koen_id uuid, koen_title text, session_id uuid, kind text,
              starts_at timestamptz, call_at timestamptz, dismiss_at timestamptz,
              place text, rows_label text, canceled boolean)
language sql stable security definer set search_path to 'public' as $$
  select k.id, k.title, s.id, s.kind, s.starts_at, c.call_at, c.dismiss_at, s.place,
         (select string_agg(r.label, '／' order by r.sort_order)
            from public.koen_rows r where r.id = c.row_id),
         (s.canceled_at is not null)
    from public.koen_members m
    join public.koen k        on k.id = m.koen_id
    join public.koen_sessions s on s.koen_id = k.id
    left join public.koen_calls c on c.member_id = m.id
           and c.call_at >= s.starts_at - interval '6 hours'
           and c.call_at <= coalesce(s.ends_at, s.starts_at + interval '12 hours')
   where m.user_id = auth.uid() and m.left_at is null
     and (p_koen is null or k.id = p_koen)
     and s.starts_at >= (now() - interval '1 day')
   order by s.starts_at
   limit 200;
$$;
revoke all on function public.my_koen_schedule(uuid) from public, anon;
grant execute on function public.my_koen_schedule(uuid) to authenticated;

-- ════════ ② 代役 ════════
-- 本役が「休み」の稽古で、その枠を継ぐ代役を返す（★自動で呼ばない。運営が見て決める）
create or replace function public.koen_understudy_needed(p_session uuid)
returns table(slot_id uuid, slot_label text, absent_name text, understudy_id uuid, understudy_name text)
language sql stable security definer set search_path to 'public' as $$
  select sl.id, sl.label, m.name_at, u.id, u.name_at
    from public.koen_attendance a
    join public.koen_members m on m.id = a.member_id
    join public.koen_sessions s on s.id = a.session_id
    join public.koen_cells  c  on c.member_id = m.id
    join public.koen_slots  sl on sl.id = c.slot_id and sl.koen_id = s.koen_id
    left join public.koen_members u on u.koen_id = s.koen_id and u.is_understudy
                                   and u.covers_slot_id = sl.id and u.left_at is null
   where a.session_id = p_session
     and a.status in ('absent','excused')
     and public.koen_can_manage(s.koen_id)
   group by sl.id, sl.label, m.name_at, u.id, u.name_at;
$$;
revoke all on function public.koen_understudy_needed(uuid) from public, anon;
grant execute on function public.koen_understudy_needed(uuid) to authenticated;

-- 代役を その稽古の呼び出しに入れる（★運営が押したときだけ。自動では入れない）
create or replace function public.call_understudy(p_session uuid, p_understudy uuid, p_call_at timestamptz default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; v_at timestamptz;
begin
  select s.koen_id, coalesce(p_call_at, s.starts_at) into v_koen, v_at
    from public.koen_sessions s where s.id = p_session;
  if v_koen is null then raise exception 'NO_SUCH_SESSION'; end if;
  if not public.koen_can_manage(v_koen) then raise exception 'NOT_STAFF'; end if;
  if not exists (select 1 from public.koen_members u
                  where u.id = p_understudy and u.koen_id = v_koen and u.is_understudy and u.left_at is null) then
    raise exception 'NOT_AN_UNDERSTUDY';
  end if;
  -- ★koen_calls に一意の決まりが無いので、on conflict は使えない（2026-09-23 本番で確認）
  --   同じ人・同じ時刻の呼び出しが既にあれば、足さない
  if exists (select 1 from public.koen_calls c
              where c.koen_id = v_koen and c.member_id = p_understudy and c.call_at = v_at) then
    return;
  end if;
  insert into public.koen_calls(koen_id, member_id, call_at, note)
  values (v_koen, p_understudy, v_at, '代役として');
end $$;
revoke all on function public.call_understudy(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.call_understudy(uuid, uuid, timestamptz) to authenticated;

-- ════════ ③ 香盤表の書き出し ════════
-- 紙・PDF のもとになる形（行＝場面、列＝枠、マス＝人）。★体調は1文字も入らない
create or replace function public.koen_sheet_export(p_koen uuid)
returns table(row_sort integer, row_label text, group_label text, minutes integer,
              slot_sort integer, slot_label text, group_kind text, person text)
language sql stable security definer set search_path to 'public' as $$
  select r.sort_order, r.label, r.group_label, r.minutes,
         sl.sort_order, sl.label, sl.group_kind,
         coalesce(m.name_at, case when c.people is not null then c.people::text||'人' else null end)
    from public.koen_rows r
    cross join public.koen_slots sl
    left join public.koen_cells c on c.row_id = r.id and c.slot_id = sl.id
    left join public.koen_members m on m.id = c.member_id
   where r.koen_id = p_koen and sl.koen_id = p_koen and public.koen_can_see(p_koen)
   order by r.sort_order, sl.sort_order;
$$;
revoke all on function public.koen_sheet_export(uuid) from public, anon;
grant execute on function public.koen_sheet_export(uuid) to authenticated;

-- ════════ ④ 前の公演から 枠だけ写す ════════
-- ★裁定144（公演の使い回しの禁止）との両立:
--   ・写すのは「場面・枠・作品の構造」だけ。★人・配役・稽古・出欠・呼び出し・期限は写さない
--   ・写し先は ★新しい公演（新しく作る＝新しい期限で数える）
--   ・つまり「同じ公演を延ばす」ことにはならない
create or replace function public.koen_copy_frame(p_from uuid, p_to uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0;
begin
  if not public.koen_can_manage(p_from) then raise exception 'NOT_STAFF_SOURCE'; end if;
  if not public.koen_can_manage(p_to)   then raise exception 'NOT_STAFF_TARGET'; end if;
  if p_from = p_to then raise exception 'SAME_KOEN'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_to) then raise exception 'TARGET_HAS_ROWS'; end if;

  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_to, sl.label, sl.slot_kind, sl.group_kind, sl.sort_order
    from public.koen_slots sl where sl.koen_id = p_from;      -- ★人は写さない

  insert into public.koen_rows(koen_id, label, group_label, minutes, sort_order, time_from, time_to)
  select p_to, r.label, r.group_label, r.minutes, r.sort_order, r.time_from, r.time_to
    from public.koen_rows r where r.koen_id = p_from;
  get diagnostics n = row_count;
  return n;                                                   -- ★配役・稽古・出欠・期限は写さない
end $$;
revoke all on function public.koen_copy_frame(uuid, uuid) from public, anon;
grant execute on function public.koen_copy_frame(uuid, uuid) to authenticated;

-- 確かめ（試しの環境で）
-- ① 出演者が my_koen_schedule → ★自分の呼び出しだけ。他人の名前も体調も出ない
--    公演にいない人が呼ぶ → 0行
-- ② 稽古で本役を「休み」にする → koen_understudy_needed にその枠が出る／代役がいなければ空欄で出る
--    call_understudy（運営）→ 呼び出しに1行。★代役でない人を指す → NOT_AN_UNDERSTUDY
--    ★自動では呼ばれない（運営が押すまで呼び出しは増えない）
-- ③ koen_sheet_export → 行×列の形。★体調・記録の列が1つも無い
-- ④ koen_copy_frame: 新しい公演に 場面と枠だけ入る。★人・稽古・出欠・期限は写らない
--    行のある公演に写す → TARGET_HAS_ROWS／同じ公演を指す → SAME_KOEN

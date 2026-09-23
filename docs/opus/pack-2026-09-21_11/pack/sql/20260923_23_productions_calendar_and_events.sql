-- 20260923_23 公演のカレンダー（ICS）・学校の行事とのつながり・「変わったもの」の届け方
-- 裁定139（1人1つの住所）・141・148・152 R1／裁定87（催促しない・お知らせを送らない）

-- ① 公演と学校の行事をつなぐ（学校の公演を、名簿の行事としても出す）
--    ★行事から日付を引かない（裁定57）。つなぐだけ。消えても互いに壊れない
create table if not exists public.koen_org_events (
  koen_id      uuid not null references public.koen(id) on delete cascade,
  org_event_id uuid not null references public.org_events(id) on delete cascade,
  session_id   uuid references public.koen_sessions(id) on delete cascade,   -- どの稽古・本番に当たるか（任意）
  primary key (koen_id, org_event_id)
);
alter table public.koen_org_events enable row level security;
revoke all on public.koen_org_events from anon, authenticated;
grant select, insert, delete on public.koen_org_events to authenticated;
drop policy if exists koen_org_events_select on public.koen_org_events;
create policy koen_org_events_select on public.koen_org_events for select to authenticated
  using (public.koen_can_see(koen_id));
drop policy if exists koen_org_events_write on public.koen_org_events;
create policy koen_org_events_write on public.koen_org_events for all to authenticated
  using (public.koen_can_manage(koen_id)
     and exists (select 1 from public.koen k join public.org_events e on e.id = koen_org_events.org_event_id
                  where k.id = koen_org_events.koen_id and k.org_id is not null and e.org_id = k.org_id))
  with check (public.koen_can_manage(koen_id)
     and exists (select 1 from public.koen k join public.org_events e on e.id = koen_org_events.org_event_id
                  where k.id = koen_org_events.koen_id and k.org_id is not null and e.org_id = k.org_id));
-- ★別の学校の行事にはつなげない（上の exists で学校が同じことを確かめている）

-- ② カレンダー（ICS）。1人1つの住所は calendar_tokens（sql/10）をそのまま使う
--    住所から見えるのは「その人に関わる予定」だけ。★体調の記録は1文字も入れない（見本の注記どおり）
create or replace function public.my_calendar_items(p_token text)
returns table(uid text, starts_at timestamptz, ends_at timestamptz, title text, place text, canceled boolean)
language plpgsql stable security definer set search_path to 'public' as $$
declare v_user uuid;
begin
  select t.user_id into v_user from public.calendar_tokens t where t.token = p_token;
  if v_user is null then return; end if;          -- ★合っていない住所には 何も返さない（理由も返さない）

  -- レッスン（確定したものだけ）
  return query
    select 'lesson-' || l.id::text,
           l.scheduled_at,
           l.scheduled_at + make_interval(mins => coalesce(l.duration_minutes, 30)),
           'レッスン'::text,
           coalesce(p.name, '')::text,
           false
      from public.lessons l
      left join public.org_places p on p.id = l.place_id
     where l.student_id = v_user or l.teacher_id = v_user;

  -- 公演の稽古・本番・入り（出ている人・運営だけ）
  return query
    select 'koen-' || s.id::text,
           s.starts_at,
           coalesce(s.ends_at, s.starts_at + interval '2 hours'),
           (k.title || '（' || case s.kind when 'rehearsal' then '稽古' when 'call' then '入り' else '本番' end || '）')::text,
           coalesce(s.place, k.venue, '')::text,
           (s.canceled_at is not null)
      from public.koen_sessions s
      join public.koen k on k.id = s.koen_id
     where exists (select 1 from public.koen_members m
                    where m.koen_id = k.id and m.user_id = v_user and m.left_at is null)
        or k.owner_user_id = v_user;

  -- 学校の行事（在籍している学校の、取り消されていないもの）
  return query
    select 'event-' || e.id::text,
           (e.event_date + coalesce(e.start_time, time '00:00')) at time zone 'Asia/Tokyo',
           (e.event_date + coalesce(e.end_time, coalesce(e.start_time, time '00:00') + interval '1 hour')) at time zone 'Asia/Tokyo',
           e.title::text,
           coalesce(e.place, '')::text,
           (e.withdrawn_at is not null)
      from public.org_events e
      join public.enrollments en on en.org_id = e.org_id and en.student_id = v_user and en.status = 'active'
     where e.withdrawn_at is null;
end $$;
revoke all on function public.my_calendar_items(text) from public, anon, authenticated;
-- ★サーバ（service role）だけが呼ぶ。住所は URL に入るので、画面から直接は呼ばせない

-- ③ 「変わったもの」の届け方（裁定87：お知らせを送らない・催促しない）
--    ★通知は出さない。出演者が開いたときに「変わったもの」として見えるだけ。
--    どこまで見たかは本人の持ち物（既読の印）。運営には見せない
create table if not exists public.koen_change_seen (
  koen_id    uuid not null references public.koen(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  seen_at    timestamptz not null default now(),
  primary key (koen_id, user_id)
);
alter table public.koen_change_seen enable row level security;
revoke all on public.koen_change_seen from anon, authenticated;
grant select, insert, update on public.koen_change_seen to authenticated;
drop policy if exists koen_change_seen_own on public.koen_change_seen;
create policy koen_change_seen_own on public.koen_change_seen for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.koen_can_see(koen_id));

-- 自分がまだ見ていない「変わったもの」の数（帯にも印にも使わない。画面を開いたときだけ）
create or replace function public.koen_unseen_changes(p_koen uuid)
returns integer language sql stable security definer set search_path to 'public' as $$
  select count(*)::int
    from public.koen_session_changes c
    join public.koen_sessions s on s.id = c.session_id
   where s.koen_id = p_koen
     and public.koen_can_see(p_koen)
     and c.changed_at > coalesce((select v.seen_at from public.koen_change_seen v
                                   where v.koen_id = p_koen and v.user_id = auth.uid()), 'epoch'::timestamptz);
$$;
revoke all on function public.koen_unseen_changes(uuid) from public, anon;
grant execute on function public.koen_unseen_changes(uuid) to authenticated;

-- 確かめ（実在の試しの利用者で）
-- つながり: 同じ学校の行事にはつなげる／別の学校の行事には つなげない（with check で拒否）
-- カレンダー: 合っていない住所 → 0行（理由を返さない）／出ていない公演は出ない／在籍していない学校の行事は出ない
--             ★返る列に 体調・記録の列が1つも無いこと（列の一覧で確かめる）
--             取り消された稽古は canceled=true で返る（カレンダーから消えることを画面が決める）
-- 変わったもの: 見たあとに数が0になる／ほかの人の既読は見えない／運営に既読は見えない（この表に運営のポリシーが無い）

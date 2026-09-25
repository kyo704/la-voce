-- 20260923_29 市民オペラ・養成の現場に合わせる（2026-09-23 の調べから）
-- 根拠: 区民参加オペラ CITTADINO の稽古の形（全30回・週1回→週2回・顔合せ→合唱合同→粗通し→通し→オケ合わせ→ゲネプロ→本番）
--       川崎市民オペラ合唱団の演目／藤原歌劇団のコレペティ育成
-- ★12・18・20 を当てたあとに当てる

-- ① 稽古の種類を増やす（本番にあるのは rehearsal/call/show の3つだけだった）
alter table public.koen_sessions drop constraint if exists koen_sessions_kind_check;
alter table public.koen_sessions add constraint koen_sessions_kind_check check (kind in (
  'kickoff',      -- 顔合せ
  'music',        -- 音楽稽古（譜読み・音取り）
  'rehearsal',    -- 立ち稽古
  'chorus',       -- 合唱との合同稽古
  'runthrough',   -- 粗通し・通し
  'orchestra',    -- オケ合わせ
  'dress',        -- ゲネプロ
  'call',         -- 入り・集合
  'show'          -- 本番
));

-- ② 代役（アンダースタディ）を人に印として持つ
alter table public.koen_members add column if not exists is_understudy boolean not null default false;
alter table public.koen_members add column if not exists covers_slot_id uuid references public.koen_slots(id) on delete set null;
-- ★「交代の枠（alt）」は 同じ役を交互に歌う形。★代役は 出ない前提で控える形。別のものとして持つ

-- ③ 参加費（出演料の逆。市民オペラで実際にある）
create table if not exists public.koen_dues (
  id             uuid primary key default gen_random_uuid(),
  koen_id        uuid references public.koen(id) on delete set null,
  koen_title_at  text,
  member_id      uuid references public.koen_members(id) on delete set null,
  member_name_at text,
  amount_yen     integer not null check (amount_yen >= 0),
  kind           text not null check (kind in ('participation','insurance','score','costume','other')),
  waived         boolean not null default false,        -- 免除（キャストは免除、などの形）
  memo           text,
  paid_on        date,
  created_at     timestamptz not null default now()
);
alter table public.koen_dues enable row level security;
revoke all on public.koen_dues from anon, authenticated;
grant select on public.koen_dues to authenticated;
grant insert, update, delete on public.koen_dues to authenticated;
drop policy if exists koen_dues_select on public.koen_dues;
create policy koen_dues_select on public.koen_dues for select to authenticated using (
  (koen_id is not null and public.koen_can_manage(koen_id))
  or exists (select 1 from public.koen_members m where m.id = koen_dues.member_id and m.user_id = auth.uid())
);
drop policy if exists koen_dues_write on public.koen_dues;
create policy koen_dues_write on public.koen_dues for all to authenticated
  using (koen_id is not null and public.koen_can_manage(koen_id))
  with check (koen_id is not null and public.koen_can_manage(koen_id));

-- ④ 長い稽古の出欠のまとめ（★率（％）を出さない。回数だけ。色で警告しない）
create or replace function public.koen_attendance_counts(p_koen uuid)
returns table(member_id uuid, name_at text, present integer, late integer, excused integer, absent integer, sessions integer)
language sql stable security definer set search_path to 'public' as $$
  select m.id, m.name_at,
         count(*) filter (where a.status = 'present')::int,
         count(*) filter (where a.status = 'late')::int,
         count(*) filter (where a.status = 'excused')::int,
         count(*) filter (where a.status = 'absent')::int,
         (select count(*)::int from public.koen_sessions s
           where s.koen_id = p_koen and s.canceled_at is null and s.kind <> 'show')
    from public.koen_members m
    left join public.koen_attendance a on a.member_id = m.id
    left join public.koen_sessions s2 on s2.id = a.session_id and s2.koen_id = p_koen
   where m.koen_id = p_koen and m.left_at is null and public.koen_can_manage(p_koen)
   group by m.id, m.name_at
   order by m.name_at;
$$;
revoke all on function public.koen_attendance_counts(uuid) from public, anon;
grant execute on function public.koen_attendance_counts(uuid) to authenticated;

-- ⑤ 代役を含めた香盤表の見え方（誰が本役で、誰が控えか）
create or replace function public.koen_cast_list(p_koen uuid)
returns table(slot_label text, group_kind text, member_name text, is_understudy boolean)
language sql stable security definer set search_path to 'public' as $$
  select sl.label, sl.group_kind, m.name_at, m.is_understudy
    from public.koen_slots sl
    left join public.koen_cells c on c.slot_id = sl.id
    left join public.koen_members m on m.id = c.member_id
   where sl.koen_id = p_koen and public.koen_can_see(p_koen)
  union all
  select sl.label, sl.group_kind, m.name_at, true
    from public.koen_members m
    join public.koen_slots sl on sl.id = m.covers_slot_id
   where m.koen_id = p_koen and m.is_understudy and m.left_at is null and public.koen_can_see(p_koen)
   order by 2, 1, 4;
$$;
revoke all on function public.koen_cast_list(uuid) from public, anon;
grant execute on function public.koen_cast_list(uuid) to authenticated;

-- 確かめ（実在の試しの利用者で）
-- 稽古の種類: 'orchestra'・'dress'・'chorus' で稽古を作れる／綴りが違うと check 違反
-- 代役: 代役の人を作り、本役の枠を指す → koen_cast_list に「控え」として並ぶ（本役は消えない）
-- 参加費: 運営が入れられる／本人にも見える／ほかの出演者には見えない／免除の印が付く
-- 出欠のまとめ: ★率（％）の列が1つも無い。回数だけ。本番（show）は分母に入れない
-- 公演を消しても 参加費の記録は残る（koen_id が null・題が残る）

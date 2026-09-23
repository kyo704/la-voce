-- 20260923_28 編成（オーケストラ・伴奏）を 香盤表に出せるようにする
-- 裁定174 の続き。★歌手だけでなく、オケ・ピアノ・コレペティ・副指揮も 香盤表に要る（坂本さん 2026-09-23）
-- ★26・27 のあとに当てる

-- ① 作品の編成（1行＝1つのパート）
create table if not exists public.work_instruments (
  id         uuid primary key default gen_random_uuid(),
  work_id    uuid not null references public.works(id) on delete cascade,
  part       text not null,                      -- 「フルート」「ホルン」「ピアノ」「チェンバロ」
  count      integer not null default 1 check (count between 0 and 200),
  section    text not null check (section in ('woodwind','brass','percussion','keyboard','harp','strings','banda','continuo','other')),
  doubling   text,                               -- 持ち替え（ピッコロ・コーラングレ・バスクラ）
  is_optional boolean not null default false,    -- 省けるパート
  note       text,
  sort_order integer not null default 0
);
create unique index if not exists work_instruments_unique on public.work_instruments(work_id, part, coalesce(doubling,''));
alter table public.work_instruments enable row level security;
revoke all on public.work_instruments from anon, authenticated;
grant select on public.work_instruments to authenticated;
drop policy if exists work_instruments_select on public.work_instruments;
create policy work_instruments_select on public.work_instruments for select to authenticated
  using (exists (select 1 from public.works w where w.id = work_instruments.work_id and (w.is_public or w.owner_user_id = auth.uid())));
-- 書くのは upsert_work（サーバ）だけ

-- ② 場面ごとの「出る編成」。既定（null）は 全体の編成。例外だけ書く
alter table public.work_scenes add column if not exists forces text[];
-- 例: ['通奏低音']（レチタティーヴォ）／['ピアノ']（稽古の形）／['管弦楽','バンダ']（舞台上の楽隊つき）

-- ③ 香盤表の枠に「誰の枠か」を足す（歌手・オケ・スタッフを分けて出す）
alter table public.koen_slots add column if not exists group_kind text not null default 'cast'
  check (group_kind in ('cast','orchestra','staff'));

-- ④ 雛形から下書きを作るとき、★オケと伴奏の枠も作る（27 の koen_apply_work を差し替え）
create or replace function public.koen_apply_work(p_koen uuid, p_work uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; v_kind text;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_koen) then raise exception 'ALREADY_HAS_ROWS'; end if;
  if not exists (select 1 from public.works w where w.id = p_work and (w.is_public or w.owner_user_id = auth.uid())) then
    raise exception 'NO_SUCH_WORK';
  end if;
  select k.kind into v_kind from public.koen k where k.id = p_koen;

  -- 歌手・役の枠
  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_koen, r.label, case when r.is_group then 'many' else 'one' end, 'cast', r.sort_order
    from public.work_roles r where r.work_id = p_work;

  -- ★オーケストラ・伴奏の枠（人数は「何人かの枠」で持つ。1人のパートは1人の枠）
  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_koen,
         r.part || case when r.doubling is not null then '（'||r.doubling||'持ち替え）' else '' end
                || case when r.count > 1 then ' ×'||r.count::text else '' end,
         case when r.count > 1 then 'many' else 'one' end, 'orchestra', 1000 + r.sort_order
    from public.work_instruments r where r.work_id = p_work;

  -- ★いつも要る役（稽古と本番の運び。空の枠として作っておく）
  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order) values
    (p_koen, '指揮',           'one',  'staff', 2001),
    (p_koen, '副指揮',         'one',  'staff', 2002),
    (p_koen, 'コレペティ（稽古ピアノ）', 'many', 'staff', 2003),
    (p_koen, '演出',           'one',  'staff', 2004),
    (p_koen, '舞台監督',       'one',  'staff', 2005);

  -- 場面（＝番号・楽章）
  insert into public.koen_rows(koen_id, label, group_label, minutes, sort_order)
  select p_koen, s.label, s.group_label, s.minutes, s.sort_order
    from public.work_scenes s where s.work_id = p_work;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.koen_apply_work(uuid, uuid) from public, anon;
grant execute on function public.koen_apply_work(uuid, uuid) to authenticated;

-- ⑤ ピットの香盤表（どの場面に どのパートが出るか）
--    forces が空の場面は「全体の編成」。書いてある場面はそれだけ
create or replace function public.koen_pit_sheet(p_koen uuid, p_work uuid)
returns table(scene text, group_label text, parts text)
language sql stable security definer set search_path to 'public' as $$
  select s.label, s.group_label,
         case when s.forces is null or array_length(s.forces,1) is null
              then coalesce((select string_agg(i.part || case when i.count>1 then '×'||i.count::text else '' end, '・' order by i.sort_order)
                               from public.work_instruments i where i.work_id = p_work), '（編成の登録なし）')
              else array_to_string(s.forces, '・') end
    from public.work_scenes s
   where s.work_id = p_work and public.koen_can_see(p_koen)
   order by s.sort_order;
$$;
revoke all on function public.koen_pit_sheet(uuid, uuid) from public, anon;
grant execute on function public.koen_pit_sheet(uuid, uuid) to authenticated;

-- ⑥ 27 の upsert_work に「instruments」を足す（作品の JSON から編成も入れる）
create or replace function public.upsert_work_instruments(p_work_id uuid, p_items jsonb)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0;
begin
  delete from public.work_instruments where work_id = p_work_id;
  insert into public.work_instruments(work_id, part, count, section, doubling, is_optional, note, sort_order)
  select p_work_id, btrim(t.part), coalesce(t.count,1), t.section, nullif(t.doubling,''), coalesce(t.is_optional,false), nullif(t.note,''), t.ord
    from rows from (jsonb_to_recordset(p_items)
         as (part text, count integer, section text, doubling text, is_optional boolean, note text))
         with ordinality as t(part, count, section, doubling, is_optional, note, ord)
   where btrim(coalesce(t.part,'')) <> '';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.upsert_work_instruments(uuid, jsonb) from public, anon, authenticated;
-- ★upsert_work の最後で、p_work に 'instruments' があれば これを呼ぶ（27 を当てたあとに差し替える）

-- 確かめ（試しの環境で）
-- 編成を入れた作品で koen_apply_work → 枠が 歌手・オケ・スタッフの3つに分かれて作られる
-- koen_pit_sheet → 場面ごとに 出るパートが並ぶ。forces を書いた場面は それだけが出る
-- 編成の無い作品 → 「（編成の登録なし）」と出る（空にしない）
-- 同じパートを2回入れる → unique 違反（フルートとフルート（ピッコロ持ち替え）は 別として入る）

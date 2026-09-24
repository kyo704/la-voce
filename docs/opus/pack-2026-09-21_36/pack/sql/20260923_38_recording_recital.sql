-- 20260923_38 種類を2つ足す（収録・発表会）
-- なぜ: ★隣接市場のいちばん近いところが 声優の養成所。収録の香盤表は「巻（シーン）× 役」で、いまの作りとほぼ同じ
--       発表会は 音大・教室でいちばん数が多い。「出演順 × 出演者」＋★伴奏者
-- 本番で確かめた前提（2026-09-23 Opus）:
--   koen.kind / works.kind の許容は9種（opera・chorus・drama・orchestra・gala・chamber・band・dance・other）
--   koen_slots.group_kind は cast・orchestra・staff（sql/28 が当たっている）
--   koen_calls（呼び出し）に call_at・dismiss_at・row_id が既にある → ★分刻みの呼び出しは足さずに済む
--   koen_cells は row_id × slot_id（誰がどの場面に出るか）→ ★収録も発表会も この形で足りる

-- ① 種類を2つ足す（既にある9種は残す）
alter table public.koen drop constraint if exists koen_kind_check;
alter table public.koen add constraint koen_kind_check check (kind in
  ('opera','chorus','drama','orchestra','gala','chamber','band','dance',
   'recording',   -- ★収録（アフレコ・ナレーション・レコーディング）
   'recital',     -- ★発表会・試演会
   'other'));
alter table public.works drop constraint if exists works_kind_check;
alter table public.works add constraint works_kind_check check (kind in
  ('opera','chorus','drama','orchestra','gala','chamber','band','dance','recording','recital','other'));

-- ② 行（場面）に 時刻の目安を持てるようにする
--    収録: 巻ごとの入り時刻／発表会: 曲ごとの開始の目安。★決めない運用もあるので任意
alter table public.koen_rows add column if not exists time_from time;
alter table public.koen_rows add column if not exists time_to   time;

-- ③ 枠の種類に「伴奏」を足す（発表会・収録で要る。オケとは呼び出しが違う）
alter table public.koen_slots drop constraint if exists koen_slots_group_kind_check;
alter table public.koen_slots add constraint koen_slots_group_kind_check check (group_kind in
  ('cast','orchestra','accompanist','staff'));
-- ★伴奏（accompanist）＝ ピアノ伴奏・コレペティ・弾き振り。1曲ごとに替わることがある

-- ④ 種類ごとの ことば（画面の見出し。台帳に持つと画面で分岐しなくて済む）
create table if not exists public.koen_kind_words (
  kind      text primary key,
  row_word  text not null,   -- 行の呼び方
  col_word  text not null,   -- 列の呼び方
  cast_word text not null,   -- 出る人の呼び方
  tbl_word  text not null    -- 表の呼び方
);
insert into public.koen_kind_words(kind,row_word,col_word,cast_word,tbl_word) values
  ('opera','場面','役','配役','香盤表'),
  ('chorus','曲','パート','担当','香盤表'),
  ('drama','場','登場人物','配役','香盤表'),
  ('orchestra','楽章','パート','担当','編成表'),
  ('gala','曲目','出演者','出演','進行表'),
  ('chamber','楽章','パート','担当','編成表'),
  ('band','曲目','パート','担当','編成表'),
  ('dance','場面','役','配役','香盤表'),
  ('recording','巻（シーン）','役','配役','収録の香盤表'),
  ('recital','出演順','出演者','出演','進行表'),
  ('other','項目','担当','担当','表')
on conflict (kind) do update set row_word=excluded.row_word, col_word=excluded.col_word,
  cast_word=excluded.cast_word, tbl_word=excluded.tbl_word;
alter table public.koen_kind_words enable row level security;
revoke all on public.koen_kind_words from anon, authenticated;
grant select on public.koen_kind_words to authenticated;
drop policy if exists koen_kind_words_read on public.koen_kind_words;
create policy koen_kind_words_read on public.koen_kind_words for select to authenticated using (true);

-- ⑤ 収録・発表会の下書きを作る（作品の雛形が無くても始められる）
create or replace function public.koen_seed_simple(p_koen uuid, p_rows text[], p_slots text[])
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; v_kind text;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if exists (select 1 from public.koen_rows r where r.koen_id = p_koen) then raise exception 'ALREADY_HAS_ROWS'; end if;
  select k.kind into v_kind from public.koen k where k.id = p_koen;

  insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
  select p_koen, s, 'one', 'cast', i from unnest(coalesce(p_slots,'{}')) with ordinality as t(s,i);

  -- ★発表会・収録には 伴奏の枠を必ず1つ作る（無いと その日の呼び出しに入らない）
  if v_kind in ('recital','recording') then
    insert into public.koen_slots(koen_id, label, slot_kind, group_kind, sort_order)
    values (p_koen, case when v_kind='recital' then 'ピアノ伴奏' else '音響（ミキサー）' end, 'many', 'accompanist', 900);
  end if;

  insert into public.koen_rows(koen_id, label, sort_order)
  select p_koen, r, i from unnest(coalesce(p_rows,'{}')) with ordinality as t(r,i);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.koen_seed_simple(uuid, text[], text[]) from public, anon;
grant execute on function public.koen_seed_simple(uuid, text[], text[]) to authenticated;

-- 確かめ（試しの環境で）
-- kind='recording' の公演を作る → 通る／綴り違い（'recordings'）→ check 違反
-- koen_seed_simple で巻3つ・役4つ → 行3・列4 ＋ ★音響の枠が1つ増える
-- kind='recital' → ★ピアノ伴奏の枠が増える
-- koen_kind_words: 'recording' の行の呼び方が「巻（シーン）」
-- 既にある9種の公演が、当てたあとも壊れていない（kind はそのまま通る）
-- time_from/time_to を入れない公演が、いままでどおり動く（任意の列）

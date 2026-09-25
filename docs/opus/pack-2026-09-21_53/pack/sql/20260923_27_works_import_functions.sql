-- 20260923_27 作品のデータを入れる関数（裁定174）。★26 のあとに当てる
-- 目的: ①人が作る層3（場面×役）を、1つの JSON で一度に入れる
--       ②取り込み（MusicBrainz・Wikidata）を、重複なし・やり直しできる形で入れる
-- ★どちらも サーバ（service role）から呼ぶ。画面からは呼ばせない

-- ───────────────────────────────────────────
-- ① 1作品をまるごと入れる（人が作った層3・取り込みの両方で使う）
--    同じ (source, source_id) があれば 中身を入れ替える（やり直せる）
--    ★利用者が作った雛形（source='user'）は、この関数では触らない
-- 形（p_work の例）:
-- {
--   "title":"フィガロの結婚", "composer":"モーツァルト", "composer_sort":"Mozart, Wolfgang Amadeus",
--   "kind":"opera", "year_written":1786, "source":"hand", "source_id":"figaro",
--   "instrumentation":["管弦楽"],
--   "roles":[{"label":"スザンナ"},{"label":"フィガロ"},{"label":"合唱","is_group":true}],
--   "scenes":[{"label":"第1番 二重唱","group_label":"第1幕","minutes":4,"roles":["スザンナ","フィガロ"]},
--             {"label":"第2番 カヴァティーナ","group_label":"第1幕","minutes":3,"roles":["フィガロ"]}]
-- }
-- ───────────────────────────────────────────
create or replace function public.upsert_work(p_work jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_id uuid; v_source text; v_source_id text; v_kind text; n_scene integer := 0;
begin
  v_source    := coalesce(p_work ->> 'source', 'hand');
  v_source_id := nullif(p_work ->> 'source_id', '');
  v_kind      := p_work ->> 'kind';
  if p_work ->> 'title' is null or btrim(p_work ->> 'title') = '' then raise exception 'TITLE_REQUIRED'; end if;
  if v_kind not in ('opera','chorus','drama','orchestra','gala','chamber','band','dance','other') then raise exception 'BAD_KIND: %', v_kind; end if;
  if v_source = 'user' then raise exception 'USER_WORKS_NOT_HERE'; end if;   -- 利用者の雛形は画面から作る

  -- 作品（同じ出どころの id があれば入れ替え）
  if v_source_id is not null then
    select w.id into v_id from public.works w where w.source = v_source and w.source_id = v_source_id;
  end if;
  if v_id is null then
    insert into public.works(title, composer, composer_sort, kind, year_written, is_public,
                             source, source_id, instrumentation, imported_at)
    values (btrim(p_work ->> 'title'), nullif(p_work ->> 'composer',''), nullif(p_work ->> 'composer_sort',''),
            v_kind, (p_work ->> 'year_written')::int, true, v_source, v_source_id,
            case when p_work ? 'instrumentation'
                 then array(select jsonb_array_elements_text(p_work -> 'instrumentation')) end,
            now())
    returning id into v_id;
  else
    update public.works set title = btrim(p_work ->> 'title'),
           composer = nullif(p_work ->> 'composer',''), composer_sort = nullif(p_work ->> 'composer_sort',''),
           kind = v_kind, year_written = (p_work ->> 'year_written')::int,
           instrumentation = case when p_work ? 'instrumentation'
                                  then array(select jsonb_array_elements_text(p_work -> 'instrumentation')) else instrumentation end,
           imported_at = now()
     where id = v_id;
    -- 入れ替えのときは 役と場面を作り直す（公演に当てた表は別物なので影響しない）
    delete from public.work_scenes where work_id = v_id;
    delete from public.work_roles  where work_id = v_id;
  end if;

  -- 役
  if p_work ? 'roles' then
    insert into public.work_roles(work_id, label, is_group, sort_order)
    select v_id, btrim(r.label), coalesce(r.is_group, false), r.ord
      -- ★WITH ORDINALITY は列の定義と並べて書けない。ROWS FROM(...) の中に入れる（2026-09-23 本番で確認）
      from rows from (jsonb_to_recordset(p_work -> 'roles') as (label text, is_group boolean))
           with ordinality as r(label, is_group, ord)
     where btrim(coalesce(r.label,'')) <> '';
  end if;

  -- 場面（＝楽章・番号）
  if p_work ? 'scenes' then
    insert into public.work_scenes(work_id, label, group_label, minutes, sort_order)
    select v_id, btrim(sc0.label), nullif(sc0.group_label,''), sc0.minutes, sc0.ord
      from rows from (jsonb_to_recordset(p_work -> 'scenes') as (label text, group_label text, minutes integer))
           with ordinality as sc0(label, group_label, minutes, ord)
     where btrim(coalesce(sc0.label,'')) <> '';
    get diagnostics n_scene = row_count;

    -- 場面 × 役（役の名前で結ぶ。★名前が役の一覧に無ければ そこで止める＝取りこぼしを黙って作らない）
    insert into public.work_scene_roles(scene_id, role_id)
    select sc.id, ro.id
      from jsonb_array_elements(p_work -> 'scenes') with ordinality as e(scene, ord)
      join public.work_scenes sc on sc.work_id = v_id and sc.sort_order = e.ord
      cross join lateral jsonb_array_elements_text(coalesce(e.scene -> 'roles', '[]'::jsonb)) as rn(label)
      join public.work_roles ro on ro.work_id = v_id and ro.label = btrim(rn.label)
     on conflict do nothing;

    if exists (
      select 1 from jsonb_array_elements(p_work -> 'scenes') as e(scene)
      cross join lateral jsonb_array_elements_text(coalesce(e.scene -> 'roles', '[]'::jsonb)) as rn(label)
      where not exists (select 1 from public.work_roles ro where ro.work_id = v_id and ro.label = btrim(rn.label))
    ) then
      raise exception 'ROLE_NOT_IN_LIST: 場面に、役の一覧に無い名前があります（作品 %）', p_work ->> 'title';
    end if;
  end if;

  -- 揃い方を付け直す
  update public.works w set completeness = case
      when exists (select 1 from public.work_scene_roles x join public.work_scenes s on s.id = x.scene_id where s.work_id = v_id) then 'full'
      when exists (select 1 from public.work_roles  r where r.work_id = v_id) then 'roles'
      when exists (select 1 from public.work_scenes s where s.work_id = v_id) then 'movements'
      else 'title' end
   where w.id = v_id;

  return v_id;
end $$;
revoke all on function public.upsert_work(jsonb) from public, anon, authenticated;   -- ★サーバだけ

-- ───────────────────────────────────────────
-- ② まとめて入れる（取り込み。記録を残し、途中で失敗しても何件入ったか分かる）
-- ───────────────────────────────────────────
create or replace function public.import_works(p_source text, p_scope text, p_works jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_import uuid; w jsonb; n integer := 0; v_err text; v_bad jsonb := '[]'::jsonb;
begin
  if p_source not in ('musicbrainz','wikidata') then raise exception 'BAD_SOURCE'; end if;
  insert into public.works_imports(source, scope) values (p_source, p_scope) returning id into v_import;
  for w in select * from jsonb_array_elements(p_works) loop
    begin
      perform public.upsert_work(w || jsonb_build_object('source', p_source));
      n := n + 1;
    exception when others then
      v_err := sqlerrm;
      v_bad := v_bad || jsonb_build_object('title', w ->> 'title', 'why', left(v_err, 200));   -- ★握りつぶさない。返して残す
    end;
  end loop;
  update public.works_imports set rows_added = n, ended_at = now(),
         note = case when jsonb_array_length(v_bad) = 0 then null else v_bad::text end
   where id = v_import;
  return jsonb_build_object('import_id', v_import, 'added', n, 'failed', v_bad);
end $$;
revoke all on function public.import_works(text, text, jsonb) from public, anon, authenticated;   -- ★サーバだけ

-- ───────────────────────────────────────────
-- ③ 取り込みを丸ごと戻す（入れ方を間違えたとき。★人が作った作品と利用者の雛形は消さない）
-- ───────────────────────────────────────────
create or replace function public.undo_works_import(p_import uuid)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare v_source text; v_since timestamptz; v_until timestamptz; n integer;
begin
  select i.source, i.started_at, coalesce(i.ended_at, now()) into v_source, v_since, v_until
    from public.works_imports i where i.id = p_import;
  if v_source is null then raise exception 'NO_SUCH_IMPORT'; end if;
  -- ★公演に当てた表（koen_rows・koen_slots）は 雛形と別の行なので、作品を消しても公演は壊れない
  delete from public.works w
   where w.source = v_source and w.imported_at between v_since and v_until;
  get diagnostics n = row_count;
  update public.works_imports set note = coalesce(note,'') || ' / 取り消し ' || n::text || '件' where id = p_import;
  return n;
end $$;
revoke all on function public.undo_works_import(uuid) from public, anon, authenticated;

-- ───────────────────────────────────────────
-- ④ 画面から探す（名前・作曲家の部分一致。★出すのは公開の作品と自分の雛形だけ）
-- ───────────────────────────────────────────
create or replace function public.search_works(p_q text, p_kind text default null, p_ready_only boolean default false)
returns table(id uuid, title text, composer text, kind text, completeness text, scenes integer, roles integer)
language sql stable security definer set search_path to 'public' as $$
  select w.id, w.title, w.composer, w.kind, w.completeness,
         (select count(*)::int from public.work_scenes s where s.work_id = w.id),
         (select count(*)::int from public.work_roles  r where r.work_id = w.id)
    from public.works w
   where (w.is_public or w.owner_user_id = auth.uid())
     and (p_kind is null or w.kind = p_kind)
     and (not p_ready_only or w.completeness = 'full')
     and (p_q is null or btrim(p_q) = '' or w.title ilike '%'||btrim(p_q)||'%' or coalesce(w.composer,'') ilike '%'||btrim(p_q)||'%')
   order by (w.completeness = 'full') desc, w.composer nulls last, w.title
   limit 50;
$$;
revoke all on function public.search_works(text, text, boolean) from public, anon;
grant execute on function public.search_works(text, text, boolean) to authenticated;

-- 確かめ（試しの環境で）
-- ① 人が作る: upsert_work(フィガロの JSON) → works 1・work_roles n・work_scenes m・completeness='full'
--    同じ source_id でもう一度 → 行が増えず、中身が入れ替わる
--    場面の roles に、役の一覧に無い名前を入れる → ROLE_NOT_IN_LIST で止まる（黙って取りこぼさない）
--    source='user' を渡す → USER_WORKS_NOT_HERE
-- ② 取り込み: import_works('musicbrainz','composer:Mozart', 配列) → added と failed が返る
--    わざと kind を壊した1件を混ぜる → その1件だけ failed に入り、ほかは入る
-- ③ 取り消し: undo_works_import(その id) → 取り込んだ分だけ消える。hand・user の作品は残る
-- ④ 探す: search_works('フィガロ') → 部分一致で出る／p_ready_only=true なら full だけ

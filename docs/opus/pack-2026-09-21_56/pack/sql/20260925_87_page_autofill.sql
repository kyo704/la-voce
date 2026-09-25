-- 20260925_87 「アプリから 引用」（★どの型でも 同じ 中身を 渡す）
-- 坂本さんの 指示（2026-09-25）:
--   ★「アプリから引用」に する／★これを ★ほかの 全部の 型にも 効かせる
--   ★できないものは ★できないものとして 分けてよい
-- ★★考え方: ★型ごとに 埋め方を 書かない。★1本の 関数が ★同じ形で 返し、
--            ★型は「★どのスロットに 入れるか」だけ 持つ
--   ★理由: ★54型 それぞれに 埋め方を 書くと ★54回 直すことに なります
-- ★82・83・86 のあと

-- ① ★アプリから 引ける もの（★1本で 返す）
create or replace function public.page_autofill()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'name',  (select coalesce(nullif(btrim(coalesce(p.display_name,'')),''),
                              nullif(btrim(coalesce(p.name,'')),''))
                from public.profiles p where p.id = auth.uid()),
    'occupation', (select p.occupation from public.profiles p where p.id = auth.uid()),
    -- ★次の 本番（★本人が 登録した ものだけ・裁定その57）
    'next_event', (select jsonb_build_object('on', f.performed_on, 'label', f.label)
                     from public.performances f
                    where f.user_id = auth.uid() and f.org_event_id is null
                      and f.performed_on >= (now() at time zone 'Asia/Tokyo')::date
                    order by f.performed_on limit 1),
    -- ★出演歴（★終わった 本番）
    'past_events', (select coalesce(jsonb_agg(jsonb_build_object('on', x.performed_on, 'label', x.label)
                                              order by x.performed_on desc), '[]'::jsonb)
                      from (select f.performed_on, f.label from public.performances f
                             where f.user_id = auth.uid() and f.org_event_id is null
                               and f.performed_on < (now() at time zone 'Asia/Tokyo')::date
                             order by f.performed_on desc limit 12) x),
    -- ★レパートリー（★さらい中・本番済みだけ）
    'repertoire', (select coalesce(jsonb_agg(jsonb_build_object('name', r.repertoire_name,
                                                               'composer', r.composer)
                                             order by r.repertoire_name), '[]'::jsonb)
                     from public.repertoire_tessitura r
                    where r.user_id = auth.uid()
                      and coalesce(r.status,'') <> 'しばらく置く'),
    'photos', (select coalesce(jsonb_agg(jsonb_build_object('path', ph.path, 'shape', ph.shape)
                                         order by ph.sort_order), '[]'::jsonb)
                 from public.portfolio_photos ph
                where ph.user_id = auth.uid() and ph.exif_cleared_at is not null)
  );
$$;
revoke all on function public.page_autofill() from public, anon;
grant execute on function public.page_autofill() to authenticated;
-- ★★体調・記録は 1つも 入りません（★この関数が 触る表に ありません）

-- ② ★型ごとに「★どのスロットが あるか」を 持つ（★埋め方は 持たない）
create table if not exists public.page_template_slots (
  type_key   text not null,                  -- t01 … t74
  slot       text not null,                  -- name／occupation／next_event／past_events／repertoire／photos
  max_items  integer,                        -- ★並べられる 数（★名刺型は 少ない）
  primary key (type_key, slot)
);
alter table public.page_template_slots enable row level security;
revoke all on public.page_template_slots from anon, authenticated;
grant select on public.page_template_slots to authenticated;
drop policy if exists page_template_slots_read on public.page_template_slots;
create policy page_template_slots_read on public.page_template_slots for select to authenticated using (true);
-- ★型の 表です。★誰の ものでも ありません（★値段表と 同じ）

-- ③ ★その型で 何が 埋まるかを 返す（★画面は これを 見る）
create or replace function public.page_autofill_for(p_type text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  with all_data as (select public.page_autofill() as d),
  slots as (select slot, max_items from public.page_template_slots where type_key = p_type)
  select coalesce(
    (select jsonb_object_agg(s.slot,
        case when jsonb_typeof(a.d -> s.slot) = 'array' and s.max_items is not null
             then (select jsonb_agg(v) from (select v from jsonb_array_elements(a.d -> s.slot) v
                                              limit s.max_items) z)
             else a.d -> s.slot end)
       from slots s, all_data a),
    '{}'::jsonb);
$$;
revoke all on function public.page_autofill_for(text) from public, anon;
grant execute on function public.page_autofill_for(text) to authenticated;

-- ④ ★どの型に 何が 無いか（★「できないもの」を はっきり 出す）
create or replace function public.page_slots_missing(p_type text)
returns table(slot text)
language sql stable security definer set search_path to 'public' as $$
  select s.slot
    from (values ('name'),('occupation'),('next_event'),('past_events'),('repertoire'),('photos')) as s(slot)
   where not exists (select 1 from public.page_template_slots t
                      where t.type_key = p_type and t.slot = s.slot);
$$;
revoke all on function public.page_slots_missing(text) from public, anon;
grant execute on function public.page_slots_missing(text) to authenticated;
-- ★画面は これを 見て「★この型では 出ません」と 書けます（★黙って 落とさない）

-- 確かめ（試しの環境で）
-- page_autofill() → 名前・次の本番・出演歴・レパートリー・写真が 返る
-- ★体調・記録は 1つも 入らない
-- 型に slot を 入れる → page_autofill_for がその分だけ 返す
-- ★max_items で 数が 切れる（★名刺型は 3件など）
-- ★page_slots_missing → ★その型に 無いものが 並ぶ
-- ★学校の 行事（org_event_id が ある もの）は ★入らない（その57）

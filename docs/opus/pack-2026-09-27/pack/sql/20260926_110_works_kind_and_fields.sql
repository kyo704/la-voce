-- 20260926_110 ★作品の 雛形を ★15種類に 広げ、★捨てて いた 列を 拾います
--
-- ★★なぜ 要るか（★2026-09-26 に 試しの Postgres で 確かめました）
--   ★作品データを 2,051作 作りました。★ところが 本番の works.kind は 9種類しか 受け取れません。
--   ★★1,024作（★ほぼ 半分）が ★BAD_KIND で 弾かれます:
--     kyogen 269／noh 240／kabuki 123／musical 112／gagaku 102／
--     song_cycle 95／bunraku 62／kumiodori 21
--   ★確かめ: select public.upsert_work(jsonb_build_object(
--              'title','羽衣（能）','kind','noh','source','hand','source_id','__t__'));
--            → ★ERROR: BAD_KIND: noh
--
--   ★★おかしな ところ ──
--     ★koen_members.school_role には 既に『シテ方・ワキ方・狂言方・人形遣い・太夫』が あり、
--     ★works.school には『観世流・大蔵流』が あります。
--     ★★伝統芸能を 迎える 用意は できて いるのに ★kind が 追いついて いませんでした。
--
-- ★★もう1つ ── ★upsert_work が 捨てて いた 列が あります
--   ★title_original（原題）・aliases（別名）・duration_min（分）・language（ことば）・
--     school（流派）・variant（小書）── ★入れても 捨てて いました。
--   ★『ノルマ』を 原題 Norma で 探せない、★上演時間が 出ない ── ★その もとです。
--
-- ★★この 移行の 書き方について（★2026-09-26 の しくじり）
--   ★はじめ 関数を ★まるごと 書き直しました。★そのとき 元に あった
--     ★① completeness の 付け直し
--     ★② ROLE_NOT_IN_LIST の 検査（★場面に 役の一覧に 無い 名前が あれば 止める）
--   ★★この 2つを 落として いました。★②は『取りこぼしを 黙って 作らない』ための 守りです。
--   ★★だから この 移行は ★元の 関数を 1行ずつ 写し、★足す ところ だけ 変えて あります。
--   ★→ 物差し M21g ★動いて いる ものを 書き直す ときは、★元を 写して 差分だけ 変える
--
-- ★当てる 順: ★いつでも（★ほかに 頼って いません）

-- ═══ ① kind を 15種類に ═══
alter table public.works drop constraint if exists works_kind_check;
alter table public.works add constraint works_kind_check check (kind in (
  -- ★もとから あった もの
  'opera','chorus','drama','orchestra','gala','chamber','band','dance','other',
  -- ★足す もの
  'musical',                                  -- ★ミュージカル
  'song_cycle',                               -- ★歌曲集（★声楽の 人に いちばん 近い）
  -- ★★日本の 伝統芸能 ── ★稽古の 言葉が 種類ごとに 違うので 分けます
  'noh',        -- 能（★稽古＝申合せ）
  'kyogen',     -- 狂言（★稽古＝申合せ）
  'kabuki',     -- 歌舞伎（★稽古＝附立・総ざらい・舞台稽古）
  'bunraku',    -- 文楽（★稽古＝床稽古・人形稽古・総稽古）
  'gagaku',     -- 雅楽（★稽古＝習礼（しゅらい）★『ゲネプロ』とは 言いません）
  'kumiodori'   -- 組踊
));

-- ═══ ② 足りない 列 ═══
alter table public.works add column if not exists edition text;
comment on column public.works.edition is
  '★版。★同じ 題名でも 版で 曲と 場面が 変わります（例：オペラ座の怪人 2021新演出版／エリザベート 宝塚版）。★variant（小書・型）とは 別です';
alter table public.works add column if not exists note text;
comment on column public.works.note is
  '★覚え書き。★★歌詞・対訳・あらすじは 入れません（裁定174）';

-- ═══ ②b ★役の 声種（2026-09-26 坂本さんの ご指摘『声種が 入ってない』）═══
alter table public.work_roles add column if not exists voice text;
comment on column public.work_roles.voice is
  '★声種。ソプラノ／メゾ／アルト／テノール／バリトン／バス／バスバリトン／カウンターテナー ほか。'
  '★★合唱などの 団体（is_group）には 入れません ── ★声部は 公演ごとに 決めます。'
  '★★歌わない 役（バレエの 踊り手・戯曲の 俳優）にも 入れません';

-- ═══ ③ 取り込みで 捨てて いた 列を 拾う ═══
--   ★★下は 20260923_27 の upsert_work を 写し、★印の ところ だけ 足した ものです

create or replace function public.upsert_work(p_work jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare
  v_id uuid; v_source text; v_source_id text; v_kind text; n_scene integer := 0;
begin
  v_source    := coalesce(p_work ->> 'source', 'hand');
  v_source_id := nullif(p_work ->> 'source_id', '');
  v_kind      := p_work ->> 'kind';
  if p_work ->> 'title' is null or btrim(p_work ->> 'title') = '' then raise exception 'TITLE_REQUIRED'; end if;
  -- ★★kind の 一覧を ★ここに 書かない。★表の しばり（works_kind_check）に 任せます。
  --   ★2か所に 書くと ★片方だけ 足して ずれます ── ★2026-09-26 に それが 起きました
  if v_kind is null or btrim(v_kind) = '' then raise exception 'KIND_REQUIRED'; end if;
  if v_source = 'user' then raise exception 'USER_WORKS_NOT_HERE'; end if;   -- 利用者の雛形は画面から作る

  -- 作品（同じ出どころの id があれば入れ替え）
  if v_source_id is not null then
    select w.id into v_id from public.works w where w.source = v_source and w.source_id = v_source_id;
  end if;
  if v_id is null then
    insert into public.works(title, composer, composer_sort, kind, year_written, is_public,
                             source, source_id, instrumentation, imported_at,
                             -- ★★ここから 下が 足した 列（★これまで 捨てて いました）
                             title_original, aliases, duration_min, language,
                             school, variant, edition, note)
    values (btrim(p_work ->> 'title'), nullif(p_work ->> 'composer',''), nullif(p_work ->> 'composer_sort',''),
            v_kind, (p_work ->> 'year_written')::int, true, v_source, v_source_id,
            case when p_work ? 'instrumentation'
                 then array(select jsonb_array_elements_text(p_work -> 'instrumentation')) end,
            now(),
            nullif(p_work ->> 'title_original',''),
            case when p_work ? 'aliases'
                 then array(select jsonb_array_elements_text(p_work -> 'aliases')) end,
            (p_work ->> 'duration_min')::int,
            nullif(p_work ->> 'language',''),
            nullif(p_work ->> 'school',''),
            nullif(p_work ->> 'variant',''),
            nullif(p_work ->> 'edition',''),
            nullif(p_work ->> 'note',''))
    returning id into v_id;
  else
    update public.works set title = btrim(p_work ->> 'title'),
           composer = nullif(p_work ->> 'composer',''), composer_sort = nullif(p_work ->> 'composer_sort',''),
           kind = v_kind, year_written = (p_work ->> 'year_written')::int,
           instrumentation = case when p_work ? 'instrumentation'
                                  then array(select jsonb_array_elements_text(p_work -> 'instrumentation')) else instrumentation end,
           imported_at = now(),
           -- ★★ここから 下が 足した 列
           title_original = coalesce(nullif(p_work ->> 'title_original',''), title_original),
           aliases        = case when p_work ? 'aliases'
                                 then array(select jsonb_array_elements_text(p_work -> 'aliases'))
                                 else aliases end,
           duration_min   = coalesce((p_work ->> 'duration_min')::int, duration_min),
           language       = coalesce(nullif(p_work ->> 'language',''), language),
           school         = coalesce(nullif(p_work ->> 'school',''), school),
           variant        = coalesce(nullif(p_work ->> 'variant',''), variant),
           edition        = coalesce(nullif(p_work ->> 'edition',''), edition),
           note           = coalesce(nullif(p_work ->> 'note',''), note)
     where id = v_id;
    -- 入れ替えのときは 役と場面を作り直す（公演に当てた表は別物なので影響しない）
    delete from public.work_scenes where work_id = v_id;
    delete from public.work_roles  where work_id = v_id;
  end if;

  -- 役
  if p_work ? 'roles' then
    insert into public.work_roles(work_id, label, is_group, voice, sort_order)
    select v_id, btrim(r.label), coalesce(r.is_group, false), nullif(r.voice,''), r.ord
      -- ★WITH ORDINALITY は列の定義と並べて書けない。ROWS FROM(...) の中に入れる（2026-09-23 本番で確認）
      -- ★★voice を 足しました（2026-09-26）── ★列の 定義にも 足さないと 拾えません
      from rows from (jsonb_to_recordset(p_work -> 'roles')
                        as (label text, is_group boolean, voice text))
           with ordinality as r(label, is_group, voice, ord)
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


-- ═══ ④ 探すときに 原題・別名でも 当たるように ═══
create index if not exists works_title_original_idx on public.works (title_original)
  where title_original is not null;
create index if not exists works_aliases_idx on public.works using gin (aliases)
  where aliases is not null;
create index if not exists works_kind_idx on public.works (kind);

-- ★★確かめ方（★試しの Postgres 16 で 通しました）
-- ★① 17の kind すべてが 通る
-- ★② 知らない kind は works_kind_check で 落ちる
-- ★③ 原題・別名・分・ことば・版・註が 入る
-- ★④ 場面に 出る 役が 入る（work_scene_roles が 埋まる）
-- ★⑤ ★★役の一覧に 無い 名前を 場面に 書くと ROLE_NOT_IN_LIST で 止まる（★守りが 生きて いる）
-- ★⑥ ★★completeness が 'full' に なる（★付け直しが 生きて いる）

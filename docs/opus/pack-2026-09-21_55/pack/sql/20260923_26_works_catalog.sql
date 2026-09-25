-- 20260923_26 作品のカタログ（裁定174）。sql/20 の works を、まとめて取り込める形に広げる
-- ★20 を当ててから当てる

alter table public.works add column if not exists composer_sort text;                 -- 並べ替え用（Mozart, Wolfgang Amadeus）
alter table public.works add column if not exists year_written  integer;
alter table public.works add column if not exists source        text not null default 'hand'
  check (source in ('hand','musicbrainz','wikidata','user'));                          -- どこから来たか
alter table public.works add column if not exists source_id     text;                  -- 外部の id（MBID・Q番号）
alter table public.works add column if not exists completeness  text not null default 'title'
  check (completeness in ('title','movements','roles','full'));                        -- どこまで揃っているか
alter table public.works add column if not exists instrumentation text[];              -- 編成（分かる範囲）
alter table public.works add column if not exists imported_at   timestamptz;

-- 同じ作品を2回入れない
create unique index if not exists works_source_unique on public.works(source, source_id) where source_id is not null;
-- 名前で探せるように（日本語も部分一致で。pg_trgm は本番に入っている）
create index if not exists works_title_trgm on public.works using gin (title gin_trgm_ops);
create index if not exists works_kind_completeness_idx on public.works(kind, completeness);

-- ★「下書きを作る」に出すのは、場面×役まで揃った作品だけ
create or replace function public.works_ready_for_draft(p_kind text default null)
returns table(id uuid, title text, composer text, kind text, scenes integer, roles integer)
language sql stable security definer set search_path to 'public' as $$
  select w.id, w.title, w.composer, w.kind,
         (select count(*)::int from public.work_scenes s where s.work_id = w.id),
         (select count(*)::int from public.work_roles  r where r.work_id = w.id)
    from public.works w
   where w.completeness = 'full'
     and (w.is_public or w.owner_user_id = auth.uid())
     and (p_kind is null or w.kind = p_kind)
   order by w.composer nulls last, w.title;
$$;
revoke all on function public.works_ready_for_draft(text) from public, anon;
grant execute on function public.works_ready_for_draft(text) to authenticated;

-- 揃い方を数え直す（取り込みのあとに走らせる）
create or replace function public.recount_works_completeness()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  update public.works w set completeness = case
      when exists (select 1 from public.work_scene_roles x join public.work_scenes s on s.id = x.scene_id where s.work_id = w.id) then 'full'
      when exists (select 1 from public.work_roles  r where r.work_id = w.id) then 'roles'
      when exists (select 1 from public.work_scenes s where s.work_id = w.id) then 'movements'
      else 'title' end
   where w.source <> 'user';                    -- ★利用者が作った雛形は触らない
  get diagnostics n = row_count; return n;
end $$;
revoke all on function public.recount_works_completeness() from public, anon, authenticated;

-- 取り込みの記録（いつ・どこから・何件。失敗しても分かるように）
create table if not exists public.works_imports (
  id         uuid primary key default gen_random_uuid(),
  source     text not null check (source in ('musicbrainz','wikidata')),
  scope      text not null,                      -- 'composer:Mozart' / 'kind:opera' など
  rows_added integer not null default 0,
  note       text,
  started_at timestamptz not null default now(),
  ended_at   timestamptz
);
alter table public.works_imports enable row level security;
revoke all on public.works_imports from anon, authenticated;   -- 運営（サーバ）だけ

-- 確かめ
-- select source, completeness, count(*) from works group by 1,2 order by 1,2;   → 取り込みの結果
-- works_ready_for_draft('opera') → full の作品だけ（title だけの作品は出ない）
-- 同じ (source, source_id) を2回入れる → unique 違反
-- recount_works_completeness → source='user' の行が1件も変わらない
-- select pg_size_pretty(pg_database_size(current_database()));  → Free の上限の半分（250MB）を超えていない

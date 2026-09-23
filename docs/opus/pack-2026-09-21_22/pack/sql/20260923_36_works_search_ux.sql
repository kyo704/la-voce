-- 20260923_36 作品を選ぶ画面のための台帳（原題・別名・人数・時間・よく使う順）
-- なぜ要るか（利用者の立場で考えたこと）:
--   ① ★原題で探す人がいる（「Le nozze di Figaro」「Nozze」「Zauberflöte」）→ 題名だけでは出ない
--   ② ★自分の公演に合うかは「役が何人か・合唱が要るか・どれくらいの長さか」で決まる
--   ③ ★よく使う作品は上に出したい（学校は毎年ほぼ同じ作品を出す）
--   ④ ★種類（オペラ・演劇・バレエ…）で分けて見せると、選ぶのが速い
-- ★26・27 のあと

alter table public.works add column if not exists title_original text;    -- 原題（Le nozze di Figaro）
alter table public.works add column if not exists aliases text[];         -- 別名・略称（フィガロ／Nozze／Figaro）
alter table public.works add column if not exists duration_min integer;   -- 上演の目安（分）
alter table public.works add column if not exists language text;          -- 上演の言語（it/de/fr/en/ja/ru ほか）
alter table public.works add column if not exists used_count integer not null default 0;  -- 使われた回数（よく使う順）

create index if not exists works_title_original_trgm on public.works using gin (title_original gin_trgm_ops);
create index if not exists works_used_idx on public.works(kind, used_count desc);

-- 探す（★題名・原題・別名・作曲家 のどれでも当たる。空のときは よく使う順）
create or replace function public.search_works(
  p_q text default null,
  p_kind text default null,
  p_ready_only boolean default false,
  p_max_roles integer default null,      -- ★「役は何人まで」で絞る（小さな公演に合う作品を探す）
  p_needs_chorus boolean default null    -- ★合唱が要る／要らない
)
returns table(id uuid, title text, title_original text, composer text, kind text,
              completeness text, roles integer, has_chorus boolean, scenes integer,
              duration_min integer, used_count integer)
language sql stable security definer set search_path to 'public' as $$
  with w as (
    select x.*,
           (select count(*)::int from public.work_roles r where r.work_id = x.id) as n_roles,
           (select bool_or(r.is_group) from public.work_roles r where r.work_id = x.id) as chorus,
           (select count(*)::int from public.work_scenes s where s.work_id = x.id) as n_scenes
      from public.works x
     where (x.is_public or x.owner_user_id = auth.uid())
  )
  select w.id, w.title, w.title_original, w.composer, w.kind, w.completeness,
         w.n_roles, coalesce(w.chorus,false), w.n_scenes, w.duration_min, w.used_count
    from w
   where (p_kind is null or w.kind = p_kind)
     and (not p_ready_only or w.completeness = 'full')
     and (p_max_roles is null or w.n_roles <= p_max_roles)
     and (p_needs_chorus is null or coalesce(w.chorus,false) = p_needs_chorus)
     and (p_q is null or btrim(p_q) = ''
          or w.title ilike '%'||btrim(p_q)||'%'
          or coalesce(w.title_original,'') ilike '%'||btrim(p_q)||'%'
          or coalesce(w.composer,'') ilike '%'||btrim(p_q)||'%'
          or exists (select 1 from unnest(coalesce(w.aliases,'{}')) a where a ilike '%'||btrim(p_q)||'%'))
   order by (w.completeness = 'full') desc, w.used_count desc, w.composer nulls last, w.title
   limit 60;
$$;
revoke all on function public.search_works(text, text, boolean, integer, boolean) from public, anon;
grant execute on function public.search_works(text, text, boolean, integer, boolean) to authenticated;

-- 種類ごとの数（★選ぶ画面の見出しに出す。0件の種類は出さない）
create or replace function public.works_kind_counts()
returns table(kind text, n integer, ready integer)
language sql stable security definer set search_path to 'public' as $$
  select w.kind, count(*)::int, count(*) filter (where w.completeness='full')::int
    from public.works w
   where w.is_public or w.owner_user_id = auth.uid()
   group by w.kind order by 2 desc;
$$;
revoke all on function public.works_kind_counts() from public, anon;
grant execute on function public.works_kind_counts() to authenticated;

-- 使ったら1つ増やす（よく使う順のため。★誰が使ったかは残さない）
create or replace function public.bump_work_used(p_work uuid)
returns void language sql security definer set search_path to 'public' as $$
  update public.works set used_count = used_count + 1 where id = p_work;
$$;
revoke all on function public.bump_work_used(uuid) from public, anon, authenticated;
-- ★koen_apply_work の中から呼ぶ（サーバ経由）。画面からは呼ばせない

-- 確かめ
-- search_works('Nozze') → 原題でも当たる／search_works('フィガロ') → 別名でも当たる
-- search_works(null,'drama') → 演劇だけ／p_max_roles=8 → 役が8人までの作品だけ
-- p_needs_chorus=false → 合唱の要らない作品だけ（小さな会場・少人数の団体に効く）
-- works_kind_counts() → 種類ごとの数と「下書きを作れる数」
-- ★返る列に 体調・個人の記録が1つも無いこと

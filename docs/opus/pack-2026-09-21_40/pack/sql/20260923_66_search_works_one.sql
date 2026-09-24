-- 20260923_66 作品をさがす関数を ★1本にする ＋ 作曲家の絞りを足す
-- 見つけたもの（2026-09-23・画面と台帳を 突き合わせて）:
--   ① ★search_works が 本番に 2つ あります（3引数の古い版・5引数の新しい版）
--      → 画面が 引数を 一部だけ渡すと ★古いほうに 当たります
--        古い版は 原題・上演時間・よく使う順を ★返しません（静かに 少ない列が返る）
--      ★sql/32 と同じ型の事故です（画面は「動いているつもり」になる）
--   ② ★作曲家の絞りが ありません。見本（design-v33 以降）は 作曲家で 絞ります
--      → 台帳に 無いので、そのままでは ★画面だけの 機能に なってしまう
-- ★36 のあと
-- ★試しの環境で 9項目 確かめました（2026-09-23）:
--   種類・原題・作曲家名での検索・作曲家の絞り・役の人数・合唱の要不要・別名・
--   種類をまたがないこと・作曲家の顔ぶれ

-- ① 古い3引数の版を 落とす（★2つあること自体が 事故のもと）
drop function if exists public.search_works(text, text, boolean);

-- ② 1本にまとめ、★作曲家（p_composer）を 足す
drop function if exists public.search_works(text, text, boolean, integer, boolean);
create or replace function public.search_works(
  p_q           text    default null,   -- 題名・原題・別名・作曲家（まとめて）
  p_kind        text    default null,   -- ★選んだ種類の中だけ（画面が渡す）
  p_composer    text    default null,   -- ★作曲家・作者
  p_max_roles   integer default null,   -- 役の人数の上限
  p_needs_chorus boolean default null,  -- true=合唱が要る／false=要らない
  p_ready_only  boolean default true    -- ★確かめた作品だけ（既定）
)
returns table(id uuid, title text, title_original text, composer text, kind text,
              school text, completeness text, roles integer, has_chorus boolean,
              scenes integer, duration_min integer, used_count integer)
language sql stable security definer set search_path to 'public' as $$
  select w.id, w.title, w.title_original, w.composer, w.kind, w.school, w.completeness,
         (select count(*)::int from public.work_roles r where r.work_id = w.id),
         exists (select 1 from public.work_roles r where r.work_id = w.id and r.is_group
                   and (r.label like '%合唱%' or r.label like '%コーラス%')),
         (select count(*)::int from public.work_scenes s where s.work_id = w.id),
         w.duration_min, w.used_count
    from public.works w
   where (w.is_public or w.owner_user_id = auth.uid())
     and (not coalesce(p_ready_only, true) or w.imported_at is null or w.verified_at is not null)
     and (p_kind is null or w.kind = p_kind)
     and (p_composer is null or w.composer = p_composer)
     and (p_q is null or btrim(p_q) = '' or
          w.title ilike '%'||p_q||'%' or
          coalesce(w.title_original,'') ilike '%'||p_q||'%' or
          coalesce(w.composer,'') ilike '%'||p_q||'%' or
          exists (select 1 from unnest(coalesce(w.aliases, array[]::text[])) a where a ilike '%'||p_q||'%'))
     and (p_max_roles is null or
          (select count(*) from public.work_roles r where r.work_id = w.id) <= p_max_roles)
     and (p_needs_chorus is null or
          exists (select 1 from public.work_roles r where r.work_id = w.id and r.is_group
                    and (r.label like '%合唱%' or r.label like '%コーラス%')) = p_needs_chorus)
   order by w.used_count desc nulls last, w.composer nulls last, w.title
   limit 60;
$$;
revoke all on function public.search_works(text, text, text, integer, boolean, boolean) from public, anon;
grant execute on function public.search_works(text, text, text, integer, boolean, boolean) to authenticated;

-- ③ 画面の「作曲家」の札に 出す顔ぶれ（★選んだ種類の中の 多い順）
-- ★p_kind にも 既定を置く（試しの環境で「関数が無い」と言われました。
--   ★引数に 既定が無いと、渡し方によっては 見つかりません）
create or replace function public.work_composers(p_kind text default null, p_limit integer default 14)
returns table(composer text, n integer)
language sql stable security definer set search_path to 'public' as $$
  select w.composer, count(*)::int
    from public.works w
   where w.is_public and w.composer is not null
     and (p_kind is null or w.kind = p_kind)
   group by w.composer
   order by count(*) desc, w.composer
   limit greatest(1, coalesce(p_limit, 14));
$$;
revoke all on function public.work_composers(text, integer) from public, anon;
grant execute on function public.work_composers(text, integer) to authenticated;

-- 確かめ（試しの環境で）
-- ★search_works が 1つだけになっている（pg_proc に 1行）
-- 種類だけ渡す → その種類だけ／作曲家も渡す → さらに絞れる
-- 「Nozze」で フィガロが出る（原題）／「ヴェルディ」で 椿姫が出る（作曲家名）
-- 役の人数 4 → 11役の作品は 出ない／合唱 false → 合唱ありの作品は 出ない
-- work_composers('opera') → ヴェルディ・ロッシーニ・モーツァルト… の順
-- ★確かめていない取り込みの作品は 出ない（p_ready_only の既定 true）

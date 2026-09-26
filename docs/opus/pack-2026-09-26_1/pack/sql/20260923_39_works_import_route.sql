-- 20260923_39 作品を外から取り込む道（能・狂言・歌舞伎の残り／将来の追加）
-- なぜ: 能の現行曲は約240、狂言も約250、歌舞伎の演目は数百ある。★手で書ききれない
--   いま入っているのは 能13・狂言9・歌舞伎26。残りは ★外のデータから取り込む
-- 決めたこと:
--   ・取り込みは ★サーバだけ（画面から呼べない）
--   ・出どころ（source）と 向こうの id（source_id）で ★重複を防ぐ（26 の決まりをそのまま使う）
--   ・取り込んだ作品の揃い方（completeness）は ★本番の決まりに合わせる:
--       'title'（題名だけ）／'movements'（場面はある）／'roles'（場面と役がある）／'full'（人が確かめた）
--       ★'partial'・'stub' という値は台帳に無い（2026-09-23 に本番で確認）
--   ・★人が確かめた印（verified_at）を持ち、確かめたものだけ「下書きを作る」に出せる
--   ・★取り込みの記録を残す（いつ・どこから・何件・失敗は何件）
-- ★26・27・36 のあと

alter table public.works add column if not exists verified_at   timestamptz;  -- 人が確かめた日
alter table public.works add column if not exists verified_by   uuid;
alter table public.works add column if not exists source_url    text;         -- 出どころの頁
-- ★imported_at は 本番に既にある（26 で入っている）。if not exists なので当てても害は無い
alter table public.works add column if not exists imported_at   timestamptz;

create table if not exists public.work_imports (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,              -- 'noh-db' / 'kabuki-enmokudb' / 'musicbrainz' / 'wikidata' ほか
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  added       integer not null default 0,
  updated     integer not null default 0,
  skipped     integer not null default 0,
  failed      integer not null default 0,
  note        text
);
alter table public.work_imports enable row level security;
revoke all on public.work_imports from anon, authenticated;   -- ★運営だけ

-- 取り込み（1件）。★既にあるものは中身を上書きしない（人が直した内容を消さないため）
create or replace function public.import_work(p_work jsonb, p_source text, p_source_url text default null)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_sid text; v_exists boolean;
begin
  v_sid := btrim(coalesce(p_work->>'source_id',''));
  if v_sid = '' then raise exception 'NO_SOURCE_ID'; end if;
  select id, true into v_id, v_exists from public.works
   where source = p_source and source_id = v_sid limit 1;

  if v_exists then
    -- ★中身は上書きしない。出どころの頁と取り込みの日だけ新しくする
    update public.works set source_url = coalesce(p_source_url, source_url), imported_at = now()
     where id = v_id;
    return 'skipped';
  end if;

  v_id := public.upsert_work(p_work);        -- 27 の関数をそのまま使う
  update public.works
     set source = p_source, source_url = p_source_url, imported_at = now(),
         completeness = case
           when (select count(*) from public.work_scenes s where s.work_id = v_id) > 0
            and (select count(*) from public.work_roles  r where r.work_id = v_id) > 0 then 'roles'
           when (select count(*) from public.work_scenes s where s.work_id = v_id) > 0 then 'movements'
           else 'title' end,
         is_public = false                    -- ★確かめるまで 利用者に出さない
   where id = v_id;
  return 'added';
end $$;
revoke all on function public.import_work(jsonb, text, text) from public, anon, authenticated;

-- 人が確かめた印を付ける（★これを通った作品だけ 利用者に出る）
create or replace function public.verify_work(p_work uuid, p_ok boolean default true)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not coalesce((select p.is_internal from public.profiles p where p.id = auth.uid()), false) then
    raise exception 'NOT_INTERNAL';           -- ★確かめられるのは運営だけ
  end if;
  update public.works
     set verified_at  = case when p_ok then now() else null end,
         verified_by  = case when p_ok then auth.uid() else null end,
         completeness = case when p_ok then 'full' else completeness end,
         is_public    = p_ok
   where id = p_work;
end $$;
revoke all on function public.verify_work(uuid, boolean) from public, anon;
grant execute on function public.verify_work(uuid, boolean) to authenticated;

-- 取り込んだが まだ確かめていない作品（運営の画面に出す）
create or replace function public.works_unverified(p_source text default null)
returns table(id uuid, title text, composer text, kind text, source text, scenes integer, roles integer)
language sql stable security definer set search_path to 'public' as $$
  select w.id, w.title, w.composer, w.kind, w.source,
         (select count(*)::int from public.work_scenes s where s.work_id = w.id),
         (select count(*)::int from public.work_roles r where r.work_id = w.id)
    from public.works w
   where w.imported_at is not null and w.verified_at is null
     and (p_source is null or w.source = p_source)
   order by w.source, w.composer nulls last, w.title;
$$;
revoke all on function public.works_unverified(text) from public, anon, authenticated;

-- ★「下書きを作る」に出るのは、確かめたものか 手で入れたものだけ
create or replace function public.works_ready_for_draft(p_kind text default null)
returns table(id uuid, title text, composer text, kind text, scenes integer, roles integer)
language sql stable security definer set search_path to 'public' as $$
  select w.id, w.title, w.composer, w.kind,
         (select count(*)::int from public.work_scenes s where s.work_id = w.id),
         (select count(*)::int from public.work_roles r where r.work_id = w.id)
    from public.works w
   where (w.is_public or w.owner_user_id = auth.uid())
     and (w.imported_at is null or w.verified_at is not null)   -- ★取り込んだものは 確かめたものだけ
     and (p_kind is null or w.kind = p_kind)
     and exists (select 1 from public.work_scenes s where s.work_id = w.id)
   order by w.used_count desc, w.composer nulls last, w.title;
$$;
revoke all on function public.works_ready_for_draft(text) from public, anon;
grant execute on function public.works_ready_for_draft(text) to authenticated;

-- 人が確かめたら 'full' にする（揃い方の最後の段）
--   ※verify_work の中で更新する

-- 確かめ（試しの環境で）
-- import_work で同じ source + source_id を2回 → 2回目は 'skipped'（★人が直した中身が消えない）
-- 取り込んだ直後: is_public=false → works_ready_for_draft に出ない／works_unverified に出る
-- verify_work（運営）→ completeness='full'・is_public=true になり、下書きに出る
-- ★completeness に 'partial' を入れようとすると check 違反（台帳の決まりは title/movements/roles/full）／ふつうの利用者が verify_work → NOT_INTERNAL
-- 画面から import_work → 権限エラー
-- 手で入れた作品（imported_at が空）は、いままでどおり下書きに出る

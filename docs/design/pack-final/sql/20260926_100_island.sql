-- 20260926_100 Woolsong アイランド（★裁定209 ③）
-- 坂本さんの ご指摘（2026-09-26）:
--   「★だんだん 増えていくのが いいのです」
--   ★★私は はじめ「空の 島は 見せない」と 言いました ── ★誤りでした
--   ★★1人目から 見えるほうが、★増えていく 実感が あります
-- ★99 のあと

-- ★★地図に 載せる 同意（★★公開＝自動で 載る、には しません）
--   ★理由: ★公開は「★見てもらう」こと
--         ★★地図に 載るのは「★★探される」こと ── ★別の こと です
alter table public.portfolios add column if not exists on_map boolean not null default false;
alter table public.portfolios add column if not exists on_map_at timestamptz;

-- ★区分（★島・地区）── ★お仕事で 分かれます（裁定202 の field と 同じ 軸）
alter table public.portfolios add column if not exists map_area text;
alter table public.portfolios drop constraint if exists portfolios_map_area_ok;
alter table public.portfolios add constraint portfolios_map_area_ok
  check (map_area is null or map_area in ('music','voice','stage'));

-- ★★地図に 載るのは ★公開している 人だけ
--   ★★公開を やめたら ★地図からも 消えます（★on_map は そのまま 残す）
-- ★★2026-09-26: ★drop を 先に（★sql/94 で 同じ ところで 転びました・M20v）
drop function if exists public.island_residents(text);
create function public.island_residents(p_area text default null)
returns table(display_name text, public_slug text, map_area text, since date)
language sql stable security definer set search_path to 'public' as $$
  select p.display_name, p.public_slug, p.map_area, p.on_map_at::date
    from public.portfolios p
   where p.on_map
     and p.visibility = 'public'          -- ★★公開を やめたら 出ません
     and p.public_slug is not null
     and (p_area is null or p.map_area = p_area)
   order by p.on_map_at nulls last, p.display_name;
$$;
revoke all on function public.island_residents(text) from public;
grant execute on function public.island_residents(text) to anon, authenticated;
-- ★★anon にも 渡します（★会員でなくても 見られる 島）

-- ★★住人の 数（★★隠さない・盛らない）
drop function if exists public.island_count();
create function public.island_count()
returns table(area text, n bigint)
language sql stable security definer set search_path to 'public' as $$
  select coalesce(p.map_area,'—') as area, count(*)
    from public.portfolios p
   where p.on_map and p.visibility = 'public' and p.public_slug is not null
   group by 1 order by 1;
$$;
revoke all on function public.island_count() from public;
grant execute on function public.island_count() to anon, authenticated;
-- ★★「いま 31人」を ★そのまま 出します
--   ★★盛りません。★★「もうすぐ 100人」も 書きません

-- ★★載せる・外すは ★ご本人だけ
drop function if exists public.set_on_map(boolean, text);
create function public.set_on_map(p_on boolean, p_area text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.portfolios
     set on_map = p_on,
         on_map_at = case when p_on and on_map_at is null then now() else on_map_at end,
         map_area = coalesce(p_area, map_area)
   where user_id = auth.uid();
  if not found then raise exception 'NO_PORTFOLIO'; end if;
end $$;
revoke all on function public.set_on_map(boolean, text) from public, anon;
grant execute on function public.set_on_map(boolean, text) to authenticated;

-- ★★出さない もの（★画面の 決まり）:
--   ✕ ★順位・人気・★見られた 数
--   ✕ ★「新着」の 強調（★古い 人が 沈みます）
--   ✕ ★体調の 記録（★1文字も）
--   ○ ★お名前・ページへの リンク・★いつから 住んでいるか

-- 確かめ（試しの環境で・★なりきって）
-- ★on_map の 既定は false（★公開しても 自動で 載らない）
-- ★on_map=true ＋ 公開 → ★島に 出る
-- ★★公開を やめる → ★島から 消える（★on_map は 残る）
-- ★★会員でない 人（anon）からも 見える
-- ★ほかの人の on_map は ★変えられない

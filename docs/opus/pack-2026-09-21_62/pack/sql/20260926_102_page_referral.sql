-- 20260926_102 公開ページの 印（★裁定209 C）
-- ★★?from=page&of=<slug> ── ★★これが ★個人への 経路 です
--   ★9/26 に 数えました: ★日本の 声のプロは ★10万人 では ありません
--   ★★母数が 小さい ので ★広告は 成り立ちません
--   → ★★人づてで 渡す しか ありません。★その 経路の 1つ
-- ★101 のあと

-- ★★数える のは「★どこから 来たか」だけ
--   ★★「★誰が 来たか」は ★数えません（★IP も 端末も 持ちません）
create table if not exists public.page_referrals (
  day        date not null,
  from_slug  text not null,                 -- ★どの ページから
  n          integer not null default 0,
  primary key (day, from_slug)
);
alter table public.page_referrals enable row level security;
revoke all on public.page_referrals from anon, authenticated;
-- ★★誰にも 渡しません（★運営だけ・service role）
--   ★理由: ★★「あなたのページから 何人 来ました」を 出すと
--         ★★数を 競う ことに なります（★裁定: 数を 強調しない）

create or replace function public.count_referral(p_slug text)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if p_slug is null or length(p_slug) > 64 then return; end if;
  -- ★★実在する 公開ページ からだけ 数えます（★でたらめな slug を 増やさない）
  if not exists (select 1 from public.portfolios
                  where public_slug = p_slug and visibility = 'public') then
    return;                                  -- ★★黙って 何も しません（★止めない）
  end if;
  -- ★★1日 1ページ あたり ★10,000 で 止めます
  --   ★理由: ★anon が 呼べる ＝ ★★何度でも 呼べます
  --         ★★数が 膨らんでも ★害は 小さい（★数えるだけ）ですが、
  --         ★★表が 際限なく 育つのを 防ぎます
  --   ★★上限に 当たっても ★止めません（★黙って 数えない）
  insert into public.page_referrals(day, from_slug, n)
  values ((now() at time zone 'Asia/Tokyo')::date, p_slug, 1)
  on conflict (day, from_slug) do update
    set n = least(public.page_referrals.n + 1, 10000);
end $$;
revoke all on function public.count_referral(text) from public;
grant execute on function public.count_referral(text) to anon, authenticated;
-- ★★anon にも 渡します（★会員でない 人が 来る ところ です）

-- ★★90日で 消します（★page_inquiries と 同じ ものさし）
create or replace function public.sweep_referrals()
returns integer language sql security definer set search_path to 'public' as $$
  with d as (delete from public.page_referrals
              where day < (now() at time zone 'Asia/Tokyo')::date - 90 returning 1)
  select count(*)::int from d;
$$;
revoke all on function public.sweep_referrals() from public, anon, authenticated;

-- ★★印の 文（★公開ページの 右下）:
--   「このページは Woolsong で 作られています ── 声を 使う 人のための 記録と、ホームページ」
--   ★★リンク先: woolsong.app/?from=page&of=<slug>
--   ★★書かない もの:
--     ✕「あなたも 作れます」（★勧誘）
--     ✕「無料で」（★売り文句）
--     ✕ ★点滅・目立つ 色
--   ★理由: ★★ページの 主役は ★その人 です。★うちでは ありません

-- ★★ご本人が 印を 消せるか ── ★★消せません
--   ★理由: ★★無料で 使える ところが あるのは、★この 印が あるから です
--   ★★料金ページに 書く:「公開した ページの 右下に、小さく 印が 付きます」
--   ★★隠さない。★あとから 気づかせない

-- 確かめ（試しの環境で）
-- ★実在の slug → 数える／★無い slug → 数えない（★止まらない）
-- ★同じ日に 2回 → n=2
-- ★会員でない 人（anon）から 呼べる
-- ★★中身は 誰にも 見えない（authenticated でも 0行）

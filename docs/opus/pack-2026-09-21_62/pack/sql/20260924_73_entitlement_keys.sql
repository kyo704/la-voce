-- 20260924_73 買った鍵と 使える機能の 対応（★学生の「つたえる」が 抜けていた）
-- 見つけ方（2026-09-24・Fable の価格案を 見ていて）:
--   ★裁定180 で「契約している学校の 名簿にいる学生は つたえる 年3,000円」を 作った
--   ★Stripe の鍵 ind_tsutaeru_y_gakusei を 値段の一覧に 足した
--   ★ところが my_entitlements は その鍵を 知りません
--   → ★買えるのに、★何も 使えるように ならない（★お金を 取って 何も渡さない）
--   ★エラーは 出ません。★いちばん たちの悪い 形です
-- ★12・165 のあと

-- ① 対応表を ★表にする（★関数の中に 書かない）
--    ★関数の中の case 式だと、★鍵を足すたびに 関数を 書き換えることになり、
--    ★今回のように 忘れます
create table if not exists public.sku_features (
  lookup_key text not null,
  feature    text not null,
  note       text,
  primary key (lookup_key, feature)
);
alter table public.sku_features enable row level security;
revoke all on public.sku_features from anon, authenticated;
grant select on public.sku_features to authenticated;   -- ★画面が「何を買うと 何が使えるか」を 出せる
drop policy if exists sku_features_read on public.sku_features;
create policy sku_features_read on public.sku_features for select to authenticated using (true);

insert into public.sku_features(lookup_key, feature, note) values
  ('ind_zenbu_m','tsutaeru','ぜんぶ（月）'),   ('ind_zenbu_m','shiraberu','ぜんぶ（月）'),   ('ind_zenbu_m','yosooi','ぜんぶ（月）'),
  ('ind_zenbu_y','tsutaeru','ぜんぶ（年）'),   ('ind_zenbu_y','shiraberu','ぜんぶ（年）'),   ('ind_zenbu_y','yosooi','ぜんぶ（年）'),
  ('ind_gakusei_m','tsutaeru','学生（月）'),   ('ind_gakusei_m','shiraberu','学生（月）'),   ('ind_gakusei_m','yosooi','学生（月）'),
  ('ind_gakusei_y','tsutaeru','学生（年）'),   ('ind_gakusei_y','shiraberu','学生（年）'),   ('ind_gakusei_y','yosooi','学生（年）'),
  ('ind_tsutaeru_y','tsutaeru','つたえる（年）'),
  ('ind_tsutaeru_y_gakusei','tsutaeru','★つたえる（年・契約校の学生）── 2026-09-24 に 足した'),
  ('ind_shiraberu_m','shiraberu',null), ('ind_shiraberu_y','shiraberu',null),
  ('ind_yosooi_m','yosooi',null),       ('ind_yosooi_y','yosooi',null)
on conflict (lookup_key, feature) do update set note = excluded.note;

-- ② 関数は 表を 読むだけに する
create or replace function public.my_entitlements()
returns table(feature text, source text, until timestamptz)
language sql stable security definer set search_path to 'public' as $$
  with me as (select auth.uid() as uid),
  subs as (
    select i.lookup_key, coalesce(s.current_period_end, s.period_end) as until
      from public.subscription_items i
      join public.subscriptions s on s.user_id = i.user_id
       and s.stripe_subscription_id = i.stripe_subscription_id
     where i.user_id = (select uid from me) and i.removed_at is null
       and s.status in ('active','trialing')
       and coalesce(s.current_period_end, s.period_end) > now()),
  yearly as (
    select p.lookup_key, p.ends_at as until
      from public.purchases p
     where p.user_id = (select uid from me) and p.status = 'active' and p.ends_at > now()),
  keys as (select lookup_key, until, 'monthly' as source from subs
           union all select lookup_key, until, 'yearly' from yearly)
  select f.feature, k.source, max(k.until)
    from keys k
    join public.sku_features f on f.lookup_key = k.lookup_key
   where (select uid from me) is not null
   group by f.feature, k.source;
$$;
revoke all on function public.my_entitlements() from public, anon;
grant execute on function public.my_entitlements() to authenticated;

-- ③ ★知らない鍵を 買ったときに 気づけるようにする（★静かに 通さない）
create or replace function public.unknown_skus()
returns table(lookup_key text, n integer)
language sql stable security definer set search_path to 'public' as $$
  select k.lookup_key, count(*)::int
    from (select lookup_key from public.subscription_items
          union all select lookup_key from public.purchases) k
   where k.lookup_key is not null
     and not exists (select 1 from public.sku_features f where f.lookup_key = k.lookup_key)
   group by k.lookup_key;
$$;
revoke all on function public.unknown_skus() from public, anon, authenticated;
-- ★毎日の見張りから 呼ぶ（0件でないときは ★お金を取って 何も渡していない人が います）

-- 確かめ（試しの環境で）
-- sku_features に 17行／★ind_tsutaeru_y_gakusei が 入っている
-- 学生の つたえるを 買った人 → my_entitlements に tsutaeru が 出る
-- ★表に無い鍵で 買った人 → my_entitlements は 0行・★unknown_skus に 出る
-- ★値段は この表に 持たない（値段は Stripe と prices.json が 正）

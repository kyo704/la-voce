-- ============================================================================
-- データの置き場所を表す列（EUの下地づくり.md §4-3）
--
-- ★いま使いません。全員 'jp' です。
--   それでも今作るのは、あとから全ユーザーに付与するほうが危ないからです。
--   列が無い状態で分割が必要になると、「この人はどちらの国か」を
--   後から推定することになります。推定は必ず間違えます。
--
-- ★この列があっても、地域をまたぐ集計を作ってよいことにはなりません。
--   §4-2 のとおり、全ユーザー横断のランキング・平均・集約テーブルは
--   作らないでください。作った瞬間に、分割できなくなります。
-- ============================================================================

alter table public.profiles
  add column if not exists data_region text not null default 'jp';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_data_region_check'
  ) then
    alter table public.profiles
      add constraint profiles_data_region_check check (data_region in ('jp', 'us', 'eu'));
  end if;
end $$;

comment on column public.profiles.data_region is
  'データの置き場所（EUの下地づくり.md §4-3）。いまは全員 jp。';

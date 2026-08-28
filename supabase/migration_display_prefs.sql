-- ============================================================================
-- 見やすさの設定（見やすさとかんたん表示.md §0）
--
--   ★文字の大きさと「かんたん表示」は、別の列にします。
--     片方を選んだらもう片方も変わる、という作りにしないため。
--     大きい文字だけ欲しい人がいます。
--
--   ★年齢からは何も決めません。年齢の列とは結びつけないでください。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

alter table public.profiles
  add column if not exists display_scale text not null default 'normal';

alter table public.profiles
  add column if not exists simple_display boolean not null default false;

-- 知らない値が入らないようにする（normal / large / xlarge の3つだけ）
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_display_scale_check') then
    alter table public.profiles
      add constraint profiles_display_scale_check
      check (display_scale in ('normal', 'large', 'xlarge'));
  end if;
end $$;

comment on column public.profiles.display_scale is
  '見やすさ: 文字の大きさ（normal / large / xlarge）。★年齢から決めないこと。';
comment on column public.profiles.simple_display is
  '見やすさ: かんたん表示。★文字の大きさとは独立した設定。';

-- 確認
select column_name as "列", data_type as "型", column_default as "既定値"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('display_scale', 'simple_display');

-- ============================================================================
-- La Voce: アレルギーと常用薬のリストを、プロフィール側に持たせる
--
-- Supabase の SQL Editor で実行してください（何度実行しても安全です）。
--
-- 【背景】職業別プロファイル設計案 §4-2「畳むのではなく切り出す」。
-- 「一日の記録」には、昨日と今日で値が変わりうるものだけを残し、
-- ほぼ一生変わらない身体データは「もっと > プロフィール・記録項目」へ移します。
--
-- この2つは、これまでアプリのどこにも記録する場所がありませんでした。
--   allergies            … 薬剤・食物アレルギー。既往症(conditions)とは別に管理する
--   regular_medications  … 常用薬のリスト（恒久）。「今日の服薬」(entries.medication_tags)
--                          とは別物なので、混ぜないこと
--
-- どちらも受診用サマリーに載せるべき情報です。
-- ============================================================================

alter table public.profiles
  add column if not exists allergies text[] default '{}'::text[];

alter table public.profiles
  add column if not exists regular_medications text[] default '{}'::text[];

comment on column public.profiles.allergies is
  '薬剤・食物アレルギー。既往症(conditions)とは別。受診用サマリーに使う。';
comment on column public.profiles.regular_medications is
  '常用薬のリスト（恒久）。その日に飲んだ薬は entries.medication_tags 側で、別物。';

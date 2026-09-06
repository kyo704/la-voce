-- permission denied が、1枚目の板によるものか、切り分けます（2026年9月8日）
--
--   ★★読むだけです。★1行も書き換えません。
--
--   ★★確かめたいこと
--     ★「is_internal だけが塞がっている」のか、
--     ★「profiles ぜんたいが塞がっている」のか。
--   ★★前者なら、正しい状態です。
--     ★後者なら、★アプリの保存がぜんぶ壊れています。★すぐ直します。

-- ---------------------------------------------------------------------------
-- ① 列ごとに、UPDATE を持っているか（★これが決め手です）
-- ---------------------------------------------------------------------------
select
  列,
  has_column_privilege('authenticated', 'public.profiles', 列, 'UPDATE') as 書けるか
from (values
  -- ★守るはずの7列（★すべて false になるはず）
  ('is_internal'), ('is_admin'), ('is_tester'), ('cohort'),
  ('teacher_beta_access'), ('deleted_at'), ('reauth_at'),
  -- ★ふつうの列（★すべて true になるはず）
  ('display_name'), ('character_equipped'), ('professions'),
  ('record_mode'), ('folded_groups')
) as t(列);

-- ★★読み方
--   ・上の7つが false、下の5つが true  → ★正しい状態です
--   ・ぜんぶ false                      → ★★保存が壊れています。至急ご連絡ください
--   ・上の7つに true が混ざっている      → ★塞げていません

-- ---------------------------------------------------------------------------
-- ② 表ぜんたいの UPDATE が、無いこと
-- ---------------------------------------------------------------------------
select has_table_privilege('authenticated', 'public.profiles', 'UPDATE') as 表ぜんたいで書けるか;

-- ★★false が正しい状態です。
--   ★true だと、★1枚目の板が効きません（★広いほうが勝ちます）。

-- ---------------------------------------------------------------------------
-- ③ 参考：いま渡っている列の数
-- ---------------------------------------------------------------------------
select count(*) as 渡っている列の数
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'profiles'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';

select count(*) as profiles の列の数
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles';

-- ★★「渡っている列の数」＋7 ＝「profiles の列の数」なら、そろっています。

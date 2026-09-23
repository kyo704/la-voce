-- ★★★本番には **流しません**。★「すでに 当たって いる」と 記録するだけ です。
--   ★裁定175 条件2 ／ 手順書 §2（migration repair --status applied に あたる もの）
--
--   ★★★まだ 当てて いません。★坂本さん か Opus の お言葉を 待って います。
--
--   ★★なぜ 記録だけ か ── ★本番には もう その 姿が あります。
--     ★流すと `create table` で 止まるか、★最悪 作り直しに なります。
--
--   ★★★流す 前に 確かめる こと
--     1 いまの 記録が 51本 である こと
--     2 20260101000001〜11 が まだ 無い こと
--   ★★★戻し方 …… 下の `delete` を 流します。

insert into supabase_migrations.schema_migrations (version, name, statements)
values
  ('20260101000001','base_01_extensions',   array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000002','base_02_tables',       array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000003','base_03_constraints',  array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000004','base_04_indexes',      array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000005','base_05_functions_1',  array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000006','base_06_functions_2',  array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000007','base_07_functions_3',  array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000008','base_08_triggers',     array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000009','base_09_rls',          array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000010','base_10_grants',       array['-- ★記録だけ。★本番では 流して いません']),
  ('20260101000011','base_11_comments',     array['-- ★記録だけ。★本番では 流して いません'])
on conflict (version) do nothing;

-- ★★★戻し方
-- delete from supabase_migrations.schema_migrations where version like '202601010000%';

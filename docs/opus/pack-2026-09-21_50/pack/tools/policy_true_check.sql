-- ★USING(true) の select ポリシーを 洗う（★2026-09-24 に 1件 見つかりました）
-- 使い方: 本番・試しの 両方で 流して、★出た表が「誰が見ても よい表」か 1つずつ 確かめる
-- ★2026-09-24 の 結果（本番）:
--   feature_flags・sku_features・koen_kind_words・art_schools ── ★意図どおり（値段表・ことばの表）
--   ★evaluation_release ── ★誤り。★よその学校の「点を 返したか」まで 読めました → sql/79 で 直す
select p.tablename, p.policyname,
       (select count(*) from information_schema.columns c
         where c.table_schema='public' and c.table_name=p.tablename) as cols,
       (select string_agg(c.column_name, ', ' order by c.ordinal_position)
          from information_schema.columns c
         where c.table_schema='public' and c.table_name=p.tablename
           and c.column_name in ('org_id','user_id','student_id','teacher_id','koen_id')) as scope_cols
from pg_policies p
where p.cmd='SELECT' and p.qual='true'
order by 4 nulls first, 1;
-- ★scope_cols に org_id や user_id が ある表で true なのは ★怪しい
--   （★「誰の ものか」が 表に あるのに、★絞っていない ということです）

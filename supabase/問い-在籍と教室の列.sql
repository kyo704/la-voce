-- ★在籍と 教室の 列を 教えて ください（★読むだけ）
--   ★出どころ　Code（★2026-09-16・①通っているところ の 添え字）
--   ★BEGIN / ROLLBACK は 使って いません。
--
--   ★なぜ 要るか ──
--     ★見本の 1行は こうです ──「大学　／　斎藤 めぐみ 先生　／　2026年4月1日から」
--     ★私は `org.kind` と `enrollment.joined_at` を 読む コードを 書きました。
--     ★★その 列が 在るか、★確かめて いません でした。
--     ★★いま 画面では、★この 行が **空** です（★無い ものは 飛ばす 作りの ため）。

select
  c.relname                            as 表の名,
  a.attname                            as 列の名,
  format_type(a.atttypid, a.atttypmod) as かた,
  a.attnotnull                         as 必須か,
  pg_get_expr(d.adbin, d.adrelid)      as 既定
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
where n.nspname = 'public'
  and c.relname in ('enrollments', 'organizations')
order by c.relname, a.attnum;

-- ★中身も 少しだけ（★どんな 値が 入って いるか）
--   ★★名前は 出しません。★どの 列に 何が 入る かだけ 見ます。
select
  count(*)                                          as 教室の数,
  count(*) filter (where name is not null)          as 名前あり
from public.organizations;

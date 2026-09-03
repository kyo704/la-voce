-- ============================================================================
-- ポリシーの棚卸し ― ★名前を見ない。USING句を見る（2026-09-03・常設）
--
--   ★なぜ、この規則ができたか
--     profiles_connected_display_name というポリシーがありました。
--     名前は「display_name だけ」と読めます。ですが RLS は★行単位で、
--     列は絞れません。★行が読めれば、その行の全部が読めます。
--       allergies / regular_medications / conditions（既往症）/
--       health_notes / is_under_18 / line_user_id …
--     ★名前を信じたことが、そのまま漏れになりました。
--
--   ★今日、同じ誤解が3件出ています。
--       lessons  … (org_id IS NULL) OR … で、1対1のレッスンが全員に見えていた
--       entries  … 先生向けのポリシーが残り、行ごと読めていた
--       profiles … 「名前だけ」のつもりが、行ごと読めていた
--     ★4件目を、名前ではなく条件で探します。
--
--   ★これは一度きりの調べではありません。
--     手でポリシーを当てるたびに、また増えます。
--     ★リポジトリに写されないものは、git では見つけられません。
--     ★定期的に、この一覧を目で見てください。
--
--   ★何も書き換えません。読むだけです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① すべてのポリシーを、条件つきで並べる（★これが本体です）
--
--   ★名前の列は、いちばん右に置いてあります。
--     先に条件を読んでいただくためです。
-- ---------------------------------------------------------------------------
select
  p.tablename as "表",
  p.cmd       as "操作",
  p.permissive as "種別",
  p.roles     as "対象",
  p.qual      as "★USING（この条件に当たる行が、まるごと読めます）",
  p.with_check as "WITH CHECK",
  p.policyname as "（名前・最後に読む）"
  from pg_policies p
 where p.schemaname = 'public'
 order by p.tablename, p.cmd, p.policyname;

-- ---------------------------------------------------------------------------
-- ② ★危ない形を、名前と関係なく拾う
--
--   ・OR がある            … PERMISSIVE は足し算です。片方が広ければ広いほうが勝ちます
--   ・(col IS NULL) OR …   … lessons で実際に起きた形。null の行は素通りしました
--   ・EXISTS (…)           … ほかの表を見ています。その表の中身で範囲が決まります
--   ・true / 定数           … 誰でも通ります
--   ・関数の呼び出し         … 中身を見ないと、範囲が分かりません
-- ---------------------------------------------------------------------------
select p.tablename as "表", p.cmd as "操作", p.policyname as "ポリシー",
       case
         when coalesce(p.qual::text,'') ~* '^\s*true\s*$' then '★誰でも通る'
         when coalesce(p.qual::text,'') ~ '\( *\w+ +IS +NULL *\) +OR' then '★null なら素通り'
         when coalesce(p.qual::text,'') ~ ' OR ' then '★OR がある（広いほうが勝つ）'
         when coalesce(p.qual::text,'') ~* 'EXISTS' then 'ほかの表を見ている'
         when coalesce(p.qual::text,'') ~ '\w+\s*\(' then '関数を呼んでいる（中身を確かめる）'
         else '自分の行だけらしい'
       end as "★形",
       p.qual as "USING"
  from pg_policies p
 where p.schemaname = 'public'
   and p.cmd in ('SELECT','ALL')
 order by 4, 1, 3;

-- ---------------------------------------------------------------------------
-- ③ ★名前が「列だけ」と読めるポリシー
--
--   ★RLS は列を絞れません。名前に列の名前が入っているものは、
--     作った人が「その列だけ見せている」と思っていた疑いがあります。
--   ★0行であることが望ましい状態です。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "★名前が列を指しているポリシー",
       cmd as "操作", qual as "USING"
  from pg_policies
 where schemaname = 'public'
   and policyname ~* 'name|display|email|note|title|body|public|visible|shared|summary'
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ④ ポリシーの中から呼ばれている関数
--
--   ★USING の中の関数は、その中で RLS が外れて評価されます。
--     ★範囲を決めているのは、ポリシーではなく★その関数です。
--   ★出てきた関数は、1つずつ中身を読んでください。
-- ---------------------------------------------------------------------------
select distinct pr.proname as "関数名",
       pg_get_function_identity_arguments(pr.oid) as "引数",
       pr.prosecdef as "SECURITY DEFINER か",
       case when pg_get_functiondef(pr.oid) like '%search_path%'
            then 'あり' else '★search_path が無い' end as "search_path"
  from pg_policies p
  join pg_proc pr on position(pr.proname in coalesce(p.qual::text,'') ||
                              coalesce(p.with_check::text,'')) > 0
  join pg_namespace n on n.oid = pr.pronamespace
 where p.schemaname = 'public' and n.nspname = 'public'
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑤ RLS が無効な表・ポリシーが1本も無い表
--
--   ★account_deletions と notice_batches は、わざとポリシーを持ちません
--     （RLS を有効にしたうえで0本＝service_role だけが触れます）。
--   ★それ以外が出たら、確かめてください。
-- ---------------------------------------------------------------------------
select c.relname as "表",
       c.relrowsecurity as "RLS が有効か",
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as "ポリシーの本数"
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relrowsecurity, 3, 1;

-- ---------------------------------------------------------------------------
-- ⑥ ★その表に、機微な列があるか（当たった行から何が出るか）
--
--   ★「行が読める」の重さは、その表が何を持っているかで変わります。
--     profiles が重かったのは、既往症と常用薬があるからです。
-- ---------------------------------------------------------------------------
select table_name as "表", count(*) as "★機微な列の数",
       string_agg(column_name, ', ' order by column_name) as "列"
  from information_schema.columns
 where table_schema = 'public'
   and (column_name ~* 'allerg|medicat|condition|health|symptom|cycle|under_18|'
                       'throat|voice|sleep|weight|body_fat|line_user|email|'
                       'occupation|note|memo|location'
   )
 group by table_name
 order by 2 desc;

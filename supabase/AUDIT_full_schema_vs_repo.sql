-- ============================================================================
-- 本番の姿を、まるごと写し取る（2026-09-03・TASK 1）
--
--   ★なぜ、これが要るのか
--     今日1日で「手で当てて、リポジトリに写していない」ものが★3件出ました。
--       lessons  … (org_id IS NULL) OR … で、1対1のレッスンが全員に見えていた
--       entries  … 先生向けのポリシーが残り、行ごと読めていた
--       profiles … 「名前だけ」のつもりのポリシーが、行ごと読ませていた
--     ★3件は偶然ではありません。仕組みとして、そうなっています。
--     だから、特定の表を調べるのではなく★全部を写し取ります。
--
--   ★使い方
--     ①〜⑤を順に流し、結果をそのまま貼ってください。
--     こちらで supabase/schema.sql と supabase/migration_*.sql に
--     突き合わせ、2つの表を作ります。
--       ・本番にあって、リポジトリに無いもの（★今日3件出たのが、これです）
--       ・リポジトリにあって、本番に当たっていないもの
--         （★「入れたつもり」。こちらも同じくらい危ないです）
--
--   ★何も書き換えません。すべて読むだけです。
--   ★結果に個人のデータは1件も含まれません。仕組みの形だけです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① ポリシー（★USING と WITH CHECK を、切らずに全部）
--
--   ★qual と with_check は長くなります。省略された形で貼らないでください。
--     省略されると、いちばん大事なところが消えます。
-- ---------------------------------------------------------------------------
select
  p.tablename   as "表",
  p.policyname  as "ポリシー",
  p.cmd         as "操作",
  p.permissive  as "種別",
  array_to_string(p.roles, ',') as "対象",
  coalesce(p.qual::text, '(なし)')       as "USING",
  coalesce(p.with_check::text, '(なし)') as "WITH CHECK"
  from pg_policies p
 where p.schemaname = 'public'
 order by p.tablename, p.cmd, p.policyname;

-- ---------------------------------------------------------------------------
-- ② 関数（★中身を全部。SECURITY DEFINER と search_path も）
--
--   ★SECURITY DEFINER は RLS を素通りします。
--   ★search_path が無いものは、呼ぶ側の設定で挙動が変わりえます。
-- ---------------------------------------------------------------------------
select
  p.proname as "関数名",
  pg_get_function_identity_arguments(p.oid) as "引数",
  p.prosecdef as "SECURITY DEFINER か",
  case when pg_get_functiondef(p.oid) like '%search_path%'
       then 'あり' else '★無い' end as "search_path",
  pg_get_functiondef(p.oid) as "★中身そのまま"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prokind = 'f'
 order by p.prosecdef desc, p.proname;

-- ---------------------------------------------------------------------------
-- ③ トリガー（★auth スキーマのものも含めます）
--
--   ★handle_new_user は auth.users に付いています。
--     public だけを見ると、いちばん大事なものを見落とします。
-- ---------------------------------------------------------------------------
select
  n.nspname   as "スキーマ",
  c.relname   as "表",
  t.tgname    as "トリガー",
  case t.tgenabled when 'O' then '有効' when 'D' then '★無効'
       when 'R' then 'レプリカのみ' when 'A' then '常に' end as "状態",
  case when (t.tgtype & 2) > 0 then 'BEFORE' else 'AFTER' end as "いつ",
  concat_ws('/',
    case when (t.tgtype &  4) > 0 then 'INSERT' end,
    case when (t.tgtype &  8) > 0 then 'DELETE' end,
    case when (t.tgtype & 16) > 0 then 'UPDATE' end) as "何のとき",
  p.proname   as "呼ぶ関数"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_proc p on p.oid = t.tgfoid
 where not t.tgisinternal
   and n.nspname in ('public', 'auth')
 order by n.nspname, c.relname, t.tgname;

-- ---------------------------------------------------------------------------
-- ④ 表への権限（anon / authenticated / service_role）
--
--   ★RLS の手前にある関門です。ここで許されていなければ、
--     ポリシーがどうであれ触れません。逆に、ここが広いのに
--     ★RLS が無効な表があれば、それは誰でも読めます。
-- ---------------------------------------------------------------------------
select
  g.table_name as "表",
  g.grantee    as "誰に",
  string_agg(g.privilege_type, ', ' order by g.privilege_type) as "何を"
  from information_schema.role_table_grants g
 where g.table_schema = 'public'
   and g.grantee in ('anon', 'authenticated', 'service_role')
 group by g.table_name, g.grantee
 order by g.table_name, g.grantee;

-- ★RLS が有効か（④と一緒に読んでください）
select c.relname as "表",
       c.relrowsecurity as "RLS が有効か",
       c.relforcerowsecurity as "所有者にも強制するか",
       (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) as "ポリシーの本数"
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by c.relrowsecurity, 4, 1;

-- ---------------------------------------------------------------------------
-- ⑤ 拡張機能
-- ---------------------------------------------------------------------------
select e.extname as "拡張", e.extversion as "版", n.nspname as "スキーマ"
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑥ 表と列（★突き合わせの土台。schema.sql との差を出すのに要ります）
--
--   ★列の中身は出しません。名前と型だけです。
-- ---------------------------------------------------------------------------
select table_name as "表", column_name as "列", data_type as "型",
       is_nullable as "null可", column_default as "既定値"
  from information_schema.columns
 where table_schema = 'public'
 order by table_name, ordinal_position;

-- ---------------------------------------------------------------------------
-- ⑦ 外部キー（消したときに何が起きるか）
-- ---------------------------------------------------------------------------
select
  tc.table_name as "表", kcu.column_name as "列",
  ccu.table_schema || '.' || ccu.table_name as "参照先",
  rc.delete_rule as "消したときの動き"
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_name = tc.constraint_name
  join information_schema.constraint_column_usage ccu
    on ccu.constraint_name = tc.constraint_name
  join information_schema.referential_constraints rc
    on rc.constraint_name = tc.constraint_name
 where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
 order by 1, 2;

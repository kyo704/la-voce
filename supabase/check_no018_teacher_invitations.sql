-- ============================================================================
-- No.018 ── teacher_invitations の いまの 決まりを 見る（2026-09-14）
--
-- ★★見るだけです。★1文字も 書きません。
--   ★BEGIN / ROLLBACK は 使いません（SQLエディタが 効かせないため）。
--
-- ★★なぜ この 紙が 要るのか
--   外から 試したところ、★ログイン済みの 一般利用者には ★0行 返りました。
--   ★けれど 0行には、★2つの 意味が あります ──
--     ① 決まりが 既に 締まって いる
--     ② 決まりは ゆるい まま だが、★当てはまる 行が いま 1つも ない
--        （Opus の お調べでは「17行・うち 生きて いるのは 0」）
--   ★★外から 見分ける 手立ては ありません。★台帳に 聞く しか ありません。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ① いまの 決まり（★これが 本題）
-- ----------------------------------------------------------------------------
select
  p.policyname            as "決まりの名前",
  p.cmd                   as "何に対して",
  p.roles                 as "誰に",
  p.permissive            as "許す型か",
  p.qual                  as "読むときの条件",
  p.with_check            as "書くときの条件"
from pg_policies p
where p.schemaname = 'public'
  and p.tablename  = 'teacher_invitations'
order by p.cmd, p.policyname;


-- ----------------------------------------------------------------------------
-- ② 表そのものへの 権限（★決まりの 手前に ある 門）
--
--   ★外からの 試しでは、anon は ここで 止められて いました ──
--     42501 "permission denied for table teacher_invitations"
--     hint  "GRANT SELECT ON public.teacher_invitations TO anon;"
--   ★★これは 決まり（RLS）の 拒否では ありません。★権限の 拒否です。
--     ★同じ 42501 でも、★文面が 違います。
-- ----------------------------------------------------------------------------
select
  g.grantee               as "誰に",
  g.privilege_type        as "何を"
from information_schema.role_table_grants g
where g.table_schema = 'public'
  and g.table_name   = 'teacher_invitations'
  and g.grantee in ('anon','authenticated','service_role','public')
order by g.grantee, g.privilege_type;


-- ----------------------------------------------------------------------------
-- ③ RLS が 効いて いるか。★force が 立って いないか
--
--   ★force が true だと、★SECURITY DEFINER の 関数まで 決まりに 縛られ、
--     accept_teacher_invitation が 42P17 で 落ちます。
-- ----------------------------------------------------------------------------
select
  c.relname                        as "表",
  c.relrowsecurity                 as "RLSが効いている",
  c.relforcerowsecurity            as "★所有者にも強制",
  pg_get_userbyid(c.relowner)      as "所有者"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'teacher_invitations';


-- ----------------------------------------------------------------------------
-- ④ 行の 状態（★0行の 意味を 見分けるため）
--
--   ★「生きて いる」＝ まだ 使われて いない かつ 期限内。
--   ★ここが 0 なら、★外から 0行だったことは ★決まりの 証拠に なりません。
-- ----------------------------------------------------------------------------
select
  count(*)                                                          as "全部",
  count(*) filter (where used_at is not null)                       as "使用済み",
  count(*) filter (where used_at is null and expires_at <= now())    as "期限切れ",
  count(*) filter (where used_at is null and expires_at >  now())    as "★生きている"
from public.teacher_invitations;


-- ----------------------------------------------------------------------------
-- ⑤ 使用済みを 立てて いるのは 誰か（★Opus の Q2）
--
--   ★コードの 側では 答えが 出て います ──
--     supabase/2026-09-04-rpc-functions.sql:29  SECURITY DEFINER
--     同 :103-106                                update ... set used_at = now()
--   ★SECURITY DEFINER は 決まりを 通り抜けます。
--     ★つまり UPDATE の 決まりは、★使われて いません。
--   ★ここでは、★その 関数が ★本当に 台帳に 在り、★definer か だけを 見ます。
-- ----------------------------------------------------------------------------
select
  p.proname                        as "関数",
  p.prosecdef                      as "★SECURITY DEFINER か",
  pg_get_userbyid(p.proowner)      as "所有者",
  pg_get_function_identity_arguments(p.oid) as "引数"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('accept_teacher_invitation','get_invitation_teacher')
order by p.proname;


-- ============================================================================
-- ★読み方
--
--   ①に「Anyone can look up an unused invitation by code」が ★在れば、
--     ★ゆるい まま です。④が 0 だった から 見えなかっただけ です。
--   ①に それが ★無ければ、★もう 締まって います。
--
--   ②の anon に SELECT が ★無ければ、
--     「★anon に 開いて いる」という 見立ては ★当たりません。
--     ★開いて いるのは ★ログイン済みの 人 に 対して です。
--
--   ⑤の prosecdef が ★true なら、★UPDATE の 決まりは 落として 構いません。
-- ============================================================================

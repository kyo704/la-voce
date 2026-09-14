-- ============================================================================
-- 層の つなぎ合わせ ── ★台帳の 関数を 読む（2026-09-15）
--
-- ★出どころ 裁定 その55 ／ その57（★Opus）
--   「★files alone cannot see functions created in the SQL Editor
--     ── that was the 24/18 vs 20 gap」
--
-- ★★見るだけ です。★1文字も 書きません。
-- ★★BEGIN / ROLLBACK は 使いません（★SQLエディタが 効かせない ため）。
--
-- ★★使い方
--   ① 下の ①を 流す
--   ② 出た JSON を、★まるごと 次の ファイルに 貼って 保存する ──
--        docs/reports/_catalog-functions.json
--   ③ `python3 tools/layer_join_guard.py` を もう一度 流す
--
-- ★★②を しない かぎり、★道具は「★台帳は 見て いません」と 言います。
--   ★「通った」とは 言いません。★黙って 通すのが いちばん 危ない。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ① ★public の 関数を、★中身ごと 出します
--
--   ★★`prosecdef`（SECURITY DEFINER）だけ では 足りません。
--     ★ふつうの 関数でも、★呼ぶ 人に 権限が あれば つなげます。
--   ★★だから **すべて** 出します。★層で 分けるのは 道具の 仕事 です。
-- ----------------------------------------------------------------------------

select jsonb_pretty(jsonb_agg(x order by x ->> 'name')) as "貼りつける JSON"
from (
  select jsonb_build_object(
           'name',    p.proname,
           'args',    pg_get_function_identity_arguments(p.oid),
           'secdef',  p.prosecdef,
           'owner',   pg_get_userbyid(p.proowner),
           'kind',    case p.prokind when 'f' then 'function'
                                     when 'p' then 'procedure'
                                     when 'a' then 'aggregate'
                                     else p.prokind::text end,
           'body',    coalesce(p.prosrc, '')
         ) as x
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
) t;


-- ----------------------------------------------------------------------------
-- ② ★ビューも 同じく（★関数では ありませんが、★つなげます）
-- ----------------------------------------------------------------------------

select jsonb_pretty(jsonb_agg(x order by x ->> 'name')) as "貼りつける JSON（ビュー）"
from (
  select jsonb_build_object(
           'name', c.relname,
           'kind', case c.relkind when 'v' then 'view'
                                  when 'm' then 'matview' end,
           'body', pg_get_viewdef(c.oid, true)
         ) as x
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('v', 'm')
) t;


-- ----------------------------------------------------------------------------
-- ③ ★数えるだけ（★①②を 流す 前の 見当）
-- ----------------------------------------------------------------------------

select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public')                                   as "関数の数",
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef)                   as "うち SECURITY DEFINER",
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v','m'))        as "ビューの数";
-- ★★2026-09-14 の 棚おろしでは、★SECURITY DEFINER は **20本** でした。
--   ★倉庫の 紙からは 24件／別名 18件 しか 見えません。★差は ここで 埋まります。

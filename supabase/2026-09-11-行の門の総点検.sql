-- ============================================================================
-- 行の 門（RLS）の 総点検 ── ★読むだけ。★1行も 書き換えません
--
--   ★出どころ notes の 一件（★2026-09-11）
--     ★notes だけ 門が 立って いませんでした。★ほかにも 無いかを 数えます。
--
--   ★★見るのは **2つの ちがう 形**です。★混ぜないで ください。
--
--     ★㋐【漏れ】門が 立って いない（relrowsecurity = false）
--       ★★誰でも 読めます。★書けます。★消せます。
--       ★★notes と 同じ 形です。★いちばん 重い ものです。
--
--     ★㋑【止まり】門は 立って いるが、★決まりが 0件
--       ★★これは 漏れでは ありません。★**逆**です。
--       ★★誰も 読めません。★ご本人も 読めません。
--       ★★機能が 静かに 止まって いる かも しれません。
--         ★画面に「0件」と 出る だけで、★しくじりに 見えません。
--
--     ★㋒【あやしい】決まりは あるが、★条件が「true」だけ
--       ★★書いて あるのに、★何も 絞って いません。
--       ★★門の 形は して いますが、★開きっぱなしです。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★ほかの 台本と 同時に 流さないで ください（★2026-09-11 の デッドロック）。
-- ============================================================================


-- ===========================================================================
-- ① ★ぜんぶの 表を、★1枚に
--
--   ★★「見るところ」の 列を 見て ください。
--     ★★漏れ　　… ★至急
--     ★★止まり　… ★機能が 動いて いるか 確かめる
--     ★★あやしい… ★条件を 読む
--     ★★（空欄）… ★いまの ところ 問題 なし
-- ===========================================================================
select
  c.relname                                as "表",
  c.relrowsecurity                         as "門が 立って いるか",
  coalesce(p.n, 0)                         as "決まりの 数",
  case
    when c.relrowsecurity = false                       then '★★漏れ'
    when coalesce(p.n, 0) = 0                           then '★止まり'
    when coalesce(p.loose, 0) > 0                       then '★あやしい'
    else ''
  end                                      as "見るところ"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join (
  select
    tablename,
    count(*)                                                     as n,
    -- ★★条件が「true」だけ、★または 条件が 無い ものを 数えます。
    count(*) filter (
      where coalesce(btrim(qual), '') in ('', 'true')
        and coalesce(btrim(with_check), '') in ('', 'true')
    )                                                            as loose
  from pg_policies
  where schemaname = 'public'
  group by tablename
) p on p.tablename = c.relname
where n.nspname = 'public' and c.relkind = 'r'
order by
  case
    when c.relrowsecurity = false then 0
    when coalesce(p.n, 0) = 0 then 1
    when coalesce(p.loose, 0) > 0 then 2
    else 3
  end,
  c.relname;


-- ===========================================================================
-- ② ★㋐【漏れ】だけを もう一度（★0行で あって ほしい）
-- ===========================================================================
select c.relname as "★門が 立って いない 表"
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = false
order by c.relname;


-- ===========================================================================
-- ③ ★㋑【止まり】だけを もう一度
--
--   ★★出た 表は、★誰も 読めません。
--     ★★その 機能が、★画面で 動いて いるかを 確かめて ください。
--     ★★「0件」と 出るだけで、★しくじりに 見えません。
-- ===========================================================================
select c.relname as "★門は 立って いるが 決まりが 0件の 表"
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  )
order by c.relname;


-- ===========================================================================
-- ④ ★㋒【あやしい】── 条件が「true」だけの 決まり
--
--   ★★1行ずつ 読んで ください。
--     ★★わざと 全員に 開けて いる ものも あります（★れい　お知らせ）。
--     ★★けれど、★人の ものを 入れる 表に これが あれば、★漏れです。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読める条件",
  with_check as "書ける条件"
from pg_policies
where schemaname = 'public'
  and coalesce(btrim(qual), '') in ('', 'true')
  and coalesce(btrim(with_check), '') in ('', 'true')
order by tablename, cmd, policyname;


-- ===========================================================================
-- ⑤ ★直す ぶんの 決まりに、★「書ける条件」が 付いて いるか
--
--   ★★2026-09-11、★この 説明は 誤りでした。★訂正します。
--     ★★PostgreSQL は、★with check を 書かなかった とき、
--       ★using の 式を 書くときの 確かめにも 使います。
--       ★★しかも、★確かめるのは 書き換えた **あとの** 行です。
--     ★★だから、★using が auth.uid() = user_id なら、
--       ★他人の user_id へ 変える 道は、★はじめから ありません。
--     ★★それでも はっきり 書きます。★理由は 2つ ──
--       ★① あとで using を 広げた とき、★書く 側も 黙って 広がります。
--       ★② 空欄は「決めて いない」のか「使い回して いる」のか 分かりません。
--   ★★0行で あって ほしい ところです。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まり",
  qual       as "読める条件",
  with_check as "★書ける条件（空なら 欠陥）"
from pg_policies
where schemaname = 'public'
  and cmd in ('UPDATE', 'ALL')
  and coalesce(btrim(with_check), '') = ''
order by tablename, policyname;


-- ===========================================================================
-- ⑥ ★anon が 残って いないか（★0行で あって ほしい）
-- ===========================================================================
select table_name as "表", privilege_type as "できること"
from information_schema.table_privileges
where table_schema = 'public' and grantee = 'anon'
order by table_name, privilege_type;

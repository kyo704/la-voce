-- ============================================================================
-- ★緊急：profiles が、本人以外の行を返しているのを突き止める（2026-09-03）
--
--   ★確かめられた事実
--     +g4t2（0648585d-42f7-4d26-b47c-878beba15fa0）として
--       select count(*) from public.profiles;  →  2
--     ★1（自分の行だけ）であるべきところ、2 返っています。
--
--   ★リポジトリの中には、原因がありません
--     supabase/schema.sql:21,25 の2本だけで、どちらも auth.uid() = id です。
--     ★つまり、SQL エディタで手で当てられたポリシーが、
--       リポジトリに写されないまま本番にある、ということです。
--     lessons と entries で、今日すでに2回起きた形です。
--
--   ★この一連は、すべて読むだけです。1行も書き換えません。
--   ★直すのは、④で「何が余分か」を見てからです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① どの行が見えているのか（★中身は出しません。id だけです）
--
--   ★+g4t2 のセッションで実行してください。
--     service_role では RLS を素通りするので、確かめになりません。
-- ---------------------------------------------------------------------------
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"0648585d-42f7-4d26-b47c-878beba15fa0","role":"authenticated"}', true);
-- set local role authenticated;
--
-- select id,
--        (id = auth.uid()) as "自分の行か"
--   from public.profiles
--  order by 2 desc;
-- rollback;
--
-- ★「自分の行か」が false の行が、漏れている行です。
--   ★その id を、②以降で追います。中身は見ません。

-- ---------------------------------------------------------------------------
-- ② profiles のポリシーを、全部そのまま出す（★これが本命です）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 order by cmd, policyname;

-- ★期待している姿は、次の2本だけです。
--     for select … auth.uid() = id
--     for update … auth.uid() = id
--   ★3本目が出たら、それが原因です。
--   ★2本しか出ないのに漏れているなら、④⑤を見てください。

-- ---------------------------------------------------------------------------
-- ③ ★PERMISSIVE は OR で足されます
--
--   種別が PERMISSIVE のものは、条件が★足し算されます。
--   1本でも広いものがあれば、狭い条件は意味を持ちません。
--   ★RESTRICTIVE のものだけが、AND で絞ります。
-- ---------------------------------------------------------------------------
select permissive as "種別", count(*) as "本数"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
 group by 1;

-- ★lessons で起きた形が、profiles にも無いか。
select policyname as "★素通りする形のポリシー（0行であること）", qual as "USING"
  from pg_policies
 where schemaname = 'public' and tablename = 'profiles'
   and (coalesce(qual::text, '') ~ '\( *\w+ +IS +NULL *\) +OR'
     or coalesce(qual::text, '') ~ ' OR '
     or coalesce(qual::text, '') ~ 'EXISTS');

-- ---------------------------------------------------------------------------
-- ④ RLS そのものが有効か
--
--   ★ここが false なら、ポリシーは1本も効きません。
--     そして「2行」ではなく全行が見えるはずなので、
--     ★たぶん false ではありません。ですが確かめます。
-- ---------------------------------------------------------------------------
select c.relname as "表", c.relrowsecurity as "RLS が有効か",
       c.relforcerowsecurity as "所有者にも強制するか"
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname = 'profiles';

-- ---------------------------------------------------------------------------
-- ⑤ profiles を読む SECURITY DEFINER の関数
--
--   ★直の select には効きません（関数を呼ばない限り）。
--     ですが★ポリシーの USING の中から呼ばれていると、
--     その中では RLS が外れて評価されます。
--     ②の USING に関数名が出ていたら、ここで中身を確かめてください。
-- ---------------------------------------------------------------------------
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       case when pg_get_functiondef(p.oid) like '%search_path%'
            then 'あり' else '★search_path が無い' end as "search_path"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
   and pg_get_functiondef(p.oid) like '%public.profiles%'
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑥ ★見えている行は、何の関係でつながっているか
--
--   ①で出た「他人の id」を <漏れている id> に入れてください。
--   ★どの表でつながっているかが分かれば、どのポリシーが原因かも分かります。
--   ★中身は出しません。つながりの有無だけです。
-- ---------------------------------------------------------------------------
-- select
--   (select count(*) from public.memberships a
--      join public.memberships b on a.org_id = b.org_id
--     where a.user_id = '0648585d-42f7-4d26-b47c-878beba15fa0'
--       and b.user_id = '<漏れている id>') as "同じ教室にいる",
--   (select count(*) from public.enrollments e
--     where e.org_id in (select org_id from public.memberships
--                         where user_id = '0648585d-42f7-4d26-b47c-878beba15fa0')
--       and e.student_id = '<漏れている id>') as "その教室に在籍している",
--   (select count(*) from public.teacher_student_links l
--     where (l.teacher_id = '0648585d-42f7-4d26-b47c-878beba15fa0'
--         and l.student_id = '<漏れている id>')
--        or (l.student_id = '0648585d-42f7-4d26-b47c-878beba15fa0'
--         and l.teacher_id = '<漏れている id>')) as "先生と生徒でつながっている",
--   (select count(*) from public.assignments a
--     where (a.teacher_id = '0648585d-42f7-4d26-b47c-878beba15fa0'
--         and a.student_id = '<漏れている id>')) as "担当になっている";

-- ---------------------------------------------------------------------------
-- ⑦ ★ほかの表にも、同じ形が無いか（ついでに全部見ます）
--
--   今日すでに lessons と entries で見つかっています。
--   ★3つ目があるなら、いま見つけるほうがよいです。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       permissive as "種別", qual as "USING"
  from pg_policies
 where schemaname = 'public'
   and coalesce(qual::text, '') ~ ' OR '
 order by 1, 2;

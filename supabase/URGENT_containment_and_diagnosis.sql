-- ============================================================================
-- ★今夜の封じ込めと、根っこの見立て（2026-09-03）
--
--   ★確認された事実
--     ① teacher_student_links に、招待コード無しで行を作れた
--     ② org_events に、org_id を任意にして行を作れた
--     ★どちらも INSERT の側です。今夜これまで見ていた UPDATE とは別の面です。
--
--   ★いちばん先に確かめるべき仮説
--     org_events の WITH CHECK は is_org_owner_or_admin(...) を呼んでいます。
--     ★それが「思ったとおりに効いていない」なら、
--       ★assignments も同じ関数を呼んでいるので、★同じく開いています。
--     ★1つの関数が壊れていて、2つの表が開いている ―― という形かもしれません。
--     ★assignments を「安全」と決める前に、これを確かめます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★A｜根っこの見立て（読むだけ・1分で済みます）
-- ---------------------------------------------------------------------------

-- A-1 is_org_owner_or_admin の中身（★まだ受け取っていません）
select pg_get_functiondef(p.oid) as "★is_org_owner_or_admin の中身"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'is_org_owner_or_admin';

-- A-2 ★関数そのものを、なりすまして呼んでみる
--     ★教室と無関係な試験用の口座で、true が返るなら★関数が壊れています。
--     ★false が返るなら、関数は正しく、ポリシーの側の問題です。
--   <無関係な人の uuid> と <教室の uuid> を、①の一覧から入れてください。
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<無関係な人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select public.is_org_owner_or_admin(auth.uid(), '<教室の uuid>')
--   as "★false であること（true なら関数が壊れています）";
-- rollback;

-- A-3 org_events のポリシー全文（★WITH CHECK が本当に何を見ているか）
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "★WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename in ('org_events','assignments')
 order by tablename, cmd, policyname;

-- A-4 ★assignments の INSERT も、同じ形で試す
--     ★org_events が通ったなら、こちらも通る見込みが高いです。
--     ★「安全」と決める前に確かめます。
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<無関係な人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- insert into public.assignments (org_id, teacher_id, student_id)
-- values ('<教室の uuid>', auth.uid(), '<別の試験用の人の uuid>')
-- returning id as "★入れてしまえた行（エラーになるのが正しい）";
-- rollback;
-- -- ★もし行が返ったら、すぐ消してください：
-- --   delete from public.assignments where id = '<返ってきた id>';


-- ############################################################################
-- ★B｜封じ込め（★今夜これを流せば、朝まで安全に持ち越せます）
--
--   ★いま、この2つの表に行を作れて困る人は、1人もいません。
--     ・招待コードは11件すべて期限切れ（03:52:03 に実施済み）
--       → ★正しい経路からの teacher_student_links の作成は、もう起きません
--     ・教室は1つだけで、居るのは試験用の口座と運営者ご本人だけ
--       → ★org_events を作る必要が、今夜ありません
--   ★つまり、封じ込めの代償が★ゼロです。
--
--   ★戻し方も、同じところに書いてあります。
-- ############################################################################

-- B-1 ★つながりを作る道を、いったん閉じる
revoke insert on public.teacher_student_links from authenticated;
revoke insert on public.teacher_student_links from anon;

-- B-2 ★教室の予定を作る道を、いったん閉じる
revoke insert on public.org_events from authenticated;
revoke insert on public.org_events from anon;

-- B-3 ★担当も、念のため（A-4 で開いていることが分かった場合のみ）
-- revoke insert on public.assignments from authenticated;
-- revoke insert on public.assignments from anon;

-- ★確かめ
select g.table_name as "表", g.grantee as "誰に", g.privilege_type as "何を"
  from information_schema.role_table_grants g
 where g.table_schema = 'public'
   and g.table_name in ('teacher_student_links','org_events','assignments')
   and g.grantee in ('anon','authenticated')
 order by 1, 2, 3;
-- ★teacher_student_links と org_events に INSERT が★無いこと。

-- ★★ 戻すとき（直しが入ったら、または今夜取りやめるなら）★★
--   grant insert on public.teacher_student_links to authenticated;
--   grant insert on public.org_events to authenticated;
--   ★anon には戻さないこと。もともと要りません。

-- ★service_role には影響しません。サーバ側の経路
--   （app/api/enrollment/accept/route.js など）は、そのまま動きます。


-- ############################################################################
-- ★C｜正しい直しの形（★今夜は流しません。明日以降）
-- ############################################################################
--
--   ★teacher_student_links … ★関数にすべきです
--     理由：作ってよいかの条件が「招待コードが有効で、未使用で、期限内で、
--     その先生のもの」という★4つの組み合わせだからです。
--     ★WITH CHECK では、招待コードを引数として受け取れません。
--     ★条件が「行の中身」ではなく「行の外にある証拠」だからです。
--     → 下書きを supabase/DRAFT_accept_invitation_function.sql に置きます。
--
--   ★org_events … ★A-2 の結果で決まります
--     ・関数が false を返す（関数は正しい）→ ★WITH CHECK の直しで足ります
--     ・関数が true を返す（関数が壊れている）→ ★関数を直します。
--       ★その場合、assignments も同時に直ります。
--     ★どちらかを、確かめてから決めます。当てずっぽうで関数にしません。
--
--   ★assignments … ★A-4 の結果で決まります
--     ★「安全」と決める前に確かめます。org_events と同じ関数を呼んでいます。

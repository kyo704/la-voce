-- ============================================================================
-- ★緊急：先生が生徒の記録を読めるポリシーを消す（2026-09-02）
--
--   ★確認された事実（+t5 のセッションで実行）
--     見える生徒の記録行数：1
--     つながっている先生が、生徒の entries を直接読めていました。
--
--   ★何が残っていたか
--     "Teachers can view active students entries"（SELECT）
--       EXISTS (SELECT 1 FROM teacher_student_links l
--                WHERE l.teacher_id = auth.uid()
--                  AND l.student_id = entries.user_id
--                  AND l.status = 'active')
--
--   ★2026-09-01 に消したのは「入口」だけでした
--     get_student_entries（SECURITY DEFINER）を消しました。あれは
--     ★共有範囲に応じて列を絞って返す関数です。
--     ですが、このポリシーは★行そのものを読ませます。
--     しかも select("*") はすべての列を返すので、
--     ★「先生には決して渡さない11列」も渡ります。
--       cycle_start / medication_tags / location / temperature / humidity /
--       weather / environment_tags / ambient_noise_db / noisy_environment /
--       flight_hours / jetlag_hours
--     つまり、消した関数より★広い道が残っていました。
--
--   ★私（Claude）の 2026-09-01 の発言は誤りでした
--     「共有の廃止は、画面だけでなく構造として済んでいる」と言いました。
--     根拠にしたのは get_student_entries が0件であることだけで、
--     ★entries のポリシーを一度も見ていませんでした。
--
--   ★これからの共有のかたち
--     先生に、記録への常時アクセスはありません。ひとつもありません。
--     共有したいときは、生徒さんが自分で書き出して、アプリの外で渡します。
--
--   ★何度実行しても同じ結果になります。
--   ★記録（entries）の中身には一切触れません。1行も消しません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", qual as "条件"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
 order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- ② 消す
--
--   ★名前が違っていても消せるように、条件でも探します。
--     teacher_student_links を見ている entries のポリシーは、
--     ★1つも残してはいけません。
-- ---------------------------------------------------------------------------
drop policy if exists "Teachers can view active students entries" on public.entries;

do $$
declare
  r record;
begin
  for r in
    select policyname
      from pg_policies
     where schemaname = 'public' and tablename = 'entries'
       and (coalesce(qual::text, '') like '%teacher_student_links%'
         or coalesce(with_check::text, '') like '%teacher_student_links%'
         or coalesce(qual::text, '') like '%assignments%'
         or coalesce(with_check::text, '') like '%assignments%')
  loop
    execute format('drop policy if exists %I on public.entries', r.policyname);
    raise notice '★消しました: %', r.policyname;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 残ってよいのは、本人だけのポリシー1本です
-- ---------------------------------------------------------------------------
select policyname as "残っているポリシー（本人のものだけであること）",
       cmd as "操作", qual as "条件"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
 order by cmd, policyname;

-- ★0行であること（先生に届く道が残っていない）
select policyname as "★まだ残っている先生向けのポリシー（0行であること）"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
   and (coalesce(qual::text, '') like '%teacher_student_links%'
     or coalesce(qual::text, '') like '%assignments%');

-- ---------------------------------------------------------------------------
-- ④ ★ほかの道も、まとめて探します（lessons と entries で2回同じ形が出たため）
-- ---------------------------------------------------------------------------

-- ④-1 entries を読む SECURITY DEFINER の関数（★RLS を素通りします）
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       '★中身を確かめてください' as "確認"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.prosecdef                              -- SECURITY DEFINER のものだけ
   and pg_get_functiondef(p.oid) like '%entries%'
 order by 1;

-- ④-2 「列が null なら誰でも」の形が、ほかの表に残っていないか
select tablename as "表", policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public'
   and (coalesce(qual::text, '') ~ '\( *\w+ +IS +NULL *\) +OR'
     or coalesce(with_check::text, '') ~ '\( *\w+ +IS +NULL *\) +OR')
 order by 1, 2;

-- ④-3 RLS が有効なのに、ポリシーが1本も無い表
--     ★account_deletions は、そう作ってあります（時刻しか持たない表）。
--       それ以外が出たら、確かめてください。
select c.relname as "表"
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
   and not exists (select 1 from pg_policies p
                    where p.schemaname = 'public' and p.tablename = c.relname)
 order by 1;

-- ---------------------------------------------------------------------------
-- ⑤ ★実地の確認（これが本当の答えです）
--
--   ★+t5 でログインした状態で、下を実行してください。
--     service_role では RLS を素通りするので、確かめになりません。
--
--     select count(*) as "見える生徒の記録行数"
--       from public.entries
--      where user_id <> auth.uid();
--
--   ★0 になっていること。直す前は 1 でした。
-- ---------------------------------------------------------------------------

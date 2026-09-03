-- ============================================================================
-- ★誰が、つながりを作れるのか（2026-09-03・読むだけ）
--
--   ★「画面に入口が無い」は、経路が閉じていることではありません。
--     今日それを3回まちがえました（決済／レッスン／助言）。
--   ★API の道は、画面と別に開いています。ポリシーが唯一の関門です。
-- ============================================================================

-- ① teacher_student_links と assignments の、書き込みのポリシー
select tablename as "表", policyname as "ポリシー", cmd as "操作",
       permissive as "種別", roles as "対象",
       qual as "USING", with_check as "★WITH CHECK（作れる条件）"
  from pg_policies
 where schemaname = 'public'
   and tablename in ('teacher_student_links', 'assignments')
 order by 1, 3, 2;

-- ★INSERT のポリシーだけを、はっきり出します。
select tablename as "表", policyname as "ポリシー",
       with_check as "★これを満たせば、行を作れます"
  from pg_policies
 where schemaname = 'public'
   and tablename in ('teacher_student_links', 'assignments')
   and cmd in ('INSERT', 'ALL')
 order by 1, 2;

-- ② いま、何行あるか（★0でも「0だった」と記録してください）
select 'teacher_student_links' as "表", count(*) as "行数" from public.teacher_student_links
union all select 'assignments', count(*) from public.assignments
union all select 'teacher_invitations', count(*) from public.teacher_invitations
union all select 'org_invitations', count(*) from public.org_invitations
union all select 'enrollments', count(*) from public.enrollments
union all select 'link_consents', count(*) from public.link_consents
 order by 1;

-- ③ 招待は使われたか（★つながりの手前の段階）
--    ★招待が発行されていても、受けられていなければ、つながりは生まれません。
select id, teacher_id as "招いた人", created_at as "発行した日時",
       used_at as "使われた日時", expires_at as "期限"
  from public.teacher_invitations
 order by created_at;

-- ④ ★未成年を止めるトリガーは、いま効いているか
--    （つながりを作る道が開いていても、ここで止まる場合があります）
select t.tgname as "トリガー",
       case t.tgenabled when 'O' then '有効' when 'D' then '★無効' else t.tgenabled::text end as "状態"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relname = 'teacher_student_links'
   and not t.tgisinternal;

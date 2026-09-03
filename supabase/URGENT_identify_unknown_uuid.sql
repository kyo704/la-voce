-- ============================================================================
-- ★正体の分からない uuid を、順に絞る（2026-09-03・読むだけ）
--   78548dea-a0e2-4404-b8c0-4acf3d317e6d
--
--   ★上から順に流し、どこで当たったかを報告してください。
--   ★当たった時点で止めてよいですが、⑤だけは必ず流してください。
--   ★人数の凍結は、これが片づくまで続きます。
--     正体の分からない id が1つあるということは、
--     ★名簿がまだ揃っていない、ということです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ② auth.users に居るか（①のログの role は、管理画面で見てください）
-- ---------------------------------------------------------------------------
select id, email as "メール", created_at as "作られた日時",
       last_sign_in_at as "最後のログイン",
       email_confirmed_at as "確認した日時",
       deleted_at as "auth 側の削除日時",
       raw_app_meta_data->>'provider' as "入口"
  from auth.users
 where id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d';
-- ★0行なら③へ。1行返れば、その人です。④へ。

-- ---------------------------------------------------------------------------
-- ③ auth.users に居ないとき：消された跡があるか
-- ---------------------------------------------------------------------------
select * from public.account_deletions
 where user_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d';

-- ★どの表に、この id が残っているか（★総当たりで探します）
--   ★出た表の名前が、その人が何をしていたかを教えてくれます。
select 'profiles' as "表", count(*) from public.profiles where id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'teacher_student_links(teacher)', count(*) from public.teacher_student_links where teacher_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'teacher_student_links(student)', count(*) from public.teacher_student_links where student_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'assignments(teacher)', count(*) from public.assignments where teacher_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'assignments(student)', count(*) from public.assignments where student_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'memberships', count(*) from public.memberships where user_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'enrollments', count(*) from public.enrollments where student_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'lessons(teacher)', count(*) from public.lessons where teacher_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'lessons(student)', count(*) from public.lessons where student_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'lessons(created_by)', count(*) from public.lessons where created_by = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'entries', count(*) from public.entries where user_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'organizations(created_by)', count(*) from public.organizations where created_by = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
union all select 'subscriptions', count(*) from public.subscriptions where user_id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d'
 order by 2 desc, 1;

-- ---------------------------------------------------------------------------
-- ④ auth.users に居るとき：profiles があるか・どの群か
-- ---------------------------------------------------------------------------
select p.id, p.name as "名前", p.display_name as "表示名",
       p.cohort as "群", p.is_internal as "試験用か",
       p.is_tester as "テスターの印",
       p.onboarding_completed as "登録を終えたか",
       p.consent_health_data_at as "同意した日時",
       p.deleted_at as "退会の申し出"
  from public.profiles p
 where p.id = '78548dea-a0e2-4404-b8c0-4acf3d317e6d';
-- ★0行なら「auth にはいるが profiles が無い人」です。
--   ★9/3 に数えたとき、その状態は運営者の打ち間違い3件だけでした。
--     4件目なら、★あの数え上げをやり直す必要があります。

-- ---------------------------------------------------------------------------
-- ⑤ ★名簿の作り直し（これは必ず流してください）
--
--   ★正体の分からない id が1つあったということは、
--     名簿の作り方に漏れがあったということです。
--   ★合計ではなく、1件ずつ出します
--     （「合計が合うことは、内訳が合っている証拠になりません」2026-09-02）。
-- ---------------------------------------------------------------------------
select u.id, u.email as "メール",
       (p.id is not null) as "profiles があるか",
       p.cohort as "群", p.is_internal as "試験用か",
       u.last_sign_in_at as "最後のログイン",
       u.created_at as "作られた日時"
  from auth.users u
  left join public.profiles p on p.id = u.id
 order by u.created_at;

-- ★どの群にも入らない行（0行であること）
select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null
    or (p.cohort is null and p.is_internal is not true);

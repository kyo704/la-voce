-- ============================================================================
-- ★緊急：lessons の「org_id が null なら誰でも」を塞ぐ（2026-09-02）
--
--   ★確認された事実
--     +s1 でログインして public.lessons を数えたところ、3行見えて、
--     そのうち★1行は自分のものではありませんでした。
--
--   ★原因
--     4つのポリシーが、すべて次の形で始まっていました。
--
--         (org_id IS NULL) OR can_view_ops(auth.uid(), org_id, student_id)
--
--     PERMISSIVE のポリシーは OR で足し合わされます。そして
--     org_id が null の行では★左側が真になるので、can_view_ops は
--     一度も呼ばれません。つまり「誰でも通る」状態でした。
--
--     ★紐付け経由で作ったレッスンは、org_id が null です
--       （components/VocalTracker.jsx の handleCreateLesson は
--         link_id・scheduled_at・note・created_by しか入れません）。
--     だから★先生と生徒の1対1のレッスンが、全員に見えていました。
--
--   ★can_view_ops は悪くありません
--     中身は「在籍していて、かつ（教室の管理者 または 担当の先生）」で、
--     正しく書かれています。★その手前の (org_id IS NULL) OR が、
--     関数を呼ぶ前に素通りさせていました。
--
--   ★直し方（いちばん小さい直し）
--     org_id が null の行は、★教室のポリシーの対象から外します。
--     その場合は、もともとある紐付けのポリシーが効きます。
--       「Teacher and student can view lessons」（SELECT）
--       「Teacher can create lessons」（INSERT）
--       「Teacher can update or delete lessons」（UPDATE）
--       「Teacher can delete lessons」（DELETE）
--     これらは teacher_student_links で正しく絞っています。
--     ★紐付けの判定を書き写しません。同じ判定が2か所になるためです。
--
--   ★何度実行しても同じ結果になります。
--   ★データは1行も変えません。ポリシーの条件だけを直します。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
 order by cmd, policyname;

select count(*) as "org_id が null のレッスン（紐付け経由のもの）"
  from public.lessons where org_id is null;

-- ---------------------------------------------------------------------------
-- ② 4つのポリシーを直す
--
--   ★変えるのは1か所だけです。
--       (org_id IS NULL) OR …   →   (org_id IS NOT NULL) AND …
--     null の行は、紐付けのポリシーに任せます。
-- ---------------------------------------------------------------------------

-- SELECT：教室のレッスンを見られる人
--   ★student_id は org のレッスンにしか入りません。null の行では
--     auth.uid() = student_id は常に偽なので、ここに置いても効きません。
--     紐付け経由の生徒は「Teacher and student can view lessons」で見えます。
drop policy if exists "Ops-visible lessons (org-based)" on public.lessons;
create policy "Ops-visible lessons (org-based)" on public.lessons for select
  using (
    org_id is not null
    and (
      auth.uid() = student_id
      or can_view_ops(auth.uid(), org_id, student_id)
    )
  );

-- INSERT：教室のレッスンを作れる人
drop policy if exists "Teachers can create org lessons" on public.lessons;
create policy "Teachers can create org lessons" on public.lessons for insert
  with check (
    org_id is not null
    and can_view_ops(auth.uid(), org_id, student_id)
  );

-- UPDATE：教室のレッスンを直せる人
drop policy if exists "Teachers can update or delete org lessons" on public.lessons;
create policy "Teachers can update or delete org lessons" on public.lessons for update
  using (
    org_id is not null
    and can_view_ops(auth.uid(), org_id, student_id)
  );

-- DELETE：教室のレッスンを消せる人
drop policy if exists "Teachers can delete org lessons" on public.lessons;
create policy "Teachers can delete org lessons" on public.lessons for delete
  using (
    org_id is not null
    and can_view_ops(auth.uid(), org_id, student_id)
  );

-- ---------------------------------------------------------------------------
-- ③ 紐付けのポリシーが、ちゃんと残っていることを確かめる
--
--   ★これが消えていると、紐付け経由のレッスンが★誰にも見えなくなります。
--     4行返ることを確かめてください。
-- ---------------------------------------------------------------------------
select policyname as "紐付けのポリシー（4つ返ること）", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
   and qual::text like '%teacher_student_links%'
    or with_check::text like '%teacher_student_links%'
 order by cmd;

-- ---------------------------------------------------------------------------
-- ④ 直ったことを確かめる
--
--   ★「(org_id IS NULL) OR」で始まるポリシーが、0件であること。
-- ---------------------------------------------------------------------------
select policyname as "★まだ素通りするポリシー（0行であること）", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
   and (coalesce(qual::text, '') like '%org_id IS NULL) OR%'
     or coalesce(with_check::text, '') like '%org_id IS NULL) OR%');

-- ---------------------------------------------------------------------------
-- ⑤ ★実地の確認（これが本当の答えです）
--
--   ★+s1 でログインした状態で、下を実行してください。
--     service_role では RLS を素通りするので、確かめになりません。
--
--     select count(*) as "見える行数",
--            count(*) filter (
--              where not exists (
--                select 1 from public.teacher_student_links l
--                 where l.id = lessons.link_id and l.student_id = auth.uid())
--              and (student_id is null or student_id <> auth.uid())
--            ) as "★自分のものでない行"
--       from public.lessons;
--
--   ★「自分のものでない行」が 0 になっていること。
--     直す前は 1 でした。
-- ---------------------------------------------------------------------------

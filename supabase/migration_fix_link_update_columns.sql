-- ============================================================================
-- ★つながりの行で、書き換えられる列を絞る（#006・2026-09-03）
--   ★承認まで流さないでください。
--
--   ★確認された事実（実地・両方向とも成功しました）
--     ① 生徒が、自分の行の teacher_id を★自分の id に書き換えられた
--     ② 先生が、student_id を★無関係な第三者の id に書き換えられた
--     ★どちらも試験用の口座で行い、同じ出力に入れた戻す文で復旧済みです。
--
--   ★原因
--     ポリシー "Students can update share scope"（UPDATE）
--       USING      : (auth.uid() = teacher_id) OR (auth.uid() = student_id)
--       WITH CHECK : ★なし
--     ★USING は「更新前の行」を見ます。更新後の行は、誰も見ていません。
--
--   ★私の当初の案より、この形のほうが良い理由
--     私は今日くり返し「RLS は列を絞れません」と書きました。★それは正しい。
--     ★ですが「では何なら絞れるのか」を、一度も書きませんでした。
--     ★答えは GRANT です。列単位の権限は、PostgreSQL の標準の機能です。
--       GRANT UPDATE (列名, 列名) ON 表 TO 役割
--     ★私は関数で包む案（案C）を推しましたが、遠回りでした。
--     ★「RLS では無理」で止めず、「何なら可能か」まで言うべきでした。
--
--   ★2枚の板で塞ぎます
--     1枚目：権限（GRANT）… ★そもそも他の列に UPDATE を出さない
--     2枚目：ポリシー（WITH CHECK）… ★身元の列が変わっていないことを確かめる
--     ★どちらか片方が外れても、もう片方が残ります。
--
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の姿（★記録として残してください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'teacher_student_links'
 order by cmd, policyname;

select grantee as "誰に", privilege_type as "何を",
       string_agg(column_name, ', ' order by column_name) as "列（列単位のとき）"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'teacher_student_links'
   and grantee in ('authenticated', 'anon', 'service_role')
 group by grantee, privilege_type
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ② 1枚目：権限を、3列だけに絞る
--
--   ★アプリが実際に書くのは、この3列だけです
--     VocalTracker.jsx:9641-9642
--       .update({ status: "revoked", revoked_at, revoked_by }).eq("id", linkId)
--   ★ほかに UPDATE する場所はありません（全ファイルを検索して確認済み）。
--
--   ★service_role からは剥がしません。運営が手で直せなくなるためです。
-- ---------------------------------------------------------------------------
revoke update on public.teacher_student_links from authenticated;
revoke update on public.teacher_student_links from anon;

grant update (status, revoked_at, revoked_by)
  on public.teacher_student_links to authenticated;

-- ★anon には、1列も渡しません。

-- ---------------------------------------------------------------------------
-- ③ 2枚目：身元の列が、更新前と同じであることを確かめる
--
--   ★teacher_id と student_id の★両方です。片方だけでは足りません。
--     実地で、両方向とも書き換えに成功しています。
--
--   ★副問い合わせは「更新前の値」を見ます。
--     memberships の role_rank で、★実地で確かめた形と同じです（#005）。
--     ★等しいかどうかだけを見ます。順位の比較のような、読んで分かりにくい形にしません。
-- ---------------------------------------------------------------------------
drop policy if exists "Students can update share scope" on public.teacher_student_links;

create policy "link_update_status_only" on public.teacher_student_links
  for update to authenticated
  using (
    auth.uid() = teacher_id or auth.uid() = student_id
  )
  with check (
    -- ★身元の列は、更新前と同じであること（両方です。片方では足りません）
    teacher_id = (select l.teacher_id from public.teacher_student_links l
                   where l.id = teacher_student_links.id)
    and student_id = (select l.student_id from public.teacher_student_links l
                       where l.id = teacher_student_links.id)
    -- ★更新の行き先は「解除」だけ。
    --   ★revoked → active に戻す道を閉じます。
    --   ★つなぎ直しは壊しません。あちらは★新しい行を insert する形です
    --     （teacher_student_links_active_pair_idx が「有効な行だけ」を一意にしており、
    --       解除ずみの行は何行あってもかまいません）。
    --   ★2026-09-03、本番にその部分索引が実在することを確認済みです。
    and status = 'revoked'
  );

comment on policy "link_update_status_only" on public.teacher_student_links is
  '当事者だけが更新でき、teacher_id と student_id は変えられない。書ける列は GRANT で status / revoked_at / revoked_by の3つに絞ってある（2枚の板）。★名前に列を書かないこと。RLS は列を絞れない。';

-- ---------------------------------------------------------------------------
-- ④ 確かめる
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作",
       qual as "USING", with_check as "★WITH CHECK（あること）"
  from pg_policies
 where schemaname = 'public' and tablename = 'teacher_student_links'
 order by cmd, policyname;

-- ★列単位の権限が入ったこと
select grantee as "誰に", privilege_type as "何を",
       string_agg(column_name, ', ' order by column_name) as "★書ける列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'teacher_student_links'
   and grantee = 'authenticated' and privilege_type = 'UPDATE'
 group by grantee, privilege_type;
-- ★status, revoked_at, revoked_by の3つだけであること。

-- ---------------------------------------------------------------------------
-- ⑤ ★実地の確認（これが本当の答えです）
--
--   ★supabase/URGENT_test_link_column_forge.sql の②③を、もう一度流してください。
--   ★どちらも0行、またはエラーになること。
--   ★①で1行返った状態から、0行に変わることを確かめます。
--
--   ★そして、解除がまだできることも確かめてください（塞ぎすぎていないか）。
--     アプリで「つながりの解除」を押し、status が revoked になること。
--     ★守りを足したときは、正しい操作が通ることも必ず確かめます。
-- ---------------------------------------------------------------------------

-- ############################################################################
-- ★assignments について（2026-09-03 追記）
--
--   ★同じ直しを当てるべきかは、まだ決められません。
--     私は assignments のポリシーの★全文を受け取っていません。
--     分かっているのは `assignments_all_owner_admin`（ALL・is_org_owner_or_admin）
--     という名前だけです。★WITH CHECK があるかも分かりません。
--
--   ★assignments にも teacher_id と student_id があります。
--     ★同じ形の穴がある可能性は高いです。
--     ですが、当てずっぽうで GRANT を絞ると、
--     ★教室の管理者が担当を割り当てられなくなるおそれがあります。
--
--   ★先に、これを流してください。
-- ############################################################################

select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "★WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'assignments'
 order by cmd, policyname;

-- ★アプリが assignments に書くのは、この2か所だけです（コードで確認済み）
--     VocalTracker.jsx:10264  insert({ org_id, teacher_id, student_id })
--     VocalTracker.jsx:10279  update({ ended_at })
--     app/api/enrollment/accept/route.js:144  insert({ org_id, teacher_id, student_id })
--   ★update で書くのは ended_at の1列だけです。
--   ★つまり、同じ形の直しが当てられます：
--       revoke update on public.assignments from authenticated, anon;
--       grant update (ended_at) on public.assignments to authenticated;
--     ＋ WITH CHECK で org_id / teacher_id / student_id が変わっていないこと。
--   ★ですが、いまの WITH CHECK を見てからにします。


-- ############################################################################
-- ★assignments の直し（2026-09-03・★実地の確認のあとに流してください）
--
--   ★teacher_student_links とは、欠陥の形が違います
--     teacher_student_links … WITH CHECK が★無い
--     assignments           … WITH CHECK は★ある。ただし
--                             is_org_owner_or_admin をもう一度確かめるだけで、
--                             ★teacher_id / student_id には触れていません。
--     ★「WITH CHECK があるから安全」ではありません。
--       ★何を確かめているかが問題です。
--
--   ★誰の権限で通るか
--     teacher_student_links … ★当事者（生徒・先生）
--     assignments           … ★教室のオーナー・責任者
--     ★後者のほうが、権限としては正しい相手です。
--       ですが「担当を割り当てる権限」と
--       「担当の行を任意の組に作り替える権限」は、★別のものです。
--
--   ★アプリが assignments に書く列（コードで確認済み）
--     insert … org_id / teacher_id / student_id
--               VocalTracker.jsx:10264、app/api/enrollment/accept/route.js:144
--     update … ★ended_at の1列だけ（VocalTracker.jsx:10279）
--   ★update で書くのは1列です。だから GRANT で絞れます。
-- ############################################################################

-- ---------------------------------------------------------------------------
-- ⑥ 1枚目：権限を ended_at だけに絞る
--
--   ★insert は絞りません。3列とも入れる必要があります。
--     ★列単位の GRANT は UPDATE と INSERT で別に指定できます。
-- ---------------------------------------------------------------------------
revoke update on public.assignments from authenticated;
revoke update on public.assignments from anon;

grant update (ended_at) on public.assignments to authenticated;

-- ---------------------------------------------------------------------------
-- ⑦ 2枚目：WITH CHECK に、身元の列が変わっていないことを足す
--
--   ★いまの条件（is_org_owner_or_admin）は★消しません。足します。
--     ★消すと、権限の確認そのものが無くなります。
--   ★org_id も固定します。教室をまたいで付け替えられないようにするためです。
--
--   ★<いまの USING の全文> と <いまの WITH CHECK の全文> は、
--     ★運営者からいただいた実物に置き換えてください。
--     ★私は要約しか受け取っていません。要約から書き起こすと、
--       ★いまの条件を狭めたり広げたりするおそれがあります。
-- ---------------------------------------------------------------------------
-- drop policy if exists "assignments_all_owner_admin" on public.assignments;
-- create policy "assignments_all_owner_admin" on public.assignments
--   for all to authenticated
--   using ( <いまの USING の全文> )
--   with check (
--     ( <いまの WITH CHECK の全文> )
--     and org_id     = coalesce((select a.org_id     from public.assignments a where a.id = assignments.id), org_id)
--     and teacher_id = coalesce((select a.teacher_id from public.assignments a where a.id = assignments.id), teacher_id)
--     and student_id = coalesce((select a.student_id from public.assignments a where a.id = assignments.id), student_id)
--   );
--
--   ★coalesce を使う理由
--     ALL のポリシーは INSERT にも効きます。
--     ★insert のとき、副問い合わせは「まだ無い行」を見るので null になります。
--     ★coalesce が無いと、insert が★すべて弾かれます。
--     coalesce で「元の行が無ければ、新しい値をそのまま認める」形にします。
--     ★これは insert のときだけ効き、update では元の値との比較になります。
--
--   ★ここは、いまの全文をいただいてから確定させます。
--     ★当てずっぽうで書きません。教室の管理者が担当を割り当てられなくなります。

-- ---------------------------------------------------------------------------
-- ⑧ 流したあとの確認（★両方やってください）
-- ---------------------------------------------------------------------------
--   ★塞げたか
--     supabase/URGENT_test_assignment_forge.sql の②を、もう一度流す。
--     ★0行、またはエラーになること。
--
--   ★壊していないか（★こちらを忘れないでください）
--     ・教室の画面で「担当を割り当てる」が、まだできること（insert）
--     ・「担当を外す」が、まだできること（update ended_at）
--     ★守りを足したときは、正しい操作が通ることも必ず確かめます。

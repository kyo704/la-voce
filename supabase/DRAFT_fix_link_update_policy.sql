-- ============================================================================
-- ★下書き（★承認まで流さないでください）：つながりの行の書き換えを塞ぐ
--
--   ★確認された事実（2026-09-03・実地）
--     生徒が、自分のつながりの行の teacher_id を★自分の id に書き換えられました。
--     戻す文が同じ出力に入っていたので、★すぐ元に戻っています。試験用の口座のみ。
--
--   ★原因
--     ポリシー "Students can update share scope"（UPDATE）
--       USING      : (auth.uid() = teacher_id) OR (auth.uid() = student_id)
--       WITH CHECK : ★なし
--     ★USING は「更新前の行」を見ます。更新後の行は、誰も見ていません。
--     だから、通ったあとは★どの列でも書き換えられます。
--
--   ★何ができてしまうか
--     ・生徒が teacher_id を自分にする → その紐付けの「先生」になる。
--       lessons の4ポリシーは teacher_student_links.teacher_id = auth.uid() で
--       絞っているので、★レッスンを読む・作る・消す側へ回れます。
--     ・student_id を他人にする → ★同意していない人とのつながりを作れます。
--
--   ★アプリが実際に送っているのは3列だけです
--     VocalTracker.jsx:9641-9642
--       .update({ status: "revoked", revoked_at, revoked_by }).eq("id", linkId)
--     ★これは呼ぶ側の作法であって、守りではありません。
--
--   ★案は3つ。★私の推しは C です。理由は各案の末尾に書きました。
-- ============================================================================


-- ############################################################################
-- 案A ｜ 身元の列が変わっていないことを、WITH CHECK で確かめる
-- ############################################################################
--
--   ★いちばん小さい変更です。ポリシー1本を置き換えるだけ。
--   ★ですが、更新前の値を副問い合わせで取る形になります。
--     memberships で同じ形を使っており、★実地で効くことは確かめました。
--     ★とはいえ「効くかどうかが読んで分からない」形です。
--     #005 で、その確認に実際の手間がかかりました。

drop policy if exists "Students can update share scope" on public.teacher_student_links;

create policy "link_update_own_row" on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id or auth.uid() = student_id)
  with check (
    -- ★身元の列は、更新前と同じであること。
    teacher_id = (select l.teacher_id from public.teacher_student_links l
                   where l.id = teacher_student_links.id)
    and student_id = (select l.student_id from public.teacher_student_links l
                       where l.id = teacher_student_links.id)
  );

--   ★残る心配
--     ・status を 'revoked' 以外の任意の値にできます（'active' へ戻すなど）。
--     ・列が1つ足されたとき、★その列は野放しです。
--       「変えてよい列」ではなく「変えてはいけない列」を数える形だからです。


-- ############################################################################
-- 案B ｜ 解除だけを許す（身元も、状態の行き先も固定する）
-- ############################################################################
--
--   ★案Aに「行き先は revoked だけ」を足したものです。

drop policy if exists "Students can update share scope" on public.teacher_student_links;

create policy "link_revoke_only" on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id or auth.uid() = student_id)
  with check (
    status = 'revoked'
    and teacher_id = (select l.teacher_id from public.teacher_student_links l
                       where l.id = teacher_student_links.id)
    and student_id = (select l.student_id from public.teacher_student_links l
                       where l.id = teacher_student_links.id)
  );

--   ★残る心配
--     ・revoked_at と revoked_by は、まだ任意の値にできます
--       （他人が解除したように見せかける、など）。
--     ・★やはり「変えてはいけない列」を数える形です。
--     ・つなぎ直し（revoked → active）の道が、これで完全に閉じます。
--       ★migration_teacher_link_reconnect.sql と食い違わないか、要確認です。


-- ############################################################################
-- 案C ｜ ★UPDATE のポリシーを無くし、関数だけにする（★推し）
-- ############################################################################
--
--   ★今日くり返し学んだことの、そのままの適用です。
--     「列を絞りたいときは、ポリシーではなく関数を作る」
--     get_org_member_names / get_connected_names と同じ形。
--
--   ★UPDATE のポリシーが1本も無ければ、★誰も、どの列も書き換えられません。
--     書き換えるのは、この関数の中だけです。
--     ★「変えてはいけない列を数える」のをやめ、
--       ★「変える列を、関数が名指しで決める」形にします。
--   ★列が足されても、関数が触れない限り安全です。★天井が上がりません。

drop policy if exists "Students can update share scope" on public.teacher_student_links;
-- ★UPDATE のポリシーは、1本も作りません。

create or replace function public.revoke_teacher_link(p_link_id uuid, p_by text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  -- ★'teacher' か 'student' 以外は受け取りません。
  if p_by not in ('teacher', 'student') then
    raise exception 'INVALID_ROLE';
  end if;

  -- ★呼んだ人が、その紐付けの当事者であること。
  select exists (
    select 1 from public.teacher_student_links l
     where l.id = p_link_id
       and (l.teacher_id = auth.uid() or l.student_id = auth.uid())
  ) into v_ok;
  -- ★当事者でなければ、何も言わずに終わります。
  --   エラーにすると、id の当たりはずれを調べる道具になります。
  if not v_ok then
    return;
  end if;

  -- ★書き換えるのは、この3列だけです。ここに書いていない列は、動きません。
  update public.teacher_student_links
     set status = 'revoked',
         revoked_at = now(),
         revoked_by = p_by
   where id = p_link_id;
end;
$$;

revoke all on function public.revoke_teacher_link(uuid, text) from public, anon;
grant execute on function public.revoke_teacher_link(uuid, text) to authenticated;

--   ★アプリ側も直します（VocalTracker.jsx:9641-9642）
--       await supabase.rpc("revoke_teacher_link",
--         { p_link_id: linkId, p_by: asRole });
--   ★順番：★関数を先に入れ、コードを後に出します（今日の 7-3）。
--     足すときは受け皿が先です。消すときとは逆になります。
--
--   ★つなぎ直し（revoked → active）について
--     案Cでも、UPDATE の道は閉じます。
--     ★migration_teacher_link_reconnect.sql が UPDATE でつなぎ直しているなら、
--       そちらも関数にする必要があります。★流す前に確かめてください。


-- ############################################################################
-- ★どの案でも、流したあとに確かめること
-- ############################################################################

select policyname as "残っているポリシー", cmd as "操作",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'teacher_student_links'
 order by cmd, policyname;
-- ★案Cなら、UPDATE のポリシーが★0本であること。

-- ★実地の確認：もう一度、書き換えを試す
--   URGENT_test_link_column_forge.sql の②③を、そのまま流してください。
--   ★どちらも0行、またはエラーになること。

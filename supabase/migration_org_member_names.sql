-- ============================================================================
-- 同じ教室の人の「表示名」だけを返す関数（2026-09-02・Opus の裁定）
--
--   ★なぜ要るか
--     メンバー欄に「53ef27ed…」と出ていました。利用者の uuid の頭8文字です。
--     profiles の SELECT ポリシーは auth.uid() = id なので、
--     ★他人の profiles 行は1行も読めません。名前も引けません。
--
--   ★なぜ profiles のポリシーをゆるめないのか
--     RLS は★行単位です。「名前の列だけ見せる」設定はできません。
--     profiles の同じ行には、次のものが入っています。
--       allergies / regular_medications / 周期の設定 / is_under_18 /
--       occupation（本人が書いた自由記述）/ line_user_id …
--     ★行が読めれば、全部読めます。今朝 entries で確かめたとおりです。
--     だから、返す列を関数の側で決めます。
--
--   ★写しは作りません
--     招待の行に名前を写す案は、2026-08 に一度検討して★退けています
--     （supabase/migration_invitation_teacher_name.sql の冒頭）。
--     本人が名前を変えたとき、写した側が古いまま残るためです。
--     ★この関数は profiles を毎回読みます。写しはどこにもありません。
--
--   ★返す列は2つだけです（user_id, display_name）。
--     メールアドレス・学校名・職業・その他の列は返しません。
--     増やすときは、先に「何が相手に見えるか」を本人に見せてから。
--
--   ★何度実行しても同じ結果になります。
--   ★記録（entries）にも profiles にも、1行も書きません。読むだけです。
-- ============================================================================

create or replace function public.get_org_member_names(p_org_id uuid)
returns table(user_id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- ★呼んだ人が、その教室に居ることを先に確かめます。
  --   居なければ★0行を返します。エラーにしません
  --   （エラーにすると、教室の uuid の当たりはずれを調べる道具になります）。
  --
  -- ★can_view_ops と同じ考え方で、関数の中で確かめます。
  --   呼ぶ側に確かめさせると、呼び忘れた場所が穴になります。
  if auth.uid() is null then
    return;
  end if;

  if not exists (
    select 1 from public.memberships m
     where m.org_id = p_org_id and m.user_id = auth.uid()
    union all
    select 1 from public.enrollments e
     where e.org_id = p_org_id and e.student_id = auth.uid()
       and e.status = 'active'
  ) then
    return;
  end if;

  -- ★教室に居る人（職員と、在籍している生徒）の名前を返します。
  --   ★空文字は null にして返します。画面が「名前が無い」と
  --     「読めなかった」を同じに扱えるようにするためです。
  return query
    select p.id, nullif(trim(coalesce(p.display_name, '')), '')
      from public.profiles p
     where p.id in (
       select m.user_id from public.memberships m where m.org_id = p_org_id
       union
       select e.student_id from public.enrollments e
        where e.org_id = p_org_id and e.status = 'active'
     );
end;
$$;

revoke all on function public.get_org_member_names(uuid) from public, anon;
grant execute on function public.get_org_member_names(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ方（★ふつうの利用者のセッションで。service_role では意味がありません）
-- ---------------------------------------------------------------------------

-- ① その教室に居る人が呼ぶ → 人数ぶん返ること
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<その教室に居る人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select * from public.get_org_member_names('<教室の uuid>');
-- rollback;

-- ② ★その教室に居ない人が呼ぶ → ★0行であること
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<関係のない人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★0 であること" from public.get_org_member_names('<教室の uuid>');
-- rollback;

-- ③ ★profiles そのものは、あいかわらず読めないこと
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<その教室に居る人の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- select count(*) as "★1 であること（自分の行だけ）" from public.profiles;
-- rollback;

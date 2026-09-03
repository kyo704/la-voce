-- ============================================================================
-- ★下書き：招待を受けて、つながりを作る関数（★今夜は流しません）
--
--   ★なぜ WITH CHECK では足りないのか
--     作ってよいかの条件は、こうです。
--       ・招待コードが実在する
--       ・そのコードが、その先生のものである
--       ・まだ使われていない（used_at が null）
--       ・期限内である（expires_at > now()）
--     ★これらは「作ろうとしている行の中身」ではありません。
--     ★「行の外にある証拠」です。WITH CHECK は、行の中身しか見られません。
--     ★招待コードを引数として受け取る場所が、ポリシーにはありません。
--
--   ★だから関数にします。get_org_member_names / get_connected_names と同じ形。
--     ★違いは、こちらが★書き込むことです。読むだけの関数より慎重に書きます。
--
--   ★この関数が入ったら、teacher_student_links への直接の INSERT 権限は
--     ★二度と戻しません。作る道は、この関数だけにします。
-- ============================================================================

create or replace function public.accept_teacher_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★① 招待を、4つの条件すべてで引きます。
  --   ★1つでも欠ければ、v_teacher は null のままです。
  select i.teacher_id into v_teacher
    from public.teacher_invitations i
   where i.code = p_code
     and i.used_at is null
     and i.expires_at > now();

  if v_teacher is null then
    -- ★「コードが無い」と「使用済み」と「期限切れ」を分けません。
    --   ★分けると、コードの当たりはずれを調べる道具になります。
    raise exception 'INVITATION_NOT_USABLE';
  end if;

  -- ★② 自分自身とはつながれません。
  if v_teacher = auth.uid() then
    raise exception 'CANNOT_LINK_TO_SELF';
  end if;

  -- ★③ 行を作ります。teacher_id は★招待から取ります。
  --   ★呼ぶ側からは受け取りません。ここが要点です。
  --   ★引数は招待コードだけ。相手の uuid を渡す口がありません。
  insert into public.teacher_student_links
    (teacher_id, student_id, status, accepted_at)
  values (v_teacher, auth.uid(), 'active', now())
  returning id into v_link_id;

  -- ★④ 招待を使用済みにします。★同じ関数の中で行います。
  --   ★これまで画面側で行っていて、0行に当たっても気づけませんでした
  --     （インシデント #004）。ここなら service_role なので、必ず立ちます。
  update public.teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code;

  return v_link_id;
end;
$$;

revoke all on function public.accept_teacher_invitation(text) from public, anon;
grant execute on function public.accept_teacher_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- ★未成年を止めるトリガーとの関係
--
--   trg_block_minor_teacher_link は before insert に付いています。
--   ★この関数の insert でも、そのまま効きます。
--   ★security definer でもトリガーは走ります。素通りしません。
--   ★弾かれると MINOR_TEACHER_LINK_BLOCKED の例外が上がり、
--     この関数ごと巻き戻ります（招待も使用済みになりません）。★正しい動きです。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ★アプリ側の直し（VocalTracker.jsx:9556 以降）
--
--   いま：
--     .from("teacher_student_links").insert({ teacher_id, student_id, status, accepted_at })
--     …
--     .from("teacher_invitations").update({ used_at, used_by_student_id })   ← ★0行に当たっていた
--
--   これから：
--     const { data: linkId, error } = await supabase
--       .rpc("accept_teacher_invitation", { p_code: pendingInvitation.code });
--
--   ★順番：関数を先に入れ、コードを後に出します（今日の 7-3）。
--   ★#004（招待が使用済みにならない）も、これで同時に直ります。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ★確かめ方（★ふつうの利用者のセッションで）
-- ---------------------------------------------------------------------------
-- ① 有効なコードで、つながりができること
-- ② ★期限切れのコードでは、INVITATION_NOT_USABLE になること
-- ③ ★使用済みのコードでは、同じくエラーになること
-- ④ ★存在しないコードでも、同じエラー文であること（区別できないこと）
-- ⑤ ★直接の insert が、もうできないこと
--      insert into public.teacher_student_links (teacher_id, student_id, status)
--      values ('<任意の先生>', auth.uid(), 'active');
--      ★権限が無いのでエラーになること。
-- ⑥ ★招待が使用済みになっていること（#004 の確認）

-- ============================================================================
-- ★下書き：作成の側を、関数に寄せる（2026-09-04・★まだ流しません）
--
--   ★昨夜の封じ込め
--     revoke insert on teacher_student_links / org_events from authenticated, anon
--     ★いまは、画面から行を作れません。この関数が、その代わりになります。
--
--   ★なぜ WITH CHECK では直せないのか（①のほう）
--     作ってよい条件は「招待コードが実在し・その先生のもので・未使用で・期限内」。
--     ★これは行の中身ではなく、★行の外にある証拠です。
--     ★WITH CHECK には、招待コードを受け取る口がありません。
-- ============================================================================


-- ############################################################################
-- ① 招待を受けて、つながりを作る
-- ############################################################################

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

  -- ★① 4つの条件すべてで引きます。1つでも欠ければ null のままです。
  select i.teacher_id into v_teacher
    from public.teacher_invitations i
   where i.code = p_code
     and i.used_at is null
     and i.expires_at > now();

  if v_teacher is null then
    -- ★「無い」「使用済み」「期限切れ」を分けません。
    --   ★分けると、コードの当たりはずれを調べる道具になります。
    raise exception 'INVITATION_NOT_USABLE';
  end if;

  if v_teacher = auth.uid() then
    raise exception 'CANNOT_LINK_TO_SELF';
  end if;

  -- ★② つながりを作ります。
  --   ★teacher_id は招待から取ります。呼ぶ側からは受け取りません。
  --   ★student_id は auth.uid() です。これも受け取りません。
  --   ★引数は招待コードだけ。相手の uuid を渡す口が、どこにもありません。
  --
  --   ★未成年の判定は、ここに書き写しません。
  --     trg_block_minor_teacher_link（before insert）が、この insert でも走ります。
  --     ★security definer でもトリガーは素通りしません。
  --     ★書き写すと、同じ判断が2か所になります。この repo がくり返してきた欠陥です。
  --     ★年齢の規則を変えたとき、片方だけ直されます。
  --   ★ここでするのは「弾かれた理由を、読める形にして返す」ことだけです。
  begin
    insert into public.teacher_student_links
      (teacher_id, student_id, status, accepted_at)
    values (v_teacher, auth.uid(), 'active', now())
    returning id into v_link_id;
  exception
    when others then
      if sqlerrm like '%MINOR_TEACHER_LINK_BLOCKED%' then
        raise exception 'MINOR_NOT_ALLOWED';
      elsif sqlstate = '23505' then
        raise exception 'ALREADY_LINKED';
      else
        raise;
      end if;
  end;

  -- ★③ つながりの同意を、同じ処理の中で記録します。
  --   ★いまは画面側が別に insert しています（VocalTracker.jsx:9589）。
  --   ★片方だけ成功する状態を、作らないためです。
  --   ★列名は移行ファイルで確かめました（linked_at であって agreed_at ではありません）。
  --   ★on conflict は書きません。link_consents は台帳で、
  --     つながり→解除→つなぎ直しで★行が増えるのが正しい姿です。
  --     一意制約もありません。
  --
  --   ★★ 判断が要ります：版の文字列を、どこに置くか ★★
  --     いまは lib/linkConsent.js の LINK_AGREEMENT_VERSION が唯一の正です。
  --     ここに書き写すと、★同じ事実が2か所になります（この repo の欠陥そのもの）。
  --     ですが、引数で受け取ると★呼ぶ側が偽の版を渡せます。
  --     ★同意の記録なので、偽れないほうを採りました（下は書き写しです）。
  --     ★版を上げるときは、★このファイルも同時に直してください。
  --       検査 components/tests/link-consent-wording.test.js に、
  --       ★両方が一致することを見る行を足します。
  insert into public.link_consents (teacher_id, student_id, agreement_version, linked_at)
  values (v_teacher, auth.uid(), 'link-2026-09-03', now());

  -- ★④ 招待を使用済みにします。
  --   ★これまで画面側で行っていて、★0行に当たっても気づけませんでした（#004）。
  --     生徒が、先生の行を更新しようとしていたためです。
  --   ★ここは security definer なので、必ず立ちます。
  --   ★#004 は、これで直ります。別の直しは要りません。
  update public.teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code;

  return v_link_id;
end;
$$;

revoke all on function public.accept_teacher_invitation(text) from public, anon;
grant execute on function public.accept_teacher_invitation(text) to authenticated;


-- ############################################################################
-- ② 教室の予定を作る
--
--   ★この関数の中身は、まだ確定できません。
--     is_org_owner_or_admin が正しく効いているかを、まだ確かめていないためです。
--     ★昨夜の引き継ぎの「1-B」を先に流してください。
--
--     ・関数が false を返す（正しい）→ ★下の形でよい
--     ・関数が true を返す（壊れている）→ ★下の形では足りません。
--       ★同じ関数を呼ぶ assignments も、同時に開いていることになります。
--       その場合は、この関数の中で memberships を★直に見ます。
-- ############################################################################

create or replace function public.create_org_event(
  p_org_id uuid, p_event_date date, p_kind text, p_title text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★呼んだ人が、その教室のオーナーか責任者であること。
  --   ★p_org_id は呼ぶ側から来ます。だから★ここで必ず確かめます。
  --
  --   ★この関数の中身について（2026-09-04・出どころを明記します）
  --     is_org_owner_or_admin が role in ('owner','admin') である、という確認は
  --     ★運営者が本番で行ったものです。★私（実装側）は定義を見ていません。
  --     ★私が確かめたのは role_rank であって、この関数ではありません（#005）。
  --     ★もし後日この前提が崩れたら、②-B（memberships の直読み）に替えてください。
  if not public.is_org_owner_or_admin(auth.uid(), p_org_id) then
    -- ★「権限が無い」と「その教室が無い」を分けません。
    return null;
  end if;

  insert into public.org_events (org_id, event_date, kind, title, created_by)
  values (p_org_id, p_event_date, p_kind, coalesce(p_title, ''), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_org_event(uuid, date, text, text) from public, anon;
grant execute on function public.create_org_event(uuid, date, text, text) to authenticated;


-- ############################################################################
-- ②-B ★変種B：is_org_owner_or_admin が壊れていた場合
--
--   ★1-B が true を返したら、②-A（上）は使えません。★壊れた関数を呼ぶだけです。
--   ★そのときは、こちらを使います。memberships を★直に見ます。
--
--   ★memberships の列は、9/1 のダンプの CREATE TABLE で確かめました。
--     id / org_id / user_id / role / created_at
--     CHECK (role = ANY (ARRAY['owner','admin','teacher']))
--   ★推測ではありません。
--
--   ★これは「同じ判断が2か所」になります。承知のうえです。
--     ★壊れている関数に判断を委ねるほうが危ないためです。
--     ★関数を直したら、②-A に戻してください。そのときこの関数は消します。
-- ############################################################################

create or replace function public.create_org_event(
  p_org_id uuid, p_event_date date, p_kind text, p_title text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★memberships を直に見ます。関数を経由しません。
  if not exists (
    select 1 from public.memberships m
     where m.org_id = p_org_id
       and m.user_id = auth.uid()
       and m.role in ('owner', 'admin')
  ) then
    -- ★「権限が無い」と「その教室が無い」を分けません。
    --   ★分けると、教室の uuid の当たりはずれを調べる道具になります。
    return null;
  end if;

  insert into public.org_events (org_id, event_date, kind, title, created_by)
  values (p_org_id, p_event_date, p_kind, coalesce(p_title, ''), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_org_event(uuid, date, text, text) from public, anon;
grant execute on function public.create_org_event(uuid, date, text, text) to authenticated;


-- ############################################################################
-- ★呼ぶ側の差し替え（両方の表）
-- ############################################################################
--
--   ★順番：関数を先に入れ、コードを後に出します（昨日の 7-3）。
--     足すときは受け皿が先。消すときとは逆です。
--
--   ① 招待を受ける ― components/VocalTracker.jsx
--      いま：9556（つながり insert）／9589（link_consents insert）／
--            9592（used_at update）の★3つを、画面が順に呼んでいます。
--      これから：★1本にまとめます。
--
--        const { data: linkId, error } = await supabase
--          .rpc("accept_teacher_invitation", { p_code: pendingInvitation.code });
--        if (error) {
--          // ★関数が返すのは、この3つだけです。
--          //   INVITATION_NOT_USABLE / MINOR_NOT_ALLOWED / ALREADY_LINKED
--          //   ★どれも「なぜ駄目か」を利用者に伝えられる粒度です。
--          //   ★INVITATION_NOT_USABLE は、無い・使用済み・期限切れを分けません。
--        }
--
--      ★9589 と 9592 は★消します。関数の中でやります。
--      ★9606 の /api/enrollment/accept は、そのまま残します。
--        あちらは在籍と担当を作るもので、つながりができた後の処理です。
--
--   ② 教室の予定を作る ― components/VocalTracker.jsx:10019-10022
--      いま：
--        .from("org_events").insert({ org_id, event_date, kind, title, created_by })
--      これから：
--        const { data: eventId, error } = await supabase
--          .rpc("create_org_event", {
--            p_org_id: orgId, p_event_date: newEvent.date,
--            p_kind: newEvent.kind, p_title: newEvent.title || ""
--          });
--        // ★eventId が null なら、権限がありません。
--        //   ★エラーではなく null で返します。教室の uuid を
--        //     探る道具にしないためです。画面には
--        //     「この教室に予定を作る権限がありません」と出します。
--      ★created_by は渡しません。関数が auth.uid() を入れます。

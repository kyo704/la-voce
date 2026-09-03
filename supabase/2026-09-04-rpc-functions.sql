-- 招待の受け入れと、教室の予定作成（2026-09-04・★本番の復旧）
-- 全245行 / 末尾は「 order by 1;」
--
-- ============================================================================
--   ★いま何が起きているか
--     ・accept_teacher_invitation が★本番に存在しません（作成 SQL が届いていなかった）
--     ・create_org_event は存在しますが、★引数が違います
--         本番 : (p_org_id uuid, p_title text, p_event_type text,
--                 p_starts_at timestamptz, p_ends_at timestamptz)
--         画面 : (p_org_id, p_event_date, p_kind, p_title)
--       ★この署名は、リポジトリのどこにもありません（検索して確認）。
--       ★手で当てられた、古いものと思われます。
--     ・commit adcccdf で直接の insert を外し、insert 権限も剥がしてあるため、
--       ★いま誰も、招待を受けられず、予定も作れません。
--
--   ★引数が違う関数は「置き換え」になりません。★別物として並びます（多重定義）。
--     ★PostgREST は名前で呼ぶので、並ぶと呼び分けが壊れます。
--     ★だから古いほうを、引数を全部書いて drop します。
--
--   ★上から順に、そのまま流してください。
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================


-- ############################################################################
-- (a) 招待を受けて、つながりを作る
-- ############################################################################

CREATE OR REPLACE FUNCTION public.accept_teacher_invitation(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_teacher uuid;
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★4つの条件すべてで引きます。1つでも欠ければ null のままです。
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

  -- ★teacher_id は招待から、student_id は auth.uid() から決めます。
  --   ★呼ぶ側から相手の uuid を受け取る口が、どこにもありません。
  --
  -- ★未成年の判定は、ここに書き写しません。
  --   trg_block_minor_teacher_link（before insert）が、この insert でも走ります。
  --   ★security definer でもトリガーは素通りしません。
  --   ★書き写すと、同じ判断が2か所になります。
  -- ★ここでするのは「弾かれた理由を、読める形にして返す」ことだけです。
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

  -- ★同意の記録。★列名は移行ファイルで確かめました（linked_at です）。
  --   ★on conflict は書きません。台帳なので、行が増えるのが正しい姿です。
  --   ★版の文字列は lib/linkConsent.js の LINK_AGREEMENT_VERSION と同じものです。
  --     ★引数で受け取ると、呼ぶ側が偽の版を渡せます。同意の記録なので書き写します。
  --     ★版を上げるときは、このファイルも同時に直してください。
  --       検査 components/tests/link-consent-wording.test.js が一致を見ています。
  --   ★ここが落ちても、つながりは残ります。★記録できなかったことだけを上げます。
  begin
    insert into public.link_consents
      (teacher_id, student_id, agreement_version, linked_at)
    values (v_teacher, auth.uid(), 'link-2026-09-03', now());
  exception
    when others then
      raise warning 'LINK_CONSENT_NOT_RECORDED: %', sqlerrm;
  end;

  -- ★招待を使用済みにします。
  --   ★これまで画面側で行っていて、★0行に当たっても気づけませんでした（#004）。
  --     生徒が、先生の行を更新しようとしていたためです。
  --   ★ここは security definer なので、必ず立ちます。#004 は、これで直ります。
  update public.teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code;

  return v_link_id;
end;
$$;


-- ############################################################################
-- (b) 古い create_org_event を落とす
--
--   ★引数を全部書きます。★書かないと「別の関数」として並び、
--     ★PostgREST が名前で呼んだときに、呼び分けが壊れます。
--   ★if exists を付けてあるので、無くてもエラーになりません。
-- ############################################################################

DROP FUNCTION IF EXISTS public.create_org_event(
  p_org_id uuid, p_title text, p_event_type text,
  p_starts_at timestamptz, p_ends_at timestamptz
);

-- ★念のため、新しいほうの署名も落としてから作り直します。
--   ★引数の型だけが違う版が残っていると、同じ問題が起きます。
DROP FUNCTION IF EXISTS public.create_org_event(
  p_org_id uuid, p_event_date date, p_kind text, p_title text
);


-- ############################################################################
-- (c) 教室の予定を作る（★画面が呼んでいる署名）
--
--   ★列名は supabase/migration_org_events.sql:28-48 で確かめました。
--     org_id / event_date（date） / kind / title / created_by
--     ★event_type / starts_at / ends_at という列は、この表にありません。
-- ############################################################################

CREATE OR REPLACE FUNCTION public.create_org_event(
  p_org_id uuid, p_event_date date, p_kind text, p_title text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★p_org_id は呼ぶ側から来ます。だから★ここで必ず確かめます。
  --   ★is_org_owner_or_admin が role in ('owner','admin') であることは、
  --     ★運営者が本番で確認されたものです。私は定義を見ていません。
  --     ★前提が崩れたら、memberships を直に見る形へ替えてください。
  if not public.is_org_owner_or_admin(auth.uid(), p_org_id) then
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


-- ############################################################################
-- (d) 実行の権限
--
--   ★revoke ... from public が要ります。関数は既定で PUBLIC に EXECUTE が付き、
--     ★外さないとログインしていない人にも呼べます。
--   ★そのうえで authenticated に明示的に戻します。★この2行は対です。
--     ★昨夜、片方が落ちて呼べなくなりました。
-- ############################################################################

REVOKE ALL ON FUNCTION public.accept_teacher_invitation(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_teacher_invitation(text) TO authenticated;

REVOKE ALL ON FUNCTION public.create_org_event(uuid, date, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_org_event(uuid, date, text, text) TO authenticated;


-- ############################################################################
-- (e) 確かめる（★読むだけ）
-- ############################################################################

-- ★① 2つとも、正しい引数で1つずつ存在すること
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       p.prosecdef as "SECURITY DEFINER か",
       case when pg_get_functiondef(p.oid) like '%search_path%'
            then 'あり' else '★無い' end as "search_path"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('accept_teacher_invitation','create_org_event')
 order by 1, 2;
-- ★accept_teacher_invitation(p_code text) が1行
-- ★create_org_event(p_org_id uuid, p_event_date date, p_kind text, p_title text) が1行
-- ★★create_org_event が2行出たら、古いほうが残っています。(b) を見直してください。

-- ★② 実行の権限が、authenticated にあること
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数",
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as "★authenticated が呼べるか",
       has_function_privilege('anon', p.oid, 'EXECUTE') as "anon が呼べるか（false であること）"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('accept_teacher_invitation','create_org_event')
 order by 1;

-- ★③ ★昨夜の package のうち、ほかに届いていないものが無いか
--    ★8つすべてが並ぶこと。欠けていたら、それも届いていません。
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in (
     'accept_teacher_invitation',
     'create_org_event',
     'get_connected_names',
     'get_org_member_names',
     'assert_link_identity_unchanged',
     'assert_assignment_identity_unchanged',
     'assert_org_event_identity_unchanged',
     'assert_lesson_identity_unchanged'
   )
 order by 1;

-- ★④ トリガー4本も、あわせて確かめてください（③の assert_* に対応します）
select c.relname as "表", t.tgname as "トリガー",
       case t.tgenabled when 'O' then '有効' else '★無効' end as "状態"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and not t.tgisinternal
   and t.tgname like 'trg_%_identity_immutable'
 order by 1;

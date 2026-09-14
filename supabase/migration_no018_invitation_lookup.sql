-- ============================================================================
-- No.018 ── 先生の 招待コードを、★画面から 直に 読まない ように する
--
--   ★出どころ 2026-09-14、★裁定（★Opus・坂本さん 承認）／★修正の記録 No.018
--
--   ★★いま、★画面が この 表を 直に 読んで います ──
--     `components/VocalTracker.jsx:11149`
--       .from("teacher_invitations").select("code, teacher_id, expires_at, used_at")
--
--   ★★だから、★読む 決まりを 締めると **招待が 使えなく なります**。
--     ★★生徒は まだ その 先生の 誰でも ありません。★0行が 返ります。
--     ★★画面は「コードが 見つかりませんでした」と 出します。★コードは 正しいのに。
--     ★★2026-09-01 に、★在籍で 同じ ことが 起きました。
--
--   ★★だから 順番を 守ります。
--     ★① 道を 広げる（★この 紙）
--     ★② 画面を その 道に 移す（★別の 便で・コード）
--     ★③ 動く ことを 確かめる
--     ★④ ★そのあとで 読む 決まりを 締める（★別の 紙）
--
--   ★★新しい 関数を 作りません。★すでに ある `get_invitation_teacher` を 広げます。
--     ★★同じ ことを する ものを 2つ 作らない、という 決めの とおりです。
--
--   ★★何度 流しても 安全です（`create or replace`）。
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════
-- 第1段　★死んで いる 決まりを 落とす（★独立して 流せます）
-- ════════════════════════════════════════════════════════════════════
--
--   ★★名前は「使用済みに する」。★けれど `with_check` は `used_at IS NULL`。
--     ★★この 決まりを 通って 使用済みに する ことは **できません**。
--   ★★`used_at` を 立てて いるのは、★`accept_teacher_invitation` です。
--     ★`SECURITY DEFINER` なので、★決まりを 越えます。
--   ★★画面からの update は、★2026-09-04 に すでに 消して あります（★#004）。

drop policy if exists "Students can mark invitation as used"
  on public.teacher_invitations;

-- ★★落ちたかを 見ます。
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
order by cmd, policyname;


-- ════════════════════════════════════════════════════════════════════
-- 第2段　★`get_invitation_teacher` を 広げる
-- ════════════════════════════════════════════════════════════════════
--
--   ★★これまで … 先生の 名前だけ。★見つからなければ `null`。
--   ★★これから … 先生の 名前に 加えて、
--       ★`ok`      … 使える コードか
--       ★`reason`  … 使えない なら、★なぜ（`not_found` ／ `used` ／ `expired`）
--
--   ★★★`code` は 返しません。★呼ぶ 側が すでに 持って います。
--   ★★★`teacher_id` も 返しません。★画面は 使って いません。
--     ★★出す ほど、★漏れる ものが 増えます。
--
--   ★★見つからない ときと 使用済みの ときで、★**返す 形を 変えません**。
--     ★★変えると、★コードを 総当たりして
--       ★「その コードは 在る が 使用済み」と 分かって しまいます。
--     ★★どちらも `{"ok": false, "reason": "..."}` です。
--       ★★理由は 分けます。★画面の 言葉が 変わる からです。
--       ★★けれど `not_found` と `used` は、★画面では 同じ 一文に します。

create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code    text;
  v_teacher uuid;
  v_used    timestamptz;
  v_exp     timestamptz;
  v_who     jsonb;
begin
  -- ★★ログインして いない 人には、★何も 返しません。
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  v_code := upper(trim(coalesce(p_code, '')));
  if v_code = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  -- ★★しぼらずに 引きます。★使用済み・期限切れも 見分ける ため です。
  select i.teacher_id, i.used_at, i.expires_at
    into v_teacher, v_used, v_exp
  from public.teacher_invitations i
  where i.code = v_code
  limit 1;

  if v_teacher is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_used is not null then
    return jsonb_build_object('ok', false, 'reason', 'used');
  end if;
  if v_exp is not null and v_exp <= now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  -- ★★返す 列を しぼります。★`select *` に しないこと。
  select jsonb_build_object(
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school',       nullif(trim(coalesce(p.school, '')), '')
         )
    into v_who
  from public.profiles p
  where p.id = v_teacher;

  return jsonb_build_object(
    'ok', true,
    'teacher', coalesce(v_who, jsonb_build_object(
                 'display_name', null, 'school', null))
  );
end;
$$;

-- ★★匿名には 渡しません。
revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

comment on function public.get_invitation_teacher(text) is
  '★招待コードから、先生の 名前だけを 返します。'
  '★2026-09-14（No.018）、使える コードかの 判定も 返す ように 広げました。'
  '★画面は これを 通します。teacher_invitations を 直に 読みません。';


-- ════════════════════════════════════════════════════════════════════
-- 第3段　★確かめ
-- ════════════════════════════════════════════════════════════════════

-- ★★① 生きて いる コードで（★1つ ご用意ください）
-- select public.get_invitation_teacher('<生きて いる コード>');
--   → {"ok": true, "teacher": {"display_name": "…", "school": "…"}}

-- ★★② 無い コードで
select public.get_invitation_teacher('ZZZZZZZZ');
--   → {"ok": false, "reason": "not_found"}

-- ★★③ 決まりは まだ 締めて いません。
--   ★画面を 新しい 道に 移し、★動く ことを 確かめてから、
--   ★別の 紙で 締めます。
select policyname, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
order by cmd, policyname;

-- ============================================================================
-- 招待した先生の「名前」だけを返す関数
--
-- ★なぜ要るか（同意の問題であって、見た目の問題ではありません）
--   いま生徒は、招待コードを入れると「先生から招待が届いています」とだけ
--   表示され、そのまま共有する項目を選ばされます。
--   ★誰に健康の記録を渡すのかが分からないまま同意している、ということです。
--   名前の分からない相手への共有は、同意として成り立ちません。
--
-- ★なぜクライアントだけで直せないのか
--   profiles の SELECT ポリシーは auth.uid() = id だけです。
--   生徒は先生の profiles 行を1列も読めません。RLS は行単位なので、
--   「名前の列だけ見せる」という設定もできません。
--   だから get_student_entries と同じく、必要な列だけを返す
--   SECURITY DEFINER 関数を用意します。
--
-- ★招待行に名前を写す案は採りません。
--   先生が表示名を変えたときに、写した側が古いまま残るためです。
--   同じ事実が2か所にあると、片方だけ古くなる — このリポジトリで
--   繰り返し起きている不具合そのものです。
--
-- ★返す列は2つだけ（display_name と school）。
--   メールアドレス・ID・その他の列は返しません。
--   増やしたくなったら、まず生徒側に「何が相手に見えるか」を出してから。
--
-- ★把握している弱点: 有効な招待コードを知っていれば、先生の表示名が
--   引けます。ただし現状でも同じコードで teacher_id（UUID）は引けており、
--   コード自体が資格情報である設計は変えていません。返すものが
--   UUID から名前に変わる分だけ、露出は増えます。
--   コードは使用済み・期限切れになった時点で、何も返しません。
-- ============================================================================

create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_result jsonb;
begin
  -- ログインしている人にだけ答える
  if auth.uid() is null then
    return null;
  end if;

  -- ★有効な招待だけ。使用済み・期限切れには何も返さない。
  select i.teacher_id into v_teacher
  from public.teacher_invitations i
  where i.code = upper(trim(p_code))
    and i.used_at is null
    and i.expires_at > now()
  limit 1;

  if v_teacher is null then
    return null;
  end if;

  -- ★ここで返す列を絞る。select * にしないこと。
  select jsonb_build_object(
           'teacher_id', p.id,
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school', nullif(trim(coalesce(p.school, '')), '')
         )
    into v_result
  from public.profiles p
  where p.id = v_teacher;

  return v_result;
end;
$$;

revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;

-- ============================================================================
-- つながったあとの先生の名前
--   「連携中の先生が1名います」としか出ておらず、誰と共有しているのかが
--   本人にも分かりませんでした。解除の判断ができません。
--   ★自分がつながっている先生の分だけを返します。
-- ============================================================================

create or replace function public.get_my_teacher_names()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    return '[]'::jsonb;
  end if;

  -- ★判定は teacher_student_links だけで行う。組織の役割では判定しない
  --   （get_student_entries と同じ方針。担当していない相手を混ぜないため）。
  select coalesce(jsonb_agg(jsonb_build_object(
           'teacher_id', p.id,
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school', nullif(trim(coalesce(p.school, '')), '')
         )), '[]'::jsonb)
    into v_result
  from public.teacher_student_links l
  join public.profiles p on p.id = l.teacher_id
  where l.student_id = auth.uid()
    and l.status = 'active';

  return v_result;
end;
$$;

revoke all on function public.get_my_teacher_names() from public, anon;
grant execute on function public.get_my_teacher_names() to authenticated;

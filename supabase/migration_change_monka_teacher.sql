-- ============================================================================
-- ★門下を 変える（★裁定 その104 Q1・2026-09-19）
--
--   ★★★坂本さんの お決め ──
--     「事務（`meibo`）が 変える。★古い 行の `ended_at` を 閉じ、
--      ★新しい 行を 作る。★同じ 取引で。★履歴を 残す。★古い 行を 消さない。」
--
--   ★★★なぜ 読み道（`security definer`）か
--     ①3つの 書きを **1つの 取引** に します ──
--       ★閉じる／作る／お知らせ。★どれか 1つだけ 通る ことを 防ぎます。
--     ②`authenticated` は `assignments` の `teacher_id` を 書けません
--       （★更新できる のは `ended_at` 1列 だけ です・2026-09-19 に 数えました）。
--     ★★★列の 権限を 広げません。★担当の 付け替えを、★1本の 道に 集めます。
--
--   ★★★門 ── ★`meibo`（学校ぜんぶの 名簿を 見る・直す）を 持つ 方 だけ。
--     ★★役職の 名では 見ません（`has_can` ＝ できこと で 見ます）。
--
--   ★★★お知らせ（★裁定 その104 Q1）
--     ★学生に 1行 …… 「担当の 先生が ○○先生に 変わりました」
--     ★古い 先生に 1行 …… 「○○さんの 担当を 外れました」
--     ★★いまの 蔵に、★お知らせ 専用の 表が ありません。
--       ★★連絡（`org_messages`）に 入れます。★宛て先を その方 1人に します。
--       ★★★これは 実装の 判断 です。★別の 道が よければ 差し替えます。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.change_monka_teacher(
  p_org_id uuid,
  p_student_id uuid,
  p_new_teacher_id uuid
) returns table (
  assignment_id uuid,
  old_teacher_id uuid,
  new_teacher_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old uuid;
  v_new_id uuid;
  v_student_name text;
  v_new_name text;
begin
  -- ★① 門 ── ★できこと で 見ます。★役職の 名では 見ません。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 新しい 先生が、★その 学校の 方か。
  if not exists (
    select 1 from public.memberships m
    where m.org_id = p_org_id and m.user_id = p_new_teacher_id
  ) then
    raise exception 'その 先生は、この 学校に いません';
  end if;

  -- ★③ 学生が、★その 学校に 在籍して いるか。
  if not exists (
    select 1 from public.enrollments e
    where e.org_id = p_org_id and e.student_id = p_student_id
  ) then
    raise exception 'その 方は、この 学校に いません';
  end if;

  -- ★④ いまの 担当（★1人とは 限りません。★ぜんぶ 閉じます）。
  select a.teacher_id into v_old
  from public.assignments a
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null
  order by a.started_at desc nulls last
  limit 1;

  if v_old = p_new_teacher_id then
    raise exception 'すでに その 先生が 担当です';
  end if;

  -- ★⑤ 閉じる ── ★消しません。★履歴に 残します（★裁定 その72）。
  update public.assignments a
  set ended_at = now()
  where a.org_id = p_org_id and a.student_id = p_student_id and a.ended_at is null;

  -- ★⑥ 作る
  insert into public.assignments (org_id, teacher_id, student_id, started_at)
  values (p_org_id, p_new_teacher_id, p_student_id, now())
  returning id into v_new_id;

  -- ★⑦ お知らせ 2行（★宛て先は その方 1人）
  select coalesce(pr.display_name, '') into v_student_name
  from public.profiles pr where pr.id = p_student_id;
  select coalesce(pr.display_name, '') into v_new_name
  from public.profiles pr where pr.id = p_new_teacher_id;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (p_org_id, p_new_teacher_id, auth.uid(), '担当の 先生が 変わりました',
     '担当の 先生が ' || coalesce(nullif(v_new_name, ''), '新しい 先生') ||
     ' に 変わりました。',
     array[p_student_id]);

  if v_old is not null then
    insert into public.org_messages
      (org_id, teacher_id, author_id, title, body, target_user_ids)
    values
      (p_org_id, v_old, auth.uid(), '担当を 外れました',
       coalesce(nullif(v_student_name, ''), 'その 方') ||
       ' さんの 担当を 外れました。',
       array[v_old]);
  end if;

  return query select v_new_id, v_old, p_new_teacher_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★誰が 呼べるか ── ★取り上げてから 渡します
-- ---------------------------------------------------------------------------
revoke all on function public.change_monka_teacher(uuid, uuid, uuid) from public;
revoke all on function public.change_monka_teacher(uuid, uuid, uuid) from anon;
grant execute on function public.change_monka_teacher(uuid, uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select p.proname, p.prosecdef,
--          pg_get_function_identity_arguments(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'change_monka_teacher';
--
--   ★★`prosecdef` が true で、★1本だけ で ある こと。

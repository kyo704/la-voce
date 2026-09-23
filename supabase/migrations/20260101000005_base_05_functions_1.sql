-- ★★★土台 ── 関数 1／3（33 本）
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★`create or replace` なので、★何度 流しても 同じ です。
set local check_function_bodies = off;

create or replace FUNCTION public._is_enrolled_somewhere(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.enrollments e where e.student_id = p_user and e.status = 'active');
$function$;

create or replace FUNCTION public.accept_guardian_consent(p_token text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  select g.id into v_id
  from public.guardian_consents g
  where g.token = p_token
    and g.consented_at is null
    and g.withdrawn_at is null
    and g.expires_at > now()
  limit 1;

  if v_id is null then
    -- ★★★無い ときと、★切れた ときと、★済んだ ときを 分けません。
    --   ★★分けると、★合言葉を 総当たりして 中が 分かります（★裁定 その77）。
    return query select false;
    return;
  end if;

  update public.guardian_consents
  set consented_at = now()
  where id = v_id;

  return query select true;
end;
$function$;

create or replace FUNCTION public.accept_teacher_invitation(p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_teacher uuid;
  v_link_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- 先に取りに行く。行錠はこの UPDATE 自身が取る。
  -- 負けた側は 0 行になり、v_teacher が null のままになる。
  update public.teacher_invitations
     set used_at = now(), used_by_student_id = auth.uid()
   where code = p_code
     and used_at is null
     and expires_at > now()
  returning teacher_id into v_teacher;

  if v_teacher is null then
    raise exception 'INVITATION_NOT_USABLE';
  end if;

  if v_teacher = auth.uid() then
    raise exception 'CANNOT_LINK_TO_SELF';
  end if;

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

  begin
    insert into public.link_consents
      (teacher_id, student_id, agreement_version, linked_at)
    values (v_teacher, auth.uid(), 'link-2026-09-03', now());
  exception
    when others then
      raise warning 'LINK_CONSENT_NOT_RECORDED: %', sqlerrm;
  end;

  return v_link_id;
end;
$function$;

create or replace FUNCTION public.admin_entry_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (
      select 1 from public.profiles
       where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
        from (select user_id, count(*) as n from public.entries group by user_id) e
      ), '[]'::jsonb),
      'fill', (
        select jsonb_build_object(
          'weight_kg',
            count(*) filter (where jsonb_typeof(to_jsonb(weight_kg)) = 'number'),
          'body_fat_pct',
            count(*) filter (where jsonb_typeof(to_jsonb(body_fat_pct)) = 'number'),
          'meals',
            count(*) filter (where jsonb_typeof(to_jsonb(meals)) = 'array'
                               and jsonb_array_length(to_jsonb(meals)) > 0),
          'exercises',
            count(*) filter (where jsonb_typeof(to_jsonb(exercises)) = 'array'
                               and jsonb_array_length(to_jsonb(exercises)) > 0),
          'environment',
            count(*) filter (where jsonb_typeof(to_jsonb(temperature)) = 'number'
                                or jsonb_typeof(to_jsonb(humidity))    = 'number'),
          'medication_tags',
            count(*) filter (where jsonb_typeof(to_jsonb(medication_tags)) = 'array'
                               and jsonb_array_length(to_jsonb(medication_tags)) > 0),
          'mental',
            count(*) filter (where (jsonb_typeof(to_jsonb(mental_tags)) = 'array'
                                    and jsonb_array_length(to_jsonb(mental_tags)) > 0)
                                or coalesce(trim(mental_reason), '') <> ''),
          'cpps_value',
            count(*) filter (where jsonb_typeof(to_jsonb(cpps_value)) = 'number'),
          'voice_memo',
            count(*) filter (where coalesce(trim(voice_memo), '') <> '')
        )
        from public.entries
      )
    )
  end;
$function$;

create or replace FUNCTION public.application_party(p_application_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.applications a
    join public.postings p on p.id = a.posting_id
    where a.id = p_application_id
      and (a.applicant_user_id = auth.uid() or p.owner_user_id = auth.uid())
      and public.matching_visible(a.applicant_user_id, p.owner_user_id)
  )
$function$;

create or replace FUNCTION public.are_connected(viewer_id uuid, other_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    -- 1:1連携（teacher_student_links）。どちらの方向からでも見られるようにする。
    EXISTS (
      SELECT 1 FROM teacher_student_links
      WHERE status = 'active' AND (
        (teacher_id = viewer_id AND student_id = other_id) OR
        (teacher_id = other_id AND student_id = viewer_id)
      )
    )
    OR
    -- 教室経由の担当割り当て（assignments）。同様にどちらの方向からでも見られる。
    EXISTS (
      SELECT 1 FROM assignments
      WHERE ended_at IS NULL AND (
        (teacher_id = viewer_id AND student_id = other_id) OR
        (teacher_id = other_id AND student_id = viewer_id)
      )
    )
$function$;

create or replace FUNCTION public.assert_assignment_identity_unchanged()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.org_id is distinct from old.org_id
     or new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception 'ASSIGNMENT_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end; $function$;

create or replace FUNCTION public.assert_lesson_identity_unchanged()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.link_id is distinct from old.link_id
     or new.org_id is distinct from old.org_id
     or new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception 'LESSON_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end; $function$;

create or replace FUNCTION public.assert_link_identity_unchanged()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception 'LINK_IDENTITY_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end; $function$;

create or replace FUNCTION public.assert_my_periods_org_stable()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.org_id is distinct from old.org_id then
    raise exception
      'MY_PERIODS_ORG_FIXED: このコマの学校は、あとから変えられません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create or replace FUNCTION public.assert_org_event_identity_unchanged()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.org_id is distinct from old.org_id then
    raise exception 'ORG_EVENT_ORG_IMMUTABLE' using errcode = 'P0001';
  end if;
  return new;
end; $function$;

create or replace FUNCTION public.assert_student_is_adult()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from public.profiles p
     where p.id = new.student_id
       and p.is_under_18 is false
  ) then
    raise exception
      'MINOR_TEACHER_LINK_BLOCKED: 未成年、または年齢が未回答のアカウントは、先生とつながれません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;

create or replace FUNCTION public.assignments_old_identity(p_id uuid)
 RETURNS TABLE(org_id uuid, teacher_id uuid, student_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.org_id, a.teacher_id, a.student_id
    from public.assignments a
   where a.id = p_id;
$function$;

create or replace FUNCTION public.audit_row()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_org uuid; v_id text; v_cols jsonb; v_post text;
begin
  v_org := case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'org_id')::uuid else (to_jsonb(new) ->> 'org_id')::uuid end;
  v_id  := case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end;
  if tg_op = 'UPDATE' then
    select jsonb_agg(key) into v_cols
      from jsonb_each(to_jsonb(new)) n where n.value is distinct from (to_jsonb(old) -> n.key);
    if v_cols is null then return new; end if;     -- 何も変わっていなければ残さない
  end if;
  select q.name into v_post from public.memberships m left join public.org_posts q on q.id = m.post_id
   where m.org_id = v_org and m.user_id = auth.uid();
  insert into public.ops_audit_log(org_id, org_name_at, actor_id, actor_post_at, action, target_kind, target_id, detail)
  values (v_org, (select o.name from public.organizations o where o.id = v_org),   -- 学校が消えていれば null
          auth.uid(), v_post, lower(tg_op), tg_table_name, v_id, jsonb_build_object('columns', v_cols));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $function$;

create or replace FUNCTION public.can_grant_post(p_org_id uuid, p_post_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select case
    when p_post_id is null then true
    else not exists (
      select 1
      from public.org_posts t
      cross join lateral jsonb_object_keys(t.perms) as k(perm)
      where t.id = p_post_id
        and t.org_id = p_org_id
        and (t.perms -> k.perm)::text = 'true'
        and k.perm = any (public.school_wide_perms())
        and not public.has_can(p_org_id, k.perm)
    )
  end;
$function$;

create or replace FUNCTION public.can_view_ops_perm(viewer_id uuid, p_org_id uuid, p_student_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (
      select 1 from enrollments
      where org_id = p_org_id and student_id = p_student_id and status = 'active'
    )
    and (
      public.has_can_user(viewer_id, p_org_id, p_perm)
      or exists (
        select 1 from assignments
        where org_id = p_org_id and teacher_id = viewer_id
          and student_id = p_student_id and ended_at is null
      )
    )
$function$;

create or replace FUNCTION public.can_view_organization(viewer_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    exists (select 1 from memberships where org_id = p_org_id and user_id = viewer_id)
    or exists (select 1 from enrollments
                where org_id = p_org_id and student_id = viewer_id and status = 'active')
$function$;

create or replace FUNCTION public.change_monka_teacher(p_org_id uuid, p_student_id uuid, p_new_teacher_id uuid)
 RETURNS TABLE(assignment_id uuid, old_teacher_id uuid, new_teacher_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

create or replace FUNCTION public.character_unlock_summary(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when not exists (select 1 from public.profiles where id = p_user_id)
    then null
    else jsonb_build_object(
      'performances', (
        select count(*)
        from public.entries e
        where e.user_id = p_user_id
          and case
                when jsonb_typeof(to_jsonb(e.activities)) = 'array'
                 and jsonb_array_length(to_jsonb(e.activities)) > 0
                then exists (
                       select 1 from jsonb_array_elements(to_jsonb(e.activities)) a
                       where a ->> 'kind' = '本番')
                else e.activity_type = '本番'
              end
      ),
      'hasPianissimo', coalesce((
        select bool_or(
                 jsonb_typeof(to_jsonb(e.pianissimo_high_note)) <> 'null'
             and to_jsonb(e.pianissimo_high_note) <> '""'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> 'false'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> '0'::jsonb)
        from public.entries e where e.user_id = p_user_id
      ), false),
      'fieldKinds', (
        select count(distinct kv.key)
        from public.entries e,
             lateral jsonb_each(to_jsonb(e.*)) as kv(key, value)
        where e.user_id = p_user_id
          and kv.key not in ('date', 'user_id', 'id')
          and jsonb_typeof(kv.value) <> 'null'
          and not (jsonb_typeof(kv.value) = 'string' and kv.value = '""'::jsonb)
          and not (jsonb_typeof(kv.value) = 'array'  and jsonb_array_length(kv.value) = 0)
      )
    )
  end;
$function$;

create or replace FUNCTION public.choose_applicant(p_application_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_posting uuid;
begin
  -- ★★その 応募が、★自分の 募集の もので あること。
  --   ★★取り下げられて いない こと。★切れて いない こと。
  select p.id into v_posting
  from public.applications a
  join public.postings p on p.id = a.posting_id
  where a.id = p_application_id
    and p.owner_user_id = auth.uid()
    and p.status = 'open'
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id);

  if v_posting is null then
    return false;
  end if;

  update public.applications set status = 'chosen' where id = p_application_id;
  -- ★★募集を 閉じます。★ほかの 応募の 状態は 触りません。
  update public.postings set status = 'closed' where id = v_posting;
  return true;
end;
$function$;

create or replace FUNCTION public.clear_my_busy_slots()
 RETURNS TABLE(removed integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  delete from public.my_timetable t
   where t.user_id = auth.uid()
     and t.unavailable = true;

  get diagnostics n = row_count;
  return query select n;
end;
$function$;

create or replace FUNCTION public.confirm_event_scores(p_org_id uuid, p_event_id uuid)
 RETURNS TABLE(scores integer, reviews integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_s integer := 0;
  v_r integer := 0;
begin
  if not public.has_can(p_org_id, 'saiten') then
    raise exception 'この 学校の 点を 確定できません';
  end if;

  with 済 as (
    update public.evaluation_scores s
    set confirmed_at = now()
    where s.org_id = p_org_id and s.event_id = p_event_id and s.confirmed_at is null
    returning 1
  )
  select count(*) into v_s from 済;

  with 済2 as (
    update public.evaluation_reviews r
    set confirmed_at = now()
    where r.org_id = p_org_id and r.event_id = p_event_id and r.confirmed_at is null
    returning 1
  )
  select count(*) into v_r from 済2;

  return query select v_s, v_r;
end;
$function$;

create or replace FUNCTION public.consent_withdrawn(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select consent_health_data_withdrawn_at is not null
       from public.profiles where id = p_user),
    false)
$function$;

create or replace FUNCTION public.create_org_event(p_org_id uuid, p_event_date date, p_kind text, p_title text, p_start_time time without time zone DEFAULT NULL::time without time zone, p_end_time time without time zone DEFAULT NULL::time without time zone, p_place text DEFAULT NULL::text, p_target_grades text[] DEFAULT '{}'::text[], p_target_courses text[] DEFAULT '{}'::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  -- ★★★門は できこと です（★2026-09-20・台帳 08-1）。
  --   ★★もと … `public.is_org_owner_or_admin(auth.uid(), p_org_id)`
  --   ★★画面の 門は `gyoji` でした。★台帳は 役割の 名 でした。
  --   ★★★学校が `gyoji` を 役職に 付けても、★台帳が 止めて いました。
  if not public.has_can(p_org_id, 'gyoji') then
    return null;
  end if;

  -- ★★前後が 逆なら、★その場で 止めます（★画面でも 止めます。★二重に します）。
  if p_start_time is not null and p_end_time is not null and p_end_time <= p_start_time then
    raise exception 'EVENT_TIME_REVERSED';
  end if;
  if p_start_time is null and p_end_time is not null then
    raise exception 'EVENT_END_WITHOUT_START';
  end if;

  insert into public.org_events (
    org_id, event_date, kind, title, start_time, end_time, place,
    target_grades, target_courses, created_by
  ) values (
    p_org_id, p_event_date, p_kind, coalesce(p_title, ''),
    p_start_time, p_end_time, nullif(btrim(coalesce(p_place, '')), ''),
    -- ★★`null` を 受け取っても、★空の 並びに します（★裁定 その89 RULE）。
    coalesce(p_target_grades, '{}'), coalesce(p_target_courses, '{}'),
    auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$function$;

create or replace FUNCTION public.edit_confirmed_score(p_score_id uuid, p_points numeric, p_reason text)
 RETURNS TABLE(ok boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v public.evaluation_scores;
  v_before numeric;
begin
  select * into v from public.evaluation_scores where id = p_score_id;
  if v.id is null then
    raise exception 'その 点が ありません';
  end if;
  if v.judge_id <> auth.uid() and not public.has_can(v.org_id, 'saiten') then
    raise exception 'その 点を 直せません';
  end if;
  if v.confirmed_at is null then
    raise exception 'まだ 確定して いません';
  end if;

  v_before := v.points;

  perform set_config('app.score_edit', 'on', true);
  update public.evaluation_scores
  set points = p_points, updated_at = now()
  where id = p_score_id;
  perform set_config('app.score_edit', 'off', true);

  insert into public.score_log
    (score_id, org_id, editor_user_id, before_value, after_value, reason)
  values
    (p_score_id, v.org_id, auth.uid(), v_before, p_points,
     nullif(trim(coalesce(p_reason, '')), ''));

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (v.org_id, null, auth.uid(), '点が 直されました',
     to_char(now() at time zone 'Asia/Tokyo', 'MM月DD日') || 'の 点が 直されました。',
     array[v.student_id]);

  return query select true;
end;
$function$;

create or replace FUNCTION public.entries_set_source()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.source is not null then
    return new;
  end if;
  if (now() at time zone 'Asia/Tokyo') < ((new.date + 2)::timestamp) then
    new.source := 'live';
  else
    new.source := 'later';
  end if;
  return new;
end $function$;

create or replace FUNCTION public.evaluation_scores_guard()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- ★★★読み道（`edit_confirmed_score`）からの 直しは 通します。
  --   ★★あちらは `score_log` に 残して から 直します。
  if current_setting('app.score_edit', true) = 'on' then
    return new;
  end if;
  if old.confirmed_at is not null and new.points is distinct from old.points then
    raise exception '確定の あとは、わけを 添えて 直して ください';
  end if;
  return new;
end;
$function$;

create or replace FUNCTION public.get_applicant_detail(p_application_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select jsonb_build_object(
    'application_id', a.id,
    'display_name', pr.display_name,
    'instrument', pf.instrument,
    'bio', case when a.show_career then pf.bio else null end,
    'template_key', a.template_key,
    'available_days', to_jsonb(a.available_days::text[]),
    'status', a.status,
    'career', case when a.show_career then coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title,
                                          'detail', e.detail)
                       order by e.sort_order)
      from public.portfolio_entries e where e.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'recordings', case when a.show_recordings then coalesce((
      select jsonb_agg(jsonb_build_object('title', r.title, 'url', r.url,
                                          'detail', r.detail)
                       order by r.sort_order)
      from public.portfolio_recordings r where r.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'repertoire', case when a.show_repertoire then coalesce((
      select jsonb_agg(t.repertoire_name order by t.repertoire_name)
      from public.repertoire_tessitura t where t.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pr on pr.id = a.applicant_user_id
  left join public.portfolios pf on pf.user_id = a.applicant_user_id
  where a.id = p_application_id
    and p.owner_user_id = auth.uid()
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id)
$function$;

create or replace FUNCTION public.get_applications(p_posting_id uuid)
 RETURNS TABLE(id uuid, applicant_display_name text, applicant_school text, template_key text, available_days text[], status text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select a.id, pr.display_name,
         case when a.show_career then (
           select e.title from public.portfolio_entries e
           where e.user_id = a.applicant_user_id and e.kind = 'school'
           order by e.sort_order limit 1
         ) else null end,
         a.template_key, a.available_days::text[], a.status, a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pr on pr.id = a.applicant_user_id
  where a.posting_id = p_posting_id
    and p.owner_user_id = auth.uid()
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id)
  order by a.created_at
$function$;

create or replace FUNCTION public.get_connected_names(p_ids uuid[])
 RETURNS TABLE(id uuid, display_name text, vocal_profession text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then return; end if;
  return query
    select p.id,
           nullif(btrim(coalesce(p.display_name, '')), ''),
           p.vocal_profession
      from public.profiles p
     where p.id = any(p_ids)
       and p.id <> auth.uid()
       and public.are_connected(auth.uid(), p.id);
end;
$function$;

create or replace FUNCTION public.get_contract_candidates(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select m.user_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name
    from memberships m
    left join profiles p on p.id = m.user_id
   where m.org_id = p_org_id
     and m.user_id <> auth.uid()
     and public.has_can_user(m.user_id, p_org_id, 'master')
     and exists (select 1 from organizations o
                 where o.id = p_org_id and o.contract_owner_user_id = auth.uid())
$function$;

create or replace FUNCTION public.get_invitation_teacher(p_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_teacher uuid;
  v_result jsonb;
  v_code   text;
  v_hash   text;
  v_tries  integer;
  v_pepper text;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  select value into v_pepper from public.app_secrets where name = 'code_pepper';

  if v_pepper is null or length(v_pepper) < 20 then
    raise warning '★code_pepper が ありません（または 短すぎます）。合言葉を 引けません。';
    return null;
  end if;

  v_hash := encode(digest(v_pepper || ' code ' || v_code, 'sha256'), 'hex');

  select count(*) into v_tries
  from public.code_attempts
  where code_hash = v_hash
    and at > now() - interval '24 hours';

  if v_tries >= 10 then
    insert into public.code_attempts (code_hash) values (v_hash);
    return null;
  end if;

  insert into public.code_attempts (code_hash) values (v_hash);

  select i.teacher_id into v_teacher
  from public.teacher_invitations i
  where i.code = v_code
    and i.used_at is null
    and i.expires_at > now()
  limit 1;

  if v_teacher is null then
    return null;
  end if;

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
$function$;

create or replace FUNCTION public.get_lesson_preset_for_student(p_org_id uuid)
 RETURNS TABLE(name text, total_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.name, p.total_count
  from public.lesson_presets p
  where p.org_id = p_org_id
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
$function$;


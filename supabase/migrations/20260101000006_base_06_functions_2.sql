-- ★★★土台 ── 関数 2／3（33 本）
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★`create or replace` なので、★何度 流しても 同じ です。
set local check_function_bodies = off;

create or replace FUNCTION public.get_match(p_application_id uuid)
 RETURNS TABLE(application_id uuid, other_user_id uuid, posting_title text, posting_kind text, posting_days text[], other_display_name text, other_instrument text, i_am_owner boolean, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select a.id,
         case when p.owner_user_id = auth.uid() then a.applicant_user_id
              else p.owner_user_id end,
         p.title, p.kind, p.days::text[],
         case when p.owner_user_id = auth.uid() then pa.display_name
              else po.display_name end,
         case when p.owner_user_id = auth.uid() then
                (select f.instrument from public.portfolios f
                 where f.user_id = a.applicant_user_id)
              else
                (select f.instrument from public.portfolios f
                 where f.user_id = p.owner_user_id)
         end,
         (p.owner_user_id = auth.uid()),
         a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pa on pa.id = a.applicant_user_id
  join public.profiles po on po.id = p.owner_user_id
  where a.id = p_application_id
    and a.status = 'chosen'
    and (a.applicant_user_id = auth.uid() or p.owner_user_id = auth.uid())
    and public.matching_visible(a.applicant_user_id, p.owner_user_id)
$function$;

create or replace FUNCTION public.get_messages(p_application_id uuid)
 RETURNS TABLE(sender_display_name text, template_key text, pieces text[], created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select pr.display_name, a.template_key, null::text[], a.created_at
  from public.applications a
  join public.profiles pr on pr.id = a.applicant_user_id
  where a.id = p_application_id
    and public.application_party(p_application_id)
  union all
  select pr.display_name, m.template_key, m.pieces, m.created_at
  from public.application_messages m
  join public.profiles pr on pr.id = m.sender_user_id
  where m.application_id = p_application_id
    and public.application_party(p_application_id)
  order by 4
$function$;

create or replace FUNCTION public.get_monka_free_counts()
 RETURNS TABLE(student_id uuid, free_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select a.student_id,
         (
           select count(*)::int
           from my_periods p
           cross join (select generate_series(0, 6) as weekday) d
           where p.user_id = a.student_id
             and not exists (
               select 1 from my_timetable t
               where t.user_id = a.student_id
                 and t.weekday = d.weekday
                 and t.period_id = p.id
             )
         ) as free_count
  from assignments a
  where a.teacher_id = auth.uid()
    and a.ended_at is null
$function$;

create or replace FUNCTION public.get_monka_read_notices()
 RETURNS TABLE(viewed_at timestamp with time zone, teacher_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select l.viewed_at,
         nullif(btrim(coalesce(p.display_name, '')), '') as teacher_name
    from public.monka_read_log l
    left join public.profiles p on p.id = l.target_monka_id
   where exists (
     -- ★★★呼んだ 方が、★その 門下に 居た か。
     --   ★★`ended_at` で 絞りません（★裁定 その76 追補）。
     --     ★★やめた あとに 確かめられる ことが あります。
     --     ★★やめた から 知らせない、では 筋が 通りません。
     --   ★★`org_id` と `teacher_id` の 両方で 合わせます。
     --     ★★片方だけ だと、★別の 学校の 同じ 先生に 当たります。
     select 1
       from public.assignments a
      where a.org_id = l.org_id
        and a.teacher_id = l.target_monka_id
        and a.student_id = auth.uid()
   )
   order by l.viewed_at desc
   limit 50;
$function$;

create or replace FUNCTION public.get_my_applications()
 RETURNS TABLE(id uuid, posting_id uuid, posting_title text, posting_kind text, posting_days text[], template_key text, available_days text[], status text, ended text, reply_template_key text, reply_pieces text[], created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select a.id, p.id, p.title, p.kind, p.days::text[],
         a.template_key, a.available_days::text[], a.status,
         case
           -- ★決まった ぶんは 終わりでは ありません。
           when a.status = 'chosen' then null
           when p.status <> 'open' then 'closed'
           when p.expires_at is not null and p.expires_at <= now() then 'expired'
           else null
         end,
         (select m.template_key from public.application_messages m
          where m.application_id = a.id
            and m.sender_user_id = p.owner_user_id
          order by m.created_at desc limit 1),
         (select m.pieces from public.application_messages m
          where m.application_id = a.id
            and m.sender_user_id = p.owner_user_id
          order by m.created_at desc limit 1),
         a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  where a.applicant_user_id = auth.uid()
    and public.matching_visible(auth.uid(), p.owner_user_id)
  order by a.created_at desc
$function$;

create or replace FUNCTION public.get_my_busy_slots()
 RETURNS TABLE(weekday smallint, period_id uuid)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select t.weekday, t.period_id
  from public.my_timetable t
  where t.user_id = auth.uid()
    and t.unavailable = true;
$function$;

create or replace FUNCTION public.get_my_cuts()
 RETURNS TABLE(target_user_id uuid, display_name text, kind text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select c.target_user_id, pr.display_name, c.kind, c.created_at
  from public.matching_cuts c
  join public.profiles pr on pr.id = c.target_user_id
  where c.user_id = auth.uid()
  order by c.created_at desc
$function$;

create or replace FUNCTION public.get_my_monka_invites()
 RETURNS TABLE(code text, teacher_name text, org_name text, expires_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select i.code,
         coalesce(nullif(trim(p.display_name), ''), '先生') as teacher_name,
         coalesce(o.name, '') as org_name,
         i.expires_at
  from public.teacher_invitations i
  left join public.profiles p on p.id = i.monka_teacher_id
  left join public.organizations o on o.id = i.org_id
  where i.kind = 'named'
    and i.target_user_id = auth.uid()
    and i.used_at is null
    and i.expires_at > now();
$function$;

create or replace FUNCTION public.get_my_named_invites(p_org_id uuid)
 RETURNS TABLE(target_user_id uuid, invited_at timestamp with time zone, used_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select i.target_user_id, i.invited_at, i.used_at
  from public.teacher_invitations i
  where i.org_id = p_org_id
    and i.kind = 'named'
    and i.monka_teacher_id = auth.uid();
$function$;

create or replace FUNCTION public.get_my_postings()
 RETURNS TABLE(id uuid, title text, kind text, days text[], status text, application_count integer, expires_at timestamp with time zone, ended boolean, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.id, p.title, p.kind, p.days::text[], p.status,
         (select count(*)::integer from public.applications a
          where a.posting_id = p.id
            and a.status <> 'withdrawn'
            and public.matching_visible(auth.uid(), a.applicant_user_id)),
         p.expires_at,
         (p.status <> 'open'
          or (p.expires_at is not null and p.expires_at <= now())),
         p.created_at
  from public.postings p
  where p.owner_user_id = auth.uid()
  order by p.created_at desc
$function$;

create or replace FUNCTION public.get_my_schools()
 RETURNS TABLE(org_id uuid, name text, enrolled_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select o.id, o.name, e.enrolled_at
  from public.enrollments e
  join public.organizations o on o.id = e.org_id
  where e.student_id = auth.uid()
    and e.status = 'active'
  order by e.enrolled_at asc nulls last, o.id asc
$function$;

create or replace FUNCTION public.get_my_teacher_names()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    return '[]'::jsonb;
  end if;

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
$function$;

create or replace FUNCTION public.get_org_member_names(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, display_title text, role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (
    select 1 from public.memberships m
     where m.org_id = p_org_id and m.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
    select m.user_id,
           nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
           m.display_title,
           m.role
      from public.memberships m
      left join public.profiles p on p.id = m.user_id
     where m.org_id = p_org_id;
end;
$function$;

create or replace FUNCTION public.get_org_student_names(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, kana text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
         nullif(btrim(coalesce(p.kana, '')), '') as kana
    from enrollments e
    left join profiles p on p.id = e.student_id
   where e.org_id = p_org_id
     and e.status = 'active'
     and can_view_ops_perm(auth.uid(), p_org_id, e.student_id, 'sched_all')
$function$;

create or replace FUNCTION public.get_posting_detail(p_posting_id uuid)
 RETURNS TABLE(id uuid, owner_user_id uuid, title text, kind text, piece text, days text[], need_all_days boolean, fee_amount integer, fee_unit text, sodan boolean, owner_display_name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.id, p.owner_user_id, p.title, p.kind, p.piece, p.days::text[],
         p.need_all_days, p.fee_amount, p.fee_unit, p.sodan,
         pr.display_name, p.created_at
  from public.postings p
  join public.profiles pr on pr.id = p.owner_user_id
  where p.id = p_posting_id
    and p.status = 'open'
    and (p.expires_at is null or p.expires_at > now())
    and p.owner_user_id <> auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    and public.matching_visible(auth.uid(), p.owner_user_id)
$function$;

create or replace FUNCTION public.get_postings(p_org_id uuid)
 RETURNS TABLE(id uuid, title text, kind text, days text[], fee_amount integer, fee_unit text, sodan boolean, owner_display_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select p.id, p.title, p.kind, p.days::text[],
         p.fee_amount, p.fee_unit, p.sodan,
         pr.display_name
  from public.postings p
  join public.profiles pr on pr.id = p.owner_user_id
  where p.org_id = p_org_id
    and p.status = 'open'
    and (p.expires_at is null or p.expires_at > now())
    and p.owner_user_id <> auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    and public.matching_visible(auth.uid(), p.owner_user_id)
  order by p.created_at desc
$function$;

create or replace FUNCTION public.get_public_portfolio(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_owner uuid; v_viewer uuid := auth.uid();
begin
  select p.user_id into v_owner from public.portfolios p where p.public_slug = p_slug and p.visibility = 'public';
  if v_owner is null then return null; end if;
  if public.matching_suspended(v_owner) then return null; end if;
  if v_viewer is not null and v_viewer <> v_owner and not public.matching_visible(v_viewer, v_owner) then return null; end if;
  return (
    select jsonb_build_object(
      'display_name', p.display_name, 'instrument', p.instrument, 'bio', p.bio, 'regions', p.regions,
      'entries', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'detail', e.detail) order by e.sort_order) from public.portfolio_entries e where e.user_id = v_owner), '[]'::jsonb),
      'recordings', coalesce((select jsonb_agg(jsonb_build_object('title', r.title, 'url', r.url, 'detail', r.detail) order by r.sort_order)
                               from public.portfolio_recordings r where r.user_id = v_owner), '[]'::jsonb))
    from public.portfolios p where p.user_id = v_owner);
end $function$;

create or replace FUNCTION public.get_student_free_slots(p_org_id uuid, p_user_ids uuid[])
 RETURNS TABLE(user_id uuid, slot_key text, is_free boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select s.user_id,
         (d.weekday::text || '-' || p.ord::text) as slot_key,
         not exists (
           select 1 from my_timetable t
           where t.user_id = s.user_id
             and t.weekday = d.weekday
             and t.period_id = p.id
         ) as is_free
  from unnest(coalesce(p_user_ids, '{}'::uuid[])) as s(user_id)
  join my_periods p on p.user_id = s.user_id
  cross join (select generate_series(0, 6) as weekday) d
  where
    -- ★★その 学校に いま 在る 方 だけ（★やめた 方の 時間割は 出しません）
    exists (
      select 1 from enrollments e
      where e.org_id = p_org_id
        and e.student_id = s.user_id
        and e.status = 'active'
    )
    and (
      -- ★① 学校 全部の 日程を 組む できこと
      has_can(p_org_id, 'sched_all')
      -- ★② 担当の 先生 ご本人
      or exists (
        select 1 from assignments a
        where a.org_id = p_org_id
          and a.student_id = s.user_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    )
  order by s.user_id, d.weekday, p.ord
$function$;

create or replace FUNCTION public.get_teacher_periods(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(id uuid, ord smallint, name text, start_min smallint, end_min smallint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, p.ord, p.name, p.start_min, p.end_min
    from my_periods p
   where p.user_id = p_teacher_id
     and p.org_id = p_org_id
     and (
       p_teacher_id = auth.uid()
       or has_can(p_org_id, 'sched_all')
     )
     and exists (
       select 1 from memberships m
        where m.org_id = p_org_id and m.user_id = p_teacher_id
     )
   order by p.ord
$function$;

create or replace FUNCTION public.get_timetable_submitted(p_org_id uuid)
 RETURNS TABLE(student_id uuid, submitted boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select e.student_id,
         exists (select 1 from public.my_timetable t where t.user_id = e.student_id)
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and (
      public.has_can(p_org_id, 'meibo')
      or exists (
        select 1 from public.assignments a
        where a.org_id = p_org_id
          and a.student_id = e.student_id
          and a.teacher_id = auth.uid()
          and a.ended_at is null
      )
    );
$function$;

create or replace FUNCTION public.give_student_price_consent(p_text_version text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_enrolled boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_text_version is null or btrim(p_text_version) = '' then raise exception 'TEXT_VERSION_REQUIRED'; end if;
  v_enrolled := public._is_enrolled_somewhere(v_uid);
  insert into public.student_price_consents(user_id, text_version, checked_at, enrolled)
  values (v_uid, p_text_version, now(), v_enrolled);
  return v_enrolled;
end $function$;

create or replace FUNCTION public.guard_enrollment_grade_label()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.grade_label is null then
      return new;
    end if;
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
    return new;
  end if;
  if new.grade_label is distinct from old.grade_label then
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;

create or replace FUNCTION public.guard_grade_label()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.grade_label is null then
      return new;
    end if;
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if new.grade_label is distinct from old.grade_label then
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

create or replace FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, name, email, occupation, school)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'occupation',
    new.raw_user_meta_data->>'school'
  );
  insert into public.subscriptions (user_id, status)
  values (new.id, 'none');
  return new;
end;
$function$;

create or replace FUNCTION public.has_can(p_org_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_can_user(auth.uid(), p_org_id, p_perm);
$function$;

create or replace FUNCTION public.has_can_user(p_user_id uuid, p_org_id uuid, p_perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.memberships m
    join public.org_posts p on p.id = m.post_id
    where m.org_id = p_org_id
      and m.user_id = p_user_id
      and coalesce((p.perms -> p_perm)::text, 'false') = 'true'
  );
$function$;

create or replace FUNCTION public.has_guardian_consent(p_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.guardian_consents g
    where g.user_id = p_user_id
      and g.org_id = p_org_id
      and g.consented_at is not null
      and g.withdrawn_at is null
  );
$function$;

create or replace FUNCTION public.is_org_member(viewer_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM memberships WHERE org_id = p_org_id AND user_id = viewer_id)
$function$;

create or replace FUNCTION public.koen_can_manage(p_koen uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.koen k where k.id = p_koen and (
           k.owner_user_id = auth.uid()
           or (k.org_id is not null and public.has_can(k.org_id, 'gyoji'))
           or exists (select 1 from public.koen_members m where m.koen_id = k.id and m.user_id = auth.uid()
                        and m.can_manage and m.left_at is null)));
$function$;

create or replace FUNCTION public.koen_can_see(p_koen uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.koen k where k.id = p_koen and (
           k.owner_user_id = auth.uid()
           or (k.org_id is not null and public.has_can(k.org_id, 'gyoji'))
           or exists (select 1 from public.koen_members m where m.koen_id = k.id and m.user_id = auth.uid() and m.left_at is null)));
$function$;

create or replace FUNCTION public.leave_enrollment(p_org_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  update public.enrollments
     set status = 'left',
         left_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and status = 'active';

  get diagnostics n = row_count;

  update public.assignments
     set ended_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and ended_at is null;

  return n;
end;
$function$;

create or replace FUNCTION public.log_koen_session_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_what text;
begin
  select string_agg(k, '・' order by k) into v_what from (values
    ('日時', old.starts_at is distinct from new.starts_at or old.ends_at is distinct from new.ends_at),
    ('場所', old.place is distinct from new.place),
    ('取り消し', old.canceled_at is null and new.canceled_at is not null),
    ('メモ', old.note is distinct from new.note)) t(k, changed) where changed;
  if v_what is null then return new; end if;
  insert into public.koen_session_changes(session_id, what, changed_by) values (new.id, v_what || ' を変えました', auth.uid());
  return new;
end $function$;

create or replace FUNCTION public.log_org_post_perm()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_before jsonb;
  v_after jsonb;
  v_added text[];
  v_removed text[];
  v_who uuid;
  v_skip boolean := false;
begin
  v_who := auth.uid();

  if tg_op = 'INSERT' then
    v_before := null; v_after := new.perms;
  elsif tg_op = 'DELETE' then
    v_before := old.perms; v_after := null;
  else
    -- ★perms も 名前も 変わって いなければ、★何も 残しません。
    --   ★★★ここで `return new;` と 書いて いました（★2026-09-21 に 直しました）。
    --     ★★`fail_closed_lint.py` の F1 が 拾います ──
    --       ★「中身を返す処理が、記録の insert より前にある」。
    --     ★★引き金の `return` は 中身を 返す もの では ありません。
    --       ★けれど、★道具に 例外を 覚えさせません。★形の ほうを 直します。
    --     ★★★返すのは いちばん 下の 1か所 だけ に しました。
    --       ★★記録を 書く か 書かないかは、★印（`v_skip`）で 決めます。
    if old.perms is not distinct from new.perms
       and old.name is not distinct from new.name then
      v_skip := true;
    end if;
    v_before := old.perms; v_after := new.perms;
  end if;

  -- ★増えた もの ── ★後に true で、★前に true で ない もの。
  select coalesce(array_agg(k order by k), '{}')
    into v_added
    from jsonb_object_keys(coalesce(v_after, '{}'::jsonb)) k
   where coalesce((v_after ->> k)::boolean, false)
     and not coalesce((v_before ->> k)::boolean, false);

  select coalesce(array_agg(k order by k), '{}')
    into v_removed
    from jsonb_object_keys(coalesce(v_before, '{}'::jsonb)) k
   where coalesce((v_before ->> k)::boolean, false)
     and not coalesce((v_after ->> k)::boolean, false);

  if not v_skip then
  insert into public.org_post_perm_log
    (changed_by, changed_by_kind, org_id, post_id, post_name_at,
     perms_before, perms_after, added, removed, op)
  values
    (v_who,
     case when v_who is null then 'system' else 'person' end,
     coalesce(new.org_id, old.org_id),
     coalesce(new.id, old.id),
     coalesce(new.name, old.name),
     v_before, v_after, v_added, v_removed, lower(tg_op));
  end if;

  -- ★返すのは ここ 1か所 だけ です（★上の 註）。
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;


-- ★★★土台 ── 関数 3／3（33 本）
-- ★裁定175 ㋐。★2026-09-23 の 本番（xxjtplvpcneksrofkjmf）の 形を 機械で 書き出した もの。
-- ★★本番には 当てません。★「すでに 当たって いる」と 記録するだけ です。

-- ★`create or replace` なので、★何度 流しても 同じ です。
set local check_function_bodies = off;

create or replace FUNCTION public.mark_attendance(p_lesson_id uuid, p_status text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, attendance text, attendance_at timestamp with time zone, attendance_by uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    return;
  end if;
  -- ★★印は 3つ と 空 だけ です。★知らない 字を 入れません。
  if p_status is not null and p_status not in ('came', 'absent', 'canceled') then
    return;
  end if;

  select l.org_id into v_org from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  -- ★★★門は できこと です。★役割の 名では ありません。
  if not public.has_can(v_org, 'shukketsu') then
    return;
  end if;

  return query
    update lessons l set
      attendance = p_status,
      attendance_at = case when p_status is null then null else now() end,
      attendance_by = case when p_status is null then null else auth.uid() end
    where l.id = p_lesson_id
    returning l.id, l.attendance, l.attendance_at, l.attendance_by;
end;
$function$;

create or replace FUNCTION public.matching_report_makes_cut()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into public.matching_cuts (user_id, target_user_id, kind, org_id)
  values (new.reporter_user_id, new.target_user_id, 'reported', new.org_id)
  on conflict (user_id, target_user_id, kind) do nothing;
  return new;
end;
$function$;

create or replace FUNCTION public.matching_suspended(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.matching_reports r
    where r.target_user_id = p_user
      and (r.outcome is null or r.outcome in ('banned', 'holding'))
  )
$function$;

create or replace FUNCTION public.matching_visible(p_viewer uuid, p_target uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select not exists (
    select 1 from public.matching_cuts
    where (user_id = p_viewer and target_user_id = p_target)
       or (user_id = p_target and target_user_id = p_viewer)
  )
  and not public.matching_suspended(p_target)
$function$;

create or replace FUNCTION public.monka_representative_max()
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$ select 2 $function$;

create or replace FUNCTION public.move_lesson(p_lesson_id uuid, p_scheduled_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_place_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, scheduled_at timestamp with time zone, place_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid;
  v_teacher uuid;
  v_student uuid;
begin
  select l.org_id, l.teacher_id, l.student_id
    into v_org, v_teacher, v_student
    from lessons l where l.id = p_lesson_id;
  if v_org is null then
    return;
  end if;

  if not (
    can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_all')
    or (v_teacher = auth.uid()
        and can_view_ops_perm(auth.uid(), v_org, v_student, 'sched_mine'))
  ) then
    return;
  end if;

  return query
    update lessons l set
      scheduled_at = coalesce(p_scheduled_at, l.scheduled_at),
      place_id     = coalesce(p_place_id, l.place_id)
    where l.id = p_lesson_id
    returning l.id, l.scheduled_at, l.place_id;
end;
$function$;

create or replace FUNCTION public.my_entitlements()
 RETURNS TABLE(feature text, source text, until timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with me as (select auth.uid() as uid),
  subs as (
    select i.lookup_key, coalesce(s.current_period_end, s.period_end) as until
    from public.subscription_items i
    join public.subscriptions s on s.user_id = i.user_id and s.stripe_subscription_id = i.stripe_subscription_id
    where i.user_id = (select uid from me) and i.removed_at is null
      and s.status in ('active','trialing')
      and coalesce(s.current_period_end, s.period_end) > now()
  ),
  yearly as (
    select p.lookup_key, p.ends_at as until
    from public.purchases p
    where p.user_id = (select uid from me) and p.status = 'active' and p.ends_at > now()
  ),
  keys as (select lookup_key, until, 'monthly' as source from subs union all select lookup_key, until, 'yearly' from yearly)
  select f.feature, k.source, max(k.until)
  from keys k
  cross join lateral (
    select unnest(case
      when k.lookup_key in ('ind_zenbu_m','ind_zenbu_y','ind_gakusei_m','ind_gakusei_y') then array['tsutaeru','shiraberu','yosooi']
      when k.lookup_key = 'ind_tsutaeru_y' then array['tsutaeru']
      when k.lookup_key in ('ind_shiraberu_m','ind_shiraberu_y') then array['shiraberu']
      when k.lookup_key in ('ind_yosooi_m','ind_yosooi_y') then array['yosooi']
      else array[]::text[] end) as feature
  ) f
  where (select uid from me) is not null
  group by f.feature, k.source;
$function$;

create or replace FUNCTION public.nudge_timetable(p_org_id uuid, p_student_ids uuid[])
 RETURNS TABLE(sent integer, skipped integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_sent integer := 0;
  v_all integer := 0;
  v_id uuid;
begin
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  v_all := coalesce(array_length(p_student_ids, 1), 0);

  foreach v_id in array coalesce(p_student_ids, array[]::uuid[])
  loop
    -- ★★その 学校の 方か。★ちがえば 飛ばします。
    if not exists (
      select 1 from public.enrollments e
      where e.org_id = p_org_id and e.student_id = v_id and e.status = 'active'
    ) then
      continue;
    end if;

    insert into public.timetable_nudges (org_id, student_id, sent_by)
    values (p_org_id, v_id, auth.uid())
    on conflict (org_id, student_id) do nothing;

    if found then
      v_sent := v_sent + 1;
      insert into public.org_messages
        (org_id, teacher_id, author_id, title, body, target_user_ids)
      values
        (p_org_id, null, auth.uid(), '時間割を 出して ください',
         '時間割が まだ 出て いません。出して いただけると、レッスンの 日程を 組めます。',
         array[v_id]);
    end if;
  end loop;

  return query select v_sent, v_all - v_sent;
end;
$function$;

create or replace FUNCTION public.open_monka_thread(p_org_id uuid, p_teacher_id uuid, p_reason_kind text, p_reason_note text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, org_id uuid, teacher_id uuid, author_id uuid, title text, body text, created_at timestamp with time zone, withdrawn_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_post_id uuid;
  v_post_name text;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  -- ★できことを見ます。役割の名では見ません。
  if not public.has_can(p_org_id, 'monka_read') then
    raise exception 'NO_MONKA_READ: この役職では、門下のやりとりを開けません。'
      using errcode = 'P0001';
  end if;

  -- ★理由が無ければ、ここで止まります。記録も中身もありません。
  if p_reason_kind is null or btrim(p_reason_kind) = '' then
    raise exception 'REASON_REQUIRED: なぜ開くかを選んでください。'
      using errcode = 'P0001';
  end if;

  -- ★そのときの役職名と表示名を写します。
  select m.post_id, q.name, p.display_name
    into v_post_id, v_post_name, v_name
    from public.memberships m
    left join public.org_posts q on q.id = m.post_id
    left join public.profiles p on p.id = m.user_id
   where m.org_id = p_org_id and m.user_id = auth.uid();

  -- ★先に書きます。★縛りに引っかかれば、ここで止まり、中身は返りません。
  insert into public.monka_read_log
    (org_id, viewer_user_id, target_monka_id, reason,
     reason_kind, reason_note, post_id, post_name_at, name_at)
  values
    (p_org_id, auth.uid(), p_teacher_id, p_reason_kind,
     p_reason_kind, nullif(btrim(coalesce(p_reason_note, '')), ''),
     v_post_id, v_post_name, v_name);

  -- ★書けたときだけ、中身を返します。
  return query
    select m.id, m.org_id, m.teacher_id, m.author_id,
           m.title, m.body, m.created_at, m.withdrawn_at
      from public.org_messages m
     where m.org_id = p_org_id
       and m.teacher_id = p_teacher_id
     order by m.created_at desc;
end;
$function$;

create or replace FUNCTION public.org_events_set_bookkeeping()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  if new.event_date is distinct from old.event_date then
    new.previous_date := old.event_date;
  else
    new.previous_date := old.previous_date;
  end if;
  return new;
end;
$function$;

create or replace FUNCTION public.org_free_period(p_start date, p_is_pilot boolean)
 RETURNS TABLE(free_until date, paid_from date)
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  with a as (
    select case when p_is_pilot then date '2027-09-30'
      else least(
        -- 契約の月を1か月目に数えて、3か月目の月末
        (date_trunc('month', p_start::timestamp) + interval '3 months' - interval '1 day')::date,   -- ★::timestamp（date のままだと timestamptz になり、immutable でなくなる。事前確認）
        -- 契約日より後の最初の4月1日の前日（=3月31日）
        (make_date(extract(year from p_start)::int + case when p_start >= make_date(extract(year from p_start)::int, 4, 1) then 1 else 0 end, 4, 1) - 1)
      ) end as fu
  )
  select fu, fu + 1 from a;
$function$;

create or replace FUNCTION public.pref_map(p_round_id uuid)
 RETURNS TABLE(slot_key text, maru integer, sankaku integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.slot_key,
         count(*) filter (where p.level = 2)::int,
         count(*) filter (where p.level = 1)::int
    from public.lesson_prefs p
    join public.lesson_rounds r on r.id = p.round_id
   where p.round_id = p_round_id
     and (has_can(r.org_id,'sched_all')
          or exists (select 1 from public.assignments a where a.org_id = r.org_id and a.teacher_id = auth.uid()
                       and a.student_id = p.user_id and a.ended_at is null))
   group by p.slot_key;
$function$;

create or replace FUNCTION public.profiles_guard_server_only_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  guarded text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;

  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access
    then guarded := 'teacher_beta_access';
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  elsif new.is_internal is distinct from old.is_internal then guarded := 'is_internal';
  elsif new.character_points_spent is distinct from old.character_points_spent
    then guarded := 'character_points_spent';
  -- ★★★ここから 下が、★2026-09-22 に 足した ぶん です（★裁定167 A3）。
  --   ★同意の 日時 …… ★あとから 書き換えられると、★法20条2項の 証しが 弱く なります。
  elsif new.consent_health_data_at is distinct from old.consent_health_data_at
    then guarded := 'consent_health_data_at';
  elsif new.reflux_care_consent_at is distinct from old.reflux_care_consent_at
    then guarded := 'reflux_care_consent_at';
  --   ★保護者の 同意の「申告した 日」…… ★申告 そのものは ご本人の もの ですが、
  --     ★★日時は サーバが 入れます（★準則の とおり）。
  elsif new.guardian_consent_declared_at is distinct from old.guardian_consent_declared_at
    then guarded := 'guardian_consent_declared_at';
  --   ★年齢の 区分 …… ★変えた 跡が 残りません。★答え直しは 記録を 1行 残す 形に します。
  elsif new.is_under_18 is distinct from old.is_under_18
    then guarded := 'is_under_18';
  --   ★登録の 日 …… ★変えられると、★いつから の 人かが 分からなく なります。
  elsif new.created_at is distinct from old.created_at
    then guarded := 'created_at';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$function$;

create or replace FUNCTION public.purge_code_attempts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  n integer;
begin
  delete from public.code_attempts where at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$function$;

create or replace FUNCTION public.purge_ops_audit_log()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n integer;
begin
  delete from public.ops_audit_log where created_at < now() - interval '90 days';
  get diagnostics n = row_count; return n;
end $function$;

create or replace FUNCTION public.raise_alert(p_kind text, p_detail text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.ops_alerts(kind, detail) values (left(coalesce(p_kind,'unknown'), 100), left(p_detail, 1000));
$function$;

create or replace FUNCTION public.read_kid_contact(p_kid uuid, p_reason_kind text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_koen uuid; v_role text; v_contact text; v_show_on date;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_reason_kind is null or p_reason_kind not in ('todays_call','emergency','guardian_request') then
    raise exception 'REASON_REQUIRED';
  end if;
  select k.koen_id into v_koen from public.koen_kids k where k.id = p_kid and k.left_at is null;
  if v_koen is null then raise exception 'NO_SUCH_KID'; end if;
  if not public.koen_can_manage(v_koen) then raise exception 'NOT_STAFF'; end if;

  -- 当日だけ（本番・集合の日）。緊急と 保護者からの求め は いつでも
  if p_reason_kind = 'todays_call' then
    select min(s.starts_at::date) into v_show_on from public.koen_sessions s
     where s.koen_id = v_koen and s.kind in ('call','show') and s.canceled_at is null
       and s.starts_at::date = (now() at time zone 'Asia/Tokyo')::date;
    if v_show_on is null then raise exception 'NOT_TODAY'; end if;
  end if;

  select case when k.org_id is not null then '運営' else '主催' end into v_role from public.koen k where k.id = v_koen;

  insert into public.koen_kid_contact_reads(kid_id, koen_id, viewer_user_id, viewer_role_at, reason_kind)
  values (p_kid, v_koen, auth.uid(), v_role, p_reason_kind);       -- ★先に記録。失敗したらここで止まり、下は返らない

  select c.contact into v_contact from public.koen_kid_contacts c where c.kid_id = p_kid;
  return v_contact;
end $function$;

create or replace FUNCTION public.request_guardian_consent(p_org_id uuid, p_teacher_id uuid, p_guardian_email text)
 RETURNS TABLE(token text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token text;
  v_exp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;
  if coalesce(trim(p_guardian_email), '') = '' then
    raise exception '保護者の メールアドレスが ありません';
  end if;

  -- ★★32文字より 長く します（★裁定 §3）。
  v_token := encode(gen_random_bytes(32), 'hex');
  v_exp := now() + interval '7 days';

  insert into public.guardian_consents
    (user_id, org_id, teacher_id, guardian_email, token, expires_at)
  values
    (auth.uid(), p_org_id, p_teacher_id, trim(p_guardian_email), v_token, v_exp);

  return query select v_token, v_exp;
end;
$function$;

create or replace FUNCTION public.retire_teacher(p_org_id uuid, p_teacher_id uuid)
 RETURNS TABLE(closed_invitations integer, closed_assignments integer, students_without_teacher integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inv integer := 0;
  v_asg integer := 0;
  v_std integer := 0;
begin
  -- ★① 門 ── ★できこと で 見ます。
  if not public.has_can(p_org_id, 'meibo') then
    raise exception 'その 学校の 名簿を 直せません';
  end if;

  -- ★② 合言葉を 閉じます（★出した 方・門下の 先生、★どちらの 形でも）。
  with 閉 as (
    update public.teacher_invitations i
    set expires_at = now()
    where i.org_id = p_org_id
      and (i.monka_teacher_id = p_teacher_id or i.teacher_id = p_teacher_id)
      and i.used_at is null
      and i.expires_at > now()
    returning 1
  )
  select count(*) into v_inv from 閉;

  -- ★③ 担当を 閉じます（★消しません）。
  with 閉2 as (
    update public.assignments a
    set ended_at = now()
    where a.org_id = p_org_id
      and a.teacher_id = p_teacher_id
      and a.ended_at is null
    returning a.student_id
  )
  select count(*) into v_asg from 閉2;

  -- ★④ 門下が 未定に なった 方の 数（★事務が Q1 の 手順で 決め直します）。
  select count(*) into v_std
  from public.enrollments e
  where e.org_id = p_org_id
    and e.status = 'active'
    and not exists (
      select 1 from public.assignments a
      where a.org_id = p_org_id and a.student_id = e.student_id and a.ended_at is null
    );

  return query select v_inv, v_asg, v_std;
end;
$function$;

create or replace FUNCTION public.role_rank(r text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case r
    when 'owner' then 3
    when 'admin' then 2
    when 'teacher' then 1
    else 0
  end;
$function$;

create or replace FUNCTION public.rotate_calendar_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');   -- ★スキーマを名指し。search_path は 'public' のまま狭く保つ（㋑を採った）
  insert into public.calendar_tokens(user_id, token) values (auth.uid(), v_token)
    on conflict (user_id) do update set token = excluded.token, rotated_at = now();
  return v_token;
end $function$;

create or replace FUNCTION public.school_wide_perms()
 RETURNS text[]
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select array[
    'bill', 'bill_pay', 'meibo', 'sched_all', 'gyoji',
    'renraku_all', 'monka_read', 'master', 'post', 'koma'
  ]::text[];
$function$;

create or replace FUNCTION public.seed_prefs_from_timetable(p_round_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_n integer;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.lesson_rounds r
                  join public.enrollments e on e.org_id = r.org_id and e.student_id = auth.uid() and e.status = 'active'
                 where r.id = p_round_id and r.status = 'open') then
    raise exception 'NOT_TARGET_OR_CLOSED';
  end if;
  insert into public.lesson_prefs(round_id, user_id, slot_key, level)
  select p_round_id, auth.uid(), t.weekday::text || '-' || t.period_id::text, 0   -- weekday は smallint・period_id は uuid（本番で確認）
    from public.my_timetable t
   where t.user_id = auth.uid() and coalesce(t.unavailable, true)
  on conflict (round_id, user_id, slot_key) do nothing;     -- 学生が自分で直した希望は上書きしない
  get diagnostics v_n = row_count;
  return v_n;
end $function$;

create or replace FUNCTION public.send_message_draft(p_draft_id uuid)
 RETURNS TABLE(message_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d public.org_message_drafts;
  v_id uuid;
begin
  select * into d from public.org_message_drafts
  where id = p_draft_id;

  if d.id is null then
    raise exception 'その 下書きが ありません';
  end if;
  if d.author_id <> auth.uid() then
    raise exception '書いた ご本人だけが 出せます';
  end if;
  if coalesce(trim(d.body), '') = '' then
    raise exception '中身が ありません';
  end if;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body,
     target_division_ids, target_grade_years, target_user_ids)
  values
    (d.org_id, d.teacher_id, d.author_id, d.title, d.body,
     d.target_division_ids, d.target_grade_years, d.target_user_ids)
  returning id into v_id;

  delete from public.org_message_drafts where id = p_draft_id;

  return query select v_id;
end;
$function$;

create or replace FUNCTION public.set_kid_contact(p_kid uuid, p_contact text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.koen_kids k where k.id = p_kid and k.guardian_user_id = auth.uid()) then
    raise exception 'NOT_GUARDIAN';
  end if;
  insert into public.koen_kid_contacts(kid_id, contact) values (p_kid, btrim(p_contact))
    on conflict (kid_id) do update set contact = excluded.contact, updated_at = now();
end $function$;

create or replace FUNCTION public.set_member_display_title(p_membership_id uuid, p_title text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid;
  v_user uuid;
  v_title text;
  w text;
  v_qualifications text[] := array[
    '医師','医者','ドクター','Dr','Doctor','歯科医',
    '看護師','薬剤師','言語聴覚士','理学療法士','作業療法士',
    '管理栄養士','栄養士','保健師','助産師','公認心理師'];
  v_impersonation text[] := array[
    '運営','公式','Woolsong','ウールソング','サポート','事務局','管理者','システム'];
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select org_id, user_id into v_org, v_user
    from public.memberships where id = p_membership_id;
  if v_org is null then
    raise exception 'MEMBERSHIP_NOT_FOUND';
  end if;

  if not exists (
    select 1 from public.memberships m
     where m.org_id = v_org and m.user_id = auth.uid()
       and m.role in ('owner','admin')
  ) then
    raise exception 'NOT_ORG_ADMIN';
  end if;

  v_title := nullif(btrim(coalesce(p_title, '')), '');

  if v_title is not null then
    if char_length(v_title) > 20 then
      raise exception 'TITLE_TOO_LONG';
    end if;
    if v_title ~ '[[:cntrl:]]' then
      raise exception 'TITLE_HAS_CONTROL_CHARS';
    end if;
    foreach w in array v_qualifications loop
      if lower(v_title) like '%' || lower(w) || '%' then
        raise exception 'TITLE_QUALIFICATION';
      end if;
    end loop;
    foreach w in array v_impersonation loop
      if lower(v_title) like '%' || lower(w) || '%' then
        raise exception 'TITLE_IMPERSONATION';
      end if;
    end loop;
  end if;

  update public.memberships
     set display_title = v_title,
         display_title_updated_by = auth.uid(),
         display_title_updated_at = now()
   where id = p_membership_id;

  return jsonb_build_object(
    'membership_id', p_membership_id,
    'user_id', v_user,
    'display_title', v_title
  );
end;
$function$;

create or replace FUNCTION public.set_monka_representative(p_assignment_id uuid, p_on boolean)
 RETURNS TABLE(assignment_id uuid, student_id uuid, is_representative boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_teacher uuid;
  v_org uuid;
  v_now integer;
begin
  -- ★★その 行が、★ご自分の 門下か。★ちがえば 何も しません。
  select a.teacher_id, a.org_id into v_teacher, v_org
  from public.assignments a
  where a.id = p_assignment_id and a.ended_at is null;

  if v_teacher is null then
    raise exception 'その 担当が ありません';
  end if;
  if v_teacher <> auth.uid() then
    raise exception 'その 門下の 先生だけが 決められます';
  end if;

  -- ★★2人までを、★ここで 守ります。★画面だけに 任せません。
  if p_on then
    select count(*) into v_now
    from public.assignments a
    where a.teacher_id = v_teacher and a.org_id = v_org
      and a.ended_at is null and a.is_representative
      and a.id <> p_assignment_id;
    if v_now >= public.monka_representative_max() then
      raise exception '代表は %人までです', public.monka_representative_max();
    end if;
  end if;

  update public.assignments a
  set is_representative = p_on
  where a.id = p_assignment_id;

  return query
  select a.id, a.student_id, a.is_representative
  from public.assignments a
  where a.teacher_id = v_teacher and a.org_id = v_org and a.ended_at is null
  order by a.student_id;
end;
$function$;

create or replace FUNCTION public.set_web_type(p_type_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid := auth.uid(); v_p public.portfolios; v_owned boolean; v_field_used boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_p from public.portfolios where user_id = v_uid;
  if v_p.user_id is null then raise exception 'NO_PORTFOLIO'; end if;
  select exists (select 1 from public.page_types_owned o where o.user_id = v_uid and o.type_key = p_type_key) into v_owned;

  if v_owned then
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_owned';
  end if;

  if v_p.trial_until is not null and now() <= v_p.trial_until then      -- はじめの14日
    insert into public.page_types_owned(user_id, type_key, source) values (v_uid, p_type_key, 'trial')
      on conflict (user_id, type_key) do nothing;
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_trial';
  end if;

  select exists (select 1 from public.page_types_owned o where o.user_id = v_uid and o.source = 'field_free') into v_field_used;
  if not v_field_used and v_p.field is not null then                    -- 分野ごとに1つ無料
    insert into public.page_types_owned(user_id, type_key, source) values (v_uid, p_type_key, 'field_free');
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_field_free';
  end if;

  return 'need_payment';      -- 画面は 480円 の板を出す。買えたらサーバが page_types_owned に 'bought' を足す
end $function$;

create or replace FUNCTION public.student_price_eligible(p_user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.student_price_consents c where c.user_id = p_user and c.withdrawn_at is null)
     and public._is_enrolled_somewhere(p_user);
$function$;

create or replace FUNCTION public.submit_inquiry(p_slug text, p_name text, p_email text, p_body text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_owner uuid; v_today integer;
begin
  select p.user_id into v_owner from public.portfolios p where p.public_slug = p_slug and p.visibility = 'public';
  if v_owner is null or public.matching_suspended(v_owner) then return false; end if;      -- 理由は返さない
  select count(*) into v_today from public.page_inquiries q
   where q.owner_user_id = v_owner and q.created_at > now() - interval '1 day';
  if v_today >= 50 then return false; end if;                                              -- 送りすぎを止める
  insert into public.page_inquiries(owner_user_id, from_name, from_email, body)
  values (v_owner, left(btrim(p_name),60), left(btrim(p_email),120), left(btrim(p_body),2000));
  return true;
end $function$;

create or replace FUNCTION public.transfer_contract_owner(p_org_id uuid, p_to_user_id uuid)
 RETURNS TABLE(ok boolean, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_now uuid;
begin
  if auth.uid() is null then
    return query select false, 'NOT_AUTHENTICATED'; return;
  end if;
  select o.contract_owner_user_id into v_now from organizations o where o.id = p_org_id;
  if v_now is null or v_now <> auth.uid() then
    return query select false, 'NOT_CONTRACT_OWNER'; return;
  end if;
  if not exists (select 1 from memberships m where m.org_id = p_org_id and m.user_id = p_to_user_id) then
    return query select false, 'NOT_A_MEMBER'; return;
  end if;
  if not public.has_can_user(p_to_user_id, p_org_id, 'master') then
    return query select false, 'NO_MASTER'; return;
  end if;

  update organizations set contract_owner_user_id = p_to_user_id where id = p_org_id;
  insert into contract_owner_log (org_id, from_user_id, to_user_id, changed_by) values (p_org_id, v_now, p_to_user_id, auth.uid());

  begin
    insert into user_notices (user_id, notice_key) values (p_to_user_id, 'contract_owner:' || p_org_id::text);
  exception when others then
    perform public.raise_alert('contract_owner_notice_failed', 'org=' || p_org_id::text || ' to=' || p_to_user_id::text || ' err=' || sqlerrm);
  end;

  return query select true, ''::text;
end;
$function$;

create or replace FUNCTION public.withdraw_guardian_consent(p_org_id uuid)
 RETURNS TABLE(withdrawn integer, had_consent boolean, guardian_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_n integer := 0;
  v_had boolean := false;
  v_mail text;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;

  -- ★★済んだ 同意が 在ったか（★在籍を 閉じて よいかの 分かれ目）。
  select true, g.guardian_email into v_had, v_mail
  from public.guardian_consents g
  where g.user_id = auth.uid() and g.org_id = p_org_id
    and g.consented_at is not null and g.withdrawn_at is null
  order by g.consented_at desc
  limit 1;
  v_had := coalesce(v_had, false);

  with 閉 as (
    update public.guardian_consents g
    set withdrawn_at = now()
    where g.user_id = auth.uid() and g.org_id = p_org_id
      and g.withdrawn_at is null
    returning 1
  )
  select count(*) into v_n from 閉;

  return query select v_n, v_had, v_mail;
end;
$function$;

create or replace FUNCTION public.withdraw_student_price_consent()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.student_price_consents set withdrawn_at = now()
   where user_id = auth.uid() and withdrawn_at is null;
end $function$;


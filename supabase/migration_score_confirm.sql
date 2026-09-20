-- ============================================================================
-- ★確定と、★確定の あとの 直し（★裁定 その105 §Q2・§Q4・2026-09-20）
--
--   ★★★確定（§Q2）
--     ★押すのは `saiten` を 持つ 方 です（★事務・学長）。
--     ★押すと、★学生 ご本人に「ご自分の 点」と「講評」が 見えます。
--     ★★つけた 直後には 見えません。★学校が 押すまで 見えません。
--
--   ★★★確定の あとの 直し（§Q4）
--     ★確定の **前** の 直しは 記録しません（★下書き だから です）。
--     ★確定の **あと** の 直しは 記録します ── ★誰が・いつ・前の 値・あとの 値。
--     ★★`score_log` は 消せません・直せません（★決まりも 許しも ありません）。
--     ★★★学生に お知らせします ──「○月○日の 点が 直されました」。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 確定する
-- ---------------------------------------------------------------------------
create or replace function public.confirm_event_scores(
  p_org_id uuid,
  p_event_id uuid
) returns table (scores integer, reviews integer)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- ---------------------------------------------------------------------------
-- ★② 確定の あとに 直す
-- ---------------------------------------------------------------------------
--   ★★★記録を 残さずに 直せる 道を 作りません。★この 1本 だけ です。
--     ★★画面から `evaluation_scores` を 直に 書く ことも できますが、
--       ★★確定済みの 行は、★下の 引き金（★決まり）で 止めます。
create or replace function public.edit_confirmed_score(
  p_score_id uuid,
  p_points numeric,
  p_reason text
) returns table (ok boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.evaluation_scores;
  v_before numeric;
begin
  select * into v from public.evaluation_scores where id = p_score_id;
  if v.id is null then
    raise exception 'その 点が ありません';
  end if;
  -- ★★直せるのは、★つけた 審査員 ご本人か、★`saiten` を 持つ 方 です。
  if v.judge_id <> auth.uid() and not public.has_can(v.org_id, 'saiten') then
    raise exception 'その 点を 直せません';
  end if;
  if v.confirmed_at is null then
    raise exception 'まだ 確定して いません';
  end if;

  v_before := v.points;

  update public.evaluation_scores
  set points = p_points, updated_at = now()
  where id = p_score_id;

  insert into public.score_log
    (score_id, org_id, editor_user_id, before_value, after_value, reason)
  values
    (p_score_id, v.org_id, auth.uid(), v_before, p_points, nullif(trim(coalesce(p_reason, '')), ''));

  -- ★★★学生に お知らせします（★連絡に 1行・お決め D76）。
  --   ★★点そのものは 書きません。★「直されました」だけ です。
  --   ★★★点は 画面で ご覧に なれます。★メールや 連絡に 数を 残しません。
  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body, target_user_ids)
  values
    (v.org_id, null, auth.uid(), '点が 直されました',
     to_char(now() at time zone 'Asia/Tokyo', 'MM月DD日') || 'の 点が 直されました。',
     array[v.student_id]);

  return query select true;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★③ 確定済みの 行を、★直に 書けない ように します
-- ---------------------------------------------------------------------------
--   ★★★決まり（RLS）だけ では 足りません。
--     ★★`judge_id = auth.uid()` の 決まりが 通るので、★確定後でも 書けます。
--   ★★★引き金で 止めます。★記録の 残らない 直しを 作らない ため です。
create or replace function public.evaluation_scores_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

drop trigger if exists evaluation_scores_guard_trg on public.evaluation_scores;
create trigger evaluation_scores_guard_trg
  before update on public.evaluation_scores
  for each row execute function public.evaluation_scores_guard();

-- ★★読み道の 中 だけ、★引き金を 通します。
create or replace function public.edit_confirmed_score(
  p_score_id uuid,
  p_points numeric,
  p_reason text
) returns table (ok boolean)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.confirm_event_scores(uuid, uuid) from public, anon;
revoke all on function public.edit_confirmed_score(uuid, numeric, text) from public, anon;
grant execute on function public.confirm_event_scores(uuid, uuid) to authenticated;
grant execute on function public.edit_confirmed_score(uuid, numeric, text) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select tgname from pg_trigger where tgrelid = 'public.evaluation_scores'::regclass
--     and not tgisinternal;
--   ★★`evaluation_scores_guard_trg` が 1つ ある こと。

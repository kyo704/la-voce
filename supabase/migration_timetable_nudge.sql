-- ============================================================================
-- ★時間割が まだの方（★見本 `P_mada`・お決め D78・2026-09-19）
--
--   ★★★2つ 作ります。
--     ①「出したか どうか」だけ を 返す 読み道（★中身は 返しません）
--     ②「1回だけ 知らせた」を しまう ところ（★催促を 重ねない ため）
--
--   ★★★なぜ ①が 要るか（★台帳 08-11）
--     ★いまの `get_monka_free_counts` は **空きの 数** だけ を 返します。
--     ★★1つも 決めて いない 方も 空き 0、★ぜんぶ 埋まった 方も 空き 0 です。
--     ★★★「出して いない」と「ぜんぶ 埋まって いる」が 同じ 顔に なります。
--     ★返すのは **真偽 1つ** です。★曜日も、授業の 名も、場所も 返しません。
--
--   ★★★なぜ ②が 要るか
--     ★「1回だけ」を 画面だけで 守ると、★通信を 直に 叩く 人に 守れません。
--     ★★台帳に 1行 残し、★2度目は 入りません（★同じ 組み合わせは 1行 だけ）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 出したか どうか（★真偽 だけ）
-- ---------------------------------------------------------------------------
--   ★★門 ── ★`meibo` を 持つ 方、★または その 学生の 担当の 先生。
--     ★★どちらでも なければ 0行。★誤りでは ありません。
create or replace function public.get_timetable_submitted(p_org_id uuid)
returns table (student_id uuid, submitted boolean)
language sql
security definer
set search_path = public
as $$
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
$$;

-- ---------------------------------------------------------------------------
-- ★② 1回だけ 知らせた、を しまう
-- ---------------------------------------------------------------------------
create table if not exists public.timetable_nudges (
  org_id uuid not null references public.organizations(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz not null default now(),
  primary key (org_id, student_id)
);

alter table public.timetable_nudges enable row level security;

--   ★★読むのは 運営の 方 だけ。★書くのは 読み道 だけ（★下の 関数）。
--     ★★画面から 直に 入れられません。★「1回だけ」を 守る ため です。
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'timetable_nudges' and p.polname = 'timetable_nudges_select'
  ) then
    create policy timetable_nudges_select on public.timetable_nudges
      for select using (public.has_can(org_id, 'meibo'));
  end if;
end $$;

revoke all on table public.timetable_nudges from public;
revoke all on table public.timetable_nudges from anon;
revoke all on table public.timetable_nudges from authenticated;
grant select on table public.timetable_nudges to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ 知らせる（★1回だけ）
-- ---------------------------------------------------------------------------
--   ★★★2度目は 入りません。★数だけ 返します。
--   ★★お知らせは 連絡（`org_messages`）に 入れます（★お決め D76）。
--     ★★宛て先は その方 1人 です。
create or replace function public.nudge_timetable(
  p_org_id uuid,
  p_student_ids uuid[]
) returns table (sent integer, skipped integer)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.get_timetable_submitted(uuid) from public;
revoke all on function public.get_timetable_submitted(uuid) from anon;
revoke all on function public.nudge_timetable(uuid, uuid[]) from public;
revoke all on function public.nudge_timetable(uuid, uuid[]) from anon;
grant execute on function public.get_timetable_submitted(uuid) to authenticated;
grant execute on function public.nudge_timetable(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select p.proname, p.prosecdef
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('get_timetable_submitted','nudge_timetable');
--
--   select relrowsecurity from pg_class where relname = 'timetable_nudges';
--   ★★`true` で ある こと。★決まりは 1つ（読む だけ）。

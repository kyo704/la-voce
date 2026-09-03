-- ============================================================================
-- ★更新で、身元の列を書き換えられないようにする（2026-09-04・★本番に適用済み）
--
--   ★このファイルは「これから流すもの」ではありません。
--     ★2026-09-04 に本番へ流したものを、そのまま写したものです。
--     規則 7-2（本番に手で当てたら、その日のうちにリポジトリへ写す）に従っています。
--
--   ★なぜ必要だったか（#006 / #007）
--     UPDATE のポリシーに WITH CHECK が無い、または別のことを見ていたため、
--     ★USING を通れば、どの列でも書き換えられました。実地で確認済みです。
--       ・生徒が teacher_id を自分に書き換えられた
--       ・先生が student_id を第三者に書き換えられた
--       ・教室の責任者が、予定の org_id を別の教室へ移せた
--
--   ★なぜ WITH CHECK ではなくトリガーか
--     ★RLS のポリシーに OLD はありません。更新前の値を参照できません。
--     副問い合わせで代用できますが、「元の値を見るのか」が読んで分からず、
--     ★#005 で実地確認が必要になりました。
--     ★トリガーなら OLD と NEW が、はっきり別のものとして手に入ります。
--     ★INSERT に影響しません（before update だけ）。
--     ★既存のポリシーに一切触れません。
--
--   ★2枚の板（今日の規則 6-3）
--     1枚目：権限（GRANT）… そもそも書ける列を渡さない
--     2枚目：トリガー      … 身元の列が変わっていないことを確かめる
--     ★どちらか片方が外れても、もう片方が残ります。
--
--   ★列名の出どころ
--     teacher_student_links / assignments … 2026-09-01 のダンプの CREATE TABLE
--     org_events / lessons(held)          … リポジトリの移行ファイル
--     ★アプリが update で送る列は、すべてコードで確認しました。
--       teacher_student_links … VocalTracker.jsx:9642
--       assignments           … VocalTracker.jsx:10279
--       org_events            … VocalTracker.jsx:10039, 10056
--       lessons               … VocalTracker.jsx:9721
--
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 層1：書ける列を絞る
--   ★service_role からは剥がしません。運営が手で直せなくなるためです。
-- ---------------------------------------------------------------------------

revoke update on public.teacher_student_links from authenticated;
revoke update on public.teacher_student_links from anon;
grant update (status, revoked_at, revoked_by)
  on public.teacher_student_links to authenticated;

revoke update on public.assignments from authenticated;
revoke update on public.assignments from anon;
grant update (ended_at)
  on public.assignments to authenticated;

revoke update on public.org_events from authenticated;
revoke update on public.org_events from anon;
grant update (event_date, previous_date, withdrawn_at, updated_at)
  on public.org_events to authenticated;

revoke update on public.lessons from authenticated;
revoke update on public.lessons from anon;
grant update (held)
  on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- ② 層2：身元の列を固定する
--   ★表ごとに関数を分けます。1つにまとめません。
--     まとめると「どの表の、どの列を守るか」が引数になり、
--     ★呼び方を間違えたときに黙って守らなくなります。
--   ★is distinct from を使います。null 同士でも正しく比べられます。
-- ---------------------------------------------------------------------------

create or replace function public.assert_link_identity_unchanged()
returns trigger
language plpgsql
as $$
begin
  if new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception
      'LINK_IDENTITY_IMMUTABLE: つながりの相手は、あとから変えられません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_link_identity_immutable on public.teacher_student_links;
create trigger trg_link_identity_immutable
  before update on public.teacher_student_links
  for each row execute function public.assert_link_identity_unchanged();

create or replace function public.assert_assignment_identity_unchanged()
returns trigger
language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id
     or new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception
      'ASSIGNMENT_IDENTITY_IMMUTABLE: 担当の教室・先生・生徒は、あとから変えられません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assignment_identity_immutable on public.assignments;
create trigger trg_assignment_identity_immutable
  before update on public.assignments
  for each row execute function public.assert_assignment_identity_unchanged();

create or replace function public.assert_org_event_identity_unchanged()
returns trigger
language plpgsql
as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception
      'ORG_EVENT_ORG_IMMUTABLE: 予定を、別の教室へ移すことはできません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_org_event_identity_immutable on public.org_events;
create trigger trg_org_event_identity_immutable
  before update on public.org_events
  for each row execute function public.assert_org_event_identity_unchanged();

create or replace function public.assert_lesson_identity_unchanged()
returns trigger
language plpgsql
as $$
begin
  if new.link_id is distinct from old.link_id
     or new.org_id is distinct from old.org_id
     or new.teacher_id is distinct from old.teacher_id
     or new.student_id is distinct from old.student_id then
    raise exception
      'LESSON_IDENTITY_IMMUTABLE: レッスンの紐付け・教室・先生・生徒は、あとから変えられません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_lesson_identity_immutable on public.lessons;
create trigger trg_lesson_identity_immutable
  before update on public.lessons
  for each row execute function public.assert_lesson_identity_unchanged();

-- ---------------------------------------------------------------------------
-- ③ 確かめる
-- ---------------------------------------------------------------------------

-- ★列単位の権限（★表の単位の権限も列ごとに展開されるので、★数が要点です）
select c.table_name as "表", c.grantee as "誰に",
       count(*) as "列の数",
       string_agg(c.column_name, ', ' order by c.column_name) as "★書ける列"
  from information_schema.column_privileges c
 where c.table_schema = 'public'
   and c.table_name in ('teacher_student_links','assignments','org_events','lessons')
   and c.grantee in ('anon','authenticated') and c.privilege_type = 'UPDATE'
 group by 1, 2 order by 1, 2;
-- ★teacher_student_links=3 / assignments=1 / org_events=4 / lessons=1
-- ★anon の行が1つも出ないこと。
-- ★全列ぶん出たら、revoke が効いていません。

-- ★トリガーが4本、有効であること
select c.relname as "表", t.tgname as "トリガー",
       case t.tgenabled when 'O' then '有効' when 'D' then '★無効'
            else t.tgenabled::text end as "状態"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and not t.tgisinternal
   and t.tgname like 'trg_%_identity_immutable'
 order by 1;

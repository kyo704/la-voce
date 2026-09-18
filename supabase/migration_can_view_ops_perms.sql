-- ===========================================================================
-- ★台帳の 門を、★できこと に 揃えます（★裁定 その86・2026-09-18）
--
--   ★★★何が 起きて いたか
--     ★★`can_view_ops(見る人, 学校, 生徒)` の 中は こう でした ──
--       ★★在籍が ある　AND（★`is_org_owner_or_admin`　OR　受け持ち）
--     ★★★門が **役割の 名**（owner／admin）です。★できこと では ありません。
--     ★★学校は 役職を 自由に 作れます（★裁定 その75）。
--       ★★事務（staff）に `sched_all` を 付けても、★台帳は 通しません。
--       ★★画面は 通し、★台帳が 止めます ── ★空の 表が 出ます。
--     ★★★「画面が 通して 台帳が 止める」── ★いちばん 分かりにくい 形 です。
--
--   ★★★決め（★裁定 その86）── ★台帳側を できこと に 揃えます。
--     ★★画面を 役割の 名に 戻すのは、★A2（opsShell → has_can）に 逆行します。
--
--   ★★呼び出し元を ぜんぶ 出しました（★2026-09-18・台帳に 直に 尋ねました）──
--     ★`enrollments_select`（r）
--     ★`Ops-visible lessons (org-based)`（r）
--     ★`Teachers can create org lessons`（a）
--     ★`Teachers can delete org lessons`（d）
--     ★`Teachers can update or delete org lessons`（w）
--     ★★関数・ビュー・検査からの 呼び出しは **0件** です。
--
--   ★★★できことは 呼び出し元ごとに ちがいます。★1つの 関数に できません。
--     ★★`lessons` は `sched_all` ／ `sched_mine`。
--       ★★`sched_mine` の ときは、★そのコマの 先生が 自分で ある ことも 要ります。
--       ★★★`can_view_ops` は 先生の 番号を 受け取りません。★書けません。
--       ★★だから 決まりの 中に 直に 書きます。
--     ★★`enrollments` は `meibo`。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★新しい 門 ── ★できこと を 受け取ります
--
--   ★★古い `can_view_ops` は 残します。★まだ 消しません。
--     ★★消すのは、★新しい 決まりが 通って いる ことを 確かめた あと です。
--     ★★先に 消すと、★戻れなく なります。
-- ---------------------------------------------------------------------------
create or replace function public.can_view_ops_perm(
  viewer_id uuid, p_org_id uuid, p_student_id uuid, p_perm text
) returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select
    exists (
      select 1 from enrollments
      where org_id = p_org_id and student_id = p_student_id and status = 'active'
    )
    and (
      -- ★★できことで 通します。★役割の 名では ありません。
      has_can(p_org_id, p_perm)
      -- ★★受け持ちは そのまま 残します。★先生は 自分の 生徒を 見られます。
      or exists (
        select 1 from assignments
        where org_id = p_org_id and teacher_id = viewer_id
          and student_id = p_student_id and ended_at is null
      )
    )
$$;

comment on function public.can_view_ops_perm(uuid, uuid, uuid, text) is
  '運営の門。できこと（has_can）と受け持ちで通す。裁定その86・2026-09-18。';

-- ★★呼べる 人を しぼります。★匿名には 開けません。
revoke all on function public.can_view_ops_perm(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.can_view_ops_perm(uuid, uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 【二】★在籍（enrollments）── ★`meibo`
--
--   ★★同じ 表に `enrollments_all_owner_admin` が あり、★そちらは すでに
--     ★`has_can(org_id, 'meibo')` です。★名前だけ 古い ままです。
--   ★★ここを 揃えると、★2つが 同じ 門に なります。
-- ---------------------------------------------------------------------------
drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments
  for select using (
    auth.uid() = student_id
    or public.can_view_ops_perm(auth.uid(), org_id, student_id, 'meibo')
  );

-- ---------------------------------------------------------------------------
-- 【三】★レッスン（lessons）── ★`sched_all` ／ `sched_mine`
--
--   ★★★`sched_mine` は「自分の レッスン」です。
--     ★★そのコマの 先生が 自分で ある ことを、★同時に 見ます。
--     ★★これを 落とすと、★`sched_mine` だけ の 先生に 学校 全部が 開きます。
--
--   ★★生徒 自身は これまで どおり 自分の コマを 見られます。
-- ---------------------------------------------------------------------------
drop policy if exists "Ops-visible lessons (org-based)" on public.lessons;
create policy "Ops-visible lessons (org-based)" on public.lessons
  for select using (
    org_id is not null
    and (
      auth.uid() = student_id
      or public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all')
      or (
        teacher_id = auth.uid()
        and public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine')
      )
    )
  );

drop policy if exists "Teachers can create org lessons" on public.lessons;
create policy "Teachers can create org lessons" on public.lessons
  for insert with check (
    org_id is not null
    and (
      public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all')
      or (
        teacher_id = auth.uid()
        and public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine')
      )
    )
  );

drop policy if exists "Teachers can update or delete org lessons" on public.lessons;
create policy "Teachers can update or delete org lessons" on public.lessons
  for update using (
    org_id is not null
    and (
      public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all')
      or (
        teacher_id = auth.uid()
        and public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine')
      )
    )
  ) with check (
    org_id is not null
    and (
      public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all')
      or (
        teacher_id = auth.uid()
        and public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine')
      )
    )
  );

drop policy if exists "Teachers can delete org lessons" on public.lessons;
create policy "Teachers can delete org lessons" on public.lessons
  for delete using (
    org_id is not null
    and (
      public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_all')
      or (
        teacher_id = auth.uid()
        and public.can_view_ops_perm(auth.uid(), org_id, student_id, 'sched_mine')
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 【四】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 古い 門を 呼んで いる 決まりが 残って いないか（★0件に なる はず）
select c.relname as tbl, p.polname
from pg_policy p join pg_class c on c.oid = p.polrelid
where pg_get_expr(p.polqual, p.polrelid) like '%can_view_ops(%'
   or pg_get_expr(p.polwithcheck, p.polrelid) like '%can_view_ops(%';

-- ★② 新しい 決まりが 5つ とも 入ったか
select c.relname as tbl, p.polname, p.polcmd::text as cmd
from pg_policy p join pg_class c on c.oid = p.polrelid
where pg_get_expr(p.polqual, p.polrelid) like '%can_view_ops_perm%'
   or pg_get_expr(p.polwithcheck, p.polrelid) like '%can_view_ops_perm%'
order by c.relname, p.polname;

-- ★③ 役職ごとに、★何行 見えるか
select o.name as gakko, p.name as post, m.role,
       (p.perms ? 'sched_all')  as sched_all,
       (p.perms ? 'sched_mine') as sched_mine,
       (select count(*) from public.lessons l where l.org_id = m.org_id) as 学校のコマ
from public.memberships m
join public.org_posts p on p.id = m.post_id
join public.organizations o on o.id = m.org_id
order by o.name, p.name;

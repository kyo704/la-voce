-- ============================================================================
-- my_periods に org_id を足す（裁定その151・2026-09-21）
--
--   なぜ
--     裁定149 は「自分のコマ」の書き込みに koma_mine の門を求めました。
--     条文は has_can(org_id,'koma_mine') ですが、my_periods に org_id が
--     ありません。在籍から引くと、A校の札で B校のコマが書ける形になり、
--     裁定140（学校ごとに閉じる）と合いません。だから列を足します。
--
--   null を許す
--     学校に属さない方も、自分のコマの時刻を決めます。個人の画面にもある
--     機能です。学校の札で個人の機能を止めるのは取り上げです。
--     null ＝ 個人のコマ ／ not null ＝ その学校でのコマ。
--
--   何度流しても同じです（if not exists / drop policy if exists）。
--   test で先に流します。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列を足す
-- ---------------------------------------------------------------------------
alter table public.my_periods
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

comment on column public.my_periods.org_id is
  'null＝個人のコマ（学校に関係しない）／not null＝その学校でのコマ。裁定151。';

create index if not exists my_periods_user_org_idx
  on public.my_periods (user_id, org_id);

-- ---------------------------------------------------------------------------
-- ①-2 ひとつの番号を、学校ごとに持てるようにする
--     もとは unique (user_id, ord) でした。学校ごとのコマになると、
--     2校に在籍する先生は、どちらの学校でも「1限」を持ちます。
--     もとのままだと、2校目の1限を作れません（裁定140 と合いません）。
--
--     null（個人のコマ）は、Postgres では互いに「ちがう値」に見えます。
--     そのままだと個人の1限を2つ作れてしまうので、2本に分けます。
-- ---------------------------------------------------------------------------
alter table public.my_periods drop constraint if exists my_periods_uniq;

create unique index if not exists my_periods_uniq_personal
  on public.my_periods (user_id, ord) where org_id is null;

create unique index if not exists my_periods_uniq_org
  on public.my_periods (user_id, org_id, ord) where org_id is not null;

-- ---------------------------------------------------------------------------
-- ② 移す（推測で学校を決めません）
--     在籍1校、かつその学校で koma_mine を持つ方の行だけ。
--     在籍0校は null のまま（個人）。在籍2校以上も null のまま。
-- ---------------------------------------------------------------------------
update public.my_periods p
   set org_id = s.org_id
  from (
    -- uuid に min() はありません。1行だけなので、その1行を取ります。
    select m.user_id, (array_agg(m.org_id))[1] as org_id
      from public.memberships m
      join public.org_posts q on q.id = m.post_id
     where coalesce((q.perms->>'koma_mine')::boolean, false)
     group by m.user_id
    having count(*) = 1
       and (select count(*) from public.memberships m2 where m2.user_id = m.user_id) = 1
  ) s
 where p.user_id = s.user_id
   and p.org_id is null;

-- ---------------------------------------------------------------------------
-- ③ 書き換えの門（裁定149 の条文を、この形で）
--     読む側は変えません（裁定151 scope_out）。
--     いまは FOR ALL の1本です。読みだけ残し、書きは3本に分けます。
-- ---------------------------------------------------------------------------
-- 何度流しても同じにするため、書きの3本も先に落とします。
drop policy if exists my_periods_own on public.my_periods;
drop policy if exists my_periods_select_own on public.my_periods;
drop policy if exists my_periods_insert_own on public.my_periods;
drop policy if exists my_periods_update_own on public.my_periods;
drop policy if exists my_periods_delete_own on public.my_periods;

create policy my_periods_select_own on public.my_periods
  for select using (auth.uid() = user_id);

create policy my_periods_insert_own on public.my_periods
  for insert with check (
    auth.uid() = user_id
    and (org_id is null or public.has_can(org_id, 'koma_mine'))
  );

create policy my_periods_update_own on public.my_periods
  for update using (
    auth.uid() = user_id
    and (org_id is null or public.has_can(org_id, 'koma_mine'))
  ) with check (
    auth.uid() = user_id
    and (org_id is null or public.has_can(org_id, 'koma_mine'))
  );

create policy my_periods_delete_own on public.my_periods
  for delete using (
    auth.uid() = user_id
    and (org_id is null or public.has_can(org_id, 'koma_mine'))
  );

-- ---------------------------------------------------------------------------
-- ④ org_id を後から動かせないこと
--     USING は古い行、WITH CHECK は新しい行を見ます。2つとも通る人
--     （A校とB校の両方で koma_mine を持つ方）は、行を A から B へ
--     移せてしまいます。決まりでは古い値と新しい値を見比べられません。
--     だから引き金（trigger）で止めます。
-- ---------------------------------------------------------------------------
create or replace function public.assert_my_periods_org_stable()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.org_id is distinct from old.org_id then
    raise exception
      'MY_PERIODS_ORG_FIXED: このコマの学校は、あとから変えられません。'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function public.assert_my_periods_org_stable() is
  'my_periods.org_id を更新で動かさせない。裁定151 Q3。決まり（RLS）は古い値と新しい値を見比べられないため引き金にしている。';

drop trigger if exists trg_my_periods_org_stable on public.my_periods;
create trigger trg_my_periods_org_stable
  before update on public.my_periods
  for each row execute function public.assert_my_periods_org_stable();

-- 既定では PUBLIC に渡ります。引き金の関数は直に呼ばせません。
revoke all on function public.assert_my_periods_org_stable() from public;
revoke all on function public.assert_my_periods_org_stable() from anon;
revoke all on function public.assert_my_periods_org_stable() from authenticated;

-- ---------------------------------------------------------------------------
-- ⑤ 読む側（裁定151 read）
--     その学校のコマだけ返します。個人のコマ（null）は1行も返しません。
--     列を足しただけで直さないと、事務が先生の個人のコマまで読めます。
-- ---------------------------------------------------------------------------
create or replace function public.get_teacher_periods(
  p_org_id uuid,
  p_teacher_id uuid
)
returns table (id uuid, ord smallint, name text, start_min smallint, end_min smallint)
language sql
stable
security definer
set search_path to 'public'
as $$
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
$$;

revoke all on function public.get_teacher_periods(uuid, uuid) from public;
revoke all on function public.get_teacher_periods(uuid, uuid) from anon;
grant execute on function public.get_teacher_periods(uuid, uuid) to authenticated;

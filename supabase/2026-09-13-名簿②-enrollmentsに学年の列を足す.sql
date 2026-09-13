-- ============================================================================
-- ★名簿 ② ── enrollments に 学年の 列を 足す
--
--   ★出どころ Opus 裁定 その21（生徒は enrollments）＋ その18（学年は 学校が 決める）
--   ★★2つを つなぐと ── 学年の 札は enrollments に 置く。
--
--   ★★memberships.grade_label は 残します（消しません）。
--     ★本物の 行は 0件。使い捨ての 10件だけ（★50通り-*・⑨で 消えます）。
--     ★★列を 消す 判断は 別。ここでは 足すだけ。
--
--   ★★引き金（guard_grade_label）は memberships に かかって います。
--     ★enrollments の 側にも 同じ 守りが 要ります（④）。
--
--   ★1つずつ 流して ください。①②は 読むだけ。
-- ============================================================================

-- ① 列が まだ 無い ことを 確かめる（読むだけ）
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'enrollments'
order by ordinal_position;
-- 期待 ── 6列。grade_label は 無い。

-- ② has_can が 居る ことを 確かめる（読むだけ）
select p.proname, pg_get_function_identity_arguments(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'has_can';
-- 期待 ── 1行。無ければ ④を 流せません。

-- ③ 列を 足す
alter table public.enrollments
  add column if not exists grade_label text;

-- ④ 守りを 立てる（memberships と 同じ 形）
--    ★grade_label が 変わった ときだけ 見ます。ほかの 列に 触れません。
--    ★裏口（auth.uid() が 空）は 素通し。
create or replace function public.guard_enrollment_grade_label()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
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
$$;

drop trigger if exists guard_enrollment_grade_label on public.enrollments;
create trigger guard_enrollment_grade_label
  before insert or update of grade_label on public.enrollments
  for each row
  execute function public.guard_enrollment_grade_label();

-- ⑤ 列ごとの 許し
--    ★★2026-09-13、★流した あとに 分かった こと ──
--      ★★`enrollments` には **すでに 表ごとの UPDATE** が
--        ★authenticated に 付いて いました（★今日より 前から。
--        ★帳面の どの SQL でも ありません。元の 手作業の 設定）。
--      ★★だから この 1行は **無害ですが 無意味**です。
--        ★広い ほうが すでに 勝って います。
--    ★★では 学年の 札は 開いて いるのか ── ★開いて いません。
--      ★★守って いるのは 許しでは なく、★④の 引き金です。
--      ★★引き金は 許しと 無関係に 働きます。
grant update (grade_label) on public.enrollments to authenticated;

-- ⑥ 確かめ（読むだけ）
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'enrollments'
  and column_name = 'grade_label';
-- 期待 ── 1行。text／YES。

select tgname, tgenabled from pg_trigger
where tgrelid = 'public.enrollments'::regclass and not tgisinternal;
-- 期待 ── guard_enrollment_grade_label が ある。

select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'enrollments'
  and grantee = 'authenticated' and privilege_type = 'UPDATE'
order by column_name;
-- ★★期待 ── **7行**（列 ぜんぶ）。
--   ★★2026-09-13、★ここに「grade_label の 1行だけ」と 書いて いました。
--     ★★★私の 誤りです。★表ごとの UPDATE が すでに あるので、
--       ★★列は ぜんぶ 出ます。★次に 流す 方を 惑わせない ように 直しました。

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'enrollments'
  and grantee = 'authenticated' and privilege_type = 'UPDATE';
-- ★★期待 ── **1行**（★今日より 前から ある もの）。
--   ★★0行と 書いて いました。★これも 私の 誤りです。
--   ★★この 広い 許しは **いま 剥がしません**。
--     ★★決まり（RLS）が 止めて いる ことを、★実地で 確かめました
--       （★status／student_id／org_id を 投げて、★どれも 2xx・0行）。
--     ★★剥がすと、★名簿を 預かる 方の 正当な 更新も 止まる おそれが あります。

-- ⑦ 戻し方
-- drop trigger if exists guard_enrollment_grade_label on public.enrollments;
-- drop function if exists public.guard_enrollment_grade_label();
-- revoke update (grade_label) on public.enrollments from authenticated;
-- alter table public.enrollments drop column if exists grade_label;

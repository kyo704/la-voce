-- ★本番の 台帳から 写しました（leave_enrollment_v2_close_assignments）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


create or replace function public.leave_enrollment(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.leave_enrollment(uuid) from public, anon;
grant execute on function public.leave_enrollment(uuid) to authenticated;

comment on function public.leave_enrollment(uuid) is
  '生徒が自分の在籍を left にし、同じ取引で受け持ち（assignments）も閉じる。列を絞るため policy ではなく関数で行う。返り値は在籍の更新行数。';


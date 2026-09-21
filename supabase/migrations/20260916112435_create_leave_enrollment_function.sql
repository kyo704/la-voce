-- ★本番の 台帳から 写しました（create_leave_enrollment_function）。
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
  return n;
end;
$$;

revoke all on function public.leave_enrollment(uuid) from public, anon;
grant execute on function public.leave_enrollment(uuid) to authenticated;

comment on function public.leave_enrollment(uuid) is
  '生徒が自分の在籍を left にする。列を絞るため policy ではなく関数で行う。直した行数を返す。';


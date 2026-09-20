-- ============================================================================
-- ★生徒の「よみ」も 返します（★書き出しの 列・D94・2026-09-20）
--
--   ★★★D94 で、★`profiles.kana` を 書き出しの 列に 足す と 決まりました。
--     ★★けれど、★よその 方の `profiles` は 1行も 読めません（★決まり）。
--     ★★★だから 返す 道に 足します。★決まりは 緩めません。
--
--   ★★返すのは お名前と よみ だけ です。
--     ★★同じ 行に ある お薬・アレルギー・周期は、★1列も 出しません。
--   ★★門は そのまま です ── ★`can_view_ops_perm(…, 'sched_all')`。
--
--   ★★★返りの 形が 変わるので、★一度 落としてから 作り直します。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

drop function if exists public.get_org_student_names(uuid);

create or replace function public.get_org_student_names(p_org_id uuid)
returns table (user_id uuid, display_name text, kana text)
language sql stable security definer set search_path to 'public'
as $$
  select e.student_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name,
         nullif(btrim(coalesce(p.kana, '')), '') as kana
    from enrollments e
    left join profiles p on p.id = e.student_id
   where e.org_id = p_org_id
     and e.status = 'active'
     and can_view_ops_perm(auth.uid(), p_org_id, e.student_id, 'sched_all')
$$;

comment on function public.get_org_student_names(uuid) is
  '学校の 生徒の お名前と よみ だけ を 返す。門は レッスンが 見える のと 同じ。2026-09-20。';

revoke all on function public.get_org_student_names(uuid) from public, anon;
grant execute on function public.get_org_student_names(uuid) to authenticated;

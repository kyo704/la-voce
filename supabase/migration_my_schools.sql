-- ============================================================================
-- La Voce / Woolsong ── ★在籍して いる 学校の 一覧（★裁定 その140・2026-09-21）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ 関数か
--   ★★画面が `enrollments` と `organizations` を つなぐと、
--     ★★「どの 学校の 名を 引いてよいか」が 画面の 判断に なります。
--   ★★ここで 決めます ── ★**自分が active で 在籍して いる 学校 だけ**。
--
-- ★★★並びを 決めます（★裁定 その140 FIX_NOW）。
--   ★★`enrolled_at` の 古い 順、★同じ なら `org_id` の 順。
--   ★★開く たびに 学校が 変わるのは、★どの 案を 採っても 誤り です。
-- ============================================================================

create or replace function public.get_my_schools()
returns table (
  org_id uuid,
  name text,
  enrolled_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.id, o.name, e.enrolled_at
  from public.enrollments e
  join public.organizations o on o.id = e.org_id
  where e.student_id = auth.uid()
    and e.status = 'active'
  order by e.enrolled_at asc nulls last, o.id asc
$$;

revoke all on function public.get_my_schools() from public, anon;
grant execute on function public.get_my_schools() to authenticated;

comment on function public.get_my_schools() is
  '★在籍して いる 学校（★active だけ）。★並びは 入った 順（★裁定 その140）。';

-- ============================================================================
-- ★学校の 生徒の お名前を 読む 道（★2026-09-20）
--
--   ★★★見つけた こと ── ★日程の 表に「名前を 読み込めませんでした」が 並びます。
--     ★★お名前を 返す 道は、★きょうまで 2本 でした。
--       ①`get_org_member_names` …… ★`memberships` の 方 だけ（★先生・事務）
--       ②`get_connected_names` …… ★ご自分と つながって いる 方 だけ
--     ★★★生徒は `enrollments` に 居ます。★`memberships` に 居ません。
--       ★★だから、★受け持ちで ない 生徒の お名前は、★どこからも 返りません。
--       ★★★同じ 表の 中で、★出る 方と 出ない 方が 混ざります。
--
--   ★★★門は、★レッスンを 見られる かどうか と **同じ もの** に します。
--     ★★`can_view_ops_perm(…, 'sched_all')` ──
--       ★在籍が あり、★かつ（`sched_all` を 持つ ★または 受け持ち）。
--     ★★★つまり「その 方の コマが 見える なら、お名前も 見える」。
--       ★★2つの 決めを 作りません。★食い違う 日が 来ます。
--
--   ★★★返すのは お名前 だけ です。★`profiles` の 行を 渡しません。
--     ★★同じ 行に、★お薬・アレルギー・周期が あります。★1列も 出しません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.get_org_student_names(p_org_id uuid)
returns table (user_id uuid, display_name text)
language sql stable security definer set search_path to 'public'
as $$
  select e.student_id,
         nullif(btrim(coalesce(p.display_name, '')), '') as display_name
    from enrollments e
    left join profiles p on p.id = e.student_id
   where e.org_id = p_org_id
     and e.status = 'active'
     and can_view_ops_perm(auth.uid(), p_org_id, e.student_id, 'sched_all')
$$;

comment on function public.get_org_student_names(uuid) is
  '学校の 生徒の お名前 だけ を 返す。門は レッスンが 見える のと 同じ '
  '(can_view_ops_perm の sched_all)。2026-09-20。';

revoke all on function public.get_org_student_names(uuid) from public, anon;
grant execute on function public.get_org_student_names(uuid) to authenticated;

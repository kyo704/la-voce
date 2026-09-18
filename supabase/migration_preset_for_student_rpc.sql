-- ============================================================================
-- ★裁定 その93 ── ★列は 決まり（RLS）で 守れません（★2026-09-19）
--
--   ★★★決まりは **行** を 選びます。★**列** は 選びません。
--     ★★学生が 型の 行を 1つ 読めると、★その 行の 列は 全部 渡ります。
--     ★★画面に 出さなくても、★通信の 中身を 見れば 読めます。
--
--   ★★★だから、★見せる 列 だけ を 返す 読み道に 替えます。
--     ★★`name` と `total_count` の 2つ だけ です。
--     ★★渡さない もの ──
--       ★`note` …… 事務の 覚え書き。★学生に 見せる 前提で 書かれません
--       ★`need_count` …… 足りると される 回数。★率に 近づきます（★裁定 その90）
--       ★`created_by` …… 誰が 作ったか。★学生に 要りません
--
--   ★★★裁定 その92 で 足した 在籍の 枝は、★取り消します。
--     ★★0行の いま 直します。★行が 入って からでは、★移し替えが 要ります。
--
--   ★★★台帳の 列の 名 ── ★`enrollments.student_id` です。
--     ★★裁定の 文は `e.user_id` ですが、★この 蔵に その 列は ありません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① ★読む 決まりを 戻す ── ★事務と 門下 だけ
-- ---------------------------------------------------------------------------
drop policy if exists lesson_presets_select on public.lesson_presets;
create policy lesson_presets_select on public.lesson_presets
  for select to authenticated
  using (has_can(org_id, 'meibo') or has_can(org_id, 'monka_write'));

-- ---------------------------------------------------------------------------
-- ★② ★学生の ための 読み道 ── ★2つの 列 だけ
-- ---------------------------------------------------------------------------
--   ★★`security definer` …… ★決まりを 越えて 読みます。
--     ★★★だから、★中で **自分で** 門を 立てます。
--       ★★`enrollments`（`active`）に 居る 方 だけ です。
--   ★★`search_path` を 空に します。★よその 綴りに 釣られない ため です。
--   ★★`stable` …… ★書きません。★読む だけ です。
create or replace function public.get_lesson_preset_for_student(p_org_id uuid)
returns table(name text, total_count int)
language sql
security definer
stable
set search_path = ''
as $$
  select p.name, p.total_count
  from public.lesson_presets p
  where p.org_id = p_org_id
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
$$;

-- ★★先に 取り上げてから、★要る 方に だけ 渡します（★蔵の 決め）。
revoke all on function public.get_lesson_preset_for_student(uuid) from public;
revoke all on function public.get_lesson_preset_for_student(uuid) from anon;
grant execute on function public.get_lesson_preset_for_student(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ ★確かめ ── ★流した あとに、★これを ご覧ください
-- ---------------------------------------------------------------------------
--   select proname, prosecdef, proconfig,
--          pg_get_function_result(oid) as kaeri
--   from pg_proc where proname = 'get_lesson_preset_for_student';
--
--   ★返りは `TABLE(name text, total_count integer)` の はず です。
--   ★`prosecdef` は true、★`proconfig` は `{search_path=}` の はず です。

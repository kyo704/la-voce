-- ============================================================================
-- ★裁定 その92 ── ★学生に「分母」を お見せします（★2026-09-19）
--
--   ★★★「12回目」だけ では、★単位が 足りるか ご本人が 判じられません。
--     ★★分母は 率では ありません。★事実 です。
--     ★★裁定 その90 の ねらいは「比べさせない」で あって、
--       ★★★「知らせない」では ありません。
--
--   ★★★お直しは **1つ だけ** です ── ★`lesson_presets` の 読む 決まり。
--     ★★`lesson_preset_targets`（★どの 先生が どの 型を 持つか）は
--       ★★**触りません**。★学生に お見せしません。
--       ★★あれが 見えると、★ご自分の 門下 以外の 組み立てが 見えます。
--
--   ★★★台帳の 列の 名（★2026-09-19 に 確かめました）。
--     ★★裁定の 文には `e.user_id` と ありますが、
--       ★★この 蔵の 列は `student_id` です。★実物に 合わせます。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① ★型を 読む ── ★事務 ／ 門下 ／ ★いま その 学校に 在る 学生
-- ---------------------------------------------------------------------------
--   ★★`status = 'active'` を 求めます。
--     ★★★やめた 方（`left`）は 読めません。★去った 先の 型は、★もう ご縁が ありません。
--   ★★書く 決まり（`lesson_presets_write`）は 触りません。★学生は 書けません。
drop policy if exists lesson_presets_select on public.lesson_presets;
create policy lesson_presets_select on public.lesson_presets
  for select to authenticated
  using (
    has_can(org_id, 'meibo')
    or has_can(org_id, 'monka_write')
    or exists (
      select 1 from public.enrollments e
      where e.org_id = lesson_presets.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- ★② ★どの 先生が どの 型を 持つか ── ★学生には お見せしません
-- ---------------------------------------------------------------------------
--   ★★ここは 何も 変えません。★元の ままに します。
--   ★★★書き直して いるのは、★「触り忘れ」と「触らないと 決めた」を
--     ★★見分けられる ように する ため です。
--     ★★この 1文が 無いと、★次に 読む 方が「足し忘れ」と 思います。
drop policy if exists lesson_preset_targets_select on public.lesson_preset_targets;
create policy lesson_preset_targets_select on public.lesson_preset_targets
  for select to authenticated
  using (has_can(org_id, 'meibo') or has_can(org_id, 'monka_write'));

-- ---------------------------------------------------------------------------
-- ★③ ★確かめ ── ★流した あとに、★これを ご覧ください
-- ---------------------------------------------------------------------------
--   ★★「在る 学生」は true、★「やめた 学生」は false に なる はず です。
--
--   select e.status,
--          exists (select 1 from public.enrollments x
--                  where x.org_id = e.org_id
--                    and x.student_id = e.student_id
--                    and x.status = 'active') as yomeru
--   from public.enrollments e;

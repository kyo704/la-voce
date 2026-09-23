-- ★★★Opus の sql/31 R2（★2026-09-23）。
--   ★裁定165（evaluation_judges）を 当てた あと に 当てます。★当てました（20260923030953）。
--   ★★試しで 4通り 確かめました ──
--       採点の 札 なし・審査員でも ない …… 0
--       その 回の 審査員 ……………………… 1
--       べつの 回の 審査員 ………………… 0
--       採点の 札あり ……………………… 1
--   ★R1 は 別です（★穴が 閉じない ため 当てて いません）。

drop policy if exists evaluation_items_select on public.evaluation_items;
create policy evaluation_items_select on public.evaluation_items for select to authenticated
  using (
    has_can(org_id, 'saiten')
    or exists (select 1 from public.evaluation_judges j
                where j.event_id = evaluation_items.event_id and j.judge_id = auth.uid())
  );


-- ★★★Opus の sql/31 の R2 だけ。★**当てて いません**。
--   ★前提 …… 裁定165（evaluation_judges）が 本番に 入る こと。★いま ありません。

-- R2 評価の項目が、採点に関わらない職員にも見える
-- ★裁定165 の evaluation_judges が無いと、この下は失敗する（先に165を当てる）
-- ────────────────────────────────
do $$
begin
  if to_regclass('public.evaluation_judges') is null then
    raise exception 'NEED_165: 先に 裁定165（evaluation_judges）を当ててください';
  end if;
end $$;

drop policy if exists evaluation_items_select on public.evaluation_items;
create policy evaluation_items_select on public.evaluation_items for select to authenticated
  using (
    has_can(org_id, 'saiten')
    or exists (select 1 from public.evaluation_judges j
                where j.event_id = evaluation_items.event_id and j.judge_id = auth.uid())
  );


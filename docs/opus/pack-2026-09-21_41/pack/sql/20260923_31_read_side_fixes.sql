-- 20260923_31 読み取りの直し2件（裁定177 R1・R2）
-- ★R2 は 裁定165（evaluation_judges）を当てたあとに当てる。この1本の中で順に書いてある

-- ────────────────────────────────
-- R1 学校を作った人が、抜けたあとも学校を見られる
-- ★消すだけにしない: 学校を作った直後（memberships がまだ1行も無い瞬間）に自分の学校が見えないと、
--   役職を作る処理（memberships_insert_bootstrap_owner）が通らなくなる恐れがある。
--   そこで「作った人 かつ まだ誰も役職を持っていない学校」だけに絞る（＝作った直後の一瞬だけ）
-- ────────────────────────────────
drop policy if exists organizations_select_own_created on public.organizations;
create policy organizations_select_bootstrap on public.organizations for select to authenticated
  using (
    created_by = auth.uid()
    and not exists (select 1 from public.memberships m where m.org_id = organizations.id)
  );
-- これで、役職が1つでも作られた学校は can_view_organization（在籍か名簿にいること）だけで決まる

-- ────────────────────────────────
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

-- 確かめ（実在の試しの利用者で）
-- R1: 学校を作る → 役職を作るところまで通る（作る処理が壊れていない）
--     役職ができたあと、作った人が学校を抜ける → その学校が見えなくなる
--     在籍している学生・名簿にいる職員 → いままでどおり見える
-- R2: 採点の札を持たない職員が evaluation_items を select → 0行
--     その回の審査員 → 見える／別の回の審査員 → 0行
--     採点の札を持つ事務 → 見える

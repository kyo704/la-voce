-- ★★★Opus の sql/31 R1 ── ★**当てて いません**（★2026-09-23）。
--
--   ★★★試しの 台帳で 動かして、★穴が 閉じない ことを 確かめました。
--
--     決まりの 中の
--         not exists (select 1 from public.memberships m where m.org_id = organizations.id)
--       は、★**その人に 見える 名簿** だけ を 数えます。
--       ★★`memberships` にも 行の 決まり（RLS）が ある ため です。
--
--     ★★抜けた 人には、★その 学校の 名簿が **1行も 見えません**。
--       ★★だから `not exists` は ★いつでも true。★決まりは 通って しまいます。
--
--     ★測りました（★試しの 台帳）──
--       postgres から 見た memberships …… 2
--       抜けた 人から 見た memberships …… 0
--       立ち上げの 枝 …………………… ★true
--       学校が 見えるか ………………… ★1（★0 の はず）
--
--   ★★★直して いません。★考えは 正しい です。★見る 場所が ちがいます。
--     ★`security definer` の 関数の 中で 数える と 通ります
--       （★`can_view_organization` と 同じ 形）。★Opus に お返しします。
--
-- ★★★Opus の sql/31 の R1 だけ（★2026-09-23）。
--   ★R2（評価の 項目）は 裁定165（evaluation_judges）を 待ちます。
--     ★本番に その 表は ありません（0）。★sql/31 は 中で 止まる 作り です。
--     ★★置き場 …… supabase/pending/opus_31_r2_evaluation_items.sql
--   ★R1 は Opus の 字の まま です。
--   ★★届く 人 …… ★0。★作った 人が 名簿に いない 学校は 0件（本番で 数えました）。

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

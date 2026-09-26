-- 20260924_80 公開した ページの ★中身が 見えない（★束5 を 先回りして 見つけた）
-- 見つけ方（2026-09-24・C群 束5 を 本物で 通していて）:
--   portfolios は ★sql/78 で 3つの 範囲に なりました（self／org／public）
--   ★ところが ★中身の表（経歴・録画）は ★本人だけ の ままでした
--     portfolio_entries_own（ALL）／portfolio_recordings_own（ALL）＝ user_id = auth.uid()
--   → ★公開しても ★他人には ★名前だけ 見えて ★経歴も 録画も 見えません
--     ＝ ★「公開ページ」が ★空に なります
--   ★エラーは 出ません。★静かに 空です
-- ★78 のあと

-- ① 経歴 ── ★親（portfolios）の 範囲に 合わせる
drop policy if exists portfolio_entries_read on public.portfolio_entries;
create policy portfolio_entries_read on public.portfolio_entries for select to authenticated
  using (
    user_id = auth.uid()                                   -- ★本人
    or exists (select 1 from public.portfolios p
                where p.user_id = portfolio_entries.user_id
                  and (p.visibility = 'public'
                       or (p.visibility = 'org' and public.same_org_as(p.user_id))))
  );

-- ② 録画 ── 同じ
drop policy if exists portfolio_recordings_read on public.portfolio_recordings;
create policy portfolio_recordings_read on public.portfolio_recordings for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.portfolios p
                where p.user_id = portfolio_recordings.user_id
                  and (p.visibility = 'public'
                       or (p.visibility = 'org' and public.same_org_as(p.user_id))))
  );

-- ★書くのは いままでどおり 本人だけ（★_own のポリシーが 残っています）
-- ★体調・記録は ★1文字も 入りません（★この2表に そもそも ありません）

-- 確かめ（試しの環境で・★なりきって）
-- 'public' → ★他人から 経歴も 録画も 見える（★前は 0件でした）
-- 'org'    → ★同じ学校の人だけ 見える／よその学校は 0件
-- 'self'   → ★他人からは 0件（★名前も 中身も）
-- ★未認証 → 0件
-- ★他人が 書こうとする → 拒否（★_own のまま）

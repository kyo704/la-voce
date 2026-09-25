-- 20260924_79 「返すかどうか」を ★自分の学校の分だけに（★私の 誤りの 直し）
-- 見つけ方（2026-09-24・約束の一覧 1,249件を 見ていて）:
--   ★USING(true) の select ポリシーを 洗ったら 5件。★4件は 値段表・ことばの表で 意図どおり
--   ★1件だけ 違いました: ★evaluation_release
--     ★sql/52 で 私が「生徒は『返っているか』だけ 読めてよい」と 考えて true に しました
--     ★けれど それは ★よその学校の 行事の 設定まで 読める、という 意味でした
--     ★中身（点）は 別のポリシーで 守られていますが、
--     ★「どの学校が いつ 点を 返したか」は ★学校の 内側の ことです
-- ★52 のあと

drop policy if exists evaluation_release_read on public.evaluation_release;
create policy evaluation_release_read on public.evaluation_release for select to authenticated
  using (
    -- ★その学校に いる人だけ（★先生・事務・学生）
    exists (select 1 from public.memberships m
             where m.org_id = evaluation_release.org_id and m.user_id = auth.uid())
    or exists (select 1 from public.enrollments e
                where e.org_id = evaluation_release.org_id and e.student_id = auth.uid()
                  and e.status = 'active')
  );

-- 確かめ（試しの環境で・★なりきって）
-- その学校の 学生 → 読める／その学校の 先生・事務 → 読める
-- ★よその学校の人 → ★0行（★前は 読めました）
-- ★未認証 → 0行
-- ★書けるのは いままでどおり 採点の札を 持つ人だけ

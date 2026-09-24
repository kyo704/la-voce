-- 20260923_47 レッスン割の守りの穴（2026-09-23 に本番を読んで見つけた）
-- 見つけたもの:
--   lesson_prefs / lesson_ng_dates の「自分のもの」ポリシーは ALL（すべての操作）で、
--   ★with_check（書き込むときの条件）にだけ「回が open かつ 締切前」が入っている
--   → 足す・直すは 締切後に止まるが、★消すは 止まらない（DELETE は qual しか見ない）
--   ★締切のあとに 生徒が 希望と出られない日を消せる＝先生の割り当ての根拠が消える
-- いまの実害: lesson_rounds は0行。★使い始めてから出る
-- ★10 のあと
-- ★仕組みの話: ALL のポリシーは、DELETE のとき ★using だけを見る（with_check は見ない）。
--   だから「書き込みの条件」に締切を入れても、消す道は塞がらない。
--   ★読む道は 別の select のポリシーで開けておく（締切後も 自分の出したものは見える）

-- ① 自分のもの（足す・直す・読む）は いままでどおり。★消すだけ 締切を見る
drop policy if exists lesson_prefs_own on public.lesson_prefs;
create policy lesson_prefs_own on public.lesson_prefs for all to authenticated
  using (
    -- ★消すときも 締切を見る（DELETE は using しか見ないため）
    user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r
                 where r.id = lesson_prefs.round_id and r.status = 'open'
                   and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on))
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r
                 where r.id = lesson_prefs.round_id and r.status = 'open'
                   and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on))
  );
-- ★締切後も 自分の出したものは 読める（消せないだけ）
drop policy if exists lesson_prefs_read_own on public.lesson_prefs;
create policy lesson_prefs_read_own on public.lesson_prefs for select to authenticated
  using (user_id = auth.uid());

drop policy if exists lesson_ng_own on public.lesson_ng_dates;
create policy lesson_ng_own on public.lesson_ng_dates for all to authenticated
  using (
    user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r
                 where r.id = lesson_ng_dates.round_id and r.status = 'open'
                   and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on))
  )
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.lesson_rounds r
                 where r.id = lesson_ng_dates.round_id and r.status = 'open'
                   and (r.due_on is null or (now() at time zone 'Asia/Tokyo')::date <= r.due_on))
  );
drop policy if exists lesson_ng_read_own on public.lesson_ng_dates;
create policy lesson_ng_read_own on public.lesson_ng_dates for select to authenticated
  using (user_id = auth.uid());

-- ② 回を閉じたあとに 生徒の側から消される道が 他にないかの確かめ
--    lesson_rounds を消すと 連鎖で消える（それは運営の操作なので よい）

-- 確かめ（試しの環境で）
-- 締切前: 生徒が 希望を足す・直す・消す → ★通る
-- ★締切後（due_on を過ぎる／status を confirmed にする）:
--   足す → 止まる／直す → 止まる／★消す → 止まる（ここが今回の直し）
--   ★読む → 通る（自分が出したものは いつでも見える）
-- 先生・日程の札を持つ人: 締切後も 読める（lesson_prefs_read_staff は そのまま）

-- 20260923_49 先生が「生徒の共有の範囲」を書き換えられる穴（2026-09-23 に書き込みのポリシーを洗って発見）
-- 見つけたもの:
--   teacher_student_links の UPDATE のポリシーの名前は「Students can update share scope」なのに、
--   ★using が （先生 または 生徒）になっている → ★先生も share_scope を書き換えられる
--   share_scope（jsonb・11行に入っている）は、★いまはどのポリシー・どの関数も見ていない（0本）
--   → ★いまは効いていない列。だが 残っている限り「先生が生徒の共有を決められる」形が 台帳に残る
-- 決めたこと（裁定182）:
--   ★A 列を残し、書き換えられるのは ★生徒だけにする（この SQL）
--   ★B 使っていないなら 列ごと消す ← ★本当はこちらが正しい。ただし
--     画面が読んでいる可能性があるので、★Code の確認を待ってから消す（下の §2）
-- ★12（学校の層）とは別。ここは 個人どうしのつながり

-- ① 書き換えられるのは 生徒だけにする
drop policy if exists "Students can update share scope" on public.teacher_student_links;
create policy teacher_student_links_update_by_student on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = student_id)          -- ★先生を外した
  with check (auth.uid() = student_id);
-- 身元（先生・生徒）が変わらないことは、引き金（assert_link_identity_unchanged）が見ている

-- ② 先生ができること（つながりを切る）は 別に残す
--    ★先生は「やめる」ことはできるが、「生徒の共有の範囲」は触れない
drop policy if exists teacher_student_links_revoke_by_teacher on public.teacher_student_links;
create policy teacher_student_links_revoke_by_teacher on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id)
  with check (
    auth.uid() = teacher_id
    and share_scope is not distinct from (select l.share_scope from public.teacher_student_links l where l.id = teacher_student_links.id)
    -- ★share_scope を変えない更新だけ通す（status・revoked_at を触るため）
  );

-- 確かめ（試しの環境で）
-- 生徒が share_scope を変える → 通る
-- ★先生が share_scope を変える → 止まる
-- 先生が つながりを切る（status・revoked_at）→ 通る
-- 先生・生徒のどちらでもない人 → 0行（読むところから止まる）
-- 身元（teacher_id・student_id）を変える → LINK_IDENTITY_IMMUTABLE

-- ═══════ §2 ★Code に確かめてほしいこと（その後に B を決める） ═══════
-- 画面（リポジトリ）が teacher_student_links.share_scope を ★読んでいるか／書いているか
--   読んでいない → ★列ごと消すのが正しい（裁定138 の「shareScope の列ごと消す」と同じ扱い）
--   読んでいる   → 何に使っているかを Opus に返す。使い道によっては 裁定を作り直す

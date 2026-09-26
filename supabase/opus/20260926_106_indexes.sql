-- 20260926_106 外部キーに 索引が 無い（★500人の 学科で 効きます）
-- ★★2026-09-26 に 見つけました（★「もう 無い？」と 聞かれて 探しました）
--   ★★48の 表で ★外部キーに 索引が ありません
--   ★★いまは 行が 少ないので 効きません
--   ★★★500人の 学科が 入ると ★遅く なります
--   ★9/10 の 評価:「★216人の 名簿で 146ms。★学校の iPad では 3〜5倍」
-- ★★全部には 付けません。★★画面の 守りが 毎回 引く ものだけ
--   ★理由: ★索引は ★書き込みを 遅くします。★読まない 列に 付けても 損 です
-- ★105 のあと

-- ★① ★名簿（★いちばん 大きい）
create index if not exists idx_enrollments_division on public.enrollments(division_id)
  where division_id is not null;
create index if not exists idx_memberships_division on public.memberships(division_id)
  where division_id is not null;
-- ★★学科で 絞る 画面（★名簿・請求・行事）が 毎回 引きます

-- ★② ★レッスン（★1人 年 30〜40回 × 216人 ＝ 年 8,000行）
create index if not exists idx_lessons_place on public.lessons(place_id)
  where place_id is not null;
-- ★★場所の 重なり検出が 引きます

-- ★③ ★時間割（★1人 20コマ × 216人）
create index if not exists idx_my_timetable_period on public.my_timetable(period_id);
create index if not exists idx_my_periods_org on public.my_periods(org_id)
  where org_id is not null;
-- ★★日程を 組む 画面が ★毎回 引きます（★空きコマの 計算）

-- ★④ ★採点（★216人 × 審査員 5 × 項目 4 ＝ 4,300行）
create index if not exists idx_eval_scores_org on public.evaluation_scores(org_id);
create index if not exists idx_eval_scores_student on public.evaluation_scores(student_id);
create index if not exists idx_eval_scores_item on public.evaluation_scores(item_id);
-- ★★点の 一覧・書き出しが 引きます

-- ★⑤ ★お知らせ（★先生 × 生徒）
create index if not exists idx_org_messages_teacher on public.org_messages(teacher_id)
  where teacher_id is not null;

-- ★★付けなかった もの（★理由つき）:
--   ★created_by・marked_by・verified_by・attendance_by
--     ★★「誰が やったか」の 記録 ── ★画面が 引きません
--   ★covers_slot_id・kid_id・post_id
--     ★★行が 少ない（★公演 1本で 数十行）
--   ★★索引は ★書き込みを 遅くします。★読まない 列に 付けても 損 です

-- 確かめ（試しの環境で）
-- ★索引が できる
-- ★explain で ★Seq Scan → Index Scan に なる（★行が 多い とき）
-- ★★いまは 行が 少ないので ★変わらない かもしれません（★それで 正しい）

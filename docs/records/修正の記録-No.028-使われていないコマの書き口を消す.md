# 修正の記録 No.028 ── 使われて いない コマの 書き口を 消す

    日 2026-09-19
    出どころ 坂本さんの お決め D61（★裁定その99 の 実機くらべ の あと）

## 何を 消したか

    components/VocalTracker.jsx
      `async function handleCreateOrgLesson(orgId, teacherId, studentId, dateStr, timeStr, note)`
      21行（★覚え書き 11行 を ふくむ）

## なぜ 消したか

    ★呼び出しが **0件** でした（tools/schedule_empty_check.py・較正つき）。
      ★当たり `handlePlaceLesson` …… 1件
      ★外れ ありもしない 名 …… 0件

    ★いま コマを 置いて いるのは `handlePlaceLesson`（11703行）だけ です。
      ★「日程を 組む」の 画面 から 呼ばれます。

    ★★死んだ 書き口を 残すと、★いつか 間違って 拾われます。
      ★★拾われた 先で、★いまの 決め（★選んだ 先生の 分・`duration_minutes`）が
        ★抜けます。★2つの 書き口は、★同じ 表に ちがう 形を 入れます。

## 消して いない もの

    ★`lessons.note` の 列 …… 消して いません。
      ★1行に 字が 入って います（★2026-09-19 に 数えました）。
      ★`LESSON_COLUMNS`（lib/classroomShell.js:79）が いまも 読んで います。
      ★★書く 口は 無く なりました。★読む 道と 中身は そのまま です。
      ★★★人が 書いた ものを 消しません。

    ★`supabase/migration_drop_lessons_teacher_note.sql` …… 別の 列（`teacher_note`）の 話 です。
      ★この 消しとは 関わりません。

## 確かめ

    ★`handleCreateOrgLesson` の 残り …… 0件（★上の 注記の 1つ だけ）
    ★見張り 384通り（★失敗 15 は もとから）
    ★`npm run lint` 0 ／ `npm run build` 通りました

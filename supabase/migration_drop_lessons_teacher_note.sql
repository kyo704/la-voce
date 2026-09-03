-- ============================================================================
-- lessons.teacher_note を落とす（G-4・2026-09-03）
--
--   ★なぜ落とすのか（2つあります）
--
--   ① 書いているだけで、どこからも読んでいません
--      書く場所：components/VocalTracker.jsx:10249（1か所だけ）
--      読む場所：★ありません。l.teacher_note も lesson.teacher_note も
--                コードに1つも出てきません。
--      ★しかも、その書く関数（handleCreateOrgLesson）は
--        ★どこからも呼ばれていません。定義しかありません。
--      先生のメモの本体は★別にあります（teacher_notes 表・link_id と body）。
--        読み書き：VocalTracker.jsx:9674 / 9704
--      ★同じものが2か所にある、というこの repo でくり返してきた形です。
--
--   ② 「先生専用」と書いてありますが、★生徒に届きます
--      10242行のコメント：「teacherNoteは先生専用（生徒に表示しない）」
--      ですが RLS は★行単位です。列は隠せません。
--      生徒自身の照会が select("*") をしています。
--        VocalTracker.jsx:10260
--          supabase.from("lessons").select("*").eq("student_id", userId)
--      ★画面に出していないだけで、通信には乗ります。
--        ブラウザの通信タブを開けば読めます。
--      ★get_student_entries を作った理由と、まったく同じ形です。
--
--   ★中身があるなら、落とす前に移してください
--     この列は teacher_notes 表と別ものです。落とせば戻りません。
--     ①で数えます。★0でなければ、③へ進まないでください。
--
--   ★何度実行しても同じ結果になります。
--   ★記録（entries）には一切触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① ★まず数えます（これを報告してから、③へ進んでください）
-- ---------------------------------------------------------------------------
select count(*) as "レッスンの総数" from public.lessons;

select count(*) as "★teacher_note に中身がある行"
  from public.lessons
 where teacher_note is not null and btrim(teacher_note) <> '';

-- ★0 でなければ、ここで止めてください。
--   中身があるなら、先に teacher_notes 表へ移す相談が要ります。
--   （link_id と body の表です。org 経由のレッスンには link_id が無いので、
--     そのまま移せません。★移し先の設計から相談してください。）

-- ---------------------------------------------------------------------------
-- ② いまの姿を残す
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ③ 落とす
--
--   ★①が 0 だったときだけ実行してください。
--   ★コードの側を先に直してください
--     （components/VocalTracker.jsx:10249 から teacher_note を外す）。
--     順番を逆にすると、insert が「そんな列は無い」で失敗します。
--     ★lessons の作成が、その間だけ壊れます。
-- ---------------------------------------------------------------------------
alter table public.lessons drop column if exists teacher_note;

-- ---------------------------------------------------------------------------
-- ④ 確かめる
-- ---------------------------------------------------------------------------
select count(*) as "★teacher_note の列（0であること）"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
   and column_name = 'teacher_note';

select count(*) as "レッスンの総数（①と同じであること）" from public.lessons;

-- ★先生のメモの本体は、こちらに残っています。
select count(*) as "teacher_notes の行数（減っていないこと）" from public.teacher_notes;

-- ---------------------------------------------------------------------------
-- ⑤ ★同じ形が、ほかに残っていないか
--
--   「先生専用」と書いてあるのに、生徒の select("*") に乗る列。
--   ★lessons.note は、先生・生徒どちらも見る前提の列です（9709行のコメント）。
--     こちらは意図どおりなので、落としません。
-- ---------------------------------------------------------------------------
select column_name as "lessons に残る列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
 order by ordinal_position;

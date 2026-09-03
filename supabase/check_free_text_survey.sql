-- ============================================================================
-- 自由記述の欄に、どれくらい書かれているか（B-3 の下ごしらえ・2026-09-03）
--
--   ★中身は1文字も出しません。
--     出すのは「何行に入っているか」と「何文字か」だけです。
--     ★最大の文字数までは出しますが、その文そのものは出しません。
--     プライバシーポリシーを書くのに要るのは、そこまでです。
--
--   ★何のために要るのか
--     「体調の記録には、自由に書ける欄があります」と書くとき、
--     ★それが飾りの文なのか、実際に使われている欄なのかで、
--     読む人の受け取り方が変わります。
--     ★空の欄まで「病名が書かれうる」と書くのは、正確ではありません。
--
--   ★あわせて確かめること
--     entries.throat_symptoms_other は、★書く画面がありません
--     （components/VocalTracker.jsx に入力欄が1つもなく、
--       状態の初期値と行↔記録の変換にしか出てきません）。
--     ★昔の版のデータが残っているかを、ここで確かめます。
--     0 なら、列を落とせます（teacher_note と同じ手順で）。
--
--   ★何も書き換えません。select だけです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① entries の自由記述（★これが本体です）
--
--   「入っている行」＝ null でなく、空白だけでもない行。
--   ★空文字と空白だけの行を「書かれている」に数えません。
--     数えると、実際より使われているように見えます。
-- ---------------------------------------------------------------------------
with e as (select * from public.entries)
select 欄, 入っている行, 全体,
       round(100.0 * 入っている行 / nullif(全体, 0), 1) as "割合(%)",
       最短, 中央値, 最長
  from (
    select '① notes（その日のメモ）' as 欄,
           count(*) filter (where btrim(coalesce(notes,'')) <> '') as 入っている行,
           count(*) as 全体,
           min(length(notes)) filter (where btrim(coalesce(notes,'')) <> '') as 最短,
           percentile_cont(0.5) within group (order by length(notes))
             filter (where btrim(coalesce(notes,'')) <> '') as 中央値,
           max(length(notes)) filter (where btrim(coalesce(notes,'')) <> '') as 最長
      from e
    union all
    select '② meal_notes（食事メモ）',
           count(*) filter (where btrim(coalesce(meal_notes,'')) <> ''), count(*),
           min(length(meal_notes)) filter (where btrim(coalesce(meal_notes,'')) <> ''),
           percentile_cont(0.5) within group (order by length(meal_notes))
             filter (where btrim(coalesce(meal_notes,'')) <> ''),
           max(length(meal_notes)) filter (where btrim(coalesce(meal_notes,'')) <> '')
      from e
    union all
    select '③ voice_memo（声のメモ）',
           count(*) filter (where btrim(coalesce(voice_memo,'')) <> ''), count(*),
           min(length(voice_memo)) filter (where btrim(coalesce(voice_memo,'')) <> ''),
           percentile_cont(0.5) within group (order by length(voice_memo))
             filter (where btrim(coalesce(voice_memo,'')) <> ''),
           max(length(voice_memo)) filter (where btrim(coalesce(voice_memo,'')) <> '')
      from e
    union all
    select '④ wake_note（起きたときのメモ）',
           count(*) filter (where btrim(coalesce(wake_note,'')) <> ''), count(*),
           min(length(wake_note)) filter (where btrim(coalesce(wake_note,'')) <> ''),
           percentile_cont(0.5) within group (order by length(wake_note))
             filter (where btrim(coalesce(wake_note,'')) <> ''),
           max(length(wake_note)) filter (where btrim(coalesce(wake_note,'')) <> '')
      from e
    union all
    select '⑤ routine_note（習慣のメモ）',
           count(*) filter (where btrim(coalesce(routine_note,'')) <> ''), count(*),
           min(length(routine_note)) filter (where btrim(coalesce(routine_note,'')) <> ''),
           percentile_cont(0.5) within group (order by length(routine_note))
             filter (where btrim(coalesce(routine_note,'')) <> ''),
           max(length(routine_note)) filter (where btrim(coalesce(routine_note,'')) <> '')
      from e
    union all
    select '⑥ mental_reason（心の状態の理由）',
           count(*) filter (where btrim(coalesce(mental_reason,'')) <> ''), count(*),
           min(length(mental_reason)) filter (where btrim(coalesce(mental_reason,'')) <> ''),
           percentile_cont(0.5) within group (order by length(mental_reason))
             filter (where btrim(coalesce(mental_reason,'')) <> ''),
           max(length(mental_reason)) filter (where btrim(coalesce(mental_reason,'')) <> '')
      from e
    union all
    -- ★これが、いちばん大事な1行です。
    select '⑦ throat_symptoms_other（★書く画面がありません）',
           count(*) filter (where btrim(coalesce(throat_symptoms_other,'')) <> ''), count(*),
           min(length(throat_symptoms_other)) filter (where btrim(coalesce(throat_symptoms_other,'')) <> ''),
           percentile_cont(0.5) within group (order by length(throat_symptoms_other))
             filter (where btrim(coalesce(throat_symptoms_other,'')) <> ''),
           max(length(throat_symptoms_other)) filter (where btrim(coalesce(throat_symptoms_other,'')) <> '')
      from e
    union all
    select '⑧ location（場所）',
           count(*) filter (where btrim(coalesce(location,'')) <> ''), count(*),
           min(length(location)) filter (where btrim(coalesce(location,'')) <> ''),
           percentile_cont(0.5) within group (order by length(location))
             filter (where btrim(coalesce(location,'')) <> ''),
           max(length(location)) filter (where btrim(coalesce(location,'')) <> '')
      from e
    union all
    select '⑨ repertoire（曲名）',
           count(*) filter (where btrim(coalesce(repertoire,'')) <> ''), count(*),
           min(length(repertoire)) filter (where btrim(coalesce(repertoire,'')) <> ''),
           percentile_cont(0.5) within group (order by length(repertoire))
             filter (where btrim(coalesce(repertoire,'')) <> ''),
           max(length(repertoire)) filter (where btrim(coalesce(repertoire,'')) <> '')
      from e
  ) t
 order by 欄;

-- ---------------------------------------------------------------------------
-- ② ★⑦だけを、はっきり出します（列を落としてよいかの判断に使います）
--
--   ★0 なら、teacher_note と同じ手順で落とせます。
--   ★0 でなければ、落としません。まず「本人が取り出せるか」
--     「退会で消えるか」を確かめる話になります。
-- ---------------------------------------------------------------------------
select count(*) as "★throat_symptoms_other に中身がある行（0なら落とせます）"
  from public.entries
 where btrim(coalesce(throat_symptoms_other, '')) <> '';

-- ---------------------------------------------------------------------------
-- ③ JSON の中の自由記述（activity_detail / load_detail / type_fields）
--
--   ★中身は出しません。「入っている行」と「文字にしたときの長さ」だけです。
--   ★入れ子の自由記述は、この文字数の中に含まれます。
-- ---------------------------------------------------------------------------
select 欄, 入っている行, 最長
  from (
    select 'activity_detail' as 欄,
           count(*) filter (where activity_detail is not null
                              and activity_detail::text not in ('null','{}','[]')) as 入っている行,
           max(length(activity_detail::text)) as 最長 from public.entries
    union all
    select 'load_detail',
           count(*) filter (where load_detail is not null
                              and load_detail::text not in ('null','{}','[]')),
           max(length(load_detail::text)) from public.entries
    union all
    select 'type_fields',
           count(*) filter (where type_fields is not null
                              and type_fields::text not in ('null','{}','[]')),
           max(length(type_fields::text)) from public.entries
  ) t order by 欄;

-- ---------------------------------------------------------------------------
-- ④ profiles の自由記述
--
--   ★health_notes は入力欄が生きています。落とす話ではありません。
--     補助の文（「持病は上の一覧から選んでください」）を足したので、
--     ★これから病名がどれくらい減るかを見るための、いまの値です。
--   ★occupation には実際のお答えが入っています。触りません。
-- ---------------------------------------------------------------------------
select 欄, 入っている行, 全体, 最長
  from (
    select 'health_notes' as 欄,
           count(*) filter (where btrim(coalesce(health_notes,'')) <> '') as 入っている行,
           count(*) as 全体,
           max(length(health_notes)) as 最長 from public.profiles
    union all
    select 'occupation（★触らない）',
           count(*) filter (where btrim(coalesce(occupation,'')) <> ''), count(*),
           max(length(occupation)) from public.profiles
    union all
    select 'technical_goal',
           count(*) filter (where btrim(coalesce(technical_goal,'')) <> ''), count(*),
           max(length(technical_goal)) from public.profiles
    union all
    select 'practice_goal',
           count(*) filter (where btrim(coalesce(practice_goal,'')) <> ''), count(*),
           max(length(practice_goal)) from public.profiles
    union all
    select 'school',
           count(*) filter (where btrim(coalesce(school,'')) <> ''), count(*),
           max(length(school)) from public.profiles
  ) t order by 欄;

-- ---------------------------------------------------------------------------
-- ⑤ ほかの表の自由記述
--
--   ★conditions（既往症）は選択肢なので、ここには出しません。
--     ★自由記述ではないことに意味があります。あとから1つだけ外せます。
-- ---------------------------------------------------------------------------
select 'lessons.note' as 欄,
       count(*) filter (where btrim(coalesce(note,'')) <> '') as 入っている行,
       count(*) as 全体, max(length(note)) as 最長 from public.lessons
union all
select 'teacher_notes.body',
       count(*) filter (where btrim(coalesce(body,'')) <> ''), count(*),
       max(length(body)) from public.teacher_notes
union all
select 'feedback.message',
       count(*) filter (where btrim(coalesce(message,'')) <> ''), count(*),
       max(length(message)) from public.feedback
union all
select 'article_notes.body',
       count(*) filter (where btrim(coalesce(body,'')) <> ''), count(*),
       max(length(body)) from public.article_notes;

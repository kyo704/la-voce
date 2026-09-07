-- 食事の印8つ（2026年9月7日）
--
--   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜・Fableの査読を経て）.md §5-1
--
--   ★★自由記述から、8つの印（脂／甘／辛／柑橘／チョコ／コーヒー／炭酸／酒）を
--     ★言葉の表で立てます。★AI は使いません。★外へ何も送りません。
--
--   ★★いまある dinner_tags は、★1文字も触りません。
--     ★すでにお客さまの記録が入っています。
--     ★読むときに重ねるだけです（lib/mealMarks.js の resolveMealMarks）。
--
--   ★★null のままにしておく意味があります。
--     ★null … まだ本人が直していない（★自由記述から立て直します）
--     ★空の配列 … 本人が「印は無い」と決めた
--     ★★この2つは、★別のことです。★埋めないでください。
--
--   ★BEGIN / ROLLBACK は使っていません（2026-09-05 の事故のため）。
--   ★何度流しても、同じ結果になります。

-- ===========================================================================
-- ① 列を足します
-- ===========================================================================
alter table public.entries
  add column if not exists meal_marks text[];

comment on column public.entries.meal_marks is
  '食事の印8つ（fat/sweet/spicy/citrus/choco/coffee/soda/alcohol）。null は「本人がまだ直していない」。空配列は「印は無い、と本人が決めた」。正は lib/mealMarks.js。';

-- ===========================================================================
-- ② 確かめます（★読むだけ）
-- ===========================================================================
select column_name as 列, data_type as 型, is_nullable as 空を許すか
from information_schema.columns
where table_schema = 'public' and table_name = 'entries'
  and column_name in ('meal_marks', 'dinner_tags', 'meal_notes')
order by column_name;

-- ★3行とも出れば、成功です。
--   meal_marks   ARRAY  YES
--   dinner_tags  ARRAY  YES
--   meal_notes   text   YES

-- ===========================================================================
-- ③ 埋まっている数（★読むだけ・★流したあとは 0 のはずです）
-- ===========================================================================
select
  count(*) filter (where meal_marks is null)        as まだ直していない日,
  count(*) filter (where meal_marks = '{}')         as 印は無いと決めた日,
  count(*) filter (where array_length(meal_marks, 1) > 0) as 印のある日
from public.entries;

-- ★★ここで「まだ直していない日」が全部なら、正しい状態です。
--   ★いっせいに埋めません。★書いた文から、読むときに立て直します。

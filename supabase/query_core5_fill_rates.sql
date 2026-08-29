-- ============================================================================
-- 中核5項目が、実際どれだけ埋まっているか（読み取りだけ・書き込みなし）
--
--   出典 設計憲章 §3-1（中核5項目）／ lib/analysisFamilies.js の CORE_FAMILY
--
--   ★このファイルは調べるだけです。alter も update も入っていません。
--     そのまま貼って実行して構いません。
--
--   ★なぜ要るか（2026-08-30 の調査）
--     中核5項目のうち、かんたん記録で集まるのは①睡眠時間だけでした。
--     ⑤起きたときのむくみは、★アプリのどこにも入力欄がありません
--     （coreFactorValues が常に null を返します）。
--     どれが実際に貯まっていて、どれが遅れているのかを、数で見ます。
--
--   ★③絶対湿度は、気温と相対湿度の★両方が揃った日にしか計算できません。
--     片方だけの日は使えないので、別に数えます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 中核5項目の充足率（全ユーザー合計）
--    ★人ではなく「記録のある日」を母数にしています。
-- ---------------------------------------------------------------------------
with base as (
  select * from public.entries
)
select
  count(*)                                                        as "記録のある日（合計）",

  count(sleep_hours)                                              as "① 睡眠時間",
  round(100.0 * count(sleep_hours) / nullif(count(*), 0), 1)      as "① %",

  count(non_performance_speech_minutes)                           as "② 本番外の発話時間",
  round(100.0 * count(non_performance_speech_minutes) / nullif(count(*), 0), 1) as "② %",

  -- ★③は両方が揃って初めて計算できます
  count(*) filter (where temperature is not null and humidity is not null)      as "③ 絶対湿度（気温と湿度が両方）",
  round(100.0 * count(*) filter (where temperature is not null and humidity is not null)
        / nullif(count(*), 0), 1)                                 as "③ %",

  -- ④は「前日が本番・レッスンか」。前日の行があるかどうかも効くので、
  --   ここでは「その日が本番・レッスンだったか」を数えます（材料の有無）。
  count(*) filter (where activity_type in ('本番', 'レッスン'))   as "④ 材料（本番・レッスンの日）",

  -- ⑤は入力欄がないので、必ず0です。★0であることの確認です。
  0                                                               as "⑤ むくみ（入力欄が無い）"
from base;

-- ---------------------------------------------------------------------------
-- ② ③絶対湿度の内訳（★どちらが欠けているのか）
-- ---------------------------------------------------------------------------
select
  count(*)                                                                     as "記録のある日",
  count(*) filter (where temperature is not null and humidity is not null)     as "両方ある（＝計算できる）",
  count(*) filter (where temperature is not null and humidity is null)         as "気温だけ",
  count(*) filter (where temperature is null and humidity is not null)         as "湿度だけ",
  count(*) filter (where temperature is null and humidity is null)             as "どちらも無い"
from public.entries;

-- ---------------------------------------------------------------------------
-- ③ 人ごとの内訳（★中核の検定は「各群10日以上」なので、
--    合計ではなく1人あたりの日数が効きます）
-- ---------------------------------------------------------------------------
select
  e.user_id                                                                    as "利用者",
  count(*)                                                                     as "記録日数",
  count(e.sleep_hours)                                                         as "① 睡眠",
  count(e.non_performance_speech_minutes)                                      as "② 発話時間",
  count(*) filter (where e.temperature is not null and e.humidity is not null)  as "③ 湿度の材料",
  count(*) filter (where e.activity_type in ('本番', 'レッスン'))               as "④ 本番・レッスン",
  -- ★2群に分けて各群10日、が必要です。①は中央値で二分するので、
  --   目安として「①が20日以上あるか」を見ます。
  case when count(e.sleep_hours) >= 20 then 'たぶん判定できる' else '★まだ足りない' end
                                                                               as "①の見込み"
from public.entries e
group by e.user_id
order by 2 desc;

-- ---------------------------------------------------------------------------
-- ④ 参考：声の記録そのものの埋まり方
--    ★中核の比較は「声のスコア」を結果側に使うので、こちらも要ります。
-- ---------------------------------------------------------------------------
select
  count(*)                    as "記録のある日",
  count(throat_condition)     as "喉の状態",
  count(resonance_score)      as "声の調子（0〜10）",
  count(voice_quality)        as "声の調子（5段階）",
  count(ease)                 as "心の余裕",
  count(sleep_quality)        as "睡眠の質"
from public.entries;

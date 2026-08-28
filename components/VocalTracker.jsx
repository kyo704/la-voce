"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Mic2, Moon, Droplets, Thermometer, Wind, MapPin, Music2, HeartHandshake,
  NotebookPen, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Trash2,
  Loader2, Check, Plus, Minus, Sparkles, Utensils, LogOut, CreditCard, Bot, MessageCircle, Home,
  Wheat, Egg, Droplet, Leaf, Dumbbell, Ruler, Scale, BookOpen, X, Sunrise, Sun, Sunset, Globe, Lock,
  Volume2, Plane, AudioWaveform, Timer, MessageSquare, ClipboardList, GraduationCap, FileText, MoreHorizontal, HelpCircle,
  User, HeartPulse
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine, ReferenceArea, LineChart, Line, ComposedChart, Area
} from "recharts";
import { createClient } from "@/lib/supabase/client";
// ★通信は必ず時間制限を付ける。返ってこないまま待ち続けると、画面が止まる。
import { withTimeout, QUERY_TIMEOUT_MS, AUTH_TIMEOUT_MS } from "@/lib/withTimeout";
import { C, LEVEL_COLORS, LEVEL_DYNAMICS, LEVEL_DYNAMIC_DESC, CYCLE_BAND, SERIES } from "@/lib/tokens";
import { FOOD_PRESETS, DISH_GROUP_ALIASES, CATEGORY_SEARCH_ALIASES } from "@/lib/foodPresets";
import { SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES, SHOP_ITEMS, PLACEMENT_LIMITS, computeBalance } from "@/lib/character";
import { LANGUAGES, createTranslator } from "@/lib/translations";
// 周期の記録（周期記録の設計.md §3）。★日数はすべてここで導出する。保存しない。
import {
  currentCycleState, cycleSummary, buildBleedingDayset,
  validateNewStart, validateEnd, MIN_CYCLES_FOR_AVERAGE,
  cycleDayForDate, isCycleStartDate,
  cycleTrackingOn, cycleShowsOnHome, cycleFeatureApplies,
  sortPeriods,
  addDaysISO,
  diffDays} from "@/lib/cyclePeriods";
// 統合実行ルートv4 §6: 表示ゲートは必ずこのレイヤーを経由する。画面ごとに条件を書かないこと。
import { evaluateGate, gateAllows, getGate, NARRATIVE_FDR_Q, NARRATIVE_MIN_N_PER_GROUP } from "@/lib/displayGates";
import { SCALES, DEFAULT_SCALE, SCALE_LABELS, SCALE_SAMPLE, normalizeScale,
  scaleAttribute, isSimpleDisplay, UNDO_WINDOW_MS, ACTIONABLE_ERROR_KEY,
  INSTALL_STEPS, INSTALL_LATER_NOTE, INSTALL_LATER_LABEL, shouldShowInstallGuide } from "@/lib/displayPrefs";
import { SIMPLE_STEPS, SIMPLE_STEP_COUNT, remainingSteps, applyStep, skipStep,
  nextIndex, prevIndex, isFinished, SIMPLE_SKIP_LABEL, SIMPLE_BACK_LABEL, SIMPLE_DONE_TEXT } from "@/lib/simpleFlow";
import { familyOf, mayStateFinding, EXPLORE, EXPLORE_NOTE,
  buildCoreGroups, groupLabelsFor, CORE_LABELS, availableCoreFactors,
  buildCycleGroups, cycleGroupLabels, CYCLE_LABEL, CYCLE_FACTOR } from "@/lib/analysisFamilies";
// 分析カードの職業別の出し分け（docs/profession-presets.json と1対1）
import { isAnalysisCardVisible } from "@/lib/analysisCardVisibility";
// 「この分析を強くする」の選び方（記録と分析の順番設計.md §5.3 の R1〜R6）。
// ★規則は画面に書かず、必ずこのモジュールを通すこと。
import {
  selectBoostCandidates, describeUnlockCondition, IMPROVEMENT, MAX_BOOST_CARDS
} from "@/lib/analysisBoost";
// 記録項目の表示・非表示は必ずこのレイヤーを通す（記録項目の再設計v2 §3.3）
import { isFieldGroupVisible, DEFAULT_RECORD_MODE } from "@/lib/fieldGroups";
// 機能フラグ（G2-14）。判定はこのモジュールだけが持つ。
import { canSeeBetaFeatures, canSeeTeacherFeatures, canSeeLineLink, canSeeStudentTeacherLink,
  canSeeShobaiArticles, isShobaiArticle } from "@/lib/featureFlags";
// 削除の猶予期間（A-4）。日数の計算はサーバーと同じものを使う。
import { graceDaysLeft, GRACE_PERIOD_DAYS } from "@/lib/accountDeletion";
// データの書き出し（G3-16）。★含める項目を減らさないこと。
// 書き出しに添える「記録の控え」。★解釈を1つも書かない。文言と禁止語はこの1か所。
// 発声量（G2-10.5）。★種別の重みと、実測／推定の区別はこの1か所が持つ。
import {
  VOCAL_SESSION_KINDS, dayVocalDose, weeklyVocalDose, activityMinutes,
  elapsedMinutes, reviewSession, SESSION_MAX_MINUTES
} from "@/lib/vocalDose";
// 行動ログ。★健康の値を props に入れない歯止めは、このモジュールが持つ。
import { trackEvent } from "@/lib/events";
import { buildExportSummary } from "@/lib/exportSummary";
import { EXPORTED_TABLES, EXPORTED_PROFILE_COLUMNS, entriesToCsv, buildExportPayload, sanitizeShareHistory } from "@/lib/exportData";
import HealthInfo from "@/components/HealthInfo";
import { ARTICLES, CHAPTER_LABELS, PROFESSION_LABELS, getArticlesForProfession, getArticleById } from "@/lib/learnContent";
// 学ぶ画面の勉強の仕組み（§2・§3）。★規則はこのモジュールが持つ。
import {
  KEY_SENTENCE_HEADING, REFLECTION_PRIVACY_NOTE, PREQUESTION_NOTE,
  shouldShowKeySentence, studyReadiness,
  answerPrequestion, answerQuizQuestion, quizModeOf,
  buildReviewSet, afterReviewAnswer, shouldPromptReview, REVIEW_BOXES,
  REFLECT_NOTE, REFLECT_NOTE_KIND, REFLECT_REVISIT_HEADING, REFLECT_REVISIT_ACTION,
  reflectAnchor, reflectNotesFor, hasEarlierReflectAnswer
} from "@/lib/learnStudy";
import CharacterHome from "@/components/CharacterHome";

/* ---------- constants ---------- */
const SYMPTOM_OPTIONS = ["乾燥", "嗄れ", "痛み", "違和感", "鼻づまり", "咳", "裏返り", "喉の張り感"];
const SYMPTOM_KEYS = { "乾燥": "symptomDry", "嗄れ": "symptomHoarse", "痛み": "symptomPain", "違和感": "symptomDiscomfort", "鼻づまり": "symptomStuffyNose", "咳": "symptomCough", "裏返り": "symptomBreak", "喉の張り感": "symptomTightness" };
const DINNER_TAGS = ["揚げ物", "あっさり", "炭酸", "トマト系", "カフェイン", "アルコール"];
const DINNER_TAG_KEYS = { "揚げ物": "dinnerFried", "あっさり": "dinnerLight", "炭酸": "dinnerCarbonated", "トマト系": "dinnerTomato", "カフェイン": "dinnerCaffeine", "アルコール": "dinnerAlcohol" };
// lavoce-収集データ拡張案.md C-2: 服薬タグ。DINNER_TAGSと同じ複数選択タグの形式。
const MEDICATION_OPTIONS = ["抗ヒスタミン薬", "吸入ステロイド", "経口避妊薬", "NSAIDs", "利尿薬"];

// lavoce-収集データ拡張案.md B節: 標準化された質問票（週1・月1でよいもの）。
// 重要な注意: ここに書いた項目文は、公表されている各尺度の構成（項目数・因子・尺度幅・
// カットオフ値）にもとづいて作成した簡易版であり、原論文（英語）の項目文を一字一句
// 翻訳・再現したものではありません。そのため、算出される点数を論文の基準値と厳密に
// 比較できることは保証できません。あくまで自分自身の推移を追うためのスクリーニング
// 参考ツールとして使うことを想定しています。
const QUESTIONNAIRES = {
  rsi: {
    key: "rsi",
    name: "RSI（逆流症状インデックス）",
    fullName: "Reflux Symptom Index",
    citation: "Belafsky et al., 2002",
    frequency: "月1回の記録を推奨",
    scaleMax: 5,
    scaleLabels: ["問題なし", "軽度", "やや軽度", "中程度", "やや重度", "重度の問題"],
    cutoff: 13,
    cutoffNote: "13点を超えると、喉頭咽頭逆流症（LPR）の疑いの目安とされています。",
    items: [
      "声のかすれ、または声の問題",
      "咳払いをする",
      "喉に痰がからむ、または鼻水がのどに落ちる感じがする",
      "食べ物・飲み物・錠剤の飲み込みにくさ",
      "食後や横になった後の咳",
      "呼吸のしづらさ、息が詰まる感じ",
      "厄介な、または気になる咳",
      "喉に何かがくっついている感じ、喉のつかえ感",
      "胸焼け、胸の痛み、消化不良、酸っぱいものが上がってくる感じ"
    ],
    factors: null
  },
  vfi: {
    key: "vfi",
    name: "VFI（声の疲労インデックス）",
    fullName: "Vocal Fatigue Index",
    citation: "Nanjundeswaran et al., 2015",
    frequency: "週1回の記録を推奨",
    scaleMax: 4,
    scaleLabels: ["まったくない", "ほとんどない", "時々", "たいてい", "常に"],
    cutoff: null,
    cutoffNote: "総合点よりも、3つの因子（疲労・回避／身体的な不快感／休息による回復）ごとの傾向を見る尺度です。",
    items: [
      "声を使った後、話す気になれない",
      "たくさん話すと声が疲れる",
      "話すのに、より努力が必要だと感じる",
      "声を出すのに以前より努力が必要になったと感じる",
      "声を使うのが仕事のように感じる",
      "声を使った後は、あまり話さないようにしている",
      "たくさん話す必要があるとき、人との集まりを避ける",
      "仕事の後、家族と話す気になれない",
      "声を使った後、声を出すのに努力がいる",
      "声を使うと、声を通す（響かせる）のが難しく感じる",
      "声を使った後、声が弱く感じる",
      "話すと喉が痛くなる",
      "話すと喉に違和感がある",
      "話した後、喉に痛みを感じる",
      "話すと喉が乾いた感じがする",
      "話すと首や喉のあたりが張る感じがする",
      "声を少し休ませると、声を出す努力が減る",
      "一晩眠ると、声の調子が良くなる",
      "声を使うのをしばらく控えると、症状が良くなる"
    ],
    factors: [
      { name: "疲労・回避", start: 0, end: 10 },
      { name: "身体的な不快感", start: 11, end: 15 },
      { name: "休息による回復", start: 16, end: 18 }
    ]
  },
  svhi10: {
    key: "svhi10",
    name: "SVHI-10（歌声支障インデックス）",
    fullName: "Singing Voice Handicap Index-10",
    citation: "Cohen et al., 2009",
    frequency: "月1回の記録を推奨",
    scaleMax: 4,
    scaleLabels: ["まったくない", "ほとんどない", "時々", "たいてい", "常に"],
    cutoff: 20,
    cutoffNote: "20点以上で、歌声への支障が大きくなっている可能性の目安とされています。",
    items: [
      "自分の歌声のせいで、人前で歌う機会を避けている",
      "自分の歌声のせいで、収入や仕事に影響が出ている",
      "声域が以前より狭くなったと感じる",
      "歌っている途中で声が出なくなることがある",
      "歌った後、声が疲れていると感じる",
      "自分の歌声の調子が予測できないと感じる",
      "自分の歌声のことで落ち込んだり不安になったりする",
      "他の人が自分の歌声の変化に気づいていると感じる",
      "練習や本番の前に、自分の声がどうなるか心配になる",
      "歌声のせいで、音楽活動そのものを楽しめなくなっている"
    ],
    factors: null
  },
  ease: {
    key: "ease",
    name: "EASE（歌いやすさ評価）",
    fullName: "Evaluation of the Ability to Sing Easily",
    citation: "Phyland et al., 2013",
    frequency: "本番・リハ直後の記録を推奨",
    scaleMax: 3,
    scaleLabels: ["なし", "軽度", "中程度", "強度"],
    cutoff: 12.5,
    cutoffNote: "12.5点を超えると、歌声機能の低下が疑われる目安とされています。",
    items: [
      "声がかすれている",
      "声が乾いた・こすれた感じがする",
      "喉の筋肉が疲れている感じがする",
      "声が出るまでに時間がかかる、または息漏れがある",
      "声に張りがない感じがする",
      "声が疲れている",
      "高音を出すのが難しい",
      "音域を変える（チェンジ）のが難しい",
      "歌うことが大変な作業に感じる",
      "自分の歌声が本番に向けて準備できている感じがしない",
      "声が裏返る、または割れる",
      "息が漏れている感じがする",
      "長いフレーズで息が続きにくい",
      "高音で息が漏れる",
      "一部の音で声が途切れる",
      "小さい声で歌うのが難しい",
      "音を長く伸ばすのが難しい",
      "声を通す（響かせる）のが難しい",
      "自分の声のことが心配だ",
      "自分の声のことが気になる"
    ],
    factors: [
      { name: "声の疲労（VF）", start: 0, end: 9 },
      { name: "病的リスク指標（PRI）", start: 10, end: 17 },
      { name: "声への不安（VC）", start: 18, end: 19 }
    ]
  }
};
function computeQuestionnaireScore(type, itemScores) {
  const def = QUESTIONNAIRES[type];
  if (!def) return null;
  const total = itemScores.reduce((a, b) => a + (Number(b) || 0), 0);
  const factorScores = def.factors
    ? def.factors.map((f) => ({
        name: f.name,
        score: itemScores.slice(f.start, f.end + 1).reduce((a, b) => a + (Number(b) || 0), 0)
      }))
    : null;
  return { total, factorScores };
}
// メンタルの大まかな枠（タップで選べる簡易入力）。自由記述の代わりではなく、併用できる選択肢として用意する。
// 「心の余裕」の数値（1〜5）に応じて、表示する語群を切り替える。
// low（1〜2・緊張寄り）／mid（3・ふつう）／high（4〜5・落ち着き寄り）の3段階。
// 舞台・本番に限らず、悲しい／怒り／嬉しいといった一般的な感情語も含める。
const MENTAL_TAG_GROUPS = {
  low: ["本番前の緊張", "疲労・過労", "睡眠不足", "体調不良", "準備不足への不安", "評価・期待のプレッシャー", "悲しい", "怒り・イライラ", "不安", "人間関係の悩み"],
  mid: ["環境の変化", "私生活のこと", "少し疲れ気味", "ぼんやり・無気力", "特に大きな変化なし", "集中できている", "落ち着いている"],
  high: ["良い睡眠が取れた", "練習・準備が順調", "嬉しい・楽しい", "達成感", "人との良い時間", "リラックスできている", "体調が良い", "特に理由なし・良い状態"]
};
// ease（1〜5）から、表示する語群を判定する
function mentalTagGroupForEase(ease) {
  const e = Number(ease) || 3;
  if (e <= 2) return "low";
  if (e >= 4) return "high";
  return "mid";
}
const MENTAL_TAG_KEYS = {
  "本番前の緊張": "mentalTagPrePerformance",
  "疲労・過労": "mentalTagFatigue",
  "睡眠不足": "mentalTagSleepLack",
  "体調不良": "mentalTagPhysicalUnwell",
  "準備不足への不安": "mentalTagUnderprepared",
  "評価・期待のプレッシャー": "mentalTagPressure",
  "悲しい": "mentalTagSad",
  "怒り・イライラ": "mentalTagAngry",
  "不安": "mentalTagAnxious",
  "人間関係の悩み": "mentalTagRelationshipTrouble",
  "環境の変化": "mentalTagEnvironmentChange",
  "私生活のこと": "mentalTagPersonalLife",
  "少し疲れ気味": "mentalTagSlightlyTired",
  "ぼんやり・無気力": "mentalTagLowMotivation",
  "特に大きな変化なし": "mentalTagNoParticularChange",
  "集中できている": "mentalTagFocused",
  "落ち着いている": "mentalTagSettled",
  "良い睡眠が取れた": "mentalTagGoodSleep",
  "練習・準備が順調": "mentalTagPracticeGoingWell",
  "嬉しい・楽しい": "mentalTagHappy",
  "達成感": "mentalTagAccomplishment",
  "人との良い時間": "mentalTagGoodTimeWithPeople",
  "リラックスできている": "mentalTagRelaxed",
  "体調が良い": "mentalTagFeelingWell",
  "特に理由なし・良い状態": "mentalTagGoodState"
};

// ============================================================
// 【保留中のタスク】日別テンプレート（記録項目の再設計v2.md §4.4）
//   状態：保留
//   理由：本来は活動ブロックの複数化（実行順マスター Stage 5-2）に依存する
//        （曲目複数化パッチ §2.0.1で、テンプレートは「1つ目の活動ブロックの
//        種別を選ぶショートカット」に降格したため）
//   【このアプリでの現状】上記の依存は既に解消済み。activities[]は本セッション
//   序盤の曲目複数化パッチで既に複数化されている（下のACTIVITY_OPTIONS・
//   newActivityBlock参照）。そのため着手自体は可能な状態にあるが、
//   Stage4-2スコープ調整パッチの確定スコープにより今回は見送っている。
//   再開：職業別の項目分岐（収録種別・叫びテイク数・番組名・セットリスト等、
//        職業別設計.md）と合わせて実装するのが自然。
// ============================================================
const ACTIVITY_OPTIONS = [
  { key: "休養", icon: Moon, labelKey: "activityRest" },
  { key: "自主練習", icon: Music2, labelKey: "activitySelfPractice" },
  { key: "レッスン", icon: NotebookPen, labelKey: "activityLesson" },
  { key: "リハーサル", icon: Mic2, labelKey: "activityRehearsal" },
  { key: "本番", icon: Sparkles, labelKey: "activityPerformance" }
];

const VOICE_TYPES = ["ソプラノ", "メゾソプラノ", "アルト", "カウンターテナー", "テノール", "バリトン", "バス", "その他"];
const VOICE_TYPE_KEYS = { "ソプラノ": "voiceSoprano", "メゾソプラノ": "voiceMezzo", "アルト": "voiceAlto", "カウンターテナー": "voiceCountertenor", "テノール": "voiceTenor", "バリトン": "voiceBaritone", "バス": "voiceBass", "その他": "optionOther" };
const MEAL_SLOTS = ["朝食", "昼食", "夕食", "間食"];
const MEAL_SLOT_KEYS = { "朝食": "mealBreakfast", "昼食": "mealLunch", "夕食": "mealDinner", "間食": "mealSnack" };
const QUICK_ADD_FOODS = ["白米（ご飯）", "味噌汁", "卵（全卵）", "納豆", "鮭（焼き）", "豆腐（木綿）", "ヨーグルト（無糖）", "鶏むね肉（皮なし）"];
const EXERCISE_TYPES = ["有酸素運動", "筋力トレーニング", "ストレッチ", "ウォーキング", "ヨガ", "その他"];
const EXERCISE_TYPE_KEYS = { "有酸素運動": "exerciseCardio", "筋力トレーニング": "exerciseStrength", "ストレッチ": "exerciseStretch", "ウォーキング": "exerciseWalk", "ヨガ": "exerciseYoga", "その他": "optionOther" };
const VOICE_TIME_SLOTS = [
  { key: "朝", icon: Sunrise, labelKey: "timeMorning" },
  { key: "昼", icon: Sun, labelKey: "timeNoon" },
  { key: "晩", icon: Sunset, labelKey: "timeEvening" }
];
const WEATHER_OPTIONS = ["晴れ", "曇り", "雨", "雪", "その他"];
const WEATHER_KEYS = { "晴れ": "weatherSunny", "曇り": "weatherCloudy", "雨": "weatherRainy", "雪": "weatherSnowy", "その他": "optionOther" };
const NUTRITION_PHASES = ["維持", "増量", "減量"];
const NUTRITION_PHASE_KEYS = { "維持": "phaseMaintain", "増量": "phaseBulk", "減量": "phaseCut" };
const REST_METHODS = ["睡眠・休息", "入浴", "マッサージ", "読書", "散歩", "瞑想", "趣味の時間", "その他"];
const REST_METHOD_KEYS = { "睡眠・休息": "restSleep", "入浴": "restBath", "マッサージ": "restMassage", "読書": "restReading", "散歩": "restWalk", "瞑想": "restMeditate", "趣味の時間": "restHobby", "その他": "optionOther" };
const AI_ADVICE_ENABLED = false; // 準備中。有効にする場合は true にしてください（ANTHROPIC_API_KEYの設定も必要です）
const CARING_MESSAGE_KEYS = [
  "caringMsg1", "caringMsg2", "caringMsg3", "caringMsg4", "caringMsg5",
  "caringMsg6", "caringMsg7", "caringMsg8", "caringMsg9", "caringMsg10"
];

const FACTORS = [
  { key: "sleepHours", labelKey: "labelSleepHours", unitKey: "unitHours" },
  { key: "sleepQuality", labelKey: "labelSleepQuality", unit: "" },
  { key: "waterIntake", labelKey: "labelWaterBySlot", unit: "ml" },
  { key: "temperature", labelKey: "labelTemperature", unit: "℃" },
  { key: "humidity", labelKey: "labelHumidity", unit: "%" },
  { key: "ease", labelKey: "labelMentalEase", unit: "" },
  { key: "throatCondition", labelKey: "labelThroatCondition", unit: "" },
  { key: "voiceQuality", labelKey: "labelVoiceQuality", unit: "" },
  { key: "resonanceScore", labelKey: "labelResonanceScore", unit: "" },
  { key: "weightKg", labelKey: "labelWeight", unit: "kg" },
  { key: "carbs", labelKey: "macroCarbs", unit: "g" },
  { key: "protein", labelKey: "macroProtein", unit: "g" },
  { key: "fat", labelKey: "macroFat", unit: "g" },
  { key: "fiber", labelKey: "macroFiber", unit: "g" },
  { key: "exerciseMinutes", labelKey: "labelExerciseMinutes", unitKey: "unitMinutesFactor" }
];

const TABS = [
  { key: "home", labelKey: "tabHome", icon: Sun },
  { key: "today", labelKey: "tabToday", icon: Mic2 },
  { key: "analysis", labelKey: "tabAnalysis", icon: BarChart3 },
  { key: "garden", labelKey: "tabCharacter", icon: Home },
  { key: "notes", labelKey: "tabNotes", icon: NotebookPen },
  { key: "more", labelKey: "tabMore", icon: MoreHorizontal }
];
// 職業ごとに専用の理論ページへ切り替える
const PROFESSION_THEORY_PAGES = {
  singer: "/vocal-theory",
  announcer: "/announcer-theory",
  voice_actor: "/voice-actor-theory",
  pop_musical: "/performer-theory"
};
const VOCAL_PROFESSIONS = ["singer", "announcer", "voice_actor", "pop_musical"];
// 「その他」は5つ目の職業ではない（v4 §10 の凍結対象とは別物）。
// 職業別のコンテンツを一切作らず、既に「共通」として用意してあるものだけを
// 職業に関わらず見られるようにするための選択肢。
//   学ぶ画面   … 共通記事（professions: "all"）だけが出る
//   分析カード … analysisCardVisibility の "*" 指定のものだけが出る
//   活動記録   … 職業別のラベルを付けず、一般的な名前のまま
//   職業固有の追加項目（叫びテイク数・モニター環境など）は一切出さない
const PROFESSION_LABEL_KEYS = {
  singer: "professionSinger",
  announcer: "professionAnnouncer",
  voice_actor: "professionVoiceActor",
  pop_musical: "professionPopMusical",
  other: "professionOther"
};
const OTHER_PROFESSION = "other";
const SELECTABLE_PROFESSIONS = [...VOCAL_PROFESSIONS, OTHER_PROFESSION];
// lavoce-記録項目の再設計v2.md §3.6: 既往症を自由記述から選択式に構造化。
// 目的：診断済みの人には専用分析を出し、未診断の人には「疑い」を一切示さない（§7.1）。
// lavoce-記録項目の再設計v2.md §3.7: 稽古ノートの目標タグ。振り返り画面で、
// タグに対応する客観データを自動で並べるために使う。
// lavoce-記録項目の再設計v2.md §4.3: 畳める項目グループの表示名の一覧。
// lavoce-記録項目の再設計v2.md §4.3・Stage4-2スコープ調整パッチ §2.3: 畳める項目グループの一覧。
// 【役割分担（Stage4-2パッチ §3）】既存ユーザーへの声かけは、この一覧を使った§4.3の「畳みますか？」
// 提案（使用実績ベース、本人が選ぶ）が担当する。新規ユーザーへの初期状態は、同じfolded_groupsを
// プリセット（handleCompleteOnboarding、§2.3-2.4）が担当する。両者は同じ状態を異なる入口から
// 操作するだけで、二重管理にはならない。
const FOLDABLE_GROUP_LABELS = {
  meal_detail: "食事の詳細記録",
  exercise_detail: "運動の詳細記録",
  body_fat: "体脂肪率の記録",
  environment: "気温・湿度の記録",
  cpps: "CPPS客観測定",
  medication: "服薬タグの記録",
  mental_detail: "気持ちタグ・日記"
};
const GOAL_TAGS = [
  { key: "soft_high", label: "弱声の高音" },
  { key: "high_range", label: "高音" },
  { key: "range", label: "音域拡大" },
  { key: "breath_support", label: "息の支え" },
  { key: "articulation", label: "滑舌・明瞭度" },
  { key: "stamina", label: "持久力" },
  { key: "evenness", label: "音色の均一" }
];
const CONDITION_OPTIONS = [
  { key: "gerd", label: "逆流性食道炎" },
  { key: "lpr", label: "咽喉頭酸逆流" },
  { key: "allergic_rhinitis", label: "アレルギー性鼻炎・花粉症" },
  { key: "asthma", label: "喘息" },
  { key: "sinusitis", label: "副鼻腔炎" },
  { key: "thyroid", label: "甲状腺疾患" },
  { key: "anemia", label: "貧血" },
  { key: "sleep_apnea", label: "睡眠時無呼吸症候群" },
  { key: "vocal_lesion", label: "声帯結節・ポリープの既往" }
];
// 「今日の負荷」の抽象スキーマ。type はログの種類、durationMin/intensity は職業共通、
// それ以外は職業ごとに意味のある追加項目（分析エンジン側は type を見て解釈する）。
const LOAD_TYPE_BY_PROFESSION = {
  singer: "sustained_singing",
  announcer: "live_broadcast",
  voice_actor: "character_switching",
  pop_musical: "loud_venue_performance"
};
const LOAD_FIELDS_BY_PROFESSION = {
  // ★声楽家向けの4項目を削除しました（職業別項目の再設計と学ぶ画面.md §3.1）。
  //   音域（使用）… レパートリーのテッシトゥーラ・最高音と重複していた
  //   ダイナミクス … §3 の表に無く、参照する分析も無かった
  //   パッサッジョの通過数 … §3 の表に無い。★通過感（passaggioFeel）とは
  //     別物で、そちらは活動ブロックの detail にあり、分析も学ぶ記事も
  //     使っています。この職業の看板なので、消していません。
  //   消す前に実データを数えました。3か所（activities[].detail・
  //   activity_detail・load_detail）すべてで0件でした。
  singer: [],
  announcer: [
    { key: "onAirMinutes", type: "number", labelKey: "loadOnAirMinutes" },
    { key: "isLive", type: "boolean", labelKey: "loadIsLive" },
    { key: "consecutiveSegments", type: "number", labelKey: "loadConsecutiveSegments" }
  ],
  voice_actor: [
    { key: "sessionMinutes", type: "number", labelKey: "loadSessionMinutes" },
    { key: "characterCount", type: "number", labelKey: "loadCharacterCount" },
    { key: "hasExtremeVocalization", type: "boolean", labelKey: "loadHasExtremeVocalization" }
  ],
  pop_musical: [
    { key: "venueVolume", type: "scale5", labelKey: "loadVenueVolume" },
    { key: "monitorVolume", type: "scale5", labelKey: "loadMonitorVolume" },
    { key: "consecutivePerformanceDay", type: "number", labelKey: "loadConsecutivePerformanceDay" }
  ]
};

/* ---------- helpers ---------- */
// Supabase側の一時的な認証エラー（JWT関連の401/PGRST303など）かどうかを判定する。
// ネットワークの瞬断やインフラ側のクロックずれなど、こちらのコードのバグではなく
// 一時的に起きる種類のエラーを見分けるためのもの。
// 記録と分析の順番設計 §7: 「1日あたりの平均入力項目数」を計測するための、記入済みセクション数の
// 概算カウント。DAY_RECORD_ORDER相当の主要セクションだけを対象にする（曲目の中身などは数えない）。
// 統合実行ルートv4 §11: かんたん記録を選んだ人に「未入力」「完了度◯%」を見せないこと。
// かんたん記録では、そもそも出していない項目を分母に入れない（コアの3つだけを数える）。
// 満タンにできない目盛りを見せるのは、事実上の減点表示になるため。
export function countedSectionTotal(mode) {
  return mode === "simple" ? 3 : 9;
}
function countFilledSectionsCore(entry) {
  let n = 0;
  if ((entry.voiceEntries || []).length > 0) n += 1;
  if (typeof entry.sleepHours === "number") n += 1;
  if ((entry.activities || []).length > 0 || entry.recovery) n += 1;
  return n;
}
// ★どのセクションを入れたか、その「名前」だけを返す（計測とユーザー調査仕様 §3.3）。
//   fieldsFilled は項目名の配列であって、項目の値ではありません。
//   この線を守っているかぎり、行動ログは要配慮個人情報になりません。
function filledSectionNames(entry, mode) {
  const e = entry || {};
  const names = [];
  if ((e.voiceEntries || []).length > 0) names.push("voice");
  if (typeof e.sleepHours === "number") names.push("sleep");
  if ((e.activities || []).length > 0 || e.recovery) names.push("activity");
  if (mode === "simple") return names;
  if (typeof e.temperature === "number" || typeof e.humidity === "number") names.push("environment");
  if ((e.waterBySlot || {}).total > 0) names.push("hydration");
  if (e.dinnerTime || (e.dinnerTags || []).length > 0 || typeof e.proteinLevel === "number") names.push("meal");
  if ((e.symptoms || []).length > 0) names.push("symptoms");
  if (typeof e.mentalEase === "number") names.push("mental");
  if ((e.note || e.mentalReason || "").trim()) names.push("notes");
  return names;
}
function countFilledSections(entry, mode) {
  if (mode === "simple") return countFilledSectionsCore(entry);
  let n = 0;
  if ((entry.voiceEntries || []).length > 0) n += 1;
  if (typeof entry.temperature === "number" || typeof entry.humidity === "number") n += 1;
  if (typeof entry.sleepHours === "number") n += 1;
  if ((entry.activities || []).length > 0 || entry.recovery) n += 1;
  if ((entry.waterBySlot || {}).total > 0) n += 1;
  if (entry.dinnerTime || (entry.dinnerTags || []).length > 0 || typeof entry.proteinLevel === "number") n += 1;
  if ((entry.symptoms || []).length > 0) n += 1;
  if (typeof entry.mentalEase === "number") n += 1;
  if ((entry.note || entry.mentalReason || "").trim()) n += 1;
  return n;
}
// 記録と分析の順番設計 §3.5: 保存直後に「今日わかったこと」として出す、その日だけの簡単な発見。
// 出せる日だけ出す（無ければnullを返し、カードには何も表示しない）。すべて自分比。
function computeTodaysDiscovery(entries, today) {
  const dates7 = Object.keys(entries).filter((d) => d <= today).sort().slice(-7);
  if (dates7.length < 3 || dates7[dates7.length - 1] !== today) return null;
  const todayEntry = entries[today];
  const waterVals = dates7.map((d) => (entries[d].waterBySlot || {}).total).filter((v) => typeof v === "number" && v > 0);
  const todayWater = (todayEntry.waterBySlot || {}).total;
  if (typeof todayWater === "number" && todayWater > 0 && waterVals.length >= 3 && todayWater === Math.max(...waterVals)) {
    return "水分が今週いちばん多い日です";
  }
  const sleepVals = dates7.map((d) => entries[d].sleepHours).filter((v) => typeof v === "number");
  if (typeof todayEntry.sleepHours === "number" && sleepVals.length >= 3 && todayEntry.sleepHours === Math.max(...sleepVals)) {
    return "睡眠時間が今週いちばん長い日です";
  }
  return null;
}

// Supabase側の一時的な認証エラー（JWT関連の401/PGRST303など）かどうかを判定する。
// ネットワークの瞬断やインフラ側のクロックずれなど、こちらのコードのバグではなく
// 一時的に起きる種類のエラーを見分けるためのもの。
function isTransientAuthError(error) {
  if (!error) return false;
  const code = error.code || "";
  const status = error.status || error.statusCode || 0;
  const message = (error.message || "").toLowerCase();
  return (
    code === "PGRST303" ||
    status === 401 ||
    message.includes("jwt") ||
    message.includes("unauthorized")
  );
}
// ★セッションの更新は、同時にいくつ失敗しても「1回だけ」走らせる。
//   画面を開いた瞬間、7つの useEffect が12本のクエリを並行して投げる。
//   一時的な認証エラーが起きると、そのすべてが同時にエラーになり、
//   以前は各自が refreshSession() を呼んでいた。1回のつまずきで6回の更新が
//   立て続けに走っていた（コンソールに同じ警告が並ぶのはこれ）。
//   Supabase はセッションを更新するたびにリフレッシュトークンを作り替えるので、
//   同時に何度も更新すると、後から届いた更新が「もう使われたトークン」として
//   弾かれ、最悪の場合そのままログアウトになる。
let sessionRefreshInFlight = null;
let sessionRefreshedAt = 0;
const SESSION_REFRESH_COOLDOWN_MS = 10000;
async function refreshSessionOnce(supabase) {
  // すでに誰かが更新中なら、その結果を一緒に待つ（新しく走らせない）。
  if (sessionRefreshInFlight) return sessionRefreshInFlight;
  // ついさっき更新したばかりなら、もう一度は走らせない。
  // 更新済みのトークンで、呼び出し元がそのまま再試行すれば足りる。
  if (Date.now() - sessionRefreshedAt < SESSION_REFRESH_COOLDOWN_MS) return null;
  const task = (async () => {
    try {
      // ★時間制限が要る。更新が返ってこないと、待っている全員が道連れで止まる。
      await withTimeout(supabase.auth.refreshSession(), AUTH_TIMEOUT_MS, "セッションの更新");
    } catch (e) {
      /* リフレッシュ自体が失敗しても、呼び出し元の再試行で最終的なエラーを拾う */
    } finally {
      sessionRefreshedAt = Date.now();
      sessionRefreshInFlight = null;
    }
  })();
  sessionRefreshInFlight = task;
  return task;
}
// queryFn: () => Promise<{data, error}> を返す関数（クエリを毎回組み立て直せるように関数で受け取る）。
// 一時的な認証エラーが出た場合のみ、セッションを更新してから1回だけ再試行する。
// それ以外のエラー（権限不足や入力ミスなど）はそのまま返し、無限にリトライしない。
// クエリを1回実行する。返ってこない場合は打ち切り、エラーとして扱う。
// ★例外を投げないこと。呼び出し側は全て { data, error } を前提にしている。
async function runQueryOnce(queryFn, label) {
  try {
    return await withTimeout(Promise.resolve(queryFn()), QUERY_TIMEOUT_MS, label || "クエリ");
  } catch (e) {
    return { data: null, error: e };
  }
}
async function runQueryWithAuthRetry(supabase, queryFn, label) {
  let result = await runQueryOnce(queryFn, label);
  if (result.error && isTransientAuthError(result.error)) {
    console.warn(`${label || "クエリ"}で一時的な認証エラーを検知。セッションを更新して再試行します。`, result.error);
    await refreshSessionOnce(supabase);
    await new Promise((resolve) => setTimeout(resolve, 600));
    result = await runQueryOnce(queryFn, label);
  }
  return result;
}
// ---- レッスン画面の「立場」を決める（1か所だけで決める） ----
// ★1人が先生でもあり生徒でもある、は正当な想定（自分も誰かに習っている先生）。
//   以前は教える側と習う側でタブの出現条件が独立していたため、両方に当てはまる人には
//   「レッスン」タブが2つ並んでいた。タブは1つにして、中で立場を切り替える。
//
// choice は本人が選んだ立場（まだ選んでいなければ null）。
// 連携が解除されて選んだ立場が使えなくなることがあるので、毎回ふるいにかける。
function resolveLessonRole(choice, { canTeach, canLearn }) {
  if (choice === "teach" && canTeach) return "teach";
  if (choice === "learn" && canLearn) return "learn";
  // 既定は「教える」。先生の仕事には期限があるものが多いため。
  // 教える側でなければ、当然「習う」。
  return canTeach ? "teach" : "learn";
}
// 切り替えを出すのは、両方に当てはまる人だけ。
// ★片方だけの人（大多数）に、選ぶものが1つしかない切り替えを見せないこと。
function shouldShowLessonRoleSwitch({ canTeach, canLearn }) {
  return Boolean(canTeach && canLearn);
}
// ---- レッスン画面の「立場」 ここまで ----
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayISO() {
  return toISODate(new Date());
}
// サーバー（UTC基準）とブラウザ（日本時間など）で「今日」の計算結果がずれることがあり、
// これが React のハイドレーション不一致（サーバーとクライアントの初回描画結果の食い違い）の原因になっていた。
// 初回描画は必ずUTC基準の値で揃え、マウント後に useEffect で現地時間の正しい「今日」へ補正する。
function todayISOUTC() {
  const d = new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function addDays(iso, delta) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}
const LOCALE_MAP = { ja: "ja-JP", en: "en-US", zh: "zh-CN", it: "it-IT", de: "de-DE", fr: "fr-FR", es: "es-ES", ko: "ko-KR", ru: "ru-RU" };
function getWeekdayLabels(language) {
  const locale = LOCALE_MAP[language] || "ja-JP";
  const base = new Date(2023, 0, 1); // 2023-01-01 は日曜日
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return fmt.format(d);
  });
}
function formatDateLabel(iso, language) {
  const d = new Date(iso + "T00:00:00");
  const locale = LOCALE_MAP[language] || "ja-JP";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(d);
}
function formatMonthLabel(year, month, language) {
  const d = new Date(year, month, 1);
  const locale = LOCALE_MAP[language] || "ja-JP";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(d);
}
function monthMeta(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { daysInMonth, startWeekday: first.getDay() };
}
function shiftMonth({ year, month }, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
function clampLevel(v) {
  return Math.max(1, Math.min(5, Math.round(v)));
}
// ★値の大小で色を変えない（描画仕様 §7-5・§1-4）。
//   以前は 1〜5 を「濃い赤 → 緑」に写していた。これは信号色そのもので、
//   表示ゲートを迂回します。文章を出していなくても、色が「良い・悪い」を
//   言っているためです。記録2日目の赤い四角は、判定を下しています。
//   見本（analysis-mock4.html）も、数字はすべて --ink 一色で、
//   定義されている --ok を1度も使っていません。
//   ★値は、色ではなく位置・大きさ・数で表します。
function levelInk(v) {
  return v == null ? C.inkSoft : C.ink;
}
function levelDynamic(v) {
  if (v == null) return "—";
  return LEVEL_DYNAMICS[clampLevel(v) - 1];
}
function computeOverallScore(entry) {
  if (!entry) return null;
  const parts = [entry.throatCondition, entry.voiceQuality, entry.sleepQuality, entry.ease].filter(
    (v) => typeof v === "number"
  );
  if (parts.length === 0) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}
// 「声の調子スコア」（100点満点）と同じ重み付けを、1日分の記録に対して計算する版。
// 偏差値（自分比の分布）を出すには、14日平均1つではなく日ごとの値の並びが必要なため。
function computeDailyScore100(entry) {
  if (!entry) return null;
  const throatScore = typeof entry.throatCondition === "number" ? (entry.throatCondition / 5) * 100 : null;
  const voiceScore = typeof entry.voiceQuality === "number" ? (entry.voiceQuality / 5) * 100 : null;
  const easeScore = typeof entry.ease === "number" ? (entry.ease / 5) * 100 : null;
  let sleepHoursScore = null;
  if (typeof entry.sleepHours === "number") {
    const h = entry.sleepHours;
    if (h >= 7 && h <= 9) sleepHoursScore = 100;
    else if (h < 7) sleepHoursScore = Math.max(0, 100 - (7 - h) * 20);
    else sleepHoursScore = Math.max(0, 100 - (h - 9) * 15);
  }
  const sleepQualityScore = typeof entry.sleepQuality === "number" ? (entry.sleepQuality / 5) * 100 : null;
  const sleepScore = (sleepHoursScore != null && sleepQualityScore != null)
    ? (sleepHoursScore + sleepQualityScore) / 2
    : (sleepHoursScore ?? sleepQualityScore);
  const hasSymptoms = (entry.throatSymptoms || []).length > 0;
  const symptomScore = hasSymptoms ? 0 : 100;
  const waterMl = Object.values(entry.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const waterScore = waterMl > 0 ? Math.min(100, (waterMl / 2000) * 100) : null;
  const components = [
    { score: throatScore, weight: 25 },
    { score: voiceScore, weight: 20 },
    { score: sleepScore, weight: 20 },
    { score: easeScore, weight: 15 },
    { score: symptomScore, weight: 10 },
    { score: waterScore, weight: 10 }
  ];
  const valid = components.filter((c) => c.score != null);
  const totalWeight = valid.reduce((s, c) => s + c.weight, 0);
  if (totalWeight === 0) return null;
  return valid.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight;
}
// Magnus式による絶対湿度（g/m³）への換算。相対湿度は気温が変わると同じ%でも
// 実際の水分量が変わってしまうため、予報モデルでは絶対湿度を使う。
function computeAbsoluteHumidity(tempC, rhPercent) {
  if (typeof tempC !== "number" || typeof rhPercent !== "number") return null;
  const es = 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  return (216.7 * es * rhPercent / 100) / (273.15 + tempC);
}
// 07. 発声負荷バランス（ACWR）：活動種別ごとの重み。声の予報の「前日発声負荷」predictor でも
// この正式な計算を使う（簡易プロキシではなく、指標設計図.md 07節の計算式そのもの）。
const ACTIVITY_LOAD_WEIGHT = { "休養": 0, "自主練習": 1.0, "レッスン": 1.2, "リハーサル": 1.3, "本番": 1.6 };
// ★実測が無い活動に、種別ごとの推定時間を補う（G2-10.5 / 改善タスクv2 §3-1）。
//
// これまで、分が空の活動ブロックは Number("")||0 で 0分として扱われていました。
// 「レッスンに行った」と記録した日が、声を1分も使わなかった日と同じ負荷0になり、
// ACWR が動かない原因になっていました。
//
// ★計算式は1文字も変えません。式に渡す「分」を補うだけです。
//   補ったかどうかは usedEstimate で持ち回り、画面で区別して見せます。
//   推定を実測と混ぜて、実測のような顔をさせないこと。
function withEstimatedMinutes(entry) {
  if (!entry || !Array.isArray(entry.activities) || entry.activities.length === 0) {
    return { entry, usedEstimate: false };
  }
  let usedEstimate = false;
  const activities = entry.activities.map((a) => {
    const m = activityMinutes(a);
    if (!m.isEstimated || m.minutes <= 0) return a;
    usedEstimate = true;
    return { ...a, minutes: m.minutes };
  });
  return { entry: usedEstimate ? { ...entry, activities } : entry, usedEstimate };
}
// 1日分の発声負荷 L_d = 活動時間(分) × 種別重み + 運動記録の負荷（0.3 × 分 × 強度/3）
function computeDailyLoad(entry, songFactorResolver) {
  if (!entry) return 0;
  // §4: L_day = Σ_a L_a（活動ブロックごとに係数・曲目のsongFactorを反映して合算する）
  const baseLoad = computeDayLoadFromActivities(entry.activities, songFactorResolver);
  let exerciseLoad = (entry.exercises || []).reduce((sum, x) => {
    const minutes = Number(x.minutes) || 0;
    const intensity = typeof x.intensity === "number" ? x.intensity : 3;
    return sum + 0.3 * minutes * (intensity / 3);
  }, 0);
  // §3.11: 詳細記録（種目・分・強度）がない日は、簡易3択の換算値を使う。
  if ((!entry.exercises || entry.exercises.length === 0) && typeof entry.exerciseLevel === "number" && entry.exerciseLevel > 0) {
    const equiv = entry.exerciseLevel === 1 ? { minutes: 20, intensity: 2 } : { minutes: 40, intensity: 4 };
    exerciseLoad = 0.3 * equiv.minutes * (equiv.intensity / 3);
  }
  // lavoce-職業別項目の再設計と学ぶ画面.md §2.1: 本番外の発話（レッスン・会議・電話・授業・打合せ等）。
  // 「歌っていない＝休養日」という誤った過小評価を正すための、全職業共通の項目。
  // 分単位の実測値（nonPerformanceSpeechMinutes）を優先し、無い場合だけ旧speakingLevel（3択）
  // からの概算にフォールバックする（過去データを消さず、両立させる）。
  // ★speakingLevel は読み取り専用の旧項目です。消さないでください。
  //   理由は lib/vocalDose.js の同じ分岐に書きました（実データ1件、代替なし）。
  let speakingLoad;
  if (typeof entry.nonPerformanceSpeechMinutes === "number") {
    speakingLoad = entry.nonPerformanceSpeechMinutes * 1.0 * (entry.noisyEnvironment ? 1.3 : 1);
  } else {
    const speakingLevel = typeof entry.speakingLevel === "number" ? entry.speakingLevel : 0;
    speakingLoad = speakingLevel * 22.5 * (entry.noisyEnvironment ? 1.3 : 1);
  }
  return baseLoad + exerciseLoad + speakingLoad;
}
// 事前値 β₀（lavoce-指標設計図.md 01節より）。記録が14日未満のときはこの値だけで予報する。
const FORECAST_PRIORS = {
  sleepHours: 0.25, dinnerGap: 0.10, waterL: 0.15, ease: 0.20,
  alcohol: -0.40, prevLoad: -0.15, absHumidity: 0.02, prevThroat: 0.35
};
const FORECAST_KEYS = Object.keys(FORECAST_PRIORS);
const FORECAST_FACTOR_LABELS = {
  sleepHours: "睡眠時間", dinnerGap: "夕食から就寝までの間隔", waterL: "水分量", ease: "心の余裕",
  alcohol: "アルコール", prevLoad: "前日の発声負荷（ACWR）", absHumidity: "絶対湿度", prevThroat: "前日の喉の状態"
};
// 前日の記録から、予報モデルの説明変数を取り出す。prevAcwr は前日時点のACWR値（acwrSeriesから取得して渡す）。
function extractForecastPredictors(prevEntry, prevAcwr) {
  if (!prevEntry) return null;
  const sleepHours = typeof prevEntry.sleepHours === "number" ? prevEntry.sleepHours : null;
  const dinnerGap = computeTimeGapHours(prevEntry.dinnerTime, prevEntry.bedtime);
  const waterMl = Object.values(prevEntry.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  const waterL = waterMl > 0 ? waterMl / 1000 : null;
  const ease = typeof prevEntry.ease === "number" ? prevEntry.ease : null;
  const alcohol = (prevEntry.dinnerTags || []).includes("アルコール") ? 1 : 0;
  const prevLoad = typeof prevAcwr === "number" ? prevAcwr : null;
  const absHumidity = computeAbsoluteHumidity(prevEntry.temperature, prevEntry.humidity);
  const prevThroat = typeof prevEntry.throatCondition === "number" ? prevEntry.throatCondition : null;
  return { sleepHours, dinnerGap, waterL, ease, alcohol, prevLoad, absHumidity, prevThroat };
}
// ŷ = μ + Σ βⱼ(xⱼ − x̄ⱼ)。beta は β₀そのもの、または個人化後にブレンドした値を渡す。
// 欠損した説明変数はその項を0（＝平均値で埋めたのと同じ）として無視する。
function predictThroat(predictors, means, mu, beta) {
  if (!predictors) return null;
  const coeffs = beta || FORECAST_PRIORS;
  let yhat = mu;
  let missingCount = 0;
  FORECAST_KEYS.forEach((k) => {
    const x = predictors[k];
    if (typeof x === "number" && typeof means[k] === "number") {
      yhat += coeffs[k] * (x - means[k]);
    } else {
      missingCount += 1;
    }
  });
  return { yhat: Math.max(1, Math.min(5, yhat)), missingCount };
}
// ---- ここから、リッジ回帰（個人化）用の小さな行列演算ヘルパー ----
function matTranspose(A) {
  return A[0].map((_, j) => A.map((row) => row[j]));
}
function matMultiply(A, B) {
  const result = [];
  for (let i = 0; i < A.length; i++) {
    const row = [];
    for (let j = 0; j < B[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < B.length; k++) sum += A[i][k] * B[k][j];
      row.push(sum);
    }
    result.push(row);
  }
  return result;
}
function matVecMultiply(A, v) {
  return A.map((row) => row.reduce((sum, val, j) => sum + val * v[j], 0));
}
// ガウス・ジョルダン法による正方行列の逆行列（部分ピボッティングつき）。
// λ（リッジの正則化項）を対角に足した後に呼ぶため、実務上は特異行列になりにくい。
function matInverse(A) {
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivotRow][col])) pivotRow = r;
    }
    [aug[col], aug[pivotRow]] = [aug[pivotRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-9) return null;
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= factor * aug[col][j];
    }
  }
  return aug.map((row) => row.slice(n));
}
// リッジ回帰: β̂ = (XᵀX + λI)⁻¹Xᵀy。X は標準化済み、y はセンタリング済みを渡すこと。
function fitRidgeRegression(X, y, lambda) {
  if (X.length === 0) return null;
  const p = X[0].length;
  const Xt = matTranspose(X);
  const XtX = matMultiply(Xt, X);
  for (let i = 0; i < p; i++) XtX[i][i] += lambda;
  const XtXInv = matInverse(XtX);
  if (!XtXInv) return null;
  const Xty = Xt.map((row) => row.reduce((sum, val, k) => sum + val * y[k], 0));
  return matVecMultiply(XtXInv, Xty);
}
// ---- リッジ回帰ヘルパー ここまで ----
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}
// ---- lavoce-指標設計図.md フェーズ4（05効いた習慣・04声の時差マップ）用の統計ヘルパー ----
// 配列を順位に変換する（同値は平均順位）。スピアマン相関の下ごしらえ。
function rankArray(arr) {
  const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}
// スピアマン順位相関 = 順位に変換した後のピアソン相関。外れ値に強く、5段階評価のような順序尺度に向く。
function spearman(xs, ys) {
  if (xs.length < 3) return null;
  return pearson(rankArray(xs), rankArray(ys));
}
// 正則化不完全ベータ関数（連分数展開、Numerical Recipes準拠の実装）。t分布のp値の計算に使う。
function incompleteBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta);
  const useContinuedFraction = x < (a + 1) / (a + b + 2);
  const cf = (x, a, b) => {
    const maxIter = 200, eps = 1e-10;
    let c = 1, d = 1 - ((a + b) * x) / (a + 1);
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    let h = d;
    for (let m = 1; m <= maxIter; m++) {
      const m2 = 2 * m;
      let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d; h *= d * c;
      aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c; h *= del;
      if (Math.abs(del - 1) < eps) break;
    }
    return h;
  };
  if (useContinuedFraction) {
    return (front * cf(x, a, b)) / a;
  } else {
    return 1 - (front * cf(1 - x, b, a)) / b;
  }
}
function logGamma(x) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
// t統計量とその自由度から、両側検定のp値を求める（t分布とベータ関数の関係を利用）。
function tDistPValue(t, df) {
  if (!Number.isFinite(t) || df <= 0) return 1;
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}
// Benjamini–Hochberg法によるFDR補正。複数の相関を同時に見るときに、偶然の「有意」を抑える。
// 戻り値は、入力と同じ順序の boolean 配列（true = 補正後も有意）。
function benjaminiHochberg(pValues, fdr) {
  const indexed = pValues.map((p, i) => ({ p, i })).filter((x) => x.p != null).sort((a, b) => a.p - b.p);
  const m = indexed.length;
  const result = new Array(pValues.length).fill(false);
  let cutoffRank = -1;
  for (let k = 0; k < m; k++) {
    if (indexed[k].p <= ((k + 1) / m) * fdr) cutoffRank = k;
  }
  for (let k = 0; k <= cutoffRank; k++) result[indexed[k].i] = true;
  return result;
}
// Hedges' g（小標本バイアス補正つきの効果量）と95%信頼区間。
function computeHedgesG(group1, group0) {
  const n1 = group1.length, n0 = group0.length;
  if (n1 < 2 || n0 < 2) return null;
  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = (arr, m) => arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / (arr.length - 1);
  const m1 = mean(group1), m0 = mean(group0);
  const s1 = variance(group1, m1), s0 = variance(group0, m0);
  const sPooled = Math.sqrt(((n1 - 1) * s1 + (n0 - 1) * s0) / (n1 + n0 - 2));
  if (sPooled === 0) return null;
  const J = 1 - 3 / (4 * (n1 + n0) - 9);
  const g = ((m1 - m0) / sPooled) * J;
  const se = Math.sqrt((n1 + n0) / (n1 * n0) + (g * g) / (2 * (n1 + n0)));
  // ★点を全部描くために、元の値も返す（描画仕様 §3-E）。
  //   平均の棒2本にすると、差が実際より確かなものに見える。
  //   点を全部出すと重なりが見え、「2時間未満でも良かった日はある」が伝わる。
  return { g, ciLow: g - 1.96 * se, ciHigh: g + 1.96 * se, n1, n0, m1, m0,
    values1: group1.slice(), values0: group0.slice() };
}
function starRatingForEffect(res) {
  if (!res) return 0;
  const { n1, n0, g, ciLow, ciHigh } = res;
  if (n1 < 3 || n0 < 3) return 0;
  let stars = 1;
  const crossesZero = ciLow <= 0 && ciHigh >= 0;
  if (!crossesZero) stars = 2;
  if (!crossesZero && Math.abs(g) >= 0.5) stars = 3;
  // ★件数のしきい値は displayGates の定数を使う。ここに 10 と直接書くと、
  //   §6-1 のしきい値を変えたときに★の判定だけ古いまま残る。
  //   （同じ決定が2か所にある、の典型。このリポジトリで繰り返している形）
  if (!crossesZero && Math.abs(g) >= 0.5 && n1 >= NARRATIVE_MIN_N_PER_GROUP && n0 >= NARRATIVE_MIN_N_PER_GROUP) stars = 4;
  return stars;
}
// ---- 統計ヘルパー ここまで ----
function getCorrelationData(entries, targetKey, targetFilter, t) {
  const list = Object.values(entries).filter(targetFilter);
  return FACTORS.filter((f) => f.key !== targetKey).map((f) => {
    const pairs = list
      .map((e) => ({ x: e[f.key], y: e[targetKey] }))
      .filter((p) => typeof p.x === "number" && typeof p.y === "number");
    const r = pairs.length >= 3 ? pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)) : null;
    return { key: f.key, label: t(f.labelKey), unit: f.unitKey ? t(f.unitKey) : f.unit, r, n: pairs.length, pairs };
  });
}
function correlationLabel(r, t) {
  const abs = Math.abs(r);
  const pos = r >= 0;
  if (abs >= 0.7) return t(pos ? "corrStrongPos" : "corrStrongNeg");
  if (abs >= 0.4) return t(pos ? "corrModeratePos" : "corrModerateNeg");
  if (abs >= 0.2) return t(pos ? "corrWeakPos" : "corrWeakNeg");
  return t("corrNone");
}
// 統合実行ルートv4 §6-1: 相関を文章で語るには、件数・効果量・多重比較の3つを全部通すこと。
// 以前は |r| ≥ 0.4 かつ n ≥ 5 だけで文章にしていたため、少数データで断定的な文が出ていた（P0-1）。
// FACTORS を一斉に見ているので、多重比較の補正はここでまとめて行う。
// ★BH-FDR は族ごとに独立してかける（分析の検出力と族の設計.md §1）。
//   以前は FACTORS を全部まとめて1つの族として補正していた。項目が増えるほど
//   しきい値が厳しくなり、検出力が落ちて何も出なくなる方向に働いていた。
//
// ★文章を出してよいのは中核族だけ。探索族は図だけで、文章も数字も出さない。
//   3ゲート（件数・効果量・FDR）は変えていない。§6-1 のまま。
//   探索族はそもそも文章を出さないので、ゲートの対象外になる。
//   だから族を分けても、ガードレールは1ミリも緩まない。
function generateInsights(correlationResults, targetLabel, t) {
  const withP = correlationResults.map((r) => {
    if (r.r == null || r.n < 3 || Math.abs(r.r) >= 1) return { ...r, pValue: null };
    const tStat = r.r * Math.sqrt((r.n - 2) / (1 - r.r * r.r));
    return { ...r, pValue: tDistPValue(tStat, r.n - 2) };
  });
  // 族ごとに分けてから、その中だけで補正する。
  // ★探索族は検定しない（計算もしない）。
  const fdrByKey = {};
  const byFamily = {};
  withP.forEach((r) => {
    const fam = familyOf(r.key);
    if (fam === EXPLORE) return;
    (byFamily[fam] = byFamily[fam] || []).push(r);
  });
  Object.values(byFamily).forEach((rows) => {
    const passes = benjaminiHochberg(rows.map((x) => x.pValue), NARRATIVE_FDR_Q);
    rows.forEach((r, i) => { fdrByKey[r.key] = passes[i]; });
  });
  return withP
    .filter((r) => mayStateFinding(r.key))
    .filter((r) => evaluateGate("correlation.narrative", { n: r.n, rho: r.r, fdrPass: fdrByKey[r.key] }, t).passed)
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 3)
    .map((r) => {
      const strength = Math.abs(r.r) >= 0.7 ? t("insightStrengthClear") : t("insightStrengthSome");
      const actionTemplate = r.r >= 0 ? t("insightActionPos") : t("insightActionNeg");
      const action = actionTemplate.replace(/\{factor\}/g, r.label).replace(/\{target\}/g, targetLabel);
      const line = t("insightLine")
        .replace(/\{factor\}/g, r.label)
        .replace(/\{strength\}/g, strength)
        .replace(/\{r\}/g, r.r.toFixed(2))
        .replace(/\{n\}/g, r.n);
      return { key: r.key, text: `${line}${action}` };
    });
}
function getLastLocation(entries, beforeDate) {
  const dates = Object.keys(entries).filter((d) => d < beforeDate).sort();
  if (dates.length === 0) return "";
  const last = entries[dates[dates.length - 1]];
  return last && last.location ? last.location : "";
}
// ★「周期◯日目」の計算は lib/cyclePeriods.js に一本化した。
//   以前はここに entries.cycle_start から数える版があり、ホームの新しい
//   ボタン（cycle_periods に書く）と置き場所が分かれていた。
//   片方に入れた記録が、もう片方からは見えない状態だった。
// 記録と分析の順番設計 §4: 新しい日の「今日は？」を、決断させずに推測して既に選んでおく。
// 優先順位: 直近8週の「同じ曜日」で最も多かった種別 → それが無ければ「自主練習」。
// （指導者プランのレッスン日程・稽古ノートの予定は、いずれも本アプリ未実装のため対象外）
// 推測が外れても実害はない（表示される欄が変わるだけ）ため、間違えたときの取り消し表示は不要。
function guessTodayActivityKind(date, entries) {
  const targetWeekday = new Date(date + "T00:00:00Z").getUTCDay();
  const counts = {}; // "休養" も含めてカウントする
  for (let i = 1; i <= 56; i++) {
    const d = addDays(date, -i);
    const entry = entries[d];
    if (!entry) continue;
    if (new Date(d + "T00:00:00Z").getUTCDay() !== targetWeekday) continue;
    const kind = (entry.activities || []).length === 0 && entry.recovery ? "休養" : (entry.activities || [])[0] && entry.activities[0].kind;
    if (kind) counts[kind] = (counts[kind] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : "自主練習";
}
function buildFormData(date, entries) {
  const existing = entries[date];
  if (existing) {
    return {
      ...existing,
      throatSymptoms: existing.throatSymptoms || [],
      throatSymptomsOther: existing.throatSymptomsOther || "",
      voiceMemo: existing.voiceMemo || "",
      weather: existing.weather || "",
      mentalReason: existing.mentalReason || "",
      mentalTags: existing.mentalTags || [],
      meals: existing.meals || [],
      exercises: existing.exercises || [],
      voiceCheckins: existing.voiceCheckins || {},
      waterBySlot: existing.waterBySlot || {},
      activityDetail: existing.activityDetail || {},
      wakeNote: existing.wakeNote || "",
      routineNote: existing.routineNote || "",
      resonanceScore: existing.resonanceScore ?? "",
      bedtime: existing.bedtime || "",
      dinnerTime: existing.dinnerTime || "",
      dinnerTags: existing.dinnerTags || [],
      loadDetail: existing.loadDetail || {},
      cycleStart: existing.cycleStart || false,
      medicationTags: existing.medicationTags || [],
      ambientNoiseDb: existing.ambientNoiseDb ?? "",
      flightHours: existing.flightHours ?? "",
      jetlagHours: existing.jetlagHours ?? "",
      pianissimoHighNote: existing.pianissimoHighNote || "",
      pianissimoOnsetDelay: existing.pianissimoOnsetDelay || false,
      speakingLevel: existing.speakingLevel ?? null,
      nonPerformanceSpeechMinutes: existing.nonPerformanceSpeechMinutes ?? null,
      longestSpeechBlockMinutes: existing.longestSpeechBlockMinutes ?? null,
      environmentTags: existing.environmentTags || [],
      noisyEnvironment: existing.noisyEnvironment || false,
      cppsValue: existing.cppsValue ?? "",
      exerciseLevel: existing.exerciseLevel ?? null,
      bodyFatPct: existing.bodyFatPct ?? "",
      proteinLevel: existing.proteinLevel ?? null,
      voiceEntries: existing.voiceEntries || [],
      calorieLevel: existing.calorieLevel ?? null,
      activities: existing.activities || [],
      recovery: existing.recovery || null
    };
  }
  return {
    date,
    // ★触っていない値を保存しないこと。
    //   以前はここが 3 や 7 で始まっていたため、その欄に一度も触れずに保存した日にも
    //   「喉3・声3・睡眠7時間・心の余裕3」が本人の申告と区別できない形で保存され、
    //   平均・相関・予報・偏差値がすべて、作られた値を含んだまま計算されていた。
    //   分析側は typeof x === "number" で null を除外できるので、未記入は null で持つ。
    //   （DotSelector は value=null で全ドットが未選択、NumberField は空欄になる）
    throatCondition: null,
    voiceQuality: null,
    throatSymptoms: [],
    throatSymptomsOther: "",
    voiceMemo: "",
    voiceCheckins: {},
    wakeNote: "",
    routineNote: "",
    resonanceScore: "",
    sleepHours: null,
    sleepQuality: null,
    bedtime: "",
    waterBySlot: {},
    mealNotes: "",
    dinnerTime: "",
    dinnerTags: [],
    // 滞在地も、前日の値を引き継ぐと「今日そこに居た」ことになってしまう。
    // 引き継ぎたい場合は「前日をコピー」を明示的に押してもらう。
    location: "",
    weather: "",
    temperature: "",
    humidity: "",
    performanceQuality: null,
    ease: null,
    mentalReason: "",
    mentalTags: [],
    notes: "",
    weightKg: "",
    meals: [],
    exercises: [],
    loadDetail: {},
    cycleStart: false,
    medicationTags: [],
    ambientNoiseDb: "",
    flightHours: "",
    jetlagHours: "",
    pianissimoHighNote: "",
    pianissimoOnsetDelay: false,
    speakingLevel: null,
    nonPerformanceSpeechMinutes: null,
    longestSpeechBlockMinutes: null,
    environmentTags: [],
    noisyEnvironment: false,
    cppsValue: "",
    exerciseLevel: null,
    bodyFatPct: "",
    proteinLevel: null,
    calorieLevel: null,
    // lavoce-記録項目の再設計v2.md §3.1: 声の記録は1件でよい（総合欄は存在しない）。
    // 1件目はcontext:'wake'（起き抜け）を既定にする。
    // ★何も記録していない日に、こちらで1件作らないこと。
    //   以前は「11:10 起き抜け」のような、その時刻の空エントリが最初から入っており、
    //   ユーザーが触っていない値がそのまま保存されていた。
    //   0件で始め、「＋声の記録を追加」を押して初めて1件目が現れる形にする。
    voiceEntries: [],
    // lavoce-曲目複数化パッチ.md: 活動は「1日1つ」ではなくブロックの配列。
    // 記録と分析の順番設計 §4: 既定は固定の「自主練習」ではなく、直近8週の同じ曜日の推測から選ぶ。
    ...(() => {
      const guessed = guessTodayActivityKind(date, entries);
      return guessed === "休養"
        ? { activities: [], recovery: { methods: [], note: "" } }
        : { activities: [newActivityBlock(guessed, 0)], recovery: null };
    })()
  };
}
function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}
// lavoce-記録項目の再設計v2.md §3.5: BMI・体重レンジ表示を廃止し、エネルギー可用性（EA）に置換する。
// Deurenberg et al. (1991) の式による体脂肪率の推定。標準誤差は約4.1%BF（変動係数16%）で、
// 鍛えている人・痩せている人ほど誤差が大きいため、推定値である旨を必ず画面に明示すること。
function estimateBodyFatPct(bmi, age, sex) {
  if (bmi == null || age == null || (sex !== "男性" && sex !== "女性")) return null;
  const sexFactor = sex === "男性" ? 1 : 0;
  return 1.20 * bmi + 0.23 * age - 10.8 * sexFactor - 5.4;
}
// 除脂肪体重 FFM。体組成計の実測（体脂肪率）があれば優先し、なければDeurenberg式で推定する。
function computeFFM(weightKg, heightCm, age, sex, measuredBodyFatPct) {
  if (!weightKg) return null;
  if (typeof measuredBodyFatPct === "number") {
    return { ffm: weightKg * (1 - measuredBodyFatPct / 100), isEstimated: false };
  }
  const bmi = computeBMI(weightKg, heightCm);
  const estimated = estimateBodyFatPct(bmi, age, sex);
  if (estimated == null) return null;
  return { ffm: weightKg * (1 - estimated / 100), isEstimated: true };
}
// エネルギー可用性 EA = (摂取エネルギー − 運動によるエネルギー消費) / FFM(kg)。
// 目安は45kcal/kgFFM/日前後が十分、30を下回る状態が継続すると低EA。単一日では断定しない。
function computeEnergyAvailability(intakeKcal, exerciseKcal, ffmKg) {
  if (!ffmKg || ffmKg <= 0 || intakeKcal == null) return null;
  return (intakeKcal - (exerciseKcal || 0)) / ffmKg;
}
function sumMacro(meals, key) {
  return (meals || []).reduce((total, m) => total + (Number(m[key]) || 0), 0);
}
function newMealItem(slot = "朝食") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slot, name: "", isPreset: false, grams: "",
    carbs: "", protein: "", fat: "", fiber: ""
  };
}
function buildFoodLibrary(entries, currentMeals) {
  const map = new Map();
  FOOD_PRESETS.forEach((f) => {
    map.set(f.name, { name: f.name, reading: f.reading || null, i18n: f.i18n || null, category: f.category || null, nativeTerm: f.nativeTerm || null, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber, isPreset: true, unit: f.unit || null, unitWeight: f.unitWeight || null, date: "0000-00-00" });
  });
  const consider = (meals, date) => {
    (meals || []).forEach((m) => {
      const key = (m.name || "").trim();
      if (!key) return;
      if (m.isPreset) return; // プリセットは上で登録済みなので、量だけ違う履歴で上書きしない
      const existing = map.get(key);
      if (!existing || existing.isPreset || date >= existing.date) {
        map.set(key, { name: key, carbs: m.carbs, protein: m.protein, fat: m.fat, fiber: m.fiber, isPreset: false, date: date || "9999-99-99" });
      }
    });
  };
  Object.entries(entries || {}).forEach(([date, e]) => consider(e.meals, date));
  consider(currentMeals, "9999-99-99");
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}
function getLatestWeight(entries, uptoDate) {
  const dates = Object.keys(entries || {}).filter((d) => d <= uptoDate && entries[d].weightKg).sort();
  if (dates.length === 0) return null;
  return Number(entries[dates[dates.length - 1]].weightKg);
}
function computeNutritionTargets(weightKg, heightCm, age, sex, phase, proteinCoefficient) {
  if (!weightKg) return null;
  const w = Number(weightKg);
  const coefficient = Number(proteinCoefficient) || 1.6;
  const proteinTarget = w * coefficient;

  const usedPreciseFormula = !!(heightCm && age && (sex === "男性" || sex === "女性"));
  let calorieTarget;
  if (usedPreciseFormula) {
    const h = Number(heightCm);
    const a = Number(age);
    // Mifflin-St Jeor式（栄養学でよく使われる基礎代謝の推定式）
    const bmr = sex === "男性" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    const activityFactor = 1.55; // 週3〜5日の練習・運動がある「中程度の活動量」を仮定した係数
    const tdee = bmr * activityFactor;
    calorieTarget = phase === "増量" ? tdee + 350 : phase === "減量" ? tdee - 350 : tdee;
  } else {
    const kcalPerKg = phase === "増量" ? 38 : phase === "減量" ? 28 : 33;
    calorieTarget = w * kcalPerKg;
  }

  const proteinKcal = proteinTarget * 4;
  const fatTarget = (calorieTarget * 0.25) / 9;
  const fatKcal = fatTarget * 9;
  const carbsTarget = Math.max(0, (calorieTarget - proteinKcal - fatKcal) / 4);
  const fiberTarget = sex === "男性" ? 21 : sex === "女性" ? 18 : 20;
  return { calorieTarget, proteinTarget, fatTarget, carbsTarget, fiberTarget, usedPreciseFormula };
}
// lavoce-記録項目の再設計v2.md §3.4: 食品を数えさせない簡易モード。
// 「しっかり摂った／ふつう／少なめ」の3択から、体重と目標係数をもとにg/kgを推定する。
// カロリーも同様に3択で、目標に対する比率として推定する。
function estimateSimpleMealMacros(targets, proteinLevel, calorieLevel) {
  if (!targets) return null;
  const proteinMultiplier = [0.7, 1.0, 1.3][proteinLevel] ?? 1.0;
  const calorieMultiplier = [0.85, 1.0, 1.15][calorieLevel] ?? 1.0;
  const proteinG = targets.proteinTarget * proteinMultiplier;
  const totalKcal = targets.calorieTarget * calorieMultiplier;
  const proteinKcal = proteinG * 4;
  const remainingKcal = Math.max(0, totalKcal - proteinKcal);
  const carbsKcalTarget = targets.carbsTarget * 4;
  const fatKcalTarget = targets.fatTarget * 9;
  const remainingTargetKcal = carbsKcalTarget + fatKcalTarget;
  const carbsG = remainingTargetKcal > 0 ? (remainingKcal * (carbsKcalTarget / remainingTargetKcal)) / 4 : 0;
  const fatG = remainingTargetKcal > 0 ? (remainingKcal * (fatKcalTarget / remainingTargetKcal)) / 9 : 0;
  return { proteinG, carbsG, fatG, fiberG: targets.fiberTarget || 0, totalKcal };
}
function evaluateIntake(actual, target) {
  if (!target || target <= 0) return null;
  const ratio = actual / target;
  // ★値で色を変えない（分析画面の描画仕様 §7-5）。
  //   ★金と緑は文字に使わない（見やすさ §5。実測で 2.80 / 2.76 しかない）。
  //   言葉のほうが、色より正確に伝わる。色は足さず、文字で読ませる。
  if (ratio < 0.8) return { labelKey: "evalInsufficient" };
  if (ratio <= 1.1) return { labelKey: "evalAppropriate" };
  if (ratio <= 1.3) return { labelKey: "evalSlightlyExcess" };
  return { labelKey: "evalExcess" };
}
function newExerciseItem() {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: "有酸素運動", minutes: "", intensity: 3, memo: "" };
}
// lavoce-曲目複数化パッチ.md §2.0/§6: 活動ブロックと、その中の曲目アイテムのファクトリ関数
const ACTIVITY_BLOCK_KINDS = ["自主練習", "レッスン", "リハーサル", "本番"]; // 休養は recovery 側で扱うためここには含めない
function newActivityBlock(kind, order) {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind: kind || "自主練習",
    startAt: "",
    minutes: "",
    items: [],
    order: order || 0,
    detail: {}
  };
}
function newActivityItem(order) {
  return { repertoireName: "", minutesOverride: null, order: order || 0 };
}
// lavoce-記録項目の再設計v2.md §3.1: 声の記録を1件追加するときの初期値。
// 既定の場面は「その他」。時刻は現在時刻を既定にする（記録項目v2の指定通り）。
const VOICE_CONTEXT_OPTIONS = [
  { key: "wake", label: "起き抜け" },
  { key: "after_routine", label: "ルーティン後" },
  { key: "before_work", label: "本番前" },
  { key: "after_work", label: "本番後" },
  { key: "other", label: "その他" }
];
function newVoiceEntry(date, context) {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return {
    id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date,
    at: `${hh}:${mm}`,
    context: context || "other",
    // ★空で始める。既定値を入れると、触っていない人の記録に
    //   「喉3・声の出来5」が入り、分析はそれを答えとして読む。
    //   throatCondition はこのアプリで最も多く読まれる項目（33か所）なので、
    //   ここが埋まっていると、静かに嘘のデータが広がる。
    //   pitchChest / mptSeconds が空で始まるのと同じ扱いにそろえた。
    bodyFeel: null,
    quality: null,
    pitchChest: "",
    pitchSoftMax: "",
    symptoms: [],
    note: "",
    // 稽古ノートの「息の支え」「音色の均一」タグに対応する任意項目（作業計画v2で「まだ記録機能がない」とされていたもの）
    mptSeconds: null,
    toneEvenness: null,
    // lavoce-職業別項目の再設計と学ぶ画面.md §2.3: 発声ルーティンの長さ（全職業共通）。
    // ウォームアップ効率（半音差）の分母として使う。
    routineMinutes: null
  };
}
function updateVoiceCheckin(f, slotKey, field, value) {
  const checkins = { ...(f.voiceCheckins || {}) };
  checkins[slotKey] = { ...(checkins[slotKey] || {}), [field]: value };
  const throatVals = Object.values(checkins).map((c) => c && c.throat).filter((v) => typeof v === "number");
  const voiceVals = Object.values(checkins).map((c) => c && c.voice).filter((v) => typeof v === "number");
  return {
    ...f,
    voiceCheckins: checkins,
    throatCondition: throatVals.length ? Math.round(throatVals.reduce((a, b) => a + b, 0) / throatVals.length) : f.throatCondition,
    voiceQuality: voiceVals.length ? Math.round(voiceVals.reduce((a, b) => a + b, 0) / voiceVals.length) : f.voiceQuality
  };
}
function polarPoint(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startAngle, endAngle) {
  const p1 = polarPoint(cx, cy, r, startAngle);
  const p2 = polarPoint(cx, cy, r, endAngle);
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

/* ---------- DB row <-> app-shape mapping ---------- */
// lavoce-曲目複数化パッチ.md §8: 既存データ（単一の活動フィールド）を、読み込み時点で
// 新しい activities[] 構造に合成する互換レイヤー。DBを一括で書き換えず、古い記録もそのまま動く。
function migrateLegacyToActivities(row) {
  if (row.activities && Array.isArray(row.activities) && row.activities.length > 0) {
    return { activities: row.activities, recovery: row.recovery || null };
  }
  if (row.activity_type === "休養") {
    return {
      activities: [],
      recovery: row.recovery || {
        methods: (row.activity_detail && row.activity_detail.restMethods) || [],
        note: (row.activity_detail && row.activity_detail.restMethodOther) || ""
      }
    };
  }
  if (row.activity_type) {
    const items = row.repertoire && row.repertoire.trim()
      ? [{ repertoireName: row.repertoire.trim(), minutesOverride: null, order: 0 }]
      : [];
    return {
      activities: [{
        id: `migrated-${row.date}`,
        kind: row.activity_type,
        startAt: "",
        minutes: typeof row.activity_duration === "number" ? row.activity_duration : 0,
        items,
        order: 0,
        detail: row.activity_detail || {},
        source: "migrated"
      }],
      recovery: row.recovery || null
    };
  }
  return { activities: row.activities || [], recovery: row.recovery || null };
}
// lavoce-作業計画v2-構造変更の分離.md §5 Step1（読み取り互換レイヤー）+ Step3（移行ロジック）。
// 声の構造変更の第一段階：新旧どちらの形でも常に VoiceEntry[] を返す。
// 【重要】既存の throat_condition / voice_quality / voice_checkins などのフィールドは
// 一切変更しない。ここは「読み取り時に合成するだけ」の追加レイヤーで、書き込みはまだ旧形式のまま。
const VOICE_QUALITY_SLOT_TIME = { "朝": "08:00", "昼": "13:00", "晩": "20:00" };
const VOICE_QUALITY_SLOT_CONTEXT = { "朝": "wake", "昼": "before_work", "晩": "after_work" };
// 声の調子（5段階）を、quality の内部表現（常に0〜10）に変換する。記録項目v2 §3.2準拠。
function fiveScaleToQuality10(v) {
  if (typeof v !== "number") return null;
  return ((v - 1) / 4) * 10;
}
function migrateLegacyToVoiceEntries(row) {
  // 新形式（voice_entriesを直接持つ場合）はそのまま返す。将来Step4で書き込みを切り替えた後に使う経路。
  if (row.voice_entries && Array.isArray(row.voice_entries) && row.voice_entries.length > 0) {
    return row.voice_entries;
  }
  const entries = [];
  const checkins = row.voice_checkins || {};
  const hasCheckins = Object.keys(checkins).some((k) => checkins[k] && (typeof checkins[k].throat === "number" || typeof checkins[k].voice === "number"));

  if (hasCheckins) {
    // 朝/昼/晩の3枠を、時刻つきのVoiceEntry 3件に分解する（記録項目v2 §6の移行表）。
    Object.keys(VOICE_QUALITY_SLOT_TIME).forEach((slot) => {
      const c = checkins[slot];
      if (!c || (typeof c.throat !== "number" && typeof c.voice !== "number")) return;
      entries.push({
        id: `migrated-${row.date}-${slot}`,
        date: row.date,
        at: VOICE_QUALITY_SLOT_TIME[slot],
        context: VOICE_QUALITY_SLOT_CONTEXT[slot],
        bodyFeel: typeof c.throat === "number" ? c.throat : null,
        quality: fiveScaleToQuality10(c.voice),
        pitchChest: null,
        pitchSoftMax: null,
        symptoms: [],
        note: "",
        source: "migrated"
      });
    });
  } else if (typeof row.throat_condition === "number" || typeof row.voice_quality === "number" || typeof row.resonance_score === "number") {
    // 総合の1組だけの日は、正午のVoiceEntry 1件にまとめる。
    entries.push({
      id: `migrated-${row.date}-total`,
      date: row.date,
      at: "12:00",
      context: "other",
      bodyFeel: typeof row.throat_condition === "number" ? row.throat_condition : null,
      // 声の出来（0-10。列名は resonance_score のまま）があればそちらを優先し、
      // なければ声の調子（5段階）を0-10に変換する。
      quality: typeof row.resonance_score === "number" ? row.resonance_score : fiveScaleToQuality10(row.voice_quality),
      pitchChest: null,
      pitchSoftMax: null,
      symptoms: row.throat_symptoms || [],
      note: row.voice_memo || "",
      source: "migrated"
    });
  }

  // 起き抜け／弱声の最高音は、どちらも context:'wake' なので同じエントリにまとめる。
  // 既に「起き抜け」のエントリが無ければ新規に作る（総合の値とは独立に存在しうるため）。
  if (row.wake_note || row.pianissimo_high_note) {
    let wakeEntry = entries.find((e) => e.context === "wake");
    if (!wakeEntry) {
      wakeEntry = {
        id: `migrated-${row.date}-wake`,
        date: row.date,
        at: "07:00",
        context: "wake",
        bodyFeel: null,
        quality: null,
        pitchChest: null,
        pitchSoftMax: null,
        symptoms: entries.length === 0 ? (row.throat_symptoms || []) : [],
        note: "",
        source: "migrated"
      };
      entries.push(wakeEntry);
    }
    if (row.wake_note) wakeEntry.pitchChest = row.wake_note;
    if (row.pianissimo_high_note) wakeEntry.pitchSoftMax = row.pianissimo_high_note;
  }

  if (row.routine_note) {
    entries.push({
      id: `migrated-${row.date}-routine`,
      date: row.date,
      at: "07:30",
      context: "after_routine",
      bodyFeel: null,
      quality: null,
      pitchChest: row.routine_note,
      pitchSoftMax: null,
      symptoms: [],
      note: "",
      source: "migrated"
    });
  }

  return entries.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}
// 日次分析で使う「その日の代表値」を導出する（記録項目v2 §3.1）。ユーザーには入力させない。
function deriveVoiceEntryRepresentatives(voiceEntries) {
  if (!voiceEntries || voiceEntries.length === 0) return { bodyFeel: null, quality: null, wakeEntry: null, lastEntry: null, dayRange: null };
  const median = (arr) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  };
  const bodyFeelVals = voiceEntries.map((e) => e.bodyFeel).filter((v) => typeof v === "number");
  const qualityVals = voiceEntries.map((e) => e.quality).filter((v) => typeof v === "number");
  const sorted = [...voiceEntries].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const wakeEntry = voiceEntries.find((e) => e.context === "wake") || sorted[0] || null;
  const lastEntry = sorted[sorted.length - 1] || null;
  return {
    bodyFeel: median(bodyFeelVals),
    quality: median(qualityVals),
    wakeEntry,
    lastEntry,
    // 日内変動 = 最終エントリ − 起き抜けエントリ（記録項目v2 §3.1）
    dayRange: (wakeEntry && lastEntry && wakeEntry !== lastEntry && typeof wakeEntry.bodyFeel === "number" && typeof lastEntry.bodyFeel === "number")
      ? lastEntry.bodyFeel - wakeEntry.bodyFeel
      : null
  };
}
// quality（内部は常に0-10）を、既存の5段階表示に戻す（fiveScaleToQuality10の逆変換）。
function quality10ToFiveScale(q) {
  if (typeof q !== "number") return null;
  return 1 + (q / 10) * 4;
}
// lavoce-作業計画v2-構造変更の分離.md §5 Step4: 新しい VoiceEntry[] から、
// 既存の数十個の分析機能が読んでいる旧フィールド（throat_condition等）を逆算する。
// これにより「書き込みを新構造に切り替える」段階でも、既存の分析コードを一切変更せずに動かし続けられる。
// 新形式で入力されたエントリが1件でもあれば、旧フィールドはこの関数の結果で「上書き」される
// （つまり新形式が唯一の真実のソースになり、旧フィールドは常にそこから導出される派生値になる）。
function deriveLegacyVoiceFieldsFromEntries(voiceEntries) {
  if (!voiceEntries || voiceEntries.length === 0) return null;
  const rep = deriveVoiceEntryRepresentatives(voiceEntries);
  // ★音名は「起き抜け」の記録からしか拾っていなかった。
  //   地声の音名・弱声の最高音の入力は、どの場面のブロックにも出ている。
  //   場面が「本番前」「本番後」「その他」だと、書いた音名が旧列に届かず
  //   推移グラフから消えていた。しかも newVoiceEntry の既定は「その他」。
  //   代表値の側（deriveVoiceEntryRepresentatives）は
  //   find(wake) || sorted[0] という受け皿を持っていたのに、こちらだけ無かった。
  //   同じ決まりを2か所に書いて、片方だけ直っていない、いつもの形。
  const routineEntryForGuard = voiceEntries.find((e) => e.context === "after_routine") || null;
  // ★受け皿が、同じ1件を起き抜けとルーティン後の両方にしてしまわないようにする。
  //   「ルーティン後」1件だけの日に受け皿をそのまま使うと、wake も routine も
  //   その1件になり、ウォームアップ効率が必ず「0半音」になる。
  //   記録していないことを「変わらなかった」と言ってしまう。
  const wakeFallback = rep.wakeEntry;
  const wakeEntry = (wakeFallback && wakeFallback === routineEntryForGuard) ? null : wakeFallback;
  // ★ルーティン後には受け皿を作らない。
  //   ウォームアップ効率は routineMidi − wakeMidi で測る。受け皿を作ると
  //   同じ1件が両方になり、差が必ず0半音になる。記録が無いことと
  //   「変わらなかった」ことは別なので、無いときは無いままにする。
  const routineEntry = routineEntryForGuard;
  // 全エントリの症状・一口メモを合算する（どのエントリで書いても分析・記録に反映されるように）。
  const allSymptoms = [...new Set(voiceEntries.flatMap((e) => e.symptoms || []))];
  const firstNote = voiceEntries.map((e) => e.note).find((n) => n && n.trim()) || "";
  // 朝/昼/晩の3枠（時間帯別分析用）。該当する場面のエントリがあれば、そこから再構成する。
  const checkins = {};
  const contextToSlot = { wake: "朝", before_work: "昼", after_work: "晩" };
  // ★場面が「ルーティン後」「その他」の記録を、まるごと捨てていた。
  //   newVoiceEntry の既定は「その他」なので、いちばん普通の入れ方が
  //   朝・昼・晩のカードに出てこなかった。音名と同じ取りこぼし。
  //   場面で決まらないものは、記録した時刻（at）で置く。
  //   ★場面がはっきりしている記録を、時刻から来たもので上書きしない。
  const slotByHour = (at) => {
    const h = Number(String(at || "").slice(0, 2));
    if (!Number.isFinite(h)) return null;
    if (h < 11) return "朝";
    if (h < 17) return "昼";
    return "晩";
  };
  const fromContext = new Set();
  voiceEntries.forEach((e) => {
    const slot = contextToSlot[e.context];
    if (!slot) return;
    checkins[slot] = { throat: e.bodyFeel ?? null, voice: quality10ToFiveScale(e.quality) };
    fromContext.add(slot);
  });
  voiceEntries.forEach((e) => {
    if (contextToSlot[e.context]) return;
    const slot = slotByHour(e.at);
    if (!slot || fromContext.has(slot) || checkins[slot]) return;
    checkins[slot] = { throat: e.bodyFeel ?? null, voice: quality10ToFiveScale(e.quality) };
  });
  return {
    // ★旧列は整数の列です（schema.sql: throat_condition int / voice_quality int）。
    //   声の出来スライダーは0.5刻みで、そこから逆算した値は小数になります。
    //   丸めずに送ると Postgres が integer に入れられず、保存が400で落ちます。
    //   ここで丸めるのは、この関数が「列の形に合わせる」場所だからです。
    throatCondition: intOrNull(rep.bodyFeel),
    voiceQuality: intOrNull(quality10ToFiveScale(rep.quality)),
    resonanceScore: rep.quality, // resonance_scoreは元々0-10なので、qualityとそのまま対応する
    wakeNote: wakeEntry ? wakeEntry.pitchChest || null : null,
    routineNote: routineEntry ? routineEntry.pitchChest || null : null,
    pianissimoHighNote: wakeEntry ? wakeEntry.pitchSoftMax || null : null,
    throatSymptoms: allSymptoms,
    voiceMemo: firstNote,
    voiceCheckins: checkins
  };
}
// 指導者プラン実装仕様 §5: 生徒一覧カード用のサマリーを計算する。
// scope（公開範囲）で許可されていない項目は、計算すらせずnullのままにする
// （「計算はしたが表示しない」ではなく「そもそも見ない」を徹底する）。
// 作業指示-公開前の実装.md A-1: 健康データ(声・症状・睡眠等)の閲覧権限を、サーバー側(RLS)だけに
// 頼らず、クライアント側でも二重にチェックする。
// ★重要な設計: 健康データの共有は、教室(organizations/memberships/assignments)とは
// 完全に独立した、1対1の連携(teacher_student_links)だけで判定する。
// オーナー・管理者・担当講師という「教室での役割」は、ここには一切関与しない。
// 担当していない生徒の健康データを、オーナーや管理者が見られる経路は存在しない。
function canViewHealth(link, scopeKey) {
  if (!link) return false;
  if (link.status !== "active") return false; // 解除された瞬間、過去の期間も含めて見えなくなる
  if (link.revoked_at) return false;
  const scope = link.share_scope || {};
  return !!scope[scopeKey];
}
function computeStudentSummary(entries, link) {
  const dates = Object.keys(entries).sort();
  const totalDays = dates.length;
  const lastDate = dates[dates.length - 1] || null;
  const todayStr = todayISOUTC();
  const daysSinceLastRecord = lastDate ? Math.round((new Date(todayStr) - new Date(lastDate)) / 86400000) : null;
  const recentDates = dates.slice(-7);
  let avgThroat = null;
  if (canViewHealth(link, "voice")) {
    const throatVals = recentDates.map((d) => entries[d].throatCondition).filter((v) => typeof v === "number");
    avgThroat = throatVals.length ? throatVals.reduce((a, b) => a + b, 0) / throatVals.length : null;
  }
  let recentSymptomCount = null;
  if (canViewHealth(link, "symptoms")) {
    recentSymptomCount = recentDates.reduce((s, d) => s + (entries[d].throatSymptoms || []).length, 0);
  }
  let avgSleep = null;
  if (canViewHealth(link, "sleep")) {
    const sleepVals = recentDates.map((d) => entries[d].sleepHours).filter((v) => typeof v === "number");
    avgSleep = sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : null;
  }
  return { totalDays, lastDate, daysSinceLastRecord, avgThroat, recentSymptomCount, avgSleep };
}
function rowToEntry(row) {
  const { activities, recovery } = migrateLegacyToActivities(row);
  const voiceEntries = migrateLegacyToVoiceEntries(row);
  return {
    date: row.date,
    throatCondition: row.throat_condition,
    voiceQuality: row.voice_quality,
    throatSymptoms: row.throat_symptoms || [],
    sleepHours: row.sleep_hours,
    sleepQuality: row.sleep_quality,
    waterIntake: row.water_intake,
    mealNotes: row.meal_notes || "",
    location: row.location || "",
    temperature: row.temperature,
    humidity: row.humidity,
    activityType: row.activity_type,
    activityDuration: row.activity_duration,
    repertoire: row.repertoire || "",
    performanceQuality: row.performance_quality,
    ease: row.ease,
    notes: row.notes || "",
    weightKg: row.weight_kg,
    bodyFatPct: row.body_fat_pct,
    proteinLevel: row.protein_level,
    calorieLevel: row.calorie_level,
    carbs: row.carbs_g,
    protein: row.protein_g,
    fat: row.fat_g,
    fiber: row.fiber_g,
    exerciseMinutes: row.exercise_minutes,
    meals: row.meals || [],
    exercises: row.exercises || [],
    voiceCheckins: row.voice_checkins || {},
    waterBySlot: row.water_by_slot || {},
    weather: row.weather || "",
    mentalReason: row.mental_reason || "",
    mentalTags: row.mental_tags || [],
    throatSymptomsOther: row.throat_symptoms_other || "",
    voiceMemo: row.voice_memo || "",
    activityDetail: row.activity_detail || {},
    wakeNote: row.wake_note || "",
    routineNote: row.routine_note || "",
    resonanceScore: row.resonance_score,
    bedtime: row.bedtime || "",
    dinnerTime: row.dinner_time || "",
    dinnerTags: row.dinner_tags || [],
    loadDetail: row.load_detail || {},
    cycleStart: row.cycle_start || false,
    medicationTags: row.medication_tags || [],
    ambientNoiseDb: row.ambient_noise_db,
    flightHours: row.flight_hours,
    jetlagHours: row.jetlag_hours,
    pianissimoHighNote: row.pianissimo_high_note || "",
    pianissimoOnsetDelay: row.pianissimo_onset_delay || false,
    speakingLevel: row.speaking_level,
    nonPerformanceSpeechMinutes: row.non_performance_speech_minutes ?? null,
    longestSpeechBlockMinutes: row.longest_speech_block_minutes ?? null,
    environmentTags: row.environment_tags || [],
    noisyEnvironment: row.noisy_environment || false,
    cppsValue: row.cpps_value,
    exerciseLevel: row.exercise_level,
    activities,
    recovery,
    voiceEntries
  };
}
function numOrNull(v) {
  return v === "" || v === undefined ? null : v;
}
// 整数の列（throat_condition / voice_quality など）へ書くための丸め。
// ★null と 0 を取り違えないこと。0 は「記録された0」で、null は「記録が無い」です。
function intOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}
function computeTimeGapHours(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // 日をまたぐ場合（例: 夕食19:00→就寝1:00）
  return roundTo1(diff / 60);
}
// lavoce-収集データ拡張案.md D節: スマホのマイクで環境騒音レベルを測定する（A-2の自動版）。
// キャリブレーションされたマイクではないため、あくまで「参考値」としての推定dB。
// マイクの音声データ自体は端末内で処理するだけで、サーバーには送らない・保存しない。
async function measureAmbientNoise(durationMs = 2000) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("このブラウザではマイクを使用できません");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioCtx();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const dataArray = new Float32Array(analyser.fftSize);
    const samples = [];
    const start = Date.now();
    await new Promise((resolve) => {
      function sample() {
        analyser.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
        samples.push(Math.sqrt(sumSquares / dataArray.length));
        if (Date.now() - start < durationMs) {
          requestAnimationFrame(sample);
        } else {
          resolve();
        }
      }
      sample();
    });
    await audioContext.close();
    const avgRms = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
    const dbfs = avgRms > 0 ? 20 * Math.log10(avgRms) : -100;
    // dBFS（デジタル満杯を0とする相対値）を、体感的に馴染みのある実世界のdB表示に近づけるための
    // ざっくりした補正。正式な音圧レベル（dB SPL）ではなく、あくまで日ごとの相対比較用の目安。
    return Math.round(Math.max(30, Math.min(110, 90 + dbfs)));
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
// ---- lavoce-収集データ拡張案.md A-3: CPPS（平滑化ケプストラムピーク突出度）計算用のDSP一式 ----
// 基数2クーリー・タッキーFFT（in-place）。fftSize は2の累乗である必要がある。
function fftInPlace(real, imag) {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr0 = Math.cos(ang), wi0 = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1, curWi = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = real[i + j], ui = imag[i + j];
        const half = i + j + len / 2;
        const vr = real[half] * curWr - imag[half] * curWi;
        const vi = real[half] * curWi + imag[half] * curWr;
        real[i + j] = ur + vr; imag[i + j] = ui + vi;
        real[half] = ur - vr; imag[half] = ui - vi;
        const nextWr = curWr * wr0 - curWi * wi0;
        const nextWi = curWr * wi0 + curWi * wr0;
        curWr = nextWr; curWi = nextWi;
      }
    }
  }
}
function hannWindow(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  return w;
}
// 頑健な直線回帰（IRLS: 反復重み付け最小二乗法、Huber重み）。
// Praatの仕様書は「通常の最小二乗法はピーク自身に直線が引っ張られて精度が落ちる」として
// デフォルトでTheilの頑健回帰を使うと明記しているため、それに準じた近似をここで行う。
// 通常のOLSで初期直線を引いた後、残差の大きい点（＝ピーク自身など）の重みを下げて再フィットする。
function robustLinearFitPredict(xs, ys, predictAtX) {
  const n = xs.length;
  if (n < 2) return ys[0] || 0;
  let weights = new Array(n).fill(1);
  let slope = 0, intercept = 0;
  for (let iter = 0; iter < 4; iter++) {
    let sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      sw += w; swx += w * xs[i]; swy += w * ys[i];
      swxx += w * xs[i] * xs[i]; swxy += w * xs[i] * ys[i];
    }
    const denom = sw * swxx - swx * swx;
    if (Math.abs(denom) < 1e-9) break;
    slope = (sw * swxy - swx * swy) / denom;
    intercept = (swy - slope * swx) / sw;
    // 残差からHuber重みを再計算（残差が大きい点＝外れ値ほど重みを下げる）
    const residuals = xs.map((x, i) => ys[i] - (intercept + slope * x));
    const absRes = residuals.map(Math.abs).sort((a, b) => a - b);
    const mad = absRes[Math.floor(n / 2)] || 1e-6;
    const scale = Math.max(1.4826 * mad, 1e-6);
    const k = 1.345 * scale;
    weights = residuals.map((r) => (Math.abs(r) <= k ? 1 : k / Math.abs(r)));
  }
  return intercept + slope * predictAtX;
}
// 1フレーム分のCPP（ケプストラムピーク突出度、dB）を計算する。
// ①窓かけ済みフレームをFFT → 対数振幅スペクトル(dB) → それを再度FFTしてケプストラムを得る
// ②ケプストラム上で、想定F0範囲（60〜400Hz）に対応するクフレンシー区間の最大値を探す
// ③その区間全体に回帰直線（ベースライン）をあてはめ、ピークとベースラインの差（突出度）を返す
function computeCPPForFrame(windowedFrame, sampleRate, fftSize) {
  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) real[i] = windowedFrame[i];
  fftInPlace(real, imag);
  const logMag = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    logMag[i] = 20 * Math.log10(mag + 1e-6);
  }
  const cepReal = new Float64Array(fftSize);
  const cepImag = new Float64Array(fftSize);
  for (let i = 0; i < fftSize; i++) cepReal[i] = logMag[i];
  fftInPlace(cepReal, cepImag);
  // fftInPlace は正規化しない生のDFTのため、逆変換相当のここでは 1/N を掛けて正規化する。
  for (let i = 0; i < fftSize; i++) cepReal[i] /= fftSize;
  const minQuefBin = Math.max(2, Math.round(sampleRate / 400)); // 400Hzに相当する最短周期
  const maxQuefBin = Math.min(Math.floor(fftSize / 2) - 1, Math.round(sampleRate / 60)); // 60Hzに相当する最長周期
  if (maxQuefBin <= minQuefBin) return null;
  let peakIdx = minQuefBin, peakVal = -Infinity;
  for (let i = minQuefBin; i <= maxQuefBin; i++) {
    if (cepReal[i] > peakVal) { peakVal = cepReal[i]; peakIdx = i; }
  }
  // トレンド直線（背景ノイズの傾向線）は、Praatの仕様書に倣いピーク探索範囲より広い
  // クフレンシー0.001〜0.05秒相当の範囲全体で当てはめる（狭い範囲だとピーク自身に直線が引っ張られやすい）。
  const trendLoBin = Math.max(2, Math.round(sampleRate * 0.001));
  const trendHiBin = Math.min(Math.floor(fftSize / 2) - 1, Math.round(sampleRate * 0.05));
  const xs = [], ys = [];
  for (let i = trendLoBin; i <= trendHiBin; i++) { xs.push(i); ys.push(cepReal[i]); }
  const baselineAtPeak = robustLinearFitPredict(xs, ys, peakIdx);
  return peakVal - baselineAtPeak;
}
// 録音全体からCPPS（フレームごとのCPPを時間方向に平滑化=平均した値）を求める。
function computeCPPS(samples, sampleRate) {
  const fftSize = 2048;
  const hop = 1024;
  const win = hannWindow(fftSize);
  const cppValues = [];
  for (let start = 0; start + fftSize <= samples.length; start += hop) {
    const frame = new Float64Array(fftSize);
    let energy = 0;
    for (let i = 0; i < fftSize; i++) {
      frame[i] = samples[start + i] * win[i];
      energy += frame[i] * frame[i];
    }
    const rms = Math.sqrt(energy / fftSize);
    if (rms < 0.005) continue; // 無音に近いフレームは声が乗っていないと判断して除外
    const cpp = computeCPPForFrame(frame, sampleRate, fftSize);
    if (cpp != null && Number.isFinite(cpp)) cppValues.push(cpp);
  }
  if (cppValues.length === 0) return null;
  return cppValues.reduce((a, b) => a + b, 0) / cppValues.length;
}
// マイクからdurationMsぶん録音し、Blobとして返す。
async function recordAudioBlob(durationMs) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("このブラウザではマイクを使用できません");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  try {
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    recorder.start();
    await new Promise((resolve) => setTimeout(resolve, durationMs));
    recorder.stop();
    await stopped;
    return new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
// 録音Blobを、解析可能な生のPCMサンプル列（Float32Array）に変換する。
async function decodeAudioBlob(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioCtx();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return { samples: audioBuffer.getChannelData(0), sampleRate: audioBuffer.sampleRate };
  } finally {
    await audioContext.close();
  }
}
// 「あー」を録音してCPPSを算出する、一連の流れをまとめた関数。
// 録音データ自体（音声そのもの）はどこにも保存せず、数値化した後は破棄する。
async function recordAndAnalyzeCPPS(durationMs = 5000) {
  const blob = await recordAudioBlob(durationMs);
  const { samples, sampleRate } = await decodeAudioBlob(blob);
  const cpps = computeCPPS(samples, sampleRate);
  if (cpps == null) throw new Error("声が十分に録音できませんでした。もう一度お試しください。");
  return Math.round(cpps * 10) / 10;
}
// 職業別データと分析の確定仕様 §4.2: 話声位（SFF）の計算。
// YIN法で短いフレームごとの基本周波数(F0)を推定し、有声区間（声が乗っている区間）だけを集め、
// その中央値をSFFとする（平均ではなく中央値。外れ値に強いという文書の指定通り）。
function estimateF0Yin(frame, sampleRate) {
  const threshold = 0.15;
  const maxLag = Math.floor(sampleRate / 75); // 75Hzまで（低い男声の下限を想定）
  const minLag = Math.floor(sampleRate / 400); // 400Hzまで（高い女声・裏声を想定）
  const n = frame.length;
  const diff = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      const d = frame[i] - frame[i + lag];
      sum += d * d;
    }
    diff[lag] = sum;
  }
  let cumulative = 0;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[minLag] = 1;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    cumulative += diff[lag];
    cmnd[lag] = diff[lag] / (cumulative / (lag - minLag + 1));
  }
  let tau = -1;
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (cmnd[lag] < threshold) {
      tau = lag;
      while (tau + 1 <= maxLag && cmnd[tau + 1] < cmnd[tau]) tau++;
      break;
    }
  }
  if (tau === -1) return null; // 無声（声が乗っていない）区間
  return sampleRate / tau;
}
// 定型文の3秒録音から、話声位（SFF）を算出する。
async function recordAndAnalyzeSFF(durationMs = 3000) {
  const blob = await recordAudioBlob(durationMs);
  const { samples, sampleRate } = await decodeAudioBlob(blob);
  const frameSize = Math.floor(sampleRate * 0.04); // 40msフレーム
  const hopSize = Math.floor(frameSize / 2);
  const f0s = [];
  for (let start = 0; start + frameSize <= samples.length; start += hopSize) {
    const frame = samples.subarray(start, start + frameSize);
    // 無音区間はスキップ（RMSが小さすぎる区間は解析しない）
    let rms = 0;
    for (let i = 0; i < frame.length; i++) rms += frame[i] * frame[i];
    rms = Math.sqrt(rms / frame.length);
    if (rms < 0.01) continue;
    const f0 = estimateF0Yin(frame, sampleRate);
    if (f0 != null && f0 >= 75 && f0 <= 400) f0s.push(f0);
  }
  if (f0s.length < 5) throw new Error("声が十分に録音できませんでした。もう一度お試しください。");
  f0s.sort((a, b) => a - b);
  const mid = Math.floor(f0s.length / 2);
  const median = f0s.length % 2 === 0 ? (f0s[mid - 1] + f0s[mid]) / 2 : f0s[mid];
  return Math.round(median * 10) / 10;
}
// ---- CPPS計算用DSP ここまで ----
// 前日の記録から、声のコンディションに影響しやすい要因を抽出する。
// flagKey は「今日」タブの短い警告表示に、explainKey は分析タブの理論的な解説文に対応する。
function computeConditionFlags(y) {
  const dinnerGap = computeTimeGapHours(y.dinnerTime, y.bedtime);
  const flags = [];
  if (dinnerGap != null && dinnerGap < 3) flags.push({ flagKey: "flagDinnerGap", explainKey: "explainDinnerGap" });
  if (typeof y.sleepHours === "number" && y.sleepHours < 6) flags.push({ flagKey: "flagShortSleep", explainKey: "explainShortSleep" });
  if (entryHasActivityKind(y, "本番") || entryHasActivityKind(y, "リハーサル")) flags.push({ flagKey: "flagHeavyVoiceUse", explainKey: "explainHeavyVoiceUse" });
  if ((y.dinnerTags || []).includes("アルコール")) flags.push({ flagKey: "flagAlcohol", explainKey: "explainAlcohol" });
  if ((y.dinnerTags || []).includes("カフェイン")) flags.push({ flagKey: "flagCaffeine", explainKey: "explainCaffeine" });
  return { dinnerGap, flags };
}
// activities[] の中から「その日の主たる活動」（時間が最長のブロック）を導出する。
// これは保存しない派生値であり、旧フィールド（後方互換用）を埋めるためだけに使う。
function derivePrimaryActivityLegacy(activities) {
  if (!activities || activities.length === 0) return null;
  return activities.reduce((a, b) => ((Number(b.minutes) || 0) >= (Number(a.minutes) || 0) ? b : a));
}
// その日のactivities[]の中に、指定した種別のブロックが1つでもあるか（例: 本番があった日の判定）。
// 「主たる活動（最長のブロック）」だけを見ると、短い本番を自主練の後に入れた日を見逃すため、
// 配列全体を確認する。
function entryHasActivityKind(entry, kind) {
  if (entry && Array.isArray(entry.activities) && entry.activities.length > 0) {
    return entry.activities.some((a) => a.kind === kind);
  }
  return entry && entry.activityType === kind;
}
function entryToRow(userId, e) {
  const activities = e.activities || [];
  const primary = derivePrimaryActivityLegacy(activities);
  const legacyRepertoire = activities
    .flatMap((a) => (a.items || []).map((it) => (it.repertoireName || "").trim()))
    .filter(Boolean)
    .join("、");
  const isRecoveryDay = activities.length === 0 && !!e.recovery;
  // 本番ブロックはactivity.detail.performanceQualityに保存されるようになったため、
  // 後方互換の日次フィールドはそこから導出する（複数の本番ブロックがあれば最初のものを採用）。
  const performanceBlock = activities.find((a) => a.kind === "本番" && a.detail && a.detail.performanceQuality != null);
  const derivedPerformanceQuality = performanceBlock ? performanceBlock.detail.performanceQuality : e.performanceQuality;
  // §3.4: 簡易モード（食品を1件も記録していない）のときは、3択から推定したマクロを使う。
  const hasDetailedMeals = (e.meals || []).length > 0;
  const simpleMacros = !hasDetailedMeals ? e.simpleMealMacros : null;
  // lavoce-作業計画v2-構造変更の分離.md §5 Step4: 声の記録を新しいVoiceEntry[]で
  // 入力した日は、旧フィールド（throat_condition等）をそこから導出した値で保存する。
  // 既存の数十個の分析機能はすべて旧フィールドを読むため、この導出だけで動き続ける。
  const voiceLegacy = deriveLegacyVoiceFieldsFromEntries(e.voiceEntries);
  return {
    user_id: userId,
    date: e.date,
    throat_condition: numOrNull(voiceLegacy ? voiceLegacy.throatCondition : e.throatCondition),
    voice_quality: numOrNull(voiceLegacy ? voiceLegacy.voiceQuality : e.voiceQuality),
    throat_symptoms: (voiceLegacy ? voiceLegacy.throatSymptoms : e.throatSymptoms) || [],
    sleep_hours: numOrNull(e.sleepHours),
    sleep_quality: numOrNull(e.sleepQuality),
    meal_notes: e.mealNotes,
    location: e.location,
    temperature: numOrNull(e.temperature),
    humidity: numOrNull(e.humidity),
    // 以下4つは後方互換用の派生値。新しい読み込みはすべて activities / recovery を見る。
    activity_type: primary ? primary.kind : (isRecoveryDay ? "休養" : (e.activityType || null)),
    activity_duration: primary ? (Number(primary.minutes) || 0) : (isRecoveryDay ? 0 : numOrNull(e.activityDuration)),
    repertoire: legacyRepertoire || null,
    activity_detail: primary
      ? (primary.detail || {})
      : (isRecoveryDay ? { restMethods: e.recovery.methods || [], restMethodOther: e.recovery.note || "" } : (e.activityDetail || {})),
    performance_quality: numOrNull(derivedPerformanceQuality),
    ease: numOrNull(e.ease),
    notes: e.notes,
    weight_kg: numOrNull(e.weightKg),
    body_fat_pct: numOrNull(e.bodyFatPct),
    protein_level: numOrNull(e.proteinLevel),
    calorie_level: numOrNull(e.calorieLevel),
    water_intake: Object.values(e.waterBySlot || {}).reduce((total, v) => total + (Number(v) || 0), 0),
    carbs_g: hasDetailedMeals ? sumMacro(e.meals, "carbs") : (simpleMacros ? simpleMacros.carbsG : numOrNull(e.carbs)),
    protein_g: hasDetailedMeals ? sumMacro(e.meals, "protein") : (simpleMacros ? simpleMacros.proteinG : numOrNull(e.protein)),
    fat_g: hasDetailedMeals ? sumMacro(e.meals, "fat") : (simpleMacros ? simpleMacros.fatG : numOrNull(e.fat)),
    fiber_g: hasDetailedMeals ? sumMacro(e.meals, "fiber") : (simpleMacros ? simpleMacros.fiberG : numOrNull(e.fiber)),
    exercise_minutes: (e.exercises || []).reduce((total, x) => total + (Number(x.minutes) || 0), 0),
    meals: (e.meals || []).map((m) => ({ ...m, carbs: numOrNull(m.carbs), protein: numOrNull(m.protein), fat: numOrNull(m.fat), fiber: numOrNull(m.fiber) })),
    exercises: (e.exercises || []).map((x) => ({ ...x, minutes: numOrNull(x.minutes) })),
    voice_checkins: (voiceLegacy ? voiceLegacy.voiceCheckins : e.voiceCheckins) || {},
    water_by_slot: e.waterBySlot || {},
    weather: e.weather || null,
    mental_reason: e.mentalReason || "",
    mental_tags: e.mentalTags || [],
    throat_symptoms_other: e.throatSymptomsOther || "",
    voice_memo: (voiceLegacy ? voiceLegacy.voiceMemo : e.voiceMemo) || "",
    wake_note: (voiceLegacy ? voiceLegacy.wakeNote : e.wakeNote) || "",
    routine_note: (voiceLegacy ? voiceLegacy.routineNote : e.routineNote) || "",
    resonance_score: numOrNull(voiceLegacy ? voiceLegacy.resonanceScore : e.resonanceScore),
    bedtime: e.bedtime || "",
    dinner_time: e.dinnerTime || "",
    dinner_tags: e.dinnerTags || [],
    load_detail: e.loadDetail || {},
    cycle_start: !!e.cycleStart,
    medication_tags: e.medicationTags || [],
    ambient_noise_db: numOrNull(e.ambientNoiseDb),
    flight_hours: numOrNull(e.flightHours),
    jetlag_hours: numOrNull(e.jetlagHours),
    pianissimo_high_note: (voiceLegacy ? voiceLegacy.pianissimoHighNote : e.pianissimoHighNote) || "",
    pianissimo_onset_delay: !!e.pianissimoOnsetDelay,
    speaking_level: numOrNull(e.speakingLevel),
    non_performance_speech_minutes: numOrNull(e.nonPerformanceSpeechMinutes),
    longest_speech_block_minutes: numOrNull(e.longestSpeechBlockMinutes),
    environment_tags: e.environmentTags || [],
    noisy_environment: !!e.noisyEnvironment,
    cpps_value: numOrNull(e.cppsValue),
    exercise_level: numOrNull(e.exerciseLevel),
    activities,
    recovery: e.recovery || null,
    voice_entries: e.voiceEntries || []
  };
}

/* ---------- small components ---------- */
function Gauge({ score, t }) {
  const cx = 100, cy = 100, r = 78, sw = 16;
  const segs = [0, 1, 2, 3, 4].map((i) => ({
    d: describeArc(cx, cy, r, 180 - i * 36, 180 - (i + 1) * 36),
    // ★メーターに危険ゾーンを塗らない（§7-4）。目盛りは一色の下地にする。
    color: SERIES.grid
  }));
  const f = score == null ? 0.5 : Math.max(0, Math.min(1, (score - 1) / 4));
  const needleAngle = 180 * (1 - f);
  const tip = polarPoint(cx, cy, r - sw / 2 - 4, needleAngle);
  const dyn = levelDynamic(score);
  const color = score == null ? C.inkSoft : levelInk(score);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" style={{ width: "100%", maxWidth: 260 }}>
        {segs.map((s, i) => (
          <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={sw} strokeLinecap="butt" opacity={score == null ? 0.35 : 0.9} />
        ))}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill={C.ink} />
      </svg>
      <div className="text-center -mt-2">
        <div className="ff-display italic leading-none" style={{ fontSize: "2.75rem", color }}>{dyn}</div>
        <div className="ff-mono text-xs tracking-widest uppercase mt-1" style={{ color: C.inkSoft }}>
          {score == null ? t("noRecord") : `${t("overallLabel")} ${score.toFixed(1)} / 5`}
        </div>
      </div>
    </div>
  );
}

function DynamicsSelector({ label, icon: Icon, value, onChange, t }) {
  const dynDescKeys = ["dynDesc1", "dynDesc2", "dynDesc3", "dynDesc4", "dynDesc5"];
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: C.gold }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: C.line }}>
        {LEVEL_DYNAMICS.map((dyn, i) => {
          const v = i + 1;
          const active = value === v;
          return (
            <button
              key={dyn}
              type="button"
              onClick={() => onChange(v)}
              className="flex-1 py-2.5 ff-display italic transition-all"
              style={{
                fontSize: active ? "1.35rem" : "1.05rem",
                background: active ? LEVEL_COLORS[i] : C.card,
                color: active ? "#FFFDF8" : C.inkSoft,
                borderRight: i < 4 ? `1px solid ${C.line}` : "none"
              }}
            >
              {dyn}
            </button>
          );
        })}
      </div>
      <div className="text-xs mt-1 text-right ff-mono" style={{ color: C.inkSoft }}>{t ? t(dynDescKeys[value - 1]) : LEVEL_DYNAMIC_DESC[value - 1]}</div>
    </div>
  );
}

function DotSelector({ label, icon: Icon, value, onChange, lowLabel, highLabel }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color: C.gold }} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs ff-mono w-14" style={{ color: C.inkSoft }}>{lowLabel}</span>
        <div className="flex gap-2 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className="rounded-full transition-all"
              style={{
                width: value === v ? 26 : 20,
                height: value === v ? 26 : 20,
                // ★色は1つ。いくつ塗られているかで値を表す（§1-2）。
                background: v <= value ? SERIES.s2 : C.card,
                border: `1.5px solid ${v <= value ? SERIES.s2 : C.line}`
              }}
              aria-label={`${label} ${v}`}
            />
          ))}
        </div>
        <span className="text-xs ff-mono w-14 text-right" style={{ color: C.inkSoft }}>{highLabel}</span>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
      style={{
        background: active ? C.curtain : C.card,
        color: active ? "#FFFDF8" : C.inkSoft,
        borderColor: active ? C.curtain : C.line
      }}
    >
      {label}
    </button>
  );
}

// 記録と分析の順番設計 §3.3: 入力した欄が、その場で1行返す。
// ★自分比の事実だけを返す。良し悪しの判定はしない（罰を作らない原則）。
function SectionFeedback({ text }) {
  if (!text) return null;
  return (
    <p className="text-xs mt-3 rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
      {text}
    </p>
  );
}
function SectionCard({ title, icon: Icon, children, id, highlighted }) {
  const ref = useRef(null);
  useEffect(() => {
    if (highlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);
  return (
    <div ref={ref} id={id} className="rounded-2xl p-4 sm:p-5 border" style={{
      background: C.card, borderColor: highlighted ? C.gold : C.line, borderWidth: highlighted ? 2 : 1,
      transition: "border-color 2s ease, border-width 2s ease"
    }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} style={{ color: C.curtain }} />
        <h3 className="ff-display italic text-lg">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// 記録日数がまだ解放条件に届いていないときに表示する、進捗つきの「予告編」カード。
// 灰色の空箱ではなく、うっすらとしたプレビューと「あと◯日」の進捗バーを見せることで、
// 記録を続ける動機にする（lavoce-指標設計図.md の「ロックの見せ方」参照）。
// 指導者プラン実装仕様 §7: レッスン日程をカレンダーで見せる。既存の月次カレンダー（記録閲覧用）と
// 同じ月送りの仕組み（monthMeta/shiftMonth）を再利用する。先生用ページ・レッスンモードの両方で使う。
// lavoce-カレンダー連携パッチ.md §4.2: 1件ずつ「カレンダーに追加」（即時）。
// 外部連携（OAuth）は一切不要。テンプレートURLと.icsファイルの生成だけで成立する。
function formatDateForGoogleCalendar(date) {
  // Googleカレンダーのテンプレート URLはUTC基準の "YYYYMMDDTHHMMSSZ" 形式を期待する。
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function buildGoogleCalendarUrl(lesson, title) {
  const start = new Date(lesson.scheduled_at);
  const end = new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatDateForGoogleCalendar(start)}/${formatDateForGoogleCalendar(end)}`,
    details: lesson.note || ""
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
function formatDateForICS(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function downloadLessonICS(lesson, title) {
  const start = new Date(lesson.scheduled_at);
  const end = new Date(start.getTime() + (lesson.duration_minutes || 60) * 60000);
  // §9: 外部カレンダーへの自動書き込み・双方向同期は作らない。1件だけの.icsダウンロードにとどめる。
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//La Voce//Lesson//JA",
    "BEGIN:VEVENT",
    `UID:${lesson.id}@lavoce`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART:${formatDateForICS(start)}`,
    `DTEND:${formatDateForICS(end)}`,
    `SUMMARY:${title}`,
    lesson.note ? `DESCRIPTION:${lesson.note.replace(/\n/g, "\\n")}` : "",
    "END:VEVENT", "END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lesson-${lesson.id.slice(0, 8)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
// レッスンの詳細に添える「カレンダーに追加」の小さなボタン群。
function AddToCalendarButtons({ lesson, title, t }) {
  return (
    <div className="flex gap-2 mt-1">
      <a href={buildGoogleCalendarUrl(lesson, title)} target="_blank" rel="noopener noreferrer"
        className="text-xs underline" style={{ color: C.curtain }}>{t ? t("addToGoogleCalendar") : "Googleカレンダーに追加"}</a>
      <button type="button" onClick={() => downloadLessonICS(lesson, title)}
        className="text-xs underline" style={{ color: C.curtain }}>{t ? t("downloadICS") : ".icsをダウンロード"}</button>
    </div>
  );
}
function LessonCalendar({ lessons, onDayClick, selectable, getTeacherName, getStudentName, t }) {
  const [viewMonth, setViewMonth] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDetailDate, setSelectedDetailDate] = useState(null);
  const lessonsByDate = useMemo(() => {
    const map = {};
    (lessons || []).forEach((l) => {
      const iso = toISODate(new Date(l.scheduled_at));
      (map[iso] = map[iso] || []).push(l);
    });
    return map;
  }, [lessons]);
  const { daysInMonth, startWeekday } = monthMeta(viewMonth.year, viewMonth.month);
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, iso, lessons: lessonsByDate[iso] || [] });
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={() => setViewMonth((m) => shiftMonth(m, -1))} style={{ color: C.inkSoft }}><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium">{viewMonth.year}年{viewMonth.month + 1}月</span>
        <button type="button" onClick={() => setViewMonth((m) => shiftMonth(m, 1))} style={{ color: C.inkSoft }}><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
          <span key={w} className="text-xs" style={{ color: C.inkSoft }}>{w}</span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const hasLesson = c.lessons.length > 0;
          return (
            <button key={i} type="button" disabled={!selectable && !hasLesson}
              onClick={() => { if (selectable) onDayClick && onDayClick(c.iso); else if (hasLesson) setSelectedDetailDate(c.iso === selectedDetailDate ? null : c.iso); }}
              className="rounded-lg py-1.5 text-xs relative"
              style={{
                background: hasLesson ? C.curtain : "transparent", color: hasLesson ? "#FFFDF8" : C.ink,
                boxShadow: c.iso === selectedDetailDate ? `0 0 0 2px ${C.gold}` : "none"
              }}>
              {c.day}
            </button>
          );
        })}
      </div>
      {!selectable && selectedDetailDate && lessonsByDate[selectedDetailDate] && (
        <div className="mt-3 space-y-1.5">
          {lessonsByDate[selectedDetailDate].map((l) => {
            const withWhom = (getTeacherName && l.teacher_id && `${getTeacherName(l.teacher_id)}先生`)
              || (getStudentName && l.student_id && `${getStudentName(l.student_id)}さん`) || "";
            const title = `レッスン${withWhom ? `（${withWhom}）` : ""}`;
            return (
              <div key={l.id} className="rounded-lg p-2 text-xs" style={{ background: C.paper }}>
                <span className="ff-mono">{new Date(l.scheduled_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
                {getTeacherName && l.teacher_id && <span>　{getTeacherName(l.teacher_id)}先生</span>}
                {getStudentName && l.student_id && <span>　{getStudentName(l.student_id)}さん</span>}
                {l.note && <span>　{l.note}</span>}
                <AddToCalendarButtons lesson={l} title={title} t={t} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// §3-D: 推移の線に添える点。
// ★線は補助（不透明度0.3）で、主役は点。重なっても数えられるよう面の色で縁取る。
//   本番・レッスンの日だけ大きく、別の色にする。★色と大きさの両方で区別すること。
function trendDot(props) {
  const { cx, cy, payload, index } = props;
  if (cx == null || cy == null) return null;
  const key = payload && payload.isKeyDay;
  return (
    <circle key={index} cx={cx} cy={cy}
      r={key ? 4.8 : 3.2}
      fill={key ? SERIES.s2 : SERIES.s1}
      stroke={C.card} strokeWidth={key ? 1.8 : 1.6} />
  );
}

// 分析画面の描画仕様.md §3-A: 数値ヒーローに添えるスパークライン。
// ★数字だけでは「今日が良い日なのか」が分からない。推移を横に添えるだけで読める。
//   96×26px、軸も目盛りも付けない。点は最新の1つだけ。
function Sparkline({ values, width = 96, height = 26 }) {
  const vals = (values || []).filter((v) => typeof v === "number").slice(-14);
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 3;
  const x = (i) => pad + (i / (vals.length - 1)) * (width - pad * 2);
  const y = (v) => height - pad - ((v - min) / span) * (height - pad * 2);
  const d = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} style={{ flexShrink: 0 }} aria-hidden="true">
      <path d={d} fill="none" stroke={SERIES.s1} strokeWidth={1.8} opacity={0.3} />
      <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r={3.2} fill={SERIES.s1} />
    </svg>
  );
}

// §3-C: 1次元の点列。★リング表示の置き換え。
// リングは「7／9日中」しか言えないが、点列は順位と散らばりを同時に見せる。
// 良い日と悪い日がどれくらい離れているかが分かる。
function DotStrip({ values, today, height = 46 }) {
  const vals = (values || []).filter((v) => typeof v === "number");
  if (vals.length < 2) return null;
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const pad = 10;
  const w = 100;
  const x = (v) => pad + ((v - min) / span) * (w - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", maxWidth: 260 }} aria-hidden="true">
      {/* 目盛りは3本だけ（§3-C） */}
      {[0, 0.5, 1].map((f) => (
        <line key={f} x1={pad + f * (w - pad * 2)} x2={pad + f * (w - pad * 2)}
          y1={height - 14} y2={height - 10} stroke={SERIES.grid} strokeWidth={0.6} />
      ))}
      <line x1={pad} x2={w - pad} y1={height - 12} y2={height - 12} stroke={SERIES.grid} strokeWidth={0.6} />
      {/* 過去の日。★色は増やさず、淡いほうで描く */}
      {vals.map((v, i) => (
        <circle key={i} cx={x(v)} cy={height - 22} r={2.2} fill={SERIES.pale} opacity={0.85} />
      ))}
      {/* 今日。少し大きく、上にラベル */}
      {typeof today === "number" && (
        <>
          <circle cx={x(today)} cy={height - 22} r={3.6} fill={SERIES.s1} />
          <text x={x(today)} y={height - 30} textAnchor="middle" fontSize="7" fill={SERIES.axis}>今日</text>
        </>
      )}
    </svg>
  );
}

// 分析画面の描画仕様.md §3-F: 進捗ドット。件数が足りない全てのカードで使う。
// ★「データがありません」と書かないための部品（§7-11）。
//   9px の丸を10個、たまった分だけ SERIES.s2、残りは SERIES.grid。
//   文言は「◯日分たまりました。あと◯日で、判定を始められます。」
//   ★描画仕様 §3-F は「傾向を出せます」と書いていましたが、
//     分析の検出力と族の設計.md §2-2 がこれを改めています。新しいほうが正。
// ★§3-E 2群のドットプロット。判定が出たときだけ出す。
//   ・1日ぶんの点を全部描く（重なりは縦にずらす）
//   ・各群の中央値を縦線で示し、数値を直接ラベルする
//   ・軸は下に1本。★棒グラフにしない
function GroupDotPlot({ values1, values0, label1, label0, width = 260, rowHeight = 34 }) {
  const all = [...(values1 || []), ...(values0 || [])].filter((v) => typeof v === "number");
  if (all.length === 0) return null;
  const lo = Math.min(...all), hi = Math.max(...all);
  const span = hi - lo || 1;
  const padX = 8;
  const x = (v) => padX + ((v - lo) / span) * (width - padX * 2);
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const rows = [
    { vals: values1 || [], label: label1, y: rowHeight * 0.5 },
    { vals: values0 || [], label: label0, y: rowHeight * 1.5 }
  ];
  const height = rowHeight * 2 + 18;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", maxWidth: width }}>
      {rows.map((row, ri) => {
        const med = row.vals.length ? median(row.vals) : null;
        return (
          <g key={ri}>
            <text x={0} y={row.y - 11} style={{ fontSize: 9, fill: C.inkSoft }}>{row.label}（{row.vals.length}日）</text>
            {row.vals.map((v, i) => (
              <circle key={i} cx={x(v)} cy={row.y + ((i % 3) - 1) * 4} r={3.2}
                fill={SERIES.s1} fillOpacity={0.45} stroke={C.card} strokeWidth={1.6} />
            ))}
            {med != null && (
              <>
                <line x1={x(med)} y1={row.y - 9} x2={x(med)} y2={row.y + 9} stroke={C.ink} strokeWidth={1.4} />
                <text x={x(med)} y={row.y + 18} textAnchor="middle" style={{ fontSize: 9, fill: C.ink }}>
                  {Math.round(med * 10) / 10}
                </text>
              </>
            )}
          </g>
        );
      })}
      <line x1={padX} y1={height - 12} x2={width - padX} y2={height - 12} stroke={C.line} strokeWidth={1} />
      <text x={padX} y={height - 2} style={{ fontSize: 9, fill: C.inkSoft }}>低い</text>
      <text x={width - padX} y={height - 2} textAnchor="end" style={{ fontSize: 9, fill: C.inkSoft }}>高い</text>
    </svg>
  );
}
// ★§3-I 散布図。点のみ。★回帰直線・近似曲線を引かない。
//   引いた瞬間に「予測」になり、3ゲートの外に出る。
//   ρ の値は数値で添える（図の上に線として描かない）。
function CorrelationScatter({ pairs, xLabel, yLabel, width = 260, height = 150 }) {
  const pts = (pairs || []).filter((p) => typeof p.x === "number" && typeof p.y === "number");
  if (pts.length === 0) return null;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const xLo = Math.min(...xs), xHi = Math.max(...xs);
  const yLo = Math.min(...ys), yHi = Math.max(...ys);
  const padL = 26, padB = 20, padT = 6, padR = 6;
  const px = (v) => padL + ((v - xLo) / ((xHi - xLo) || 1)) * (width - padL - padR);
  const py = (v) => height - padB - ((v - yLo) / ((yHi - yLo) || 1)) * (height - padB - padT);
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", maxWidth: width }}>
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke={C.line} strokeWidth={1} />
      <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke={C.line} strokeWidth={1} />
      {pts.map((p, i) => (
        <circle key={i} cx={px(p.x)} cy={py(p.y)} r={3.2}
          fill={SERIES.s1} fillOpacity={0.45} stroke={C.card} strokeWidth={1.6} />
      ))}
      <text x={width - padR} y={height - 6} textAnchor="end" style={{ fontSize: 9, fill: C.inkSoft }}>{xLabel}</text>
      <text x={2} y={padT + 8} style={{ fontSize: 9, fill: C.inkSoft }}>{yLabel}</text>
    </svg>
  );
}
// ★§3-G 期間の帯＋点。周期など、繰り返す期間どうしを並べて比べる。
//   ・行は直近6件まで。横軸は「何日目か」（★日付ではない）
//   ・帯は薄く、点は「ふつう以上」と「低い」で描き分ける
//   ★この図に解釈の文章を添えないこと。
//     並べれば、本人が自分で気づきます。教えないでください。
//   ★位相の呼び名（卵胞期・黄体期など）を書かないこと（周期記録の設計 §2）。
function PeriodBands({ rows, maxDay = 35, width = 280, rowHeight = 18 }) {
  const list = (rows || []).slice(-6);
  if (list.length === 0) return null;
  const padL = 18, padR = 8;
  const x = (day) => padL + ((day - 1) / Math.max(1, maxDay - 1)) * (width - padL - padR);
  const height = list.length * rowHeight + 16;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block", maxWidth: width }}>
      {list.map((row, ri) => {
        const y = ri * rowHeight + rowHeight / 2;
        const last = Math.min(maxDay, row.length || maxDay);
        return (
          <g key={ri}>
            <rect x={x(1)} y={y - 4} width={Math.max(2, x(last) - x(1))} height={8} rx={4}
              fill={CYCLE_BAND} fillOpacity={0.22} />
            {(row.points || []).filter((p) => p.day <= maxDay).map((p, i) => (
              <circle key={i} cx={x(p.day)} cy={y} r={3.2}
                fill={p.low ? C.inkSoft : SERIES.s1} fillOpacity={p.low ? 0.5 : 0.75}
                stroke={C.card} strokeWidth={1.4} />
            ))}
          </g>
        );
      })}
      <line x1={padL} y1={height - 11} x2={width - padR} y2={height - 11} stroke={C.line} strokeWidth={1} />
      {[1, 7, 14, 21, 28].filter((d) => d <= maxDay).map((d) => (
        <text key={d} x={x(d)} y={height - 1} textAnchor="middle" style={{ fontSize: 8, fill: C.inkSoft }}>{d}</text>
      ))}
    </svg>
  );
}
// ★オン・オフの切り替え。かんたん表示では、つまみをやめて2つのボタンにする
//   （見やすさ §3-2）。つまみは「いまどちらなのか」が読み取りにくく、
//   小さくて狙いにくい。選んだほうに✓を付けて、言葉で示す。
//   ★同じ切り替えを画面ごとに書かないこと。ここ1つにそろえる。
// ★削除は2段階（見やすさ §4-2）。「消しますか」→「消す」。
//   1回で消える削除を作らないこと。押し間違いは必ず起きる。
//   ★同じ2段階を画面ごとに書かない。ここ1つにそろえる。
function DeleteWithConfirm({ confirming, onAsk, onCancel, onDelete, t }) {
  if (!confirming) {
    return (
      <button type="button" onClick={onAsk} className="text-xs underline mt-1 inline-action"
        style={{ color: C.inkSoft }}>
        {t("deleteButton")}
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <span className="text-xs" style={{ color: C.ink }}>{t("confirmDeleteNote")}</span>
      <button type="button" onClick={onDelete} className="px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ background: C.curtain, color: "#FFFDF8" }}>
        {t("deleteButton")}
      </button>
      <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-full text-xs"
        style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>
        {t("cancelLabel")}
      </button>
    </div>
  );
}
function TwoWaySwitch({ on, onChange, simple, onLabel = "あり", offLabel = "なし" }) {
  if (simple) {
    return (
      <div className="flex gap-2 flex-shrink-0">
        {[{ v: true, label: onLabel }, { v: false, label: offLabel }].map((opt) => {
          const active = on === opt.v;
          return (
            <button key={String(opt.v)} type="button" onClick={() => onChange(opt.v)}
              className="rounded-xl border px-4 py-2 text-sm"
              style={{
                background: active ? C.paper : C.card,
                borderColor: active ? C.ink : C.line,
                color: C.ink,
                fontWeight: active ? 600 : 400
              }}>
              {active ? "✓ " : ""}{opt.label}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex-shrink-0"
      style={{
        width: 44, height: 26, borderRadius: 999, position: "relative",
        background: on ? C.curtain : C.line, transition: "background 0.15s"
      }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 999, background: "#FFFDF8",
        transition: "left 0.15s"
      }} />
    </button>
  );
}
function ProgressDots({ current, required }) {
  const total = 10;
  const filled = required > 0 ? Math.min(total, Math.round((current / required) * total)) : 0;
  const remaining = Math.max(0, required - current);
  return (
    <div>
      <div className="flex gap-[5px] my-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{
            width: 9, height: 9, borderRadius: "50%", display: "block",
            background: i < filled ? SERIES.s2 : SERIES.grid
          }} />
        ))}
      </div>
      {/* ★「傾向を出せます」と書いてはいけない（分析の検出力と族の設計.md §2-2）。
          あと4日でたまるのは「判定を始められる件数」であって、
          はっきりした関係が見えるまでには、ふつう3〜4か月かかります。
          4日で何か分かるかのように書くのは、事実と違います。 */}
      <p className="text-xs" style={{ color: SERIES.axis }}>
        {remaining > 0
          ? `${current}日分たまりました。あと${remaining}日で、判定を始められます。`
          : `${current}日分たまりました。`}
      </p>
    </div>
  );
}

// action: { label, onClick } を渡すと、進捗の下にひかえめな行き先を足せます。
// ★カードの形そのものは変えないこと。ここに独自の見た目を作ると、
//   「ロック中のカード」が2種類できて、並んだときにちぐはぐになります。
//   実際にそうなっていました（片方だけボタン、進捗の点も日数も無し）。
// ★ロック中のカードは1種類だけ。見た目も1つにそろえる。
//   行き先があるカードは、カードごと押せます。ボタンを1枚だけ足すと
//   「なぜこれだけ特別なのか」が生まれるため、別の部品にしません。
//
//   ★見た目は変えません（ご指定）。ただし、目に見えない押し場所は
//     支援技術から辿れなくなるので、行き先があるときだけ <button> にし、
//     読み上げ用の説明を付けます。見え方は同じまま、キーボードと
//     スクリーンリーダーからは届きます。
function LockedCard({ title, teaser, current, required, action }) {
  const Tag = action ? "button" : "div";
  const tagProps = action
    ? { type: "button", onClick: action.onClick, "aria-label": `${title}：${action.label}` }
    : {};
  return (
    <Tag {...tagProps}
      className="rounded-2xl p-4 border overflow-hidden relative w-full text-left"
      style={{ background: C.card, borderColor: C.line }}>
      {/* ★ぼかした飾りを、うしろへ回します。
          これまでは飾りが高さを決め、その上に文字を absolute で重ねていました。
          飾りの高さは px 固定なのに、重ねた文字は文字サイズで伸びます。
          「とても大きい」では文字が飾りの高さを越え、overflow-hidden で
          刈られて、鍵と見出しが重なって見えていました。
          ★高さは文字の側が決めるべきです。飾りが決めてはいけません。
          飾りの寸法も em にして、文字と一緒に伸びるようにしました。 */}
      <div aria-hidden="true" className="absolute inset-0 p-4"
        style={{ filter: "blur(3px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
        <h3 className="ff-display italic text-lg mb-2">{title}</h3>
        <div className="flex items-end gap-1.5" style={{ height: "4em" }}>
          {[40, 65, 30, 80, 50, 90, 60].map((h, i) => (
            <div key={i} style={{ width: "0.6em", height: `${h}%`, background: C.gold, borderRadius: 3 }} />
          ))}
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center gap-2 px-6 py-3 text-center" style={{ background: "rgba(255,253,248,0.55)", minHeight: "7em" }}>
        <Lock size={18} style={{ color: C.inkSoft }} />
        <p className="text-xs font-medium" style={{ color: C.ink }}>{title}</p>
        <p className="text-xs" style={{ color: C.inkSoft }}>{teaser}</p>
        {/* ★§3-F: 進捗は棒ではなく点で出す。「今日の記録」の点と同じ形にそろえる。
            記録と分析の順番設計 §5.4 の「ぼかし＋進捗＋具体的な条件」の3点セットは
            そのまま満たしている（進捗の見せ方が棒から点に変わっただけ）。 */}
        <div className="w-full max-w-[220px] mt-1 flex flex-col items-center">
          <ProgressDots current={current} required={required} />
        </div>
      </div>
    </Tag>
  );
}

// 音域到達マップ用の簡易ピアノ鍵盤。白鍵を等幅で並べ、黒鍵を近似位置に重ねる。
// 下段の帯で「自己ベスト（グレー）」と「選んだ期間の到達範囲（色つき）」を示す。
function PianoKeyboard({ lowMidi, highMidi, bestLow, bestHigh, currentLow, currentHigh, newRecord, pianissimoMidi }) {
  const WHITE_OFFSET = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };
  const BLACK_OFFSET = { 1: 0.68, 3: 1.68, 6: 3.68, 8: 4.68, 10: 5.68 };
  const startOctave = Math.floor(lowMidi / 12);
  const endOctave = Math.floor(highMidi / 12);
  const numOctaves = Math.max(1, endOctave - startOctave + 1);
  const totalWhite = numOctaves * 7;
  const whiteKeyPct = 100 / totalWhite;
  const xOf = (m) => {
    const oct = Math.floor(m / 12) - startOctave;
    const mod = ((m % 12) + 12) % 12;
    return WHITE_OFFSET[mod] !== undefined ? oct * 7 + WHITE_OFFSET[mod] : oct * 7 + BLACK_OFFSET[mod];
  };
  const blackKeyMidis = [];
  for (let o = 0; o < numOctaves; o++) {
    [1, 3, 6, 8, 10].forEach((mod) => blackKeyMidis.push((startOctave + o) * 12 + mod));
  }
  return (
    <div style={{ position: "relative", height: 76, marginTop: 4 }}>
      <div style={{ display: "flex", height: 48 }}>
        {Array.from({ length: totalWhite }).map((_, i) => (
          <div key={i} style={{ flex: 1, border: `1px solid ${C.line}`, background: C.paper, borderRadius: "0 0 3px 3px" }} />
        ))}
      </div>
      {blackKeyMidis.map((m) => (
        <div key={m} style={{ position: "absolute", top: 0, left: `${xOf(m) * whiteKeyPct}%`, width: `${whiteKeyPct * 0.62}%`, height: 30, background: C.ink, borderRadius: "0 0 2px 2px" }} />
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 56, height: 5, borderRadius: 3, background: C.line, opacity: 0.4 }} />
      {bestLow != null && bestHigh != null && (
        <div style={{ position: "absolute", left: `${xOf(bestLow) * whiteKeyPct}%`, width: `${Math.max(2, (xOf(bestHigh) + 1 - xOf(bestLow)) * whiteKeyPct)}%`, top: 56, height: 5, borderRadius: 3, background: C.line }} />
      )}
      {currentLow != null && currentHigh != null && (
        <div style={{ position: "absolute", left: `${xOf(currentLow) * whiteKeyPct}%`, width: `${Math.max(2, (xOf(currentHigh) + 1 - xOf(currentLow)) * whiteKeyPct)}%`, top: 64, height: 6, borderRadius: 3, background: newRecord ? C.gold : C.sage }} />
      )}
      {pianissimoMidi != null && (
        <div title={`弱声の最高音: ${midiToNoteLabel(pianissimoMidi)}`}
          style={{
            position: "absolute", left: `${(xOf(pianissimoMidi) + 0.5) * whiteKeyPct}%`, top: 50,
            width: 0, height: 0, transform: "translateX(-50%)",
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${C.curtain}`
          }} />
      )}
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1, min = -Infinity, max = Infinity, suffix, icon: Icon }) {
  const round = (n) => Math.round(n * 100) / 100;
  const clamp = (n) => round(Math.max(min, Math.min(max, n)));
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon size={14} style={{ color: C.gold }} />}
        <label className="text-sm font-medium">{label}</label>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(clamp((Number(value) || 0) - step))}
          className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={(e) => { if (e.target.value !== "") onChange(clamp(Number(e.target.value))); }}
          onWheel={(e) => e.target.blur()}
          className="w-full text-center rounded-lg border py-1.5 ff-mono"
          style={{ borderColor: C.line, background: C.paper, color: C.ink }}
        />
        <button type="button" onClick={() => onChange(clamp((Number(value) || 0) + step))}
          className="w-10 h-10 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
          <Plus size={14} />
        </button>
        {suffix && <span className="text-xs ff-mono shrink-0 w-8" style={{ color: C.inkSoft }}>{suffix}</span>}
      </div>
    </div>
  );
}

// 「今日の負荷」——職業ごとに意味のある指標だけを、共通の抽象スキーマ（type/durationMin/intensity + 職業別の追加項目）で記録する。
// 分析エンジン側は type を見て解釈するため、ここは「どの項目を見せるか」の設定だけを担う。
function LoadTracker({ profession, loadDetail, onChange, t }) {
  // ★「その他」は職業固有の項目を一切出さない。
  //   以前は未知の職業を声楽家にフォールバックしていたため、「その他」を選んだ人に
  //   音域・パッサッジョ通過数といった声楽家向けの欄が出てしまう状態だった。
  const fields = profession === OTHER_PROFESSION ? [] : (LOAD_FIELDS_BY_PROFESSION[profession] || LOAD_FIELDS_BY_PROFESSION.singer);
  const update = (patch) => onChange({ ...loadDetail, ...patch });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label={t("loadDurationMin")} value={loadDetail.durationMin ?? ""} step={5} min={0} max={600}
          suffix={t("unitMinutes")} onChange={(v) => update({ durationMin: v })} />
        <div>
          <label className="text-sm font-medium block mb-1.5">{t("loadIntensity")}</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => update({ intensity: n })}
                className="flex-1 h-10 rounded-lg border text-sm font-medium"
                style={{
                  background: (loadDetail.intensity || 0) >= n ? C.curtain : C.paper,
                  color: (loadDetail.intensity || 0) >= n ? "#FFFDF8" : C.inkSoft,
                  borderColor: (loadDetail.intensity || 0) >= n ? C.curtain : C.line
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((f) => {
          if (f.type === "text") {
            return (
              <div key={f.key}>
                <label className="text-sm font-medium block mb-1.5">{t(f.labelKey)}</label>
                <input type="text" value={loadDetail[f.key] || ""} placeholder={f.placeholderKey ? t(f.placeholderKey) : ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
              </div>
            );
          }
          if (f.type === "number") {
            return (
              <NumberField key={f.key} label={t(f.labelKey)} value={loadDetail[f.key] ?? ""} step={1} min={0} max={200}
                onChange={(v) => update({ [f.key]: v })} />
            );
          }
          if (f.type === "boolean") {
            return (
              <div key={f.key}>
                <label className="text-sm font-medium block mb-1.5">{t(f.labelKey)}</label>
                <div className="flex gap-2">
                  <Chip label={t("labelYes")} active={loadDetail[f.key] === true} onClick={() => update({ [f.key]: true })} />
                  <Chip label={t("labelNo")} active={loadDetail[f.key] === false} onClick={() => update({ [f.key]: false })} />
                </div>
              </div>
            );
          }
          if (f.type === "select") {
            return (
              <div key={f.key}>
                <label className="text-sm font-medium block mb-1.5">{t(f.labelKey)}</label>
                <MiniSelect value={loadDetail[f.key] || f.options[0]} onChange={(v) => update({ [f.key]: v })} options={f.options} />
              </div>
            );
          }
          if (f.type === "scale5") {
            return (
              <div key={f.key}>
                <label className="text-sm font-medium block mb-1.5">{t(f.labelKey)}</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => update({ [f.key]: n })}
                      className="flex-1 h-9 rounded-lg border text-xs font-medium"
                      style={{
                        background: (loadDetail[f.key] || 0) >= n ? C.gold : C.paper,
                        color: (loadDetail[f.key] || 0) >= n ? "#FFFDF8" : C.inkSoft,
                        borderColor: (loadDetail[f.key] || 0) >= n ? C.gold : C.line
                      }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function MiniSelect({ value, onChange, options, labels }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border text-xs px-2 py-1.5"
      style={{ borderColor: C.line, background: C.paper, color: C.ink }}
    >
      {options.map((o) => <option key={o} value={o}>{labels ? labels[o] : o}</option>)}
    </select>
  );
}

function MiniNumber({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      onWheel={(e) => e.target.blur()}
      className="w-full rounded-lg border text-xs px-2 py-1.5 ff-mono text-center"
      style={{ borderColor: C.line, background: C.paper, color: C.ink }}
    />
  );
}

function roundTo1(n) {
  return Math.round(n * 10) / 10;
}
// 配列の中央値を求める（本番ピーキング曲線の逆算プランで使用）
function median(arr) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
// ---- lavoce-曲目複数化パッチ.md 用の純関数群 ----
// §3.1: 活動ブロック内の時間配分。①個別入力(override)を確定 → ②残りを標準演奏時間の比で按分
// → ③標準演奏時間が1つもなければ等分。allocations は items と同じ並びの配列で返す。
function allocateActivityMinutes(totalMinutes, items, standardMinutesLookup) {
  const total = Number(totalMinutes) || 0;
  const hasOverride = items.map((it) => it.minutesOverride != null && it.minutesOverride !== "" && !Number.isNaN(Number(it.minutesOverride)));
  const overrideSum = items.reduce((s, it, i) => s + (hasOverride[i] ? Number(it.minutesOverride) : 0), 0);
  const remaining = total - overrideSum;
  const withoutIdx = items.map((_, i) => i).filter((i) => !hasOverride[i]);
  const allocations = items.map((it, i) => (hasOverride[i] ? Number(it.minutesOverride) : 0));
  if (withoutIdx.length > 0 && remaining > 0) {
    const lookup = standardMinutesLookup || (() => null);
    const standardVals = withoutIdx.map((i) => lookup(items[i].repertoireName)).filter((v) => typeof v === "number" && v > 0);
    if (standardVals.length > 0) {
      const med = median(standardVals);
      const weights = withoutIdx.map((i) => {
        const v = lookup(items[i].repertoireName);
        return (typeof v === "number" && v > 0) ? v : med;
      });
      const sumW = weights.reduce((a, b) => a + b, 0);
      withoutIdx.forEach((i, k) => { allocations[i] = sumW > 0 ? (remaining * weights[k]) / sumW : remaining / withoutIdx.length; });
    } else {
      const equalShare = remaining / withoutIdx.length;
      withoutIdx.forEach((i) => { allocations[i] = equalShare; });
    }
  }
  return { allocations, remaining, overflow: remaining < 0 };
}
// §4: 活動ブロック a の負荷 L_a = Σ_i (minutes_i × actW_a × songFactor_i)。曲が0件なら minutes×actW。
// songFactorResolver(repertoireName) は songFactor（数値）または null を返す関数。
function computeActivityBlockLoad(activity, songFactorResolver) {
  const actW = ACTIVITY_LOAD_WEIGHT[activity.kind] ?? 1.0;
  const minutes = Number(activity.minutes) || 0;
  const items = activity.items || [];
  if (items.length === 0) {
    return { total: minutes * actW, perItem: [] };
  }
  const lookup = (name) => {
    const rec = songFactorResolver && songFactorResolver.tessituraMap ? songFactorResolver.tessituraMap[name] : null;
    if (!rec) return null;
    return rec.standardMinutes || null;
  };
  const { allocations } = allocateActivityMinutes(minutes, items, lookup);
  const perItem = items.map((it, i) => {
    const rec = songFactorResolver && songFactorResolver.tessituraMap ? songFactorResolver.tessituraMap[it.repertoireName] : null;
    let songFactor = 1.0;
    if (rec && songFactorResolver.resolveD) {
      const resolved = songFactorResolver.resolveD(rec);
      if (resolved) songFactor = songFactorFromD(resolved.d);
    }
    const load = allocations[i] * actW * songFactor;
    return { repertoireName: it.repertoireName, minutes: allocations[i], songFactor, load };
  });
  return { total: perItem.reduce((s, x) => s + x.load, 0), perItem };
}
// §4: その日の発声負荷 L_day = Σ_a L_a。既存ACWRのcomputeDailyLoadを置き換える、activities[]対応版。
function computeDayLoadFromActivities(activities, songFactorResolver) {
  return (activities || []).reduce((sum, a) => sum + computeActivityBlockLoad(a, songFactorResolver).total, 0);
}
// ---- 曲目複数化パッチ 用純関数群 ここまで ----
// 音名（国際式、例: "C4", "G#3", "Bb4"）を MIDI ノート番号に変換する。パースできなければ null。
function noteToMidi(noteStr) {
  if (!noteStr || typeof noteStr !== "string") return null;
  const match = noteStr.trim().match(/^([A-Ga-g])([#♯b♭]?)(-?\d+)$/);
  if (!match) return null;
  const letter = match[1].toUpperCase();
  const accidental = match[2];
  const octave = parseInt(match[3], 10);
  const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[letter];
  let semitone = base;
  if (accidental === "#" || accidental === "♯") semitone += 1;
  if (accidental === "b" || accidental === "♭") semitone -= 1;
  return (octave + 1) * 12 + semitone;
}
// ---- lavoce-レパートリー負荷パッチ.md 用の純関数群 ----
// §2.2 曲目名の正規化：表示は必ずtitleRaw、照合にだけtitleNormalizedを使う。
function normalizeTitle(raw) {
  if (!raw) return "";
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s　]+/g, " ")
    .replace(/[・･]/g, "")
    .replace(/[「」『』"'"']/g, "")
    .replace(/[（(][^）)]*[）)]/g, "")
    .trim();
}
// §2.4 近い名前の警告に使うレーベンシュタイン距離
function levenshteinDistance(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
// §1.2 負荷計算式の修正。較正（§6）で書き換えられるよう定数を分離してある。
const REPERTOIRE_GAMMA = 1.7;
const REPERTOIRE_KAPPA = 0.6;
const REPERTOIRE_TESSITURA_OFFSET = 5; // 最高音からテッシトゥーラを推定する際の初期オフセット（半音）
function computeSongFactor(tessMidi, lowMidi, highMidi) {
  if (lowMidi == null || highMidi == null || highMidi <= lowMidi || tessMidi == null) return null;
  const center = (lowMidi + highMidi) / 2;
  const half = (highMidi - lowMidi) / 2;
  const d = (tessMidi - center) / half;
  return { d, songFactor: songFactorFromD(d) };
}
function songFactorFromD(d) {
  const strainRaw = Math.pow(Math.abs(d) / 0.85, REPERTOIRE_GAMMA);
  let strain = d >= 0 ? strainRaw : strainRaw * REPERTOIRE_KAPPA;
  strain = Math.max(0, Math.min(1.5, strain));
  return 1.0 + 1.5 * strain;
}
// ---- レパートリー負荷パッチ 用純関数群 ここまで ----
// MIDI ノート番号を音名表記（国際式）に戻す。
function midiToNoteLabel(midi) {
  if (midi == null || Number.isNaN(midi)) return "-";
  const rounded = Math.round(midi); // パーセンタイル計算などで小数のMIDI値が来ても崩れないようにする
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(rounded / 12) - 1;
  const name = names[((rounded % 12) + 12) % 12];
  return `${name}${octave}`;
}
const ACTIVITY_CHART_COLORS = { "休養": C.sageSoft, "自主練習": C.sage, "レッスン": C.gold, "リハーサル": C.rust, "本番": C.curtain };
// カタカナをひらがなに変換する（読み仮名検索のための正規化）
function toHiragana(str) {
  return (str || "").replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}
function normalizeForSearch(str) {
  return toHiragana((str || "").trim().toLowerCase());
}
// 食品名を現在の表示言語で返す（翻訳が無ければ日本語名のまま）
function foodDisplayName(foodItem, language) {
  if (!foodItem) return "";
  if (language && language !== "ja" && foodItem.i18n && foodItem.i18n[language]) {
    return foodItem.i18n[language];
  }
  return foodItem.name;
}
function FoodNameAutocomplete({ value, foodLibrary, onNameChange, onSelectFood, t, language }) {
  const [open, setOpen] = useState(false);
  const q = normalizeForSearch(value);
  // クエリが「料理グループ」の同義語辞書のキー（例：パスタ、米）に一致するか調べ、
  // 一致していれば、そのグループに属するキーワードを含む食品名も検索対象に加える。
  const groupKeywords = q
    ? Object.keys(DISH_GROUP_ALIASES)
        .filter((key) => {
          const keyNorm = normalizeForSearch(key);
          return keyNorm.includes(q) || q.includes(keyNorm);
        })
        .flatMap((key) => DISH_GROUP_ALIASES[key])
    : [];
  // クエリが「イタリアン」「和食」「中華」のような料理ジャンル名に一致する場合、
  // そのジャンルに属する食品をカテゴリで直接まとめて候補に出す。
  const matchedCategories = q
    ? Object.keys(CATEGORY_SEARCH_ALIASES).filter((cat) => {
        const catNorm = normalizeForSearch(cat);
        if (catNorm.includes(q) || q.includes(catNorm)) return true;
        return CATEGORY_SEARCH_ALIASES[cat].some((alias) => alias.includes(q) || q.includes(alias));
      })
    : [];
  const matches = q
    ? (foodLibrary || []).filter((f) => {
        const nameNorm = normalizeForSearch(f.name);
        const readingNorm = f.reading ? normalizeForSearch(f.reading) : "";
        // 現在の表示言語での多言語名（i18n）も検索対象にする。
        // これにより、例えば英語表示中に "chicken" と入力しても、
        // 日本語名や読み仮名にその文字が無い品目でも見つかるようになる。
        const i18nNorm = f.i18n && language && f.i18n[language] ? normalizeForSearch(f.i18n[language]) : "";
        // 原語表記（中国語の簡体字、イタリア語など）は、表示言語に関わらず常に検索対象にする。
        const nativeNorm = f.nativeTerm ? normalizeForSearch(f.nativeTerm) : "";
        if (nameNorm.includes(q) || (readingNorm && readingNorm.includes(q)) || (i18nNorm && i18nNorm.includes(q)) || (nativeNorm && nativeNorm.includes(q))) return true;
        if (f.category && matchedCategories.includes(f.category)) return true;
        return groupKeywords.some((kw) => nameNorm.includes(kw) || (readingNorm && readingNorm.includes(kw)));
      }).slice(0, 8)
    : [];
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        placeholder={t("placeholderFoodNameSearch")}
        onChange={(e) => {
          const v = e.target.value;
          onNameChange(v);
          setOpen(true);
          const exact = (foodLibrary || []).find((f) => f.name === v);
          if (exact) onSelectFood(exact);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border text-xs px-2 py-1.5"
        style={{ borderColor: C.line, background: C.card, color: C.ink }}
      />
      {open && matches.length > 0 && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-lg border overflow-hidden max-h-60 overflow-y-auto"
          style={{ background: C.card, borderColor: C.line, zIndex: 20, boxShadow: "0 6px 16px rgba(36,25,20,0.15)" }}
        >
          {matches.map((f, i) => {
            const displayName = foodDisplayName(f, language);
            const showJapaneseSuffix = language && language !== "ja" && f.i18n && f.i18n[language];
            return (
              <button
                key={f.name}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelectFood(f); setOpen(false); }}
                className="w-full text-left px-2.5 py-2 text-xs"
                style={{ color: C.ink, borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}
              >
                {f.isPreset && <span className="ff-mono mr-1" style={{ color: C.inkSoft }}>[{t("labelPreset")}{f.unit ? `・1${f.unit}${t("labelUnitAvailable")}` : ""}]</span>}
                {displayName}
                {showJapaneseSuffix && <span className="ml-1" style={{ color: C.inkSoft, fontSize: "0.85em" }}>（{f.name}）</span>}
                <span className="ml-1.5" style={{ color: C.inkSoft }}>
                  {f.isPreset
                    ? t("labelNutrientAbbrPer100g").replace("{carbs}", f.carbs).replace("{protein}", f.protein).replace("{fat}", f.fat).replace("{fiber}", f.fiber)
                    : t("labelNutrientAbbr").replace("{carbs}", f.carbs || 0).replace("{protein}", f.protein || 0).replace("{fat}", f.fat || 0).replace("{fiber}", f.fiber || 0)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MealItemRow({ item, onChange, onRemove, foodLibrary, t, language }) {
  function setQty(qtyMode, qtyInput) {
    const base = item.presetBase || { carbs: 0, protein: 0, fat: 0, fiber: 0 };
    const grams = qtyMode === "unit" ? (Number(qtyInput) || 0) * (item.presetUnitWeight || 0) : (Number(qtyInput) || 0);
    const factor = grams / 100;
    onChange({
      ...item, qtyMode, qtyInput, grams,
      carbs: roundTo1(base.carbs * factor), protein: roundTo1(base.protein * factor),
      fat: roundTo1(base.fat * factor), fiber: roundTo1(base.fiber * factor)
    });
  }
  function handleSelectFood(f) {
    if (f.isPreset) {
      const hasUnit = !!f.unit;
      const qtyMode = hasUnit ? "unit" : "g";
      const qtyInput = hasUnit ? 1 : 100;
      const grams = hasUnit ? f.unitWeight : 100;
      const factor = grams / 100;
      onChange({
        ...item, name: f.name, isPreset: true, presetI18n: f.i18n || null,
        presetBase: { carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber },
        presetUnit: f.unit || null,
        presetUnitWeight: f.unitWeight || null,
        qtyMode, qtyInput, grams,
        carbs: roundTo1(f.carbs * factor), protein: roundTo1(f.protein * factor),
        fat: roundTo1(f.fat * factor), fiber: roundTo1(f.fiber * factor)
      });
    } else {
      onChange({ ...item, name: f.name, isPreset: false, presetBase: null, presetI18n: null, presetUnit: null, presetUnitWeight: null, grams: "", carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber });
    }
  }
  const translatedLabel = item.isPreset && language && language !== "ja" && item.presetI18n && item.presetI18n[language];
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.paper }}>
      <div className="flex items-center gap-2 mb-2">
        <FoodNameAutocomplete
          value={item.name}
          foodLibrary={foodLibrary}
          t={t}
          language={language}
          onNameChange={(name) => onChange({ ...item, name, isPreset: false, presetBase: null, presetI18n: null })}
          onSelectFood={handleSelectFood}
        />
        <button type="button" onClick={onRemove} className="shrink-0" style={{ color: C.inkSoft }}>
          <X size={15} />
        </button>
      </div>
      {translatedLabel && (
        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>🌐 {translatedLabel}</p>
      )}

      {item.isPreset ? (
        <>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>{t("labelQuantityShort")}</span>
            <MiniNumber value={item.qtyInput ?? item.grams} onChange={(v) => setQty(item.qtyMode || "g", v)} placeholder={item.qtyMode === "unit" ? item.presetUnit : "g"} />
            {item.presetUnit ? (
              <div className="flex rounded-lg border overflow-hidden shrink-0" style={{ borderColor: C.line }}>
                <button type="button" onClick={() => setQty("g", item.grams || 0)}
                  className="px-2 py-1 text-xs" style={{ background: item.qtyMode !== "unit" ? C.curtain : C.card, color: item.qtyMode !== "unit" ? "#FFFDF8" : C.inkSoft }}>g</button>
                <button type="button" onClick={() => setQty("unit", roundTo1((item.grams || 0) / (item.presetUnitWeight || 1)))}
                  className="px-2 py-1 text-xs" style={{ background: item.qtyMode === "unit" ? C.curtain : C.card, color: item.qtyMode === "unit" ? "#FFFDF8" : C.inkSoft }}>{item.presetUnit}</button>
              </div>
            ) : (
              <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>g</span>
            )}
            <button type="button" onClick={() => onChange({ ...item, isPreset: false, presetBase: null })}
              className="text-xs shrink-0 underline ml-auto" style={{ color: C.inkSoft }}>{t("btnManualEdit")}</button>
          </div>
          {item.qtyMode === "unit" && (
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
              {t("labelUnitConversion").replace("{unit}", item.presetUnit).replace("{weight}", item.presetUnitWeight).replace("{total}", item.grams)}
            </p>
          )}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div><div className="text-xs" style={{ color: C.inkSoft }}>{t("macroCarbs")}</div><div className="ff-mono text-xs font-medium">{item.carbs}g</div></div>
            <div><div className="text-xs" style={{ color: C.inkSoft }}>{t("macroProtein")}</div><div className="ff-mono text-xs font-medium">{item.protein}g</div></div>
            <div><div className="text-xs" style={{ color: C.inkSoft }}>{t("macroFat")}</div><div className="ff-mono text-xs font-medium">{item.fat}g</div></div>
            <div><div className="text-xs" style={{ color: C.inkSoft }}>{t("macroFiber")}</div><div className="ff-mono text-xs font-medium">{item.fiber}g</div></div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Wheat size={11} />{t("macroCarbs")}g</div>
            <MiniNumber value={item.carbs} onChange={(v) => onChange({ ...item, carbs: v })} />
          </div>
          <div>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Egg size={11} />{t("macroProtein")}g</div>
            <MiniNumber value={item.protein} onChange={(v) => onChange({ ...item, protein: v })} />
          </div>
          <div>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Droplet size={11} />{t("macroFat")}g</div>
            <MiniNumber value={item.fat} onChange={(v) => onChange({ ...item, fat: v })} />
          </div>
          <div>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Leaf size={11} />{t("macroFiber")}g</div>
            <MiniNumber value={item.fiber} onChange={(v) => onChange({ ...item, fiber: v })} />
          </div>
        </div>
      )}
    </div>
  );
}

// lavoce-曲目複数化パッチ.md §2.1: 曲目1行分。サジェスト・登録フォーム・近似曲目警告を
// 行ごとに自前で持つ（親でどの行が登録中かを追跡する必要がなく、状態管理がシンプルになる）。
function RepertoireItemRow({
  item, index, totalItems, onChange, onRemove, onMoveUp, onMoveDown,
  repertoireTessituraMap, repertoireUsageCounts, repertoireSkipped, setRepertoireSkipped,
  handleSaveRepertoire, tessituraSaving, professions, roleMasterMap, projectMasterMap,
  handleSaveRole, handleSaveProject, handleSaveSingingLanguage, t
}) {
  const [topNoteInput, setTopNoteInput] = useState("");
  const [tessituraOptionalInput, setTessituraOptionalInput] = useState("");
  const [showTessituraAccordion, setShowTessituraAccordion] = useState(false);
  const [dOverrideChoice, setDOverrideChoice] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [showExtraAccordion, setShowExtraAccordion] = useState(false);
  const isSinger = (professions || []).includes("singer");
  const isVoiceActor = (professions || []).includes("voice_actor");
  const isAnnouncer = (professions || []).includes("announcer");

  const name = item.repertoireName || "";
  const record = name ? repertoireTessituraMap[name] : null;
  const norm = name ? normalizeTitle(name) : "";
  const usageSoFar = norm ? ((repertoireUsageCounts[norm] && repertoireUsageCounts[norm].count) || 0) : 0;
  const suggestions = name && !record
    ? Object.entries(repertoireTessituraMap)
        .filter(([n]) => n !== name && normalizeTitle(n).includes(norm))
        .sort((a, b) => (repertoireUsageCounts[normalizeTitle(b[0])]?.count || 0) - (repertoireUsageCounts[normalizeTitle(a[0])]?.count || 0))
        .slice(0, 3)
    : [];

  return (
    <div className="rounded-xl border p-2.5" style={{ borderColor: C.line, background: C.paper }}>
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col" style={{ gap: 1 }}>
          <button type="button" disabled={index === 0} onClick={onMoveUp} style={{ opacity: index === 0 ? 0.3 : 1, color: C.inkSoft, lineHeight: 1 }}>▲</button>
          <button type="button" disabled={index === totalItems - 1} onClick={onMoveDown} style={{ opacity: index === totalItems - 1 ? 0.3 : 1, color: C.inkSoft, lineHeight: 1 }}>▼</button>
        </div>
        <input type="text" value={name} placeholder={t("placeholderRepertoireExample")}
          onChange={(e) => { onChange({ repertoireName: e.target.value }); setDuplicateWarning(null); }}
          className="flex-1 rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.card }} />
        <input type="number" value={item.minutesOverride ?? ""} placeholder="自動"
          onChange={(e) => onChange({ minutesOverride: e.target.value === "" ? null : Number(e.target.value) })}
          className="rounded-lg border p-1.5 text-xs ff-mono" style={{ width: "4.5em", borderColor: C.line, background: C.card }} />
        <span className="text-xs flex-shrink-0" style={{ color: C.inkSoft }}>分</span>
        <button type="button" onClick={onRemove} className="flex-shrink-0" style={{ color: C.inkSoft }}><X size={14} /></button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-1.5 rounded-lg border overflow-hidden" style={{ borderColor: C.line }}>
          {suggestions.map(([n, rec]) => (
            <button key={n} type="button" onClick={() => onChange({ repertoireName: n })}
              className="w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between"
              style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
              <span>{n}</span>
              <span className="ff-mono flex-shrink-0 ml-2" style={{ color: C.inkSoft }}>{rec.topNote || rec.tessituraNote || ""}</span>
            </button>
          ))}
        </div>
      )}

      {name && !record && (() => {
        const shouldPrompt = usageSoFar === 0 || usageSoFar === 2;
        if (!shouldPrompt || repertoireSkipped[norm]) return null;

        if (duplicateWarning && duplicateWarning.forName === name) {
          return (
            <div className="mt-2 rounded-lg p-2" style={{ background: C.card }}>
              <p className="text-xs font-medium mb-1.5">似た曲目が登録されています</p>
              <p className="text-xs mb-1.5" style={{ color: C.ink }}>
                「{duplicateWarning.existingName}」（{duplicateWarning.existingRecord.topNote || duplicateWarning.existingRecord.tessituraNote}）
              </p>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { onChange({ repertoireName: duplicateWarning.existingName }); setDuplicateWarning(null); }}
                  className="flex-1 py-1 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>同じ曲です</button>
                <button type="button" onClick={() => setDuplicateWarning({ ...duplicateWarning, confirmed: true })}
                  className="flex-1 py-1 rounded-full text-xs font-medium" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>別の曲です</button>
              </div>
            </div>
          );
        }

        return (
          <div className="mt-2 rounded-lg p-2" style={{ background: C.card }}>
            <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>「{name}」の最高音は？（登録すると次回から自動で使われます）</p>
            <input type="text" value={topNoteInput} placeholder={t("placeholderNoteExample")}
              onChange={(e) => setTopNoteInput(e.target.value)}
              className="w-full rounded-lg border p-1.5 text-xs mb-1.5" style={{ borderColor: C.line, background: C.paper }} />
            <details className="text-xs mb-1.5" open={showTessituraAccordion} onToggle={(e) => setShowTessituraAccordion(e.target.open)}>
              <summary className="cursor-pointer" style={{ color: C.inkSoft }}>テッシトゥーラも入力する（任意）</summary>
              <p className="mt-1 mb-1" style={{ color: C.inkSoft }}>最高音とは別。曲全体で「だいたいこの高さ」という中心の音域です。</p>
              <input type="text" value={tessituraOptionalInput} placeholder={t("placeholderNoteExample")}
                onChange={(e) => setTessituraOptionalInput(e.target.value)}
                className="w-full rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.paper }} />
            </details>
            {dOverrideChoice === null && !topNoteInput && (
              <button type="button" onClick={() => setDOverrideChoice(0)} className="text-xs underline mb-1.5" style={{ color: C.inkSoft }}>
                音名で答えられない場合はこちら
              </button>
            )}
            {dOverrideChoice !== null && !topNoteInput && (
              <div className="flex gap-1.5 mb-1.5">
                {[["低め", -0.5], ["真ん中", 0], ["高め", 0.5]].map(([label, val]) => (
                  <button key={label} type="button" onClick={() => setDOverrideChoice(val)}
                    className="flex-1 py-1 rounded-full text-xs font-medium"
                    style={{ background: dOverrideChoice === val ? C.curtain : C.paper, color: dOverrideChoice === val ? "#FFFDF8" : C.inkSoft, border: `1px solid ${dOverrideChoice === val ? C.curtain : C.line}` }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <button type="button" disabled={tessituraSaving || (!topNoteInput && dOverrideChoice == null)}
                onClick={() => {
                  if (!duplicateWarning || !duplicateWarning.confirmed) {
                    const nearMatch = Object.keys(repertoireTessituraMap).find((existingName) => {
                      const existingNorm = normalizeTitle(existingName);
                      return existingNorm.includes(norm) || norm.includes(existingNorm) || levenshteinDistance(existingNorm, norm) <= 2;
                    });
                    if (nearMatch) {
                      setDuplicateWarning({ forName: name, existingName: nearMatch, existingRecord: repertoireTessituraMap[nearMatch], confirmed: false });
                      return;
                    }
                  }
                  handleSaveRepertoire(name, {
                    topNote: topNoteInput || null,
                    tessituraNote: tessituraOptionalInput || null,
                    dOverride: !topNoteInput && dOverrideChoice != null ? dOverrideChoice : null
                  });
                  setTopNoteInput(""); setTessituraOptionalInput(""); setDOverrideChoice(null); setDuplicateWarning(null);
                }}
                className="flex-1 py-1 rounded-full text-xs font-medium"
                style={{ background: C.curtain, color: "#FFFDF8", opacity: tessituraSaving || (!topNoteInput && dOverrideChoice == null) ? 0.5 : 1 }}>
                登録する
              </button>
              <button type="button" onClick={() => setRepertoireSkipped((prev) => ({ ...prev, [norm]: true }))}
                className="flex-1 py-1 rounded-full text-xs font-medium" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                あとで
              </button>
            </div>
          </div>
        );
      })()}
      {name && record && (
        <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
          登録済み：{record.topNote ? `最高音${record.topNote}` : ""}{record.tessituraNote ? `・テッシトゥーラ${record.tessituraNote}` : ""}{record.singingLanguage ? `・${record.singingLanguage}語` : ""}
        </p>
      )}
      {name && (isSinger || isVoiceActor || isAnnouncer) && (
        <div className="mt-1.5">
          <button type="button" onClick={() => setShowExtraAccordion((v) => !v)} className="text-xs underline" style={{ color: C.inkSoft }}>
            {isSinger ? "歌唱言語を登録" : isVoiceActor ? "役の情報を登録" : "案件の情報を登録"}
          </button>
          {showExtraAccordion && isSinger && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["伊", "独", "仏", "露", "英", "日", "西", "チェコ", "その他"].map((lang) => (
                <Chip key={lang} label={lang} active={record && record.singingLanguage === lang}
                  onClick={() => handleSaveSingingLanguage(name, lang)} />
              ))}
            </div>
          )}
          {showExtraAccordion && isVoiceActor && (() => {
            const roleRec = roleMasterMap[name] || {};
            return (
              <div className="mt-1.5 space-y-1.5">
                <input type="text" defaultValue={roleRec.workTitle || ""} placeholder="作品名"
                  onBlur={(e) => handleSaveRole(name, { ...roleRec, workTitle: e.target.value })}
                  className="w-full rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.card }} />
                <div className="flex flex-wrap gap-1.5">
                  {["地声寄り", "高め", "低め", "特殊"].map((vq) => (
                    <Chip key={vq} label={vq} active={roleRec.voiceQuality === vq}
                      onClick={() => handleSaveRole(name, { ...roleRec, voiceQuality: vq })} />
                  ))}
                </div>
              </div>
            );
          })()}
          {showExtraAccordion && isAnnouncer && (() => {
            const projRec = projectMasterMap[name] || {};
            return (
              <div className="mt-1.5 space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {["ニュース", "情報", "スポーツ実況", "ナレーション", "CM", "司会", "朗読"].map((st) => (
                    <Chip key={st} label={st} active={projRec.scriptType === st}
                      onClick={() => handleSaveProject(name, { ...projRec, scriptType: st })} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["早口", "普通", "ゆっくり"].map((sp) => (
                    <Chip key={sp} label={sp} active={projRec.speechSpeed === sp}
                      onClick={() => handleSaveProject(name, { ...projRec, speechSpeed: sp })} />
                  ))}
                  <Chip label="生放送" active={!!projRec.isLive}
                    onClick={() => handleSaveProject(name, { ...projRec, isLive: !projRec.isLive })} />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
// lavoce-画面レイアウト仕様_1.md §9: オンボーディングと同意（法的に必須）。
// 既存ユーザー（既にentriesがある）は同意画面だけを出し、新規ユーザーは5画面のフルフローにする。
const ONBOARDING_GOAL_OPTIONS = [
  { key: "diagnose", label: "不調の原因を突き止めたい" },
  { key: "peak", label: "本番に合わせたい" },
  { key: "train", label: "長く鍛えたい" },
  { key: "log_only", label: "記録だけしたい" }
];
const CONSENT_POLICY_VERSION = "2026-08-v1";
const CONSENT_DATA_CATEGORIES = [
  "喉のコンディション・声の状態（5段階評価、音の高さ）",
  "睡眠時間・就寝時刻",
  "体重・体脂肪率（入力した場合）",
  "症状（乾燥・嗄れ・咳など）",
  "心の余裕・気持ちのタグ",
  "月経周期（記録を選んだ場合のみ）",
  "既往症・診断済みの症状（登録した場合のみ）",
  "食事・運動の記録"
];
// ============================================================================
// プロフィールの恒久項目（4グループ）。
// ★「もっと > プロフィール・記録項目」と、初回登録のオンボーディングの両方で使う。
//   同じ入力欄を2箇所に書くと必ずズレるため、1つの部品にしてある。
//
//   value      … profile と同じ形のオブジェクト
//   onChange   … 変更した項目だけを渡す（{ height_cm: 170 } のような形）
//   showProfession … 職業はオンボーディングでは別のステップで聞くので、そこでは false
// ============================================================================
function ProfileFieldGroups({ value, onChange, t, showProfession = true }) {
  // professions が空のまま登録された古いデータもあるので、単一値から補う。
  // ここが空だと、職業別の出し分けが丸ごと効かなくなる。
  const currentProfessions = (value.professions && value.professions.length > 0)
    ? value.professions
    : (value.vocal_profession ? [value.vocal_profession] : []);
  return (
    <>
                  <div className="pt-6 mt-2 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <User size={17} style={{ color: C.curtain }} />
                      <h3 className="ff-display italic text-lg" style={{ color: C.curtain }}>{t("groupProfileBasic")}</h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{t("groupProfileBasicNote")}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Ruler size={14} style={{ color: C.gold }} />
                        <label className="text-sm font-medium">{t("labelHeight")}(cm)</label>
                      </div>
                      <input
                        type="number"
                        value={value.height_cm}
                        onChange={(e) => onChange({ height_cm: e.target.value === "" ? "" : Number(e.target.value) })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full rounded-lg border p-2 text-sm ff-mono"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelAge")}</label>
                      <input
                        type="number"
                        value={value.age}
                        onChange={(e) => onChange({ age: e.target.value === "" ? "" : Number(e.target.value) })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full rounded-lg border p-2 text-sm ff-mono"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelSex")}</label>
                      <select
                        value={value.sex}
                        onChange={(e) => onChange({ sex: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      >
                        <option value="">{t("sexNotAnswer")}</option>
                        <option value="男性">{t("sexMale")}</option>
                        <option value="女性">{t("sexFemale")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelVoiceType")}</label>
                      <select
                        value={value.voice_type}
                        onChange={(e) => onChange({ voice_type: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      >
                        <option value="">{t("labelSelectPlaceholder")}</option>
                        {VOICE_TYPES.map((v) => <option key={v} value={v}>{t(VOICE_TYPE_KEYS[v])}</option>)}
                      </select>
                    </div>
                  </div>

                  {showProfession && (
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelVocalProfession")}</label>
                      <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("noteVocalProfession")}</p>
                      {/* ★オンボーディングと同じく複数選択にする。
                          以前はここが単一選択で、しかも vocal_profession しか更新して
                          いなかった。職業別の出し分けは professions（配列）を見ているため、
                          この画面で職業を変えても記録画面の職業別項目が変わらなかった。
                          2つを必ず揃えて更新する。 */}
                      <div className="flex gap-2 flex-wrap">
                        {SELECTABLE_PROFESSIONS.map((p) => {
                          const selected = currentProfessions.includes(p);
                          return (
                            <button key={p} type="button"
                              onClick={() => {
                                const next = selected
                                  ? currentProfessions.filter((x) => x !== p)
                                  : [...currentProfessions, p];
                                // 1つも選ばれていない状態は作らない（オンボーディングと同じ扱い）。
                                if (next.length === 0) return;
                                onChange({ professions: next, vocal_profession: next[0] });
                              }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                              style={{
                                background: selected ? C.curtain : C.paper,
                                color: selected ? "#FFFDF8" : C.inkSoft,
                                border: `1px solid ${selected ? C.curtain : C.line}`
                              }}>
                              {t(PROFESSION_LABEL_KEYS[p])}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-2 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <HeartPulse size={17} style={{ color: C.curtain }} />
                      <h3 className="ff-display italic text-lg" style={{ color: C.curtain }}>{t("groupProfileHealth")}</h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{t("groupProfileHealthNote")}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1.5">既往症・診断済みの症状（任意）</label>
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                      選ぶと、その症状に関する専用の分析が「分析」タブに表示されるようになります。ここは診断を受けている項目だけを選ぶ場所で、疑いの有無を判定するものではありません。
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_OPTIONS.map((c) => (
                        <Chip key={c.key} label={c.label} active={(value.conditions || []).includes(c.key)}
                          onClick={() => {
                            const current = value.conditions || [];
                            onChange({ conditions: current.includes(c.key) ? current.filter((x) => x !== c.key) : [...current, c.key] });
                          }} />
                      ))}
                    </div>
                  </div>

                  {/* 職業別プロファイル設計案 §4-5: アレルギーと常用薬。
                      ★どちらも既往症(conditions)とは別に持つ。
                      「常用薬のリスト」は恒久的な情報で、「今日の服薬」
                      （entries.medication_tags）とは別物なので混ぜないこと。
                      いずれも受診用サマリーに載せるべき情報。 */}
                  <div className="rounded-xl p-3" style={{ background: C.paper }}>
                    <label className="text-sm font-medium block mb-1.5">{t("labelAllergies")}</label>
                    <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{t("noteAllergies")}</p>
                    <textarea rows={2} value={(value.allergies || []).join("\n")}
                      placeholder={t("placeholderAllergies")}
                      onChange={(e) => onChange({ allergies: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                      className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>

                  <div className="rounded-xl p-3" style={{ background: C.paper }}>
                    <label className="text-sm font-medium block mb-1.5">{t("labelRegularMedications")}</label>
                    <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{t("noteRegularMedications")}</p>
                    <textarea rows={2} value={(value.regular_medications || []).join("\n")}
                      placeholder={t("placeholderRegularMedications")}
                      onChange={(e) => onChange({ regular_medications: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
                      className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>

                  <div className="rounded-xl p-3" style={{ background: C.paper }}>
                    <label className="text-sm font-medium block mb-1.5">{t("labelHealthNotes")}</label>
                    <textarea rows={2} value={value.health_notes}
                      onChange={(e) => onChange({ health_notes: e.target.value })}
                      className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>

                  {/* ★以前は sex === "女性" のときだけ出していたため、性別が未設定の人には
                      スイッチ自体が見えず、オンにできないので「1日目」のボタンにも永久に
                      到達できなかった。性別は任意項目なので、未設定でも選べるようにする。
                      明示的に「男性」を選んだ人にだけ出さない。 */}
                  {cycleFeatureApplies(value) && (
                    <div className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: C.paper }}>
                      <div>
                        <p className="text-sm font-medium">月経周期を記録する</p>
                        <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                          周期開始日を1タップで記録し、分析タブで声・メンタルとの関連を見られるようにします。任意（オプトイン）です。
                        </p>
                      </div>
                      <TwoWaySwitch on={!!value.track_cycle} simple={isSimpleDisplay(value)}
                        onChange={(v) => onChange({ track_cycle: v })}
                        onLabel="記録する" offLabel="記録しない" />
                    </div>
                  )}

                  {/* ★オフにできる3段階（周期記録の設計.md §4-3）。
                        ① 機能ごとオフ（track_cycle = false。既定はこれ）
                        ② ホームに出さない（cycle_show_on_home = false）← ここ
                        ③ オンで表示（既定）
                      記録はしたいが、人に見られる場所には出したくない、が成り立つようにする。
                      ★「妊娠中ですか」「閉経しましたか」は聞かないこと（§4-4）。
                        オフにする導線があれば足りる。聞いた瞬間に扱いの重さが跳ね上がる。 */}
                  {cycleFeatureApplies(value) && value.track_cycle && (
                    <div className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: C.paper }}>
                      <div>
                        <p className="text-sm font-medium">ホームにも表示する</p>
                        <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                          オフにすると、記録は続けたまま、ホームの1行だけが出なくなります。ノートのカレンダーには残ります。
                        </p>
                      </div>
                      <TwoWaySwitch on={value.cycle_show_on_home !== false} simple={isSimpleDisplay(value)}
                        onChange={(v) => onChange({ cycle_show_on_home: v })}
                        onLabel="出す" offLabel="出さない" />
                    </div>
                  )}

                  <div className="pt-6 mt-2 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <Music2 size={17} style={{ color: C.curtain }} />
                      <h3 className="ff-display italic text-lg" style={{ color: C.curtain }}>{t("groupProfileVoice")}</h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{t("groupProfileVoiceNote")}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelVocalRangeLow")}</label>
                      <input type="text" value={value.vocal_range_low} placeholder={t("placeholderNoteExample")}
                        onChange={(e) => onChange({ vocal_range_low: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelVocalRangeHigh")}</label>
                      <input type="text" value={value.vocal_range_high} placeholder={t("placeholderNoteExample")}
                        onChange={(e) => onChange({ vocal_range_high: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                    </div>
                  </div>

                  <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                    <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>無理なく出せる音域（任意）</summary>
                    <p className="mt-1.5 mb-2 leading-relaxed">
                      上の音域は「出せる限界」です。曲目ごとの負荷計算では、本来はもっと狭い「無理なく出せる音域」を使うのが正確です。空欄のままなら、上の音域をそのまま使います。
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={value.comfort_range_low} placeholder={t("placeholderNoteExample")}
                        onChange={(e) => onChange({ comfort_range_low: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.card }} />
                      <input type="text" value={value.comfort_range_high} placeholder={t("placeholderNoteExample")}
                        onChange={(e) => onChange({ comfort_range_high: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.card }} />
                    </div>
                  </details>

                  {(value.vocal_profession || "singer") === "singer" && (
                    <div className="rounded-xl p-3" style={{ background: C.paper }}>
                      <p className="text-xs font-medium mb-2">{t("labelVoiceRangeRefTitle")}</p>
                      <div className="space-y-1">
                        {[
                          ["voiceSoprano", "C4 – C6"],
                          ["voiceMezzo", "A3 – A5"],
                          ["voiceAlto", "F3 – F5"],
                          ["voiceCountertenor", "G3 – E5"],
                          ["voiceTenor", "C3 – C5"],
                          ["voiceBaritone", "A2 – A4"],
                          ["voiceBass", "E2 – E4"]
                        ].map(([key, range]) => (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span style={{ color: C.inkSoft }}>{t(key)}</span>
                            <span className="ff-mono">{range}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>{t("noteVoiceRangeRef")}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium block mb-1.5">{t("labelTechnicalGoal")}</label>
                    <input type="text" value={value.technical_goal}
                      onChange={(e) => onChange({ technical_goal: e.target.value })}
                      className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>

                  <div className="pt-6 mt-2 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <Wheat size={17} style={{ color: C.curtain }} />
                      <h3 className="ff-display italic text-lg" style={{ color: C.curtain }}>{t("groupProfileNutrition")}</h3>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{t("groupProfileNutritionNote")}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelPhase")}</label>
                      <select
                        value={value.nutrition_phase}
                        onChange={(e) => onChange({ nutrition_phase: e.target.value })}
                        className="w-full rounded-lg border p-2 text-sm"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      >
                        {NUTRITION_PHASES.map((v) => <option key={v} value={v}>{t(NUTRITION_PHASE_KEYS[v])}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1.5">{t("labelProteinCoefficient")}</label>
                      <input
                        type="number" step="0.1"
                        value={value.protein_coefficient}
                        onChange={(e) => onChange({ protein_coefficient: e.target.value === "" ? "" : Number(e.target.value) })}
                        onWheel={(e) => e.target.blur()}
                        className="w-full rounded-lg border p-2 text-sm ff-mono"
                        style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                      />
                      <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("noteProteinCoefficientRange")}</p>
                    </div>
                  </div>
    </>
  );
}

function OnboardingFlow({ existingUser, onComplete, t }) {
  const [step, setStep] = useState(0);
  const [statsConsent, setStatsConsent] = useState(false);
  const [professions, setProfessions] = useState([]);
  const [goalFocus, setGoalFocus] = useState("");
  // ★step3 の任意項目。プロフィール画面と同じ ProfileFieldGroups を使うため、
  //   profile と同じ形のオブジェクトで持つ。何も触らなければ空のまま送られる。
  //   （旧 rangeLow / rangeHigh は vocal_range_low / vocal_range_high に統合した）
  const [optionalFields, setOptionalFields] = useState({
    height_cm: "", age: "", sex: "", voice_type: "",
    conditions: [], allergies: [], regular_medications: [], health_notes: "",
    vocal_range_low: "", vocal_range_high: "", comfort_range_low: "", comfort_range_high: "",
    technical_goal: "", nutrition_phase: "維持", protein_coefficient: 1.6, track_cycle: false
  });
  const [saving, setSaving] = useState(false);
  const totalSteps = existingUser ? 1 : 5;

  async function handleFinish() {
    setSaving(true);
    const patch = {
      onboarding_completed: true,
      consent_health_data_at: new Date().toISOString(),
      consent_stats_use_at: statsConsent ? new Date().toISOString() : null,
      consent_policy_version: CONSENT_POLICY_VERSION
    };
    if (!existingUser) {
      patch.professions = professions.length ? professions : ["singer"];
      patch.vocal_profession = professions[0] || "singer";
      // ★「いま知りたいこと」は任意。未回答なら goal_focus を送らない。
      //   handleCompleteOnboarding は goal_focus があるときだけ folded_groups の
      //   プリセットを計算するので、未回答＝何も畳まない＝全項目表示になる。
      if (goalFocus) patch.goal_focus = goalFocus;
      // step3 の任意項目。入力されたものだけを送る（空欄を既定値で埋めない）。
      Object.entries(optionalFields).forEach(([k, v]) => {
        if (v === "" || v == null) return;
        if (Array.isArray(v) && v.length === 0) return;
        if (k === "nutrition_phase" && v === "維持") return;
        if (k === "protein_coefficient" && v === 1.6) return;
        if (k === "track_cycle" && v === false) return;
        patch[k] = v;
      });
    }
    await onComplete(patch);
    setSaving(false);
  }

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }} className="flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-1 mb-6 justify-center">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ width: 28, height: 3, borderRadius: 2, background: i <= step ? C.curtain : C.line }} />
          ))}
        </div>

        {step === 0 && (
          <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
            <h2 className="ff-display italic text-xl mb-3">記録データについて</h2>
            <p className="text-sm mb-3">La Voceは、あなたの声や体調の記録を保存します。以下の項目を取得します。</p>
            <ul className="text-xs space-y-1 mb-3" style={{ color: C.inkSoft }}>
              {CONSENT_DATA_CATEGORIES.map((c) => <li key={c}>・{c}</li>)}
            </ul>
            <p className="text-sm mb-1 font-medium">何のために使うか</p>
            <ul className="text-xs space-y-1 mb-4" style={{ color: C.inkSoft }}>
              <li>・あなた自身が声の調子の傾向を振り返るため</li>
              <li>・記録をもとに、あなた専用の分析（偏差値・発声負荷など）を表示するため</li>
            </ul>
            <div className="rounded-xl p-3 mb-3" style={{ background: C.paper }}>
              <p className="text-xs font-medium mb-1">上記の記録・分析のための取得（必須）</p>
              <p className="text-xs" style={{ color: C.inkSoft }}>この同意がないと、アプリの記録機能を使えません。</p>
            </div>
            <label className="flex items-start gap-2 rounded-xl p-3 mb-4" style={{ background: C.paper, cursor: "pointer" }}>
              <input type="checkbox" checked={statsConsent} onChange={(e) => setStatsConsent(e.target.checked)} className="mt-0.5" />
              <span className="text-xs" style={{ color: C.inkSoft }}>
                <strong style={{ color: C.ink }}>（任意）</strong> 匿名化した統計として、La Voceの機能改善に役立てることに同意します。個人を特定できる形で第三者に提供されることはありません。
              </span>
            </label>
            <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
              同意はいつでも「もっと ＞ 設定」から撤回できます。撤回すると新しい記録の保存が制限されます（既存データの書き出し・削除は同意状況に関わらずいつでも可能です）。
            </p>
            <button type="button"
              onClick={() => { if (existingUser) { handleFinish(); } else { setStep(1); } }}
              disabled={saving}
              className="w-full py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: saving ? 0.6 : 1 }}>
              {existingUser ? (saving ? "保存中…" : "同意して続ける") : "同意して次へ"}
            </button>
          </div>
        )}

        {step === 1 && !existingUser && (
          <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
            <h2 className="ff-display italic text-xl mb-3">職業を選んでください</h2>
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>複数選択できます。</p>
            <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
              {t("professionOther")}：{t("professionOtherNote")}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {SELECTABLE_PROFESSIONS.map((p) => {
                const label = t(PROFESSION_LABEL_KEYS[p]);
                const active = professions.includes(p);
                return (
                  <button key={p} type="button"
                    onClick={() => setProfessions((prev) => active ? prev.filter((x) => x !== p) : [...prev, p])}
                    className="py-3 rounded-xl text-sm font-medium border"
                    style={{ background: active ? C.curtain : C.paper, color: active ? "#FFFDF8" : C.inkSoft, borderColor: active ? C.curtain : C.line }}>
                    {label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setStep(2)} disabled={professions.length === 0}
              className="w-full py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: professions.length === 0 ? 0.5 : 1 }}>
              次へ
            </button>
          </div>
        )}

        {step === 2 && !existingUser && (
          <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
            <h2 className="ff-display italic text-xl mb-3">いま知りたいことは？</h2>
            <div className="space-y-2 mb-4">
              {ONBOARDING_GOAL_OPTIONS.map((opt) => (
                <button key={opt.key} type="button" onClick={() => setGoalFocus(opt.key)}
                  className="w-full py-3 rounded-xl text-sm font-medium border text-left px-4"
                  style={{ background: goalFocus === opt.key ? C.curtain : C.paper, color: goalFocus === opt.key ? "#FFFDF8" : C.inkSoft, borderColor: goalFocus === opt.key ? C.curtain : C.line }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {/* ★「いま知りたいこと」も任意。必須は職業だけ。 */}
            <button type="button" onClick={() => setStep(3)}
              className="w-full py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
              次へ
            </button>
          </div>
        )}

        {/* ★step3 は全項目が任意。必須は step1 の職業だけ。
            プロフィール画面と同じ ProfileFieldGroups を使う（同じ欄を2箇所に書かない）。
            職業は step1 で聞いているので showProfession={false}。
            要配慮個人情報（既往症・アレルギー・常用薬）を含むため、
            必ず step0 の同意より後に置くこと。 */}
        {step === 3 && !existingUser && (
          <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
            <h2 className="ff-display italic text-xl mb-1">{t("onboardingOptionalTitle")}</h2>
            <p className="text-xs mb-1" style={{ color: C.inkSoft }}>{t("onboardingOptionalNote")}</p>
            <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("onboardingOptionalLater")}</p>
            <div className="space-y-4 mb-4">
              <ProfileFieldGroups value={optionalFields} t={t} showProfession={false}
                onChange={(patch) => setOptionalFields((f) => ({ ...f, ...patch }))} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                {t("onboardingSkip")}
              </button>
              <button type="button" onClick={() => setStep(4)}
                className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                次へ
              </button>
            </div>
          </div>
        )}

        {step === 4 && !existingUser && (
          <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
            <h2 className="ff-display italic text-xl mb-3">3日記録すると</h2>
            <ul className="text-sm space-y-1.5 mb-4">
              <li>✓ 声の立ち上がりの速さ（ウォームアップ効率）</li>
              <li>✓ 症状のカレンダー</li>
              <li>✓ 音域マップ</li>
            </ul>
            <p className="text-sm mb-4">が見られるようになります。<br />7日で「コンディション偏差値」、14日で「あなただけの法則」が出ます。</p>
            <button type="button" onClick={handleFinish} disabled={saving}
              className="w-full py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: saving ? 0.6 : 1 }}>
              {saving ? "はじめています…" : "はじめる"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// lavoce-曲目複数化パッチ.md §2.0: 活動ブロック1つ分。種別・時間・曲目リスト・種別固有項目・
// ブロックごとの負荷フィードバックをまとめる。
// lavoce-記録項目の再設計v2.md §3.1・画面レイアウト仕様_1 §4.4: 声の記録シート。
// 1件の声の記録（時刻・場面・喉の身体感覚・声の出来・音名・症状・ひとこと）を編集する。
// ★かんたん表示のときの「声の出来」の5段階（見やすさ §3-2）。
//   0〜10 のまま、刻みを粗くするだけ。記録できる範囲は変えない。
//   ★言葉を添える。数字だけだと、どちらが良いのか分からない。
const SIMPLE_QUALITY_STEPS = [
  { value: 0, label: "とても\n悪い" },
  { value: 2.5, label: "悪い" },
  { value: 5, label: "ふつう" },
  { value: 7.5, label: "良い" },
  { value: 10, label: "とても\n良い" }
];
function VoiceEntryEditor({ entry, onChange, onRemove, onClose, professions, t, simple = false }) {
  const [mptRunning, setMptRunning] = useState(false);
  const [mptElapsed, setMptElapsed] = useState(0);
  const mptStartRef = useRef(null);
  const mptIntervalRef = useRef(null);
  const [sffRecording, setSffRecording] = useState(false);
  const [sffError, setSffError] = useState("");
  const isAnnouncer = (professions || []).includes("announcer");

  function startMpt() {
    setMptElapsed(0);
    mptStartRef.current = Date.now();
    setMptRunning(true);
    mptIntervalRef.current = setInterval(() => {
      setMptElapsed((Date.now() - mptStartRef.current) / 1000);
    }, 100);
  }
  function stopMpt() {
    clearInterval(mptIntervalRef.current);
    const finalSeconds = Math.round(((Date.now() - mptStartRef.current) / 1000) * 10) / 10;
    setMptRunning(false);
    onChange({ mptSeconds: finalSeconds });
  }
  useEffect(() => () => clearInterval(mptIntervalRef.current), []);

  return (
    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input type="time" value={entry.at} onChange={(e) => onChange({ at: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
          <select value={entry.context} onChange={(e) => onChange({ context: e.target.value })}
            className="rounded-lg border px-2 py-1.5 text-sm" style={{ borderColor: C.line, background: C.paper }}>
            {VOICE_CONTEXT_OPTIONS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <button type="button" onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.inkSoft }}>
          <X size={16} />
        </button>
      </div>
      {entry.context === "after_routine" && (
        <div className="mb-3">
          <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>発声ルーティンの長さ</label>
          <div className="flex items-center gap-2">
            <MiniNumber value={entry.routineMinutes ?? ""} placeholder="0" onChange={(v) => onChange({ routineMinutes: v === "" ? null : Number(v) })} />
            <span className="text-xs flex-shrink-0" style={{ color: C.inkSoft }}>分</span>
          </div>
        </div>
      )}
      <DynamicsSelector t={t} label="喉の身体感覚" icon={Mic2} value={entry.bodyFeel}
        onChange={(v) => onChange({ bodyFeel: v })} />
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">声の出来</span>
          {/* ★まだ動かしていないときは数字を出さない。0.0 でも 5.0 でもなく「—」。
              つまみは真ん中に置くが、それは初期位置であって記録した値ではない。 */}
          <span className="ff-mono text-sm" style={{ color: C.inkSoft }}>
            {typeof entry.quality === "number" ? entry.quality.toFixed(1) : "—"}
          </span>
        </div>
        {/* ★かんたん表示ではスライダーを使わない（見やすさ §3-2）。
            スライダーは、手が震える人には操作できない。
            そして正確な値を入れたい人にも向かない。両方に悪い部品。
            ★減らすのは選択肢であって、機能ではない。0〜10 のまま、刻みを粗くする。
            ふつう表示に戻せば、0.5刻みのつまみが戻る。 */}
        {simple ? (
          <div className="grid grid-cols-5 gap-1.5">
            {SIMPLE_QUALITY_STEPS.map((step) => {
              const active = entry.quality === step.value;
              return (
                <button key={step.value} type="button"
                  onClick={() => onChange({ quality: step.value })}
                  className="rounded-xl border py-3 text-xs"
                  style={{
                    background: active ? C.paper : C.card,
                    borderColor: active ? C.ink : C.line,
                    color: C.ink,
                    fontWeight: active ? 600 : 400
                  }}>
                  {step.label}
                </button>
              );
            })}
          </div>
        ) : (
          <input type="range" min={0} max={10} step={0.5} value={entry.quality ?? 5}
            onChange={(e) => onChange({ quality: Number(e.target.value) })}
            className="w-full" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>地声の音名</label>
          <input type="text" value={entry.pitchChest || ""} placeholder={t("placeholderNoteExample")}
            onChange={(e) => onChange({ pitchChest: e.target.value })}
            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>弱声の最高音</label>
          <input type="text" value={entry.pitchSoftMax || ""} placeholder={t("placeholderNoteExample")}
            onChange={(e) => onChange({ pitchSoftMax: e.target.value })}
            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-xs block mb-1.5" style={{ color: C.inkSoft }}>症状（あれば）</span>
        <div className="flex flex-wrap gap-1.5">
          {SYMPTOM_OPTIONS.map((s) => (
            <Chip key={s} label={t(SYMPTOM_KEYS[s])} active={(entry.symptoms || []).includes(s)}
              onClick={() => onChange({ symptoms: (entry.symptoms || []).includes(s) ? entry.symptoms.filter((x) => x !== s) : [...(entry.symptoms || []), s] })} />
          ))}
        </div>
      </div>
      <div className="mt-3">
        <input type="text" value={entry.note || ""} placeholder="ひとこと（任意）"
          onChange={(e) => onChange({ note: e.target.value })}
          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
      </div>
      <details className="mt-3 text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
        <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>+詳しく記録する（最長発声時間・音色）</summary>
        <div className="mt-3">
          <p className="text-xs font-medium mb-1.5" style={{ color: C.ink }}>最長発声時間（MPT）</p>
          <p className="text-xs mb-2">「あー」を、無理のない範囲で一息のばして測ります。「開始」を押して、声が止まったら「停止」を押してください。</p>
          <div className="flex items-center gap-3">
            <span className="ff-mono text-lg" style={{ color: C.ink }}>{mptRunning ? mptElapsed.toFixed(1) : (entry.mptSeconds != null ? entry.mptSeconds.toFixed(1) : "0.0")}秒</span>
            {!mptRunning ? (
              <button type="button" onClick={startMpt}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                開始
              </button>
            ) : (
              <button type="button" onClick={stopMpt}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}` }}>
                停止
              </button>
            )}
          </div>
        </div>
        <div className="mt-3">
          <DotSelector label="音色の均一感（音域全体で音色が揃っていたか）" icon={Music2}
            value={entry.toneEvenness ?? 3} lowLabel="バラつく" highLabel="揃う"
            onChange={(v) => onChange({ toneEvenness: v })} />
        </div>
        {isAnnouncer && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1.5" style={{ color: C.ink }}>話声位（SFF）</p>
            <p className="text-xs mb-2">同じ定型文(例:「本日は晴天なり」)を3秒読んでください。毎朝と終業後の両方で測ると、日内変動が見られます。</p>
            <div className="flex items-center gap-3">
              <span className="ff-mono text-lg" style={{ color: C.ink }}>{entry.speakingF0Hz != null ? `${entry.speakingF0Hz} Hz` : "未測定"}</span>
              <button type="button" disabled={sffRecording}
                onClick={async () => {
                  setSffError("");
                  setSffRecording(true);
                  try {
                    const hz = await recordAndAnalyzeSFF(3000);
                    onChange({ speakingF0Hz: hz });
                  } catch (err) {
                    setSffError(err && err.message ? err.message : "マイクを使用できませんでした。ブラウザの権限設定をご確認ください。");
                  } finally {
                    setSffRecording(false);
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
                style={{ background: sffRecording ? C.line : C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                {sffRecording ? <Loader2 size={12} className="animate-spin" /> : <Mic2 size={12} />}
                {sffRecording ? "録音中（3秒）…" : "3秒録音して測定する"}
              </button>
            </div>
            {sffError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{sffError}</p>}
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
              録音データ自体は保存せず、数値化した後にその場で破棄します。このアプリ独自の簡易計算のため、あくまで自分自身の推移で見るための参考値です。
            </p>
          </div>
        )}
      </details>
      <div className="flex gap-2 mt-3">
        <button type="button" onClick={onClose}
          className="flex-1 py-2 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
          記録する
        </button>
        <button type="button" onClick={onRemove}
          className="px-4 py-2 rounded-full text-sm" style={{ color: C.curtain }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
function ActivityBlockEditor({
  activity, onChange, onRemove, onDetailChange,
  onAddItem, onUpdateItem, onRemoveItem, onMoveItem,
  repertoireTessituraMap, repertoireUsageCounts, repertoireSkipped, setRepertoireSkipped,
  handleSaveRepertoire, tessituraSaving, songFactorResolver, professions,
  roleMasterMap, projectMasterMap, handleSaveRole, handleSaveProject, handleSaveSingingLanguage, t
}) {
  const detail = activity.detail || {};
  const items = activity.items || [];
  const { total, perItem } = computeActivityBlockLoad(activity, songFactorResolver);
  const isVoiceActor = (professions || []).includes("voice_actor");
  const isPopMusical = (professions || []).includes("pop_musical");
  const isSinger = (professions || []).includes("singer");
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.card }}>
      <div className="flex items-center gap-2 mb-2">
        <MiniSelect value={activity.kind} onChange={(v) => onChange({ kind: v })} options={ACTIVITY_BLOCK_KINDS}
          labels={Object.fromEntries(ACTIVITY_BLOCK_KINDS.map((k) => [k, t((ACTIVITY_OPTIONS.find((a) => a.key === k) || {}).labelKey) || k]))} />
        <div className="flex items-center gap-1 flex-1">
          <MiniNumber value={activity.minutes} placeholder="分" onChange={(v) => onChange({ minutes: v })} />
          <span className="text-xs flex-shrink-0" style={{ color: C.inkSoft }}>分</span>
        </div>
        <button type="button" onClick={onRemove} className="flex-shrink-0" style={{ color: C.inkSoft }}><X size={16} /></button>
      </div>

      <div className="mt-2">
        <span className="text-xs font-medium block mb-1.5">{activity.kind === "本番" ? "演目・曲目" : activity.kind === "リハーサル" ? "曲目・演目" : "曲目"}</span>
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <RepertoireItemRow
              key={idx} item={item} index={idx} totalItems={items.length}
              onChange={(patch) => onUpdateItem(idx, patch)}
              onRemove={() => onRemoveItem(idx)}
              onMoveUp={() => onMoveItem(idx, -1)}
              onMoveDown={() => onMoveItem(idx, 1)}
              repertoireTessituraMap={repertoireTessituraMap}
              repertoireUsageCounts={repertoireUsageCounts}
              repertoireSkipped={repertoireSkipped}
              setRepertoireSkipped={setRepertoireSkipped}
              handleSaveRepertoire={handleSaveRepertoire}
              tessituraSaving={tessituraSaving}
              professions={professions}
              roleMasterMap={roleMasterMap}
              projectMasterMap={projectMasterMap}
              handleSaveRole={handleSaveRole}
              handleSaveProject={handleSaveProject}
              handleSaveSingingLanguage={handleSaveSingingLanguage}
              t={t}
            />
          ))}
        </div>
        {items.length < 50 && (
          <button type="button" onClick={onAddItem} className="mt-1.5 text-xs font-medium flex items-center gap-1" style={{ color: C.curtain }}>
            <Plus size={12} />曲を追加
          </button>
        )}
      </div>

      {activity.kind === "自主練習" && (
        <div className="mt-3 pt-2 border-t space-y-2" style={{ borderColor: C.line }}>
          <textarea value={detail.practiceMenu || ""} rows={2} placeholder={t("placeholderPracticeMenuExample")}
            onChange={(e) => onDetailChange({ practiceMenu: e.target.value })}
            className="w-full rounded-lg border p-2 text-xs" style={{ borderColor: C.line, background: C.paper }} />
        </div>
      )}
      {activity.kind === "レッスン" && (
        <div className="mt-3 pt-2 border-t space-y-2" style={{ borderColor: C.line }}>
          <textarea value={detail.teacherNotes || ""} rows={2} placeholder={t("placeholderTeacherNotes")}
            onChange={(e) => onDetailChange({ teacherNotes: e.target.value })}
            className="w-full rounded-lg border p-2 text-xs" style={{ borderColor: C.line, background: C.paper }} />
        </div>
      )}
      {activity.kind === "本番" && (
        <div className="mt-3 pt-2 border-t space-y-3" style={{ borderColor: C.line }}>
          <DynamicsSelector t={t} label={t("targetPerformance")} icon={Sparkles} value={detail.performanceQuality || 3}
            onChange={(v) => onDetailChange({ performanceQuality: v })} />
          <textarea value={detail.performanceComment || ""} rows={2} placeholder={t("placeholderPerformanceComment")}
            onChange={(e) => onDetailChange({ performanceComment: e.target.value })}
            className="w-full rounded-lg border p-2 text-xs" style={{ borderColor: C.line, background: C.paper }} />
        </div>
      )}

      {isVoiceActor && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: C.line }}>
          <span className="text-xs font-medium block mb-1.5">喉に負担のある演技（あてはまるものすべて）</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {["叫び", "がなり・エッジ", "泣き・嗚咽", "咳・えずき・呼吸音", "ささやき", "悲鳴"].map((tag) => (
              <Chip key={tag} label={tag} active={(detail.demandingActing || []).includes(tag)}
                onClick={() => onDetailChange({
                  demandingActing: (detail.demandingActing || []).includes(tag)
                    ? detail.demandingActing.filter((x) => x !== tag)
                    : [...(detail.demandingActing || []), tag]
                })} />
            ))}
          </div>
          {((detail.demandingActing || []).includes("叫び") || (detail.demandingActing || []).includes("悲鳴")) && (
            <div className="flex items-center gap-2">
              <MiniNumber value={detail.screamTakes ?? ""} placeholder="0" onChange={(v) => onDetailChange({ screamTakes: v === "" ? null : Number(v) })} />
              <span className="text-xs flex-shrink-0" style={{ color: C.inkSoft }}>テイク（概算でよい）</span>
            </div>
          )}
        </div>
      )}

      {isPopMusical && activity.kind === "本番" && (
        <div className="mt-3 pt-2 border-t space-y-3" style={{ borderColor: C.line }}>
          <div>
            <span className="text-xs font-medium block mb-1.5">モニター環境</span>
            <div className="flex gap-1.5">
              {[["iem", "インイヤー"], ["wedge", "ウェッジ"], ["none", "なし"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => onDetailChange({ monitorType: v })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    background: detail.monitorType === v ? C.curtain : C.paper,
                    color: detail.monitorType === v ? "#FFFDF8" : C.inkSoft,
                    borderColor: detail.monitorType === v ? C.curtain : C.line
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium block mb-1.5">終演後の打ち上げ</span>
            <div className="flex flex-wrap gap-1.5">
              <Chip label="参加した" active={!!(detail.afterparty || {}).attended}
                onClick={() => onDetailChange({ afterparty: { ...(detail.afterparty || {}), attended: !(detail.afterparty || {}).attended } })} />
              {(detail.afterparty || {}).attended && (
                <>
                  <Chip label="騒がしかった" active={!!(detail.afterparty || {}).noisy}
                    onClick={() => onDetailChange({ afterparty: { ...(detail.afterparty || {}), noisy: !(detail.afterparty || {}).noisy } })} />
                  <Chip label="飲酒あり" active={!!(detail.afterparty || {}).alcohol}
                    onClick={() => onDetailChange({ afterparty: { ...(detail.afterparty || {}), alcohol: !(detail.afterparty || {}).alcohol } })} />
                </>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium block mb-1.5">この日の移動手段（任意）</span>
            <div className="flex flex-wrap gap-1.5">
              {[["train", "電車・新幹線"], ["car", "車"], ["night_bus", "夜行バス・車中泊"], ["flight", "飛行機"]].map(([v, label]) => (
                <Chip key={v} label={label} active={detail.travelMode === v}
                  onClick={() => onDetailChange({ travelMode: detail.travelMode === v ? null : v })} />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: C.inkSoft }}>
            <input type="checkbox" checked={!!detail.isTourStart}
              onChange={(e) => onDetailChange({ isTourStart: e.target.checked })} />
            このツアーの初日
          </label>
          <label className="flex items-center gap-2 text-xs" style={{ color: C.inkSoft }}>
            <input type="checkbox" checked={!!detail.isPlayingAndSinging}
              onChange={(e) => onDetailChange({ isPlayingAndSinging: e.target.checked })} />
            弾き語りだった（楽器を持って歌った）
          </label>
        </div>
      )}

      {isSinger && (activity.kind === "本番" || activity.kind === "リハーサル") && (
        <div className="mt-3 pt-2 border-t space-y-3" style={{ borderColor: C.line }}>
          <div>
            <span className="text-xs font-medium block mb-1.5">パッサッジョの通過感</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onDetailChange({ passaggioFeel: n })}
                  className="flex-1 h-9 rounded-lg border text-xs font-medium"
                  style={{
                    background: (detail.passaggioFeel || 0) >= n ? C.curtain : C.paper,
                    color: (detail.passaggioFeel || 0) >= n ? "#FFFDF8" : C.inkSoft,
                    borderColor: (detail.passaggioFeel || 0) >= n ? C.curtain : C.line
                  }}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>1＝引っかかる・5＝すっと通る</p>
          </div>
          <div>
            <span className="text-xs font-medium block mb-1.5">衣装の締め付け</span>
            <div className="flex gap-1.5">
              {[["none", "なし"], ["some", "やや"], ["tight", "強い"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => onDetailChange({ costumeTightness: v })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    background: detail.costumeTightness === v ? C.curtain : C.paper,
                    color: detail.costumeTightness === v ? "#FFFDF8" : C.inkSoft,
                    borderColor: detail.costumeTightness === v ? C.curtain : C.line
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium block mb-1.5">会場の響き</span>
            <div className="flex gap-1.5">
              {[["dead", "デッド"], ["normal", "普通"], ["live", "ライブ"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => onDetailChange({ hallAcoustics: v })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    background: detail.hallAcoustics === v ? C.curtain : C.paper,
                    color: detail.hallAcoustics === v ? "#FFFDF8" : C.inkSoft,
                    borderColor: detail.hallAcoustics === v ? C.curtain : C.line
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-medium block mb-1.5">伴奏</span>
            <div className="flex gap-1.5">
              {[["piano", "ピアノ"], ["orchestra", "オーケストラ"], ["none", "なし"]].map(([v, label]) => (
                <button key={v} type="button" onClick={() => onDetailChange({ accompaniment: v })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    background: detail.accompaniment === v ? C.curtain : C.paper,
                    color: detail.accompaniment === v ? "#FFFDF8" : C.inkSoft,
                    borderColor: detail.accompaniment === v ? C.curtain : C.line
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && total > 0 && (
        <div className="mt-3 pt-2 border-t" style={{ borderColor: C.line }}>
          <p className="text-xs font-medium mb-1">このブロックの負荷 {Math.round(total)}</p>
          <div className="space-y-1">
            {[...perItem].sort((a, b) => b.load - a.load).slice(0, 5).map((pi, i) => (
              <div key={i} className="flex items-center justify-between text-xs" style={{ color: C.inkSoft }}>
                <span>{pi.repertoireName || "（無題）"}</span>
                <span className="ff-mono">{Math.round(pi.load)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function ExerciseItemRow({ item, onChange, onRemove, t }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.paper }}>
      <div className="flex items-center gap-2 mb-2">
        <MiniSelect value={item.type} onChange={(v) => onChange({ ...item, type: v })} options={EXERCISE_TYPES}
          labels={Object.fromEntries(EXERCISE_TYPES.map((o) => [o, t(EXERCISE_TYPE_KEYS[o])]))} />
        <div className="flex items-center gap-1 flex-1">
          <MiniNumber value={item.minutes} placeholder={t("placeholderExerciseMinutes")} onChange={(v) => onChange({ ...item, minutes: v })} />
          <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>{t("unitMinutesShort")}</span>
        </div>
        <button type="button" onClick={onRemove} className="shrink-0" style={{ color: C.inkSoft }}>
          <X size={15} />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>{t("labelIntensityShort")}</span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...item, intensity: v })}
              className="rounded-full"
              style={{
                width: item.intensity === v ? 20 : 15,
                height: item.intensity === v ? 20 : 15,
                background: v <= item.intensity ? C.curtain : C.card,
                border: `1.5px solid ${v <= item.intensity ? C.curtain : C.line}`
              }}
            />
          ))}
        </div>
      </div>
      <input
        type="text"
        value={item.memo || ""}
        placeholder={item.type === "その他" ? t("placeholderExerciseOtherType") : t("placeholderExerciseMemo")}
        onChange={(e) => onChange({ ...item, memo: e.target.value })}
        className="w-full rounded-lg border text-xs px-2 py-1.5"
        style={{ borderColor: C.line, background: C.card, color: C.ink }}
      />
    </div>
  );
}

/* ---------- main component ---------- */
export default function VocalTracker({ userId, userEmail }) {
  const [loading, setLoading] = useState(true);
  // 記録データが読み込めなかったとき、画面の上に出す（黙って空にしない）
  const [entriesLoadError, setEntriesLoadError] = useState("");
  const [entries, setEntries] = useState({});
  const [activeTab, setActiveTab] = useState("home");
  // 記録と分析の順番設計 §5.3: 分析画面の「この分析を強くする」から記録画面へジャンプしたとき、
  // 該当セクションを2秒だけ淡くハイライトする（入力欄へのフォーカスは当てない）。
  const [highlightSection, setHighlightSection] = useState(null);
  // ★重要：ホームタブの挨拶も、以前は new Date() をレンダリング中に直接使っており、
  // recordViewと同じ原因（サーバー/ブラウザの時刻差）でハイドレーションエラー（React #423）を
  // 起こしていた。ホームタブは既定タブのため、アプリを開くたび必ず発動する重大な不具合だった。
  // 同じ安全なパターン（固定値→マウント後のuseEffectで補正）に統一する。
  const [greetingHour, setGreetingHour] = useState(12);
  useEffect(() => {
    setGreetingHour(new Date().getHours());
  }, []);
  // 記録と分析の順番設計 §3.1: 記録の入口を時間帯で2つに分ける。
  // 境界時刻（既定21時）より前は「声の記録」、以降は「一日の記録」を既定表示にする。
  // ユーザーはいつでも上部の切り替えで行き来できる（隠さない）。
  // ★重要：useStateの初期値でnew Date()を直接使わないこと。サーバー（UTC）とブラウザ（日本時間等）で
  // 結果が食い違い、ハイドレーションエラー（React #423）でアプリ全体がクラッシュする
  // （このプロジェクトで過去に経験済みの既知のパターン）。安全な固定値で始め、
  // マウント後のuseEffectだけで実際の時刻判定を行う。
  const [recordView, setRecordView] = useState("voice");
  const recordViewInitializedRef = useRef(false);
  useEffect(() => {
    if (!highlightSection) return;
    const timer = setTimeout(() => setHighlightSection(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightSection]);
  function jumpToRecordSection(sectionId) {
    setActiveTab("today");
    setRecordView("day"); // ジャンプ先(睡眠・水分・食事・活動・メンタル)はすべて「一日の記録」ビューにあるため
    setHighlightSection(sectionId);
  }
  const [lessonMode, setLessonMode] = useState(false);
  const [clinicPeriodMode, setClinicPeriodMode] = useState("auto");
  const [clinicCustomStart, setClinicCustomStart] = useState("");
  const [clinicCustomEnd, setClinicCustomEnd] = useState("");
  const [clinicFreeNote, setClinicFreeNote] = useState("");
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const [showMealDetail, setShowMealDetail] = useState(false);
  // lavoce-アプリ配布と課金仕様.md §3・実行順マスター Stage 1-4: PWA化＋インストール導線＋計測
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [mergeSourceRepertoire, setMergeSourceRepertoire] = useState("");
  const [mergeTargetRepertoire, setMergeTargetRepertoire] = useState("");
  const [mergeConfirming, setMergeConfirming] = useState(false);
  const [mergeInProgress, setMergeInProgress] = useState(false);
  const [mergeResult, setMergeResult] = useState("");
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  // ★カレンダーを既定にする（いちばん役に立つものを最初に見せる）。
  const [notesSubTab, setNotesSubTab] = useState("calendar");
  // レッスン画面の立場。null は「まだ選んでいない」＝ 既定に従う。
  const [lessonRoleChoice, setLessonRoleChoice] = useState(null);
  // 周期の記録。開始日と、あれば終了日だけを持つ（周期記録の設計.md §3-1）。
  // 計測中の発声セッション。★端末に持たせる（画面を閉じても続くように）。
  const [runningSession, setRunningSession] = useState(null); // { kind, startedAtMs }
  const [sessionTick, setSessionTick] = useState(0);          // 経過時間の再描画用
  const [sessionConfirm, setSessionConfirm] = useState(null); // 押し忘れの確認
  const [cyclePeriods, setCyclePeriods] = useState([]);
  const [cycleBusy, setCycleBusy] = useState(false);
  const [cycleError, setCycleError] = useState("");
  const [cycleJustSaved, setCycleJustSaved] = useState("");  // 押したことが伝わるように
  const [editingVoiceEntryId, setEditingVoiceEntryId] = useState(null);
  const [editingPracticeGoal, setEditingPracticeGoal] = useState(false);
  const [practiceGoalDraft, setPracticeGoalDraft] = useState("");
  const [practiceGoalTagsDraft, setPracticeGoalTagsDraft] = useState([]);
  const [practiceReviewDraft, setPracticeReviewDraft] = useState("");
  const [dismissedFoldSuggestions, setDismissedFoldSuggestions] = useState([]);
  const [showFieldGroupManager, setShowFieldGroupManager] = useState(false);
  const [showCopiedNotice, setShowCopiedNotice] = useState(false);
  const [showDay7Survey, setShowDay7Survey] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISOUTC());
  // ★重要：ホームタブの「今日」判定（realToday）も、以前はレンダリング中に todayISO()（ローカル時刻）を
  // 直接呼んでおり、selectedDateと同じ理由でハイドレーション不一致を起こしうる状態だった。
  // 同じ安全なパターン（UTC基準で初期化→マウント後のuseEffectで現地時間へ補正）に統一する。
  const [realTodayDate, setRealTodayDate] = useState(todayISOUTC());
  // 指導者プラン実装仕様 §2〜§4: 招待コード・紐付けの状態
  const [generatedInviteCode, setGeneratedInviteCode] = useState(null);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteLookupError, setInviteLookupError] = useState("");
  const [pendingInvitation, setPendingInvitation] = useState(null);
  // つながっている先生の名前（teacher_id -> {display_name, school}）
  const [myTeacherNames, setMyTeacherNames] = useState({});
  const [myStudentLinks, setMyStudentLinks] = useState([]); // 自分が「先生」として見られる生徒たち
  const [myTeacherLinks, setMyTeacherLinks] = useState([]); // 自分が「生徒」としてつながっている先生たち
  const [studentEntriesCache, setStudentEntriesCache] = useState({}); // studentId -> entries（サーバー側の関数が、共有範囲の列だけを返す）
  const [studentEntriesFetchError, setStudentEntriesFetchError] = useState({}); // studentId -> 取得に失敗したか
  const [studentEntriesLoading, setStudentEntriesLoading] = useState({});
  const [viewingStudentLink, setViewingStudentLink] = useState(null); // 生徒個別ページ(§6)で開いている生徒
  const [teacherNoteDraft, setTeacherNoteDraft] = useState("");
  const [teacherNoteSaveStatus, setTeacherNoteSaveStatus] = useState("idle");
  const [studentLessons, setStudentLessons] = useState([]); // 個別ページで見ている生徒のレッスン日程
  const [newLessonDate, setNewLessonDate] = useState("");
  const [newLessonTime, setNewLessonTime] = useState("19:00");
  const [newLessonNote, setNewLessonNote] = useState("");
  const [myUpcomingLessons, setMyUpcomingLessons] = useState([]); // 自分が生徒として持つ、直近のレッスン予定
  const [studentComments, setStudentComments] = useState({}); // date -> comments[]（個別ページで見ている生徒）
  const [newCommentDraft, setNewCommentDraft] = useState("");
  const [myRecentComments, setMyRecentComments] = useState([]); // 自分が生徒として受け取った、直近のコメント
  // 職業別項目の再設計と学ぶ画面 §7: 学ぶ画面用のstate
  const [learnProfession, setLearnProfession] = useState(null); // null=まだ選んでいない（初回はvocal_professionを既定にする）
  const [learnOpenChapters, setLearnOpenChapters] = useState({}); // "professionKey:chapter" -> boolean
  const [learnReadArticles, setLearnReadArticles] = useState({}); // articleId -> readAt
  const [viewingArticleId, setViewingArticleId] = useState(null);
  const [articleNotes, setArticleNotes] = useState({}); // articleId -> notes[]
  const [newArticleNoteDraft, setNewArticleNoteDraft] = useState("");
  // 自分に当てはめる問いの下書き（記事ごと）
  const [reflectionDraft, setReflectionDraft] = useState({});
  // 読む前の問いの選択（articleId -> 選んだ番号）。★正誤は持たない。
  //   持てるようにすると、いつか画面に出てしまう。
  const [prequestionChoice, setPrequestionChoice] = useState({});
  // 読んだ直後の3問の答え（articleId -> { 問番号: 選んだ番号 }）
  const [quizAnswers, setQuizAnswers] = useState({});
  // 記述式の下書き（"articleId:問番号" -> 文字列）。★保存済みの記述は上書きしない。
  const [reflectDraft, setReflectDraft] = useState({});
  // かんたん表示の「1画面に1つ」。いま何問目か。★とばした数は数えない。
  const [simpleStepIndex, setSimpleStepIndex] = useState(0);
  // ★保存のあと30秒、「取り消す」を出しておく（見やすさ §4-2）。
  //   消える通知にしない。画面の中に残し、自分で閉じる（§4-1）。
  //   { date, previous }  previous が null なら「その日の記録は無かった」。
  const [undoableSave, setUndoableSave] = useState(null);
  // ★削除は2段階（見やすさ §4-2）。押し間違いは必ず起きる。
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null);
  // 間隔をあけて出し直すための状態（articleId -> { box, nextDueAt, ... }）
  const [articleProgress, setArticleProgress] = useState({});
  // 復習で答えた分（articleId -> 選んだ番号）。★正答率は数えない。
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [learnSearchQuery, setLearnSearchQuery] = useState("");
  // 作業指示-教室プラン §B・C・E: 教室プラン用のstate
  const [myOrgs, setMyOrgs] = useState([]); // 自分がメンバーである組織一覧（role付き）
  const [viewingOrgId, setViewingOrgId] = useState(null);
  const [orgMembers, setOrgMembers] = useState({}); // orgId -> memberships[]
  const [orgEnrollments, setOrgEnrollments] = useState({}); // orgId -> enrollments[]
  const [orgAssignments, setOrgAssignments] = useState({}); // orgId -> assignments[]
  const [orgLessons, setOrgLessons] = useState({}); // orgId -> lessons[]
  const [generatedOrgInviteCode, setGeneratedOrgInviteCode] = useState(null);
  const [orgInviteCodeInput, setOrgInviteCodeInput] = useState("");
  const [orgInviteLookupError, setOrgInviteLookupError] = useState("");
  const [pendingOrgInvitation, setPendingOrgInvitation] = useState(null);
  const [myAllLessons, setMyAllLessons] = useState([]); // 生徒として、教室をまたいで統合した全レッスン
  const [formData, setFormData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [saveCardData, setSaveCardData] = useState(null);
  const [noiseMeasuring, setNoiseMeasuring] = useState(false);
  const [noiseError, setNoiseError] = useState("");
  const [cppsRecording, setCppsRecording] = useState(false);
  const [cppsError, setCppsError] = useState("");
  const [questionnaireResponses, setQuestionnaireResponses] = useState([]);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [questionnaireSaving, setQuestionnaireSaving] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState("");
  const [repertoireTessituraMap, setRepertoireTessituraMap] = useState({});
  const [roleMasterMap, setRoleMasterMap] = useState({}); // 職業別項目の再設計と学ぶ画面 §5
  const [projectMasterMap, setProjectMasterMap] = useState({});
  const [tessituraSaving, setTessituraSaving] = useState(false);
  const [topNoteInput, setTopNoteInput] = useState("");
  const [tessituraOptionalInput, setTessituraOptionalInput] = useState("");
  const [showTessituraAccordion, setShowTessituraAccordion] = useState(false);
  const [dOverrideChoice, setDOverrideChoice] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [repertoireSkipped, setRepertoireSkipped] = useState({});
  const [language, setLanguage] = useState("ja");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
  });
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null);
  const [selectedFactorKey, setSelectedFactorKey] = useState(null);
  const [analysisTarget, setAnalysisTarget] = useState("performance");
  // 分析対象の期間（週・月・年・全期間・任意の期間から選べる）
  const [analysisPeriod, setAnalysisPeriod] = useState("all"); // "week" | "month" | "year" | "all" | "custom"
  const [analysisCustomStart, setAnalysisCustomStart] = useState("");
  const [analysisCustomEnd, setAnalysisCustomEnd] = useState("");
  const [adviceText, setAdviceText] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [adviceGeneratedAt, setAdviceGeneratedAt] = useState(null);
  const [profile, setProfile] = useState({ height_cm: "", voice_type: "", nutrition_phase: "維持", protein_coefficient: 1.6, age: "", sex: "", garden_theme: "rose", vocal_range_low: "", vocal_range_high: "", comfort_range_low: "", comfort_range_high: "", technical_goal: "", health_notes: "", vocal_profession: "singer", conditions: [], allergies: [], regular_medications: [], onboarding_completed: null, professions: [], goal_focus: "", practice_goal: "", practice_goal_tags: [], practice_goal_started_at: null, practice_reviews: [], folded_groups: [], survey_day7_shown_at: null, survey_day7_response: "", line_user_id: null, line_link_code: null, line_linked_at: null, line_notification_enabled: true, day_record_boundary_hour: 21, teacher_beta_access: false, display_name: "", is_admin: false, record_mode: DEFAULT_RECORD_MODE, deleted_at: null, cycle_show_on_home: true,
    display_scale: DEFAULT_SCALE, simple_display: false });
  // 確認用: 管理者アカウント（is_admin）は、動作確認のため全職業の機能を見られるようにする。
  // ★重要：profile宣言より前に置くと「宣言前にアクセス」エラーになるため、必ずこの直後に置くこと。
  const effectiveProfessions = useMemo(() => {
    return profile.is_admin ? VOCAL_PROFESSIONS : (profile.professions || []);
  }, [profile.is_admin, profile.professions]);
  // 記録と分析の順番設計 §3.1: profile読込後、実際の時刻と境界時刻からrecordViewを補正する。
  // （profileに依存するため、profile宣言より前に置くと「宣言前にアクセス」エラーになる。要注意）
  useEffect(() => {
    if (recordViewInitializedRef.current || profile.day_record_boundary_hour == null) return;
    recordViewInitializedRef.current = true;
    const hour = new Date().getHours();
    const boundary = profile.day_record_boundary_hour;
    setRecordView(hour >= boundary || hour < 5 ? "day" : "voice");
  }, [profile.day_record_boundary_hour]);
  const [ownedItemKeys, setOwnedItemKeys] = useState([]);
  const [characterEquipped, setCharacterEquipped] = useState({});
  const [characterPointsSpent, setCharacterPointsSpent] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  // 学ぶ統合設計書 4-3: 音名ルールの説明は初回のみ自動展開する。
  // 端末ごとの表示上の都合なので localStorage で持つ（言語設定と同じ扱い）。
  const [noteRuleOpen, setNoteRuleOpen] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem("la-voce-note-rule-seen") !== "1") {
        setNoteRuleOpen(true);
        window.localStorage.setItem("la-voce-note-rule-seen", "1");
      }
    } catch (e) {
      /* localStorageが使えない環境では、畳んだまま表示する */
    }
  }, []);
  const [profileSaveStatus, setProfileSaveStatus] = useState("idle");

  // selectedDate / viewMonth は、サーバーとクライアントのハイドレーション不一致を避けるため
  // UTC基準の値で初期化している。マウント後（＝ハイドレーションが安全に完了した後）に、
  // ブラウザの現地時間で計算した正しい「今日」へ補正する。
  useEffect(() => {
    const localToday = todayISO();
    const utcToday = todayISOUTC();
    if (localToday !== utcToday) {
      setSelectedDate((prev) => (prev === utcToday ? localToday : prev));
      setRealTodayDate(localToday);
      const d = new Date();
      setViewMonth((prev) =>
        (prev.year === d.getUTCFullYear() && prev.month === d.getUTCMonth())
          ? { year: d.getFullYear(), month: d.getMonth() }
          : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lavoce-アプリ配布と課金仕様.md §3・実行順マスター Stage 1-4: PWA化。
  // Service Workerの登録、インストール導線（beforeinstallprompt）、インストール計測をまとめて行う。
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service Workerの登録に失敗しました:", err);
    });
    // 既にインストール済み（スタンドアロン表示）かどうかを判定する
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    setIsPwaInstalled(standalone);
    // iOS/iPadOSのSafari（および同エンジンを使う全ブラウザ）はbeforeinstallpromptを実装していないため、
    // 別途ユーザーエージェントで判定し、手動での案内に切り替える。
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isIOS = isIOSDevice && !standalone;
    setIsIosSafari(isIOS);
    // iOSはbeforeinstallpromptが来ないので、同じ「少し操作した後に出す」タイミングを別途用意する。
    if (isIOS) {
      setTimeout(() => setShowInstallBanner(true), 3000);
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setPwaInstallPrompt(e);
      // 記録画面の邪魔をしないよう、少し操作した後にだけバナーを出す。
      setTimeout(() => setShowInstallBanner(true), 3000);
    }
    function handleAppInstalled() {
      setIsPwaInstalled(true);
      setShowInstallBanner(false);
      setPwaInstallPrompt(null);
      // 計測：インストール完了をプロフィールに記録する（実行順マスター Stage 1-4の「計測」要件）。
      const supabase = createClient();
      supabase.from("profiles").update({ pwa_installed_at: new Date().toISOString() }).eq("id", userId).then(() => {});
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [userId]);

  async function handleInstallPwa() {
    if (!pwaInstallPrompt) return;
    // 計測：ボタンを押してプロンプトを表示した時点を記録する。
    const supabase = createClient();
    supabase.from("profiles").update({ pwa_install_prompted_at: new Date().toISOString() }).eq("id", userId).then(() => {});
    pwaInstallPrompt.prompt();
    await pwaInstallPrompt.userChoice;
    setPwaInstallPrompt(null);
    setShowInstallBanner(false);
  }

  // ★計測中のセッションを、画面を閉じても失わないようにする。
  //   「開始を押したのに消えていた」は、押し忘れより始末が悪い。
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("la-voce-running-session");
      if (raw) {
        const v = JSON.parse(raw);
        if (v && v.kind && v.startedAtMs) setRunningSession(v);
      }
    } catch (e) { /* 壊れていたら無視して、計測なしから始める */ }
  }, []);
  useEffect(() => {
    try {
      if (runningSession) window.localStorage.setItem("la-voce-running-session", JSON.stringify(runningSession));
      else window.localStorage.removeItem("la-voce-running-session");
    } catch (e) { /* localStorage が使えない環境では計測がその場限りになるだけ */ }
  }, [runningSession]);
  // 計測中だけ、1分ごとに経過を描き直す（止まっているときは何もしない）
  useEffect(() => {
    if (!runningSession) return;
    const id = setInterval(() => setSessionTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, [runningSession]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("la-voce-language");
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLanguage(saved);
    } catch (e) {
      /* localStorageが使えない環境では無視 */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("la-voce-language", language);
    } catch (e) {
      /* ignore */
    }
  }, [language]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase,
        () => supabase.from("entries").select("*").eq("user_id", userId),
        "記録データの取得"
      );
      // ★失敗を黙って飲み込まないこと。以前はコンソールに出すだけだったので、
      //   読み込めなかった人には「記録が消えた」ようにしか見えなかった。
      if (error) {
        console.error("記録データの読み込みに失敗しました:", error, "userId:", userId);
        if (mounted) setEntriesLoadError(error.message || "記録データを読み込めませんでした");
      }
      if (mounted && data) {
        const map = {};
        data.forEach((row) => { map[row.date] = rowToEntry(row); });
        setEntries(map);
        setEntriesLoadError("");
      }
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  // つながっている先生の名前。★profiles を直接は読めないので関数を経由する。
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_my_teacher_names");
      if (error) {
        console.warn("先生の名前を取得できませんでした。supabase/migration_invitation_teacher_name.sql を実行してください。", error);
        return;
      }
      if (mounted && Array.isArray(data)) {
        const map = {};
        data.forEach((t) => { if (t && t.teacher_id) map[t.teacher_id] = t; });
        setMyTeacherNames(map);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // ★周期は本人しか読めない（RLSは auth.uid() = user_id の1本だけ）。
  //   テーブルが無い環境でも他の機能を巻き込まないよう、失敗しても黙って空にする。
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase,
        () => supabase.from("cycle_periods").select("id, start_date, end_date").eq("user_id", userId).order("start_date", { ascending: false }),
        "周期の記録の取得"
      );
      if (error) console.warn("周期の記録を読み込めませんでした:", error.message);
      if (mounted && data) setCyclePeriods(data);
    })();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase,
        () => supabase.from("questionnaire_responses").select("*").eq("user_id", userId).order("response_date", { ascending: true }),
        "質問票の回答の取得"
      );
      if (error) {
        console.error("質問票の回答の読み込みに失敗しました:", error, "userId:", userId);
      }
      if (mounted && data) setQuestionnaireResponses(data);
    })();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase,
        () => supabase.from("repertoire_tessitura").select("*").eq("user_id", userId),
        "曲目のテッシトゥーラ登録の取得"
      );
      if (error) {
        console.error("曲目のテッシトゥーラ登録の読み込みに失敗しました:", error, "userId:", userId);
      }
      if (mounted && data) {
        const map = {};
        data.forEach((row) => {
          map[row.repertoire_name] = {
            tessituraNote: row.tessitura_note || null,
            topNote: row.top_note || null,
            dOverride: row.d_override,
            confidence: row.confidence || "entered",
            usageCount: row.usage_count || 0,
            singingLanguage: row.singing_language || null
          };
        });
        setRepertoireTessituraMap(map);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  // 職業別項目の再設計と学ぶ画面 §5: 役マスタ・案件マスタ（レパートリーと全く同じ仕組み）
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase, () => supabase.from("role_master").select("*").eq("user_id", userId), "役マスタの取得"
      );
      if (error) console.error("役マスタの読み込みに失敗しました:", error, "userId:", userId);
      if (mounted && data) {
        const map = {};
        data.forEach((row) => {
          map[row.role_name] = { workTitle: row.work_title || "", pitchLowNote: row.pitch_low_note || null, pitchHighNote: row.pitch_high_note || null, voiceQuality: row.voice_quality || null };
        });
        setRoleMasterMap(map);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase, () => supabase.from("project_master").select("*").eq("user_id", userId), "案件マスタの取得"
      );
      if (error) console.error("案件マスタの読み込みに失敗しました:", error, "userId:", userId);
      if (mounted && data) {
        const map = {};
        data.forEach((row) => {
          map[row.project_name] = { scriptType: row.script_type || null, speechSpeed: row.speech_speed || null, isLive: !!row.is_live };
        });
        setProjectMasterMap(map);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data, error } = await runQueryWithAuthRetry(
        supabase,
        () =>
          supabase
            .from("profiles")
            .select("height_cm, voice_type, nutrition_phase, protein_coefficient, age, sex, garden_theme, character_points_spent, character_equipped, vocal_range_low, vocal_range_high, comfort_range_low, comfort_range_high, technical_goal, health_notes, vocal_profession, track_cycle, conditions, onboarding_completed, consent_health_data_at, consent_stats_use_at, consent_policy_version, professions, goal_focus, practice_goal, practice_goal_tags, practice_goal_started_at, practice_reviews, folded_groups, survey_day7_shown_at, survey_day7_response, line_user_id, line_link_code, line_linked_at, line_notification_enabled, day_record_boundary_hour, teacher_beta_access, display_name, is_admin")
            .eq("id", userId)
            .single(),
        "プロフィール（羊の装備を含む）の取得"
      );
      if (error) {
        console.error("プロフィール（羊の装備を含む）の読み込みに失敗しました:", error, "userId:", userId);
      }
      if (mounted && data) {
        setProfile({
          height_cm: data.height_cm ?? "",
          voice_type: data.voice_type ?? "",
          nutrition_phase: data.nutrition_phase || "維持",
          protein_coefficient: data.protein_coefficient ?? 1.6,
          age: data.age ?? "",
          sex: data.sex ?? "",
          garden_theme: data.garden_theme || "rose",
          vocal_range_low: data.vocal_range_low || "",
          vocal_range_high: data.vocal_range_high || "",
          comfort_range_low: data.comfort_range_low || "",
          comfort_range_high: data.comfort_range_high || "",
          technical_goal: data.technical_goal || "",
          health_notes: data.health_notes || "",
          conditions: data.conditions || [],
          onboarding_completed: data.onboarding_completed ?? false,
          consent_health_data_at: data.consent_health_data_at || null,
          consent_stats_use_at: data.consent_stats_use_at || null,
          consent_policy_version: data.consent_policy_version || null,
          // ★professions が空のまま登録された古いデータがある。空のままだと
          //   effectiveProfessions が空になり、職業別の出し分けが丸ごと効かない。
          //   単一値（vocal_profession）から補う。
          professions: (data.professions && data.professions.length > 0)
            ? data.professions
            : (data.vocal_profession ? [data.vocal_profession] : []),
          goal_focus: data.goal_focus || "",
          practice_goal: data.practice_goal || "",
          practice_goal_tags: data.practice_goal_tags || [],
          practice_goal_started_at: data.practice_goal_started_at || null,
          practice_reviews: data.practice_reviews || [],
          folded_groups: data.folded_groups || [],
          survey_day7_shown_at: data.survey_day7_shown_at || null,
          survey_day7_response: data.survey_day7_response || "",
          line_user_id: data.line_user_id || null,
          line_link_code: data.line_link_code || null,
          line_linked_at: data.line_linked_at || null,
          line_notification_enabled: data.line_notification_enabled ?? true,
          day_record_boundary_hour: data.day_record_boundary_hour ?? 21,
          teacher_beta_access: data.teacher_beta_access || false,
          display_name: data.display_name || "",
          is_admin: data.is_admin || false,
          vocal_profession: data.vocal_profession || "singer",
          track_cycle: data.track_cycle || false
        });
        setCharacterPointsSpent(data.character_points_spent || 0);
        setCharacterEquipped(data.character_equipped || {});
      }
      // 統合実行ルートv4 G2-8: かんたん記録／しっかり記録の設定。
      // ★上の本体クエリには足さない。supabase/migration_record_mode.sql を
      //   まだ実行していない環境では列が無く、本体クエリごと失敗してしまうため。
      //   ここだけ別に取り、失敗したら既定（しっかり記録）のまま動かす。
      const { data: modeRow } = await supabase
        .from("profiles").select("record_mode").eq("id", userId).maybeSingle();
      // アレルギー・常用薬も、migration_profile_health_fields.sql 未実行の環境が
      // ありうるので、本体クエリとは分けて寛容に読む（record_mode と同じ理由）。
      // 削除の猶予期間中かどうか。migration_account_soft_delete.sql が未実行の
      // 環境では列が無いので、本体クエリとは分けて寛容に読む。
      const { data: delRow } = await supabase
        .from("profiles").select("deleted_at").eq("id", userId).maybeSingle();
      if (mounted && delRow) setProfile((prev) => ({ ...prev, deleted_at: delRow.deleted_at || null }));

      // 周期をホームに出すか（§4-3 の3段階の②）。列が無い環境でも壊さない。
      const { data: cycleRow } = await supabase
        .from("profiles").select("cycle_show_on_home").eq("id", userId).maybeSingle();
      if (mounted && cycleRow && cycleRow.cycle_show_on_home != null) {
        setProfile((prev) => ({ ...prev, cycle_show_on_home: cycleRow.cycle_show_on_home }));
      }

      const { data: healthRow } = await supabase
        .from("profiles").select("allergies, regular_medications").eq("id", userId).maybeSingle();
      if (mounted && healthRow) {
        setProfile((prev) => ({
          ...prev,
          allergies: healthRow.allergies || [],
          regular_medications: healthRow.regular_medications || []
        }));
      }
      let mode = modeRow && modeRow.record_mode ? modeRow.record_mode : null;
      if (!mode) {
        // 列がまだ無い環境では、端末に覚えさせた値を使う。
        try { mode = window.localStorage.getItem("la-voce-record-mode"); } catch (e) { mode = null; }
      }
      if (mounted && mode) {
        setProfile((prev) => ({ ...prev, record_mode: mode }));
      }
      const { data: inventoryRows } = await supabase.from("character_inventory").select("item_key").eq("user_id", userId);
      if (mounted && inventoryRows) {
        setOwnedItemKeys(inventoryRows.map((r) => r.item_key));
      }
      if (mounted) setProfileLoading(false);
    })();
    return () => { mounted = false; };
  }, [userId]);

  // 指導者プラン実装仕様: 自分が関わる紐付け（先生として・生徒として）を取得する。
  // teacher_beta_accessを持たないユーザーでも、他人から生徒として招待される可能性はあるため、
  // この取得自体は全ユーザーに対して行う（表示するかどうかはUI側で絞る）。
  useEffect(() => {
    fetchTeacherLinks();
    fetchMyAllLessons();
    fetchMyRecentComments();
    fetchLearnState();
    fetchMyOrgs();
    fetchMyEnrollments();
    fetchMyTeachingLessons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (loading) return;
    setFormData(buildFormData(selectedDate, entries));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, loading]);

  const t = useMemo(() => createTranslator(language), [language]);
  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language]);
  const currentScore = useMemo(() => computeOverallScore(formData), [formData]);
  const yesterdayContext = useMemo(() => {
    const yDate = addDays(selectedDate, -1);
    const y = entries[yDate];
    if (!y) return null;
    const { dinnerGap, flags } = computeConditionFlags(y);
    return {
      date: yDate,
      sleepHours: y.sleepHours,
      sleepQuality: y.sleepQuality,
      bedtime: y.bedtime,
      dinnerTime: y.dinnerTime,
      dinnerGap,
      dinnerTags: y.dinnerTags || [],
      activityType: y.activityType,
      weather: y.weather,
      flags: flags.map((f) => f.flagKey)
    };
  }, [entries, selectedDate]);
  // 職業ごとに、危険信号を検知する時間軸としきい値を変える。
  // 声優＝急性（その日のセッション単体）、アナウンサー＝本番前（直近数日の累積）、
  // ポップス/ミュージカル歌手＝慢性（連続公演日数）。声楽家は既存の yesterdayContext が担う。
  const loadWarnings = useMemo(() => {
    const profession = profile.vocal_profession || "singer";
    const today = formData ? formData.loadDetail || {} : {};
    const warnings = [];

    if (profession === "voice_actor") {
      const mins = Number(today.sessionMinutes) || 0;
      if (today.hasExtremeVocalization === true && mins >= 120) {
        warnings.push("loadWarnVoiceActorAcute");
      }
    }

    if (profession === "announcer") {
      const recentDates = [addDays(selectedDate, -1), addDays(selectedDate, -2)];
      const recentMinutes = recentDates.reduce((sum, d) => {
        const e = entries[d];
        const m = e && e.loadDetail ? Number(e.loadDetail.onAirMinutes) || 0 : 0;
        return sum + m;
      }, 0);
      if (recentMinutes >= 180) {
        warnings.push("loadWarnAnnouncerPreBroadcast");
      }
    }

    if (profession === "pop_musical") {
      const day = Number(today.consecutivePerformanceDay) || 0;
      if (day >= 3) {
        warnings.push("loadWarnPopMusicalConsecutive");
      }
    }

    return warnings;
  }, [profile.vocal_profession, formData, entries, selectedDate]);
  // 分析タブ用の「声の状態の予測」。selectedDate（今日タブでの表示中の日）とは独立して、
  // 常に実際の「今日」から見た前日の記録をもとに、理論的な根拠つきで解説する。
  const voicePrediction = useMemo(() => {
    const realToday = realTodayDate;
    const yDate = addDays(realToday, -1);
    const y = entries[yDate];
    if (!y) return { hasData: false, date: yDate, flags: [] };
    const { flags } = computeConditionFlags(y);
    return { hasData: true, date: yDate, flags };
  }, [entries, realTodayDate]);
  const foodLibrary = useMemo(
    () => buildFoodLibrary(entries, formData ? formData.meals : []),
    [entries, formData]
  );
  const waterTotal = useMemo(() => {
    const bySlot = formData ? formData.waterBySlot || {} : {};
    return Object.values(bySlot).reduce((total, v) => total + (Number(v) || 0), 0);
  }, [formData]);
  const exerciseTotalMinutes = useMemo(() => {
    const exercises = formData ? formData.exercises || [] : [];
    return exercises.reduce((total, x) => total + (Number(x.minutes) || 0), 0);
  }, [formData]);
  const currentBMI = useMemo(
    () => computeBMI(formData && formData.weightKg ? Number(formData.weightKg) : null, profile.height_cm ? Number(profile.height_cm) : null),
    [formData, profile.height_cm]
  );
  const nutritionTargets = useMemo(() => {
    const w = (formData && formData.weightKg) ? Number(formData.weightKg) : getLatestWeight(entries, selectedDate);
    return computeNutritionTargets(w, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient);
  }, [formData, entries, selectedDate, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient]);
  // lavoce-記録項目の再設計v2.md §3.4: 食品を1件も記録していない日は、簡易3択からの推定値を使う。
  const simpleMealMacros = useMemo(() => {
    if (!formData || (formData.meals || []).length > 0) return null;
    if (formData.proteinLevel == null && formData.calorieLevel == null) return null;
    return estimateSimpleMealMacros(nutritionTargets, formData.proteinLevel ?? 1, formData.calorieLevel ?? 1);
  }, [formData, nutritionTargets]);
  const mealTotals = useMemo(() => {
    const meals = formData ? formData.meals || [] : [];
    if (meals.length === 0 && simpleMealMacros) {
      return { carbs: simpleMealMacros.carbsG, protein: simpleMealMacros.proteinG, fat: simpleMealMacros.fatG, fiber: simpleMealMacros.fiberG };
    }
    return {
      carbs: sumMacro(meals, "carbs"),
      protein: sumMacro(meals, "protein"),
      fat: sumMacro(meals, "fat"),
      fiber: sumMacro(meals, "fiber")
    };
  }, [formData, simpleMealMacros]);
  const sortedDates = useMemo(() => Object.keys(entries).sort().reverse(), [entries]);
  const monthEntries = useMemo(() => {
    const prefix = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}`;
    return sortedDates.filter((d) => d.startsWith(prefix));
  }, [sortedDates, viewMonth]);
  const calendarCells = useMemo(() => {
    const { daysInMonth, startWeekday } = monthMeta(viewMonth.year, viewMonth.month);
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, iso, entry: entries[iso] || null });
    }
    return cells;
  }, [viewMonth, entries]);
  // 分析期間で絞り込んだ記録データ。分析タブの計算だけがこれを使い、
  // 「今日」「履歴」「羊」タブなどが参照する entries 本体には一切手を加えない。
  const filteredEntries = useMemo(() => {
    if (analysisPeriod === "all") return entries;
    const today = new Date();
    let startISO, endISO;
    if (analysisPeriod === "week") {
      const start = new Date(today); start.setDate(start.getDate() - 6);
      startISO = toISODate(start); endISO = toISODate(today);
    } else if (analysisPeriod === "month") {
      const start = new Date(today); start.setDate(start.getDate() - 29);
      startISO = toISODate(start); endISO = toISODate(today);
    } else if (analysisPeriod === "year") {
      const start = new Date(today); start.setFullYear(start.getFullYear() - 1);
      startISO = toISODate(start); endISO = toISODate(today);
    } else if (analysisPeriod === "aroundPerformance") {
      // 数字の作法④: 暦の区切りではなく、声のプロの実感に合わせて「直近の本番」を基準にした期間。
      const performanceDates = Object.keys(entries).filter((d) => entryHasActivityKind(entries[d], "本番")).sort();
      if (performanceDates.length === 0) return {};
      const lastPerformance = performanceDates[performanceDates.length - 1];
      startISO = addDays(lastPerformance, -14);
      endISO = addDays(lastPerformance, 14);
    } else if (analysisPeriod === "custom") {
      startISO = analysisCustomStart || "0000-01-01";
      endISO = analysisCustomEnd || "9999-12-31";
    } else {
      return entries;
    }
    const result = {};
    Object.keys(entries).forEach((d) => {
      if (d >= startISO && d <= endISO) result[d] = entries[d];
    });
    return result;
  }, [entries, analysisPeriod, analysisCustomStart, analysisCustomEnd]);
  // メンタル（こころの落ち着き度=ease）が低かった日を、選んだ分析期間の中から集める。
  // 診断や原因の断定はせず、本人が実際に書いた理由をそのまま並べて振り返れるようにするだけに留める。
  const lowEaseEntries = useMemo(() => {
    return Object.keys(filteredEntries)
      .filter((d) => typeof filteredEntries[d].ease === "number" && filteredEntries[d].ease <= 2)
      .sort()
      .reverse()
      .map((d) => ({ date: d, ease: filteredEntries[d].ease, mentalReason: filteredEntries[d].mentalReason || "", mentalTags: filteredEntries[d].mentalTags || [] }));
  }, [filteredEntries]);
  // こころの落ち着き度の推移グラフ用: timeSeries（常に直近30日固定）ではなく、
  // 分析タブで選んだ期間（週/月/年/カスタム）に合わせたease専用の時系列データ。
  const easeTimeSeries = useMemo(() => {
    return Object.keys(filteredEntries)
      .sort()
      .map((d) => ({
        date: d.slice(5),
        fullDate: d,
        ease: typeof filteredEntries[d].ease === "number" ? filteredEntries[d].ease : null
      }));
  }, [filteredEntries]);

  // ---- 中核族の群間比較（分析の検出力と族の設計.md §1）----
  //
  // ★これが族を分けた目的です。少数の、機序のはっきりした項目だけを検定し、
  //   その中だけで BH-FDR をかけます。項目を増やすほど検出力が落ちる形から抜けます。
  //
  // ★3ゲート（件数・効果量・FDR）は §6-1 のまま。ここでも同じ関数を通します。
  // ★群の作り方・ずらし方は lib/analysisFamilies.js が持ちます。ここには書きません。
  const coreFindings = useMemo(() => {
    const groups = buildCoreGroups(filteredEntries, (e) => (e && typeof e.throatCondition === "number" ? e.throatCondition : null));
    const withStats = groups.map((g) => {
      const res = computeHedgesG(g.split.high, g.split.low);
      if (!res) return null;
      // 効果量から p 値を出す（群間比較なので t 検定に相当する形で近似する）
      const nTotal = res.n1 + res.n0;
      const tStat = res.g * Math.sqrt((res.n1 * res.n0) / nTotal);
      const pValue = nTotal > 2 ? tDistPValue(tStat, nTotal - 2) : null;
      return { key: g.key, label: CORE_LABELS[g.key], ...res, pValue };
    }).filter(Boolean);
    // ★BH はこの中核族の中だけでかける
    const passes = benjaminiHochberg(withStats.map((x) => x.pValue), NARRATIVE_FDR_Q);
    return withStats.map((r, i) => ({ ...r, fdrPass: passes[i] }));
  }, [filteredEntries]);

  // ---- 周期の族（分析の検出力と族の設計.md §1-2）----
  //
  // ★中核に混ぜません。使っている人だけの分析なので、混ぜると
  //   全員が記録する4項目の検出力まで下げてしまいます。
  //   独立した族として、この中だけで BH-FDR をかけます。
  //   ★いまこの族の検定は1つだけなので、BH は p ≤ q と同じになります。
  //     それでも同じ道を通しておきます。項目が増えたときに、
  //     ここだけ素通しのままになるのを避けるためです。
  //
  // ★位相（何日目か）では区切りません。「在周期中かどうか」の二値です。
  //   区切り方そのものが結論を作るため（§3-G で4分割をやめたのと同じ理由）。
  const cycleFindings = useMemo(() => {
    if (!cycleTrackingOn(profile)) return null;
    const bleeding = buildBleedingDayset(cyclePeriods, realTodayDate);
    const split = buildCycleGroups(filteredEntries, bleeding,
      (e) => (e && typeof e.throatCondition === "number" ? e.throatCondition : null));
    if (!split) return null;
    const res = computeHedgesG(split.high, split.low);
    if (!res) return null;
    const nTotal = res.n1 + res.n0;
    const tStat = res.g * Math.sqrt((res.n1 * res.n0) / nTotal);
    const pValue = nTotal > 2 ? tDistPValue(tStat, nTotal - 2) : null;
    const passes = benjaminiHochberg([pValue], NARRATIVE_FDR_Q);
    return { key: CYCLE_FACTOR, label: CYCLE_LABEL, ...res, pValue, fdrPass: passes[0] };
  }, [profile, cyclePeriods, filteredEntries, realTodayDate]);

  const correlationResults = useMemo(() => {
    if (analysisTarget === "performance") {
      return getCorrelationData(filteredEntries, "performanceQuality", (e) => entryHasActivityKind(e, "本番") && typeof e.performanceQuality === "number", t);
    }
    if (analysisTarget === "ease") {
      return getCorrelationData(filteredEntries, "ease", (e) => typeof e.ease === "number", t);
    }
    return getCorrelationData(filteredEntries, "throatCondition", (e) => typeof e.throatCondition === "number", t);
  }, [filteredEntries, analysisTarget, t]);
  const chartData = useMemo(
    () => correlationResults.filter((r) => r.r != null).sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).map(({ key, label, r, n }) => ({ key, label, r, n })),
    [correlationResults]
  );

  useEffect(() => {
    const withR = correlationResults.filter((r) => r.r != null);
    if (withR.length > 0) {
      const best = withR.reduce((a, b) => (Math.abs(b.r) > Math.abs(a.r) ? b : a));
      setSelectedFactorKey(best.key);
    } else {
      setSelectedFactorKey(null);
    }
  }, [correlationResults]);

  const scatterInfo = useMemo(() => correlationResults.find((r) => r.key === selectedFactorKey) || null, [correlationResults, selectedFactorKey]);
  const insights = useMemo(() => {
    const targetLabel = analysisTarget === "performance" ? t("targetPerformance") : analysisTarget === "ease" ? t("targetEase") : t("targetThroat");
    return generateInsights(correlationResults, targetLabel, t);
  }, [correlationResults, analysisTarget, t]);
  const voiceMemoEntries = useMemo(() => {
    return Object.keys(filteredEntries)
      .filter((d) => (filteredEntries[d].voiceMemo || "").trim())
      .sort()
      .reverse()
      .slice(0, 10)
      .map((d) => ({ date: d, ...filteredEntries[d] }));
  }, [filteredEntries]);
  // lavoce-画面レイアウト仕様_1.md §6.1: ノートタブの「メモ」は分析の期間セレクタと無関係に、
  // 常に直近のメモを見せる（分析タブの期間設定次第で見えなくなるのを防ぐ）。
  const voiceMemoEntriesAllTime = useMemo(() => {
    return Object.keys(entries)
      .filter((d) => (entries[d].voiceMemo || "").trim())
      .sort()
      .reverse()
      .slice(0, 30)
      .map((d) => ({ date: d, ...entries[d] }));
  }, [entries]);
  const timeOfDayStats = useMemo(() => {
    const sums = {};
    VOICE_TIME_SLOTS.forEach(({ key }) => { sums[key] = { throatSum: 0, throatN: 0, voiceSum: 0, voiceN: 0 }; });
    Object.values(filteredEntries).forEach((e) => {
      const checkins = e.voiceCheckins || {};
      VOICE_TIME_SLOTS.forEach(({ key }) => {
        const c = checkins[key];
        if (c && typeof c.throat === "number") { sums[key].throatSum += c.throat; sums[key].throatN += 1; }
        if (c && typeof c.voice === "number") { sums[key].voiceSum += c.voice; sums[key].voiceN += 1; }
      });
    });
    return VOICE_TIME_SLOTS.map(({ key, icon, labelKey }) => ({
      key, icon, labelKey,
      avgThroat: sums[key].throatN ? sums[key].throatSum / sums[key].throatN : null,
      avgVoice: sums[key].voiceN ? sums[key].voiceSum / sums[key].voiceN : null,
      n: Math.max(sums[key].throatN, sums[key].voiceN)
    }));
  }, [filteredEntries]);
  const restMethodStats = useMemo(() => {
    const byMethod = {};
    Object.values(filteredEntries).forEach((e) => {
      // 休養は活動ブロックではなく、日ごとの recovery として独立管理する（曲目複数化パッチ §2.0.1）
      if (!e.recovery || (e.activities && e.activities.length > 0)) return;
      const methods = e.recovery.methods || [];
      // §3.10: 「その他」の自由記述は集計に使わない（表記ゆれで集計が壊れるため）。
      // 選択肢のみを集計対象にし、自由記述は note として保持するだけに留める。
      methods.forEach((m) => {
        if (!byMethod[m]) byMethod[m] = { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 };
        if (typeof e.throatCondition === "number") byMethod[m].throatSum += e.throatCondition;
        if (typeof e.voiceQuality === "number") byMethod[m].voiceSum += e.voiceQuality;
        if (typeof e.ease === "number") byMethod[m].easeSum += e.ease;
        byMethod[m].n += 1;
      });
    });
    const all = Object.entries(byMethod).map(([method, s]) => ({
      method, n: s.n,
      avgThroat: s.n ? s.throatSum / s.n : null,
      avgVoice: s.n ? s.voiceSum / s.n : null,
      avgEase: s.n ? s.easeSum / s.n : null
    }));
    // 統合実行ルートv4 §6-2: 件数の下限は displayGates.js の rest.average に集約した。
    // ここで直接 n≥3 と書かないこと（画面ごとに条件が散らばるのを防ぐため）。
    return {
      confident: all.filter((s) => gateAllows("rest.average", { n: s.n })),
      lowN: all.filter((s) => !gateAllows("rest.average", { n: s.n })).sort((a, b) => b.n - a.n)
    };
  }, [filteredEntries]);
  // 声の調子スコア（過去2週間の平均から算出する、100点満点の参考指標）。
  // 医学的な診断値ではなく、これまで記録してきた項目を独自の重み付けで統合したもの。
  // 各項目の内訳も併せて返し、ブラックボックスにしない。
  const vocalConditionScore = useMemo(() => {
    const realToday = realTodayDate;
    const startDate = addDays(realToday, -13);
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = addDays(startDate, i);
      if (entries[d]) days.push(entries[d]);
    }
    if (days.length < 3) return { hasEnoughData: false, daysCount: days.length };

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

    const throatVals = days.map((e) => e.throatCondition).filter((v) => typeof v === "number");
    const voiceVals = days.map((e) => e.voiceQuality).filter((v) => typeof v === "number");
    const easeVals = days.map((e) => e.ease).filter((v) => typeof v === "number");
    const sleepHoursVals = days.map((e) => e.sleepHours).filter((v) => typeof v === "number");
    const sleepQualityVals = days.map((e) => e.sleepQuality).filter((v) => typeof v === "number");
    const waterVals = days
      .map((e) => Object.values(e.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0))
      .filter((v) => v > 0);

    const throatScore = throatVals.length ? (avg(throatVals) / 5) * 100 : null;
    const voiceScore = voiceVals.length ? (avg(voiceVals) / 5) * 100 : null;
    const easeScore = easeVals.length ? (avg(easeVals) / 5) * 100 : null;

    let sleepHoursScore = null;
    if (sleepHoursVals.length) {
      const h = avg(sleepHoursVals);
      if (h >= 7 && h <= 9) sleepHoursScore = 100;
      else if (h < 7) sleepHoursScore = Math.max(0, 100 - (7 - h) * 20);
      else sleepHoursScore = Math.max(0, 100 - (h - 9) * 15);
    }
    const sleepQualityScore = sleepQualityVals.length ? (avg(sleepQualityVals) / 5) * 100 : null;
    let sleepScore = null;
    if (sleepHoursScore != null && sleepQualityScore != null) sleepScore = (sleepHoursScore + sleepQualityScore) / 2;
    else sleepScore = sleepHoursScore ?? sleepQualityScore;

    const symptomDays = days.filter((e) => (e.throatSymptoms || []).length > 0).length;
    const symptomScore = 100 - (symptomDays / days.length) * 100;

    const waterScore = waterVals.length ? Math.min(100, (avg(waterVals) / 2000) * 100) : null;

    const components = [
      { key: "throat", labelKey: "scoreCompThroat", score: throatScore, weight: 25 },
      { key: "voice", labelKey: "scoreCompVoice", score: voiceScore, weight: 20 },
      { key: "sleep", labelKey: "scoreCompSleep", score: sleepScore, weight: 20 },
      { key: "mental", labelKey: "scoreCompMental", score: easeScore, weight: 15 },
      { key: "symptom", labelKey: "scoreCompSymptom", score: symptomScore, weight: 10 },
      { key: "water", labelKey: "scoreCompWater", score: waterScore, weight: 10 }
    ];

    const validComponents = components.filter((c) => c.score != null);
    const totalWeight = validComponents.reduce((s, c) => s + c.weight, 0);
    if (totalWeight === 0) return { hasEnoughData: false, daysCount: days.length };
    const weightedSum = validComponents.reduce((s, c) => s + c.score * c.weight, 0);
    const total = Math.round(weightedSum / totalWeight);

    // 数字の作法③: 各サブスコアの「押し下げ量」= 全体に対する重みの割合 × (100点との差)。
    // 総合点そのものより、「どの項目がいちばん効いているか」の方が行動につながる。
    const withPullDown = validComponents
      .map((c) => ({ ...c, pullDown: (c.weight / totalWeight) * (100 - c.score) }))
      .sort((a, b) => b.pullDown - a.pullDown);
    const topPullDown = withPullDown[0] && withPullDown[0].pullDown >= 1 ? withPullDown[0] : null;

    return { hasEnoughData: true, total, components, pullDowns: withPullDown, topPullDown, daysCount: days.length };
  }, [entries, realTodayDate]);
  const timeSeries = useMemo(() => {
    const dates = Object.keys(filteredEntries).sort();
    return dates.map((date) => {
      const e = filteredEntries[date];
      const w = e.weightKg || getLatestWeight(entries, date);
      const targets = computeNutritionTargets(w, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient);
      const calorieActual = (e.carbs || 0) * 4 + (e.protein || 0) * 4 + (e.fat || 0) * 9;
      return {
        date: date.slice(5),
        fullDate: date,
        // ★§3-D: 本番・レッスンの日を、色と大きさの両方で区別するための印。
        //   色だけに頼らない（色覚多様性への対応でもある）。
        isKeyDay: entryHasActivityKind(e, "本番") || entryHasActivityKind(e, "レッスン"),
        weightKg: e.weightKg || null,
        proteinPerKg: (w && e.protein) ? roundTo1(e.protein / w) : null,
        sleepHours: typeof e.sleepHours === "number" ? e.sleepHours : null,
        sleepQuality: typeof e.sleepQuality === "number" ? e.sleepQuality : null,
        calorieActual: calorieActual > 0 ? Math.round(calorieActual) : null,
        calorieTarget: targets ? Math.round(targets.calorieTarget) : null,
        ease: typeof e.ease === "number" ? e.ease : null,
        resonanceScore: typeof e.resonanceScore === "number" ? e.resonanceScore : null,
        wakeMidi: noteToMidi(e.wakeNote),
        routineMidi: noteToMidi(e.routineNote),
        pianissimoMidi: noteToMidi(e.pianissimoHighNote),
        wakeNoteLabel: e.wakeNote || null,
        routineNoteLabel: e.routineNote || null,
        pianissimoNoteLabel: e.pianissimoHighNote || null,
        activityType: e.activityType || null,
        activityColor: ACTIVITY_CHART_COLORS[e.activityType] || C.line
      };
    });
  }, [filteredEntries, entries, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient]);
  const locationStats = useMemo(() => {
    const byLoc = {};
    Object.values(filteredEntries).forEach((e) => {
      const loc = (e.location || "").trim();
      if (!loc) return;
      if (!byLoc[loc]) byLoc[loc] = { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 };
      if (typeof e.throatCondition === "number") byLoc[loc].throatSum += e.throatCondition;
      if (typeof e.voiceQuality === "number") byLoc[loc].voiceSum += e.voiceQuality;
      if (typeof e.ease === "number") byLoc[loc].easeSum += e.ease;
      byLoc[loc].n += 1;
    });
    const all = Object.entries(byLoc).map(([location, s]) => ({
      location, n: s.n,
      avgThroat: s.n ? s.throatSum / s.n : null,
      avgVoice: s.n ? s.voiceSum / s.n : null,
      avgEase: s.n ? s.easeSum / s.n : null
    }));
    // 統合実行ルートv4 §6-2: 件数の下限は displayGates.js の location.average に集約した。
    return {
      confident: all.filter((s) => gateAllows("location.average", { n: s.n })).sort((a, b) => b.n - a.n),
      lowN: all.filter((s) => !gateAllows("location.average", { n: s.n })).sort((a, b) => b.n - a.n)
    };
  }, [filteredEntries]);

  // ---- ここから「メンタル」まとめセクション用のデータ ----
  // 「今の気持ちに近いもの」タグを、心の余裕が低かった日／高かった日で集計し、
  // それぞれで多く選ばれているタグを見つける。診断ではなく、あくまで記録の傾向を見返すためのもの。
  const mentalTagStats = useMemo(() => {
    const lowCounts = {};
    const highCounts = {};
    let lowTotal = 0;
    let highTotal = 0;
    Object.values(filteredEntries).forEach((e) => {
      if (typeof e.ease !== "number") return;
      const tags = e.mentalTags || [];
      if (e.ease <= 2) {
        lowTotal += 1;
        tags.forEach((tag) => { lowCounts[tag] = (lowCounts[tag] || 0) + 1; });
      } else if (e.ease >= 4) {
        highTotal += 1;
        tags.forEach((tag) => { highCounts[tag] = (highCounts[tag] || 0) + 1; });
      }
    });
    const toSorted = (counts) =>
      Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
    // 統合実行ルートv4 §6-4: 気持ちタグの傾向も表示ゲートを経由する。
    // 心の余裕が低かった日／高かった日のどちらかが少なすぎるうちは、比べて見せない。
    const lowGate = evaluateGate("mentalTag.trend", { n: lowTotal }, t);
    const highGate = evaluateGate("mentalTag.trend", { n: highTotal }, t);
    return {
      low: lowGate.passed ? toSorted(lowCounts) : [],
      lowTotal,
      high: highGate.passed ? toSorted(highCounts) : [],
      highTotal,
      gateMessage: (!lowGate.passed && !highGate.passed) ? lowGate.message : null
    };
  }, [filteredEntries, t]);
  // 休養方法・滞在地それぞれの中で、心の余裕の平均が最も高いものを1つずつ拾う（件数2件未満は参考にならないので除外）。
  const mentalTopGroups = useMemo(() => {
    const bestRest = restMethodStats.confident
      .filter((s) => typeof s.avgEase === "number")
      .sort((a, b) => b.avgEase - a.avgEase)[0] || null;
    const bestLocation = locationStats.confident
      .filter((s) => typeof s.avgEase === "number")
      .sort((a, b) => b.avgEase - a.avgEase)[0] || null;
    return { bestRest, bestLocation };
  }, [restMethodStats, locationStats]);
  // ---- 「メンタル」まとめセクション用データ ここまで ----

  // ---- ここから、各グループ横断のクロス分析用データ ----
  // timeSeries（体重・タンパク質・カロリー・心の余裕・声の出来など）に、
  // filteredEntries側にしかない喉のコンディション・声の質を日付で突き合わせて1つにまとめる。
  const crossFactorDaily = useMemo(() => {
    return timeSeries.map((row) => {
      const e = filteredEntries[row.fullDate] || {};
      return {
        ...row,
        throatCondition: typeof e.throatCondition === "number" ? e.throatCondition : null,
        voiceQuality: typeof e.voiceQuality === "number" ? e.voiceQuality : null
      };
    });
  }, [timeSeries, filteredEntries]);

  // 「食事」用: 喉のコンディションが良かった日／悪かった日それぞれで、よく食べていたものを集計する。
  // 診断や断定ではなく、記録上の傾向をそのまま見返せるようにするだけのもの。
  // ---- 統合実行ルートv4 §2 瞬間③ / P0-1: 食事の分析 ----
  //
  // ★以前ここは「調子が良かった日に食べたものの回数」と「悪かった日に食べたものの回数」を
  //   並べているだけだった。その結果が「良い日も悪い日も白米」で、情報量がゼロなうえ、
  //   矛盾した文章がそのまま出ていた。原因は3つあり、3つとも直す。
  //
  //   ① 回数で語っていた → 効果量（Hedges' g）で語る。
  //      両方向に同じだけ出る食品は g が0付近になり、自動的に何も言わなくなる。
  //   ② 同じ日どうしで比べていた → 「前夜に食べた → 翌日の声」に方向を固定する
  //      （指標設計図.md §04）。同日だと「声が良かったからよく食べた」を拾ってしまう。
  //   ③ 毎日食べる主食が交絡していた → ほぼ毎日食べているものは既定で比較から外す
  //      （指標設計図.md §04 の「週の摂取頻度で層別」に対応する最小の実装）。
  //      白米が両方に出ていたのは、まさにこれ。
  const DIET_STAPLE_RATIO = 0.85; // これ以上の割合の日に登場する食品は「主食」とみなして除外
  const dietFoodEffects = useMemo(() => {
    const dates = Object.keys(filteredEntries).sort();
    // 「前夜の食事 → 翌日の声」のペアだけを使う（連続した2日でなければ使わない）。
    const pairs = [];
    dates.forEach((date, i) => {
      const nextDate = dates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = filteredEntries[nextDate];
      const throatV = typeof nextEntry.throatCondition === "number" ? nextEntry.throatCondition : null;
      const voiceV = typeof nextEntry.voiceQuality === "number" ? nextEntry.voiceQuality : null;
      if (throatV == null && voiceV == null) return;
      const score = throatV != null && voiceV != null ? (throatV + voiceV) / 2 : (throatV ?? voiceV);
      const foods = new Set((filteredEntries[date].meals || []).map((m) => (m.name || "").trim()).filter(Boolean));
      pairs.push({ foods, score });
    });
    if (pairs.length === 0) return { effects: [], excludedStaples: [], pairCount: 0 };

    const names = new Set();
    pairs.forEach((p) => p.foods.forEach((n) => names.add(n)));

    const excludedStaples = [];
    const results = [];
    names.forEach((name) => {
      const group1 = [], group0 = [];
      pairs.forEach((p) => (p.foods.has(name) ? group1 : group0).push(p.score));
      // ③ ほぼ毎日食べているものは、比較そのものが成り立たないので外す。
      if (group1.length / pairs.length >= DIET_STAPLE_RATIO) {
        excludedStaples.push({ name, days: group1.length });
        return;
      }
      const res = computeHedgesG(group1, group0);
      if (!res) return;
      results.push({ name, ...res, stars: starRatingForEffect(res) });
    });

    // 多くの食品を一斉に比べているので、文章にする前に多重比較を補正する（§6-1 ③）。
    const pValues = results.map((r) => {
      const J = 1 - 3 / (4 * (r.n1 + r.n0) - 9);
      const tStat = (r.g / J) / Math.sqrt(1 / r.n1 + 1 / r.n0);
      return tDistPValue(tStat, r.n1 + r.n0 - 2);
    });
    const passes = benjaminiHochberg(pValues, NARRATIVE_FDR_Q);
    return {
      effects: results
        .map((r, i) => ({ ...r, fdrPass: passes[i] }))
        .sort((a, b) => Math.abs(b.g) - Math.abs(a.g)),
      excludedStaples: excludedStaples.sort((a, b) => b.days - a.days),
      pairCount: pairs.length
    };
  }, [filteredEntries]);

  // 1対1の相関ではなく、「タンパク質・カロリー・心の余裕・睡眠、複数の条件が同時に揃っているかどうか」で
  // 日をグループ分けし、それぞれのグループで声の調子がどう違うかを比較する。
  // 各条件の基準: タンパク質は「身体データ」で設定した目標係数以上／カロリーは目標カロリー以上／
  // 心の余裕は5段階で4以上／睡眠時間は7時間以上、を「良い」とみなす。
  const compositeConditionDaily = useMemo(() => {
    const coefficient = Number(profile.protein_coefficient) || 1.6;
    return crossFactorDaily.map((d) => {
      const proteinGood = typeof d.proteinPerKg === "number" ? d.proteinPerKg >= coefficient : null;
      const calorieGood = (typeof d.calorieActual === "number" && typeof d.calorieTarget === "number") ? d.calorieActual >= d.calorieTarget : null;
      const easeGood = typeof d.ease === "number" ? d.ease >= 4 : null;
      const sleepGood = typeof d.sleepHours === "number" ? d.sleepHours >= 7 : null;
      const flags = [proteinGood, calorieGood, easeGood, sleepGood];
      const known = flags.filter((f) => f !== null);
      const goodCount = flags.filter((f) => f === true).length;
      return { ...d, proteinGood, calorieGood, easeGood, sleepGood, goodCount, knownCount: known.length };
    });
  }, [crossFactorDaily, profile.protein_coefficient]);

  // 「好条件が重なった日」（4項目中3つ以上）と「あまり重ならなかった日」（4項目中1つ以下）を比較して、
  // 声の調子（喉のコンディション・声の質・声の出来）がどう違うかを文章にする。
  // どちらかの日数が2日未満のときは、参考にできるほどのデータがまだないと判断して表示しない。
  // 現時点では日本語のみの文言（他7言語の翻訳は translations.js 側の対応が別途必要）。
  const compositePatternInsight = useMemo(() => {
    const usable = compositeConditionDaily.filter((d) => d.knownCount >= 3);
    const goodDays = usable.filter((d) => d.goodCount >= 3);
    const poorDays = usable.filter((d) => d.goodCount <= 1);

    // 統合実行ルートv4 §6-1: 文章で語るには、件数だけでなく効果量と多重比較も通すこと。
    // 以前は「各群2日以上」だけで断定的な文を出していた（P0-1）。
    // ここは1つの計画された比較なので、BH-FDR は p ≤ q（=0.10）と同値になる。
    const throatOf = (group) => group.map((d) => d.throatCondition).filter((v) => typeof v === "number");
    const effect = computeHedgesG(throatOf(goodDays), throatOf(poorDays));
    let fdrPass = false;
    if (effect) {
      const J = 1 - 3 / (4 * (effect.n1 + effect.n0) - 9);
      const tStat = (effect.g / J) / Math.sqrt(1 / effect.n1 + 1 / effect.n0);
      fdrPass = tDistPValue(tStat, effect.n1 + effect.n0 - 2) <= NARRATIVE_FDR_Q;
    }
    const comboGate = evaluateGate("combo.narrative", {
      n1: goodDays.length,
      n0: poorDays.length,
      effectSize: effect ? effect.g : null,
      fdrPass
    }, t);
    if (!comboGate.passed) return { gateMessage: comboGate.message, sentences: [] };

    const avg = (arr, key) => {
      const vals = arr.map((d) => d[key]).filter((v) => typeof v === "number");
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const describe = (group) => ({
      n: group.length,
      throat: avg(group, "throatCondition"),
      voice: avg(group, "voiceQuality"),
      resonance: avg(group, "resonanceScore")
    });
    const outcomeText = (stats) => {
      const parts = [];
      if (stats.throat != null) parts.push(t("compositeOutcomeThroat").replace("{value}", stats.throat.toFixed(1)));
      if (stats.voice != null) parts.push(t("compositeOutcomeVoice").replace("{value}", stats.voice.toFixed(1)));
      if (stats.resonance != null) parts.push(t("compositeOutcomeResonance").replace("{value}", stats.resonance.toFixed(1)));
      return parts.length ? parts.join(t("listSeparatorComma")) : null;
    };

    const good = describe(goodDays);
    const poor = describe(poorDays);
    const goodText = outcomeText(good);
    const poorText = outcomeText(poor);
    if (!goodText || !poorText) return null;

    const sentences = [
      t("compositeGoodDaysSentence").replace("{n}", good.n).replace("{outcome}", goodText),
      t("compositePoorDaysSentence").replace("{n}", poor.n).replace("{outcome}", poorText)
    ];

    const { bestRest } = mentalTopGroups;
    if (bestRest) {
      const label = REST_METHOD_KEYS[bestRest.method] ? t(REST_METHOD_KEYS[bestRest.method]) : bestRest.method;
      sentences.push(
        t("compositeRestMethodSentence")
          .replace("{method}", label)
          .replace("{avg}", bestRest.avgEase.toFixed(1))
          .replace("{n}", bestRest.n)
      );
    }
    // 統合実行ルートv4 §2 瞬間③ / P0-1: 「良い日も悪い日も白米」が出ていた場所。
    // 効果量・多重比較・前夜→翌日の方向・主食の除外を通ったものだけを文章にする。
    // 条件を満たす食品が1つも無ければ、食事については何も言わない（それが正しい）。
    const topDietEffect = dietFoodEffects.effects.find((r) =>
      gateAllows("diet.narrative", { n1: r.n1, n0: r.n0, effectSize: r.g, fdrPass: r.fdrPass }));
    if (topDietEffect) {
      sentences.push(
        t("dietEffectSentence")
          .replace("{food}", topDietEffect.name)
          .replace("{n1}", topDietEffect.n1)
          .replace("{n0}", topDietEffect.n0)
          .replace("{direction}", t(topDietEffect.g >= 0 ? "dietDirectionBetter" : "dietDirectionWorse"))
          .replace("{g}", topDietEffect.g.toFixed(2))
      );
    }
    // 主食を外したことは黙っておかない。「白米はどこへ行った」に先回りして答える。
    if (dietFoodEffects.excludedStaples.length > 0) {
      sentences.push(
        t("dietStapleExcludedNote").replace("{foods}", dietFoodEffects.excludedStaples.slice(0, 3).map((x) => x.name).join("、"))
      );
    }
    return { gateMessage: null, sentences };
  }, [compositeConditionDaily, mentalTopGroups, dietFoodEffects, t]);
  // ---- 各グループ横断のクロス分析用データ ここまで ----

  // ---- ここから、lavoce-指標設計図.md フェーズ1の3指標用データ ----
  // 段階解放の判定に使う「これまでの総記録日数」（選んだ分析期間ではなく、全期間で数える）。
  const recordedDaysTotal = useMemo(() => Object.keys(entries).length, [entries]);
  // 実行順マスター Stage 2-2: 記録7日目に達し、まだ表示も回答もしていなければマイクロ調査を出す。
  useEffect(() => {
    if (recordedDaysTotal >= 7 && !profile.survey_day7_shown_at && !profile.survey_day7_response) {
      setShowDay7Survey(true);
    }
  }, [recordedDaysTotal, profile.survey_day7_shown_at, profile.survey_day7_response]);

  // ---- lavoce-記録項目の再設計v2.md §4.3: 使っていないものは、アプリから畳む提案をする ----
  // 「設定でオンオフ」ではなく「使用実績からアプリが提案する」方式。30日間、記録が十分に
  // 溜まっている（＝アプリを使い続けている）人だけを対象にする。
  const unusedFieldGroupSuggestions = useMemo(() => {
    if (recordedDaysTotal < 30) return [];
    const dates30 = Object.keys(entries).sort().slice(-30);
    if (dates30.length < 20) return []; // 直近30日のうち記録がまばらな人には提案しない
    const folded = profile.folded_groups || [];
    const suggestions = [];
    // バグ修正: 簡易3択（exerciseLevel）の利用を「詳細記録を使った」と誤判定していたため、
    // 簡易3択だけ使い続けている人に永遠に提案が出なかった。判定を「詳細記録（exercises配列）を
    // 使ったか」に絞る。
    const usedExerciseDetail = dates30.some((d) => (entries[d].exercises || []).length > 0);
    if (!usedExerciseDetail && !folded.includes("exercise_detail")) {
      suggestions.push({ key: "exercise_detail", label: "運動の詳細記録（種目・時間・強度）" });
    }
    const usedMealDetail = dates30.some((d) => (entries[d].meals || []).length > 0);
    if (!usedMealDetail && !folded.includes("meal_detail")) {
      suggestions.push({ key: "meal_detail", label: "食事の詳細記録（食品別のPFC）" });
    }
    const usedBodyFat = dates30.some((d) => typeof entries[d].bodyFatPct === "number");
    if (!usedBodyFat && !folded.includes("body_fat")) {
      suggestions.push({ key: "body_fat", label: "体脂肪率の記録" });
    }
    const usedCpps = dates30.some((d) => typeof entries[d].cppsValue === "number");
    if (!usedCpps && !folded.includes("cpps")) {
      suggestions.push({ key: "cpps", label: "CPPS客観測定" });
    }
    const usedEnvironment = dates30.some((d) => typeof entries[d].temperature === "number" || typeof entries[d].humidity === "number");
    if (!usedEnvironment && !folded.includes("environment")) {
      suggestions.push({ key: "environment", label: "気温・湿度の記録" });
    }
    const usedMentalDetail = dates30.some((d) => (entries[d].mentalTags || []).length > 0 || (entries[d].mentalReason || "").trim());
    if (!usedMentalDetail && !folded.includes("mental_detail")) {
      suggestions.push({ key: "mental_detail", label: "気持ちタグ・日記（心の余裕の詳細）" });
    }
    const usedMedication = dates30.some((d) => (entries[d].medicationTags || []).length > 0);
    if (!usedMedication && !folded.includes("medication")) {
      suggestions.push({ key: "medication", label: "服薬タグの記録" });
    }
    return suggestions;
  }, [entries, recordedDaysTotal, profile.folded_groups]);

  // ---- lavoce-画面レイアウト仕様_1.md §3: ホーム（今日の一枚） 用データ（前半） ----
  const recordStreak = useMemo(() => {
    const realToday = realTodayDate;
    let streak = 0;
    let d = entries[realToday] ? realToday : addDays(realToday, -1);
    while (entries[d]) { streak += 1; d = addDays(d, -1); }
    return streak;
  }, [entries, realTodayDate]);
  // 次に解放される指標までの進捗（3/7/14/28日のうち、まだ届いていない最初のもの）
  const nextUnlock = useMemo(() => {
    const thresholds = [
      { days: 3, label: "症状カレンダー・音域マップ" },
      { days: 7, label: "コンディション偏差値" },
      { days: 14, label: "声の時差マップ・効いた習慣" },
      { days: 28, label: "発声負荷バランス（ACWR）" }
    ];
    return thresholds.find((t) => recordedDaysTotal < t.days) || null;
  }, [recordedDaysTotal]);
  // ---- ホーム 用データ（前半）ここまで ----


  // 03. ウォームアップ効率（起き抜け→ルーティン後の半音差）
  const warmupDaily = useMemo(() => {
    return Object.keys(filteredEntries).sort().map((date) => {
      const e = filteredEntries[date];
      const wakeMidi = noteToMidi(e.wakeNote);
      const routineMidi = noteToMidi(e.routineNote);
      const deltaST = (wakeMidi != null && routineMidi != null) ? routineMidi - wakeMidi : null;
      // lavoce-職業別項目の再設計と学ぶ画面.md §2.3: ルーティンの長さ（分）を分母にした、半音/分のレート。
      const routineEntry = (e.voiceEntries || []).find((v) => v.context === "after_routine" && typeof v.routineMinutes === "number" && v.routineMinutes > 0);
      const routineMinutes = routineEntry ? routineEntry.routineMinutes : null;
      const deltaSTPerMinute = (deltaST != null && routineMinutes) ? deltaST / routineMinutes : null;
      return { date, dateLabel: date.slice(5), wakeMidi, routineMidi, wakeNoteLabel: e.wakeNote || null, routineNoteLabel: e.routineNote || null, deltaST, routineMinutes, deltaSTPerMinute };
    });
  }, [filteredEntries]);
  // 平常値は中央値とMAD（中央絶対偏差）による頑健統計。外れ値1件に振り回されにくい。
  const warmupStats = useMemo(() => {
    const values = warmupDaily.map((d) => d.deltaST).filter((v) => v != null).sort((a, b) => a - b);
    const n = values.length;
    if (n === 0) return null;
    const median = n % 2 === 1 ? values[(n - 1) / 2] : (values[n / 2 - 1] + values[n / 2]) / 2;
    const absDevs = values.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
    const madRaw = absDevs.length % 2 === 1 ? absDevs[(absDevs.length - 1) / 2] : (absDevs[absDevs.length / 2 - 1] + absDevs[absDevs.length / 2]) / 2;
    const mad = madRaw > 0 ? madRaw : 0.5; // 0割り防止の下限
    return { median, mad, n };
  }, [warmupDaily]);
  const warmupWithZ = useMemo(() => {
    return warmupDaily.map((d, i) => {
      if (d.deltaST == null || !warmupStats) return { ...d, z: null, efficiencyPct: null, wakeMidi7d: null };
      const z = 0.6745 * (d.deltaST - warmupStats.median) / warmupStats.mad;
      const efficiencyPct = warmupStats.median !== 0 ? Math.round((d.deltaST / warmupStats.median) * 100) : null;
      const windowVals = warmupDaily.slice(Math.max(0, i - 6), i + 1).map((x) => x.wakeMidi).filter((v) => v != null);
      const wakeMidi7d = windowVals.length ? windowVals.reduce((a, b) => a + b, 0) / windowVals.length : null;
      return { ...d, z, efficiencyPct, wakeMidi7d };
    });
  }, [warmupDaily, warmupStats]);
  const warmupLatest = useMemo(() => {
    const withValue = warmupWithZ.filter((d) => d.deltaST != null);
    return withValue.length ? withValue[withValue.length - 1] : null;
  }, [warmupWithZ]);

  // 10. 音域到達マップ
  const allNoteMidisInPeriod = useMemo(() => {
    const vals = [];
    Object.values(filteredEntries).forEach((e) => {
      const w = noteToMidi(e.wakeNote);
      const r = noteToMidi(e.routineNote);
      if (w != null) vals.push(w);
      if (r != null) vals.push(r);
    });
    return vals;
  }, [filteredEntries]);
  const allNoteMidisAllTime = useMemo(() => {
    const vals = [];
    Object.values(entries).forEach((e) => {
      const w = noteToMidi(e.wakeNote);
      const r = noteToMidi(e.routineNote);
      if (w != null) vals.push(w);
      if (r != null) vals.push(r);
    });
    return vals;
  }, [entries]);
  const percentileOf = (sortedArr, p) => {
    if (sortedArr.length === 0) return null;
    const idx = (p / 100) * (sortedArr.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return sortedArr[lo];
    return sortedArr[lo] + (sortedArr[hi] - sortedArr[lo]) * (idx - lo);
  };
  // 自己ベストは最大値・最小値そのものではなく、上位/下位5%点（95パーセンタイル）を採用する。
  // 単発の外れ値1件でベストが動いて以後ずっと更新できなくなる、という事態を防ぐため。
  const personalBestRange = useMemo(() => {
    if (allNoteMidisAllTime.length < 3) return null;
    const sorted = [...allNoteMidisAllTime].sort((a, b) => a - b);
    const low = percentileOf(sorted, 5);
    const high = percentileOf(sorted, 95);
    return { low, high, width: high - low };
  }, [allNoteMidisAllTime]);
  const rangeThisPeriod = useMemo(() => {
    if (allNoteMidisInPeriod.length === 0) return null;
    return { low: Math.min(...allNoteMidisInPeriod), high: Math.max(...allNoteMidisInPeriod) };
  }, [allNoteMidisInPeriod]);
  const rangeFullnessPct = useMemo(() => {
    if (!rangeThisPeriod || !personalBestRange || personalBestRange.width <= 0) return null;
    const thisWidth = rangeThisPeriod.high - rangeThisPeriod.low;
    return Math.round((thisWidth / personalBestRange.width) * 100);
  }, [rangeThisPeriod, personalBestRange]);
  const isNewRecord = useMemo(() => {
    if (!rangeThisPeriod || !personalBestRange) return false;
    return rangeThisPeriod.high > personalBestRange.high || rangeThisPeriod.low < personalBestRange.low;
  }, [rangeThisPeriod, personalBestRange]);
  // 直近の弱声の最高音（音域マップのマーカー用）。最新の記録を優先。
  const latestPianissimoMidi = useMemo(() => {
    const dates = Object.keys(entries).sort().reverse();
    for (const d of dates) {
      const midi = noteToMidi(entries[d].pianissimoHighNote);
      if (midi != null) return midi;
    }
    return null;
  }, [entries]);
  // lavoce-作業計画v2-構造変更の分離.md §3.4③: 平常値との比較。
  // m=中央値, MAD=中央絶対偏差、z = 0.6745×(今日の値−m)/MAD。z≤−1.5が3日以上続いたら知らせる。
  // むくみ・診断語は使わず「平常値よりN半音低い日がN日続いている」という事実提示に留める（§7.1）。
  const pianissimoTrend = useMemo(() => {
    const dates = Object.keys(entries).sort();
    const vals = dates.map((d) => ({ date: d, midi: noteToMidi(entries[d].pianissimoHighNote) })).filter((x) => x.midi != null);
    if (vals.length < 3) return null;
    const last28 = vals.slice(-28);
    const sortedMidis = last28.map((x) => x.midi).sort((a, b) => a - b);
    const n = sortedMidis.length;
    const m = n % 2 === 1 ? sortedMidis[(n - 1) / 2] : (sortedMidis[n / 2 - 1] + sortedMidis[n / 2]) / 2;
    const absDevs = last28.map((x) => Math.abs(x.midi - m)).sort((a, b) => a - b);
    const madRaw = absDevs.length % 2 === 1 ? absDevs[(absDevs.length - 1) / 2] : (absDevs[absDevs.length / 2 - 1] + absDevs[absDevs.length / 2]) / 2;
    const mad = madRaw > 0 ? madRaw : 0.5;
    const withZ = last28.map((x) => ({ ...x, z: 0.6745 * (x.midi - m) / mad }));
    let streak = 0;
    for (let i = withZ.length - 1; i >= 0; i--) {
      if (withZ[i].z <= -1.5) streak += 1; else break;
    }
    return { median: m, latest: withZ[withZ.length - 1], streak, isLow: streak >= 3 };
  }, [entries]);
  // 起き抜け最低音の30日移動平均（下がり続けていたら疲労蓄積の目安）
  const wakeLowNote30dTrend = useMemo(() => {
    const dates = Object.keys(entries).sort().slice(-30);
    const wakeVals = dates.map((d) => noteToMidi(entries[d].wakeNote)).filter((v) => v != null);
    if (wakeVals.length < 4) return null;
    const mid = Math.floor(wakeVals.length / 2);
    const firstHalfAvg = wakeVals.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const secondHalfAvg = wakeVals.slice(mid).reduce((a, b) => a + b, 0) / (wakeVals.length - mid);
    return { firstHalfAvg, secondHalfAvg, declining: secondHalfAvg < firstHalfAvg - 1 };
  }, [entries]);

  // 06. 症状カレンダーと連鎖
  const symptomDatesSorted = useMemo(() => Object.keys(filteredEntries).sort(), [filteredEntries]);
  // ①連続日数：各症状について、直近まで続いている連続記録日数（カレンダー上で連続した日のみ数える）
  const symptomStreaks = useMemo(() => {
    const result = {};
    SYMPTOM_OPTIONS.forEach((symptom) => {
      let current = 0;
      let prevDate = null;
      symptomDatesSorted.forEach((date) => {
        const has = (filteredEntries[date].throatSymptoms || []).includes(symptom);
        if (has) {
          current = (prevDate && addDays(prevDate, 1) === date) ? current + 1 : 1;
        } else {
          current = 0;
        }
        prevDate = date;
      });
      if (current > 0) result[symptom] = current;
    });
    return result;
  }, [filteredEntries, symptomDatesSorted]);
  // ②連鎖確率：症状aの翌日に症状bが出る確率が、bの普段の出現率よりどれだけ高いか（lift）
  const symptomChainStats = useMemo(() => {
    const chains = [];
    const totalDays = symptomDatesSorted.length;
    if (totalDays < 2) return chains;
    SYMPTOM_OPTIONS.forEach((a) => {
      const bBaseCounts = {};
      SYMPTOM_OPTIONS.forEach((s) => { bBaseCounts[s] = 0; });
      symptomDatesSorted.forEach((d) => {
        (filteredEntries[d].throatSymptoms || []).forEach((s) => { if (bBaseCounts[s] != null) bBaseCounts[s] += 1; });
      });
      SYMPTOM_OPTIONS.forEach((b) => {
        if (a === b) return;
        let countA = 0, countAB = 0;
        for (let i = 0; i < symptomDatesSorted.length - 1; i++) {
          const d1 = symptomDatesSorted[i], d2 = symptomDatesSorted[i + 1];
          if (addDays(d1, 1) !== d2) continue;
          const hasA = (filteredEntries[d1].throatSymptoms || []).includes(a);
          if (!hasA) continue;
          countA += 1;
          if ((filteredEntries[d2].throatSymptoms || []).includes(b)) countAB += 1;
        }
        const pB = totalDays > 0 ? bBaseCounts[b] / totalDays : 0;
        // 統合実行ルートv4 §6-2: 件数の下限はここに書かず、displayGates.js に集約する。
        if (pB > 0 && gateAllows("symptom.cooccurrence", { days: totalDays, n: countA })) {
          const pBGivenA = countAB / countA;
          const lift = pBGivenA / pB;
          if (lift >= 1.5) chains.push({ a, b, pBGivenA, pB, lift, countA });
        }
      });
    });
    return chains.sort((x, y) => y.lift - x.lift).slice(0, 5);
  }, [filteredEntries, symptomDatesSorted]);
  // ③よく一緒に出る組み合わせ：ジャッカード係数の上位3組
  const symptomJaccardPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < SYMPTOM_OPTIONS.length; i++) {
      for (let j = i + 1; j < SYMPTOM_OPTIONS.length; j++) {
        const a = SYMPTOM_OPTIONS[i], b = SYMPTOM_OPTIONS[j];
        let union = 0, inter = 0;
        symptomDatesSorted.forEach((d) => {
          const list = filteredEntries[d].throatSymptoms || [];
          const hasA = list.includes(a), hasB = list.includes(b);
          if (hasA || hasB) union += 1;
          if (hasA && hasB) inter += 1;
        });
        // 統合実行ルートv4 §6-4: 1日重なっただけで「よく一緒に出る」と言わない。
        if (union > 0 && gateAllows("symptom.cooccurrence", { days: symptomDatesSorted.length, n: inter })) {
          pairs.push({ a, b, jaccard: inter / union, count: inter });
        }
      }
    }
    return pairs.sort((x, y) => y.jaccard - x.jaccard).slice(0, 3);
  }, [filteredEntries, symptomDatesSorted]);
  // カレンダーグリッド表示用（直近30日、症状×日付）
  const symptomGridDates = useMemo(() => symptomDatesSorted.slice(-30), [symptomDatesSorted]);
  // ---- lavoce-指標設計図.md フェーズ1の3指標用データ ここまで ----

  // ---- ここから、lavoce-指標設計図.md フェーズ2（02偏差値・01予報）用データ ----
  // 02. コンディション偏差値：直近28日分の「声の調子スコア」を日ごとに並べ、自分の分布の中で今日がどこにいるかを見る。
  const dailyScoreSeries = useMemo(() => {
    const realToday = realTodayDate;
    const dates = [];
    for (let i = 27; i >= 0; i--) dates.push(addDays(realToday, -i));
    return dates
      .map((d) => ({ date: d, score: computeDailyScore100(entries[d]) }))
      .filter((x) => x.score != null);
  }, [entries, realTodayDate]);
  const deviationScore = useMemo(() => {
    if (dailyScoreSeries.length < 7) return null;
    const values = dailyScoreSeries.map((d) => d.score);
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    let sigma;
    if (n < 14) {
      const sorted = [...values].sort((a, b) => a - b);
      const median = n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const absDevs = values.map((v) => Math.abs(v - median)).sort((a, b) => a - b);
      const mad = absDevs.length % 2 === 1 ? absDevs[(absDevs.length - 1) / 2] : (absDevs[absDevs.length / 2 - 1] + absDevs[absDevs.length / 2]) / 2;
      sigma = 1.4826 * mad;
    } else {
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
      sigma = Math.sqrt(variance);
    }
    sigma = Math.max(sigma, 0.5);
    const todayEntry = dailyScoreSeries[dailyScoreSeries.length - 1];
    const z = (todayEntry.score - mean) / sigma;
    const T = Math.min(80, Math.max(20, Math.round(50 + 10 * z)));
    const position = values.filter((v) => v > todayEntry.score).length + 1; // 1位＝この期間でいちばん良い日
    const topPercentPct = Math.max(1, Math.round((position / n) * 100));
    // ★点列（§3-C）を描くために、分布そのものも返す。順位だけでは散らばりが見えない。
    return { z, T, n, position, topPercentPct, today: Math.round(todayEntry.score), values };
  }, [dailyScoreSeries]);

  // lavoce-レパートリー負荷パッチ.md §1.4: 「無理なく出せる音域」（任意）があればそちらを優先し、
  // なければ全音域を使う。ACWR（発声負荷）の計算で曲のsongFactorを使うため、ACWRより前に置く。
  const comfortableRangeMidi = useMemo(() => {
    const low = noteToMidi(profile.comfort_range_low) ?? noteToMidi(profile.vocal_range_low);
    const high = noteToMidi(profile.comfort_range_high) ?? noteToMidi(profile.vocal_range_high);
    const isEstimatedRange = !profile.comfort_range_low || !profile.comfort_range_high;
    if (low == null || high == null || high <= low) return null;
    return { low, high, center: (low + high) / 2, half: (high - low) / 2, isEstimatedRange };
  }, [profile.comfort_range_low, profile.comfort_range_high, profile.vocal_range_low, profile.vocal_range_high]);
  // §3.2: 両方（最高音・テッシトゥーラ）が入力済みの曲が5件以上あれば、個人の実測差に置き換える。
  const personalTessituraOffset = useMemo(() => {
    const diffs = Object.values(repertoireTessituraMap)
      .filter((r) => r.topNote && r.tessituraNote)
      .map((r) => noteToMidi(r.topNote) - noteToMidi(r.tessituraNote))
      .filter((v) => Number.isFinite(v));
    return diffs.length >= 5 ? median(diffs) : REPERTOIRE_TESSITURA_OFFSET;
  }, [repertoireTessituraMap]);
  // 登録レコードから d（快適音域中心からの正規化位置、-1〜+1）を解決する。
  // 優先順位：テッシトゥーラ実測 > 最高音からの推定 > 3択フォールバック。
  function resolveRepertoireD(record) {
    if (!record || !comfortableRangeMidi) return null;
    if (record.tessituraNote) {
      const midi = noteToMidi(record.tessituraNote);
      if (midi != null) return { d: (midi - comfortableRangeMidi.center) / comfortableRangeMidi.half, confidence: "entered" };
    }
    if (record.topNote) {
      const topMidi = noteToMidi(record.topNote);
      if (topMidi != null) {
        const estTess = topMidi - personalTessituraOffset;
        return { d: (estTess - comfortableRangeMidi.center) / comfortableRangeMidi.half, confidence: "estimated" };
      }
    }
    if (record.dOverride != null) return { d: record.dOverride, confidence: "coarse" };
    return null;
  }
  // songFactorResolver: computeDailyLoad / computeActivityBlockLoad に渡す共通の解決器
  const songFactorResolver = useMemo(() => ({
    tessituraMap: repertoireTessituraMap,
    resolveD: resolveRepertoireD
  }), [repertoireTessituraMap, comfortableRangeMidi, personalTessituraOffset]);

  // 07. 発声負荷（ACWR）の日次系列。声の予報の「前日発声負荷」predictorにも使う。
  // 記録のない日は L=0 として扱わず、前日のEWMAをそのまま引き継ぐ（休んだのか未記録なのか区別できないため）。
  const acwrSeries = useMemo(() => {
    const allDates = Object.keys(entries).sort();
    const series = {};
    if (allDates.length === 0) return series;
    const firstDate = allDates[0];
    const realToday = realTodayDate;
    const lambdaA = 2 / (7 + 1);
    const lambdaC = 2 / (28 + 1);
    let A = null, C = null;
    let d = firstDate;
    let guard = 0;
    while (d <= realToday && guard < 3660) { // 約10年分で打ち切る安全弁
      const entry = entries[d];
      if (entry) {
        // ★実測が無い活動には、種別ごとの推定時間を補ってから式に渡す。
        //   式（EWMA）は変えていない。補ったことは isEstimated で持ち回る。
        const { entry: entryForLoad, usedEstimate } = withEstimatedMinutes(entry);
        const L = computeDailyLoad(entryForLoad, songFactorResolver);
        A = A == null ? L : lambdaA * L + (1 - lambdaA) * A;
        C = C == null ? L : lambdaC * L + (1 - lambdaC) * C;
        series[d] = { A, C, acwr: C > 0 ? A / C : null, isEstimated: usedEstimate };
      } else if (A != null && C != null) {
        // 記録のない日は、前日のEWMAを引き継ぐ（ここも従来どおり）。
        series[d] = { A, C, acwr: C > 0 ? A / C : null, isEstimated: false, noRecord: true };
      }
      d = addDays(d, 1);
      guard += 1;
    }
    return series;
  }, [entries, songFactorResolver, realTodayDate]);

  // 01. 声の予報：前夜の行動から翌朝の喉スコアを予測する。
  // 記録14日未満は一般知見（β₀）だけで予報し、14日以上たまったらリッジ回帰で
  // その人自身の係数（β̂）を推定し、経験ベイズ縮約で β₀ とブレンドする（β = n/(n+k)·β̂ + k/(n+k)·β₀、k=20）。
  const forecastTrainingSet = useMemo(() => {
    const realToday = realTodayDate;
    const rows = [];
    for (let i = 35; i >= 0; i--) {
      const d = addDays(realToday, -i);
      const prevD = addDays(d, -1);
      const prevEntry = entries[prevD];
      if (!prevEntry) continue;
      const todayEntry = entries[d];
      const actual = todayEntry && typeof todayEntry.throatCondition === "number" ? todayEntry.throatCondition : null;
      const prevAcwr = acwrSeries[prevD] ? acwrSeries[prevD].acwr : null;
      rows.push({ date: d, predictors: extractForecastPredictors(prevEntry, prevAcwr), actual });
    }
    return rows;
  }, [entries, acwrSeries, realTodayDate]);
  const predictorMeans = useMemo(() => {
    const means = {};
    FORECAST_KEYS.forEach((k) => {
      const vals = forecastTrainingSet.map((r) => r.predictors && r.predictors[k]).filter((v) => typeof v === "number");
      means[k] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
    return means;
  }, [forecastTrainingSet]);
  const predictorStds = useMemo(() => {
    const stds = {};
    FORECAST_KEYS.forEach((k) => {
      const vals = forecastTrainingSet.map((r) => r.predictors && r.predictors[k]).filter((v) => typeof v === "number");
      if (vals.length < 2) { stds[k] = 1; return; }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
      stds[k] = Math.sqrt(variance) || 1;
    });
    return stds;
  }, [forecastTrainingSet]);
  const throatMu = useMemo(() => {
    const vals = Object.keys(entries).sort().slice(-28).map((d) => entries[d].throatCondition).filter((v) => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 3;
  }, [entries]);
  // 個人化（リッジ回帰）。n（学習に使える件数）が14未満なら β̂=0（＝β₀のみ）とみなす。
  const personalizedBeta = useMemo(() => {
    const trainRows = forecastTrainingSet.filter((r) => r.actual != null && r.predictors);
    const n = trainRows.length;
    const k = 20;
    const blendRatio = n / (n + k);
    if (n < 14) {
      return { beta: FORECAST_PRIORS, n, personalizationPct: 0 };
    }
    // 標準化: (x - 平均) / SD。欠損は0（＝平均で埋めたのと同じ）として扱う。
    const X = trainRows.map((r) =>
      FORECAST_KEYS.map((key) => {
        const x = r.predictors[key];
        if (typeof x !== "number" || predictorMeans[key] == null) return 0;
        const std = predictorStds[key] > 1e-6 ? predictorStds[key] : 1;
        return (x - predictorMeans[key]) / std;
      })
    );
    const y = trainRows.map((r) => r.actual - throatMu);
    const betaStd = fitRidgeRegression(X, y, 1.0);
    if (!betaStd) {
      return { beta: FORECAST_PRIORS, n, personalizationPct: 0 };
    }
    const betaHat = {};
    FORECAST_KEYS.forEach((key, i) => {
      const std = predictorStds[key] > 1e-6 ? predictorStds[key] : 1;
      betaHat[key] = betaStd[i] / std;
    });
    const blended = {};
    FORECAST_KEYS.forEach((key) => {
      blended[key] = blendRatio * betaHat[key] + (1 - blendRatio) * FORECAST_PRIORS[key];
    });
    return { beta: blended, n, personalizationPct: Math.round(blendRatio * 100) };
  }, [forecastTrainingSet, predictorMeans, predictorStds, throatMu]);
  const forecastResiduals = useMemo(() => {
    return forecastTrainingSet
      .map((r) => {
        if (r.actual == null) return null;
        const pred = predictThroat(r.predictors, predictorMeans, throatMu, personalizedBeta.beta);
        if (!pred) return null;
        return { date: r.date, actual: r.actual, yhat: pred.yhat, residual: r.actual - pred.yhat };
      })
      .filter((x) => x != null);
  }, [forecastTrainingSet, predictorMeans, throatMu, personalizedBeta]);
  const forecastResidualSD = useMemo(() => {
    if (forecastResiduals.length < 3) return 0.8; // データが少ないうちの初期の目安幅
    const vals = forecastResiduals.map((r) => r.residual);
    const n = vals.length;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (n - 1);
    return Math.sqrt(variance) || 0.8;
  }, [forecastResiduals]);
  // 統合実行ルートv4 §6-4: 的中率は14件未満では出さない。
  // 6件で「的中率33%」と出していたのが、信頼を損なっていた場所（P1-3）。
  const forecastHitRateGate = useMemo(
    () => evaluateGate("forecast.hitRate", { n: forecastResiduals.slice(-30).length }, t),
    [forecastResiduals, t]
  );
  // 統合実行ルートv4 G2-6 / P1-3: 「当たった」の定義を変える。
  // 以前は「予報と実測の差が±0.5以内」という、画面のどこにも書いていない厳しい判定で、
  // 記録6件で「的中率33%」と出ていた。数字が低いこと自体より、
  // ユーザーが定義を確認できないことが問題だった。
  // 新しい定義は「実測が、画面に出している予測区間（±1標準誤差）に入ったか」。
  // 画面に描いている帯とそのまま一致するので、ユーザーが目で確かめられる。
  const forecastHitRate = useMemo(() => {
    if (!forecastHitRateGate.passed) return null;
    const recent = forecastResiduals.slice(-30);
    const hits = recent.filter((r) => {
      const low = Math.max(1, r.yhat - forecastResidualSD);
      const high = Math.min(5, r.yhat + forecastResidualSD);
      return r.actual >= low && r.actual <= high;
    }).length;
    return { rate: Math.round((hits / recent.length) * 100), n: recent.length };
  }, [forecastResiduals, forecastResidualSD, forecastHitRateGate]);
  const todayForecast = useMemo(() => {
    const realToday = realTodayDate;
    const yDate = addDays(realToday, -1);
    const prevEntry = entries[yDate];
    if (!prevEntry) return { hasData: false, yesterdayDate: yDate };
    const prevAcwr = acwrSeries[yDate] ? acwrSeries[yDate].acwr : null;
    const predictors = extractForecastPredictors(prevEntry, prevAcwr);
    const pred = predictThroat(predictors, predictorMeans, throatMu, personalizedBeta.beta);
    if (!pred) return { hasData: false, yesterdayDate: yDate };
    const intervalWidth = forecastResidualSD * (pred.missingCount > 0 ? 1.2 : 1);
    const contributions = FORECAST_KEYS
      .filter((k) => typeof predictors[k] === "number" && typeof predictorMeans[k] === "number")
      .map((k) => ({ key: k, label: FORECAST_FACTOR_LABELS[k], contribution: personalizedBeta.beta[k] * (predictors[k] - predictorMeans[k]) }))
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    return {
      hasData: true,
      yesterdayDate: yDate,
      yhat: pred.yhat,
      low: Math.max(1, pred.yhat - intervalWidth),
      high: Math.min(5, pred.yhat + intervalWidth),
      topFactor: contributions[0] || null,
      allContributions: contributions,
      personalizationPct: personalizedBeta.personalizationPct,
      trainN: personalizedBeta.n
    };
  }, [entries, acwrSeries, predictorMeans, throatMu, forecastResidualSD, personalizedBeta, realTodayDate]);
  // lavoce-画面レイアウト仕様_1.md §3.3: 提案は必ず1つだけ。予報の寄与のうち、
  // いちばん改善余地が大きい「行動可能」な項目を選ぶ（環境・前日症状などは提案しない）。
  const HOME_SUGGESTION_TEXT = {
    sleepHours: "今夜は少し早めに眠ってみましょう",
    dinnerGap: "夕食を就寝の3時間以上前に済ませてみましょう",
    waterL: "水分をもう少し摂ってみましょう",
    alcohol: "今夜はアルコールを控えてみましょう",
    prevLoad: "今日は発声の負荷を少し抑えてみましょう"
  };
  const todaySuggestion = useMemo(() => {
    if (!todayForecast.hasData || !todayForecast.allContributions) return null;
    const actionable = todayForecast.allContributions
      .filter((c) => HOME_SUGGESTION_TEXT[c.key])
      .sort((a, b) => a.contribution - b.contribution); // 最も足を引っ張っている項目を先頭に
    const worst = actionable[0];
    if (!worst || worst.contribution >= -0.05) return null; // 改善余地がほぼなければ提案しない
    return HOME_SUGGESTION_TEXT[worst.key];
  }, [todayForecast]);
  const forecastChartData = useMemo(() => {
    return forecastResiduals.slice(-14).map((r) => {
      const low = Math.max(1, r.yhat - forecastResidualSD);
      const high = Math.min(5, r.yhat + forecastResidualSD);
      return { date: r.date.slice(5), actual: r.actual, yhat: Math.round(r.yhat * 10) / 10, low, bandWidth: Math.max(0, high - low) };
    });
  }, [forecastResiduals, forecastResidualSD]);
  // ---- フェーズ2（02偏差値・01予報）用データ ここまで ----

  // ★4分割して平均を比べる計算は外した（分析画面の描画仕様 §3-G）。
  //   区切り方そのものが結論を作ってしまうため。1周期を1行として並べる
  //   cyclePeriodRows に置き換えてある。
  // ★§3-G 周期どうしを並べる。横軸は「何日目か」で、日付ではない。
  //   4つに区切って平均を比べるのをやめ、1周期を1行として並べる。
  //   区切って平均にすると、区切り方が結論を作ってしまう。
  //   ★位相の呼び名は書かない（周期記録の設計 §2）。日数だけで表す。
  const cyclePeriodRows = useMemo(() => {
    if (!cycleTrackingOn(profile)) return [];
    const sorted = sortPeriods(cyclePeriods);
    return sorted.slice(-6).map((per, i) => {
      const next = sorted[sorted.indexOf(per) + 1];
      const endISO = per.end_date || (next ? addDaysISO(next.start_date, -1) : null);
      const length = endISO ? diffDays(per.start_date, endISO) + 1 : null;
      const points = [];
      Object.keys(filteredEntries).forEach((d) => {
        const day = cycleDayForDate(d, cyclePeriods);
        if (day == null) return;
        if (diffDays(per.start_date, d) < 0) return;
        if (length != null && diffDays(per.start_date, d) >= length) return;
        const v = filteredEntries[d].throatCondition;
        if (typeof v !== "number") return;
        points.push({ day, low: v < 3 });
      });
      return { key: per.start_date || String(i), length: length || 30, points };
    });
  }, [cyclePeriods, filteredEntries, profile]);
  const hasCycleData = cyclePeriods.length > 0;
  // ---- 周期と声・メンタルの傾向 用データ ここまで ----

  // ---- lavoce-収集データ拡張案.md E節 + レパートリー負荷パッチ.md: 曲目ごとの負荷 用データ ----
  // §2: 曲目名の正規化と、既存登録に対する使用回数（サジェストの並び順・繰り返し登録抑制に使う）
  const repertoireUsageCounts = useMemo(() => {
    const counts = {};
    Object.values(entries).forEach((e) => {
      const raw = (e.repertoire || "").trim();
      if (!raw) return;
      const norm = normalizeTitle(raw);
      if (!counts[norm]) counts[norm] = { count: 0, displayName: raw };
      counts[norm].count += 1;
    });
    return counts;
  }, [entries]);
  const overallThroatBaseline = useMemo(() => {
    const vals = Object.values(entries).map((e) => e.throatCondition).filter((v) => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [entries]);
  const roleLoadStats = useMemo(() => {
    if (!comfortableRangeMidi) return { confident: [], lowN: [] };
    const byRole = {};
    const sortedDates = Object.keys(entries).sort();
    sortedDates.forEach((date, i) => {
      const e = entries[date];
      const activities = e.activities || [];
      // その日、同じ曲が複数ブロックにまたがっていても1日分としてまとめる
      const dayNamesWithLoad = {};
      activities.forEach((activity) => {
        const { perItem } = computeActivityBlockLoad(activity, songFactorResolver);
        perItem.forEach((pi) => {
          const name = (pi.repertoireName || "").trim();
          if (!name || !repertoireTessituraMap[name]) return; // 未登録の曲は負荷を計算できないので対象外
          dayNamesWithLoad[name] = (dayNamesWithLoad[name] || 0) + pi.load;
        });
      });
      Object.entries(dayNamesWithLoad).forEach(([name, load]) => {
        if (!byRole[name]) byRole[name] = { name, record: repertoireTessituraMap[name], loads: [], nextDayThroatDeviation: [] };
        byRole[name].loads.push(load);
      });
      // §5（帰属の按分・共起検出）は今回のフェーズでは実装せず、その日に歌った曲すべてに
      // 翌日の落ち込みをそのまま計上する簡易版。同じ日によく一緒に歌われる曲は同じ値になる。
      const nextDate = sortedDates[i + 1];
      if (nextDate && addDays(date, 1) === nextDate) {
        const nextEntry = entries[nextDate];
        if (typeof nextEntry.throatCondition === "number" && overallThroatBaseline != null) {
          const deviation = nextEntry.throatCondition - overallThroatBaseline;
          Object.keys(dayNamesWithLoad).forEach((name) => {
            byRole[name].nextDayThroatDeviation.push(deviation);
          });
        }
      }
    });
    const list = Object.values(byRole).map((r) => ({
      name: r.name,
      record: r.record,
      count: r.loads.length,
      avgLoad: r.loads.reduce((a, b) => a + b, 0) / r.loads.length,
      avgNextDayDeviation: r.nextDayThroatDeviation.length ? r.nextDayThroatDeviation.reduce((a, b) => a + b, 0) / r.nextDayThroatDeviation.length : null,
      nextDayCount: r.nextDayThroatDeviation.length
    }));
    // §4.1/§4.3: n≥3を本表示の下限にし、実測の落ち込みが大きい順（＝deviationが低い順）に並べる。
    const confident = list.filter((r) => r.count >= 3 && r.avgNextDayDeviation != null).sort((a, b) => a.avgNextDayDeviation - b.avgNextDayDeviation);
    const lowN = list.filter((r) => r.count < 3 || r.avgNextDayDeviation == null).sort((a, b) => b.count - a.count);
    // §4.4: 実測順位と計算負荷順位の乖離（大きいほど「音域以外の要因」のサイン）
    const loadRanked = [...confident].sort((a, b) => b.avgLoad - a.avgLoad);
    confident.forEach((r, actualRank) => {
      const loadRank = loadRanked.findIndex((x) => x.name === r.name);
      r.rankGap = loadRank - actualRank; // 正: 計算より実際の落ち込みが大きい（見落とされがちな重い役）
    });
    return { confident, lowN };
  }, [entries, repertoireTessituraMap, comfortableRangeMidi, overallThroatBaseline, songFactorResolver]);
  // ---- 曲目ごとの負荷 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.3: 声優の回復曲線（叫びテイク数） ----
  // 「激しい収録日」の定義：その日の叫びテイク数合計が、その人の75パーセンタイル以上。
  // その日をτ=0として、τ=+1/+2/+3の喉コンディションの平常値からの偏差を重ね合わせ平均する。
  const screamRecoveryCurve = useMemo(() => {
    const sortedDates = Object.keys(entries).sort();
    const screamByDate = {};
    sortedDates.forEach((date) => {
      const activities = entries[date].activities || [];
      const sum = activities.reduce((s, a) => s + (Number((a.detail || {}).screamTakes) || 0), 0);
      if (sum > 0) screamByDate[date] = sum;
    });
    const screamValues = Object.values(screamByDate);
    if (screamValues.length < 3 || overallThroatBaseline == null) return { hasEnoughData: false, n: screamValues.length };
    const sorted = [...screamValues].sort((a, b) => a - b);
    const p75 = sorted[Math.floor(sorted.length * 0.75)];
    const heavyDates = Object.keys(screamByDate).filter((d) => screamByDate[d] >= p75 && screamByDate[d] > 0);
    if (heavyDates.length < 3) return { hasEnoughData: false, n: heavyDates.length };
    const tauDeviations = { 0: [], 1: [], 2: [], 3: [] };
    heavyDates.forEach((d0) => {
      [0, 1, 2, 3].forEach((tau) => {
        const d = addDays(d0, tau);
        const e = entries[d];
        if (e && typeof e.throatCondition === "number") {
          tauDeviations[tau].push(e.throatCondition - overallThroatBaseline);
        }
      });
    });
    const curve = [0, 1, 2, 3].map((tau) => ({
      tau,
      avgDeviation: tauDeviations[tau].length ? tauDeviations[tau].reduce((a, b) => a + b, 0) / tauDeviations[tau].length : null,
      n: tauDeviations[tau].length
    }));
    // 完全回復＝偏差が0以上に戻った最初のτ（無ければ null＝まだデータの範囲内で戻っていない）
    const recoveredAt = curve.find((c) => c.avgDeviation != null && c.avgDeviation >= 0);
    return { hasEnoughData: true, n: heavyDates.length, p75, curve, recoveredDays: recoveredAt ? recoveredAt.tau : null };
  }, [entries, overallThroatBaseline]);
  // ---- 声優の回復曲線 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.3: 声優の叫びテイク数の閾値 ----
  // テイク数xと翌日の喉コンディション偏差yに、区分線形（ヒンジ）モデルを当てる。
  // y = a (x <= k) / y = a - b(x-k) (x > k)。kを1〜50でグリッド探索し、残差平方和が最小のものを採用。
  // b>0（閾値を超えると悪化する向き）かつ n>=8のときだけ表示する。
  const screamTakeThreshold = useMemo(() => {
    const sortedDates = Object.keys(entries).sort();
    const points = []; // { x: テイク数, y: 翌日の偏差 }
    sortedDates.forEach((date, i) => {
      const activities = entries[date].activities || [];
      const x = activities.reduce((s, a) => s + (Number((a.detail || {}).screamTakes) || 0), 0);
      if (x <= 0 || overallThroatBaseline == null) return;
      const nextDate = sortedDates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = entries[nextDate];
      if (typeof nextEntry.throatCondition !== "number") return;
      points.push({ x, y: nextEntry.throatCondition - overallThroatBaseline });
    });
    if (points.length < 8) return { hasEnoughData: false, n: points.length };

    let best = null;
    for (let k = 1; k <= 50; k++) {
      const left = points.filter((p) => p.x <= k);
      const right = points.filter((p) => p.x > k);
      if (left.length < 2 || right.length < 2) continue;
      const a = left.reduce((s, p) => s + p.y, 0) / left.length;
      // 右側をa - b(x-k)で最小二乗フィット（bだけを推定、切片はaに固定）
      const num = right.reduce((s, p) => s + (a - p.y) * (p.x - k), 0);
      const den = right.reduce((s, p) => s + (p.x - k) * (p.x - k), 0);
      const b = den > 0 ? num / den : 0;
      const sse = points.reduce((s, p) => {
        const pred = p.x <= k ? a : a - b * (p.x - k);
        return s + (p.y - pred) * (p.y - pred);
      }, 0);
      if (!best || sse < best.sse) best = { k, a, b, sse };
    }
    if (!best || best.b <= 0) return { hasEnoughData: false, n: points.length };
    const overThreshold = points.filter((p) => p.x > best.k);
    return {
      hasEnoughData: true, n: points.length, k: best.k,
      overCount: overThreshold.length,
      avgDeviationOver: overThreshold.length ? overThreshold.reduce((s, p) => s + p.y, 0) / overThreshold.length : null
    };
  }, [entries, overallThroatBaseline]);
  // ---- 声優の叫びテイク数の閾値 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.4: ポップス/ロックのセットリスト診断・キー下げ提案 ----
  // 「即時（計算のみ）」の指標のため、entriesの蓄積を待たず、今まさに編集中のセットリストに対して
  // その場で診断する。曲順による負荷の偏りと、快適音域を超える曲を指摘する。
  const setlistDiagnosis = useMemo(() => {
    if (!(effectiveProfessions || []).includes("pop_musical") || !formData) return null;
    const performanceActivities = (formData.activities || []).filter((a) => a.kind === "本番");
    if (performanceActivities.length === 0) return null;
    // 複数の本番ブロックがある日は、曲数が最も多いものを対象にする
    const activity = [...performanceActivities].sort((a, b) => (b.items || []).length - (a.items || []).length)[0];
    const items = (activity.items || []).filter((it) => (it.repertoireName || "").trim());
    if (items.length < 3) return { hasEnoughSongs: false };

    const { perItem } = computeActivityBlockLoad(activity, songFactorResolver);
    const loadByIndex = items.map((it, idx) => {
      const found = perItem.find((pi) => pi.repertoireName === it.repertoireName);
      return { name: it.repertoireName, load: found ? found.load : 0, index: idx };
    });

    // 連続する3曲の移動和で「山」を検出する
    const windows = [];
    for (let j = 0; j <= loadByIndex.length - 3; j++) {
      const w = loadByIndex[j].load + loadByIndex[j + 1].load + loadByIndex[j + 2].load;
      windows.push({ startIndex: j, sum: w });
    }
    const avgWindow = windows.reduce((s, w) => s + w.sum, 0) / windows.length;
    const peakWindow = windows.length ? windows.reduce((max, w) => (w.sum > max.sum ? w : max), windows[0]) : null;
    let peakSuggestion = null;
    if (peakWindow && avgWindow > 0 && peakWindow.sum > avgWindow * 1.4) {
      const peakSongs = loadByIndex.slice(peakWindow.startIndex, peakWindow.startIndex + 3);
      const heaviestInPeak = [...peakSongs].sort((a, b) => b.load - a.load)[0];
      const outsidePeak = loadByIndex.filter((s) => s.index < peakWindow.startIndex || s.index >= peakWindow.startIndex + 3);
      const lightestOutside = outsidePeak.length ? [...outsidePeak].sort((a, b) => a.load - b.load)[0] : null;
      if (lightestOutside) {
        // 交換後のmax(W)を概算し、改善率を見積もる
        const swappedLoads = loadByIndex.map((s) => {
          if (s.index === heaviestInPeak.index) return { ...s, load: lightestOutside.load };
          if (s.index === lightestOutside.index) return { ...s, load: heaviestInPeak.load };
          return s;
        });
        let newMax = 0;
        for (let j = 0; j <= swappedLoads.length - 3; j++) {
          const w = swappedLoads[j].load + swappedLoads[j + 1].load + swappedLoads[j + 2].load;
          if (w > newMax) newMax = w;
        }
        const improvement = peakWindow.sum > 0 ? Math.round((1 - newMax / peakWindow.sum) * 100) : 0;
        peakSuggestion = {
          peakStart: peakWindow.startIndex + 1, peakEnd: peakWindow.startIndex + 3,
          heaviestSong: heaviestInPeak.name, lightestSong: lightestOutside.name, improvement
        };
      }
    }

    // キー下げ提案：快適音域の上限を超える曲を指摘する
    const keyLoweringSuggestions = [];
    if (comfortableRangeMidi) {
      items.forEach((it) => {
        const name = (it.repertoireName || "").trim();
        const record = repertoireTessituraMap[name];
        const topMidi = record ? (record.dOverride != null ? null : noteToMidi(record.topNote)) : null;
        if (topMidi != null && topMidi > comfortableRangeMidi.high) {
          keyLoweringSuggestions.push({ name, overBy: topMidi - comfortableRangeMidi.high });
        }
      });
    }

    return { hasEnoughSongs: true, peakSuggestion, keyLoweringSuggestions };
  }, [formData, effectiveProfessions, repertoireTessituraMap, comfortableRangeMidi, songFactorResolver]);
  // ---- セットリスト診断 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.4: モニター環境・打ち上げの効果量 ----
  // 既存の効いた習慣ランキングと同じ考え方（前日の行動→翌日の声）を、この日の「本番」ブロックに適用する。
  const popMusicalEffects = useMemo(() => {
    if (!(effectiveProfessions || []).includes("pop_musical")) return [];
    const sortedDates = Object.keys(entries).sort();
    const monitorGroups = { iem: [], wedge: [], none: [] };
    const afterpartyGroups = { yes: [], no: [] };
    const travelGroups = { nightBus: [], other: [] };
    sortedDates.forEach((date, i) => {
      const nextDate = sortedDates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = entries[nextDate];
      const throatV = typeof nextEntry.throatCondition === "number" ? nextEntry.throatCondition : null;
      const voiceV = typeof nextEntry.voiceQuality === "number" ? nextEntry.voiceQuality : null;
      if (throatV == null && voiceV == null) return;
      const score = throatV != null && voiceV != null ? (throatV + voiceV) / 2 : (throatV ?? voiceV);
      const performances = (entries[date].activities || []).filter((a) => a.kind === "本番");
      performances.forEach((a) => {
        const d = a.detail || {};
        if (d.monitorType && monitorGroups[d.monitorType]) monitorGroups[d.monitorType].push(score);
        if (d.afterparty && typeof d.afterparty.attended === "boolean") {
          (d.afterparty.attended ? afterpartyGroups.yes : afterpartyGroups.no).push(score);
        }
        if (d.travelMode) {
          (d.travelMode === "night_bus" ? travelGroups.nightBus : travelGroups.other).push(score);
        }
      });
    });
    const results = [];
    // モニター：インイヤー vs ウェッジ（最も対比の意味がある組み合わせ）
    const monitorRes = computeHedgesG(monitorGroups.iem, monitorGroups.wedge);
    if (monitorRes && monitorRes.n1 >= 3 && monitorRes.n0 >= 3) {
      results.push({ key: "monitor", label: "モニター環境（インイヤー vs ウェッジ）", ...monitorRes, stars: starRatingForEffect(monitorRes) });
    }
    const afterpartyRes = computeHedgesG(afterpartyGroups.yes, afterpartyGroups.no);
    if (afterpartyRes && afterpartyRes.n1 >= 3 && afterpartyRes.n0 >= 3) {
      results.push({ key: "afterparty", label: "終演後の打ち上げ", ...afterpartyRes, stars: starRatingForEffect(afterpartyRes) });
    }
    const travelRes = computeHedgesG(travelGroups.nightBus, travelGroups.other);
    if (travelRes && travelRes.n1 >= 3 && travelRes.n0 >= 3) {
      results.push({ key: "travel", label: "夜行バス・車中泊の移動", ...travelRes, stars: starRatingForEffect(travelRes) });
    }
    return results;
  }, [entries, effectiveProfessions]);
  // ---- モニター環境・打ち上げの効果量 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.4: ポップス/ロックのツアー耐久曲線 ----
  // ツアー初日（isTourStartが立った日）を0として、その後何日目に喉コンディションが落ちるかを
  // 複数のツアーで重ね合わせる。ツアー2本以上のデータが必要。
  const tourEnduranceCurve = useMemo(() => {
    if (!(effectiveProfessions || []).includes("pop_musical") || overallThroatBaseline == null) return { hasEnoughData: false, tourCount: 0 };
    const sortedDates = Object.keys(entries).sort();
    const tourStarts = sortedDates.filter((d) => (entries[d].activities || []).some((a) => a.kind === "本番" && (a.detail || {}).isTourStart));
    if (tourStarts.length < 2) return { hasEnoughData: false, tourCount: tourStarts.length };

    const MAX_TOUR_DAYS = 14; // ツアーの最大想定日数（これを超えたら別ツアー扱いにする）
    const tauDeviations = {};
    for (let tau = 0; tau <= 10; tau++) tauDeviations[tau] = [];

    tourStarts.forEach((startDate, idx) => {
      const nextStart = tourStarts[idx + 1];
      for (let tau = 0; tau <= 10; tau++) {
        const d = addDays(startDate, tau);
        if (nextStart && d >= nextStart) break; // 次のツアーに食い込んだら打ち切る
        if (tau > MAX_TOUR_DAYS) break;
        const e = entries[d];
        if (e && typeof e.throatCondition === "number") {
          tauDeviations[tau].push(e.throatCondition - overallThroatBaseline);
        }
      }
    });

    const curve = Object.keys(tauDeviations).map(Number).sort((a, b) => a - b)
      .map((tau) => ({
        tau,
        avgDeviation: tauDeviations[tau].length ? tauDeviations[tau].reduce((a, b) => a + b, 0) / tauDeviations[tau].length : null,
        n: tauDeviations[tau].length
      }))
      .filter((c) => c.n >= 2); // 2本のツアーどちらにもデータがある日だけを使う

    if (curve.length < 3) return { hasEnoughData: false, tourCount: tourStarts.length };
    // 最も落ち込みが大きい日を「型」として提示する
    const worst = curve.reduce((min, c) => (c.avgDeviation != null && (min == null || c.avgDeviation < min.avgDeviation) ? c : min), null);
    return { hasEnoughData: true, tourCount: tourStarts.length, curve, worstDay: worst ? worst.tau : null };
  }, [entries, effectiveProfessions, overallThroatBaseline]);
  // ---- ツアー耐久曲線 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.2: アナウンサーの話声位の日内変動 ----
  // 朝（wake）と終業後（after_work）のSFFの差Δ = SFF(終業後) − SFF(朝)。
  // 上がる人・下がる人がいて、方向自体が個人の特性のため、頑健統計（中央値・MAD）で評価する。
  const sffDiurnalVariation = useMemo(() => {
    if (!(effectiveProfessions || []).includes("announcer")) return { hasEnoughData: false, n: 0 };
    const sortedDates = Object.keys(entries).sort();
    const deltas = []; // { date, delta }
    sortedDates.forEach((date) => {
      const voiceEntries = entries[date].voiceEntries || [];
      const wake = voiceEntries.find((v) => v.context === "wake" && typeof v.speakingF0Hz === "number");
      const afterWork = voiceEntries.find((v) => v.context === "after_work" && typeof v.speakingF0Hz === "number");
      if (wake && afterWork) deltas.push({ date, delta: afterWork.speakingF0Hz - wake.speakingF0Hz });
    });
    if (deltas.length < 14) return { hasEnoughData: false, n: deltas.length };
    const recent = deltas.slice(-28);
    const vals = recent.map((d) => d.delta);
    const m = median(vals);
    const mad = median(vals.map((v) => Math.abs(v - m))) * 1.4826; // 正規分布換算のMAD
    const today = recent[recent.length - 1];
    const z = mad > 0 ? (today.delta - m) / mad : 0;
    const isTodayExtreme = Math.abs(z) >= 1.5;
    return { hasEnoughData: true, n: deltas.length, medianDelta: Math.round(m * 10) / 10, todayDelta: Math.round(today.delta * 10) / 10, isTodayExtreme, direction: m < 0 ? "下がります" : "上がります" };
  }, [entries, effectiveProfessions]);
  // ---- 話声位の日内変動 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.1: 声楽家のパッサッジョの安定度 ----
  // 通過感の28日中央値とMADを見て、z<=-1.5が3日続いたら知らせる（頑健統計、指標設計図の
  // 「弱声の最高音」等と同じ考え方）。
  // ---- 作業指示-教室プラン E-3: レッスンの重なり検出 ----
  // 警告を出すだけ。自動でレッスンを動かさない・予約を拒否しない。
  const lessonOverlaps = useMemo(() => {
    const sorted = [...myAllLessons].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const overlapPairs = [];
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const aStart = new Date(sorted[i].scheduled_at);
        const aEnd = new Date(aStart.getTime() + (sorted[i].duration_minutes || 60) * 60000);
        const bStart = new Date(sorted[j].scheduled_at);
        if (bStart >= aEnd) break; // 時系列順なので、これ以降は重ならない
        overlapPairs.push([sorted[i], sorted[j]]);
      }
    }
    // 1日のレッスンが4件を超えた日（生徒本人にだけ、そっと知らせる）
    const byDate = {};
    sorted.forEach((l) => { const d = toISODate(new Date(l.scheduled_at)); (byDate[d] = byDate[d] || []).push(l); });
    const busyDates = Object.entries(byDate).filter(([, list]) => list.length > 4).map(([d]) => d);
    return { overlapPairs, busyDates };
  }, [myAllLessons]);
  // ---- レッスンの重なり検出 ここまで ----

  // ★先生の名前の出し方を、1か所で決める。
  //   名前が無い先生を「先生」と書くのはよいが、画面ごとに違う書き方をすると
  //   「名前が分からない」ことが伝わったり伝わらなかったりする。
  function teacherLabel(teacher) {
    const name = teacher && teacher.display_name;
    if (name) return teacher.school ? `${name}（${teacher.school}）` : name;
    return "名前未設定の先生";
  }
  // ---- レッスンの「立場」 ----
  // ★1人が先生でもあり生徒でもある、は正当な想定（自分も誰かに習っている先生）。
  //   以前は「教える側のタブ」と「習う側のタブ」の出現条件が独立していたので、
  //   両方に当てはまる人には「レッスン」タブが2つ並んでいた。
  //   タブは1つにして、中で立場を切り替える。
  //
  // ★呼び名は「習う」「教える」。「生徒として／担当として」も検討したが、
  //   生徒の画面に既に「担当の先生」（assignedTeacherLabel）があり、
  //   同じ語が両側で逆向きの意味になるため避けた。行為で言い分ければ迷わない。
  const canTeachLessons = canSeeTeacherFeatures(profile, { hasStudentLinks: myStudentLinks.length > 0 });
  const canLearnLessons = canSeeTeacherFeatures(profile, { hasTeacherLinks: myTeacherLinks.length > 0 })
    && (myAllLessons.length > 0 || myTeacherLinks.length > 0 || canSeeBetaFeatures(profile));
  const hasLessonTab = canTeachLessons || canLearnLessons;
  // ---- 周期の記録（周期記録の設計.md §4・§5） ----
  // ★日数は1つも保存しない。すべて開始日から導出する。
  //   保存すると、開始日を直したときに全部を書き換える処理が要る。
  // ★判定は lib/cyclePeriods.js の1か所から。ここに条件を書かないこと。
  //   以前はここが track_cycle だけを見ており、性別を「男性」にした人の
  //   ホームと記録画面に、周期の欄が出続けていました。
  //   しかも設定のスイッチのほうは隠れるので、消す手段がありませんでした。
  const cycleEnabled = cycleTrackingOn(profile);
  const cycleShowOnHome = cycleShowsOnHome(profile);
  const cycleState = useMemo(
    () => (cycleEnabled ? currentCycleState(cyclePeriods, realTodayDate) : { state: "none" }),
    [cycleEnabled, cyclePeriods, realTodayDate]
  );
  const cycleStats = useMemo(
    () => (cycleEnabled ? cycleSummary(cyclePeriods, realTodayDate) : null),
    [cycleEnabled, cyclePeriods, realTodayDate]
  );
  const bleedingDays = useMemo(
    () => (cycleEnabled ? buildBleedingDayset(cyclePeriods, realTodayDate) : new Set()),
    [cycleEnabled, cyclePeriods, realTodayDate]
  );

  // 「今日から始まった」。★検証は lib/cyclePeriods.js が持つ（画面では判定しない）。
  async function handleStartCycle(startISO) {
    const problem = validateNewStart(startISO, cyclePeriods, realTodayDate);
    if (problem) {
      setCycleError(
        problem === "startInFuture" ? "未来の日付は記録できません。"
          : problem === "duplicateStart" ? "その日はすでに記録されています。"
            : "すでに記録されている期間と重なっています。"
      );
      return;
    }
    setCycleBusy(true); setCycleError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cycle_periods").insert({ user_id: userId, start_date: startISO })
      .select("id, start_date, end_date").single();
    setCycleBusy(false);
    // ★失敗を黙って飲み込まない。押したのに何も起きない、が一番わかりにくい。
    if (error) { setCycleError("保存できませんでした。" + (error.message || "")); return; }
    setCyclePeriods((prev) => [data, ...prev]);
    setCycleJustSaved("記録しました。");
    setTimeout(() => setCycleJustSaved(""), 3000);
  }

  // 記録画面から、間違えて付けた初日を取り消す。★入力の誤りは必ず起きる。
  async function handleRemoveCycleStart(dateISO) {
    const target = (cyclePeriods || []).find((p) => p.start_date === dateISO);
    if (!target) return;
    setCycleBusy(true); setCycleError("");
    const supabase = createClient();
    const { error } = await supabase.from("cycle_periods").delete().eq("id", target.id).eq("user_id", userId);
    setCycleBusy(false);
    if (error) { setCycleError("取り消せませんでした。" + (error.message || "")); return; }
    setCyclePeriods((prev) => prev.filter((p) => p.id !== target.id));
    setCycleJustSaved("取り消しました。");
    setTimeout(() => setCycleJustSaved(""), 3000);
  }
  // 「終わった」。押し忘れても、次の開始日が入れば自動的に閉じる（§4-1）。
  async function handleEndCycle(periodId, startISO, endISO) {
    const problem = validateEnd(endISO, startISO, realTodayDate);
    if (problem) {
      setCycleError(problem === "endBeforeStart" ? "開始日より前にはできません。" : "未来の日付は記録できません。");
      return;
    }
    setCycleBusy(true); setCycleError("");
    const supabase = createClient();
    const { error } = await supabase
      .from("cycle_periods").update({ end_date: endISO, updated_at: new Date().toISOString() })
      .eq("id", periodId).eq("user_id", userId);
    setCycleBusy(false);
    if (error) { setCycleError("保存できませんでした。" + (error.message || "")); return; }
    setCyclePeriods((prev) => prev.map((p) => (p.id === periodId ? { ...p, end_date: endISO } : p)));
    setCycleJustSaved("記録しました。");
    setTimeout(() => setCycleJustSaved(""), 3000);
  }
  // ---- 周期の記録 ここまで ----

  const lessonRole = resolveLessonRole(lessonRoleChoice, { canTeach: canTeachLessons, canLearn: canLearnLessons });
  const showLessonRoleSwitch = shouldShowLessonRoleSwitch({ canTeach: canTeachLessons, canLearn: canLearnLessons });
  // ---- レッスンの「立場」 ここまで ----

  const passaggioStability = useMemo(() => {
    if (!(effectiveProfessions || []).includes("singer")) return { hasEnoughData: false, n: 0 };
    const sortedDates = Object.keys(entries).sort();
    const byDate = [];
    sortedDates.forEach((date) => {
      const activities = entries[date].activities || [];
      const feels = activities.map((a) => (a.detail || {}).passaggioFeel).filter((v) => typeof v === "number");
      if (feels.length > 0) byDate.push({ date, feel: feels.reduce((a, b) => a + b, 0) / feels.length });
    });
    if (byDate.length < 14) return { hasEnoughData: false, n: byDate.length };
    const recent = byDate.slice(-28);
    const vals = recent.map((d) => d.feel);
    const m = median(vals);
    const mad = median(vals.map((v) => Math.abs(v - m))) * 1.4826;
    const last3 = recent.slice(-3);
    const alertStreak = last3.length === 3 && last3.every((d) => mad > 0 && (d.feel - m) / mad <= -1.5);
    return { hasEnoughData: true, n: byDate.length, medianFeel: Math.round(m * 10) / 10, alertStreak, latestFeel: recent[recent.length - 1].feel };
  }, [entries, effectiveProfessions]);
  // ---- パッサッジョの安定度 用データ ここまで ----

  // ---- lavoce-職業別データと分析の確定仕様.md §4.1: 声楽家の衣装・会場の効果量 ----
  const singerCostumeVenueEffects = useMemo(() => {
    if (!(effectiveProfessions || []).includes("singer")) return [];
    const sortedDates = Object.keys(entries).sort();
    const costumeGroups = { tight: [], other: [] };
    const acousticsGroups = { dead: [], other: [] };
    sortedDates.forEach((date, i) => {
      const nextDate = sortedDates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = entries[nextDate];
      const throatV = typeof nextEntry.throatCondition === "number" ? nextEntry.throatCondition : null;
      const voiceV = typeof nextEntry.voiceQuality === "number" ? nextEntry.voiceQuality : null;
      if (throatV == null && voiceV == null) return;
      const score = throatV != null && voiceV != null ? (throatV + voiceV) / 2 : (throatV ?? voiceV);
      const relevant = (entries[date].activities || []).filter((a) => a.kind === "本番" || a.kind === "リハーサル");
      relevant.forEach((a) => {
        const d = a.detail || {};
        if (d.costumeTightness) (d.costumeTightness === "tight" ? costumeGroups.tight : costumeGroups.other).push(score);
        if (d.hallAcoustics) (d.hallAcoustics === "dead" ? acousticsGroups.dead : acousticsGroups.other).push(score);
      });
    });
    const results = [];
    const costumeRes = computeHedgesG(costumeGroups.tight, costumeGroups.other);
    if (costumeRes && costumeRes.n1 >= 3 && costumeRes.n0 >= 3) {
      results.push({ key: "costume", label: "衣装の締め付け（強い日）", ...costumeRes, stars: starRatingForEffect(costumeRes) });
    }
    const acousticsRes = computeHedgesG(acousticsGroups.dead, acousticsGroups.other);
    if (acousticsRes && acousticsRes.n1 >= 3 && acousticsRes.n0 >= 3) {
      results.push({ key: "acoustics", label: "会場の響き（デッドな日）", ...acousticsRes, stars: starRatingForEffect(acousticsRes) });
    }
    return results;
  }, [entries, effectiveProfessions]);
  // ---- 衣装・会場の効果量 用データ ここまで ----

  // ---- lavoce-指標設計図.md 05. 効いた習慣ランキング 用データ ----
  // 前日の行動（二値）→翌日のスコア、という向きに必ず固定する（同日で見ると逆向きの因果を拾ってしまうため）。
  const HABIT_DEFINITIONS = useMemo(() => [
    { key: "sleep7h", label: "前夜の睡眠が7時間以上だった", test: (e) => typeof e.sleepHours === "number" ? e.sleepHours >= 7 : null },
    { key: "water2L", label: "前夜の水分摂取が2.0L以上だった", test: (e) => {
      const ml = Object.values(e.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      return ml > 0 ? ml >= 2000 : null;
    } },
    { key: "alcohol", label: "前夜、アルコールを摂取した", test: (e) => (e.dinnerTags || []).length ? (e.dinnerTags || []).includes("アルコール") : null },
    { key: "fried", label: "前夜、揚げ物を食べた", test: (e) => (e.dinnerTags || []).length ? (e.dinnerTags || []).includes("揚げ物") : null },
    { key: "caffeine", label: "前夜、カフェインを摂取した", test: (e) => (e.dinnerTags || []).length ? (e.dinnerTags || []).includes("カフェイン") : null },
    { key: "carbonated", label: "前夜、炭酸飲料を飲んだ", test: (e) => (e.dinnerTags || []).length ? (e.dinnerTags || []).includes("炭酸") : null },
    { key: "highEase", label: "前夜の心の余裕が高かった（4以上）", test: (e) => typeof e.ease === "number" ? e.ease >= 4 : null },
    { key: "talkedALot", label: "前日、よく喋った", test: (e) => typeof e.speakingLevel === "number" ? e.speakingLevel === 2 : null }
  ], []);
  const effectiveHabitRanking = useMemo(() => {
    const sortedDates = Object.keys(filteredEntries).sort();
    const results = HABIT_DEFINITIONS.map((habit) => {
      const group1 = [], group0 = [];
      sortedDates.forEach((date, i) => {
        const nextDate = sortedDates[i + 1];
        if (!nextDate || addDays(date, 1) !== nextDate) return;
        const e = filteredEntries[date];
        const testResult = habit.test(e);
        if (testResult == null) return;
        const nextEntry = filteredEntries[nextDate];
        const throatV = typeof nextEntry.throatCondition === "number" ? nextEntry.throatCondition : null;
        const voiceV = typeof nextEntry.voiceQuality === "number" ? nextEntry.voiceQuality : null;
        if (throatV == null && voiceV == null) return;
        const score = throatV != null && voiceV != null ? (throatV + voiceV) / 2 : (throatV ?? voiceV);
        (testResult ? group1 : group0).push(score);
      });
      const res = computeHedgesG(group1, group0);
      if (!res) return null;
      return { key: habit.key, label: habit.label, ...res, stars: starRatingForEffect(res) };
    }).filter((r) => r != null && r.n1 >= 3 && r.n0 >= 3);
    // 統合実行ルートv4 §6-1 ③: 習慣を一斉に比べているので、文章にする前に多重比較を補正する。
    // ★の付け方（指標設計図.md §04）はここでは変更していない。fdrPass を足すだけ。
    const pValues = results.map((r) => {
      const J = 1 - 3 / (4 * (r.n1 + r.n0) - 9);
      const tStat = (r.g / J) / Math.sqrt(1 / r.n1 + 1 / r.n0);
      return tDistPValue(tStat, r.n1 + r.n0 - 2);
    });
    const passes = benjaminiHochberg(pValues, NARRATIVE_FDR_Q);
    return results
      .map((r, i) => ({ ...r, fdrPass: passes[i] }))
      .sort((a, b) => Math.abs(b.g) - Math.abs(a.g));
  }, [filteredEntries, HABIT_DEFINITIONS]);
  // ---- 効いた習慣ランキング 用データ ここまで ----

  // ---- lavoce-指標設計図.md 04. 声の時差マップ 用データ ----
  // 生活変数を k 日ずらして、目的変数（声の調子＝喉・声の平均）とのスピアマン順位相関を取る。
  const LAG_VARIABLES = useMemo(() => [
    { key: "sleepHours", label: "睡眠時間", extract: (e) => typeof e.sleepHours === "number" ? e.sleepHours : null },
    { key: "water", label: "水分量", extract: (e) => {
      const ml = Object.values(e.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
      return ml > 0 ? ml : null;
    } },
    { key: "ease", label: "心の余裕", extract: (e) => typeof e.ease === "number" ? e.ease : null },
    { key: "dinnerGap", label: "夕食から就寝までの間隔", extract: (e) => computeTimeGapHours(e.dinnerTime, e.bedtime) },
    { key: "absHumidity", label: "絶対湿度", extract: (e) => computeAbsoluteHumidity(e.temperature, e.humidity) },
    { key: "alcohol", label: "アルコール摂取", extract: (e) => (e.dinnerTags || []).length ? ((e.dinnerTags || []).includes("アルコール") ? 1 : 0) : null },
    { key: "load", label: "発声負荷（ACWR）", extract: (e, date) => acwrSeries[date] ? acwrSeries[date].acwr : null }
  ], [acwrSeries]);
  const lagCorrelationMap = useMemo(() => {
    const sortedDates = Object.keys(filteredEntries).sort();
    const dateIndex = {};
    sortedDates.forEach((d, i) => { dateIndex[d] = i; });
    const cells = [];
    LAG_VARIABLES.forEach((variable) => {
      for (let lag = 0; lag <= 3; lag++) {
        const xs = [], ys = [];
        sortedDates.forEach((date) => {
          const targetIdx = dateIndex[date] + lag;
          const targetDate = sortedDates[targetIdx];
          if (!targetDate) return;
          // lag日分すべて連続したカレンダー日であることを確認（記録の欠落をまたいだ比較を避ける）
          let expected = date;
          let ok = true;
          for (let s = 0; s < lag; s++) {
            expected = addDays(expected, 1);
            if (sortedDates[dateIndex[date] + s + 1] !== expected) { ok = false; break; }
          }
          if (!ok) return;
          const xVal = variable.extract(filteredEntries[date], date);
          const targetEntry = filteredEntries[targetDate];
          const throatV = typeof targetEntry.throatCondition === "number" ? targetEntry.throatCondition : null;
          const voiceV = typeof targetEntry.voiceQuality === "number" ? targetEntry.voiceQuality : null;
          if (xVal == null || (throatV == null && voiceV == null)) return;
          const yVal = throatV != null && voiceV != null ? (throatV + voiceV) / 2 : (throatV ?? voiceV);
          xs.push(xVal); ys.push(yVal);
        });
        const n = xs.length;
        const rho = n >= 14 ? spearman(xs, ys) : null;
        let pValue = null;
        if (rho != null && Math.abs(rho) < 1) {
          const tStat = rho * Math.sqrt((n - 2) / (1 - rho * rho));
          pValue = tDistPValue(tStat, n - 2);
        }
        cells.push({ variableKey: variable.key, variableLabel: variable.label, lag, n, rho, pValue });
      }
    });
    const significance = benjaminiHochberg(cells.map((c) => c.pValue), 0.10);
    cells.forEach((c, i) => { c.significant = significance[i]; });
    return cells;
  }, [filteredEntries, LAG_VARIABLES]);
  const topLagFinding = useMemo(() => {
    const significant = lagCorrelationMap.filter((c) => c.significant);
    if (significant.length === 0) return null;
    return significant.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho))[0];
  }, [lagCorrelationMap]);
  // ---- 声の時差マップ 用データ ここまで ----

  // ---- lavoce-指標設計図.md 07. 発声負荷バランス（ACWR） 用データ ----
  // acwrSeries（フェーズ2の予報モデルで既に計算済み）をそのまま使い、
  // ゾーン判定・グラフ用の系列・「明日を休養にした場合」の1ステップ先予測を組み立てる。
  function acwrZone(value) {
    if (value == null) return null;
    // ★値で色を変えない（§7-5）。言葉がそのまま状態を言っている。
    if (value < 0.8) return { key: "low", label: "積み足りない" };
    if (value <= 1.3) return { key: "good", label: "ちょうどいい" };
    if (value <= 1.5) return { key: "caution", label: "増やしすぎ注意" };
    return { key: "high", label: "喉を痛めやすい急増" };
  }
  const acwrChartData = useMemo(() => {
    const dates = Object.keys(acwrSeries).sort().slice(-28);
    // ★推定を補った日が分かるようにする（改善タスクv2 §3-1「グラフ上で区別表示する」）。
    //   実測の日と推定の日を、同じ点で描いてはいけない。
    return dates.map((d) => ({
      date: d.slice(5),
      acwr: acwrSeries[d].acwr != null ? roundTo1(acwrSeries[d].acwr) : null,
      isEstimated: !!acwrSeries[d].isEstimated
    }));
  }, [acwrSeries]);
  // 直近28日のうち、何日が推定に頼っているか。★0日なら注記を出さない。
  const acwrEstimatedDays = useMemo(
    () => acwrChartData.filter((d) => d.isEstimated && d.acwr != null).length,
    [acwrChartData]
  );
  // 統合実行ルートv4 §6-4 / P0-2: ACWRのパネルがロック中なのに、トップに警告だけが
  // 出ていた。★ロックと警告は必ずこの同一フラグを見ること。ここで null にすることで、
  // パネルも「今日の一言」も、同時にしか出られないようにする。
  const acwrGate = useMemo(() => evaluateGate("acwr", { days: recordedDaysTotal }, t), [recordedDaysTotal, t]);
  const acwrToday = useMemo(() => {
    if (!acwrGate.passed) return null;
    const dates = Object.keys(acwrSeries).sort();
    if (dates.length === 0) return null;
    const lastDate = dates[dates.length - 1];
    const latest = acwrSeries[lastDate];
    if (latest.acwr == null) return null;
    const lambdaA = 2 / (7 + 1);
    const lambdaC = 2 / (28 + 1);
    // 明日を休養（発声負荷ゼロ）にした場合のEWMAをもう1ステップ進めた予測値
    const restA = lambdaA * 0 + (1 - lambdaA) * latest.A;
    const restC = lambdaC * 0 + (1 - lambdaC) * latest.C;
    const restAcwr = restC > 0 ? restA / restC : null;
    return { date: lastDate, value: roundTo1(latest.acwr), zone: acwrZone(latest.acwr), restProjection: restAcwr != null ? roundTo1(restAcwr) : null, restZone: acwrZone(restAcwr) };
  }, [acwrSeries, acwrGate]);
  // ---- 発声負荷バランス 用データ ここまで ----

  // ---- lavoce-記録項目の再設計v2.md §3.7: 稽古ノート（タグ別の自動添付データ） ----
  // 「変わった気がしない」の横に、実は半音上がっているグラフを出すのがこの機能の肝。
  const practiceGoalMetrics = useMemo(() => {
    const tags = profile.practice_goal_tags || [];
    if (tags.length === 0) return [];
    const dates28 = Object.keys(entries).sort().slice(-28);
    const metrics = [];
    tags.forEach((tag) => {
      if (tag === "soft_high") {
        const vals = dates28.map((d) => ({ date: d, midi: noteToMidi(entries[d].pianissimoHighNote) })).filter((x) => x.midi != null);
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          const diff = last.midi - first.midi;
          metrics.push({
            tag, label: "弱声の最高音", data: vals.map((v) => ({ date: v.date.slice(5), value: v.midi })),
            summary: `${midiToNoteLabel(first.midi)} → ${midiToNoteLabel(last.midi)}（${diff >= 0 ? "+" : ""}${diff}半音）`
          });
        }
      } else if (tag === "high_range") {
        const vals = dates28.map((d) => ({ date: d, midi: noteToMidi(entries[d].routineNote) })).filter((x) => x.midi != null);
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          const diff = last.midi - first.midi;
          metrics.push({
            tag, label: "ルーティン後の音名", data: vals.map((v) => ({ date: v.date.slice(5), value: v.midi })),
            summary: `${midiToNoteLabel(first.midi)} → ${midiToNoteLabel(last.midi)}（${diff >= 0 ? "+" : ""}${diff}半音）`
          });
        }
      } else if (tag === "range") {
        const vals = dates28.map((d) => {
          const wake = noteToMidi(entries[d].wakeNote);
          const routine = noteToMidi(entries[d].routineNote);
          const vs = [wake, routine].filter((v) => v != null);
          return vs.length >= 2 ? { date: d, width: Math.max(...vs) - Math.min(...vs) } : null;
        }).filter(Boolean);
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          metrics.push({
            tag, label: "音域幅（最高−最低、半音）", data: vals.map((v) => ({ date: v.date.slice(5), value: v.width })),
            summary: `${first.width}半音 → ${last.width}半音（${last.width - first.width >= 0 ? "+" : ""}${last.width - first.width}半音）`
          });
        }
      } else if (tag === "articulation") {
        const vals = dates28.map((d) => ({ date: d, cpps: entries[d].cppsValue })).filter((x) => typeof x.cpps === "number");
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          metrics.push({
            tag, label: "CPPS（声の明瞭さ）の推移", data: vals.map((v) => ({ date: v.date.slice(5), value: v.cpps })),
            summary: `${first.cpps.toFixed(1)}dB → ${last.cpps.toFixed(1)}dB`
          });
        }
      } else if (tag === "stamina") {
        const vals = dates28.map((d) => (acwrSeries[d] && acwrSeries[d].acwr != null ? { date: d, acwr: roundTo1(acwrSeries[d].acwr) } : null)).filter(Boolean);
        if (vals.length >= 2) {
          metrics.push({
            tag, label: "発声負荷バランス（ACWR）の推移", data: vals.map((v) => ({ date: v.date.slice(5), value: v.acwr })),
            summary: `直近: ${vals[vals.length - 1].acwr}`
          });
        }
      } else if (tag === "breath_support") {
        // その日の声の記録のうち、MPTを測った中でいちばん長かった値を採用する。
        const vals = dates28.map((d) => {
          const mpts = ((entries[d].voiceEntries || [])).map((v) => v.mptSeconds).filter((v) => typeof v === "number");
          return mpts.length > 0 ? { date: d, mpt: Math.max(...mpts) } : null;
        }).filter(Boolean);
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          metrics.push({
            tag, label: "最長発声時間（MPT）の推移", data: vals.map((v) => ({ date: v.date.slice(5), value: v.mpt })),
            summary: `${first.mpt.toFixed(1)}秒 → ${last.mpt.toFixed(1)}秒`
          });
        } else {
          metrics.push({ tag, label: "最長発声時間（MPT）", data: null, summary: null, needsMoreData: true });
        }
      } else if (tag === "evenness") {
        const vals = dates28.map((d) => {
          const scores = ((entries[d].voiceEntries || [])).map((v) => v.toneEvenness).filter((v) => typeof v === "number");
          return scores.length > 0 ? { date: d, score: scores.reduce((a, b) => a + b, 0) / scores.length } : null;
        }).filter(Boolean);
        if (vals.length >= 2) {
          const first = vals[0], last = vals[vals.length - 1];
          metrics.push({
            tag, label: "音色の均一感の推移", data: vals.map((v) => ({ date: v.date.slice(5), value: v.score })),
            summary: `${first.score.toFixed(1)} → ${last.score.toFixed(1)}（5点満点）`
          });
        } else {
          metrics.push({ tag, label: "音色の均一感", data: null, summary: null, needsMoreData: true });
        }
      } else {
        metrics.push({ tag, label: (GOAL_TAGS.find((g) => g.key === tag) || {}).label, data: null, summary: null, notYetAvailable: true });
      }
    });
    return metrics;
  }, [profile.practice_goal_tags, entries, acwrSeries]);
  // ---- 稽古ノート 用データ ここまで ----

  // ---- lavoce-指標設計図.md 09. 環境の快適帯 用データ ----
  // 相対湿度ではなく絶対湿度（AH）で見る。気温が変わると同じ%でも実際の水分量が変わるため。
  const envEntries = useMemo(() => {
    return Object.values(entries)
      .map((e) => ({
        ah: computeAbsoluteHumidity(e.temperature, e.humidity),
        temp: typeof e.temperature === "number" ? e.temperature : null,
        rh: typeof e.humidity === "number" ? e.humidity : null,
        throat: typeof e.throatCondition === "number" ? e.throatCondition : null
      }))
      .filter((x) => x.ah != null && x.throat != null);
  }, [entries]);
  // ①絶対湿度を2g/m³刻みでビン分けし、②喉スコア平均が「全体平均+0.3」を超える連続区間を快適帯とする。
  const comfortZone1D = useMemo(() => {
    if (envEntries.length < 5) return null;
    const overallAvg = envEntries.reduce((s, x) => s + x.throat, 0) / envEntries.length;
    const binSize = 2;
    const byBin = {};
    envEntries.forEach((x) => {
      const bin = Math.floor(x.ah / binSize) * binSize;
      if (!byBin[bin]) byBin[bin] = { sum: 0, n: 0 };
      byBin[bin].sum += x.throat; byBin[bin].n += 1;
    });
    const bins = Object.keys(byBin).map(Number).sort((a, b) => a - b);
    const binStats = bins.map((b) => ({ bin: b, avg: byBin[b].sum / byBin[b].n, n: byBin[b].n }));
    const threshold = overallAvg + 0.3;
    // n≥2のビンの中で、閾値を超える連続区間のうち最長のものを快適帯とする
    let bestRun = [], currentRun = [];
    binStats.forEach((s, i) => {
      const qualifies = s.n >= 2 && s.avg > threshold;
      const isContiguous = currentRun.length === 0 || s.bin === currentRun[currentRun.length - 1].bin + binSize;
      if (qualifies && isContiguous) {
        currentRun.push(s);
      } else if (qualifies) {
        currentRun = [s];
      } else {
        currentRun = [];
      }
      if (currentRun.length > bestRun.length) bestRun = currentRun;
    });
    if (bestRun.length === 0) return { overallAvg, binStats, range: null };
    return { overallAvg, binStats, range: { low: bestRun[0].bin, high: bestRun[bestRun.length - 1].bin + binSize } };
  }, [envEntries]);

  // ---- 記録と分析の順番設計 §3.3: 各セクションが、その場で返すもの ----
  //
  // ★「入れたのに何も起きない」欄をゼロにする（統合実行ルートv4 §2 瞬間②）。
  //   分析の本領（発見カード）は14日ぶんのデータを要するため、新規ユーザーは
  //   入れても何も返ってこない2週間を通過する。その2週間を支えるのはこれ。
  //
  // ★守ること:
  //   ・すべて「自分比」。他人との比較・文献の閾値は出さない（v4 §11）
  //   ・心の余裕だけは数値を返さない。メンタルに点数を返すと良し悪しの判定になる
  //   ・根拠の指標がロック中なら出さない（ACWRで起きたことを繰り返さない）
  const sectionFeedback = useMemo(() => {
    if (!formData) return {};
    const fb = {};
    const past = Object.keys(entries).filter((d) => d < selectedDate).sort();
    // ★実際に値のあった日数も返すこと。
    //   以前は3日ぶんしか無くても「14日平均より」と書いていた。窓の長さと、
    //   実際に平均を取れた日数は別物で、混ぜると事実と違う表示になる。
    const MIN_DAYS_FOR_AVERAGE = 3;   // 1〜2日を「平均」とは呼ばない
    const avgOf = (dates, pick) => {
      const vals = dates.map((d) => pick(entries[d])).filter((v) => typeof v === "number" && !isNaN(v));
      if (vals.length < MIN_DAYS_FOR_AVERAGE) return null;
      return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, n: vals.length };
    };
    const signed = (v, digits, unit) => `${v >= 0 ? "+" : ""}${v.toFixed(digits)}${unit}`;

    // 環境: 絶対湿度と、自分の快適域との関係
    const ah = computeAbsoluteHumidity(Number(formData.temperature), Number(formData.humidity));
    if (ah != null && !isNaN(ah)) {
      let rel = "";
      if (comfortZone1D && comfortZone1D.range) {
        if (ah < comfortZone1D.range.low) rel = "・あなたの快適域より乾いています";
        else if (ah > comfortZone1D.range.high) rel = "・あなたの快適域より湿っています";
        else rel = "・あなたの快適域の中です";
      }
      fb.env = `絶対湿度 ${ah.toFixed(1)} g/m³${rel}`;
    }

    // 睡眠: 直近14日の自分の平均との差
    if (typeof formData.sleepHours === "number" && formData.sleepHours > 0) {
      const r = avgOf(past.slice(-14), (e) => e.sleepHours);
      if (r) fb.sleep = `直近${r.n}日の平均より ${signed(formData.sleepHours - r.avg, 1, "時間")}`;
    }

    // 活動: その場で再計算した今日の発声負荷。負荷比はロックが解けてからだけ添える。
    const todayLoad = computeDayLoadFromActivities(formData.activities || [], songFactorResolver);
    if (todayLoad > 0) {
      const zone = acwrGate.passed && acwrToday && acwrToday.zone
        ? `・今週の発声負荷 ${acwrToday.value}（${acwrToday.zone.label}）` : "";
      fb.activity = `今日の発声負荷 ${Math.round(todayLoad)}（分の重みつき換算）${zone}`;
    }

    // 水分: 体重があれば体重比、無ければ自分の平均との差
    const water = Object.values(formData.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
    if (water > 0) {
      const w = Number(formData.weightKg) || getLatestWeight(entries, selectedDate);
      if (w) fb.water = `体重比 ${Math.round(water / w)} ml/kg`;
      else {
        const r = avgOf(past.slice(-7), (e) => Object.values(e.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0) || null);
        if (r) fb.water = `直近${r.n}日の平均より ${signed(water - r.avg, 0, "ml")}`;
      }
    }

    // 食事: 夕食から就寝までの間隔
    const gap = computeTimeGapHours(formData.dinnerTime, formData.bedtime);
    if (gap != null) fb.meal = `就寝まで ${gap.toFixed(1)}時間`;

    // 症状: 同じ症状が今月なん日目か
    // 症状は声の記録（voiceEntries）側に入るので、そこから集める。
    const syms = Array.from(new Set([
      ...(formData.throatSymptoms || []),
      ...(formData.voiceEntries || []).flatMap((v) => v.symptoms || [])
    ]));
    if (syms.length > 0) {
      const month = selectedDate.slice(0, 7);
      const days = past.filter((d) => d.startsWith(month) && (entries[d].throatSymptoms || []).some((x) => syms.includes(x))).length;
      fb.symptoms = `同じ症状は今月 ${days + 1}日目`;
    }

    // 心の余裕: ★数値を返さない。点数を返すと良し悪しの判定になるため。
    if (typeof formData.ease === "number") fb.mental = "記録しました";

    return fb;
  }, [formData, entries, selectedDate, comfortZone1D, acwrGate, acwrToday, songFactorResolver]);

  // ②気温4℃刻み×相対湿度10%刻みの2次元マップ
  const comfortZone2D = useMemo(() => {
    if (envEntries.length < 10) return null;
    const cells = {};
    envEntries.forEach((x) => {
      if (x.temp == null || x.rh == null) return;
      const tBin = Math.floor(x.temp / 4) * 4;
      const rhBin = Math.floor(x.rh / 10) * 10;
      const key = `${tBin}_${rhBin}`;
      if (!cells[key]) cells[key] = { tBin, rhBin, sum: 0, n: 0 };
      cells[key].sum += x.throat; cells[key].n += 1;
    });
    const list = Object.values(cells).map((c) => ({ ...c, avg: c.sum / c.n }));
    if (list.length === 0) return null;
    const tBins = [...new Set(list.map((c) => c.tBin))].sort((a, b) => a - b);
    const rhBins = [...new Set(list.map((c) => c.rhBin))].sort((a, b) => a - b);
    return { cells: list, tBins, rhBins };
  }, [envEntries]);
  const todayEnvPosition = useMemo(() => {
    const realToday = realTodayDate;
    const e = entries[realToday];
    if (!e) return null;
    const ah = computeAbsoluteHumidity(e.temperature, e.humidity);
    if (ah == null) return null;
    return { ah: roundTo1(ah), temp: e.temperature, rh: e.humidity, location: e.location || null };
  }, [entries, realTodayDate]);
  // ---- 環境の快適帯 用データ ここまで ----

  // ---- lavoce-指標設計図.md 08. 本番ピーキング曲線 用データ ----
  const performanceDates = useMemo(() => Object.keys(entries).filter((d) => entryHasActivityKind(entries[d], "本番")).sort(), [entries]);
  const nextPerformanceDate = useMemo(() => {
    const realToday = realTodayDate;
    return performanceDates.find((d) => d > realToday) || null;
  }, [performanceDates, realTodayDate]);
  const pastPerformanceDates = useMemo(() => {
    const realToday = realTodayDate;
    return performanceDates.filter((d) => d <= realToday);
  }, [performanceDates, realTodayDate]);
  // 本番日をゼロ点にして、過去のすべての本番を重ね合わせる（イベント整列平均）。
  const peakingCurve = useMemo(() => {
    if (pastPerformanceDates.length < 3) return null;
    const tauMin = -7, tauMax = 3;
    const tauData = {};
    for (let tau = tauMin; tau <= tauMax; tau++) tauData[tau] = [];
    pastPerformanceDates.forEach((perfDate) => {
      for (let tau = tauMin; tau <= tauMax; tau++) {
        const targetDate = addDays(perfDate, tau);
        // 本番が連日で重なる期間は、targetDateにとって「最寄りの本番」にだけ紐づけ、二重計上を防ぐ。
        let nearest = null, nearestDist = Infinity;
        pastPerformanceDates.forEach((pd) => {
          const dist = Math.abs((new Date(targetDate) - new Date(pd)) / 86400000);
          if (dist < nearestDist) { nearestDist = dist; nearest = pd; }
        });
        if (nearest !== perfDate) continue;
        const entry = entries[targetDate];
        if (!entry || typeof entry.throatCondition !== "number") continue;
        tauData[tau].push(entry.throatCondition);
      }
    });
    const curve = [];
    for (let tau = tauMin; tau <= tauMax; tau++) {
      const vals = tauData[tau];
      if (vals.length < 2) { curve.push({ tau, mean: null, sd: null, n: vals.length }); continue; }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (vals.length - 1);
      curve.push({ tau, mean: roundTo1(mean), sd: Math.sqrt(variance), n: vals.length });
    }
    const validPoints = curve.filter((c) => c.mean != null);
    const dips = validPoints.filter((c) => c.tau < 0);
    const lowestDip = dips.length ? dips.reduce((a, b) => (b.mean < a.mean ? b : a)) : null;
    return { curve, count: pastPerformanceDates.length, lowestDip };
  }, [pastPerformanceDates, entries]);
  // 逆算プラン：本番当日のスコアが4以上だった回だけを使い、τ日目の行動の中央値を目標値として提示する。
  const peakingReversePlan = useMemo(() => {
    if (pastPerformanceDates.length < 3) return null;
    const goodPerfs = pastPerformanceDates.filter((d) => typeof entries[d].throatCondition === "number" && entries[d].throatCondition >= 4);
    const usePerfs = goodPerfs.length >= 2 ? goodPerfs : pastPerformanceDates;
    const isGeneral = goodPerfs.length < 2;
    const tauMin = -7, tauMax = 0;
    const plan = [];
    for (let tau = tauMin; tau <= tauMax; tau++) {
      const sleepVals = [], loadVals = [], waterVals = [];
      usePerfs.forEach((perfDate) => {
        const targetDate = addDays(perfDate, tau);
        const e = entries[targetDate];
        if (!e) return;
        if (typeof e.sleepHours === "number") sleepVals.push(e.sleepHours);
        if (acwrSeries[targetDate] && acwrSeries[targetDate].acwr != null) loadVals.push(acwrSeries[targetDate].acwr);
        const waterMl = Object.values(e.waterBySlot || {}).reduce((s, v) => s + (Number(v) || 0), 0);
        if (waterMl > 0) waterVals.push(waterMl);
      });
      plan.push({
        tau,
        sleepHours: median(sleepVals),
        load: median(loadVals),
        waterL: waterVals.length ? median(waterVals) / 1000 : null
      });
    }
    return { plan, isGeneral, basedOnCount: usePerfs.length };
  }, [pastPerformanceDates, entries, acwrSeries]);
  // ---- 本番ピーキング曲線 用データ ここまで ----

  // ---- lavoce-週次カルテ見直しパッチ.md §4: レッスンモード 用データ ----
  // 先生に画面をそのまま見せるための読み取り専用ビュー。メンタルの日記・気持ちタグ・
  // 体重・体組成・食事の詳細・既往症は、意図的にここでは一切参照しない。
  const lessonModeData = useMemo(() => {
    const realToday = realTodayDate;
    const dates4w = [];
    for (let i = 27; i >= 0; i--) dates4w.push(addDays(realToday, -i));
    const scoreTrend = dates4w.map((d) => ({ date: d.slice(5), score: entries[d] ? computeDailyScore100(entries[d]) : null }));
    const symptomWeeks = dates4w.map((d) => ({ date: d, symptoms: entries[d] ? (entries[d].throatSymptoms || []) : null }));
    const loadTrend = dates4w.map((d) => ({ date: d.slice(5), acwr: acwrSeries[d] ? roundTo1(acwrSeries[d].acwr) : null }));
    const allMidis = [];
    dates4w.forEach((d) => {
      const e = entries[d];
      if (!e) return;
      const w = noteToMidi(e.wakeNote), r = noteToMidi(e.routineNote);
      if (w != null) allMidis.push(w);
      if (r != null) allMidis.push(r);
    });
    const rangeInWindow = allMidis.length ? { low: Math.min(...allMidis), high: Math.max(...allMidis) } : null;
    return { scoreTrend, symptomWeeks, loadTrend, rangeInWindow, recordedCount: dates4w.filter((d) => entries[d]).length };
  }, [entries, acwrSeries, realTodayDate]);
  // ---- レッスンモード 用データ ここまで ----

  // ---- lavoce-週次カルテ見直しパッチ.md §5: 受診用サマリー 用データ ----
  // 医師に見せる想定のため、偏差値・ACWR・ラグ相関・効果量・CPPSなどアプリ独自の指標は
  // 意図的に一切含めない（§5.4）。記録した項目名をそのまま使い、病名は書かない。
  const symptomContinuousRanges = useMemo(() => {
    const dates = Object.keys(entries).sort();
    const ranges = {};
    SYMPTOM_OPTIONS.forEach((symptom) => {
      let currentStart = null, prevDate = null;
      const list = [];
      dates.forEach((date) => {
        const has = (entries[date].throatSymptoms || []).includes(symptom);
        if (has) {
          if (!(currentStart && prevDate && addDays(prevDate, 1) === date)) currentStart = date;
        } else if (currentStart) {
          list.push({ start: currentStart, end: prevDate });
          currentStart = null;
        }
        prevDate = date;
      });
      if (currentStart) list.push({ start: currentStart, end: prevDate });
      ranges[symptom] = list;
    });
    return ranges;
  }, [entries]);
  // §5.2: 現在まで続いている症状の連続区間のうち、開始日がいちばん早いものを自動検出する
  const clinicAutoDetectedStart = useMemo(() => {
    const dates = Object.keys(entries).sort();
    if (dates.length === 0) return null;
    const latestDate = dates[dates.length - 1];
    let earliest = null;
    Object.values(symptomContinuousRanges).forEach((ranges) => {
      ranges.forEach((r) => {
        if (r.end === latestDate && (!earliest || r.start < earliest)) earliest = r.start;
      });
    });
    return earliest;
  }, [symptomContinuousRanges, entries]);
  const clinicPeriodRange = useMemo(() => {
    const realToday = realTodayDate;
    if (clinicPeriodMode === "month") return { start: addDays(realToday, -29), end: realToday };
    if (clinicPeriodMode === "3months") return { start: addDays(realToday, -89), end: realToday };
    if (clinicPeriodMode === "custom") return { start: clinicCustomStart || addDays(realToday, -29), end: clinicCustomEnd || realToday };
    return { start: clinicAutoDetectedStart || addDays(realToday, -29), end: realToday }; // "auto"
  }, [clinicPeriodMode, clinicAutoDetectedStart, clinicCustomStart, clinicCustomEnd, realTodayDate]);
  const clinicSymptomSummary = useMemo(() => {
    const { start, end } = clinicPeriodRange;
    const datesInRange = Object.keys(entries).filter((d) => d >= start && d <= end).sort();
    return SYMPTOM_OPTIONS.map((symptom) => {
      const symptomDates = datesInRange.filter((d) => (entries[d].throatSymptoms || []).includes(symptom));
      if (symptomDates.length === 0) return null;
      return { symptom, firstDate: symptomDates[0], lastDate: symptomDates[symptomDates.length - 1], count: symptomDates.length, dates: symptomDates };
    }).filter(Boolean);
  }, [entries, clinicPeriodRange]);
  // §5.3-③: 週あたりの発声時間（グラフは1つだけ、というルールに沿う）
  const clinicWeeklyVoiceUsage = useMemo(() => {
    const { start, end } = clinicPeriodRange;
    const weeks = {};
    Object.keys(entries).filter((d) => d >= start && d <= end).forEach((d) => {
      const e = entries[d];
      // ★受診用サマリーには、推定を混ぜないこと。
      //   お医者さんが読む紙に、こちらが種別から補った値を実測のように
      //   載せてはいけない。実際に記録された分だけを出す（§5.4 の趣旨）。
      const dayMinutes = dayVocalDose(e).measuredMinutes;
      if (dayMinutes <= 0) return;
      const dayOfWeek = new Date(d + "T00:00:00").getDay();
      const weekStart = addDays(d, -dayOfWeek);
      weeks[weekStart] = (weeks[weekStart] || 0) + dayMinutes / 60;
    });
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).map(([weekStart, hours]) => ({ week: weekStart.slice(5), hours: roundTo1(hours) }));
  }, [entries, clinicPeriodRange]);
  const clinicSleepAverage = useMemo(() => {
    const { start, end } = clinicPeriodRange;
    const vals = Object.keys(entries).filter((d) => d >= start && d <= end).map((d) => entries[d].sleepHours).filter((v) => typeof v === "number");
    return vals.length ? roundTo1(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }, [entries, clinicPeriodRange]);
  const clinicMedications = useMemo(() => {
    const { start, end } = clinicPeriodRange;
    const meds = new Set();
    Object.keys(entries).filter((d) => d >= start && d <= end).forEach((d) => {
      (entries[d].medicationTags || []).forEach((m) => meds.add(m));
    });
    return Array.from(meds);
  }, [entries, clinicPeriodRange]);
  // ---- 受診用サマリー 用データ ここまで ----

  // ---- lavoce-記録項目の再設計v2.md §3.6: 逆流専用の分析 用データ ----
  // conditions に gerd（逆流性食道炎）か lpr（咽喉頭酸逆流）を登録した人にだけ表示する。
  // 未診断の人には「疑い」を一切示さない（§7.1）。
  const hasRefluxCondition = (profile.conditions || []).some((c) => c === "gerd" || c === "lpr");
  const refluxDinnerGapBins = useMemo(() => {
    if (!hasRefluxCondition) return [];
    const sortedDates = Object.keys(entries).sort();
    const bins = { "〜1時間": { n: 0, hit: 0 }, "1〜2時間": { n: 0, hit: 0 }, "2〜3時間": { n: 0, hit: 0 }, "3時間〜": { n: 0, hit: 0 } };
    sortedDates.forEach((date, i) => {
      const e = entries[date];
      const gap = computeTimeGapHours(e.dinnerTime, e.bedtime);
      if (gap == null) return;
      const nextDate = sortedDates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = entries[nextDate];
      const hasDiscomfort = (nextEntry.throatSymptoms || []).includes("違和感");
      const binKey = gap <= 1 ? "〜1時間" : gap <= 2 ? "1〜2時間" : gap <= 3 ? "2〜3時間" : "3時間〜";
      bins[binKey].n += 1;
      if (hasDiscomfort) bins[binKey].hit += 1;
    });
    // §7.3: 件数を必ず添える。各ビンn≥5で表示。
    return Object.entries(bins).map(([label, s]) => ({ label, n: s.n, rate: s.n > 0 ? (s.hit / s.n) * 100 : null }));
  }, [entries, hasRefluxCondition]);
  const refluxDinnerTagEffects = useMemo(() => {
    if (!hasRefluxCondition) return [];
    const tags = ["揚げ物", "炭酸", "カフェイン", "アルコール", "トマト系"];
    const sortedDates = Object.keys(entries).sort();
    return tags.map((tag) => {
      const group1 = [], group0 = [];
      sortedDates.forEach((date, i) => {
        const e = entries[date];
        const nextDate = sortedDates[i + 1];
        if (!nextDate || addDays(date, 1) !== nextDate) return;
        const nextEntry = entries[nextDate];
        const hasDiscomfort = (nextEntry.throatSymptoms || []).includes("違和感") ? 1 : 0;
        ((e.dinnerTags || []).includes(tag) ? group1 : group0).push(hasDiscomfort);
      });
      const res = computeHedgesG(group1, group0);
      if (!res) return null;
      return { tag, ...res, stars: starRatingForEffect(res) };
    }).filter((r) => r != null && r.n1 >= 3 && r.n0 >= 3);
  }, [entries, hasRefluxCondition]);
  // 統合実行ルートv4 §6-1 ③: 5つのタグを一斉に比べているので、文章にする前に多重比較を補正する。
  const refluxDinnerTagEffectsWithFdr = useMemo(() => {
    const pValues = refluxDinnerTagEffects.map((r) => {
      const J = 1 - 3 / (4 * (r.n1 + r.n0) - 9);
      const tStat = (r.g / J) / Math.sqrt(1 / r.n1 + 1 / r.n0);
      return tDistPValue(tStat, r.n1 + r.n0 - 2);
    });
    const passes = benjaminiHochberg(pValues, NARRATIVE_FDR_Q);
    return refluxDinnerTagEffects.map((r, i) => ({ ...r, fdrPass: passes[i] }));
  }, [refluxDinnerTagEffects]);
  // ---- 逆流専用の分析 用データ ここまで ----

  // ---- lavoce-記録項目の再設計v2.md §3.5: エネルギー可用性（EA） 用データ ----
  // 日次では出さない（体重は水分でブレるため）。件数が十分溜まったときだけ、月1回のまとめとして表示する。
  const energyAvailabilityAnalysis = useMemo(() => {
    const realToday = realTodayDate;
    const dates28 = [];
    for (let i = 27; i >= 0; i--) dates28.push(addDays(realToday, -i));
    const nutritionTargets28 = dates28.map((d) => {
      const e = entries[d];
      if (!e) return null;
      const w = e.weightKg || getLatestWeight(entries, d);
      const targets = computeNutritionTargets(w, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient);
      const intakeKcal = (e.carbs || 0) * 4 + (e.protein || 0) * 4 + (e.fat || 0) * 9;
      const exerciseKcal = (e.exercises || []).reduce((s, x) => s + 0.1 * (w || 60) * (Number(x.minutes) || 0) * ((typeof x.intensity === "number" ? x.intensity : 3) / 3), 0);
      const ffmResult = computeFFM(w, profile.height_cm ? Number(profile.height_cm) : null, profile.age ? Number(profile.age) : null, profile.sex, e.bodyFatPct);
      const ea = ffmResult && intakeKcal > 0 ? computeEnergyAvailability(intakeKcal, exerciseKcal, ffmResult.ffm) : null;
      return { date: d, intakeKcal, ea, isEstimatedFFM: ffmResult ? ffmResult.isEstimated : null };
    });
    const validEaCount = nutritionTargets28.filter((x) => x && x.ea != null).length;
    // カロリー記録が十分に揃っている（28日中14日以上）場合はEAで判定する
    if (validEaCount >= 14) {
      const eaVals = nutritionTargets28.filter((x) => x && x.ea != null).map((x) => x.ea);
      const recentAvg = eaVals.slice(-21).reduce((a, b) => a + b, 0) / Math.min(21, eaVals.length);
      const earlierSlice = eaVals.slice(0, Math.max(0, eaVals.length - 13));
      const earlierAvg = earlierSlice.length ? earlierSlice.reduce((a, b) => a + b, 0) / earlierSlice.length : recentAvg;
      const isLow = recentAvg < 30 && earlierAvg < 30; // 2週間程度の継続を簡易的に確認（両端で判定）
      const isEstimated = nutritionTargets28.some((x) => x && x.isEstimatedFFM);
      return { method: "ea", recentAvg, isLow, isEstimated, validEaCount };
    }
    // カロリー記録が足りない場合は、既存データだけで組める複合サインにフォールバックする
    const dates56 = [];
    for (let i = 55; i >= 0; i--) dates56.push(addDays(realToday, -i));
    const weightsRecent = dates56.slice(28).map((d) => entries[d] && entries[d].weightKg).filter((v) => typeof v === "number");
    const weightsEarlier = dates56.slice(0, 28).map((d) => entries[d] && entries[d].weightKg).filter((v) => typeof v === "number");
    const signal1 = weightsRecent.length >= 3 && weightsEarlier.length >= 3 &&
      (weightsEarlier.reduce((a, b) => a + b, 0) / weightsEarlier.length - weightsRecent.reduce((a, b) => a + b, 0) / weightsRecent.length) /
      (weightsEarlier.reduce((a, b) => a + b, 0) / weightsEarlier.length) >= 0.03;
    const dates14 = dates28.slice(-14);
    const symptomDayRatio = dates14.filter((d) => entries[d] && (entries[d].throatSymptoms || []).length > 0).length / 14;
    const signal2 = symptomDayRatio > 0.5;
    let recoveryNotBackCount = 0;
    const sortedDates = Object.keys(entries).sort();
    sortedDates.forEach((date, i) => {
      const e = entries[date];
      if (!(e.activities && e.activities.length === 0 && e.recovery)) return;
      const nextDate = sortedDates[i + 1];
      if (!nextDate || addDays(date, 1) !== nextDate) return;
      const nextEntry = entries[nextDate];
      if (typeof nextEntry.throatCondition === "number" && overallThroatBaseline != null && nextEntry.throatCondition < overallThroatBaseline) {
        recoveryNotBackCount += 1;
      }
    });
    const signal3 = recoveryNotBackCount >= 3;
    const sleepVals14 = dates14.map((d) => entries[d] && entries[d].sleepHours).filter((v) => typeof v === "number");
    const avgSleep14 = sleepVals14.length ? sleepVals14.reduce((a, b) => a + b, 0) / sleepVals14.length : null;
    const fatigueDayCount = dates14.filter((d) => entries[d] && (entries[d].mentalTags || []).includes("疲労・過労")).length;
    const signal5 = avgSleep14 != null && avgSleep14 >= 7 && fatigueDayCount >= 7;
    // 月経周期の乱れ（signal4）は現状のデータでは信頼できる判定ができないため対象外とする
    const signalCount = [signal1, signal2, signal3, signal5].filter(Boolean).length;
    return { method: "composite", signalCount, isLow: signalCount >= 3, signals: { signal1, signal2, signal3, signal5 } };
  }, [entries, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient, overallThroatBaseline, realTodayDate]);
  // ---- エネルギー可用性 用データ ここまで ----

  // ---- lavoce-画面レイアウト仕様_1.md §5.3: 発見カード（今週の発見） 用データ ----
  // priority = |効果量（正規化）| × 確度係数 × 行動可能性。既存の各分析結果から候補を集め、
  // 上位1〜3件だけを「今週の発見」として分析タブの先頭に出す。既存のカード群自体は変更しない。
  const topDiscoveries = useMemo(() => {
    const candidates = [];
    // 統合実行ルートv4 §6-4: 「今日の一言」は、根拠となる指標がロック中でないかを
    // 指標ごとに確認すること。ACWRで起きたことが、他の指標でも起きうるため。
    if (topLagFinding && gateAllows("lag.narrative", { days: recordedDaysTotal, n: topLagFinding.n, rho: topLagFinding.rho, fdrPass: topLagFinding.significant })) {
      candidates.push({
        id: "lag-" + topLagFinding.variableKey,
        icon: "💡",
        text: `あなたの声は、${topLagFinding.variableLabel}の「${topLagFinding.lag}日後」にいちばん関係が出ています。`,
        detail: `ρ = ${topLagFinding.rho.toFixed(2)}`,
        priority: Math.min(1, Math.abs(topLagFinding.rho)) * 1.0 * 0.6
      });
    }
    if (effectiveHabitRanking.length > 0 && effectiveHabitRanking[0].stars >= 2
        && gateAllows("habit.narrative", { days: recordedDaysTotal, n1: effectiveHabitRanking[0].n1, n0: effectiveHabitRanking[0].n0, effectSize: effectiveHabitRanking[0].g, fdrPass: effectiveHabitRanking[0].fdrPass })) {
      const top = effectiveHabitRanking[0];
      candidates.push({
        id: "habit-" + top.key,
        icon: "✨",
        text: `${top.label}日は、翌日の声が平均で${top.g >= 0 ? "良く" : "悪く"}記録されています。`,
        detail: `効果量 g=${top.g.toFixed(2)}・${"★".repeat(top.stars)}${"☆".repeat(4 - top.stars)}`,
        priority: Math.min(1, Math.abs(top.g) / 1.5) * (top.stars / 4) * 0.9
      });
    }
    if (roleLoadStats.confident.length > 0) {
      const divergent = [...roleLoadStats.confident].sort((a, b) => Math.abs(b.rankGap) - Math.abs(a.rankGap))[0];
      // 役ごとの負荷には、まだ効果量も多重比較の補正も無い（順位の差だけ）。
      // §6-1 に従い、3条件が揃わないものは文章にしない。効果量が入るまでは出ないのが正しい。
      if (divergent && Math.abs(divergent.rankGap) >= 2
          && gateAllows("role.narrative", { n1: divergent.count, n0: divergent.count })) {
        candidates.push({
          id: "role-" + divergent.name,
          icon: divergent.rankGap > 0 ? "⚠️" : "✨",
          text: divergent.rankGap > 0
            ? `「${divergent.name}」は計算上そこまで重くありませんが、翌日の落ち込みは大きめです。`
            : `「${divergent.name}」は計算上重い役ですが、翌日の落ち込みは平均的です。`,
          detail: `${divergent.count}回の記録`,
          priority: Math.min(1, Math.abs(divergent.rankGap) / 5) * Math.min(1, divergent.count / 8) * 0.4
        });
      }
    }
    if (acwrToday && acwrToday.zone && (acwrToday.zone.key === "caution" || acwrToday.zone.key === "high")) {
      candidates.push({
        id: "acwr-today",
        icon: "⚠️",
        text: `今日の発声負荷比は${acwrToday.value}。${acwrToday.zone.label}な状態です。`,
        detail: acwrToday.restProjection != null ? `明日を休養にすると${acwrToday.restProjection}に戻ります` : "",
        priority: Math.min(1, Math.abs(acwrToday.value - 1.1) / 1.0) * 1.0 * 0.8
      });
    }
    if (refluxDinnerTagEffectsWithFdr.length > 0) {
      const top = [...refluxDinnerTagEffectsWithFdr].sort((a, b) => Math.abs(b.g) - Math.abs(a.g))[0];
      if (top && top.stars >= 2
          && gateAllows("reflux.narrative", { n1: top.n1, n0: top.n0, effectSize: top.g, fdrPass: top.fdrPass })) {
        candidates.push({
          id: "reflux-" + top.tag,
          icon: "💡",
          text: `前夜の${top.tag}は、翌朝の喉の違和感と関係がありそうです。`,
          detail: `効果量 g=${top.g.toFixed(2)}・${"★".repeat(top.stars)}${"☆".repeat(4 - top.stars)}`,
          priority: Math.min(1, Math.abs(top.g) / 1.5) * (top.stars / 4) * 0.7
        });
      }
    }
    // §6-4: EAの警告も「今日の一言」に出るので、同じレイヤーで件数を確認する。
    // 複合サインで判定した場合（method:"composite"）は EA の実測値が足りていないので、
    // 警告としては出さない（パネル側の説明は従来どおり残る）。
    if (energyAvailabilityAnalysis && energyAvailabilityAnalysis.isLow
        && gateAllows("energyAvailability", { n: energyAvailabilityAnalysis.validEaCount })) {
      candidates.push({
        id: "ea-low",
        icon: "⚠️",
        text: "摂取エネルギーが、推定の必要量を下回る状態が続いています。",
        detail: "エネルギー可用性（月次まとめ）",
        priority: 0.7 * 1.0 * 0.5
      });
    }
    return candidates.sort((a, b) => b.priority - a.priority).slice(0, 3);
  }, [topLagFinding, effectiveHabitRanking, roleLoadStats, acwrToday, refluxDinnerTagEffectsWithFdr, energyAvailabilityAnalysis, recordedDaysTotal]);
  // ---- 発見カード 用データ ここまで ----

  // ---- 改善タスクv2 §4-1(a): 分析タブのロック判定を1箇所に集約する ----
  //
  // ★ロックカードが12箇所に散らばり、それぞれの解放条件が JSX の中に直接
  //   書かれていた。最下部にまとめるために条件を書き写すと、条件が2箇所に
  //   分かれて必ずズレる（表示ゲートで起きたのと同じ問題）。
  //   そこで、解放条件はここだけに置き、その場の描画も最下部の一覧も
  //   この結果を参照する。新しい分析を足すときは、この配列に1行足すこと。
  //
  //   visible … その職業のユーザーに、そもそも見せる分析かどうか
  //   unlocked… 解放済みか（★既存の条件をそのまま移してある。変えないこと）
  //   current / required … 「あと◯日」の進捗バーの表示にだけ使う
  const analysisLocks = useMemo(() => {
    const prof = effectiveProfessions || [];
    const defs = [
      { key: "deviation", visible: true,
        unlocked: gateAllows("deviation.card", { days: recordedDaysTotal }),
        title: "コンディション偏差値",
        teaser: "今日が「自分比でどのくらい良い日か」を偏差値で見られます",
        current: recordedDaysTotal, required: getGate("deviation.card").minDays },
      { key: "warmup", visible: true, unlocked: recordedDaysTotal >= 3,
        title: "ウォームアップ効率",
        teaser: "起き抜けとルーティン後の声の差を、半音数で毎朝チェックできます",
        current: recordedDaysTotal, required: 3 },
      { key: "rangeMap", visible: true, unlocked: recordedDaysTotal >= 3,
        title: "音域到達マップ",
        teaser: "記録した声の高さを鍵盤の上で確認できます",
        current: recordedDaysTotal, required: 3 },
      { key: "symptomCalendar", visible: true, unlocked: recordedDaysTotal >= 3,
        title: "症状カレンダーと連鎖",
        teaser: "8種類の症状を、日付×症状の格子で振り返れます",
        current: recordedDaysTotal, required: 3 },
      { key: "acwr", visible: true, unlocked: acwrGate.passed,
        title: "発声負荷バランス（ACWR）",
        teaser: "歌い込みすぎ・積み足りないを1つの数字で管理できます",
        current: recordedDaysTotal, required: getGate("acwr").minDays },
      { key: "envComfort", visible: isAnalysisCardVisible("environment-comfort-zone", prof), unlocked: recordedDaysTotal >= 7,
        title: "環境の快適帯",
        teaser: "自分の喉が快適な気温・湿度のゾーンが分かります",
        current: recordedDaysTotal, required: 7 },
      { key: "peaking", visible: isAnalysisCardVisible("performance-peaking-curve", prof), unlocked: !!peakingCurve,
        title: "本番ピーキング曲線",
        teaser: "本番前後の仕上がり方の、あなた固有の型が分かります",
        current: pastPerformanceDates.length, required: 3 },
      { key: "screamRecovery", visible: isAnalysisCardVisible("shout-recovery-curve", prof),
        unlocked: screamRecoveryCurve.hasEnoughData,
        title: "回復曲線（叫び・悲鳴の収録から）",
        teaser: "叫び・悲鳴のテイク数が多い日から、何日で戻るかが見られます",
        current: screamRecoveryCurve.n, required: 3 },
      { key: "screamThreshold", visible: isAnalysisCardVisible("shout-take-threshold", prof),
        unlocked: screamTakeThreshold.hasEnoughData,
        title: "叫びテイク数の閾値",
        teaser: "あなた自身の「これ以上は翌日に響く」テイク数の目安が見られます",
        current: screamTakeThreshold.n, required: 8 },
      { key: "passaggio", visible: isAnalysisCardVisible("passaggio-stability", prof),
        unlocked: passaggioStability.hasEnoughData,
        title: "パッサッジョの安定度",
        teaser: "声区の切り替えの調子を、自分の平常値と比べて見られます",
        current: passaggioStability.n, required: 14 },
      { key: "sffDiurnal", visible: isAnalysisCardVisible("speaking-pitch-diurnal", prof),
        unlocked: sffDiurnalVariation.hasEnoughData,
        title: "話声位の日内変動",
        teaser: "朝と終業後の声の変化から、あなた自身の疲労のサインが見られます",
        current: sffDiurnalVariation.n, required: 14 },
      { key: "tourEndurance", visible: isAnalysisCardVisible("tour-endurance-curve", prof),
        unlocked: tourEnduranceCurve.hasEnoughData,
        title: "ツアー耐久曲線",
        teaser: "ツアー中、何日目に声が落ちやすいかの「型」が見られます",
        current: tourEnduranceCurve.tourCount, required: 2 }
    ];
    const map = {};
    defs.forEach((d) => { map[d.key] = d; });
    // 最下部の「これから開く分析」に出すもの。解放が近い順に並べる。
    const pending = defs
      .filter((d) => d.visible && !d.unlocked)
      .sort((a, b) => (b.current / b.required) - (a.current / a.required));
    return { map, pending };
  }, [effectiveProfessions, recordedDaysTotal, acwrGate, peakingCurve, pastPerformanceDates,
      screamRecoveryCurve, screamTakeThreshold, passaggioStability, sffDiurnalVariation, tourEnduranceCurve]);
  // ---- ロック判定の集約 ここまで ----

  // ---- lavoce-記録と分析の順番設計.md §5.3: 「この分析を強くする」カード 用データ ----
  // 習慣の内容から、記録画面のどのセクションへジャンプさせるかの対応表。
  const HABIT_KEY_TO_SECTION = {
    sleep7h: "sleep", water2L: "water", alcohol: "meal", fried: "meal",
    caffeine: "meal", carbonated: "meal", highEase: "mental", talkedALot: "practice"
  };
  const analysisBoostCandidates = useMemo(() => {
    const candidates = [];
    // ①「効いた習慣」の確度：3→4つ星は、CI・効果量の条件は既に満たしており、
    //   残る条件はサンプル数（n1・n0とも10以上）だけなので、日数の見積もりが立つ。
    effectiveHabitRanking.forEach((h) => {
      if (h.stars !== 3) return;
      const minN = Math.min(h.n1, h.n0);
      const daysNeeded = Math.max(1, 10 - minN);
      const section = HABIT_KEY_TO_SECTION[h.key];
      if (!section) return;
      candidates.push({
        id: "habit-boost-" + h.key,
        title: `「効いた習慣」の確度 ${"★".repeat(h.stars)}${"☆".repeat(4 - h.stars)}`,
        body: `${h.label.replace(/^前夜の|^前夜、|^前日、/, "")}の記録を あと${daysNeeded}日 続けると ★★★★ になります`,
        daysNeeded,
        // ★ロック中のカードと同じ進捗の点を描くため、件数も持たせる。
        current: minN, required: NARRATIVE_MIN_N_PER_GROUP,
        improvement: IMPROVEMENT.star,
        section,
        // R6: 一度も記録していない項目は、いきなり要求しない（3枚目以降扱い）。
        neverUsed: minN === 0
      });
    });
    // ②ロックされた分析。改善量は 1.0（解放）。
    if (nextUnlock) {
      const daysNeeded = nextUnlock.days - recordedDaysTotal;
      candidates.push({
        id: "unlock-boost-" + nextUnlock.label,
        title: nextUnlock.label,
        // ★R4: 日数と項目の両方を書く。ただし、項目の条件が本当に分かっている
        //   ときだけ書くこと。分からないのに「または◯◯を5日」と書くと、
        //   実際には早まらない条件を約束することになる。
        body: describeUnlockCondition({ daysNeeded }),
        daysNeeded,
        current: recordedDaysTotal, required: nextUnlock.days,
        improvement: IMPROVEMENT.unlock,
        section: null,   // 特定のセクションではなく、記録全般
        locked: true
      });
    }
    // R1・R5・R6 の適用は lib/analysisBoost.js が持つ。
    return selectBoostCandidates(candidates);
  }, [effectiveHabitRanking, nextUnlock, recordedDaysTotal]);
  // ---- 「この分析を強くする」用データ ここまで ----


  // 装備・配置・ドラッグ移動は、その場ではデータベースに保存しない。
  // 「保存中」の表示に気づかれにくかったこと、また保存されたかどうかが分かりにくいという指摘を受けて、
  // 「今日の記録」ページと同じ、明示的な保存ボタン方式に変更した。
  // 画面上の操作はすべてローカルの状態（characterEquipped）だけを更新し、
  // 「未保存の変更あり」フラグを立てる。実際にデータベースへ送るのは、
  // ユーザーが保存ボタンを押した時の一度だけ。これにより、
  // 「いつ保存されたか分からない」問題と、以前あった「保存の順番が入れ替わって
  // 古い状態で上書きされる」問題の両方を、根本からまとめて解消できる。
  const [characterDirty, setCharacterDirty] = useState(false);
  const [characterSaveStatus, setCharacterSaveStatus] = useState("idle"); // idle | saving | saved | error

  async function handleSaveCharacter() {
    setCharacterSaveStatus("saving");
    const supabase = createClient();
    // upsert は「無ければ追加」の権限（RLSのINSERTポリシー）まで必要になり、
    // 通常はUPDATEより厳しく制限されているため、403で拒否されることがあった。
    // profiles行は既に存在するので、updateに戻す。
    const { data, error } = await supabase.from("profiles").update({ character_equipped: characterEquipped }).eq("id", userId).select();
    if (error) {
      console.error("キャラクターの保存に失敗しました:", error);
      setCharacterSaveStatus("error");
      return;
    }
    if (!data || data.length === 0) {
      console.error("キャラクターの保存対象が見つかりませんでした（該当する行が0件）。userId:", userId);
      setCharacterSaveStatus("error");
      return;
    }
    setCharacterDirty(false);
    setCharacterSaveStatus("saved");
    setTimeout(() => setCharacterSaveStatus((s) => (s === "saved" ? "idle" : s)), 2000);
  }

  useEffect(() => {
    function handleBeforeUnload(e) {
      if (characterDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [characterDirty]);

  function countPlacedOfSize(list, size) {
    return (list || []).filter((k) => {
      const other = SHOP_ITEMS.find((i) => i.key === k);
      return other && other.size === size;
    }).length;
  }

  async function handlePurchaseItem(item) {
    const supabase = createClient();
    setOwnedItemKeys((prev) => [...prev, item.key]);
    setCharacterPointsSpent((prev) => prev + item.cost);
    const { error } = await supabase.from("character_inventory").insert({ user_id: userId, item_key: item.key });
    if (error) {
      setOwnedItemKeys((prev) => prev.filter((k) => k !== item.key));
      setCharacterPointsSpent((prev) => prev - item.cost);
      return;
    }
    const newSpent = characterPointsSpent + item.cost;
    const { data: spentData, error: spentError } = await supabase.from("profiles").update({ character_points_spent: newSpent }).eq("id", userId).select();
    if (spentError || !spentData || spentData.length === 0) {
      console.error("ポイント消費の保存に失敗しました:", spentError, "userId:", userId);
    }
    if (SINGLE_SLOT_CATEGORIES.includes(item.category)) {
      handleEquipItem(item.category, item.key);
    } else if (MULTI_SLOT_CATEGORIES.includes(item.category)) {
      // 購入時は自動的に配置状態にする（ただし一度に置ける上限を超える場合は、持ち物には入れつつ配置はしない）
      setCharacterEquipped((prev) => {
        const currentList = prev[item.category] || [];
        const limit = item.size ? PLACEMENT_LIMITS[item.size] : Infinity;
        const withinLimit = !item.size || countPlacedOfSize(currentList, item.size) < limit;
        if (!withinLimit) return prev;
        return { ...prev, [item.category]: [...currentList, item.key] };
      });
      setCharacterDirty(true);
    }
  }

  function handleEquipItem(category, itemKey) {
    setCharacterEquipped((prev) => ({ ...prev, [category]: itemKey }));
    setCharacterDirty(true);
  }

  // 家具・庭アイテム（複数設置可）を「置く」⇔「しまう」で切り替える（sizeごとの上限を超える配置は行わない）
  function handleTogglePlacement(category, itemKey) {
    setCharacterEquipped((prev) => {
      const currentList = prev[category] || [];
      const isPlaced = currentList.includes(itemKey);
      if (!isPlaced) {
        const item = SHOP_ITEMS.find((i) => i.key === itemKey);
        const limit = item && item.size ? PLACEMENT_LIMITS[item.size] : Infinity;
        if (item && item.size && countPlacedOfSize(currentList, item.size) >= limit) return prev;
      }
      const nextList = isPlaced ? currentList.filter((k) => k !== itemKey) : [...currentList, itemKey];
      return { ...prev, [category]: nextList };
    });
    setCharacterDirty(true);
  }

  // ドラッグで決めた配置アイテムの位置（left/top%）をローカルの状態に反映する
  function handleUpdatePosition(category, itemKey, leftPct, topPct) {
    setCharacterEquipped((prev) => {
      const posKey = `${category}Positions`;
      const currentPositions = prev[posKey] || {};
      const existing = currentPositions[itemKey];
      const existingTop = existing && typeof existing === "object" ? existing.top : undefined;
      const entry = {
        left: Math.round(leftPct * 10) / 10,
        top: topPct !== undefined ? Math.round(topPct * 10) / 10 : existingTop
      };
      const nextPositions = { ...currentPositions, [itemKey]: entry };
      return { ...prev, [posKey]: nextPositions };
    });
    setCharacterDirty(true);
  }

  async function handleThemeChange(themeKey) {
    setProfile((p) => ({ ...p, garden_theme: themeKey }));
    const supabase = createClient();
    await supabase.from("profiles").update({ garden_theme: themeKey }).eq("id", userId);
  }

  // ---- 統合実行ルートv4 G3-16 / 改善タスクv2 P0-3: データの書き出し ----
  // ★月経周期・既往症・アレルギー・常用薬も必ず含める。先生には共有しない設定だが、
  //   本人が自分のデータを持ち出す権利は別の話（ルート文書 G3 の注記）。
  const [exportStatus, setExportStatus] = useState("idle"); // idle | working | done | error

  function downloadFile(name, text, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---- 統合実行ルートv4 G3-17 / 改善タスクv2 P0-3: アカウントの削除（3段階） ----
  // ★各ページが「情報提示」として意味を持つこと。無意味なページを挟むだけの
  //   引き止めは、削除権の行使を不当に妨げると見なされうる（v2 P0-3 の注記）。
  //   1: 何が失われるか＋先に書き出す / 2: 共有相手への影響 / 3: 入力して最終確認
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("idle"); // idle | working | error
  const [deleteError, setDeleteError] = useState("");

  const [restoreStatus, setRestoreStatus] = useState("idle"); // idle | working | error

  async function handleRestoreAccount() {
    setRestoreStatus("working");
    const res = await fetch("/api/account/restore", { method: "POST" });
    if (res.ok) {
      setProfile((p) => ({ ...p, deleted_at: null }));
      setRestoreStatus("idle");
    } else {
      setRestoreStatus("error");
    }
  }

  // 確認の入力が一致しているか。ボタンが2つあるので、判定は1箇所に置く。
  const deleteConfirmOk =
    deleteConfirmText.trim() === "削除します" ||
    deleteConfirmText.trim().toLowerCase() === (userEmail || "").toLowerCase();

  async function handleDeleteAccount(mode) {
    setDeleteStatus("working");
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmText, mode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteStatus("error");
        setDeleteError(data.error || "削除できませんでした。");
        return;
      }
      // 削除できたら、セッションを畳んでトップへ戻す。
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (e) {
      console.error("アカウントの削除に失敗しました:", e);
      setDeleteStatus("error");
      setDeleteError("通信に失敗しました。時間をおいてもう一度お試しください。");
    }
  }

  async function handleExportData() {
    setExportStatus("working");
    try {
      const supabase = createClient();
      const tables = {};
      for (const { table, orderBy } of EXPORTED_TABLES) {
        let q = supabase.from(table).select("*").eq("user_id", userId);
        if (orderBy) q = q.order(orderBy, { ascending: true });
        const { data, error } = await q;
        // 1つのテーブルが失敗しても、書き出し全体を諦めない。
        // 取れなかったことは、そのテーブルの中身として残す。
        tables[table] = error ? { error: error.message } : (data || []);
      }
      const { data: prof } = await supabase
        .from("profiles").select(EXPORTED_PROFILE_COLUMNS.join(", ")).eq("id", userId).maybeSingle();

      // 共有設定の履歴（A-3）。自分が「生徒として」共有した分だけを対象にする。
      // 自分が先生として受け取っていた側は、生徒本人の情報なので含めない。
      // 相手を特定できる値は sanitizeShareHistory が落とす。
      const { data: shareRows } = await supabase
        .from("teacher_student_links").select("*").eq("student_id", userId);
      tables.share_history = sanitizeShareHistory(shareRows || []);

      const stamp = new Date().toISOString().slice(0, 10);
      const payload = buildExportPayload({ profile: prof || null, tables, exportedAt: new Date().toISOString() });
      downloadFile(`la-voce-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");

      const csv = entriesToCsv(Array.isArray(tables.entries) ? tables.entries : []);
      if (csv) downloadFile(`la-voce-entries-${stamp}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");

      setExportStatus("done");
      setTimeout(() => setExportStatus((st) => (st === "done" ? "idle" : st)), 4000);
    } catch (e) {
      console.error("データの書き出しに失敗しました:", e);
      setExportStatus("error");   // ★失敗は自動で消さない
    }
  }

  // ★見やすさ。画面を2つ作らず、html の印を切り替えるだけにする（§0-④）。
  //   CSS 変数（--base / --tap / --gap）が、1つの画面を伸び縮みさせる。
  // ★30秒たったら、取り消しの帯は静かに消える。押さなくても何も起きない。
  useEffect(() => {
    if (!undoableSave) return undefined;
    const id = setTimeout(() => setUndoableSave(null), UNDO_WINDOW_MS);
    return () => clearTimeout(id);
  }, [undoableSave]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const mark = scaleAttribute(profile);
    if (mark) document.documentElement.setAttribute("data-scale", mark);
    else document.documentElement.removeAttribute("data-scale");
  }, [profile.display_scale]);

  /** 見やすさの設定を、その場で保存する。★「保存」を押させない。 */
  async function handleSaveDisplayPref(patch) {
    setProfile((p) => ({ ...p, ...patch }));
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) console.error("見やすさの設定を保存できませんでした:", error);
  }

  async function handleSaveProfile() {
    setProfileSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        height_cm: profile.height_cm === "" ? null : Number(profile.height_cm),
        voice_type: profile.voice_type || null,
        nutrition_phase: profile.nutrition_phase || "維持",
        protein_coefficient: profile.protein_coefficient === "" ? null : Number(profile.protein_coefficient),
        age: profile.age === "" ? null : Number(profile.age),
        sex: profile.sex || null,
        vocal_range_low: profile.vocal_range_low || null,
        vocal_range_high: profile.vocal_range_high || null,
        comfort_range_low: profile.comfort_range_low || null,
        comfort_range_high: profile.comfort_range_high || null,
        technical_goal: profile.technical_goal || null,
        health_notes: profile.health_notes || null,
        conditions: profile.conditions || [],
        vocal_profession: profile.vocal_profession || "singer",
        // ★professions も必ず一緒に保存する。職業別の出し分けはこちらを見ている。
        professions: (profile.professions && profile.professions.length > 0)
          ? profile.professions
          : [profile.vocal_profession || "singer"],
        track_cycle: !!profile.track_cycle
      })
      .eq("id", userId);
    // ★アレルギーと常用薬は、上の update に混ぜないこと。
    //   migration_profile_health_fields.sql が未実行の環境では列が無く、
    //   混ぜるとプロフィール全体の保存が丸ごと失敗してしまうため。
    const { error: healthError } = await supabase
      .from("profiles")
      .update({
        allergies: profile.allergies || [],
        regular_medications: profile.regular_medications || []
      })
      .eq("id", userId);
    if (healthError) {
      console.warn("アレルギー・常用薬を保存できませんでした。supabase/migration_profile_health_fields.sql を実行してください。", healthError);
    }
    // ★同じ理由で、周期の表示設定も分けて保存する（§4-3 の3段階の②）。
    //   migration_cycle_periods.sql が未実行の環境では列が無い。
    const { error: cycleSettingError } = await supabase
      .from("profiles")
      .update({ cycle_show_on_home: profile.cycle_show_on_home !== false })
      .eq("id", userId);
    if (cycleSettingError) {
      console.warn("周期の表示設定を保存できませんでした。supabase/migration_cycle_periods.sql を実行してください。", cycleSettingError);
    }
    setProfileSaveStatus(error ? "error" : "saved");
    // ★失敗の表示は自動で消さない。以前は 1.8秒で idle に戻していたため、
    //   保存に失敗しても何も残らず、ユーザーには成功と区別がつかなかった。
    //   成功したときだけ、しばらくして自然に消す。
    if (!error) setTimeout(() => setProfileSaveStatus((st) => (st === "saved" ? "idle" : st)), 2500);
  }

  // lavoce-画面レイアウト仕様_1.md §9: オンボーディング完了時に、同意日時・プロフィールをまとめて保存する。
  // lavoce-記録項目の再設計v2.md §4.1・Stage4-2スコープ調整パッチ §2: プリセット。
  // 【対象】既存ユーザーには一切適用しない（onboarding_completedが既にtrueのため、この関数の
  // 分岐自体を通らない）。全新規ユーザーが対象（パッチ§2.1: 新規ユーザーには壊れる既存状態がなく、
  // 「戻すUI」で解消済みのため、対象を絞る追加の安全効果はない）。
  // 【既定：実行順マスター Stage 0-3の実データに基づき更新】
  // 当初は食事・運動の詳細、体重・体脂肪率、環境、気持ちタグの6項目を畳む案だったが、
  // 実際の入力率（直近7日）を見たところ、環境85.7%・食事詳細71.4%・気持ちタグ57.1%・
  // 運動詳細42.9%と、いずれも実際にはよく使われていることが判明した（体重も71.4%）。
  // 「削るつもりだった項目が実は使われている」という、実行順マスターが警告していた事態そのもの。
  // 実際に使用率0%だった項目（服薬・体脂肪率・CPPS測定）だけを既定で畳む形に縮小した。
  // ※ n=1（開発者本人）・7日分のみのデータであり、他のユーザーが増えたら見直すこと。
  const DEFAULT_PRESET_FOLDED_GROUPS = ["medication", "body_fat", "cpps"];
  function computePresetFoldedGroups(goalFocus, professions) {
    let folded = [...DEFAULT_PRESET_FOLDED_GROUPS];
    if (goalFocus === "train") folded = folded.filter((g) => g !== "body_fat");
    // goalFocus === 'log_only' / 'peak' / 'diagnose' は既定のまま（何も足さない）。
    // 職業に「声楽家」が含まれる場合の曲目欄の扱いは、現状すべての活動ブロックで常に表示されており、
    // 個別に畳む対象になっていないため、ここでの差分は対象外（パッチ§2.4の該当項目はまだ実装なし）。
    return folded;
  }
  async function handleCompleteOnboarding(patch) {
    const finalPatch = { ...patch };
    // patch.goal_focusは新規ユーザーのオンボーディング完了時のみ渡される
    // （既存ユーザーは同意画面だけを通るため、goal_focusを含むpatchはこの関数に来ない）。
    if (patch.goal_focus) {
      finalPatch.folded_groups = computePresetFoldedGroups(patch.goal_focus, patch.professions || []);
    }
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update(finalPatch).eq("id", userId);
    if (error) {
      console.error("オンボーディングの保存に失敗しました:", error);
      return;
    }
    setProfile((p) => ({ ...p, ...finalPatch }));
  }

  // lavoce-記録項目の再設計v2.md §3.7: 稽古ノートの目標を設定・更新する。目標は常に1つだけ。
  async function handleSetPracticeGoal(goal, tags) {
    const supabase = createClient();
    const patch = { practice_goal: goal, practice_goal_tags: tags, practice_goal_started_at: todayISO() };
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) { console.error("目標の保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, ...patch }));
  }
  // 振り返りを1件追加する（週1想定）。過去の振り返りは時系列で読み返せるよう配列で保持する。
  async function handleAddPracticeReview(text) {
    if (!text || !text.trim()) return;
    const newReview = { at: todayISO(), text: text.trim() };
    const updatedReviews = [...(profile.practice_reviews || []), newReview];
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ practice_reviews: updatedReviews }).eq("id", userId);
    if (error) { console.error("振り返りの保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, practice_reviews: updatedReviews }));
  }

  // lavoce-記録項目の再設計v2.md §4.3: 項目を畳む（非表示にする）。「続ける」はローカルの
  // 一時的な非表示のみとし、DBには保存しない（毎月の見直しのたびに、また使われていなければ提案し直す）。
  async function handleFoldGroup(key) {
    const updated = [...(profile.folded_groups || []), key];
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ folded_groups: updated }).eq("id", userId);
    if (error) { console.error("項目の設定保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, folded_groups: updated }));
  }
  // 統合実行ルートv4 G2-8: かんたん記録／しっかり記録の切り替え。
  // ★以前は、保存に失敗したら表示を元に戻していた。その結果
  //   migration_record_mode.sql が未実行の環境では、トグルを押しても一瞬で
  //   戻るだけで機能しなかった。機能そのものが移行の完了に依存してはいけない。
  //   保存できない場合は端末に覚えさせ、切り替えは必ず効くようにする。
  async function handleChangeRecordMode(mode) {
    setProfile((p) => ({ ...p, record_mode: mode }));
    try {
      window.localStorage.setItem("la-voce-record-mode", mode);
    } catch (e) {
      /* localStorageが使えない環境では、その場限りの切り替えになる */
    }
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ record_mode: mode }).eq("id", userId);
    if (error) {
      // 保存できなくても表示は戻さない。列が用意されれば、次から自動的に同期される。
      console.warn("記録モードをサーバーに保存できませんでした（端末には保存済み）。supabase/migration_record_mode.sql を実行してください。", error);
    }
  }
  // 項目グループを出すかどうかは、必ずここを通す（記録項目の再設計v2 §3.3）。
  const showGroup = (key) => isFieldGroupVisible(key, { mode: profile.record_mode, foldedGroups: profile.folded_groups });

  async function handleUnfoldGroup(key) {
    const updated = (profile.folded_groups || []).filter((k) => k !== key);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ folded_groups: updated }).eq("id", userId);
    if (error) { console.error("項目の設定保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, folded_groups: updated }));
  }

  // 実行順マスター Stage 2-2・判断ゲート①: 7日目に一度だけ、3層（朝30秒／週次の発見／本番）
  // のどれに需要があったかを聞くマイクロ調査。判断ゲート①の「4」の判定材料になる。
  async function handleAnswerDay7Survey(answer) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ survey_day7_response: answer }).eq("id", userId);
    if (error) { console.error("調査回答の保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, survey_day7_response: answer }));
    setShowDay7Survey(false);
  }
  async function handleDismissDay7Survey() {
    setShowDay7Survey(false);
    // 「あとで」を選んだ場合は表示済みフラグだけ立てて、次回以降しつこく出さないようにする。
    if (!profile.survey_day7_shown_at) {
      const supabase = createClient();
      const shownAt = new Date().toISOString();
      const { error } = await supabase.from("profiles").update({ survey_day7_shown_at: shownAt }).eq("id", userId);
      if (!error) setProfile((p) => ({ ...p, survey_day7_shown_at: shownAt }));
    }
  }

  // 実行順マスター Stage 2-3: LINE通知。6文字の連携コードを発行し、
  // ユーザーがLINE公式アカウントにそのコードを送ると、Webhook側で紐付けが完了する。
  async function handleChangeDayRecordBoundary(hour) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ day_record_boundary_hour: hour }).eq("id", userId);
    if (error) { console.error("境界時刻の保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, day_record_boundary_hour: hour }));
  }
  // 指導者プラン実装仕様: 先生の生徒一覧に表示するための表示名。空欄でもよい（その場合は職業名で代替表示）。
  async function handleSaveDisplayName(name) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
    if (error) { console.error("表示名の保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, display_name: name }));
  }
  // 指導者プラン実装仕様 §3: 招待コードの発行（先生側）。1コード=1回限り、有効期限7日。
  // 紛らわしい文字（0/O/1/l/I）を除いた文字だけを使う。
  // 作業指示-教室プラン: この先生がまだどの教室のownerでもなければ、solo組織を1つ作る。
  // 既に持っていれば何もしない（何度呼んでも安全）。
  async function ensureOwnOrg() {
    const supabase = createClient();
    const { data: existing } = await supabase.from("memberships").select("org_id").eq("user_id", userId).eq("role", "owner").maybeSingle();
    if (existing) return existing.org_id;
    const { data: org, error: orgError } = await supabase.from("organizations").insert({ name: "マイ教室", kind: "solo", created_by: userId }).select().single();
    if (orgError || !org) {
      console.error("教室の作成に失敗しました:", orgError);
      setInviteError(`教室を作成できませんでした：${(orgError && orgError.message) || "原因不明"}`);
      return null;
    }
    await supabase.from("memberships").insert({ org_id: org.id, user_id: userId, role: "owner" });
    return org.id;
  }
  // ★以前は、失敗しても console.error に出すだけで画面には何も出なかった。
  //   ユーザーからは「押しても反応がない」としか見えず、原因も分からない。
  //   （RLSのINSERTポリシー・列の欠落など、サーバー側の理由で失敗しうる）
  const [inviteError, setInviteError] = useState("");

  async function handleGenerateTeacherInvite() {
    setInviteError("");
    const orgId = await ensureOwnOrg();
    if (!orgId) {
      setInviteError("教室の準備に失敗しました。時間をおいて、もう一度お試しください。");
      return;
    }
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const supabase = createClient();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("teacher_invitations").insert({ code, teacher_id: userId, expires_at: expiresAt });
    if (error) {
      console.error("招待コードの発行に失敗しました:", error);
      setInviteError(`招待コードを発行できませんでした：${error.message || "原因不明"}`);
      return;
    }
    setGeneratedInviteCode(code);
    fetchMyOrgs();
  }
  // §3.1〜3.2: 生徒側が招待コードを入力すると、まず承認画面（公開範囲の選択）を表示する。
  // ここではまだ紐付けを作らない（「つながる」を押すまでは何も確定しない）。
  async function handleLookupInviteCode(codeInput) {
    setInviteLookupError("");
    const code = (codeInput || "").trim().toUpperCase();
    if (!code) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("teacher_invitations").select("code, teacher_id, expires_at, used_at")
      .eq("code", code).maybeSingle();
    if (error || !data) { setInviteLookupError("コードが見つかりませんでした。先生に確認してください。"); return; }
    if (data.used_at || new Date(data.expires_at) < new Date()) { setInviteLookupError("このコードは使用済み、または期限切れです。"); return; }
    // ★誰に渡すのかが分からないまま同意させないこと。
    //   profiles は本人の行しか読めないので、名前だけを返す関数を経由する。
    //   （supabase/migration_invitation_teacher_name.sql）
    let teacher = null;
    const { data: t, error: tErr } = await supabase.rpc("get_invitation_teacher", { p_code: code });
    if (tErr) {
      console.warn("先生の名前を取得できませんでした。supabase/migration_invitation_teacher_name.sql を実行してください。", tErr);
    } else {
      teacher = t || null;
    }
    setPendingInvitation({ ...data, teacher });
  }
  // §4.1: 既定値。mentalとnotesは既定false（変更しないこと）。
  const DEFAULT_SHARE_SCOPE = { voice: true, symptoms: true, sleep: true, activity: true, hydration: false, meal: false, body: false, mental: false, notes: false };
  const [shareScopeDraft, setShareScopeDraft] = useState(DEFAULT_SHARE_SCOPE);
  // §3.2・§4: 「つながる」を押した瞬間に、紐付けを作成しコードを使用済みにする。
  async function handleAcceptInvitation() {
    if (!pendingInvitation) return;
    const supabase = createClient();
    const { error: linkError } = await supabase.from("teacher_student_links").insert({
      teacher_id: pendingInvitation.teacher_id, student_id: userId, status: "active",
      share_scope: shareScopeDraft, accepted_at: new Date().toISOString()
    });
    if (linkError) { setInviteLookupError("連携に失敗しました。もう一度お試しください。"); return; }
    await supabase.from("teacher_invitations").update({ used_at: new Date().toISOString(), used_by_student_id: userId }).eq("code", pendingInvitation.code);
    // 作業指示-教室プラン: この先生がownerである教室があれば、レッスン日程の運営面（在籍・担当）にも
    // 自動的に組み込む。健康データの共有範囲(share_scope)には一切影響しない、別の仕組み。
    const { data: ownerMembership } = await supabase.from("memberships").select("org_id").eq("user_id", pendingInvitation.teacher_id).eq("role", "owner").maybeSingle();
    if (ownerMembership) {
      await supabase.from("enrollments").upsert({ org_id: ownerMembership.org_id, student_id: userId, status: "active" }, { onConflict: "org_id,student_id" });
      await supabase.from("assignments").insert({ org_id: ownerMembership.org_id, teacher_id: pendingInvitation.teacher_id, student_id: userId });
    }
    setPendingInvitation(null);
    setInviteCodeInput("");
    setShareScopeDraft(DEFAULT_SHARE_SCOPE);
    fetchTeacherLinks();
    fetchMyOrgs();
  }
  function handleDeclineInvitation() {
    setPendingInvitation(null);
    setShareScopeDraft(DEFAULT_SHARE_SCOPE);
  }
  // §4.4: 公開範囲は変更した瞬間から反映される（過去のデータも含めて）。
  async function handleUpdateShareScope(linkId, newScope) {
    const supabase = createClient();
    const { error } = await supabase.from("teacher_student_links").update({ share_scope: newScope }).eq("id", linkId);
    if (error) { console.error("公開範囲の更新に失敗しました:", error); return; }
    fetchTeacherLinks();
  }
  // §3.1: 先生・生徒どちらからでも、いつでも解除できる。解除した瞬間から先生は一切見られなくなる
  // （statusを'revoked'にするとRLSの条件を満たさなくなるため、DBレベルで即座に遮断される）。
  async function handleRevokeLink(linkId, asRole) {
    if (!window.confirm("連携を解除しますか？")) return;
    const supabase = createClient();
    const { error } = await supabase.from("teacher_student_links")
      .update({ status: "revoked", revoked_at: new Date().toISOString(), revoked_by: asRole }).eq("id", linkId);
    if (error) { console.error("解除に失敗しました:", error); return; }
    fetchTeacherLinks();
  }
  async function fetchTeacherLinks() {
    const supabase = createClient();
    const { data: asTeacher } = await supabase.from("teacher_student_links").select("*, student:profiles!teacher_student_links_student_profile_fkey(vocal_profession, display_name)").eq("teacher_id", userId).eq("status", "active");
    const { data: asStudent } = await supabase.from("teacher_student_links").select("*").eq("student_id", userId).eq("status", "active");
    setMyStudentLinks(asTeacher || []);
    setMyTeacherLinks(asStudent || []);
  }
  // 指導者プラン実装仕様 §5: 生徒一覧の各カードを開いたときに、その生徒の記録を取得する。
  //
  // ★ここは以前 entries に対して select("*") をしていたが、それは誤りだった。
  //   PostgreSQL の RLS は「行」単位の制御であり、「列」単位ではない。そのため
  //   RLS が行を通した時点で、生徒が共有を許可していない項目（睡眠・心の余裕・
  //   稽古ノート等）まで、先生のブラウザに届いていた。画面に描画していなかっただけで、
  //   ネットワーク応答には含まれていた。
  //
  //   統合実行ルートv4 §11「RLS だけで守らない。サーバー側の canView() と二重にする」
  //   に従い、列の絞り込みはサーバー側の SECURITY DEFINER 関数で行う。
  //   関数の定義: supabase/migration_teacher_student_entries_rpc.sql
  //   列と共有範囲の対応: lib/shareScope.js（SQL と1対1。テストでズレを検出する）
  //
  //   許可されていない列は null になって返ってくる。画面側の canViewHealth() は
  //   「二重にする」ための2枚目として、これまでどおり残してある。
  async function fetchStudentEntries(studentId) {
    if (studentEntriesCache[studentId] || studentEntriesLoading[studentId]) return;
    setStudentEntriesLoading((s) => ({ ...s, [studentId]: true }));
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_student_entries", { p_student_id: studentId, p_limit: 60 });
    if (error) {
      // 取得できないときに entries への直接アクセスへ戻してはいけない（列が絞られなくなるため）。
      console.error("生徒の記録を取得できませんでした。supabase/migration_teacher_student_entries_rpc.sql を実行済みか確認してください。", error);
      setStudentEntriesFetchError((s) => ({ ...s, [studentId]: true }));
    } else if (data) {
      const byDate = {};
      data.forEach((row) => { byDate[row.date] = rowToEntry(row); });
      setStudentEntriesCache((s) => ({ ...s, [studentId]: byDate }));
      setStudentEntriesFetchError((s) => ({ ...s, [studentId]: false }));
    }
    setStudentEntriesLoading((s) => ({ ...s, [studentId]: false }));
  }
  // 指導者プラン実装仕様 §6: 先生専用メモ。teacher_notesはRLSにより先生本人しか読み書きできないため、
  // 生徒には（生徒がこのアプリの他のどの画面を見ても）絶対に見えない。
  async function fetchTeacherNote(linkId) {
    const supabase = createClient();
    const { data } = await supabase.from("teacher_notes").select("body").eq("link_id", linkId).maybeSingle();
    setTeacherNoteDraft(data ? data.body : "");
  }
  async function handleSaveTeacherNote(linkId, body) {
    setTeacherNoteSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.from("teacher_notes").upsert({ link_id: linkId, body, updated_at: new Date().toISOString() }, { onConflict: "link_id" });
    setTeacherNoteSaveStatus(error ? "error" : "saved");
    setTimeout(() => setTeacherNoteSaveStatus("idle"), 1800);
  }

  // 指導者プラン実装仕様 §7: レッスン日程。先生・生徒どちらも見られる（teacher_notesとは違い秘匿しない）。
  async function fetchLessonsForLink(linkId) {
    const supabase = createClient();
    const { data } = await supabase.from("lessons").select("*").eq("link_id", linkId).order("scheduled_at", { ascending: true });
    setStudentLessons(data || []);
  }
  const [myTeachingLessons, setMyTeachingLessons] = useState([]); // 先生として担当する全生徒のレッスンを統合したもの
  // 先生が担当する全生徒のレッスンを、旧1:1連携（teacher_student_links経由）と
  // 新しい教室ベース（assignments経由、org_id/teacher_idが直接入る）の両方からまとめて取得する。
  async function fetchMyTeachingLessons() {
    const supabase = createClient();
    const [{ data: linkLessons }, { data: orgLessonsData }] = await Promise.all([
      supabase.from("lessons").select("*, link:teacher_student_links!inner(teacher_id, student_id)").eq("link.teacher_id", userId).order("scheduled_at", { ascending: true }).limit(200),
      supabase.from("lessons").select("*").eq("teacher_id", userId).order("scheduled_at", { ascending: true }).limit(200)
    ]);
    // 旧1:1連携のレッスンは、生徒のIDがlink.student_idの中に入っているので、扱いやすいよう正規化する。
    const normalizedLinkLessons = (linkLessons || []).map((l) => ({ ...l, student_id: l.student_id || (l.link && l.link.student_id) }));
    const combined = [...normalizedLinkLessons, ...(orgLessonsData || [])];
    const seen = new Set();
    const deduped = combined.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
    deduped.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    setMyTeachingLessons(deduped);
    const studentIds = Array.from(new Set(deduped.map((l) => l.student_id).filter(Boolean)));
    if (studentIds.length > 0) {
      const { data: profilesData } = await supabase.from("profiles").select("id, display_name, vocal_profession").in("id", studentIds);
      if (profilesData) {
        const map = {};
        profilesData.forEach((p) => { map[p.id] = { displayName: p.display_name || "", vocalProfession: p.vocal_profession }; });
        setOrgProfileNames((prev) => ({ ...prev, ...map }));
      }
    }
  }
  async function handleCreateLesson(linkId) {
    if (!newLessonDate) return;
    const supabase = createClient();
    const scheduledAt = new Date(`${newLessonDate}T${newLessonTime}:00`).toISOString();
    const { error } = await supabase.from("lessons").insert({ link_id: linkId, scheduled_at: scheduledAt, note: newLessonNote, created_by: userId });
    if (error) { console.error("レッスン日程の登録に失敗しました:", error); return; }
    setNewLessonDate(""); setNewLessonNote("");
    fetchLessonsForLink(linkId);
  }
  async function handleDeleteLesson(lessonId, linkId) {
    const supabase = createClient();
    await supabase.from("lessons").delete().eq("id", lessonId);
    fetchLessonsForLink(linkId);
  }
  // 生徒として、自分の直近のレッスン予定を取得する（複数の先生分をまとめて）。
  async function fetchMyUpcomingLessons() {
    const supabase = createClient();
    const { data } = await supabase.from("lessons").select("*, link:teacher_student_links!inner(student_id)")
      .eq("link.student_id", userId).order("scheduled_at", { ascending: true }).limit(100);
    setMyUpcomingLessons(data || []);
  }

  // 指導者プラン実装仕様 §8: 記録へのコメント。teacher_notesと違い、生徒にも見える前提のもの。
  async function fetchCommentsForLink(linkId) {
    const supabase = createClient();
    const { data } = await supabase.from("entry_comments").select("*").eq("link_id", linkId).order("entry_date", { ascending: false });
    const byDate = {};
    (data || []).forEach((c) => { (byDate[c.entry_date] = byDate[c.entry_date] || []).push(c); });
    setStudentComments(byDate);
  }
  async function handleCreateComment(linkId, entryDate, body) {
    if (!body || !body.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("entry_comments").insert({ link_id: linkId, entry_date: entryDate, body: body.trim(), created_by: userId });
    if (error) { console.error("コメントの投稿に失敗しました:", error); return; }
    setNewCommentDraft("");
    fetchCommentsForLink(linkId);
  }
  // 生徒として、自分が受け取った直近のコメントを取得する（複数の先生分をまとめて）。
  async function fetchMyRecentComments() {
    const supabase = createClient();
    const { data } = await supabase.from("entry_comments").select("*, link:teacher_student_links!inner(student_id)")
      .eq("link.student_id", userId).order("created_at", { ascending: false }).limit(10);
    setMyRecentComments(data || []);
  }

  // 職業別項目の再設計と学ぶ画面 §7: 学ぶ画面。章の開閉状態は保存し、次に開いたときも前回のままにする。
  async function fetchLearnState() {
    const supabase = createClient();
    const { data: chapters } = await supabase.from("chapter_state").select("*").eq("user_id", userId);
    if (chapters) {
      const map = {};
      chapters.forEach((c) => { map[`${c.profession_key}:${c.chapter}`] = c.is_open; });
      setLearnOpenChapters(map);
    }
    const { data: progress } = await supabase.from("article_progress").select("*").eq("user_id", userId);
    if (progress) {
      const map = {};
      progress.forEach((p) => { if (p.read_at) map[p.article_id] = p.read_at; });
      setLearnReadArticles(map);
      // 間隔をあけて出し直すための箱と、次に出す日。
      // ★列は snake_case、lib/learnStudy.js は camelCase。境目はここ1か所。
      const prog = {};
      progress.forEach((p) => {
        prog[p.article_id] = {
          articleId: p.article_id,
          box: p.box || 0,
          nextDueAt: p.next_due_at || null,
          lastAnsweredAt: p.last_answered_at || null
        };
      });
      setArticleProgress(prog);
    }
  }

  /**
   * 読んだ直後の3問を答え終えたとき。★ここで初めて箱に入る。
   * ★正誤は「次にいつ出すか」を決めるためだけに使う。点数にしない。
   */
  async function handleFinishArticleQuiz(articleId, allCorrect) {
    const todayISO = toISODate(new Date());
    const current = articleProgress[articleId] || { box: 0 };
    const next = afterReviewAnswer(current, allCorrect, todayISO);
    setArticleProgress((prev) => ({ ...prev, [articleId]: { articleId, ...next } }));
    const supabase = createClient();
    // ★first_read_at は「はじめて答えた日」で、あとから上書きしない。
    //   以前は undefined を入れて「送られないはず」に頼っていた。
    //   JSON.stringify は undefined の項目を落とすので実際には動くが、
    //   時刻を守る判断を、確かめていない外の挙動に預けるのはやめる。
    //   ★入れないときは、鍵ごと作らない。
    const row = {
      user_id: userId, article_id: articleId,
      box: next.box, next_due_at: next.nextDueAt, last_answered_at: next.lastAnsweredAt
    };
    if (!current.lastAnsweredAt) row.first_read_at = new Date().toISOString();
    await supabase.from("article_progress").upsert(row, { onConflict: "user_id,article_id" });
  }

  /**
   * 復習を1問答えたとき。★返ってくるのは次の予定だけ。
   * 点数も連続日数も達成率も、計算しないし保存しない（§6-2・§9-5）。
   */
  async function handleAnswerReview(articleId, correct) {
    const todayISO = toISODate(new Date());
    const current = articleProgress[articleId] || { box: 1 };
    const next = afterReviewAnswer(current, correct, todayISO);
    setArticleProgress((prev) => ({ ...prev, [articleId]: { articleId, ...next } }));
    const supabase = createClient();
    await supabase.from("article_progress").upsert({
      user_id: userId, article_id: articleId,
      box: next.box, next_due_at: next.nextDueAt, last_answered_at: next.lastAnsweredAt
    }, { onConflict: "user_id,article_id" });
  }
  async function handleToggleChapter(professionKey, chapter) {
    const key = `${professionKey}:${chapter}`;
    const nextOpen = !learnOpenChapters[key];
    setLearnOpenChapters((prev) => ({ ...prev, [key]: nextOpen }));
    const supabase = createClient();
    await supabase.from("chapter_state").upsert(
      { user_id: userId, profession_key: professionKey, chapter, is_open: nextOpen },
      { onConflict: "user_id,profession_key,chapter" }
    );
  }
  // §7.1: 既読は自動でつける（最後までスクロールしたら）。手動でも外せる。
  async function handleMarkArticleRead(articleId, read) {
    setLearnReadArticles((prev) => {
      const next = { ...prev };
      if (read) next[articleId] = new Date().toISOString(); else delete next[articleId];
      return next;
    });
    const supabase = createClient();
    await supabase.from("article_progress").upsert(
      { user_id: userId, article_id: articleId, read_at: read ? new Date().toISOString() : null },
      { onConflict: "user_id,article_id" }
    );
  }
  // §7.3: 記事メモ。ハイライトメモと記事メモの両方をこの1関数でまとめて扱う。
  async function fetchArticleNotes(articleId) {
    const supabase = createClient();
    const { data } = await supabase.from("article_notes").select("*").eq("user_id", userId).eq("article_id", articleId).is("deleted_at", null).order("created_at", { ascending: true });
    setArticleNotes((prev) => ({ ...prev, [articleId]: data || [] }));
  }
  async function handleCreateArticleNote(articleId, kind, body, anchorText) {
    if (!body || !body.trim()) return;
    const supabase = createClient();
    const { error } = await supabase.from("article_notes").insert({
      user_id: userId, article_id: articleId, kind, anchor_text: anchorText || null, body: body.trim().slice(0, 500), shared_with_teacher: false
    });
    if (error) { console.error("メモの保存に失敗しました:", error); return; }
    setNewArticleNoteDraft("");
    fetchArticleNotes(articleId);
  }
  async function handleDeleteArticleNote(noteId, articleId) {
    const supabase = createClient();
    await supabase.from("article_notes").update({ deleted_at: new Date().toISOString() }).eq("id", noteId);
    fetchArticleNotes(articleId);
  }

  // ---- 作業指示-教室プラン §B・C・E ----
  async function fetchMyOrgs() {
    const supabase = createClient();
    const { data } = await supabase.from("memberships").select("*, org:organizations(*)").eq("user_id", userId);
    setMyOrgs(data || []);
  }
  const [myEnrollments, setMyEnrollments] = useState([]); // 生徒として在籍している教室一覧
  const [myAssignedTeachers, setMyAssignedTeachers] = useState({}); // orgId -> 担当講師のuserId配列
  // 作業指示-教室プラン D-1: つながり画面用。自分が生徒として在籍している教室と、
  // それぞれの教室での担当講師を取得する。
  async function fetchMyEnrollments() {
    const supabase = createClient();
    const { data: enrollments } = await supabase.from("enrollments").select("*, org:organizations(*)").eq("student_id", userId).eq("status", "active");
    setMyEnrollments(enrollments || []);
    if (enrollments && enrollments.length > 0) {
      const { data: assignments } = await supabase.from("assignments").select("*").eq("student_id", userId).is("ended_at", null).in("org_id", enrollments.map((e) => e.org_id));
      const map = {};
      (assignments || []).forEach((a) => { (map[a.org_id] = map[a.org_id] || []).push(a.teacher_id); });
      setMyAssignedTeachers(map);
      const ids = (assignments || []).map((a) => a.teacher_id);
      if (ids.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, display_name, vocal_profession").in("id", ids);
        if (profilesData) {
          const nameMap = {};
          profilesData.forEach((p) => { nameMap[p.id] = { displayName: p.display_name || "", vocalProfession: p.vocal_profession }; });
          setOrgProfileNames((prev) => ({ ...prev, ...nameMap }));
        }
      }
    }
  }
  // D-1: 「つながりを解除する」。教室から抜ける（enrollment.statusを'left'にする）。
  async function handleLeaveOrg(enrollmentId) {
    if (!window.confirm("この教室とのつながりを解除しますか？担当の先生からは、以後レッスン日程が見えなくなります。")) return;
    const supabase = createClient();
    await supabase.from("enrollments").update({ status: "left", left_at: new Date().toISOString() }).eq("id", enrollmentId);
    fetchMyEnrollments();
  }
  const [orgProfileNames, setOrgProfileNames] = useState({}); // userId -> {displayName, vocalProfession}
  async function fetchOrgDetail(orgId) {
    const supabase = createClient();
    const [{ data: members }, { data: enrollments }, { data: assignments }, { data: lessons }] = await Promise.all([
      supabase.from("memberships").select("*").eq("org_id", orgId),
      supabase.from("enrollments").select("*").eq("org_id", orgId).eq("status", "active"),
      supabase.from("assignments").select("*").eq("org_id", orgId).is("ended_at", null),
      supabase.from("lessons").select("*").eq("org_id", orgId).order("scheduled_at", { ascending: true })
    ]);
    setOrgMembers((prev) => ({ ...prev, [orgId]: members || [] }));
    setOrgEnrollments((prev) => ({ ...prev, [orgId]: enrollments || [] }));
    setOrgAssignments((prev) => ({ ...prev, [orgId]: assignments || [] }));
    setOrgLessons((prev) => ({ ...prev, [orgId]: lessons || [] }));
    // 表示名の引き当て：外部キーの埋め込みは使わず、関わる全ユーザーIDをまとめて別クエリで引く
    // （teacher_student_linksで経験したPostgRESTの直接外部キー制約の問題を避けるため）。
    const ids = new Set();
    (members || []).forEach((m) => ids.add(m.user_id));
    (enrollments || []).forEach((e) => ids.add(e.student_id));
    (assignments || []).forEach((a) => { ids.add(a.teacher_id); ids.add(a.student_id); });
    if (ids.size > 0) {
      const { data: profilesData } = await supabase.from("profiles").select("id, display_name, vocal_profession").in("id", Array.from(ids));
      if (profilesData) {
        const map = {};
        profilesData.forEach((p) => { map[p.id] = { displayName: p.display_name || "", vocalProfession: p.vocal_profession }; });
        setOrgProfileNames((prev) => ({ ...prev, ...map }));
      }
    }
  }
  function orgDisplayName(userId) {
    const p = orgProfileNames[userId];
    if (p && p.displayName) return p.displayName;
    return `${userId.slice(0, 8)}…`;
  }
  // C-1: 先生を教室に招待する。招待コードの画面には必ず教室名を表示すること。
  async function handleGenerateOrgInvite(orgId) {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const supabase = createClient();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("org_invitations").insert({ code, org_id: orgId, invited_by: userId, expires_at: expiresAt });
    if (error) { console.error("教室招待コードの発行に失敗しました:", error); return; }
    setGeneratedOrgInviteCode(code);
  }
  async function handleLookupOrgInviteCode(codeInput) {
    setOrgInviteLookupError("");
    const code = (codeInput || "").trim().toUpperCase();
    if (!code) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("org_invitations").select("*, org:organizations(name)").eq("code", code).maybeSingle();
    if (error || !data) { setOrgInviteLookupError("コードが見つかりませんでした。"); return; }
    if (data.used_at || new Date(data.expires_at) < new Date()) { setOrgInviteLookupError("このコードは使用済み、または期限切れです。"); return; }
    setPendingOrgInvitation(data);
  }
  async function handleAcceptOrgInvitation() {
    if (!pendingOrgInvitation) return;
    const supabase = createClient();
    const { error } = await supabase.from("memberships").insert({ org_id: pendingOrgInvitation.org_id, user_id: userId, role: "teacher" });
    if (error) { setOrgInviteLookupError("参加に失敗しました。もう一度お試しください。"); return; }
    await supabase.from("org_invitations").update({ used_at: new Date().toISOString(), used_by: userId }).eq("code", pendingOrgInvitation.code);
    setPendingOrgInvitation(null);
    setOrgInviteCodeInput("");
    fetchMyOrgs();
  }
  // C-2: 役割の変更（最後のownerは降格・削除できない）
  async function handleChangeRole(orgId, membershipId, targetUserId, newRole) {
    const members = orgMembers[orgId] || [];
    const owners = members.filter((m) => m.role === "owner");
    if (owners.length === 1 && owners[0].user_id === targetUserId && newRole !== "owner") {
      alert("最後のownerを降格することはできません。");
      return;
    }
    const supabase = createClient();
    await supabase.from("memberships").update({ role: newRole }).eq("id", membershipId);
    fetchOrgDetail(orgId);
  }
  // C-2: 担当の割り当て・解除。担当が変わったら生徒に通知する（entry_commentsの仕組みは使わず、
  // 今回はシンプルにログのみ。通知UIは今回のスコープ外とする）。
  async function handleAssignTeacherToStudent(orgId, teacherId, studentId) {
    const supabase = createClient();
    const { error } = await supabase.from("assignments").insert({ org_id: orgId, teacher_id: teacherId, student_id: studentId });
    if (error) { console.error("担当の割り当てに失敗しました:", error); return; }
    fetchOrgDetail(orgId);
  }
  async function handleUnassignTeacher(orgId, assignmentId) {
    const supabase = createClient();
    await supabase.from("assignments").update({ ended_at: new Date().toISOString() }).eq("id", assignmentId);
    fetchOrgDetail(orgId);
  }
  // E-1: 教室のレッスンを作成する。teacherNoteは先生専用（生徒に表示しない）。
  async function handleCreateOrgLesson(orgId, teacherId, studentId, dateStr, timeStr, note, teacherNote) {
    if (!dateStr) return;
    const supabase = createClient();
    const scheduledAt = new Date(`${dateStr}T${timeStr}:00`).toISOString();
    const { error } = await supabase.from("lessons").insert({
      org_id: orgId, teacher_id: teacherId, student_id: studentId,
      scheduled_at: scheduledAt, note: note || "", teacher_note: teacherNote || "", created_by: userId
    });
    if (error) { console.error("レッスンの登録に失敗しました:", error); return; }
    fetchOrgDetail(orgId);
  }
  // E-2: 生徒として、教室をまたいで統合した自分の全レッスンを取得する（既存の1:1レッスンと、
  // 新しい教室ベースのレッスンの両方を1つに合わせる）。
  async function fetchMyAllLessons() {
    const supabase = createClient();
    const [{ data: linkLessons }, { data: orgLessonsData }] = await Promise.all([
      supabase.from("lessons").select("*, link:teacher_student_links!inner(student_id, teacher_id)").eq("link.student_id", userId).order("scheduled_at", { ascending: true }).limit(100),
      supabase.from("lessons").select("*").eq("student_id", userId).order("scheduled_at", { ascending: true }).limit(100)
    ]);
    // 旧1:1連携のレッスンは、先生のIDがlink.teacher_idの中に入っているので、
    // カレンダー・一覧の両方で扱いやすいよう、lessonオブジェクト自身にteacher_idとして持たせる。
    const normalizedLinkLessons = (linkLessons || []).map((l) => ({ ...l, teacher_id: l.teacher_id || (l.link && l.link.teacher_id) }));
    const combined = [...normalizedLinkLessons, ...(orgLessonsData || [])];
    const seen = new Set();
    const deduped = combined.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
    deduped.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    setMyAllLessons(deduped);
    setMyUpcomingLessons(deduped); // 既存のレッスンモード表示もこの統合済みリストを使う
    // 先生の表示名をまとめて取得する（既存のorgDisplayName用のキャッシュに統合する）。
    const teacherIds = Array.from(new Set(deduped.map((l) => l.teacher_id).filter(Boolean)));
    if (teacherIds.length > 0) {
      const { data: profilesData } = await supabase.from("profiles").select("id, display_name, vocal_profession").in("id", teacherIds);
      if (profilesData) {
        const map = {};
        profilesData.forEach((p) => { map[p.id] = { displayName: p.display_name || "", vocalProfession: p.vocal_profession }; });
        setOrgProfileNames((prev) => ({ ...prev, ...map }));
      }
    }
  }
  // ---- 作業指示-教室プラン ここまで ----

  const [lineCheckStatus, setLineCheckStatus] = useState("idle"); // idle | checking | notyet

  // LINE側で連携が終わっても、アプリは自分からは気づけない。押されたときに取り直す。
  async function handleRefreshLineStatus() {
    setLineCheckStatus("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles").select("line_user_id, line_linked_at, line_link_code, line_notification_enabled")
      .eq("id", userId).maybeSingle();
    if (data && data.line_user_id) {
      setProfile((p) => ({ ...p, ...data }));
      setLineCheckStatus("idle");
    } else {
      setLineCheckStatus("notyet");
    }
  }

  async function handleGenerateLineLinkCode() {
    const code = Array.from({ length: 6 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ line_link_code: code }).eq("id", userId);
    if (error) { console.error("連携コードの発行に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, line_link_code: code }));
  }
  async function handleToggleLineNotification(enabled) {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ line_notification_enabled: enabled }).eq("id", userId);
    if (error) { console.error("通知設定の保存に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, line_notification_enabled: enabled }));
  }
  async function handleUnlinkLine() {
    if (!window.confirm("LINE連携を解除しますか？通知が届かなくなります。")) return;
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ line_user_id: null, line_linked_at: null }).eq("id", userId);
    if (error) { console.error("連携解除に失敗しました:", error); return; }
    setProfile((p) => ({ ...p, line_user_id: null, line_linked_at: null }));
  }

  // lavoce-収集データ拡張案.md B節: 質問票（EASE / VFI / SVHI-10 / RSI）の回答を保存する
  async function handleSubmitQuestionnaire(type) {
    const def = QUESTIONNAIRES[type];
    if (!def) return;
    if (def.items.some((_, i) => questionnaireAnswers[i] == null)) {
      setQuestionnaireError("すべての項目に回答してください。");
      return;
    }
    const itemScores = def.items.map((_, i) => Number(questionnaireAnswers[i]) || 0);
    const { total, factorScores } = computeQuestionnaireScore(type, itemScores);
    setQuestionnaireSaving(true);
    setQuestionnaireError("");
    const supabase = createClient();
    const todayDate = todayISO();
    const { data, error } = await supabase
      .from("questionnaire_responses")
      .insert({
        user_id: userId,
        questionnaire_type: type,
        response_date: todayDate,
        item_scores: itemScores,
        total_score: total,
        factor_scores: factorScores
      })
      .select()
      .single();
    setQuestionnaireSaving(false);
    if (error) {
      console.error("質問票の保存に失敗しました:", error);
      setQuestionnaireError("保存に失敗しました。もう一度お試しください。");
      return;
    }
    setQuestionnaireResponses((prev) => [...prev, data]);
    setActiveQuestionnaire(null);
    setQuestionnaireAnswers({});
    setToastMessage("記録しました。");
    setTimeout(() => setToastMessage(null), 3200);
  }

  // lavoce-レパートリー負荷パッチ.md §3: 曲目・役に「最高音」（主質問）を1回だけ紐づける。
  // テッシトゥーラ（任意）や3択フォールバックも受け付け、confidenceとして記録する。
  async function handleSaveRepertoire(repertoireName, { topNote, tessituraNote, dOverride } = {}) {
    if (!repertoireName) return;
    if (!topNote && !tessituraNote && dOverride == null) return;
    setTessituraSaving(true);
    const confidence = tessituraNote ? "entered" : topNote ? "estimated" : "coarse";
    const supabase = createClient();
    const { error } = await supabase
      .from("repertoire_tessitura")
      .upsert({
        user_id: userId,
        repertoire_name: repertoireName,
        top_note: topNote || null,
        tessitura_note: tessituraNote || null,
        d_override: dOverride != null ? dOverride : null,
        confidence
      }, { onConflict: "user_id,repertoire_name" });
    setTessituraSaving(false);
    if (error) {
      console.error("レパートリーの登録に失敗しました:", error);
      return;
    }
    setRepertoireTessituraMap((prev) => ({
      ...prev,
      [repertoireName]: { topNote: topNote || null, tessituraNote: tessituraNote || null, dOverride: dOverride != null ? dOverride : null, confidence, usageCount: (prev[repertoireName] && prev[repertoireName].usageCount) || 0 }
    }));
    setTopNoteInput("");
    setTessituraOptionalInput("");
    setDOverrideChoice(null);
    setShowTessituraAccordion(false);
    setDuplicateWarning(null);
  }

  // 職業別項目の再設計と学ぶ画面 §5: 役マスタ・案件マスタ（レパートリーと全く同じ仕組み）。
  async function handleSaveRole(roleName, { workTitle, pitchLowNote, pitchHighNote, voiceQuality } = {}) {
    if (!roleName) return;
    const supabase = createClient();
    const { error } = await supabase.from("role_master").upsert({
      user_id: userId, role_name: roleName, work_title: workTitle || "",
      pitch_low_note: pitchLowNote || null, pitch_high_note: pitchHighNote || null, voice_quality: voiceQuality || null
    }, { onConflict: "user_id,role_name" });
    if (error) { console.error("役マスタの登録に失敗しました:", error); return; }
    setRoleMasterMap((prev) => ({ ...prev, [roleName]: { workTitle: workTitle || "", pitchLowNote: pitchLowNote || null, pitchHighNote: pitchHighNote || null, voiceQuality: voiceQuality || null } }));
  }
  async function handleSaveProject(projectName, { scriptType, speechSpeed, isLive } = {}) {
    if (!projectName) return;
    const supabase = createClient();
    const { error } = await supabase.from("project_master").upsert({
      user_id: userId, project_name: projectName, script_type: scriptType || null, speech_speed: speechSpeed || null, is_live: !!isLive
    }, { onConflict: "user_id,project_name" });
    if (error) { console.error("案件マスタの登録に失敗しました:", error); return; }
    setProjectMasterMap((prev) => ({ ...prev, [projectName]: { scriptType: scriptType || null, speechSpeed: speechSpeed || null, isLive: !!isLive } }));
  }
  // 職業別項目の再設計と学ぶ画面 §3.1: 歌唱言語をレパートリーに登録する（曲ごとに1回だけ）。
  async function handleSaveSingingLanguage(repertoireName, language) {
    if (!repertoireName) return;
    const supabase = createClient();
    const existing = repertoireTessituraMap[repertoireName] || {};
    const { error } = await supabase.from("repertoire_tessitura").upsert({
      user_id: userId, repertoire_name: repertoireName, singing_language: language,
      top_note: existing.topNote || null, tessitura_note: existing.tessituraNote || null,
      d_override: existing.dOverride != null ? existing.dOverride : null, confidence: existing.confidence || "coarse"
    }, { onConflict: "user_id,repertoire_name" });
    if (error) { console.error("歌唱言語の登録に失敗しました:", error); return; }
    setRepertoireTessituraMap((prev) => ({ ...prev, [repertoireName]: { ...(prev[repertoireName] || {}), singingLanguage: language } }));
  }

  // lavoce-レパートリー負荷パッチ.md §2.5: 表記ゆれした曲目を2つ選んで統合する。
  // 過去のすべての記録（activities[].items[]内のrepertoireName）を書き換え、
  // 統合される側のrepertoire_tessituraは削除する。
  function findAffectedDatesForRepertoire(name) {
    return Object.keys(entries).filter((d) =>
      (entries[d].activities || []).some((a) => (a.items || []).some((it) => it.repertoireName === name))
    );
  }
  async function handleMergeRepertoire(sourceName, targetName) {
    if (!sourceName || !targetName || sourceName === targetName) return;
    setMergeInProgress(true);
    setMergeResult("");
    const affectedDates = findAffectedDatesForRepertoire(sourceName);
    const supabase = createClient();
    const updatedEntries = {};
    try {
      for (const date of affectedDates) {
        const entry = entries[date];
        const renamedActivities = (entry.activities || []).map((a) => ({
          ...a,
          items: (a.items || []).map((it) => (it.repertoireName === sourceName ? { ...it, repertoireName: targetName } : it))
        }));
        const updatedEntry = { ...entry, activities: renamedActivities };
        const { error } = await supabase.from("entries").upsert(entryToRow(userId, updatedEntry), { onConflict: "user_id,date" });
        if (error) throw error;
        updatedEntries[date] = updatedEntry;
      }
      const { error: deleteError } = await supabase.from("repertoire_tessitura").delete().eq("user_id", userId).eq("repertoire_name", sourceName);
      if (deleteError) throw deleteError;
      setEntries((prev) => ({ ...prev, ...updatedEntries }));
      setRepertoireTessituraMap((prev) => {
        const next = { ...prev };
        delete next[sourceName];
        return next;
      });
      setMergeResult(`「${sourceName}」を「${targetName}」に統合しました（${affectedDates.length}件の記録を書き換えました）。`);
      setMergeSourceRepertoire("");
      setMergeTargetRepertoire("");
      setMergeConfirming(false);
    } catch (err) {
      console.error("レパートリーの統合に失敗しました:", err);
      setMergeResult("統合に失敗しました。もう一度お試しください。");
    }
    setMergeInProgress(false);
  }

  // lavoce-曲目複数化パッチ.md §2.0/§2.1: 活動ブロック・曲目アイテムの操作関数
  // lavoce-画面レイアウト仕様_1.md §4.7: 前日をコピーする。
  // 変わりにくい項目（食事・身体データ・環境など）だけをコピーし、
  // 声の記録・症状・メンタルはその日固有の情報のためコピーしない。
  function handleCopyPreviousDay() {
    const prevDate = addDays(selectedDate, -1);
    const prevEntry = entries[prevDate];
    if (!prevEntry) return;
    setFormData((f) => ({
      ...f,
      dinnerTime: prevEntry.dinnerTime || f.dinnerTime,
      dinnerTags: prevEntry.dinnerTags && prevEntry.dinnerTags.length > 0 ? prevEntry.dinnerTags : f.dinnerTags,
      proteinLevel: prevEntry.proteinLevel ?? f.proteinLevel,
      calorieLevel: prevEntry.calorieLevel ?? f.calorieLevel,
      weightKg: prevEntry.weightKg ?? f.weightKg,
      bodyFatPct: prevEntry.bodyFatPct ?? f.bodyFatPct,
      temperature: prevEntry.temperature ?? f.temperature,
      humidity: prevEntry.humidity ?? f.humidity,
      weather: prevEntry.weather || f.weather,
      location: prevEntry.location || f.location,
      medicationTags: prevEntry.medicationTags && prevEntry.medicationTags.length > 0 ? prevEntry.medicationTags : f.medicationTags
    }));
    setShowCopiedNotice(true);
    setTimeout(() => setShowCopiedNotice(false), 5000);
  }
  // ---- 発声セッションの計測（G2-10.5 軽量版） ----
  // ★マイクは使いません。中量版（音圧サンプリング）は v4 §10 で凍結中です。
  function handleStartSession(kind) {
    setSessionConfirm(null);
    setRunningSession({ kind: kind || "自主練習", startedAtMs: Date.now() });
  }
  // 計測した分を、活動ブロックとして足す。
  // ★手で直せること（既存の「分」の欄がそのまま使えます）。押し忘れは必ず起きる。
  function commitSession(kind, minutes) {
    setFormData((f) => {
      const activities = f.activities || [];
      if (activities.length >= 10) return f;
      const block = newActivityBlock(kind, activities.length);
      return { ...f, recovery: null, activities: [...activities, { ...block, minutes, source: "timer" }] };
    });
    setRunningSession(null);
    setSessionConfirm(null);
  }
  function handleStopSession() {
    if (!runningSession) return;
    const minutes = elapsedMinutes(runningSession.startedAtMs, Date.now());
    const review = reviewSession(minutes);
    if (review.action === "discard") { setRunningSession(null); return; }
    // ★長すぎるものを黙って保存しない。いつ終わったか分からないものを、
    //   分かっているように保存しない（周期記録の「終わった」の押し忘れと同じ考え方）。
    if (review.action === "confirm") { setSessionConfirm({ kind: runningSession.kind, minutes }); return; }
    commitSession(runningSession.kind, review.minutes);
  }
  function addActivity() {
    setFormData((f) => {
      const activities = f.activities || [];
      if (activities.length >= 10) return f;
      return { ...f, recovery: null, activities: [...activities, newActivityBlock("自主練習", activities.length)] };
    });
  }
  // lavoce-記録項目の再設計v2.md §3.1: 声の記録は1日に何件でも追加できる。
  function addVoiceEntry(context) {
    setFormData((f) => {
      const entries = f.voiceEntries || [];
      if (entries.length >= 12) return f;
      const newEntry = newVoiceEntry(f.date, context || (entries.length === 0 ? "wake" : "other"));
      setEditingVoiceEntryId(newEntry.id);
      return { ...f, voiceEntries: [...entries, newEntry] };
    });
  }
  function updateVoiceEntry(id, patch) {
    setFormData((f) => ({ ...f, voiceEntries: (f.voiceEntries || []).map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  }
  function removeVoiceEntry(id) {
    setFormData((f) => ({ ...f, voiceEntries: (f.voiceEntries || []).filter((v) => v.id !== id) }));
    setEditingVoiceEntryId((cur) => (cur === id ? null : cur));
  }
  function removeActivityBlock(id) {
    setFormData((f) => ({ ...f, activities: (f.activities || []).filter((a) => a.id !== id) }));
  }
  function updateActivityBlock(id, patch) {
    setFormData((f) => ({ ...f, activities: (f.activities || []).map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }
  function updateActivityBlockDetail(id, patch) {
    setFormData((f) => ({
      ...f,
      activities: (f.activities || []).map((a) => (a.id === id ? { ...a, detail: { ...(a.detail || {}), ...patch } } : a))
    }));
  }
  function addRepertoireItemToActivity(activityId) {
    setFormData((f) => ({
      ...f,
      activities: (f.activities || []).map((a) => {
        if (a.id !== activityId) return a;
        if ((a.items || []).length >= 50) return a;
        return { ...a, items: [...(a.items || []), newActivityItem((a.items || []).length)] };
      })
    }));
  }
  function updateRepertoireItemInActivity(activityId, index, patch) {
    setFormData((f) => ({
      ...f,
      activities: (f.activities || []).map((a) => {
        if (a.id !== activityId) return a;
        const items = [...(a.items || [])];
        items[index] = { ...items[index], ...patch };
        return { ...a, items };
      })
    }));
  }
  function removeRepertoireItemFromActivity(activityId, index) {
    setFormData((f) => ({
      ...f,
      activities: (f.activities || []).map((a) => {
        if (a.id !== activityId) return a;
        return { ...a, items: (a.items || []).filter((_, i) => i !== index).map((it, i) => ({ ...it, order: i })) };
      })
    }));
  }
  function moveRepertoireItemInActivity(activityId, index, direction) {
    setFormData((f) => ({
      ...f,
      activities: (f.activities || []).map((a) => {
        if (a.id !== activityId) return a;
        const items = [...(a.items || [])];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return a;
        [items[index], items[newIndex]] = [items[newIndex], items[index]];
        return { ...a, items: items.map((it, i) => ({ ...it, order: i })) };
      })
    }));
  }
  function updateRecovery(patch) {
    setFormData((f) => ({ ...f, recovery: { ...(f.recovery || { methods: [], note: "" }), ...patch } }));
  }

  function addMeal(slot) {
    setFormData((f) => ({ ...f, meals: [...(f.meals || []), newMealItem(slot)] }));
  }
  function quickAddFood(slot, presetName) {
    const preset = FOOD_PRESETS.find((p) => p.name === presetName);
    if (!preset) return;
    const hasUnit = !!preset.unit;
    const qtyMode = hasUnit ? "unit" : "g";
    const qtyInput = hasUnit ? 1 : 100;
    const grams = hasUnit ? preset.unitWeight : 100;
    const factor = grams / 100;
    const item = {
      ...newMealItem(slot),
      name: preset.name, isPreset: true, presetI18n: preset.i18n || null,
      presetBase: { carbs: preset.carbs, protein: preset.protein, fat: preset.fat, fiber: preset.fiber },
      presetUnit: preset.unit || null,
      presetUnitWeight: preset.unitWeight || null,
      qtyMode, qtyInput, grams,
      carbs: roundTo1(preset.carbs * factor), protein: roundTo1(preset.protein * factor),
      fat: roundTo1(preset.fat * factor), fiber: roundTo1(preset.fiber * factor)
    };
    setFormData((f) => ({ ...f, meals: [...(f.meals || []), item] }));
  }
  function updateMeal(id, next) {
    setFormData((f) => ({ ...f, meals: (f.meals || []).map((m) => (m.id === id ? next : m)) }));
  }
  function removeMeal(id) {
    setFormData((f) => ({ ...f, meals: (f.meals || []).filter((m) => m.id !== id) }));
  }
  function addExercise() {
    setFormData((f) => ({ ...f, exercises: [...(f.exercises || []), newExerciseItem()] }));
  }
  function updateExercise(id, next) {
    setFormData((f) => ({ ...f, exercises: (f.exercises || []).map((x) => (x.id === id ? next : x)) }));
  }
  function removeExercise(id) {
    setFormData((f) => ({ ...f, exercises: (f.exercises || []).filter((x) => x.id !== id) }));
  }

  async function handleSave() {
    if (!formData) return;
    const saveStartedAt = Date.now();
    setSaveStatus("saving");
    setSaveError("");
    // ★保存する前の姿を控えておく。取り消しはこれを書き戻すだけ。
    //   「無かった」と「あった」を取り違えないよう、null をそのまま持つ。
    const previousEntry = entries[formData.date] ? { ...entries[formData.date] } : null;
    const clean = { ...formData };
    if (!entryHasActivityKind(clean, "本番")) clean.performanceQuality = null;
    clean.simpleMealMacros = simpleMealMacros;
    const supabase = createClient();
    const { error } = await supabase
      .from("entries")
      .upsert(entryToRow(userId, clean), { onConflict: "user_id,date" });
    if (error) {
      setSaveStatus("error");
      // ★画面には「次に何をすればいいか」だけを出す（見やすさ §4-2）。
      //   「不明なエラー」や Supabase の技術的な文面は、読んでも動けない。
      //   ★中身は console に残す。今日の400の切り分けは、これで進んだ。
      console.error("記録を保存できませんでした:", error);
      setSaveError(t(ACTIONABLE_ERROR_KEY));
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    // 記録と分析の順番設計 §3.5: 保存直後のカードに必要な数値を、保存の前後で計算する。
    const balanceBefore = computeBalance(entries, characterPointsSpent);
    const mergedEntries = { ...entries, [clean.date]: clean };
    const balanceAfter = computeBalance(mergedEntries, characterPointsSpent);
    let streakAfter = 0;
    {
      let d = clean.date;
      while (mergedEntries[d]) { streakAfter += 1; d = addDays(d, -1); }
    }
    const discovery = computeTodaysDiscovery(mergedEntries, clean.date);
    // 保存カードの「N項目」も、かんたん記録では分母を合わせる（v4 §11）
    const filledCount = countFilledSections(clean, profile.record_mode);
    const filledFieldNames = filledSectionNames(clean, profile.record_mode);

    setEntries((prev) => ({ ...prev, [clean.date]: clean }));
    setUndoableSave({ date: clean.date, previous: previousEntry, at: Date.now() });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1800);
    setSaveCardData({
      pointsBefore: balanceBefore,
      pointsAfter: balanceAfter,
      streak: streakAfter,
      totalDays: Object.keys(mergedEntries).length,
      discovery
    });

    // 計測（計測とユーザー調査仕様.md §3）。★lib/events.js を必ず経由すること。
    //   以前はここで直接 insert しており、列名も仕様と違っていました
    //   （event_type / payload → name / props）。何より、健康の値を
    //   入れてしまう歯止めがどこにもありませんでした。
    trackEvent(supabase, userId, "record_saved", {
      // ★項目名の配列であって、項目の値ではない（§3.3）。
      fieldsFilled: filledFieldNames,
      durationMs: Date.now() - saveStartedAt,
      mode: filledCount <= 3 ? "quick" : "full"
    });
  }

  /**
   * 保存を取り消す。★保存前の姿を書き戻すだけ。
   * ★保存前に記録が無かった日は、行ごと消す。
   *   空の記録を残すと、「記録した日」として数えられてしまう。
   */
  async function handleUndoSave() {
    if (!undoableSave) return;
    const { date, previous } = undoableSave;
    const supabase = createClient();
    if (previous) {
      const { error } = await supabase.from("entries").upsert(entryToRow(userId, previous), { onConflict: "user_id,date" });
      if (error) { console.error("取り消せませんでした:", error); return; }
      setEntries((prev) => ({ ...prev, [date]: previous }));
      setFormData({ ...previous });
    } else {
      const { error } = await supabase.from("entries").delete().eq("user_id", userId).eq("date", date);
      if (error) { console.error("取り消せませんでした:", error); return; }
      setEntries((prev) => { const next = { ...prev }; delete next[date]; return next; });
    }
    setUndoableSave(null);
    setSaveCardData(null);
  }

  async function handleDelete(date) {
    const supabase = createClient();
    await supabase.from("entries").delete().eq("user_id", userId).eq("date", date);
    setEntries((prev) => { const next = { ...prev }; delete next[date]; return next; });
    setConfirmDeleteDate(null);
  }

  async function handleGenerateAdvice() {
    setAdviceLoading(true);
    setAdviceError("");
    try {
      const res = await fetch("/api/advice", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setAdviceError(data.error || t("errorAdviceGeneration"));
      } else {
        setAdviceText(data.advice);
        setAdviceGeneratedAt(new Date());
      }
    } catch (e) {
      setAdviceError(t("errorAdviceGeneration"));
    }
    setAdviceLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // lavoce-画面レイアウト仕様_1.md §9: 同意・オンボーディングが未完了なら、本編より先にこちらを表示する。
  // profile.onboarding_completedがnullの間（読み込み中）は判定を保留し、誤って一瞬表示されるのを防ぐ。
  // 作業指示-公開前の実装.md A-4「30日間は復元できる（誤操作の救済）」。
  // 削除を申し出た状態でログインしたら、まずここで復元するか尋ねる。
  // ★共有（先生とのつながり）は申請の時点で切れており、復元しても戻らない。
  //   相手の同意なしにつながりを復活させないため。その旨を明示する。
  if (!loading && profile.deleted_at) {
    const left = graceDaysLeft(profile.deleted_at);
    return (
      <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }} className="flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
          <h2 className="ff-display italic text-xl mb-3">{t("restoreTitle")}</h2>
          <p className="text-sm mb-2">{t("restoreLead").replace("{days}", Math.max(0, left))}</p>
          <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("restoreConnectionsNote")}</p>
          <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
            {t("restoreIfNothing").replace("{days}", GRACE_PERIOD_DAYS)}
          </p>
          {restoreStatus === "error" && (
            <p className="text-xs mb-3 rounded-lg p-2.5" style={{ background: "rgba(184,49,49,0.12)", color: C.curtain }}>
              {t("restoreError")}
            </p>
          )}
          <button type="button" onClick={handleRestoreAccount} disabled={restoreStatus === "working"}
            className="w-full py-3 rounded-full text-sm font-medium mb-2"
            style={{ background: C.curtain, color: "#FFFDF8", opacity: restoreStatus === "working" ? 0.7 : 1 }}>
            {restoreStatus === "working" ? t("restoreWorking") : t("restoreButton")}
          </button>
          <button type="button" onClick={handleSignOut}
            className="w-full py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
            {t("restoreKeepDeleting")}
          </button>
        </div>
      </div>
    );
  }

  if (!loading && profile.onboarding_completed === false) {
    const existingUser = Object.keys(entries).length > 0;
    return <OnboardingFlow existingUser={existingUser} onComplete={handleCompleteOnboarding} t={t} />;
  }

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh" }}>
      {toastMessage && (
        <div className="fixed left-1/2 z-50 tab-panel" style={{ bottom: 24, transform: "translateX(-50%)" }}>
          <div
            className="rounded-full px-5 py-3 ff-display italic text-sm"
            style={{ background: C.curtain, color: "#FFFDF8", boxShadow: "0 8px 24px rgba(36,25,20,0.25)" }}
          >
            {toastMessage}
          </div>
        </div>
      )}
      {saveCardData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(36,25,20,0.35)" }}
          onClick={() => setSaveCardData(null)}>
          <div className="w-full sm:max-w-sm rounded-3xl p-6 text-center" style={{ background: C.paper }} onClick={(e) => e.stopPropagation()}>
            <style>{`
              @keyframes saveCardPointsPop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
              .save-card-points { animation: saveCardPointsPop 0.5s ease-out; }
              @media (prefers-reduced-motion: reduce) { .save-card-points { animation: none; } }
            `}</style>
            <p className="ff-display italic text-xl mb-3" style={{ color: C.curtain }}>✓ {t("labelRecordedCheck")}</p>
            <p className="ff-mono save-card-points" style={{ fontSize: "1.75rem", color: C.ink }}>
              +{saveCardData.pointsAfter - saveCardData.pointsBefore}pt <span style={{ fontSize: "1.0rem", color: C.inkSoft }}>→ {saveCardData.pointsAfter}pt</span>
            </p>
            {saveCardData.streak > 1 && (
              <p className="text-sm mt-2" style={{ color: C.inkSoft }}>{saveCardData.streak}日つづいています</p>
            )}
            {saveCardData.discovery && (
              <div className="rounded-xl p-3 mt-4" style={{ background: C.card }}>
                <p className="text-xs mb-1" style={{ color: C.inkSoft }}>今日わかったこと</p>
                <p className="text-sm">{saveCardData.discovery}</p>
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => { setSaveCardData(null); setActiveTab("garden"); }}
                className="flex-1 py-2.5 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                おうちで羊を見る
              </button>
              <button type="button" onClick={() => setSaveCardData(null)}
                className="flex-1 py-2.5 rounded-full text-sm font-medium border" style={{ borderColor: C.line, color: C.inkSoft }}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      <header
        className="px-4 sm:px-6 pb-4 sticky top-0 z-10"
        style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        {/* ★携帯では、横に並べるのをやめて上下に分けます。
            右側（言語＋アイコン4つ）だけで 240〜290px あり、375px の画面では
            左に残る幅がほとんどありません。横並びのままだと、どう調整しても
            ロゴと副題が数十pxを奪い合うことになります。
            ★min-w-0 を外します。あれは「min-content より縮んでよい」という指定で、
              まさにロゴが「La / Voce」に割れ、副題が1文字ずつ縦に崩れた原因でした。
              私が入れた指定です。幅を与えるつもりで、床を外していました。
            広い画面（sm以上）では、これまでどおり横に並べます。 */}
        <div className="max-w-3xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div>
            {/* ★ヘッダーは、見やすさの設定につながっていませんでした（G2-14.5 の抜け）。
                text-3xl は rem なので html 基点になった今は伸びますが、
                それだと「とても大きい」で見出しだけが画面を占めてしまいます。
                clamp で、伸びるが伸びすぎない形にします。
                ★副題は行の高さを明示します。ff-mono と text-xs が組み合わさると、
                  大きくなった文字が小さい行の箱に入り、上の見出しと重なっていました。
                  ここが「左上が読みにくい」の正体です。 */}
            <h1 className="ff-display italic app-wordmark whitespace-nowrap" style={{ color: C.curtain }}>La Voce</h1>
            <p className="ff-mono app-tagline tracking-widest uppercase" style={{ color: C.inkSoft }}>{t("appTagline")}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto sm:mt-1">
            <div className="relative flex items-center">
              <Globe size={13} style={{ color: C.inkSoft, position: "absolute", left: 8, pointerEvents: "none" }} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label={t("languageLabel")}
                className="rounded-full border text-xs pl-7 pr-2 py-1.5 appearance-none"
                style={{ borderColor: C.line, color: C.inkSoft, background: C.card, maxWidth: "7.5em" }}
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            {/* G2-14: レッスンモードは解体が決まっている機能（レッスンモードの解体.md）。
                解体するまでの間、一般ユーザーの視界には出さない。 */}
            {canSeeBetaFeatures(profile) && (
              <button onClick={() => setLessonMode(true)} title="レッスンモード" className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line, color: C.inkSoft }}>
                <GraduationCap size={14} />
              </button>
            )}
            <a href="/feedback" title={t("navFeedback")} className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line, color: C.inkSoft }}>
              <MessageCircle size={14} />
            </a>
            <a href="/billing" title={t("navPlan")} className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line, color: C.inkSoft }}>
              <CreditCard size={14} />
            </a>
            <button onClick={handleSignOut} title={t("navSignOut")} className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line, color: C.inkSoft }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
        {!lessonMode && (() => {
          // レッスン項目は、出現するときは「おうち」の直前に入れる。
          // ★「先生とつながる」で見つかったのと同じ鶏と卵が、先生側にもあった。
          //   「生徒を招待する」は students タブの中にあるのに、そのタブ自体が
          //   「つながっている生徒が1人以上いる」ときしか出ない。生徒が0人の
          //   管理者は、招待コードを発行する場所そのものに到達できなかった。
          //   管理者・指導者ベータの人だけは、生徒0人でもタブを出す。
          //   一般ユーザーの条件は変えない（つながって初めて出る、のまま）。
          // 統合実行ルートv4 G2-14: 指導者・教室機能は、10人に配る段階では
          // 一般ユーザーに出さない。判定は lib/featureFlags.js に集約する。
          // ★既につながっている人からは取り上げない（解除する手段まで消えるため）。
          // ★「レッスン」は必ず1つ。教える側と習う側は、この中で切り替える。
          //   判定は上の canTeachLessons / canLearnLessons に集約してある。
          const displayTabs = [];
          TABS.forEach((tab) => {
            if (tab.key === "garden" && hasLessonTab) {
              displayTabs.push({ key: "lesson", labelKey: null, label: t("tabLesson"), icon: GraduationCap });
            }
            displayTabs.push(tab);
          });
          // ★横スクロールする帯。両端に、まだ続くことが分かる薄い影を出す（.nav-scroll）。
          //   右端の見切れだけでなく、左端も同じように隠れる。
          //   指標が無いと「切れている」だけに見えて、動かせると気づけない。
          //   ★スクロールの棒は出さない（携帯では場所を取り、しばらくすると消えるため）。
          return (
            <nav className="max-w-3xl mx-auto flex gap-1 mt-5 overflow-x-auto nav-scroll">
              {displayTabs.map((tab) => (
                tab.href ? (
                  <a
                    key={tab.key}
                    href={tab.key === "voicetheory" ? (PROFESSION_THEORY_PAGES[profile.vocal_profession] || tab.href) : tab.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all"
                    style={{ background: "transparent", color: C.inkSoft }}
                  >
                    <tab.icon size={15} />
                    {t(tab.labelKey)}
                  </a>
                ) : (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all"
                    style={{ background: activeTab === tab.key ? C.curtain : "transparent", color: activeTab === tab.key ? "#FFFDF8" : C.inkSoft }}
                  >
                    <tab.icon size={15} />
                    {tab.labelKey ? t(tab.labelKey) : tab.label}
                  </button>
                )
              ))}
            </nav>
          );
        })()}
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {/* ★記録が読み込めなかったことを、必ず本人に伝える。
            黙って空の画面を出すと「記録が消えた」に見える。消えていない。 */}
        {entriesLoadError && (
          <div className="rounded-2xl p-4 border mb-4" style={{ background: "#FFF4F0", borderColor: C.curtain }}>
            <p className="text-sm font-medium" style={{ color: C.ink }}>記録を読み込めませんでした</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: C.inkSoft }}>
              記録は消えていません。サーバーからの返事が来なかっただけです。<br />
              しばらく待ってから、画面を読み込み直してください。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{ background: C.curtain, color: "#FFFDF8" }}
            >
              読み込み直す
            </button>
            <p className="text-[10px] mt-2" style={{ color: C.inkSoft }}>{entriesLoadError}</p>
          </div>
        )}
        {lessonMode ? (
          <div className="space-y-5">
            <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={18} style={{ color: C.curtain }} />
                <h2 className="ff-display italic text-xl">{t("lessonModeTitle")}</h2>
              </div>
              <p className="text-xs" style={{ color: C.inkSoft }}>
                {t("lessonModeDesc")}
              </p>
              <p className="text-xs mt-2 rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                {t("lessonModeHidden")}
              </p>
              {(() => {
                const nextLesson = myUpcomingLessons.find((l) => new Date(l.scheduled_at) >= new Date());
                return nextLesson && (
                  <p className="text-xs mt-2 rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                    {t("nextLessonLabel")}：{new Date(nextLesson.scheduled_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {nextLesson.note ? `　${nextLesson.note}` : ""}
                  </p>
                );
              })()}
              {myRecentComments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {myRecentComments.slice(0, 3).map((c) => (
                    <p key={c.id} className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                      💬 {c.entry_date.slice(5)}の記録に：{c.body}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {myUpcomingLessons.length > 0 && (
              <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                <h3 className="ff-display italic text-lg mb-1">{t("lessonCalendarTitle")}</h3>
                <LessonCalendar lessons={myUpcomingLessons} selectable={false} getTeacherName={orgDisplayName} t={t} />
              </div>
            )}

            {lessonOverlaps.overlapPairs.filter(([a]) => new Date(a.scheduled_at) >= new Date()).length > 0 && (
              <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                <h3 className="ff-display italic text-lg mb-2">{t("lessonOverlapWarningTitle")}</h3>
                <div className="space-y-2">
                  {lessonOverlaps.overlapPairs.filter(([a]) => new Date(a.scheduled_at) >= new Date()).map(([a, b], i) => (
                    <p key={i} className="text-sm">
                      {new Date(a.scheduled_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}が2件重なっています
                      {a.note && `　・${a.note}`}{b.note && `　・${b.note}`}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {lessonOverlaps.busyDates.filter((d) => d >= todayISO()).length > 0 && (
              <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                {lessonOverlaps.busyDates.filter((d) => d >= todayISO())[0]}は、レッスンが4件を超えて入っています。
              </p>
            )}

            <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
              <h3 className="ff-display italic text-lg mb-1">直近4週の推移</h3>
              <p className="text-xs mb-3" style={{ color: C.inkSoft }}>記録{lessonModeData.recordedCount}/28日</p>
              <div style={{ width: "100%", height: 130 }}>
                <ResponsiveContainer>
                  <LineChart data={lessonModeData.scoreTrend} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid stroke={C.line} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: C.inkSoft }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                    <Line type="monotone" dataKey="score" stroke={C.gold} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
              <h3 className="ff-display italic text-lg mb-1">症状カレンダー</h3>
              <div className="space-y-1 mt-2" style={{ overflowX: "auto" }}>
                {SYMPTOM_OPTIONS.map((symptom) => (
                  <div key={symptom} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="text-xs" style={{ minWidth: "6em", flexShrink: 0, color: C.inkSoft }}>{t(SYMPTOM_KEYS[symptom])}</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {lessonModeData.symptomWeeks.map((d) => {
                        const has = d.symptoms && d.symptoms.includes(symptom);
                        return <div key={d.date} title={d.date} style={{ width: 10, height: 10, borderRadius: 2, background: has ? C.curtain : C.paper, flexShrink: 0 }} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
              <h3 className="ff-display italic text-lg mb-1">発声負荷（ACWR）</h3>
              <div style={{ width: "100%", height: 110 }}>
                <ResponsiveContainer>
                  <LineChart data={lessonModeData.loadTrend} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                    <CartesianGrid stroke={C.line} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                    <YAxis domain={[0, "auto"]} tick={{ fontSize: 9, fill: C.inkSoft }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                    <Line type="monotone" dataKey="acwr" stroke={C.ink} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {lessonModeData.rangeInWindow && (
              <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                <h3 className="ff-display italic text-lg mb-1">音域マップ</h3>
                <PianoKeyboard
                  lowMidi={lessonModeData.rangeInWindow.low - 1}
                  highMidi={lessonModeData.rangeInWindow.high + 1}
                  bestLow={null}
                  bestHigh={null}
                  currentLow={lessonModeData.rangeInWindow.low}
                  currentHigh={lessonModeData.rangeInWindow.high}
                  newRecord={false}
                />
                <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                  {midiToNoteLabel(lessonModeData.rangeInWindow.low)} 〜 {midiToNoteLabel(lessonModeData.rangeInWindow.high)}（直近4週）
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLessonMode(false)}
              className="w-full py-3 rounded-full text-sm font-medium"
              style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}
            >
              {t("lessonModeExitButton")}
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: C.curtain }} />
            <span className="text-sm" style={{ color: C.inkSoft }}>{t("loadingText")}</span>
          </div>
        ) : (
          <div key={activeTab} className="tab-panel">
            {activeTab === "home" && (() => {
              const realToday = realTodayDate;
              const hour = greetingHour;
              const greeting = hour < 5 ? "こんばんは" : hour < 11 ? "おはようございます" : hour < 18 ? "こんにちは" : "こんばんは";
              const todayEntry = entries[realToday];
              const isRecordedToday = !!todayEntry;
              return (
                <div className="space-y-4">
                  {/* ★かんたん表示のホーム（見やすさ §3-1）。
                      大きなボタンを1つだけ、真ん中に置く。二番目に大事なものを2つまで。
                      ★減らすのは選択肢であって、機能ではない。
                        推移・お知らせ・予定は、下にそのまま残してある（消していない）。 */}
                  {isSimpleDisplay(profile) && (
                    <div className="pt-2">
                      <button type="button"
                        onClick={() => { setActiveTab("today"); setRecordView("day"); }}
                        className="w-full rounded-2xl"
                        style={{
                          background: C.curtain, color: "#FFFDF8",
                          padding: "var(--gap) calc(var(--gap) * 1.5)",
                          minHeight: "calc(var(--tap) * 1.6)",
                          fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.5
                        }}>
                        {isRecordedToday ? "今日の記録を見なおす" : "今日を記録する"}
                      </button>
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <button type="button" onClick={() => setActiveTab("analysis")}
                          className="rounded-2xl border"
                          style={{
                            background: C.card, borderColor: C.line, color: C.ink,
                            minHeight: "var(--tap)", fontSize: "1rem", padding: "var(--gap)"
                          }}>
                          見る
                        </button>
                        <button type="button" onClick={() => setActiveTab("learn")}
                          className="rounded-2xl border"
                          style={{
                            background: C.card, borderColor: C.line, color: C.ink,
                            minHeight: "var(--tap)", fontSize: "1rem", padding: "var(--gap)"
                          }}>
                          学ぶ
                        </button>
                      </div>
                    </div>
                  )}
                  {/* ★ホーム画面に追加できないことが、この層でいちばん脱落する場所（§6）。
                      細い帯ではなく、手順を1枚にして出す。文字は大きく。
                      ★「あとで」を必ず置く。ブラウザのままでも全部使える、と書く。
                        追加しないと使えない、と読ませないため。
                      ★こちらから何度も勧めない。閉じたら、その後は出さない。 */}
                  {shouldShowInstallGuide({
                    installed: isPwaInstalled,
                    dismissed: !showInstallBanner,
                    platform: isIosSafari ? "ios" : (pwaInstallPrompt ? "android" : "other")
                  }) && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="mb-1" style={{ color: C.ink, fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.6 }}>
                        ホーム画面に、羊のマークを置けます
                      </p>
                      <p className="text-sm mb-3" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                        置いておくと、次からは1回押すだけで開けます。
                      </p>
                      <ol className="space-y-2 mb-3">
                        {(isIosSafari ? INSTALL_STEPS.ios : INSTALL_STEPS.android).map((stepText, i) => (
                          <li key={i} className="flex gap-3" style={{ lineHeight: 1.7 }}>
                            <span className="ff-mono flex-shrink-0" style={{ color: C.inkSoft }}>{i + 1}</span>
                            <span className="text-sm" style={{ color: C.ink }}>{stepText}</span>
                          </li>
                        ))}
                      </ol>
                      {pwaInstallPrompt && (
                        <button type="button" onClick={handleInstallPwa}
                          className="w-full rounded-xl mb-2"
                          style={{
                            background: C.curtain, color: "#FFFDF8",
                            minHeight: "var(--tap)", padding: "var(--gap)", fontSize: "1rem", fontWeight: 600
                          }}>
                          いま追加する
                        </button>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs" style={{ color: C.inkSoft, lineHeight: 1.7 }}>{INSTALL_LATER_NOTE}</p>
                        <button type="button" onClick={() => setShowInstallBanner(false)}
                          className="px-4 py-2 rounded-full text-sm flex-shrink-0"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>
                          {INSTALL_LATER_LABEL}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* ★iOS 用の細い帯は、上の1枚にまとめた。
                      同じことを2か所で案内すると、片方だけ古くなる。 */}
                  {showDay7Survey && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                      <p className="text-sm font-medium mb-1">7日間、お疲れさまでした</p>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>ここまで使ってみて、いちばん価値を感じたのはどれですか？(1つだけ選んでください)</p>
                      <div className="space-y-2">
                        {[
                          { key: "morning30", label: "朝30秒の記録" },
                          { key: "weekly_discovery", label: "週の振り返り・分析の発見" },
                          { key: "performance_prep", label: "本番に向けた準備" },
                          { key: "not_yet", label: "まだよく分からない" }
                        ].map((opt) => (
                          <button key={opt.key} type="button" onClick={() => handleAnswerDay7Survey(opt.key)}
                            className="w-full text-left py-2.5 px-3 rounded-xl text-sm border"
                            style={{ borderColor: C.line, color: C.ink, background: C.paper }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={handleDismissDay7Survey}
                        className="w-full text-center text-xs underline mt-3" style={{ color: C.inkSoft }}>
                        あとで答える
                      </button>
                    </div>
                  )}
                  <div>
                    <p className="text-sm" style={{ color: C.inkSoft }}>{greeting}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                      {realToday.slice(5).replace("-", "/")}
                      {recordStreak > 0 && <> ・ {recordStreak}日連続 🔥</>}
                    </p>
                  </div>

                  {/* ★周期の1行（周期記録の設計.md §4-1）。
                      §4-2「目立たせない」を必ず守ること:
                        ・色を付けない（日付の行と同じ C.inkSoft）
                        ・絵文字・アイコンを付けない
                        ・カードの背景色を変えない（枠も背景も持たせない）
                        ・フォントサイズを大きくしない（text-xs のまま）
                      電車の中で、隣の人に見えます。 */}
                  {cycleEnabled && cycleShowOnHome && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs" style={{ color: C.inkSoft }}>
                        {cycleState.state === "bleeding"
                          ? `生理 ${cycleState.dayIndex}日目`
                          : cycleState.state === "cycle"
                            ? `周期 ${cycleState.dayIndex}日目`
                            : "周期の記録"}
                      </p>
                      {/* ★押せると分かる形にすること。以前は下線付きの文字だけで、
                          文章の一部にしか見えず、指で狙える大きさもなかった。
                          §4-2 が禁じているのは「目立たせること」（色・アイコン・
                          大きい文字・太字・カード）であって、押せると分かることは
                          禁じていない。線は他の入力欄と同じ C.line の細い枠だけ。
                          ★何を記録するのかを、ボタンの文字だけで分かるようにする。
                          「始まった」だけでは、何が始まったのか読み取れない。 */}
                      {cycleState.state === "bleeding" ? (
                        <button type="button" disabled={cycleBusy}
                          onClick={() => handleEndCycle(cycleState.periodId, cycleState.startDate, realToday)}
                          className="text-xs px-3 py-1.5 rounded-full shrink-0"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, opacity: cycleBusy ? 0.5 : 1 }}>
                          生理が終わった
                        </button>
                      ) : (
                        <button type="button" disabled={cycleBusy}
                          onClick={() => handleStartCycle(realToday)}
                          className="text-xs px-3 py-1.5 rounded-full shrink-0"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}`, opacity: cycleBusy ? 0.5 : 1 }}>
                          生理が始まった
                        </button>
                      )}
                    </div>
                  )}
                  {cycleEnabled && cycleShowOnHome && cycleError && (
                    <p className="text-xs" style={{ color: C.curtain }}>{cycleError}</p>
                  )}
                  {/* ★押したことが伝わるようにする。上の行はごく小さな文字なので、
                      記録できても変化に気づけず「押せていない」と感じてしまう。 */}
                  {cycleEnabled && cycleShowOnHome && cycleJustSaved && (
                    <p className="text-xs" style={{ color: C.inkSoft }}>{cycleJustSaved}</p>
                  )}

                  <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{isRecordedToday ? "今日の記録" : "今日の声"}</p>
                    {isRecordedToday ? (
                      <>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="ff-display italic" style={{ fontSize: "2.6rem", lineHeight: 1, color: levelInk(todayEntry.throatCondition) }}>
                            {typeof todayEntry.throatCondition === "number" ? todayEntry.throatCondition.toFixed(1) : "-"}
                          </span>
                          <span className="text-sm mb-1" style={{ color: C.inkSoft }}>/ 5</span>
                        </div>
                        <p className="text-sm" style={{ color: C.ink }}>今日はもう記録済みです。お疲れさまでした。</p>
                      </>
                    ) : todayForecast.hasData ? (
                      <>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="ff-display italic" style={{ fontSize: "2.6rem", lineHeight: 1, color: levelInk(todayForecast.yhat) }}>
                            {todayForecast.yhat.toFixed(1)}
                          </span>
                          <span className="text-sm mb-1" style={{ color: C.inkSoft }}>/ 5（予報）</span>
                        </div>
                        {todayForecast.topFactor && (
                          <p className="text-sm mb-2" style={{ color: C.ink }}>
                            {todayForecast.topFactor.label}が{todayForecast.topFactor.contribution >= 0 ? "良い方向に" : "厳しい方向に"}いちばん効いています。
                          </p>
                        )}
                        {forecastHitRate ? (
                          <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                            <p className="text-xs" style={{ color: C.inkSoft }}>
                              的中率 {forecastHitRate.rate}%（直近{forecastHitRate.n}日）
                            </p>
                            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("forecastHitDefinition")}</p>
                            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("forecastPurposeNote")}</p>
                          </div>
                        ) : forecastHitRateGate.message ? (
                          <p className="text-xs pt-2 border-t" style={{ borderColor: C.line, color: C.inkSoft }}>{forecastHitRateGate.message}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: C.inkSoft }}>記録が増えると、ここに今日の声の予報が表示されます。</p>
                    )}
                  </div>

                  {todaySuggestion && !isRecordedToday && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="text-xs mb-1" style={{ color: C.inkSoft }}>今日やるといいこと</p>
                      <p className="text-sm font-medium">{todaySuggestion}</p>
                    </div>
                  )}

                  {!isRecordedToday && (
                    <>
                      {!showQuickRecord ? (
                        <>
                          <button type="button"
                            onClick={() => { setSelectedDate(realToday); setShowQuickRecord(true); }}
                            className="w-full py-4 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                            30秒で記録する
                          </button>
                          <button type="button" onClick={() => { setSelectedDate(realToday); setActiveTab("today"); }}
                            className="w-full text-center text-xs underline" style={{ color: C.inkSoft }}>
                            しっかり記録する
                          </button>
                        </>
                      ) : (
                        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                          <p className="text-sm font-medium mb-3">30秒で記録</p>
                          <DotSelector label={t("labelThroatCondition")} icon={Mic2} value={(formData.voiceEntries || [])[0]?.bodyFeel ?? 3} lowLabel="pp" highLabel="ff"
                            onChange={(v) => setFormData((f) => {
                              const entries = f.voiceEntries && f.voiceEntries.length > 0 ? f.voiceEntries : [newVoiceEntry(f.date, "wake")];
                              const updated = [{ ...entries[0], bodyFeel: v }, ...entries.slice(1)];
                              return { ...f, voiceEntries: updated };
                            })} />
                          <div className="mt-3">
                            <DotSelector label={t("labelVoiceQuality")} icon={Sparkles} value={quality10ToFiveScale((formData.voiceEntries || [])[0]?.quality ?? 5) || 3} lowLabel="pp" highLabel="ff"
                              onChange={(v) => setFormData((f) => {
                                const entries = f.voiceEntries && f.voiceEntries.length > 0 ? f.voiceEntries : [newVoiceEntry(f.date, "wake")];
                                const updated = [{ ...entries[0], quality: fiveScaleToQuality10(v) }, ...entries.slice(1)];
                                return { ...f, voiceEntries: updated };
                              })} />
                          </div>
                          <div className="mt-3">
                            <NumberField label="昨夜の睡眠" value={formData.sleepHours ?? ""} step={0.5} min={0} max={14} suffix={t("unitHours")}
                              onChange={(v) => setFormData((f) => ({ ...f, sleepHours: v }))} />
                          </div>
                          <button type="button"
                            onClick={async () => { await handleSave(); setShowQuickRecord(false); }}
                            className="w-full mt-4 py-3 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                            記録する
                          </button>
                          <button type="button" onClick={() => { setActiveTab("today"); }}
                            className="w-full mt-2 text-center text-xs underline" style={{ color: C.inkSoft }}>
                            もっと記録する →
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {nextUnlock && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="text-xs mb-2" style={{ color: C.ink }}>あと{nextUnlock.days - recordedDaysTotal}日で「{nextUnlock.label}」が開きます</p>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.paper }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (recordedDaysTotal / nextUnlock.days) * 100)}%`, background: C.gold }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {activeTab === "today" && (
              <div className="space-y-5">
                {/* ★かんたん表示の「1画面に1つ」（見やすさ §3-3）。
                    ★下のふつうの記録欄は消していない。ここで答えても、
                      下の欄に反映される。同じ項目に書いているため。
                    ★「とばす」を必ず置く。答えられない項目で止まると、
                      その日の記録が丸ごと消える。
                    ★とばした数を数えない。「未入力」「不足」「完了度」を
                      出さないため（統合実行ルート v4 §11）。 */}
                {isSimpleDisplay(profile) && formData && !isFinished(simpleStepIndex) && (() => {
                  const step = SIMPLE_STEPS[simpleStepIndex];
                  const left = remainingSteps(simpleStepIndex);
                  return (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="text-xs text-right mb-2" style={{ color: C.inkSoft }}>あと {left}つ</p>
                      <p className="mb-4" style={{ color: C.ink, fontSize: "1.15rem", lineHeight: 1.6 }}>
                        {step.question}
                      </p>
                      <div className="space-y-2">
                        {step.choices.map((choice) => {
                          const active = formData[step.key] === choice.value;
                          return (
                            <button key={choice.label} type="button"
                              onClick={() => {
                                setFormData((f) => applyStep(f, step.key, choice.value));
                                setSimpleStepIndex((i) => nextIndex(i));
                              }}
                              className="w-full rounded-xl border"
                              style={{
                                background: active ? C.paper : C.card,
                                borderColor: active ? C.ink : C.line,
                                color: C.ink,
                                minHeight: "var(--tap)",
                                padding: "var(--gap)",
                                fontSize: "1.05rem",
                                fontWeight: active ? 600 : 400
                              }}>
                              {active ? "✓ " : ""}{choice.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <button type="button" disabled={simpleStepIndex === 0}
                          onClick={() => setSimpleStepIndex((i) => prevIndex(i))}
                          className="px-4 py-2 rounded-full text-sm"
                          style={{
                            color: simpleStepIndex === 0 ? C.line : C.inkSoft,
                            border: `1px solid ${simpleStepIndex === 0 ? C.line : C.line}`
                          }}>
                          {SIMPLE_BACK_LABEL}
                        </button>
                        <button type="button"
                          onClick={() => {
                            setFormData((f) => skipStep(f));
                            setSimpleStepIndex((i) => nextIndex(i));
                          }}
                          className="px-4 py-2 rounded-full text-sm"
                          style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>
                          {SIMPLE_SKIP_LABEL}
                        </button>
                      </div>
                    </div>
                  );
                })()}
                {isSimpleDisplay(profile) && isFinished(simpleStepIndex) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.paper, borderColor: C.line }}>
                    <p className="text-sm" style={{ color: C.ink, lineHeight: 1.7 }}>{SIMPLE_DONE_TEXT}</p>
                    <button type="button" onClick={() => setSimpleStepIndex(0)}
                      className="mt-2 px-4 py-2 rounded-full text-sm"
                      style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}>
                      もう一度はじめから
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-2xl p-3 border" style={{ background: C.card, borderColor: C.line }}>
                  <button onClick={() => setSelectedDate((d) => addDays(d, -1))}
                    className="w-9 h-9 rounded-full border flex items-center justify-center" style={{ borderColor: C.line }}>
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center">
                    <div className="font-medium text-sm">{formatDateLabel(selectedDate, language)}</div>
                    <input type="date" value={selectedDate} max={todayISO()} onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-xs ff-mono mt-1 bg-transparent border-none" style={{ color: C.inkSoft }} />
                  </div>
                  <button onClick={() => setSelectedDate((d) => addDays(d, 1))} disabled={selectedDate >= todayISO()}
                    className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30" style={{ borderColor: C.line }}>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {(() => {
                  // 記録と分析の順番設計 §3.4: 進捗の見せ方。「未入力」「不足」「空欄」は使わない。
                  // 満タンを目標に見せず、赤くしない（羊のおうち仕様 §1の「罰を作らない」を記録画面にも適用）。
                  const filled = countFilledSections(formData, profile.record_mode);
                  const total = countedSectionTotal(profile.record_mode);
                  const dots = Array.from({ length: total }, (_, i) => i < filled);
                  // 実際にまだ埋まっていない項目の中から1つだけ選び、それが加わると何につながるかを添える。
                  const pendingBenefits = [
                    { done: (formData.dinnerTime || (formData.dinnerTags || []).length > 0 || typeof formData.proteinLevel === "number"), label: "食事の影響" },
                    { done: ((formData.activities || []).some((a) => (a.items || []).length > 0)), label: "曲目ごとの負荷" },
                    { done: ((formData.symptoms || []).length > 0), label: "症状の推移" }
                  ];
                  const nextBenefit = profile.record_mode === "simple"
                    ? null
                    : (pendingBenefits.find((b) => !b.done) || {}).label;
                  return (
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {dots.map((on, i) => (
                            <span key={i} style={{
                              display: "inline-block", width: 7, height: 7, borderRadius: "50%",
                              background: on ? C.gold : C.line
                            }} />
                          ))}
                        </div>
                        <span className="text-xs" style={{ color: C.inkSoft }}>今日の記録　{filled}項目</span>
                      </div>
                      {nextBenefit && (
                        <span className="text-xs" style={{ color: C.inkSoft }}>もう少しで「{nextBenefit}」が加わります</span>
                      )}
                    </div>
                  );
                })()}

                {/* 統合実行ルートv4 G2-8 / §2 瞬間④: 30秒で終わる道が常にあること。
                    調子が悪い日ほど、項目の多さが「開かない理由」になる。
                    ★かんたん記録は劣った記録ではない。減点表示（未入力・完了度）を出さないこと（§11）。 */}
                <div className="rounded-2xl p-3 border" style={{ background: C.card, borderColor: C.line }}>
                  <div className="flex rounded-full border p-1" style={{ borderColor: C.line }}>
                    {[["simple", "recordModeSimple"], ["full", "recordModeFull"]].map(([mode, labelKey]) => (
                      <button key={mode} type="button" onClick={() => handleChangeRecordMode(mode)}
                        className="flex-1 py-1.5 rounded-full text-xs font-medium transition-all"
                        style={{
                          background: profile.record_mode === mode ? C.curtain : "transparent",
                          color: profile.record_mode === mode ? "#FFFDF8" : C.inkSoft
                        }}>
                        {t(labelKey)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                    {profile.record_mode === "simple" ? t("recordModeSimpleNote") : t("recordModeFullNote")}
                  </p>
                  {profile.record_mode === "simple" && (
                    <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("recordModeSwitchHint")}</p>
                  )}
                </div>

                {!!entries[addDays(selectedDate, -1)] && (
                  <button type="button" onClick={handleCopyPreviousDay}
                    className="w-full rounded-xl border py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{ borderColor: C.line, color: C.inkSoft, background: C.card }}>
                    <NotebookPen size={12} />前日をコピー（食事・身体データ・環境）
                  </button>
                )}
                {showCopiedNotice && (
                  <p className="text-xs text-center rounded-lg p-2" style={{ background: "rgba(212,160,23,0.12)", color: C.ink }}>
                    前日の内容をコピーしました。内容を確認・編集してください。
                  </p>
                )}

                {formData && (
                  <>
                    <div className="flex rounded-full border p-1" style={{ borderColor: C.line }}>
                      <button type="button" onClick={() => setRecordView("voice")}
                        className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                        style={{ background: recordView === "voice" ? C.curtain : "transparent", color: recordView === "voice" ? "#FFFDF8" : C.inkSoft }}>
                        声の記録
                      </button>
                      <button type="button" onClick={() => setRecordView("day")}
                        className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                        style={{ background: recordView === "day" ? C.curtain : "transparent", color: recordView === "day" ? "#FFFDF8" : C.inkSoft }}>
                        一日の記録
                      </button>
                    </div>

                    {recordView === "voice" && (
                      <>
                        <SectionCard title={t("sectionVoiceThroat")} icon={Mic2}>
                          <div className="space-y-2">
                        {(formData.voiceEntries || []).slice().sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)).map((entry) => (
                          editingVoiceEntryId === entry.id ? (
                            <VoiceEntryEditor key={entry.id} entry={entry} professions={effectiveProfessions} t={t}
                              simple={isSimpleDisplay(profile)}
                              onChange={(patch) => updateVoiceEntry(entry.id, patch)}
                              onRemove={() => removeVoiceEntry(entry.id)}
                              onClose={() => setEditingVoiceEntryId(null)} />
                          ) : (
                            <button key={entry.id} type="button" onClick={() => setEditingVoiceEntryId(entry.id)}
                              className="w-full text-left rounded-2xl p-3 border" style={{ background: C.paper, borderColor: C.line }}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium ff-mono">{entry.at}　{(VOICE_CONTEXT_OPTIONS.find((c) => c.key === entry.context) || {}).label}</span>
                                <Sparkles size={14} style={{ color: C.gold }} />
                              </div>
                              <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                                喉{levelDynamic(entry.bodyFeel)}・声{typeof entry.quality === "number" ? entry.quality.toFixed(1) : "-"}
                                {entry.pitchChest && <>・{entry.pitchChest}</>}
                                {(entry.symptoms || []).length > 0 && <>・{entry.symptoms.map((s) => t(SYMPTOM_KEYS[s])).join("/")}</>}
                              </p>
                            </button>
                          )
                        ))}
                      </div>
                      <button type="button" onClick={() => addVoiceEntry()}
                        className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-medium flex items-center justify-center gap-1.5"
                        style={{ borderColor: C.line, color: C.inkSoft }}>
                        {/* ★アイコンの＋と、文字の＋で2つ並んでいた。文字のほうを外す。 */}
                        <Plus size={14} />声の記録を追加
                      </button>
                      {(formData.voiceEntries || []).length === 0 && (
                        <p className="text-xs text-center" style={{ color: C.inkSoft }}>
                          1件記録すれば、それがその日の値になります。何度でも追加でき、3件以上あると時間帯別の推移も見られます。
                        </p>
                      )}
                      {/* 学ぶ統合設計書 4-3 / 改善タスクv2 §4-2:
                          表記のルールと地声の説明は、合わせて200字以上ある長文が、毎日開く
                          記録画面に常時展開されていた。入力ブロックを分断し、記録のテンポを
                          最も損なっていた箇所。★内容は削らず、置き場所だけを変える。
                          初回のみ自動展開し、2回目以降は畳んでおく。
                          ※「学ぶ」統合が入ったら、この中身を C3-3 の記事へのリンクに差し替える。 */}
                      <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}
                        open={noteRuleOpen} onToggle={(e) => setNoteRuleOpen(e.currentTarget.open)}>
                        <summary className="cursor-pointer font-medium flex items-center gap-1.5" style={{ color: C.ink }}>
                          <HelpCircle size={13} style={{ color: C.gold }} />
                          {t("noteRuleSummary")}
                        </summary>
                        <p className="mt-2 leading-relaxed">{t("noteNotationRule")}</p>
                        <p className="mt-2 leading-relaxed">{t("noteChestVoiceRule")}</p>
                      </details>
                      <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                        <summary className="cursor-pointer font-medium flex items-center gap-1.5" style={{ color: C.ink }}>
                          <HelpCircle size={13} style={{ color: C.gold }} />
                          {t("labelRecommendedRoutineToggle")}
                        </summary>
                        <p className="mt-2 leading-relaxed">{t("noteRecommendedRoutine")}</p>
                      </details>

                      {showGroup("cpps") && (
                      <div className="rounded-xl p-3" style={{ background: C.paper }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Mic2 size={14} style={{ color: C.gold }} />
                          <span className="text-sm font-medium">客観測定（CPPS）</span>
                        </div>
                        <details className="text-xs rounded-lg p-2.5 mb-2" style={{ background: C.card, color: C.inkSoft }}>
                          <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>これで何が分かるの？</summary>
                          <div className="mt-2 space-y-1.5 leading-relaxed">
                            <p>声の音を細かく分解すると、「倍音」と呼ばれる整った成分が、雑音にどれだけ埋もれずくっきり出ているかが分かります。CPPSはその「くっきり度合い」を1つの数字にしたものです。</p>
                            <p><strong>数値が高い日</strong>：声帯がきれいに閉じて振動できていて、声にノイズ（息漏れ・かすれ）が少ない状態を示唆します。</p>
                            <p><strong>数値が低い日</strong>：息漏れ・かすれ・声の立ち上がりの弱さなど、声帯の閉じが甘くなっている可能性を示唆します。</p>
                            <p><strong>できないこと</strong>：病名の診断はできません。あくまで「声のノイズっぽさ」を映す一つの物差しです。また、このアプリ独自の簡易計算のため、数値そのものを論文の基準値と比べることはできません。</p>
                            <p><strong>使い方のコツ</strong>：毎日同じような発声（力まず「あー」と伸ばす）で測ることで、自分自身の中での「今日は高い／低い」という変化を追いかけるのに向いています。</p>
                          </div>
                        </details>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={cppsRecording}
                            onClick={async () => {
                              setCppsError("");
                              setCppsRecording(true);
                              try {
                                const value = await recordAndAnalyzeCPPS(5000);
                                setFormData((f) => ({ ...f, cppsValue: value }));
                              } catch (err) {
                                setCppsError(err && err.message ? err.message : "マイクを使用できませんでした。ブラウザの権限設定をご確認ください。");
                              } finally {
                                setCppsRecording(false);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
                            style={{ background: cppsRecording ? C.line : C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}
                          >
                            {cppsRecording ? <Loader2 size={12} className="animate-spin" /> : <Mic2 size={12} />}
                            {cppsRecording ? "録音中（5秒）「あー」と伸ばしてください…" : "5秒録音して測定する"}
                          </button>
                        </div>
                        {formData.cppsValue !== "" && formData.cppsValue != null && (
                          <p className="text-sm mt-2" style={{ color: C.ink }}>
                            CPPS: <span className="ff-mono font-medium">{formData.cppsValue} dB</span>
                          </p>
                        )}
                        {cppsError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{cppsError}</p>}
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          「あー」を5秒のばして録音すると、声のスペクトルの明瞭さ（CPPS）を自動で数値化します。録音データ自体は保存せず、数値化した後にその場で破棄します。
                        </p>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          ※ このアプリ独自の簡易計算のため、数値そのものを医学論文の基準値と比べることはできません。あくまで「自分自身がこれまでよりCPPSが高いか低いか」という、ご自身の推移で見るための参考値です。
                        </p>
                      </div>
                      )}
                          <SectionFeedback text={sectionFeedback.symptoms} />
                    </SectionCard>

                        <button type="button" onClick={handleSave} disabled={saveStatus === "saving"}
                          className="w-full rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all"
                          style={{ background: C.curtain, color: "#FFFDF8" }}>
                          {saveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                          {saveStatus === "saved" && <Check size={16} />}
                          {saveStatus === "saving" ? t("saveButtonSaving") : saveStatus === "saved" ? t("saveButtonSaved") : saveStatus === "error" ? t("saveButtonError") : t("saveButton")}
                        </button>
                        {saveStatus === "error" && saveError && (
                          <p className="text-xs text-center" style={{ color: C.curtain }}>{saveError}</p>
                        )}

                        {/* ★保存のあと30秒、「取り消す」を出しておく（見やすさ §4-2）。
                            ★消える通知にしない。画面の中に残し、自分で閉じる（§4-1）。
                              読み終わる前に消えるのが、いちばん不安を生む。
                            ★30秒は数えて出さない。数字が減っていくのを見せると、
                              急かされているように読める。 */}
                        {undoableSave && (
                          <div className="rounded-2xl p-3 border flex items-center justify-between gap-3"
                            style={{ background: C.paper, borderColor: C.line }}>
                            <p className="text-sm" style={{ color: C.ink }}>{t("undoSaveDone")}</p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button type="button" onClick={handleUndoSave}
                                className="px-4 py-2 rounded-full text-sm font-medium"
                                style={{ background: C.card, color: C.ink, border: `1px solid ${C.ink}` }}>
                                {t("undoSaveLabel")}
                              </button>
                              <button type="button" onClick={() => setUndoableSave(null)}
                                className="w-9 h-9 rounded-full flex items-center justify-center"
                                style={{ color: C.inkSoft, border: `1px solid ${C.line}` }}
                                aria-label={t("cancelLabel")}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 改善タスクv2 §4-2(a): 総合コンディションは「結果」なので、入力の前ではなく
                            保存の後ろへ移した。まだ記録していない日に空の数字を見せない。 */}
                        {entries[selectedDate] && (
                          <div className="rounded-2xl p-5 border flex justify-center" style={{ background: C.card, borderColor: C.line }}>
                            <Gauge score={currentScore} t={t} />
                          </div>
                        )}

                        {/* 改善タスクv2 §4-2: 前日からの背景は参照情報なので、入力の流れに割り込ませず、
                            保存の後ろに畳んで置く（初期状態は閉じる）。 */}
                        {yesterdayContext && (
                          <details className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                            <summary className="cursor-pointer ff-display italic text-lg">{t("titleYesterdayContext")}</summary>
                            <p className="text-xs mt-1 mb-3" style={{ color: C.inkSoft }}>{t("noteYesterdayContext")}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg p-2" style={{ background: C.paper }}>
                                <span style={{ color: C.inkSoft }}>{t("labelSleepHours")}</span>
                                <div className="font-medium ff-mono">{yesterdayContext.sleepHours != null ? `${yesterdayContext.sleepHours}${t("unitHours")}` : "-"}</div>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: C.paper }}>
                                <span style={{ color: C.inkSoft }}>{t("labelDinnerToBedGap")}</span>
                                <div className="font-medium ff-mono">{yesterdayContext.dinnerGap != null ? `${yesterdayContext.dinnerGap}${t("unitHours")}` : "-"}</div>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: C.paper }}>
                                <span style={{ color: C.inkSoft }}>{t("sectionPractice")}</span>
                                <div className="font-medium">{yesterdayContext.activityType ? t((ACTIVITY_OPTIONS.find((a) => a.key === yesterdayContext.activityType) || {}).labelKey) : "-"}</div>
                              </div>
                              <div className="rounded-lg p-2" style={{ background: C.paper }}>
                                <span style={{ color: C.inkSoft }}>{t("labelWeather")}</span>
                                <div className="font-medium">{yesterdayContext.weather ? t(WEATHER_KEYS[yesterdayContext.weather] || "optionOther") : "-"}</div>
                              </div>
                            </div>
                            {yesterdayContext.dinnerTags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {yesterdayContext.dinnerTags.map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.inkSoft }}>{t(DINNER_TAG_KEYS[tag])}</span>
                                ))}
                              </div>
                            )}
                            {yesterdayContext.flags.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {yesterdayContext.flags.map((flagKey) => (
                                  <div key={flagKey} className="text-xs rounded-lg p-2" style={{ background: "rgba(184,49,49,0.08)", color: C.curtain }}>
                                    ⚠ {t(flagKey)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </details>
                        )}

                        <button type="button" onClick={() => setRecordView("day")}
                          className="w-full flex items-center justify-between rounded-xl p-3 text-sm" style={{ background: C.card, color: C.inkSoft }}>
                          夜に、睡眠や食事をまとめて記録します
                          <ChevronRight size={14} />
                        </button>
                      </>
                    )}

                    {recordView === "day" && (
                      <>
                    {showGroup("body") && (
                    <SectionCard title={t("sectionTodayBody")} icon={Scale}>
                      <NumberField label={t("labelTodayWeight")} icon={Scale} value={formData.weightKg ?? ""} step={0.1} min={20} max={200} suffix="kg"
                        onChange={(v) => setFormData((f) => ({ ...f, weightKg: v }))} />
                      {showGroup("body_fat") && (
                        <NumberField label="体脂肪率（体組成計をお持ちの場合・任意）" icon={Scale} value={formData.bodyFatPct ?? ""} step={0.1} min={3} max={60} suffix="%"
                          onChange={(v) => setFormData((f) => ({ ...f, bodyFatPct: v }))} />
                      )}

                      {/* ★置き場所は cycle_periods ただ1つ（周期記録の設計.md §3）。
                          ここは以前 entries.cycle_start に書いていた。ホームのボタンは
                          cycle_periods に書くので、同じ「周期◯日目」が2つの別々の場所から
                          計算され、片方に入れた記録がもう片方から見えなかった。
                          ★この画面は過去の日付も選べるので、入口としては残す。
                            書き込み先だけを1つに寄せる。 */}
                      {cycleTrackingOn(profile) && (
                        <div className="rounded-xl p-3" style={{ background: C.paper }}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">月経周期</p>
                              {(() => {
                                const isStart = isCycleStartDate(selectedDate, cyclePeriods);
                                const day = cycleDayForDate(selectedDate, cyclePeriods);
                                return (
                                  <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                                    {isStart
                                      ? "この日を生理の初日として記録しています"
                                      : day != null
                                        ? `周期${day}日目`
                                        : "まだ記録がありません"}
                                  </p>
                                );
                              })()}
                            </div>
                            <button
                              type="button"
                              disabled={cycleBusy}
                              onClick={() => {
                                if (isCycleStartDate(selectedDate, cyclePeriods)) handleRemoveCycleStart(selectedDate);
                                else handleStartCycle(selectedDate);
                              }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                              style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.line}`, opacity: cycleBusy ? 0.5 : 1 }}
                            >
                              {isCycleStartDate(selectedDate, cyclePeriods) ? "初日の記録を取り消す" : "この日を初日にする"}
                            </button>
                          </div>
                          {cycleError && <p className="text-xs mt-2" style={{ color: C.curtain }}>{cycleError}</p>}
                        </div>
                      )}

                      {showGroup("medication") && (
                        <div>
                          <span className="text-sm font-medium block mb-2">服薬（複数選択可）</span>
                          <div className="flex flex-wrap gap-2">
                            {MEDICATION_OPTIONS.map((m) => (
                              <Chip key={m} label={m} active={(formData.medicationTags || []).includes(m)}
                                onClick={() => setFormData((f) => ({
                                  ...f,
                                  medicationTags: (f.medicationTags || []).includes(m)
                                    ? f.medicationTags.filter((x) => x !== m)
                                    : [...(f.medicationTags || []), m]
                                }))} />
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.height_cm ? (
                        <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                          <p>体組成計をお持ちの場合は、下の「体脂肪率」欄に入力すると、より正確な分析ができます。</p>
                          <p className="mt-1">体重・体脂肪率の傾向は、月1回のまとめで「エネルギー可用性」としてお伝えします（BMIや体重の上限レンジは表示しません。声のプロにとってのリスクは主に下側だからです）。</p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteRegisterHeightForRange")}</p>
                      )}
                    </SectionCard>
                    )}

                    {showGroup("env") && (
                    <SectionCard title={t("sectionClimate")} icon={Thermometer}>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">{t("labelLocation")}</label>
                        <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.line, background: C.paper }}>
                          <MapPin size={16} style={{ color: C.inkSoft }} />
                          <input type="text" value={formData.location} placeholder={t("placeholderLocationExample")}
                            onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                            className="w-full text-sm bg-transparent border-none" />
                        </div>
                      </div>
                      {showGroup("env") && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <NumberField label={t("labelTemperature")} icon={Thermometer} value={formData.temperature ?? ""} step={1} min={-30} max={50} suffix="℃"
                              onChange={(v) => setFormData((f) => ({ ...f, temperature: v }))} />
                            <NumberField label={t("labelHumidity")} icon={Wind} value={formData.humidity ?? ""} step={5} min={0} max={100} suffix="%"
                              onChange={(v) => setFormData((f) => ({ ...f, humidity: v }))} />
                          </div>
                          {(() => {
                            const absH = computeAbsoluteHumidity(formData.temperature, formData.humidity);
                            if (absH == null) return null;
                            const recentDates = Object.keys(entries).sort().slice(-14);
                            const recentVals = recentDates.map((d) => computeAbsoluteHumidity(entries[d].temperature, entries[d].humidity)).filter((v) => v != null);
                            let compareText = "";
                            if (recentVals.length >= 3) {
                              const avg = recentVals.reduce((s, v) => s + v, 0) / recentVals.length;
                              const diff = absH - avg;
                              compareText = Math.abs(diff) < 0.5 ? "・平常並みです" : diff > 0 ? "・あなたの平常より 湿っています" : "・あなたの平常より 乾いています";
                            }
                            return (
                              <p className="text-xs rounded-lg p-2" style={{ background: C.paper, color: C.inkSoft }}>
                                絶対湿度 {absH.toFixed(1)} g/m³{compareText}
                              </p>
                            );
                          })()}
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelWeather")}</label>
                            <select
                              value={formData.weather}
                              onChange={(e) => setFormData((f) => ({ ...f, weather: e.target.value }))}
                              className="w-full rounded-lg border p-2 text-sm"
                              style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                            >
                              <option value="">{t("labelSelectPlaceholder")}</option>
                              {WEATHER_OPTIONS.map((w) => <option key={w} value={w}>{t(WEATHER_KEYS[w])}</option>)}
                            </select>
                          </div>
                        </>
                      )}

                      <div className="rounded-xl p-3" style={{ background: C.paper }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Volume2 size={14} style={{ color: C.gold }} />
                          <span className="text-sm font-medium">環境騒音レベル</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={noiseMeasuring}
                            onClick={async () => {
                              setNoiseError("");
                              setNoiseMeasuring(true);
                              try {
                                const db = await measureAmbientNoise(2000);
                                setFormData((f) => ({ ...f, ambientNoiseDb: db }));
                              } catch (err) {
                                setNoiseError("マイクを使用できませんでした。ブラウザの権限設定をご確認ください。");
                              } finally {
                                setNoiseMeasuring(false);
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5"
                            style={{ background: noiseMeasuring ? C.line : C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}
                          >
                            {noiseMeasuring ? <Loader2 size={12} className="animate-spin" /> : <Mic2 size={12} />}
                            {noiseMeasuring ? "測定中（2秒）…" : "騒音レベルを測定する"}
                          </button>
                          {formData.ambientNoiseDb !== "" && formData.ambientNoiseDb != null && (
                            <span className="ff-mono text-sm" style={{ color: C.ink }}>約{formData.ambientNoiseDb} dB</span>
                          )}
                        </div>
                        {noiseError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{noiseError}</p>}
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          今いる場所にスマホを置いて測定すると、2秒間の音を録音データに残さず、その場で数値化します。校正されたマイクではないため、あくまで日々の相対的な比較のための参考値です。
                        </p>
                      </div>

                      <div>
                        <span className="text-sm font-medium block mb-2">今日の環境（あてはまるものすべて）</span>
                        <div className="flex flex-wrap gap-2">
                          {["乾燥を感じた", "空調が直接あたる", "マスク着用", "大声を出す場所にいた", "喫煙環境", "粉塵・スモーク"].map((tag) => (
                            <Chip key={tag} label={tag} active={(formData.environmentTags || []).includes(tag)}
                              onClick={() => setFormData((f) => ({
                                ...f,
                                environmentTags: (f.environmentTags || []).includes(tag)
                                  ? f.environmentTags.filter((x) => x !== tag)
                                  : [...(f.environmentTags || []), tag]
                              }))} />
                          ))}
                        </div>
                      </div>

                      <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                        <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>移動・時差の記録（任意）</summary>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <NumberField label="フライト時間" icon={Plane} value={formData.flightHours ?? ""} step={0.5} min={0} max={30} suffix={t("unitHours")}
                            onChange={(v) => setFormData((f) => ({ ...f, flightHours: v }))} />
                          <NumberField label="時差" value={formData.jetlagHours ?? ""} step={1} min={-12} max={12} suffix={t("unitHours")}
                            onChange={(v) => setFormData((f) => ({ ...f, jetlagHours: v }))} />
                        </div>
                        <p className="mt-2 leading-relaxed">機内の乾燥と時差ぼけは、どちらも喉と体調に影響しやすいとされています。遠征のあった日だけ記録してください。</p>
                      </details>
                      <SectionFeedback text={sectionFeedback.env} />
                    </SectionCard>
                    )}

                    <SectionCard title={t("sectionSleep")} icon={Moon} id="record-section-sleep" highlighted={highlightSection === "sleep"}>
                      <div className="grid grid-cols-2 gap-3">
                        <NumberField label={t("labelSleepHours")} icon={Moon} value={formData.sleepHours} step={0.5} min={0} max={16} suffix={t("unitHours")}
                          onChange={(v) => setFormData((f) => ({ ...f, sleepHours: v }))} />
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelBedtime")}</label>
                          <input type="time" value={formData.bedtime}
                            onChange={(e) => setFormData((f) => ({ ...f, bedtime: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                      </div>
                      {(() => {
                        if (typeof formData.sleepHours !== "number") return null;
                        const recentDates = Object.keys(entries).sort().slice(-14);
                        const recentVals = recentDates.map((d) => entries[d].sleepHours).filter((v) => typeof v === "number");
                        if (recentVals.length < 3) return null;
                        const avg = recentVals.reduce((s, v) => s + v, 0) / recentVals.length;
                        const diff = formData.sleepHours - avg;
                        return (
                          <p className="text-xs rounded-lg p-2" style={{ background: C.paper, color: C.inkSoft }}>
                            {/* ★窓の長さ（14日）ではなく、実際に平均を取れた日数を書く。
                                同じ間違いを sectionFeedback で一度直しており、ここは
                                その修正から漏れていた別の場所。 */}
                            {recentVals.length}日平均より {diff >= 0 ? "+" : ""}{diff.toFixed(1)}{t("unitHours")}
                          </p>
                        );
                      })()}
                      <DotSelector label={t("labelSleepQuality")} icon={Moon} value={formData.sleepQuality} lowLabel={t("lowSleepQuality")} highLabel={t("highSleepQuality")}
                        onChange={(v) => setFormData((f) => ({ ...f, sleepQuality: v }))} />
                      <SectionFeedback text={sectionFeedback.sleep} />
                    </SectionCard>

                    <SectionCard title={t("sectionPractice")} icon={Music2} id="record-section-practice" highlighted={highlightSection === "practice"}>
                      <div>
                        <span className="text-sm font-medium block mb-2">{t("labelTodayActivity")}</span>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          <button type="button"
                            onClick={() => setFormData((f) => ({ ...f, activities: [], recovery: f.recovery || { methods: [], note: "" } }))}
                            className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                            style={{
                              background: (formData.activities || []).length === 0 && formData.recovery ? C.curtain : C.paper,
                              color: (formData.activities || []).length === 0 && formData.recovery ? "#FFFDF8" : C.inkSoft,
                              borderColor: (formData.activities || []).length === 0 && formData.recovery ? C.curtain : C.line
                            }}>
                            <Moon size={16} />
                            {t("activityRest")}
                          </button>
                          {ACTIVITY_BLOCK_KINDS.map((kind) => {
                            const opt = ACTIVITY_OPTIONS.find((a) => a.key === kind) || {};
                            const isFirstBlockKind = (formData.activities || []).length === 0;
                            return (
                              <button key={kind} type="button"
                                onClick={() => {
                                  if (isFirstBlockKind) {
                                    setFormData((f) => ({ ...f, recovery: null, activities: [newActivityBlock(kind, 0)] }));
                                  }
                                }}
                                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                                style={{
                                  background: isFirstBlockKind ? C.paper : C.paper,
                                  color: C.inkSoft,
                                  borderColor: C.line,
                                  opacity: isFirstBlockKind ? 1 : 0.4,
                                  cursor: isFirstBlockKind ? "pointer" : "default"
                                }}>
                                {opt.icon ? <opt.icon size={16} /> : <Music2 size={16} />}
                                {t(opt.labelKey) || kind}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
                          {(formData.activities || []).length === 0 && formData.recovery
                            ? "休養日として記録します。"
                            : (formData.activities || []).length === 0
                              ? "上のボタンから、1つ目の活動を選んでください。"
                              : "活動は下のブロックごとに追加・編集できます。2つ以上の活動があった日は「＋活動を追加」で足してください。"}
                        </p>
                      </div>

                      {(formData.activities || []).length === 0 && formData.recovery ? (
                        <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                          <p className="text-sm font-medium mb-2">{t("labelRestMethodsHeader")}</p>
                          <div className="flex flex-wrap gap-2">
                            {REST_METHODS.map((m) => (
                              <Chip key={m} label={t(REST_METHOD_KEYS[m])} active={((formData.recovery || {}).methods || []).includes(m)}
                                onClick={() => {
                                  const current = (formData.recovery || {}).methods || [];
                                  updateRecovery({ methods: current.includes(m) ? current.filter((x) => x !== m) : [...current, m] });
                                }} />
                            ))}
                          </div>
                          {((formData.recovery || {}).methods || []).includes("その他") && (
                            <input
                              type="text"
                              value={(formData.recovery || {}).note || ""}
                              placeholder={t("placeholderRestOtherExample")}
                              onChange={(e) => updateRecovery({ note: e.target.value })}
                              className="w-full rounded-lg border p-2 text-sm mt-2"
                              style={{ borderColor: C.line, background: C.paper }}
                            />
                          )}
                          <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            {t("noteRestMethodsFull")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {(formData.activities || []).map((activity) => (
                              <ActivityBlockEditor
                                key={activity.id}
                                activity={activity}
                                onChange={(patch) => updateActivityBlock(activity.id, patch)}
                                onRemove={() => removeActivityBlock(activity.id)}
                                onDetailChange={(patch) => updateActivityBlockDetail(activity.id, patch)}
                                onAddItem={() => addRepertoireItemToActivity(activity.id)}
                                onUpdateItem={(idx, patch) => updateRepertoireItemInActivity(activity.id, idx, patch)}
                                onRemoveItem={(idx) => removeRepertoireItemFromActivity(activity.id, idx)}
                                onMoveItem={(idx, dir) => moveRepertoireItemInActivity(activity.id, idx, dir)}
                                repertoireTessituraMap={repertoireTessituraMap}
                                repertoireUsageCounts={repertoireUsageCounts}
                                repertoireSkipped={repertoireSkipped}
                                setRepertoireSkipped={setRepertoireSkipped}
                                handleSaveRepertoire={handleSaveRepertoire}
                                tessituraSaving={tessituraSaving}
                                songFactorResolver={songFactorResolver}
                                professions={effectiveProfessions}
                                roleMasterMap={roleMasterMap}
                                projectMasterMap={projectMasterMap}
                                handleSaveRole={handleSaveRole}
                                handleSaveProject={handleSaveProject}
                                handleSaveSingingLanguage={handleSaveSingingLanguage}
                                t={t}
                              />
                            ))}
                          </div>
                          {/* ★発声量の計測（G2-10.5 軽量版・改善タスクv2 §3-1）。
                              受診用サマリーの発声時間が約0時間だったのは、計算では
                              なく入力の負担が原因。「分」の小さな数値欄は、実際には
                              ほとんど埋まらない。開始／終了だけで済むようにする。
                              ★マイクは使わない。音圧サンプリング（中量版）は
                                v4 §10 で凍結中で、これはその前提にしない。
                              ★あとから手で直せること。押し忘れは必ず起きる。 */}
                          {selectedDate === realTodayDate && (
                            <div className="rounded-xl p-3" style={{ background: C.paper }}>
                              {runningSession ? (
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-medium">{runningSession.kind}を計測中</p>
                                    <p className="text-xs mt-0.5 ff-mono" style={{ color: C.inkSoft }}>
                                      {elapsedMinutes(runningSession.startedAtMs, Date.now() + sessionTick * 0)}分
                                    </p>
                                  </div>
                                  <button type="button" onClick={handleStopSession}
                                    className="px-4 py-2 rounded-full text-xs font-medium shrink-0"
                                    style={{ background: C.curtain, color: "#FFFDF8" }}>
                                    終了
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                                    声を使い始めるときに押すと、時間を数えます。あとから手で直せます。
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {VOCAL_SESSION_KINDS.map((kind) => (
                                      <button key={kind} type="button" onClick={() => handleStartSession(kind)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium"
                                        style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                        {kind}を始める
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                              {/* ★押し忘れたものを、黙って保存しない。
                                  いつ終わったか分からないものを、分かっているように保存しない。 */}
                              {sessionConfirm && (
                                <div className="mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
                                  <p className="text-xs mb-2" style={{ color: C.ink }}>
                                    {sessionConfirm.kind}が{Math.floor(sessionConfirm.minutes / 60)}時間
                                    {sessionConfirm.minutes % 60}分になっています。
                                    終了を押し忘れていませんか？
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button type="button" onClick={() => commitSession(sessionConfirm.kind, sessionConfirm.minutes)}
                                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                      この時間で記録する
                                    </button>
                                    <button type="button" onClick={() => commitSession(sessionConfirm.kind, SESSION_MAX_MINUTES)}
                                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                      {Math.floor(SESSION_MAX_MINUTES / 60)}時間として記録する
                                    </button>
                                    <button type="button" onClick={() => { setRunningSession(null); setSessionConfirm(null); }}
                                      className="px-3 py-1.5 rounded-full text-xs font-medium"
                                      style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                      記録しない
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {(formData.activities || []).length > 0 && (formData.activities || []).length < 10 && (
                            <button type="button" onClick={addActivity}
                              className="w-full rounded-xl border py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                              style={{ borderColor: C.line, color: C.inkSoft }}>
                              <Plus size={13} />活動を追加
                            </button>
                          )}
                          {(formData.activities || []).length > 0 && (() => {
                            const totalMinutes = (formData.activities || []).reduce((s, a) => s + (Number(a.minutes) || 0), 0);
                            const totalLoad = computeDayLoadFromActivities(formData.activities, songFactorResolver);
                            const recentDates = Object.keys(entries).sort().slice(-7);
                            const recentLoads = recentDates
                              .map((d) => (entries[d].activities || []).length > 0 ? computeDayLoadFromActivities(entries[d].activities, songFactorResolver) : null)
                              .filter((v) => typeof v === "number" && v > 0);
                            let zoneText = "";
                            if (recentLoads.length >= 3) {
                              const avg = recentLoads.reduce((s, v) => s + v, 0) / recentLoads.length;
                              const ratio = avg > 0 ? totalLoad / avg : 1;
                              zoneText = ratio > 1.3 ? "（今週の中では重め）" : ratio < 0.7 ? "（今週の中では軽め）" : "（ちょうどいい）";
                            }
                            return (
                              <p className="text-xs text-right ff-mono" style={{ color: C.inkSoft }}>
                                今日の合計　{totalMinutes}分・負荷 {Math.round(totalLoad)}{zoneText}
                              </p>
                            );
                          })()}
                        </>
                      )}

                      {setlistDiagnosis && setlistDiagnosis.hasEnoughSongs && (setlistDiagnosis.peakSuggestion || setlistDiagnosis.keyLoweringSuggestions.length > 0) && (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: C.paper }}>
                          <p className="text-xs font-medium" style={{ color: C.ink }}>セットリスト診断</p>
                          {setlistDiagnosis.peakSuggestion && (
                            <p className="text-xs leading-relaxed" style={{ color: C.inkSoft }}>
                              {setlistDiagnosis.peakSuggestion.peakStart}曲目と{setlistDiagnosis.peakSuggestion.peakEnd}曲目が連続で重く、ここで一度声が消耗します。
                              「{setlistDiagnosis.peakSuggestion.lightestSong}」と入れ替えると、その山の負荷が約{setlistDiagnosis.peakSuggestion.improvement}%下がります。
                            </p>
                          )}
                          {setlistDiagnosis.keyLoweringSuggestions.map((s, i) => (
                            <p key={i} className="text-xs leading-relaxed" style={{ color: C.inkSoft }}>
                              「{s.name}」は、あなたの快適音域の上限を{s.overBy}半音超えています。キーを下げると収まります。
                            </p>
                          ))}
                        </div>
                      )}

                      <div>
                        <span className="text-sm font-medium block mb-2">本番外の発話（レッスン・会議・電話・授業・打合せなど）</span>
                        <div className="flex items-center gap-2">
                          <MiniNumber value={formData.nonPerformanceSpeechMinutes ?? ""} placeholder="0"
                            onChange={(v) => setFormData((f) => ({ ...f, nonPerformanceSpeechMinutes: v === "" ? null : Number(v) }))} />
                          <span className="text-xs flex-shrink-0" style={{ color: C.inkSoft }}>分</span>
                        </div>
                        <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.inkSoft }}>
                          <input type="checkbox" checked={!!formData.noisyEnvironment}
                            onChange={(e) => setFormData((f) => ({ ...f, noisyEnvironment: e.target.checked }))} />
                          騒がしい場所での会話が多かった（無意識に声が大きくなりやすい環境）
                        </label>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          「今日は歌っていない・収録していない」日でも、レッスンで教える・会議・電話などの発話は、発声負荷（ACWR）の計算に反映されます。
                        </p>
                        {effectiveProfessions.includes("announcer") && (
                          <details className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            <summary className="cursor-pointer">＋詳しく記録する</summary>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="flex-shrink-0">最長の連続発話ブロック</span>
                              <MiniNumber value={formData.longestSpeechBlockMinutes ?? ""} placeholder="0"
                                onChange={(v) => setFormData((f) => ({ ...f, longestSpeechBlockMinutes: v === "" ? null : Number(v) }))} />
                              <span className="flex-shrink-0">分</span>
                            </div>
                            <p className="mt-1">合計時間より、休みなく話し続けた長さが効きます。</p>
                          </details>
                        )}
                      </div>

                      <SectionFeedback text={sectionFeedback.activity} />
                    </SectionCard>

                    {showGroup("hydration") && (
                    <SectionCard title={t("sectionWater")} icon={Droplets} id="record-section-water" highlighted={highlightSection === "water"}>
                      <div>
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => setFormData((f) => ({ ...f, waterBySlot: { total: Math.max(0, ((f.waterBySlot || {}).total || 0) - 200) } }))}
                            className="w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: C.line, color: C.inkSoft }}>
                            <Minus size={16} />
                          </button>
                          <div className="flex-1 text-center">
                            <span className="ff-display italic text-2xl">{waterTotal}</span>
                            <span className="text-xs ml-1" style={{ color: C.inkSoft }}>ml</span>
                          </div>
                          <button type="button"
                            onClick={() => setFormData((f) => ({ ...f, waterBySlot: { total: ((f.waterBySlot || {}).total || 0) + 200 } }))}
                            className="w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: C.line, color: C.inkSoft }}>
                            <Plus size={16} />
                          </button>
                        </div>
                        <details className="text-xs mt-2" style={{ color: C.inkSoft }}>
                          <summary className="cursor-pointer">数値を直接入力する</summary>
                          <MiniNumber
                            value={waterTotal || ""}
                            placeholder="ml"
                            onChange={(v) => setFormData((f) => ({ ...f, waterBySlot: { total: Number(v) || 0 } }))}
                          />
                        </details>
                        {waterTotal > 0 && (() => {
                          let weightKg = formData.weightKg;
                          if (typeof weightKg !== "number") {
                            const pastDates = Object.keys(entries).sort().reverse();
                            const found = pastDates.find((d) => typeof entries[d].weightKg === "number");
                            if (found) weightKg = entries[found].weightKg;
                          }
                          if (typeof weightKg === "number" && weightKg > 0) {
                            return (
                              <p className="text-xs rounded-lg p-2 mt-2" style={{ background: C.paper, color: C.inkSoft }}>
                                体重比 {Math.round(waterTotal / weightKg)} ml/kg
                              </p>
                            );
                          }
                          const recentDates = Object.keys(entries).sort().slice(-7);
                          const recentVals = recentDates.map((d) => (entries[d].waterBySlot || {}).total).filter((v) => typeof v === "number" && v > 0);
                          if (recentVals.length < 3) return null;
                          const avg = recentVals.reduce((s, v) => s + v, 0) / recentVals.length;
                          const diff = Math.round(waterTotal - avg);
                          return (
                            <p className="text-xs rounded-lg p-2 mt-2" style={{ background: C.paper, color: C.inkSoft }}>
                              今週の平均より {diff >= 0 ? "+" : ""}{diff}ml
                            </p>
                          );
                        })()}
                      </div>
                      <SectionFeedback text={sectionFeedback.water} />
                    </SectionCard>
                    )}

                    {showGroup("meal") && (
                    <SectionCard title={t("sectionMealDetail")} icon={Wheat} id="record-section-meal" highlighted={highlightSection === "meal"}>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteMealAutoCalc")}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelDinnerTime")}</label>
                          <input type="time" value={formData.dinnerTime}
                            onChange={(e) => setFormData((f) => ({ ...f, dinnerTime: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                        <div className="flex flex-col justify-end">
                          {(() => {
                            const gap = computeTimeGapHours(formData.dinnerTime, formData.bedtime);
                            return gap != null ? (
                              <p className="text-xs rounded-lg p-2" style={{ background: gap < 3 ? "rgba(184,49,49,0.08)" : C.paper, color: gap < 3 ? C.curtain : C.inkSoft }}>
                                {t("labelDinnerToBedGap")}: {gap}{t("unitHours")}
                              </p>
                            ) : (
                              <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteDinnerGapHint")}</p>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-2">{t("labelDinnerTags")}</span>
                        <div className="flex flex-wrap gap-2">
                          {DINNER_TAGS.map((tag) => (
                            <Chip key={tag} label={t(DINNER_TAG_KEYS[tag])} active={(formData.dinnerTags || []).includes(tag)}
                              onClick={() => setFormData((f) => ({
                                ...f,
                                dinnerTags: (f.dinnerTags || []).includes(tag)
                                  ? f.dinnerTags.filter((x) => x !== tag)
                                  : [...(f.dinnerTags || []), tag]
                              }))} />
                          ))}
                        </div>
                      </div>
                      {(formData.meals || []).length === 0 && !showMealDetail ? (
                        <>
                          <div>
                            <span className="text-sm font-medium block mb-2">タンパク質は摂れましたか？</span>
                            <div className="flex gap-2">
                              {[
                                { v: 0, label: "少なめ" },
                                { v: 1, label: "ふつう" },
                                { v: 2, label: "しっかり摂った" }
                              ].map((opt) => (
                                <button key={opt.v} type="button" onClick={() => setFormData((f) => ({ ...f, proteinLevel: opt.v }))}
                                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                                  style={{
                                    background: formData.proteinLevel === opt.v ? C.curtain : C.paper,
                                    color: formData.proteinLevel === opt.v ? "#FFFDF8" : C.inkSoft,
                                    borderColor: formData.proteinLevel === opt.v ? C.curtain : C.line
                                  }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium block mb-2">食事の量は全体的にどうでしたか？</span>
                            <div className="flex gap-2">
                              {[
                                { v: 0, label: "少なめ" },
                                { v: 1, label: "いつも通り" },
                                { v: 2, label: "多め" }
                              ].map((opt) => (
                                <button key={opt.v} type="button" onClick={() => setFormData((f) => ({ ...f, calorieLevel: opt.v }))}
                                  className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                                  style={{
                                    background: formData.calorieLevel === opt.v ? C.curtain : C.paper,
                                    color: formData.calorieLevel === opt.v ? "#FFFDF8" : C.inkSoft,
                                    borderColor: formData.calorieLevel === opt.v ? C.curtain : C.line
                                  }}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {showGroup("meal_detail") && (
                            <button type="button" onClick={() => setShowMealDetail(true)}
                              className="text-xs underline" style={{ color: C.inkSoft }}>
                              +食品ごとに詳しく記録する
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {MEAL_SLOTS.map((slot) => (
                            <div key={slot}>
                              <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>{t(MEAL_SLOT_KEYS[slot])}</p>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {QUICK_ADD_FOODS.map((name) => {
                                  const preset = FOOD_PRESETS.find((p) => p.name === name);
                                  const label = preset ? foodDisplayName(preset, language) : name;
                                  return (
                                    <button key={name} type="button" onClick={() => quickAddFood(slot, name)}
                                      className="px-2.5 py-1 rounded-full text-xs font-medium border"
                                      style={{ borderColor: C.line, color: C.inkSoft, background: C.card }}>
                                      + {label}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="space-y-2">
                                {(formData.meals || []).filter((m) => m.slot === slot).map((m) => (
                                  <MealItemRow key={m.id} item={m} foodLibrary={foodLibrary} t={t} language={language} onChange={(next) => updateMeal(m.id, next)} onRemove={() => removeMeal(m.id)} />
                                ))}
                              </div>
                              <button type="button" onClick={() => addMeal(slot)}
                                className="w-full rounded-xl border py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 mt-2"
                                style={{ borderColor: C.line, color: C.inkSoft }}>
                                <Plus size={12} />{t(MEAL_SLOT_KEYS[slot])}
                              </button>
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => {
                              const hasItems = (formData.meals || []).length > 0;
                              if (hasItems && !window.confirm("入力済みの食品の記録は消えます。簡易入力（3択）に戻しますか？")) return;
                              setFormData((f) => ({ ...f, meals: [] }));
                              setShowMealDetail(false);
                            }}
                            className="text-xs underline" style={{ color: C.inkSoft }}>
                            簡易入力（3択）に戻す
                          </button>
                        </>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                          <Utensils size={14} style={{ color: C.gold }} />
                          <label className="text-sm font-medium">{t("labelMealNotes")}</label>
                        </div>
                        <textarea value={formData.mealNotes} rows={2} placeholder={t("placeholderMealNotesExample")}
                          onChange={(e) => setFormData((f) => ({ ...f, mealNotes: e.target.value }))}
                          className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>{t("macroCarbs")}</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.carbs.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>{t("macroProtein")}</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.protein.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>{t("macroFat")}</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.fat.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>{t("macroFiber")}</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.fiber.toFixed(0)}g</div>
                        </div>
                      </div>
                      {simpleMealMacros && (formData.meals || []).length === 0 && (
                        <p className="text-xs" style={{ color: C.inkSoft }}>
                          ※ 上の数値は、選択した3択と目標値から推定した参考値です。実際に食べた食品を記録すると、より正確になります。
                        </p>
                      )}

                      {nutritionTargets ? (
                        <div className="rounded-xl p-3" style={{ background: C.paper }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium">{t("labelNutritionEval")}</p>
                            <span className="text-xs ff-mono rounded-full px-2 py-0.5" style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.line}` }}>
                              {t(NUTRITION_PHASE_KEYS[profile.nutrition_phase] || "phaseMaintain")}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {[
                              { label: t("macroProtein"), actual: mealTotals.protein, target: nutritionTargets.proteinTarget },
                              { label: t("macroCarbs"), actual: mealTotals.carbs, target: nutritionTargets.carbsTarget },
                              { label: t("macroFat"), actual: mealTotals.fat, target: nutritionTargets.fatTarget },
                              { label: t("macroFiber"), actual: mealTotals.fiber, target: nutritionTargets.fiberTarget }
                            ].map(({ label, actual, target }) => {
                              const ev = evaluateIntake(actual, target);
                              return (
                                <div key={label} className="flex items-center justify-between text-xs">
                                  <span style={{ color: C.inkSoft }}>{label}</span>
                                  <span className="ff-mono">{actual.toFixed(0)}g / {t("labelTargetPrefix")}{target.toFixed(0)}g</span>
                                  {ev && <span className="font-medium" style={{ color: C.ink }}>{t(ev.labelKey)}</span>}
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: C.line }}>
                              <span style={{ color: C.inkSoft }}>{t("labelEstimatedCalorie")}</span>
                              <span className="ff-mono">
                                {(mealTotals.carbs * 4 + mealTotals.protein * 4 + mealTotals.fat * 9).toFixed(0)}kcal / {t("labelTargetPrefix")}{nutritionTargets.calorieTarget.toFixed(0)}kcal
                              </span>
                            </div>
                          </div>
                          <p className="text-xs mt-2 leading-relaxed" style={{ color: C.inkSoft }}>
                            ※ {nutritionTargets.usedPreciseFormula
                              ? t("noteBMIFormulaPrecise")
                              : t("noteBMIFormulaSimple")}
                            {" "}{t("noteNutritionAdvice")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteRecordWeightForTargets")}</p>
                      )}
                      <SectionFeedback text={sectionFeedback.meal} />
                    </SectionCard>
                    )}

                    {showGroup("exercise") && (
                    <SectionCard title={t("sectionExercise")} icon={Dumbbell}>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteExerciseHelp")}</p>
                      {(formData.exercises || []).length === 0 && !showExerciseDetail ? (
                        <>
                          <div className="flex gap-2">
                            {[
                              { v: 0, label: "していない" },
                              { v: 1, label: "軽め" },
                              { v: 2, label: "しっかり" }
                            ].map((opt) => (
                              <button key={opt.v} type="button" onClick={() => setFormData((f) => ({ ...f, exerciseLevel: opt.v }))}
                                className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                                style={{
                                  background: formData.exerciseLevel === opt.v ? C.curtain : C.paper,
                                  color: formData.exerciseLevel === opt.v ? "#FFFDF8" : C.inkSoft,
                                  borderColor: formData.exerciseLevel === opt.v ? C.curtain : C.line
                                }}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          {showGroup("exercise_detail") && (
                            <button type="button" onClick={() => setShowExerciseDetail(true)}
                              className="text-xs underline" style={{ color: C.inkSoft }}>
                              +詳しく記録する（種目・時間・強度）
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {(formData.exercises || []).map((x) => (
                              <ExerciseItemRow key={x.id} item={x} t={t} onChange={(next) => updateExercise(x.id, next)} onRemove={() => removeExercise(x.id)} />
                            ))}
                          </div>
                          <button type="button" onClick={addExercise}
                            className="w-full rounded-xl border py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                            style={{ borderColor: C.line, color: C.inkSoft }}>
                            <Plus size={13} />{t("btnAddExercise")}
                          </button>
                          {exerciseTotalMinutes > 0 && (
                            <p className="text-xs text-right ff-mono" style={{ color: C.inkSoft }}>{t("labelTotal")} {exerciseTotalMinutes}分</p>
                          )}
                          <button type="button"
                            onClick={() => {
                              const hasItems = (formData.exercises || []).length > 0;
                              if (hasItems && !window.confirm("入力済みの運動の記録は消えます。簡易入力（3択）に戻しますか？")) return;
                              setFormData((f) => ({ ...f, exercises: [] }));
                              setShowExerciseDetail(false);
                            }}
                            className="text-xs underline" style={{ color: C.inkSoft }}>
                            簡易入力（3択）に戻す
                          </button>
                        </>
                      )}
                      <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                        <p className="font-medium mb-1" style={{ color: C.ink }}>{t("labelRecommendedExercise")}</p>
                        <p>・{t("exerciseTipBreath")}</p>
                        <p>・{t("exerciseTipPosture")}</p>
                        <p>・{t("exerciseTipEndurance")}</p>
                        <p className="mt-1">{t("noteSeeHealthInfo")}</p>
                      </div>
                    </SectionCard>
                    )}

                    {showGroup("mental") && (
                    <SectionCard title={t("sectionMental")} icon={HeartHandshake} id="record-section-mental" highlighted={highlightSection === "mental"}>
                      <DotSelector label={t("labelMentalEase")} icon={HeartHandshake} value={formData.ease} lowLabel={t("lowTension")} highLabel={t("highCalm")}
                        onChange={(v) => setFormData((f) => ({ ...f, ease: v }))} />
                      {typeof formData.ease === "number" && (
                        <p className="text-xs" style={{ color: C.inkSoft }}>記録しました</p>
                      )}
                      {showGroup("mental_detail") && (
                        <>
                          <div>
                            <span className="text-sm font-medium block mb-2">{t("labelMentalTags")}</span>
                            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("noteMentalTagsFollowEase")}</p>
                            <div className="flex flex-wrap gap-2">
                              {MENTAL_TAG_GROUPS[mentalTagGroupForEase(formData.ease)].map((tag) => (
                                <Chip key={tag} label={t(MENTAL_TAG_KEYS[tag])} active={(formData.mentalTags || []).includes(tag)}
                                  onClick={() => setFormData((f) => ({
                                    ...f,
                                    mentalTags: (f.mentalTags || []).includes(tag)
                                      ? f.mentalTags.filter((x) => x !== tag)
                                      : [...(f.mentalTags || []), tag]
                                  }))} />
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelMentalReason")}</label>
                            <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{t("noteMentalReasonOptional")}</p>
                            <textarea value={formData.mentalReason} rows={3} placeholder={t("placeholderMentalReasonText")}
                              onChange={(e) => setFormData((f) => ({ ...f, mentalReason: e.target.value }))}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                        </>
                      )}
                      <SectionFeedback text={sectionFeedback.mental} />
                    </SectionCard>
                    )}

                    {showGroup("practiceNote") && (
                    <SectionCard title={t("sectionMemo")} icon={NotebookPen}>
                      <textarea value={formData.notes} rows={3} placeholder={t("placeholderGeneralNotes")}
                        onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </SectionCard>
                    )}

                    <button onClick={handleSave} disabled={saveStatus === "saving"}
                      className="w-full rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all"
                      style={{ background: C.curtain, color: "#FFFDF8" }}>
                      {saveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                      {saveStatus === "saved" && <Check size={16} />}
                      {saveStatus === "saving" ? t("saveButtonSaving") : saveStatus === "saved" ? t("saveButtonSaved") : saveStatus === "error" ? t("saveButtonError") : t("saveButton")}
                    </button>
                    {saveStatus === "error" && saveError && (
                      <p className="text-xs text-center" style={{ color: C.curtain }}>{saveError}</p>
                    )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ★両方に当てはまる人にだけ出す。片方だけの人には出さない（大多数はこちら）。
                生徒の詳細を開いている間も出さない（戻る導線があるため）。 */}
            {activeTab === "lesson" && showLessonRoleSwitch && !viewingStudentLink && (
              <div className="flex rounded-full border p-1 mb-4" style={{ borderColor: C.line }}>
                <button onClick={() => setLessonRoleChoice("learn")}
                  className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                  style={{ background: lessonRole === "learn" ? C.curtain : "transparent", color: lessonRole === "learn" ? "#FFFDF8" : C.inkSoft }}>
                  {t("lessonRoleLearn")}
                </button>
                <button onClick={() => setLessonRoleChoice("teach")}
                  className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                  style={{ background: lessonRole === "teach" ? C.curtain : "transparent", color: lessonRole === "teach" ? "#FFFDF8" : C.inkSoft }}>
                  {t("lessonRoleTeach")}
                </button>
              </div>
            )}
            {activeTab === "lesson" && lessonRole === "learn" && (
              <div className="space-y-4">
                <h2 className="ff-display italic text-xl" style={{ color: C.ink }}>{t("tabLesson")}</h2>
                <p className="text-xs" style={{ color: C.inkSoft }}>
                  {t("lessonScheduleShareNotice")}
                </p>

                {myAllLessons.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <LessonCalendar lessons={myAllLessons} selectable={false} getTeacherName={orgDisplayName} t={t} />
                  </div>
                )}

                {lessonOverlaps.overlapPairs.filter(([a]) => new Date(a.scheduled_at) >= new Date()).length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                    <h3 className="ff-display italic text-lg mb-2">{t("lessonOverlapWarningTitle")}</h3>
                    <div className="space-y-2">
                      {lessonOverlaps.overlapPairs.filter(([a]) => new Date(a.scheduled_at) >= new Date()).map(([a, b], i) => (
                        <p key={i} className="text-sm">
                          {new Date(a.scheduled_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}が2件重なっています
                          {a.note && `　・${a.note}`}{b.note && `　・${b.note}`}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-3">{t("upcomingScheduleTitle")}</h3>
                  {myAllLessons.filter((l) => new Date(l.scheduled_at) >= new Date()).length === 0 && (
                    <p className="text-xs" style={{ color: C.inkSoft }}>{t("noUpcomingLessons")}</p>
                  )}
                  <div className="space-y-1.5">
                    {myAllLessons.filter((l) => new Date(l.scheduled_at) >= new Date()).map((l) => (
                      <div key={l.id} className="rounded-lg p-2.5 text-xs" style={{ background: C.paper }}>
                        {new Date(l.scheduled_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })}
                        {l.teacher_id && <span>　{orgDisplayName(l.teacher_id)}先生</span>}
                        {l.note ? `　${l.note}` : ""}
                        <AddToCalendarButtons lesson={l} title={`レッスン${l.teacher_id ? `（${orgDisplayName(l.teacher_id)}先生）` : ""}`} t={t} />
                      </div>
                    ))}
                  </div>
                </div>

                {myEnrollments.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-3">{t("myOrgsTitle")}</h3>
                    <div className="space-y-2">
                      {myEnrollments.map((en) => {
                        const teacherIds = myAssignedTeachers[en.org_id] || [];
                        return (
                          <div key={en.id} className="rounded-xl p-3" style={{ background: C.paper }}>
                            <p className="text-sm font-medium">{en.org ? en.org.name : "（教室情報を読み込めませんでした）"}</p>
                            {teacherIds.map((tid) => (
                              <p key={tid} className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{t("assignedTeacherLabel")}：{orgDisplayName(tid)}</p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ここから下は、普段は使わない設定類。開くまで最小化しておく。 */}
                <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                  <summary className="p-4 text-sm font-medium cursor-pointer">表示名</summary>
                  <div className="px-4 pb-4">
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                      先生・生徒としてつながった相手に表示される名前です。先生の場合、生徒のレッスンカレンダーにこの名前が表示されます。空欄のままでも構いません（その場合は職業名などで代替表示されます）。
                    </p>
                    <input type="text" defaultValue={profile.display_name} maxLength={30}
                      onBlur={(e) => { if (e.target.value !== profile.display_name) handleSaveDisplayName(e.target.value); }}
                      placeholder="例：やまだ先生" className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>
                </details>


                <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                  <summary className="p-4 text-sm font-medium cursor-pointer">{t("joinClassroomTitle")}</summary>
                  <div className="px-4 pb-4">
                    {pendingOrgInvitation ? (
                      <div>
                        <p className="text-sm mb-2">「{pendingOrgInvitation.org.name}」に参加しますか？</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleAcceptOrgInvitation}
                            className="flex-1 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>{t("joinButton")}</button>
                          <button type="button" onClick={() => setPendingOrgInvitation(null)}
                            className="flex-1 py-2 rounded-full text-xs font-medium border" style={{ borderColor: C.line, color: C.inkSoft }}>{t("notNowButton")}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>他の先生の教室に、講師として参加できます。</p>
                        <div className="flex gap-2">
                          <input type="text" value={orgInviteCodeInput} onChange={(e) => setOrgInviteCodeInput(e.target.value)}
                            placeholder={t("enterInvitationCodePlaceholder")} maxLength={8}
                            className="flex-1 rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                          <button type="button" onClick={() => handleLookupOrgInviteCode(orgInviteCodeInput)}
                            className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>{t("confirmButton")}</button>
                        </div>
                        {orgInviteLookupError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{orgInviteLookupError}</p>}
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}

            {activeTab === "lesson" && lessonRole === "teach" && (
              viewingStudentLink ? (() => {
                const link = viewingStudentLink;
                const scope = link.share_scope || {};
                const studentEntries = studentEntriesCache[link.student_id];
                const summary = studentEntries ? computeStudentSummary(studentEntries, link) : null;
                const studentProfessionLabel = t(PROFESSION_LABEL_KEYS[link.student && link.student.vocal_profession] || "professionSinger");
                const studentDisplayName = (link.student && link.student.display_name) || studentProfessionLabel;
                const recentDates = studentEntries ? Object.keys(studentEntries).sort().slice(-14).reverse() : [];
                return (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setViewingStudentLink(null)}
                      className="flex items-center gap-1 text-sm font-medium" style={{ color: C.inkSoft }}>
                      <ChevronLeft size={16} />生徒一覧に戻る
                    </button>
                    <div>
                      <h2 className="ff-display italic text-xl" style={{ color: C.ink }}>{studentDisplayName}</h2>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{studentProfessionLabel}</p>
                    </div>

                    {studentEntriesLoading[link.student_id] && (
                      <p className="text-xs" style={{ color: C.inkSoft }}>読み込み中…</p>
                    )}

                    {studentEntriesFetchError[link.student_id] && (
                      <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.rust }}>
                        記録を読み込めませんでした。時間をおいて、もう一度お試しください。
                      </p>
                    )}

                    {summary && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <p className="text-sm font-medium mb-1">記録日数（直近60日中）：{summary.totalDays}日</p>
                        {!canViewHealth(link, "voice") && !canViewHealth(link, "symptoms") && !canViewHealth(link, "sleep") && (
                          <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            この生徒は、記録日数以外の項目をまだ共有していません。
                          </p>
                        )}
                      </div>
                    )}

                    {(canViewHealth(link, "voice") || canViewHealth(link, "symptoms") || canViewHealth(link, "sleep")) && recentDates.length > 0 && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">直近の記録</h3>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>各日にコメントを残せます。生徒にも表示されます。</p>
                        <div className="space-y-2">
                          {recentDates.map((date) => {
                            const e = studentEntries[date];
                            const comments = studentComments[date] || [];
                            return (
                              <div key={date} className="rounded-xl p-2.5" style={{ background: C.paper }}>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="ff-mono" style={{ color: C.inkSoft }}>{date.slice(5)}</span>
                                  <div className="flex gap-3">
                                    {canViewHealth(link, "voice") && (
                                      <span style={{ color: C.ink }}>
                                        喉{typeof e.throatCondition === "number" ? e.throatCondition.toFixed(1) : "-"}
                                      </span>
                                    )}
                                    {canViewHealth(link, "symptoms") && (e.throatSymptoms || []).length > 0 && (
                                      <span style={{ color: C.curtain }}>症状{e.throatSymptoms.length}件</span>
                                    )}
                                    {canViewHealth(link, "sleep") && (
                                      <span style={{ color: C.ink }}>
                                        睡眠{typeof e.sleepHours === "number" ? `${e.sleepHours}h` : "-"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {comments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {comments.map((c) => (
                                      <p key={c.id} className="text-xs rounded-lg p-1.5" style={{ background: C.card, color: C.ink }}>💬 {c.body}</p>
                                    ))}
                                  </div>
                                )}
                                <details className="mt-1.5">
                                  <summary className="text-xs cursor-pointer" style={{ color: C.inkSoft }}>コメントする</summary>
                                  <div className="flex gap-1.5 mt-1.5">
                                    <input type="text" value={newCommentDraft} onChange={(ev) => setNewCommentDraft(ev.target.value)}
                                      placeholder="この日の記録へのコメント" maxLength={500}
                                      className="flex-1 rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.card }} />
                                    <button type="button" onClick={() => handleCreateComment(link.id, date, newCommentDraft)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                                      送信
                                    </button>
                                  </div>
                                </details>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">{t("lessonScheduleTitle")}</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>生徒にも表示されます。日付をタップすると、下の欄にその日が入ります。</p>
                      <LessonCalendar lessons={studentLessons} selectable onDayClick={(iso) => setNewLessonDate(iso)} />
                      {studentLessons.filter((l) => new Date(l.scheduled_at) >= new Date()).length > 0 && (
                        <div className="space-y-1.5 my-3">
                          {studentLessons.filter((l) => new Date(l.scheduled_at) >= new Date()).map((l) => (
                            <div key={l.id} className="rounded-lg p-2 flex items-center justify-between text-xs" style={{ background: C.paper }}>
                              <span>{new Date(l.scheduled_at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}{l.note ? `　${l.note}` : ""}</span>
                              <button type="button" onClick={() => handleDeleteLesson(l.id, link.id)} style={{ color: C.inkSoft }}><X size={13} /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        <input type="date" value={newLessonDate} onChange={(e) => setNewLessonDate(e.target.value)}
                          className="rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.paper }} />
                        <input type="time" value={newLessonTime} onChange={(e) => setNewLessonTime(e.target.value)}
                          className="rounded-lg border p-1.5 text-xs" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <input type="text" value={newLessonNote} onChange={(e) => setNewLessonNote(e.target.value)}
                        placeholder="メモ（任意）" maxLength={100}
                        className="w-full rounded-lg border p-1.5 text-xs mt-1.5" style={{ borderColor: C.line, background: C.paper }} />
                      <button type="button" onClick={() => handleCreateLesson(link.id)}
                        className="w-full py-2 rounded-full text-xs font-medium mt-2" style={{ background: C.curtain, color: "#FFFDF8" }}>
                        レッスンを追加
                      </button>
                    </div>

                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">{t("teacherOnlyNoteTitle")}</h3>
                      <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("teacherOnlyNoteDesc")}</p>
                      <textarea value={teacherNoteDraft} rows={4}
                        onChange={(e) => setTeacherNoteDraft(e.target.value)}
                        onBlur={() => handleSaveTeacherNote(link.id, teacherNoteDraft)}
                        placeholder="次回のレッスンで伝えたいこと、経過など"
                        className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      {teacherNoteSaveStatus === "saving" && <p className="text-xs mt-1" style={{ color: C.inkSoft }}>保存中…</p>}
                      {teacherNoteSaveStatus === "saved" && <p className="text-xs mt-1" style={{ color: C.inkSoft }}>保存しました</p>}
                    </div>

                    <button type="button" onClick={() => handleRevokeLink(link.id, "teacher")}
                      className="w-full py-2 rounded-full text-xs font-medium border" style={{ borderColor: C.line, color: C.curtain }}>
                      この生徒との連携を解除する
                    </button>
                  </div>
                );
              })() : (
              <div className="space-y-4">
                <h2 className="ff-display italic text-xl" style={{ color: C.ink }}>{t("tabLesson")}</h2>

                {myTeachingLessons.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("allStudentsLessonCalendarTitle")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>担当する生徒すべてのレッスンを、1つのカレンダーにまとめています。</p>
                    <LessonCalendar lessons={myTeachingLessons} selectable={false} getStudentName={orgDisplayName} t={t} />
                  </div>
                )}

                <h3 className="ff-display italic text-lg" style={{ color: C.ink }}>{t("studentListTitle").replace("{n}", myStudentLinks.length)}</h3>
                {myStudentLinks.map((link) => {
                  const scope = link.share_scope || {};
                  const studentEntries = studentEntriesCache[link.student_id];
                  const summary = studentEntries ? computeStudentSummary(studentEntries, link) : null;
                  const studentProfessionLabel = t(PROFESSION_LABEL_KEYS[link.student && link.student.vocal_profession] || "professionSinger");
                  const studentDisplayName = (link.student && link.student.display_name) || studentProfessionLabel;
                  return (
                    <div key={link.id} className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.line }}>
                      <button type="button"
                        onClick={() => {
                          setViewingStudentLink(link);
                          fetchStudentEntries(link.student_id);
                          fetchTeacherNote(link.id);
                          fetchLessonsForLink(link.id);
                          fetchCommentsForLink(link.id);
                        }}
                        className="w-full text-left p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{studentDisplayName}</p>
                          <p className="text-xs" style={{ color: C.inkSoft }}>{studentProfessionLabel}</p>
                          {summary && (
                            <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                              {summary.daysSinceLastRecord === 0 ? "今日記録あり" : summary.daysSinceLastRecord != null ? `最終記録：${summary.daysSinceLastRecord}日前` : "記録がまだありません"}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={16} style={{ color: C.inkSoft }} />
                      </button>
                    </div>
                  );
                })}
                <p className="text-xs" style={{ color: C.inkSoft }}>
                  ※ 生徒が公開範囲を変更・解除すると、この画面の表示もすぐに切り替わります。
                </p>

                {/* ここから下は、普段は使わない設定類。開くまで最小化しておく。 */}
                <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                  <summary className="p-4 text-sm font-medium cursor-pointer">表示名</summary>
                  <div className="px-4 pb-4">
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                      先生・生徒としてつながった相手に表示される名前です。先生の場合、生徒のレッスンカレンダーにこの名前が表示されます。空欄のままでも構いません（その場合は職業名などで代替表示されます）。
                    </p>
                    <input type="text" defaultValue={profile.display_name} maxLength={30}
                      onBlur={(e) => { if (e.target.value !== profile.display_name) handleSaveDisplayName(e.target.value); }}
                      placeholder="例：やまだ先生" className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                  </div>
                </details>

                {canSeeBetaFeatures(profile) && (
                  <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                    <summary className="p-4 text-sm font-medium cursor-pointer">{t("inviteStudentTitle")}</summary>
                    <div className="px-4 pb-4">
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        発行したコードは7日間有効・1回だけ使えます。
                      </p>
                      {myStudentLinks.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs font-medium" style={{ color: C.ink }}>連携中の生徒（{myStudentLinks.length}人）</p>
                          {myStudentLinks.map((link) => (
                            <div key={link.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: C.paper }}>
                              <span className="text-xs" style={{ color: C.inkSoft }}>{(link.student && link.student.display_name) || "生徒"}</span>
                              <button type="button" onClick={() => handleRevokeLink(link.id, "teacher")}
                                className="text-xs underline" style={{ color: C.curtain }}>{t("disconnectButton")}</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {generatedInviteCode ? (
                        <p className="ff-mono text-center text-2xl tracking-widest py-2 rounded-lg" style={{ background: C.paper, color: C.curtain }}>
                          {generatedInviteCode}
                        </p>
                      ) : (
                        <button type="button" onClick={handleGenerateTeacherInvite}
                          className="w-full py-2.5 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                          {t("inviteTeacherButton")}
                        </button>
                      )}
                      {inviteError && (
                        <p className="text-xs mt-2 rounded-lg p-2.5" style={{ background: "rgba(184,49,49,0.12)", color: C.curtain }}>
                          {inviteError}
                        </p>
                      )}
                    </div>
                  </details>
                )}

                <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                  <summary className="p-4 text-sm font-medium cursor-pointer">{t("joinClassroomTitle")}</summary>
                  <div className="px-4 pb-4">
                    {pendingOrgInvitation ? (
                      <div>
                        <p className="text-sm mb-2">「{pendingOrgInvitation.org.name}」に参加しますか？</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleAcceptOrgInvitation}
                            className="flex-1 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>{t("joinButton")}</button>
                          <button type="button" onClick={() => setPendingOrgInvitation(null)}
                            className="flex-1 py-2 rounded-full text-xs font-medium border" style={{ borderColor: C.line, color: C.inkSoft }}>{t("notNowButton")}</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>他の先生の教室に、講師として参加できます。</p>
                        <div className="flex gap-2">
                          <input type="text" value={orgInviteCodeInput} onChange={(e) => setOrgInviteCodeInput(e.target.value)}
                            placeholder={t("enterInvitationCodePlaceholder")} maxLength={8}
                            className="flex-1 rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                          <button type="button" onClick={() => handleLookupOrgInviteCode(orgInviteCodeInput)}
                            className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>{t("confirmButton")}</button>
                        </div>
                        {orgInviteLookupError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{orgInviteLookupError}</p>}
                      </>
                    )}
                  </div>
                </details>

                {canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "owner" || m.role === "admin").length === 0 && (
                  <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                    <summary className="p-4 text-sm font-medium cursor-pointer">{t("createClassroomTitle")}</summary>
                    <div className="px-4 pb-4">
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        {t("createClassroomDesc")}
                      </p>
                      <button type="button" onClick={async () => { await ensureOwnOrg(); fetchMyOrgs(); }}
                        className="w-full py-2.5 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                        {t("createClassroomTitle")}
                      </button>
                    </div>
                  </details>
                )}

                {canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "owner" || m.role === "admin").map((m) => {
                  const orgId = m.org_id;
                  const isViewingOrg = viewingOrgId === orgId;
                  const members = orgMembers[orgId] || [];
                  const enrollments = orgEnrollments[orgId] || [];
                  const assignments = orgAssignments[orgId] || [];
                  return (
                    <details key={orgId} className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}
                      onToggle={(e) => { if (e.target.open) fetchOrgDetail(orgId); }}>
                      <summary className="p-4 text-sm font-medium cursor-pointer">{m.org ? m.org.name : "（教室情報を読み込めませんでした）"}（{m.role === "owner" ? "オーナー" : "管理者"}）</summary>
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1.5">講師を招待する</p>
                          {generatedOrgInviteCode ? (
                            <p className="ff-mono text-center text-xl tracking-widest py-2 rounded-lg" style={{ background: C.paper, color: C.curtain }}>{generatedOrgInviteCode}</p>
                          ) : (
                            <button type="button" onClick={() => handleGenerateOrgInvite(orgId)}
                              className="w-full py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>招待コードを発行する</button>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1.5">メンバー（{members.length}人）</p>
                          {members.map((mem) => (
                            <div key={mem.id} className="rounded-lg p-2 mb-1 flex items-center justify-between text-xs" style={{ background: C.paper }}>
                              <span>{orgDisplayName(mem.user_id)}</span>
                              <select value={mem.role} onChange={(e) => handleChangeRole(orgId, mem.id, mem.user_id, e.target.value)}
                                className="rounded border text-xs p-1" style={{ borderColor: C.line, background: C.card }}>
                                <option value="owner">オーナー</option>
                                <option value="admin">管理者</option>
                                <option value="teacher">講師</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1.5">在籍している生徒（{enrollments.length}人）と担当</p>
                          {enrollments.map((en) => {
                            const currentAssignments = assignments.filter((a) => a.student_id === en.student_id);
                            return (
                              <div key={en.id} className="rounded-lg p-2 mb-1.5" style={{ background: C.paper }}>
                                <p className="text-xs mb-1">生徒: {orgDisplayName(en.student_id)}</p>
                                {currentAssignments.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between text-xs mb-1">
                                    <span>{t("assignedTeacherLabel")}: {orgDisplayName(a.teacher_id)}</span>
                                    <button type="button" onClick={() => handleUnassignTeacher(orgId, a.id)} className="underline" style={{ color: C.curtain }}>外す</button>
                                  </div>
                                ))}
                                <select onChange={(e) => { if (e.target.value) { handleAssignTeacherToStudent(orgId, e.target.value, en.student_id); e.target.value = ""; } }}
                                  className="w-full rounded border text-xs p-1 mt-1" style={{ borderColor: C.line, background: C.card }}>
                                  <option value="">＋ 講師を割り当てる</option>
                                  {members.map((mm) => (
                                    <option key={mm.user_id} value={mm.user_id}>{orgDisplayName(mm.user_id)}（{mm.role}）</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
              )
            )}

            {activeTab === "garden" && (
              <CharacterHome
                professions={effectiveProfessions}
                entries={entries}
                ownedKeys={ownedItemKeys}
                equipped={characterEquipped}
                pointsSpent={characterPointsSpent}
                onPurchase={handlePurchaseItem}
                onEquip={handleEquipItem}
                onTogglePlacement={handleTogglePlacement}
                onUpdatePosition={handleUpdatePosition}
                isDirty={characterDirty}
                saveStatus={characterSaveStatus}
                onSave={handleSaveCharacter}
                t={t}
              />
            )}

            {activeTab === "notes" && (
              <div className="flex rounded-full border p-1 mb-4" style={{ borderColor: C.line }}>
                <button onClick={() => setNotesSubTab("calendar")}
                  className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                  style={{ background: notesSubTab === "calendar" ? C.curtain : "transparent", color: notesSubTab === "calendar" ? "#FFFDF8" : C.inkSoft }}>
                  カレンダー
                </button>
                <button onClick={() => setNotesSubTab("practice")}
                  className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                  style={{ background: notesSubTab === "practice" ? C.curtain : "transparent", color: notesSubTab === "practice" ? "#FFFDF8" : C.inkSoft }}>
                  稽古ノート
                </button>
                <button onClick={() => setNotesSubTab("memo")}
                  className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                  style={{ background: notesSubTab === "memo" ? C.curtain : "transparent", color: notesSubTab === "memo" ? "#FFFDF8" : C.inkSoft }}>
                  メモ
                </button>
              </div>
            )}
            {activeTab === "notes" && notesSubTab === "practice" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs mb-2" style={{ color: C.inkSoft }}>いまの目標</p>
                  {!editingPracticeGoal ? (
                    profile.practice_goal ? (
                      <>
                        <p className="text-base font-medium">{profile.practice_goal}</p>
                        <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                          {(profile.practice_goal_tags || []).map((t) => `#${(GOAL_TAGS.find((g) => g.key === t) || {}).label}`).join("　")}
                          {profile.practice_goal_started_at && (
                            <>　{profile.practice_goal_started_at}〜（{Math.max(1, Math.floor((new Date(todayISO()) - new Date(profile.practice_goal_started_at)) / 86400000) + 1)}日目）</>
                          )}
                        </p>
                        <button type="button" onClick={() => { setPracticeGoalDraft(profile.practice_goal); setPracticeGoalTagsDraft(profile.practice_goal_tags || []); setEditingPracticeGoal(true); }}
                          className="text-xs underline mt-2" style={{ color: C.inkSoft }}>編集</button>
                      </>
                    ) : (
                      <button type="button" onClick={() => { setPracticeGoalDraft(""); setPracticeGoalTagsDraft([]); setEditingPracticeGoal(true); }}
                        className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-medium" style={{ borderColor: C.line, color: C.inkSoft }}>
                        ＋目標を設定する
                      </button>
                    )
                  ) : (
                    <>
                      <input type="text" value={practiceGoalDraft} placeholder="例: 高音の弱声を安定させる" onChange={(e) => setPracticeGoalDraft(e.target.value)}
                        className="w-full rounded-lg border p-2 text-sm mb-2" style={{ borderColor: C.line, background: C.paper }} />
                      <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>タグ（振り返りに関連グラフが自動で並びます）</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {GOAL_TAGS.map((g) => (
                          <Chip key={g.key} label={g.label} active={practiceGoalTagsDraft.includes(g.key)}
                            onClick={() => setPracticeGoalTagsDraft((prev) => prev.includes(g.key) ? prev.filter((x) => x !== g.key) : [...prev, g.key])} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" disabled={!practiceGoalDraft.trim()}
                          onClick={async () => { await handleSetPracticeGoal(practiceGoalDraft.trim(), practiceGoalTagsDraft); setEditingPracticeGoal(false); }}
                          className="flex-1 py-2 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: practiceGoalDraft.trim() ? 1 : 0.5 }}>
                          保存
                        </button>
                        <button type="button" onClick={() => setEditingPracticeGoal(false)}
                          className="flex-1 py-2 rounded-full text-sm font-medium" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                          キャンセル
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {profile.practice_goal && !editingPracticeGoal && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <p className="text-sm font-medium mb-3">今週の振り返り</p>
                    {practiceGoalMetrics.map((m) => (
                      <div key={m.tag} className="mb-3">
                        {m.notYetAvailable ? (
                          <p className="text-xs rounded-lg p-2" style={{ background: C.paper, color: C.inkSoft }}>{m.label}：この指標はまだ記録機能がありません。</p>
                        ) : m.data ? (
                          <>
                            <p className="text-xs mb-1" style={{ color: C.inkSoft }}>{m.label}</p>
                            <div style={{ width: "100%", height: 100 }}>
                              <ResponsiveContainer>
                                <LineChart data={m.data} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                                  <Line type="monotone" dataKey="value" stroke={C.curtain} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                                  <YAxis hide domain={["auto", "auto"]} />
                                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <p className="text-sm font-medium mt-1">{m.summary}</p>
                          </>
                        ) : (
                          <p className="text-xs rounded-lg p-2" style={{ background: C.paper, color: C.inkSoft }}>{m.label}：まだデータが足りません。</p>
                        )}
                      </div>
                    ))}
                    <textarea value={practiceReviewDraft} rows={2} placeholder="感じたことを書く（「変わった気がしない」でも大丈夫です）"
                      onChange={(e) => setPracticeReviewDraft(e.target.value)}
                      className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    <button type="button" disabled={!practiceReviewDraft.trim()}
                      onClick={async () => { await handleAddPracticeReview(practiceReviewDraft); setPracticeReviewDraft(""); }}
                      className="w-full mt-2 py-2 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: practiceReviewDraft.trim() ? 1 : 0.5 }}>
                      書く
                    </button>
                  </div>
                )}

                {(profile.practice_reviews || []).length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <p className="text-sm font-medium mb-3">これまでの振り返り</p>
                    <div className="space-y-2">
                      {[...(profile.practice_reviews || [])].reverse().map((r, i) => (
                        <div key={i} className="rounded-xl p-2.5" style={{ background: C.paper }}>
                          <p className="text-xs ff-mono mb-1" style={{ color: C.inkSoft }}>{r.at}</p>
                          <p className="text-sm" style={{ color: C.ink }}>{r.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(activeTab === "history" || (activeTab === "notes" && notesSubTab === "calendar")) && (
              <div className="space-y-5">
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
                      className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.line }}>
                      <ChevronLeft size={14} />
                    </button>
                    <span className="ff-display italic text-lg">{formatMonthLabel(viewMonth.year, viewMonth.month, language)}</span>
                    <button onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
                      className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.line }}>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {weekdayLabels.map((w, i) => (
                      <div key={i} className="text-xs ff-mono py-1" style={{ color: C.inkSoft }}>{w}</div>
                    ))}
                    {calendarCells.map((c, i) =>
                      c === null ? (
                        <div key={`empty-${i}`} />
                      ) : (
                        <button key={c.iso} onClick={() => { setSelectedDate(c.iso); setActiveTab("today"); }}
                          className="aspect-square rounded-lg flex items-center justify-center text-xs ff-mono relative"
                          style={{
                            // ★升目を値で塗り分けない（§7-5）。赤と緑の格子は、
                            //   良い日と悪い日の通知表に見える。記録が2日でも色は判定を下す。
                            background: C.paper,
                            color: C.ink,
                            border: c.iso === todayISO() ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                            opacity: c.iso > todayISO() ? 0.4 : 1
                          }}>
                          {c.day}
                          {/* 値は大きさで表す。色は1つ（§1-2「色を増やさず、形で区別する」）。
                              周期の帯と衝突しないよう、点は升目の上側に置く。 */}
                          {c.entry && typeof c.entry.throatCondition === "number" && (
                            <span aria-hidden="true" style={{
                              position: "absolute", top: 3, left: "50%", transform: "translateX(-50%)",
                              width: 3 + clampLevel(c.entry.throatCondition), height: 3 + clampLevel(c.entry.throatCondition),
                              borderRadius: "50%", background: SERIES.s2
                            }} />
                          )}
                          {/* ★帯（§5-1）。集計表を別に作らず、既存の月表示に重ねる。
                              声の調子の点と同じ月に並ぶことが目的。
                              濃い赤・ピンクは使わない（§4-2）。 */}
                          {cycleEnabled && bleedingDays.has(c.iso) && (
                            <span aria-hidden="true"
                              style={{
                                position: "absolute", left: 3, right: 3, bottom: 2,
                                height: 3, borderRadius: 2, background: CYCLE_BAND
                              }} />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* ★カレンダーの下に4つだけ（周期記録の設計.md §5-2）。
                    5つ目を足さないこと。
                    「次回の目安」は 直近の開始日 + 平均周期日数 の単純な足し算。
                    ★必ず「ごろ」と書く（§8 医療機器の線）。 */}
                {cycleEnabled && cycleStats && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    {cycleStats.enough ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: C.inkSoft }}>平均周期</span>
                          <span style={{ color: C.ink }}>{cycleStats.averageCycle}日（直近{cycleStats.usedCycles}周期）</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: C.inkSoft }}>ばらつき</span>
                          <span style={{ color: C.ink }}>±{cycleStats.variability}日</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: C.inkSoft }}>出血日数</span>
                          <span style={{ color: C.ink }}>
                            {cycleStats.averageBleeding != null ? `平均${cycleStats.averageBleeding}日` : "まだ出せません"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: C.inkSoft }}>次回の目安</span>
                          <span style={{ color: C.ink }}>
                            {cycleStats.nextEstimate
                              ? `${cycleStats.nextEstimate.slice(5).replace("-", "月")}日ごろ`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // ★3回に満たないうちは平均を出さない。出せない理由を書く。
                      <p className="text-xs" style={{ color: C.inkSoft }}>
                        あと{cycleStats.needMore}回で、平均周期を出せます。
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {monthEntries.length === 0 && (
                    <div className="text-center py-10 text-sm" style={{ color: C.inkSoft }}>
                      この月の記録はまだありません。<br />「今日の記録」タブから記録を始めましょう。
                    </div>
                  )}
                  {monthEntries.map((date) => {
                    const e = entries[date];
                    const ActIcon = (ACTIVITY_OPTIONS.find((a) => a.key === e.activityType) || {}).icon || Music2;
                    return (
                      <div key={date} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        {confirmDeleteDate === date ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm">{t("confirmDeleteRecord")}</span>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleDelete(date)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>{t("btnDeleteConfirm")}</button>
                              <button onClick={() => setConfirmDeleteDate(null)} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: C.line }}>{t("btnCancel")}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center ff-display italic text-base shrink-0"
                              style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                              {levelDynamic(e.throatCondition)}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedDate(date); setActiveTab("today"); }}>
                              <div className="text-sm font-medium">{formatDateLabel(date, language)}</div>
                              <div className="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap" style={{ color: C.inkSoft }}>
                                <ActIcon size={12} />
                                <span>{t((ACTIVITY_OPTIONS.find((a) => a.key === e.activityType) || {}).labelKey) || e.activityType}</span>
                                {entryHasActivityKind(e, "本番") && e.performanceQuality && <span>・{t("targetPerformance")} {levelDynamic(e.performanceQuality)}</span>}
                                {e.location && <span>・{e.location}</span>}
                              </div>
                              {e.mentalReason && (
                                <p className="text-xs mt-1 line-clamp-1" style={{ color: C.inkSoft }}>
                                  <HeartHandshake size={10} className="inline mr-1" style={{ verticalAlign: "middle" }} />
                                  {e.mentalReason}
                                </p>
                              )}
                            </div>
                            <button onClick={() => setConfirmDeleteDate(date)} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ color: C.inkSoft }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "notes" && notesSubTab === "memo" && (
              <div className="space-y-5">
                {voiceMemoEntriesAllTime.length > 0 ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleVoiceMemoReview")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteVoiceMemoReview")}</p>
                    <div className="space-y-2">
                      {voiceMemoEntriesAllTime.map((e) => (
                        <div key={e.date} className="rounded-xl p-2.5 cursor-pointer" style={{ background: C.paper }}
                          onClick={() => { setSelectedDate(e.date); setActiveTab("today"); }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs ff-mono" style={{ color: C.inkSoft }}>{e.date}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                              喉{levelDynamic(e.throatCondition)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                              声{levelDynamic(e.voiceQuality)}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: C.ink }}>{e.voiceMemo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-center py-10" style={{ color: C.inkSoft }}>
                    「声・喉」欄の一口メモを書くと、ここに一覧が表示されます。
                  </p>
                )}
              </div>
            )}

            {activeTab === "analysis" && (
              <div className="space-y-5">
                {/* 改善タスクv2 §4-1(b): 期間セレクタは9番目にあり、その上のカードは
                    セレクタの影響を受けなかった。「期間を1年にしたのに数字が変わらない」
                    という混乱の原因だったので、最上部に移した。期間の効かないカードには
                    その旨をラベルで明示する。 */}
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-3">{t("titleAnalysisPeriod")}</h3>
                  <div className="flex gap-2 flex-wrap">
                    {["week", "month", "year", "all", "custom"].map((p) => (
                      <button key={p} type="button" onClick={() => setAnalysisPeriod(p)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          background: analysisPeriod === p ? C.curtain : C.paper,
                          color: analysisPeriod === p ? "#FFFDF8" : C.inkSoft,
                          border: `1px solid ${analysisPeriod === p ? C.curtain : C.line}`
                        }}>
                        {t(p === "week" ? "periodWeek" : p === "month" ? "periodMonth" : p === "year" ? "periodYear" : p === "all" ? "periodAll" : "periodCustom")}
                      </button>
                    ))}
                    {Object.values(entries).some((e) => entryHasActivityKind(e, "本番")) && (
                      <button type="button" onClick={() => setAnalysisPeriod("aroundPerformance")}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                        style={{
                          background: analysisPeriod === "aroundPerformance" ? C.curtain : C.paper,
                          color: analysisPeriod === "aroundPerformance" ? "#FFFDF8" : C.inkSoft,
                          border: `1px solid ${analysisPeriod === "aroundPerformance" ? C.curtain : C.line}`
                        }}>
                        直近の本番前後
                      </button>
                    )}
                  </div>
                  {analysisPeriod === "custom" && (
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <input type="date" value={analysisCustomStart} onChange={(e) => setAnalysisCustomStart(e.target.value)}
                        className="rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      <span className="text-xs" style={{ color: C.inkSoft }}>〜</span>
                      <input type="date" value={analysisCustomEnd} onChange={(e) => setAnalysisCustomEnd(e.target.value)}
                        className="rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </div>
                  )}
                  {analysisPeriod === "aroundPerformance" && (
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      暦の区切りではなく、直近の本番日を基準にした前後2週間で振り返ります。
                    </p>
                  )}
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                    {t("noteAnalysisPeriodCount").replace("{count}", Object.keys(filteredEntries).length)}
                  </p>
                </div>
                {(() => {
                  // 記録と分析の順番設計 §5.2: ①今日の一言。発見があれば発見、無ければ中立的な事実を出す。
                  // 「調子が悪い日に低い判定が最初に出て、開かなくなる」ことを避けるため、判定より先に置く。
                  if (topDiscoveries.length > 0) {
                    const top = topDiscoveries[0];
                    return (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{top.icon} 今日の一言</p>
                        <p className="text-base font-medium mb-1" style={{ color: C.ink, lineHeight: 1.4 }}>{top.text}</p>
                        {top.detail && <p className="text-xs" style={{ color: C.inkSoft }}>{top.detail}</p>}
                      </div>
                    );
                  }
                  const nextLine = nextUnlock
                    ? `記録${recordedDaysTotal}日目。あと${nextUnlock.days - recordedDaysTotal}日で「${nextUnlock.label}」がひらきます`
                    : `記録${recordedDaysTotal}日目です`;
                  return (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="text-sm" style={{ color: C.inkSoft }}>{nextLine}</p>
                    </div>
                  );
                })()}
                <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="ff-display italic text-lg">{t("titleVocalScore")}</h3>
                    {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                      {t("badgeFixedPeriod").replace("{n}", 14)}
                    </span>
                  </div>
                  <p className="text-xs mb-4" style={{ color: C.inkSoft }}>{t("noteVocalScore")}</p>
                  {!vocalConditionScore.hasEnoughData ? (
                    <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                      {t("noteVocalScoreNotEnough").replace("{count}", vocalConditionScore.daysCount)}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="ff-display italic" style={{ fontSize: "3.4rem", lineHeight: 1, color: C.ink }}>
                          {vocalConditionScore.total}
                        </span>
                        <span className="text-sm mb-1.5" style={{ color: C.inkSoft }}>/ 100</span>
                        {/* ★§3-A: 数字だけでは「今日が良い日なのか」が分からない。
                            直近14日の推移を横に添えるだけで、同じ数字が読めるようになる。 */}
                        <span className="ml-auto mb-1"><Sparkline values={dailyScoreSeries.map((d) => d.score)} /></span>
                      </div>
                      <div className="space-y-2">
                        {vocalConditionScore.components.map((c) => (
                          <div key={c.key}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span style={{ color: C.inkSoft }}>{t(c.labelKey)}</span>
                              <span className="ff-mono" style={{ color: C.ink }}>{Math.round(c.score)}</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.paper }}>
                              <div className="h-full rounded-full" style={{ width: `${c.score}%`, background: C.gold }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {vocalConditionScore.topPullDown && (
                        <p className="text-xs mt-3 rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                          <strong>{t(vocalConditionScore.topPullDown.labelKey)}</strong>が{Math.round(vocalConditionScore.topPullDown.score)}点で、
                          ここが全体を約{vocalConditionScore.topPullDown.pullDown.toFixed(1)}点押し下げています。
                        </p>
                      )}
                      <p className="text-xs mt-4" style={{ color: C.inkSoft }}>
                        {t("noteVocalScoreDisclaimer")}
                      </p>
                    </>
                  )}
                </div>

                {analysisLocks.map.deviation.unlocked ? (
                  deviationScore && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="ff-display italic text-lg">コンディション偏差値</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                          {t("badgeFixedPeriod").replace("{n}", deviationScore.n)}
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        100点満点の絶対評価だと、良い日も悪い日も似た点数に集まりがちです。自分の直近{deviationScore.n}日の分布の中で、今日がどこにいるかで見ます。
                      </p>
                      <div className="flex items-center gap-5">
                        {/* ★§3-C: リングを点列に置き換えた。
                            リングは「7／9日中」しか言えない。点列なら、順位と散らばりを
                            同時に見せられる。良い日と悪い日がどれくらい離れているかが分かる。
                            ★リングの色も、値によって緑・金・赤に変えていた（§7-5 違反）。 */}
                        <div style={{ flexShrink: 0, minWidth: 0 }}>
                          <div className="flex items-baseline gap-1.5">
                            {gateAllows("deviation.tScore", { n: deviationScore.n }) ? (
                              <>
                                <span className="ff-display italic" style={{ fontSize: "1.7rem", color: C.ink }}>{deviationScore.T}</span>
                                <span className="text-xs" style={{ color: C.inkSoft }}>偏差値</span>
                              </>
                            ) : (
                              <>
                                <span className="ff-display italic" style={{ fontSize: "1.7rem", color: C.ink }}>{deviationScore.position}</span>
                                <span className="text-xs" style={{ color: C.inkSoft }}>／{deviationScore.n}日中</span>
                              </>
                            )}
                          </div>
                          <DotStrip values={deviationScore.values} today={deviationScore.today} />
                          <p className="text-[10px]" style={{ color: C.inkSoft }}>低い ← → 高い</p>
                        </div>
                        {gateAllows("deviation.tScore", { n: deviationScore.n }) ? (
                          <p className="text-xs" style={{ color: C.ink }}>
                            今日は<strong>偏差値{deviationScore.T}</strong>。この{deviationScore.n}日間で上から{deviationScore.topPercentPct}%、
                            <strong>{deviationScore.position}番目に良い日</strong>です。
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: C.ink }}>
                            この{deviationScore.n}日間で<strong>{deviationScore.position}番目に良い日</strong>です（上から{deviationScore.topPercentPct}%）。
                          </p>
                        )}
                      </div>
                      {!gateAllows("deviation.tScore", { n: deviationScore.n }) && (
                        <p className="text-xs mt-3" style={{ color: C.inkSoft }}>{t("gateRankOnlyNote")}</p>
                      )}
                      <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                        ※ 絶対値ではなく、自分自身の記録の中での相対的な位置を示す参考値です。
                      </p>
                    </div>
                  )
                ) : null}

                {analysisLocks.map.screamRecovery.visible && (
                  analysisLocks.map.screamRecovery.unlocked ? (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">回復曲線（叫び・悲鳴の収録から）</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        叫び・悲鳴のテイク数が多かった日（あなたの上位25%・{screamRecoveryCurve.p75}テイク以上）を基準に、
                        その日から何日で平常値に戻るかを重ね合わせています（{screamRecoveryCurve.n}件のデータ）。
                      </p>
                      <div className="flex items-end gap-3" style={{ height: 90 }}>
                        {screamRecoveryCurve.curve.map((c) => (
                          <div key={c.tau} className="flex-1 flex flex-col items-center justify-end h-full">
                            {c.avgDeviation != null ? (
                              <div className="w-full rounded-t-lg" style={{
                                height: `${Math.max(4, Math.min(100, 50 - c.avgDeviation * 20))}%`,
                                background: c.avgDeviation >= 0 ? C.sage : C.curtain
                              }} />
                            ) : (
                              <div className="w-full rounded-t-lg" style={{ height: "10%", background: C.line }} />
                            )}
                            <span className="text-xs mt-1" style={{ color: C.inkSoft }}>{c.tau === 0 ? "当日" : `+${c.tau}日`}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium mt-3">
                        {screamRecoveryCurve.recoveredDays != null
                          ? `あなたは叫び・悲鳴の収録から、完全に戻るまで平均${screamRecoveryCurve.recoveredDays}日かかります。`
                          : "この範囲（3日後まで）では、まだ平常値に戻り切っていません。"}
                      </p>
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        ※ 自分の記録上の傾向であり、収録内容や体調によって変わります。
                      </p>
                    </div>
                  ) : null
                )}

                {analysisLocks.map.screamThreshold.visible && (
                  analysisLocks.map.screamThreshold.unlocked ? (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">叫びテイク数の閾値</h3>
                      <p className="text-sm font-medium mt-1 mb-2">
                        あなたの限界は叫び{screamTakeThreshold.k}テイクあたりです。
                      </p>
                      <p className="text-xs" style={{ color: C.inkSoft }}>
                        それを超えた{screamTakeThreshold.overCount}回の収録では、翌日の喉コンディションが平常より平均
                        {Math.abs(screamTakeThreshold.avgDeviationOver).toFixed(1)}段階{screamTakeThreshold.avgDeviationOver < 0 ? "低く" : "変わらず"}記録されています。
                      </p>
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        ※ {screamTakeThreshold.n}件の記録から推定した、自分の記録上の目安です。現場での判断の参考にしてください。
                      </p>
                    </div>
                  ) : null
                )}

                {analysisLocks.map.passaggio.visible && (
                  analysisLocks.map.passaggio.unlocked ? (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">パッサッジョの安定度</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        直近{passaggioStability.n}件の通過感（1〜5）の中央値は{passaggioStability.medianFeel}です。
                      </p>
                      {passaggioStability.alertStreak ? (
                        <p className="text-sm font-medium" style={{ color: C.curtain }}>
                          パッサッジョの通過感が、あなたの平常より低い日が3日続いています。
                        </p>
                      ) : (
                        <p className="text-sm" style={{ color: C.inkSoft }}>直近の通過感は、平常の範囲内です。</p>
                      )}
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        ※ 自分の記録上の傾向であり、他人との比較ではありません。
                      </p>
                    </div>
                  ) : null
                )}

                {singerCostumeVenueEffects.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-3">衣装・会場の効果量</h3>
                    <div className="space-y-3">
                      {singerCostumeVenueEffects.map((r) => (
                        <div key={r.key} className="rounded-xl p-3" style={{ background: C.paper }}>
                          <p className="text-sm font-medium mb-1">{r.label}</p>
                          <p className="text-xs" style={{ color: C.inkSoft }}>
                            {r.key === "costume"
                              ? `衣装の締め付けが強い日は、翌日の声が平均${Math.abs(r.g).toFixed(1)}段階${r.g < 0 ? "悪く" : "変わらず"}記録されています`
                              : `会場の響きがデッドな日は、翌日の声が平均${Math.abs(r.g).toFixed(1)}段階${r.g < 0 ? "悪く" : "変わらず"}記録されています`}
                            （{"★".repeat(r.stars)}{"☆".repeat(4 - r.stars)}）
                          </p>
                          {r.values1 && r.values0 && (
                            <div className="mt-2">
                              <GroupDotPlot values1={r.values1} values0={r.values0}
                                label1={r.key === "costume" ? "締め付けが強い日" : "デッドな会場の日"}
                                label0="それ以外の日" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                      ※ 自分の記録上の傾向であり、件数が少ないうちは変わることがあります。
                    </p>
                  </div>
                )}

                {analysisLocks.map.sffDiurnal.visible && (
                  analysisLocks.map.sffDiurnal.unlocked ? (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">話声位の日内変動</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        朝と終業後の話声位（SFF）の差を、直近{sffDiurnalVariation.n}件から見ています。上がる人・下がる人がいて、方向自体があなたの特性です。
                      </p>
                      <p className="text-sm font-medium">
                        あなたは仕事終わりに話声位が平均{Math.abs(sffDiurnalVariation.medianDelta)}Hz{sffDiurnalVariation.direction}。
                      </p>
                      {sffDiurnalVariation.isTodayExtreme && (
                        <p className="text-sm font-medium mt-1" style={{ color: C.curtain }}>
                          今日は{Math.abs(sffDiurnalVariation.todayDelta)}Hz{sffDiurnalVariation.todayDelta < 0 ? "下がって" : "上がって"}いて、この2週間で最大の変化です。
                        </p>
                      )}
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        ※ 自分の記録上の傾向であり、他人との比較ではありません。
                      </p>
                    </div>
                  ) : null
                )}

                {analysisLocks.map.tourEndurance.visible && (
                  analysisLocks.map.tourEndurance.unlocked ? (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">ツアー耐久曲線</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        ツアー初日を0日目にそろえ、過去{tourEnduranceCurve.tourCount}本のツアーを重ね合わせています。
                      </p>
                      <div className="flex items-end gap-1.5" style={{ height: 90 }}>
                        {tourEnduranceCurve.curve.map((c) => (
                          <div key={c.tau} className="flex-1 flex flex-col items-center justify-end h-full">
                            {c.avgDeviation != null ? (
                              <div className="w-full rounded-t-lg" style={{
                                height: `${Math.max(4, Math.min(100, 50 - c.avgDeviation * 20))}%`,
                                background: c.tau === tourEnduranceCurve.worstDay ? C.curtain : C.gold
                              }} />
                            ) : (
                              <div className="w-full rounded-t-lg" style={{ height: "10%", background: C.line }} />
                            )}
                            <span className="text-xs mt-1" style={{ color: C.inkSoft }}>{c.tau}</span>
                          </div>
                        ))}
                      </div>
                      {tourEnduranceCurve.worstDay != null && (
                        <p className="text-sm font-medium mt-3">
                          あなたはツアー{tourEnduranceCurve.worstDay}日目に落ちる型です。過去{tourEnduranceCurve.tourCount}本のツアーで同じ傾向が出ています。
                        </p>
                      )}
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        ※ 自分の記録上の傾向です。次のツアーでは、この日の前後に休養を厚くする判断材料にしてください。
                      </p>
                    </div>
                  ) : null
                )}

                {popMusicalEffects.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-3">ツアー中の効いた・響いた習慣</h3>
                    <div className="space-y-3">
                      {popMusicalEffects.map((r) => (
                        <div key={r.key} className="rounded-xl p-3" style={{ background: C.paper }}>
                          <p className="text-sm font-medium mb-1">{r.label}</p>
                          <p className="text-xs" style={{ color: C.inkSoft }}>
                            {r.key === "monitor"
                              ? `インイヤーの日は、ウェッジの日より翌日の声が平均${Math.abs(r.g).toFixed(1)}段階${r.g > 0 ? "良い" : "悪い"}`
                              : r.key === "travel"
                              ? `夜行バス・車中泊で移動した翌日は、平均${Math.abs(r.g).toFixed(1)}段階${r.g < 0 ? "落ちる" : "変わらない"}`
                              : `打ち上げに出た日の翌日は、平均${Math.abs(r.g).toFixed(1)}段階${r.g < 0 ? "落ちる" : "変わらない"}`}
                            （{"★".repeat(r.stars)}{"☆".repeat(4 - r.stars)}）
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                      ※ 自分の記録上の傾向であり、件数が少ないうちは変わることがあります。
                    </p>
                  </div>
                )}

                {topDiscoveries.slice(1).length > 0 && (
                  <div>
                    <h2 className="ff-display italic text-xl mb-3" style={{ color: C.ink }}>今週の発見</h2>
                    <div className="space-y-3">
                      {topDiscoveries.slice(1).map((d) => (
                        <div key={d.id} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                          <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{d.icon} 見つかりました</p>
                          <p className="text-base font-medium mb-2" style={{ color: C.ink, lineHeight: 1.4 }}>{d.text}</p>
                          {d.detail && <p className="text-xs" style={{ color: C.inkSoft }}>{d.detail}</p>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                      ※ その時点でいちばん優先度の高い発見だけを自動で選んで表示しています。詳しい内訳は下の各カードでご確認いただけます。
                    </p>
                  </div>
                )}

                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderVoice")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderVoiceDesc")}
                  </p>
                </div>

                {/* 改善タスクv2 §4-1(f): 「声の状態の予測」と「声の予報」が連続して2つあり、
                    ユーザーから見て違いが分からなかった。1枚のカードに統合する。
                    ★計算は一切変えていない。voicePrediction（前日の記録からの注意点）と
                    todayForecast（回帰モデルの数値予報）は、どちらも従来のまま使っている。 */}
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="ff-display italic text-lg">声の予報</h3>
                    {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                      {t("badgeFixedPeriodPrevDay")}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    前夜の行動から、今日の喉の状態（1〜5）を数値で予報します。記録が14日分たまると、あなた自身の傾向（回帰係数）を一般知見とブレンドして、少しずつ個人化していきます。
                  </p>
                  {!todayForecast.hasData ? (
                    <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                      前日の記録がまだ無いため、予報を組み立てられません。
                    </p>
                  ) : (
                    <>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="ff-display italic" style={{ fontSize: "2.4rem", color: levelInk(Math.round(todayForecast.yhat)) }}>
                              {todayForecast.yhat.toFixed(1)}
                            </span>
                            <span className="text-sm" style={{ color: C.inkSoft }}>/ 5</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                            予測区間 {todayForecast.low.toFixed(1)}〜{todayForecast.high.toFixed(1)}
                          </p>
                        </div>
                        {forecastHitRate ? (
                          <div className="text-right" style={{ maxWidth: 190 }}>
                            <div className="ff-mono" style={{ fontSize: "1.2rem", color: C.ink }}>{forecastHitRate.rate}%</div>
                            <p className="text-xs" style={{ color: C.inkSoft }}>直近{forecastHitRate.n}日の的中率</p>
                            <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("forecastHitDefinition")}</p>
                          </div>
                        ) : forecastHitRateGate.message ? (
                          <p className="text-xs text-right" style={{ color: C.inkSoft, maxWidth: 180 }}>{forecastHitRateGate.message}</p>
                        ) : null}
                      </div>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        {todayForecast.personalizationPct > 0
                          ? `記録${todayForecast.trainN}件をもとに、${todayForecast.personalizationPct}%個人化された式で予報しています。`
                          : `まだ記録${todayForecast.trainN}件（14件で個人化が始まります）。一般知見のみの予報です。`}
                      </p>
                      {todayForecast.topFactor && (
                        <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.ink }}>
                          {todayForecast.topFactor.label}が{todayForecast.topFactor.contribution >= 0 ? "良い方向に" : "厳しい方向に"}いちばん効いています。
                        </p>
                      )}
                      {forecastChartData.length > 0 && (
                        <div style={{ width: "100%", height: 180 }}>
                          <ResponsiveContainer>
                            <ComposedChart data={forecastChartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                              <CartesianGrid stroke={C.line} />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                              <Area dataKey="low" stackId="band" stroke="none" fill="transparent" />
                              <Area dataKey="bandWidth" stackId="band" stroke="none" fill={C.gold} fillOpacity={0.15} />
                              <Line type="monotone" dataKey="yhat" name="予報" stroke={C.gold} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                              <Line type="monotone" dataKey="actual" name="実測" stroke={C.curtain} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                          <span style={{ width: 8, height: 2, background: C.gold, display: "inline-block" }} />予報
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                          <span style={{ width: 8, height: 2, background: C.curtain, display: "inline-block" }} />実測
                        </span>
                      </div>
                    </>
                  )}
                  <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                    ※ 生理学的な一般知見にもとづく参考値であり、医学的な予測ではありません。

                  {/* 統合前は別カードだった「声の状態の予測」。数値の下に、
                      前夜の記録から見た注意点として置く。 */}
                  <div className="mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
                    <p className="text-sm font-medium mb-1" style={{ color: C.ink }}>{t("titleVoicePrediction")}</p>
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("noteVoicePrediction")}</p>
                    {!voicePrediction.hasData ? (
                      <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("notePredictionNoData")}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                          {t("labelBasedOnDate").replace("{date}", formatDateLabel(voicePrediction.date, language))}
                        </p>
                        {voicePrediction.flags.length === 0 ? (
                          <p className="text-xs rounded-xl p-3" style={{ background: "rgba(122,150,109,0.12)", color: C.ink }}>
                            ✓ {t("notePredictionNoFlags")}
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {voicePrediction.flags.map(({ flagKey, explainKey }) => (
                              <div key={flagKey} className="rounded-xl p-3" style={{ background: "rgba(184,49,49,0.06)" }}>
                                <p className="text-xs font-medium" style={{ color: C.curtain }}>⚠ {t(flagKey)}</p>
                                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>{t(explainKey)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                    ※ 生理学的な一般知見にもとづく参考値であり、医学的な予測ではありません。
                  </p>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleTimeOfDayTrend")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteTimeOfDayTrend")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeOfDayStats.map(({ key, icon: SlotIcon, labelKey, avgThroat, avgVoice, n }) => {
                      // 統合実行ルートv4 §6-4: 「調子が良い傾向」バッジは、件数が
                      // 足りている枠どうしでしか比べない。1件の記録で最上位にしない。
                      const comparable = timeOfDayStats.filter((s) => s.avgThroat != null && gateAllows("timeOfDay.badge", { n: s.n }));
                      const best = comparable.reduce((a, b) => (a && a.avgThroat >= b.avgThroat ? a : b), null);
                      const isBest = !!best && best.key === key && comparable.length >= 2;
                      return (
                        <div key={key} className="rounded-xl p-3 text-center" style={{ background: C.paper, border: isBest ? `1.5px solid ${C.gold}` : "none" }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <SlotIcon size={13} style={{ color: C.gold }} />
                            <span className="text-xs font-medium">{t(labelKey)}</span>
                          </div>
                          <div className="ff-display italic text-xl" style={{ color: avgThroat != null ? levelInk(avgThroat) : C.inkSoft }}>
                            {levelDynamic(avgThroat)}
                          </div>
                          <div className="text-xs ff-mono mt-0.5" style={{ color: C.inkSoft }}>
                            {n > 0 ? t("timeOfDayStatLine").replace("{voice}", avgVoice != null ? avgVoice.toFixed(1) : "-").replace("{throat}", avgThroat != null ? avgThroat.toFixed(1) : "-") : t("labelNoRecordShort")}
                          </div>
                          {isBest && <div className="text-xs mt-1" style={{ color: C.ink }}>{t("labelGoodTrend")}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleResonanceChart")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteResonanceChart")}</p>
                  <div style={{ width: "100%", height: 180 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        {/* §3-D: 線は補助、主役は点。本番・レッスンの日を大きく別色で示す。 */}
                        <Line type="monotone" dataKey="resonanceScore" name={t("labelResonanceScore")}
                          stroke={SERIES.s1} strokeWidth={1.8} strokeOpacity={0.3} dot={trendDot} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titlePitchChart")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("notePitchChart")}</p>
                  <div style={{ width: "100%", height: 220 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis
                          domain={["dataMin - 2", "dataMax + 2"]}
                          tickFormatter={(v) => midiToNoteLabel(v)}
                          tick={{ fontSize: 10, fill: C.inkSoft }}
                          width={38}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }}
                          formatter={(value, name, entry) => {
                            const isWake = entry && entry.dataKey === "wakeMidi";
                            const isPianissimo = entry && entry.dataKey === "pianissimoMidi";
                            const label = isWake ? entry.payload.wakeNoteLabel : isPianissimo ? entry.payload.pianissimoNoteLabel : entry.payload.routineNoteLabel;
                            return [label || "-", name];
                          }}
                        />
                        <Line
                          type="monotone" dataKey="wakeMidi" name={t("labelWakeNote")} stroke={C.gold} strokeWidth={2}
                          connectNulls
                          dot={(dotProps) => {
                            const { cx, cy, payload, index } = dotProps;
                            if (payload.wakeMidi == null) return null;
                            return <circle key={`wake-${index}`} cx={cx} cy={cy} r={5} fill={payload.activityColor} stroke={C.gold} strokeWidth={1.5} />;
                          }}
                        />
                        <Line
                          type="monotone" dataKey="routineMidi" name={t("labelRoutineNote")} stroke={C.sage} strokeWidth={2}
                          connectNulls
                          dot={(dotProps) => {
                            const { cx, cy, payload, index } = dotProps;
                            if (payload.routineMidi == null) return null;
                            return <circle key={`routine-${index}`} cx={cx} cy={cy} r={5} fill={payload.activityColor} stroke={C.sage} strokeWidth={1.5} />;
                          }}
                        />
                        <Line
                          type="monotone" dataKey="pianissimoMidi" name="pp最高音" stroke={C.curtain} strokeWidth={2} strokeDasharray="4 3"
                          connectNulls
                          dot={(dotProps) => {
                            const { cx, cy, payload, index } = dotProps;
                            if (payload.pianissimoMidi == null) return null;
                            return <circle key={`pp-${index}`} cx={cx} cy={cy} r={4} fill={C.card} stroke={C.curtain} strokeWidth={1.5} />;
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(ACTIVITY_CHART_COLORS).map(([key, color]) => (
                      <span key={key} className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                        <span style={{ width: 9, height: 9, borderRadius: 999, background: color, display: "inline-block" }} />
                        {t((ACTIVITY_OPTIONS.find((a) => a.key === key) || {}).labelKey) || key}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>{t("notePitchChartLegend")}</p>
                  <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
                    点線（pp最高音）は、平常値と比べてどれくらい変化しているかを「音域到達マップ」でお知らせします。
                  </p>
                </div>

                {analysisLocks.map.warmup.unlocked ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">ウォームアップ効率</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      起き抜けからルーティン後にかけて、声がどれだけ「戻った」かを半音数で見ます。長いほど、よく声が起きた日です。
                    </p>
                    {warmupLatest ? (
                      <div className="rounded-xl p-3 mb-3" style={{ background: C.paper }}>
                        <p className="text-xs" style={{ color: C.ink }}>
                          今朝は <span className="ff-mono" style={{ fontWeight: 600 }}>{warmupLatest.deltaST >= 0 ? "+" : ""}{warmupLatest.deltaST}半音</span>
                          {warmupStats && <>（ふだんは{warmupStats.median >= 0 ? "+" : ""}{warmupStats.median.toFixed(1)}半音）</>}
                          {warmupLatest.deltaSTPerMinute != null && (
                            <> ・ {warmupLatest.routineMinutes}分で{warmupLatest.deltaSTPerMinute.toFixed(2)}半音/分</>
                          )}
                        </p>
                        <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                          {warmupLatest.z != null && warmupLatest.z <= -1.5 && "声が起きるのに、いつもより時間がかかる日です。"}
                          {warmupLatest.z != null && warmupLatest.z >= 1.5 && "いつもよりよく声が起きています。"}
                          {warmupLatest.z != null && warmupLatest.z > -1.5 && warmupLatest.z < 1.5 && "いつも通りの立ち上がりです。"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs rounded-xl p-3 mb-3" style={{ background: C.paper, color: C.inkSoft }}>
                        起き抜けとルーティン後、両方の音名が記録された日がまだありません。
                      </p>
                    )}
                    {warmupWithZ.filter((d) => d.deltaST != null).length > 0 && (() => {
                      const visible = warmupWithZ.filter((d) => d.deltaST != null).slice(-14);
                      const allMidis = visible.flatMap((x) => [x.wakeMidi, x.routineMidi]);
                      const rMin = Math.min(...allMidis), rMax = Math.max(...allMidis);
                      const span = Math.max(1, rMax - rMin);
                      const pct = (v) => ((v - rMin) / span) * 100;
                      return (
                        <div className="space-y-1.5">
                          {visible.map((d) => {
                            const lo = Math.min(d.wakeMidi, d.routineMidi);
                            const hi = Math.max(d.wakeMidi, d.routineMidi);
                            const barColor = d.z >= 1.5 ? C.sage : d.z <= -1.5 ? C.curtain : C.gold;
                            return (
                              <div key={d.date} className="flex items-center gap-2">
                                <span className="text-xs ff-mono shrink-0" style={{ minWidth: "3.4em", color: C.inkSoft }}>{d.dateLabel}</span>
                                <div style={{ position: "relative", flex: 1, height: 14 }}>
                                  <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 2, background: C.line }} />
                                  <div style={{ position: "absolute", top: 5, left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%`, height: 4, borderRadius: 2, background: barColor }} />
                                  <div style={{ position: "absolute", top: 2, left: `calc(${pct(d.wakeMidi)}% - 5px)`, width: 10, height: 10, borderRadius: 999, background: C.gold, border: `1.5px solid ${C.card}` }} />
                                  <div style={{ position: "absolute", top: 2, left: `calc(${pct(d.routineMidi)}% - 5px)`, width: 10, height: 10, borderRadius: 999, background: C.sage, border: `1.5px solid ${C.card}` }} />
                                </div>
                                <span className="text-xs ff-mono shrink-0" style={{ minWidth: "2.8em", textAlign: "right", color: C.ink }}>{d.deltaST >= 0 ? "+" : ""}{d.deltaST}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: C.gold, display: "inline-block" }} />起き抜け
                      </span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: C.sage, display: "inline-block" }} />ルーティン後
                      </span>
                    </div>
                    {wakeLowNote30dTrend && wakeLowNote30dTrend.declining && (
                      <p className="text-xs mt-3 rounded-xl p-2.5" style={{ background: "rgba(184,49,49,0.06)", color: C.curtain }}>
                        起き抜けの音の高さが、直近でじわじわ下がってきています。疲労が蓄積しているサインかもしれません。
                      </p>
                    )}
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ 平常値は中央値をもとにした参考値です。記録が増えるほど精度が上がります。
                    </p>
                  </div>
                ) : null}

                {analysisLocks.map.rangeMap.unlocked ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="ff-display italic text-lg">音域到達マップ</h3>
                      {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("badgeFixedPeriodAll")}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      記録した地声の音を鍵盤の上に置いています。下段のグレーが自己ベスト、色つきが選んだ期間の到達範囲です。
                    </p>
                    {personalBestRange && rangeThisPeriod ? (
                      <>
                        <PianoKeyboard
                          lowMidi={Math.min(personalBestRange.low, rangeThisPeriod.low, latestPianissimoMidi ?? Infinity) - 1}
                          highMidi={Math.max(personalBestRange.high, rangeThisPeriod.high, latestPianissimoMidi ?? -Infinity) + 1}
                          bestLow={personalBestRange.low}
                          bestHigh={personalBestRange.high}
                          currentLow={rangeThisPeriod.low}
                          currentHigh={rangeThisPeriod.high}
                          newRecord={isNewRecord}
                          pianissimoMidi={latestPianissimoMidi}
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                            <span style={{ width: 14, height: 4, borderRadius: 2, background: C.line, display: "inline-block" }} />
                            自己ベスト（{midiToNoteLabel(personalBestRange.low)}〜{midiToNoteLabel(personalBestRange.high)}）
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                            <span style={{ width: 14, height: 4, borderRadius: 2, background: isNewRecord ? C.gold : C.sage, display: "inline-block" }} />
                            選んだ期間（{midiToNoteLabel(rangeThisPeriod.low)}〜{midiToNoteLabel(rangeThisPeriod.high)}）
                          </span>
                          {latestPianissimoMidi != null && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: C.inkSoft }}>
                              <span style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${C.curtain}`, display: "inline-block" }} />
                              直近の弱声の最高音（{midiToNoteLabel(latestPianissimoMidi)}）
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-3" style={{ color: C.ink }}>
                          {isNewRecord
                            ? "自己ベストを更新する記録が出ています。"
                            : rangeFullnessPct != null
                              ? <>選んだ期間の音域は、自己ベストの<span className="ff-mono" style={{ fontWeight: 600 }}> {rangeFullnessPct}%</span>まで戻ってきています。</>
                              : null}
                        </p>
                        {pianissimoTrend && pianissimoTrend.isLow && (
                          <p className="text-xs mt-2 rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                            弱声の最高音が、あなたの平常値（直近28日の中央値 {midiToNoteLabel(pianissimoTrend.median)}）より低い日が{pianissimoTrend.streak}日続いています。
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                        自己ベストを出すには、あと少し記録が必要です。
                      </p>
                    )}
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ 自己ベストは、単発の記録に振り回されないよう上位／下位5%点を採用しています。
                    </p>
                  </div>
                ) : null}

                {/* 改善タスクv2 §4-1(d): 発声負荷は「声の使用量」なので、身体でも全体でもなく
                    【声】に置く。以前はパネルが最下部、その結論だけが最上部の今日の一言、
                    という具合に画面の両端に分かれていた（同一フラグ化は G2-5 で完了済み）。 */}
                {analysisLocks.map.acwr.unlocked ? (
                  acwrToday && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="ff-display italic text-lg">発声負荷バランス（ACWR）</h3>
                        {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                        <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                          {t("badgeFixedPeriodAll")}
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        直近1週間の発声負荷が、この1か月の平均に対して何倍かを見ます。歌い込みすぎと、積み足りない状態の両方を1つの数字で管理できます。
                      </p>
                      <div className="flex items-end gap-4 mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="ff-display italic" style={{ fontSize: "2.6rem", color: acwrToday.zone ? acwrToday.zone.color : C.ink }}>
                            {acwrToday.value}
                          </span>
                          {acwrToday.zone && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink }}>
                              {acwrToday.zone.label}
                            </span>
                          )}
                        </div>
                      </div>
                      {acwrToday.restProjection != null && (
                        <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.ink }}>
                          明日を休養にすると <span className="ff-mono font-medium">{acwrToday.restProjection}</span>
                          {acwrToday.restZone && <>（{acwrToday.restZone.label}）</>}に戻ります。
                        </p>
                      )}
                      {acwrChartData.length > 0 && (
                        <div style={{ width: "100%", height: 180 }}>
                          <ResponsiveContainer>
                            <LineChart data={acwrChartData} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                              <CartesianGrid stroke={C.line} />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                              <YAxis domain={[0, "auto"]} tick={{ fontSize: 10, fill: C.inkSoft }} />
                              <ReferenceArea y1={0} y2={0.8} fill={C.gold} fillOpacity={0.08} />
                              <ReferenceArea y1={0.8} y2={1.3} fill={C.sage} fillOpacity={0.1} />
                              <ReferenceArea y1={1.3} y2={1.5} fill={C.gold} fillOpacity={0.12} />
                              <ReferenceArea y1={1.5} y2={3} fill={C.curtain} fillOpacity={0.08} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                              {/* ★推定を補った日は、塗りつぶさない白抜きの点にする。
                                  色は変えない（ゾーンの色と衝突するため）。形で区別する。 */}
                              <Line type="monotone" dataKey="acwr" stroke={C.ink} strokeWidth={2} connectNulls
                                dot={(props) => {
                                  const { cx, cy, payload, index } = props;
                                  if (cx == null || cy == null) return null;
                                  return payload.isEstimated
                                    ? <circle key={index} cx={cx} cy={cy} r={3} fill={C.card} stroke={C.ink} strokeWidth={1.5} />
                                    : <circle key={index} cx={cx} cy={cy} r={2} fill={C.ink} />;
                                }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {/* ★推定に頼った日があることを、必ず伝える。
                          実測と推定を混ぜたまま黙っていると、
                          こちらが埋めた値を本人の記録だと思わせてしまう。 */}
                      {acwrEstimatedDays > 0 && (
                        <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                          白い点の{acwrEstimatedDays}日は、活動の記録はあるものの時間が入っていないため、
                          種別ごとの目安の時間で計算しています。開始・終了ボタンか、活動の「分」を入れると実測に変わります。
                        </p>
                      )}
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        帯は目安のゾーン（下から積み足りない・ちょうどいい・増やしすぎ注意・急増）です。1.5を超える急な増やし方は、喉のトラブルと結びつくことが知られています。
                      </p>
                    </div>
                  )
                ) : null}

                {analysisLocks.map.symptomCalendar.unlocked ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="ff-display italic text-lg">症状カレンダーと連鎖</h3>
                      {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("badgeFixedPeriod").replace("{n}", 30)}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      直近30日分の症状を、日付×症状の格子で振り返れます。
                    </p>
                    {symptomGridDates.length > 0 ? (
                      <>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                          {symptomGridDates[0].slice(5)} 〜 {symptomGridDates[symptomGridDates.length - 1].slice(5)}
                        </p>
                        <div style={{ overflowX: "auto" }}>
                          <div style={{ display: "inline-block", minWidth: "100%" }}>
                            {SYMPTOM_OPTIONS.map((symptom) => (
                              <div key={symptom} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                                <div className="text-xs" style={{ minWidth: "6.4em", flexShrink: 0, color: C.inkSoft }}>{t(SYMPTOM_KEYS[symptom])}</div>
                                <div style={{ display: "flex", gap: 2 }}>
                                  {symptomGridDates.map((d) => {
                                    const has = (filteredEntries[d].throatSymptoms || []).includes(symptom);
                                    return (
                                      <div
                                        key={d}
                                        onClick={() => { setSelectedDate(d); setActiveTab("today"); }}
                                        title={d}
                                        style={{ width: 12, height: 12, borderRadius: 3, background: has ? C.curtain : C.paper, cursor: "pointer", flexShrink: 0 }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>まだ症状の記録がありません。</p>
                    )}
                    {Object.keys(symptomStreaks).length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {Object.entries(symptomStreaks).map(([symptom, streak]) => (
                          <p key={symptom} className="text-xs rounded-xl p-2.5" style={{ background: streak >= 7 ? "rgba(184,49,49,0.08)" : streak >= 3 ? "rgba(212,160,23,0.1)" : C.paper, color: C.ink }}>
                            <strong>{t(SYMPTOM_KEYS[symptom])}が{streak}日続いています。</strong>
                            {streak >= 7 && " ふだんより長い状態です。耳鼻咽喉科への相談も選択肢の一つです。"}
                          </p>
                        ))}
                      </div>
                    )}
                    {symptomChainStats.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1.5" style={{ color: C.ink }}>症状の連鎖</p>
                        <div className="space-y-1.5">
                          {symptomChainStats.map((c, i) => (
                            <p key={i} className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                              {t(SYMPTOM_KEYS[c.a])}の翌日に{t(SYMPTOM_KEYS[c.b])}が出る確率は<strong> {Math.round(c.pBGivenA * 100)}%</strong>です（ふだんは{Math.round(c.pB * 100)}%、{c.countA}件中）。
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {symptomJaccardPairs.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium mb-1.5" style={{ color: C.ink }}>よく一緒に出る症状</p>
                        <div className="flex flex-wrap gap-1.5">
                          {symptomJaccardPairs.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: C.paper, color: C.ink }}>
                              {t(SYMPTOM_KEYS[p.a])} + {t(SYMPTOM_KEYS[p.b])}（{p.count}日）
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ あくまで記録上の傾向であり、医学的な診断ではありません。症状が続く場合は耳鼻咽喉科にご相談ください。
                    </p>
                  </div>
                ) : null}

                {hasRefluxCondition && (refluxDinnerGapBins.some((b) => b.n >= 5) || refluxDinnerTagEffects.length > 0) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">逆流と喉の違和感の傾向</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      既往症に登録されている方にだけ表示しています。夕食の内容・時刻と、翌朝の喉の違和感の記録上の関係です。
                    </p>
                    {refluxDinnerGapBins.some((b) => b.n >= 5) && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1.5">夕食から就寝までの間隔別・翌朝の違和感の出現率</p>
                        <div className="space-y-1.5">
                          {refluxDinnerGapBins.filter((b) => b.n >= 5).map((b) => (
                            <div key={b.label} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                              <span>{b.label}</span>
                              <span className="ff-mono" style={{ color: C.inkSoft }}>{Math.round(b.rate)}%（{b.n}日）</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {refluxDinnerTagEffects.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1.5">夕食タグ別の効果</p>
                        <div className="space-y-1.5">
                          {refluxDinnerTagEffects.map((r) => (
                            <div key={r.tag} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                              <span>{r.tag}</span>
                              <span className="ff-mono" style={{ color: C.inkSoft }}>
                                {r.stars <= 1 ? "まだ判断できません" : `g=${r.g.toFixed(2)}（${"★".repeat(r.stars)}${"☆".repeat(4 - r.stars)}）`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ あくまで記録上の傾向であり、因果関係を断定するものではありません。診断・治療のご判断は主治医にご相談ください。
                    </p>
                  </div>
                )}

                {/* 改善タスクv2 §4-1(c): 声のメモ振り返りは読み物なので【声】の最後へ。
                    睡眠は【身体】へ移した。【声】の中にあったうえ、声の測定値グループ
                    （響き／声の高さ／ウォームアップ／音域）を分断していた。 */}

                {voiceMemoEntries.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleVoiceMemoReview")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteVoiceMemoReview")}</p>
                    <div className="space-y-2">
                      {voiceMemoEntries.map((e) => (
                        <div key={e.date} className="rounded-xl p-2.5" style={{ background: C.paper }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs ff-mono" style={{ color: C.inkSoft }}>{e.date}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                              喉{levelDynamic(e.throatCondition)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}` }}>
                              声{levelDynamic(e.voiceQuality)}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: C.ink }}>{e.voiceMemo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderBody")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderBodyDesc")}
                  </p>
                </div>

                {/* 改善タスクv2 §4-1(g): 体重が2回出ていた。摂取 → 結果（体重） →
                    統合評価（エネルギー可用性）の順に整えた。睡眠はここが本来の居場所。 */}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleSleepChart")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteSleepChart")}</p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <BarChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis tick={{ fontSize: 11, fill: C.inkSoft }} unit="h" />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }}
                          formatter={(v, n, p) => [t("chartSleepTooltip").replace("{h}", v).replace("{q}", p.payload.sleepQuality ?? "-"), t("chartNameSleepHours")]}
                        />
                        <Bar dataKey="sleepHours" name={t("chartNameSleepHours")} radius={4}>
                          {timeSeries.map((d, i) => (
                            <Cell key={i} fill={SERIES.s2} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">タンパク質摂取量（体重1kgあたり）の推移</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>破線が「身体データ」で設定した目標係数です。</p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: C.inkSoft }} unit="g/kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <ReferenceLine y={Number(profile.protein_coefficient) || 1.6} stroke={C.gold} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="proteinPerKg" name={t("chartNameActualCoefficient")} stroke={SERIES.s1} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleNutritionWeightChart")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteNutritionWeightChart")}</p>
                  <div style={{ width: "100%", height: 150 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} unit="kcal" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <Bar dataKey="calorieActual" name={t("chartNameCalorieActual")} fill={C.gold} radius={3} />
                        {/* ★目標カロリーの破線は外した（分析画面の描画仕様.md §4-1・§7-6）。
                            破線の下を「足りなかった日」に見せてしまうため。
                            食後就寝までの時間に推奨の2時間の線を引かないと決めたのと同じ話。
                            La Voce の利用者は体型の圧力が強い職業の人たちで、
                            毎日「目標に届かなかった」を見せる画面を作らない。 */}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: "100%", height: 110, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.inkSoft }} unit="kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <Line type="monotone" dataKey="weightKg" name={t("chartNameWeight")} stroke={SERIES.s3} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {/* §4-1 の指定どおりの文言。体重とカロリーは記録として残すが、
                      声の分析には使っていない。そのことを本人に伝える。 */}
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                    ※ 声の分析には使っていません。記録として残しているだけです。
                  </p>
                  <div style={{ width: "100%", height: 110, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.inkSoft }} unit="g/kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <ReferenceLine y={Number(profile.protein_coefficient) || 1.6} stroke={C.gold} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="proteinPerKg" name={t("chartNameActualCoefficient")} stroke={SERIES.s1} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                    3つの指標を、それぞれ実際のスケールのまま、x軸だけ揃えて上下に並べています。1枚のグラフに複数の軸を重ねると、交点の位置が軸の取り方次第で変わってしまうため、この形にしています。
                  </p>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleWeightTrend")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteLast30Days")}</p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: C.inkSoft }} unit="kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <Line type="monotone" dataKey="weightKg" name={t("chartNameWeight")} stroke={SERIES.s3} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {(energyAvailabilityAnalysis.method === "ea"
                  ? energyAvailabilityAnalysis.validEaCount >= 14
                  : energyAvailabilityAnalysis.signalCount > 0) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="ff-display italic text-lg">エネルギー可用性（月次まとめ）</h3>
                      {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("badgeFixedPeriod").replace("{n}", 28)}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      体重や体型ではなく、「消費に対して摂取が足りているか」を見る指標です。日々の変動は水分でブレるため、ここでは長期の傾向だけをお伝えします。
                    </p>
                    {energyAvailabilityAnalysis.method === "ea" ? (
                      <>
                        <p className="text-sm rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                          {energyAvailabilityAnalysis.isLow
                            ? `摂取エネルギーが、直近3週間ほど推定の必要量を下回る状態が続いています（1kgの除脂肪体重あたり約${energyAvailabilityAnalysis.recentAvg.toFixed(0)}kcal/日）。支える力に影響が出ることがあります。気になる場合は管理栄養士や医師にご相談ください。`
                            : `直近のエネルギー可用性は、1kgの除脂肪体重あたり約${energyAvailabilityAnalysis.recentAvg.toFixed(0)}kcal/日です（目安45kcal前後）。`}
                        </p>
                        {energyAvailabilityAnalysis.isEstimated && (
                          <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            ※ 体脂肪率は身長・年齢・性別から推定した値を使っています（推定誤差は標準で約4%）。体組成計をお持ちの場合は「身体データ」欄への入力で精度が上がります。
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                        {energyAvailabilityAnalysis.isLow
                          ? "体重の減少・症状の頻度・休養後の回復・睡眠と疲労感のバランスのうち、複数の項目で気になる傾向が同時に出ています。気になる場合は管理栄養士や医師にご相談ください。"
                          : "現時点では、複数の項目が同時に気になる傾向を示してはいません。"}
                      </p>
                    )}
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                      ※ あくまで記録上の傾向であり、医学的な診断ではありません。
                    </p>
                  </div>
                )}
                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("sectionMental")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderMentalDesc")}
                  </p>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleMentalTrend")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteMentalTrend")}</p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={easeTimeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <Line type="monotone" dataKey="ease" name={t("labelMentalEase")} stroke={C.rust} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {lowEaseEntries.length > 0 && (
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
                      <p className="text-xs font-medium mb-2">{t("labelLowEaseReview")}</p>
                      <div>
                        {lowEaseEntries.slice(0, 10).map((e) => (
                          <div key={e.date} className="text-xs py-2 border-t first:border-t-0" style={{ borderColor: C.line }}>
                            <div className="flex items-center justify-between">
                              <span className="ff-mono cursor-pointer" style={{ color: C.inkSoft }} onClick={() => { setSelectedDate(e.date); setActiveTab("today"); }}>
                                {formatDateLabel(e.date, language)}
                              </span>
                              <span className="ff-mono" style={{ color: C.rust }}>{t("labelMentalEase")} {e.ease}</span>
                            </div>
                            {(e.mentalTags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {e.mentalTags.map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, fontSize: "0.6875rem" }}>
                                    {t(MENTAL_TAG_KEYS[tag]) || tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            {e.mentalReason && <p className="mt-1.5" style={{ color: C.ink }}>{e.mentalReason}</p>}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs mt-3" style={{ color: C.inkSoft }}>{t("noteLowEaseReviewCare")}</p>
                    </div>
                  )}
                </div>
                {(mentalTagStats.low.length > 0 || mentalTagStats.high.length > 0 || (mentalTagStats.gateMessage && (mentalTagStats.lowTotal + mentalTagStats.highTotal) > 0)) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleMentalTagStats")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      {t("noteMentalTagStats")}
                    </p>
                    <div className="space-y-3">
                      {mentalTagStats.low.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1.5" style={{ color: C.rust }}>
                            {t("labelLowEaseTagsHeader").replace("{n}", mentalTagStats.lowTotal)}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {mentalTagStats.low.map(({ tag, count }) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: C.paper, color: C.ink }}>
                                {t(MENTAL_TAG_KEYS[tag]) || tag}（{count}）
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {mentalTagStats.high.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1.5" style={{ color: C.inkSoft }}>
                            {t("labelHighEaseTagsHeader").replace("{n}", mentalTagStats.highTotal)}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {mentalTagStats.high.map(({ tag, count }) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-xs" style={{ background: C.paper, color: C.ink }}>
                                {t(MENTAL_TAG_KEYS[tag]) || tag}（{count}）
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {mentalTagStats.gateMessage && (
                        <p className="text-xs" style={{ color: C.inkSoft }}>{mentalTagStats.gateMessage}</p>
                      )}
                    </div>
                  </div>
                )}
                {/* 改善タスクv2 §4-1(e): 【全体を関連づけた分析】は、名前と違って
                    行き場のないものの寄せ集めになっていた。本番・環境・組み合わせに分けた。
                    発声負荷ACWRは声の使用量なので【声】へ移してある。 */}

                {/* ★中身が1つも無い節は、見出しごと出さないこと。
                    見出しだけが残ると、空のカードが上に居座っているように見える。
                    ロックされたカードは、いちばん下の「この分析を強くする」に
                    集約されるので、ここには何も残らない（G2-11）。 */}
                {analysisLocks.map.peaking.visible && analysisLocks.map.peaking.unlocked && (
                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderPerformance")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderPerformanceDesc")}
                  </p>
                </div>
                )}

                {analysisLocks.map.peaking.visible && (
                  analysisLocks.map.peaking.unlocked ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="ff-display italic text-lg">本番ピーキング曲線</h3>
                      {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("badgeFixedPeriodEvent")}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      過去{peakingCurve.count}回の本番日を「当日＝0」にそろえて重ね合わせた平均です。谷の位置が、あなた固有の仕上がり方の型です。
                    </p>
                    {peakingCurve.lowestDip && (
                      <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.ink }}>
                        あなたは<strong>本番の{Math.abs(peakingCurve.lowestDip.tau)}日前にいちど沈む</strong>型です（過去{peakingCurve.count}回の平均）。
                      </p>
                    )}
                    <div style={{ width: "100%", height: 200 }}>
                      <ResponsiveContainer>
                        <ComposedChart data={peakingCurve.curve.map((c) => ({
                          tau: c.tau === 0 ? "当日" : c.tau > 0 ? `+${c.tau}` : `${c.tau}`,
                          mean: c.mean,
                          low: c.mean != null && c.sd != null ? roundTo1(c.mean - c.sd) : null,
                          bandWidth: c.mean != null && c.sd != null ? roundTo1(c.sd * 2) : null
                        }))} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                          <CartesianGrid stroke={C.line} />
                          <XAxis dataKey="tau" tick={{ fontSize: 10, fill: C.inkSoft }} />
                          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: C.inkSoft }} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                          <Area dataKey="low" stackId="band" stroke="none" fill="transparent" />
                          <Area dataKey="bandWidth" stackId="band" stroke="none" fill={C.gold} fillOpacity={0.15} />
                          <Line type="monotone" dataKey="mean" stroke={C.curtain} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>横軸は本番日を0とした相対日、帯は±1SDです。件数2未満の日は表示していません。</p>

                    {nextPerformanceDate && peakingReversePlan && (
                      <div className="mt-4 pt-3 border-t" style={{ borderColor: C.line }}>
                        <p className="text-sm font-medium mb-2">逆算プラン：次の本番は{nextPerformanceDate.slice(5)}</p>
                        <div className="space-y-1.5">
                          {peakingReversePlan.plan.map((p) => (
                            <div key={p.tau} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                              <span className="font-medium">{addDays(nextPerformanceDate, p.tau).slice(5)}（{p.tau === 0 ? "当日" : `${p.tau}日前`}）</span>
                              <span className="ff-mono" style={{ color: C.inkSoft }}>
                                {p.sleepHours != null ? `睡眠${p.sleepHours}h` : "-"}
                                {p.load != null ? `　負荷${p.load.toFixed(1)}` : ""}
                                {p.waterL != null ? `　水分${p.waterL.toFixed(1)}L` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                          {peakingReversePlan.isGeneral
                            ? `声の調子が良かった本番がまだ2回未満のため、全体の中央値（${peakingReversePlan.basedOnCount}回分）を目安として出しています。`
                            : `声の調子が良かった本番${peakingReversePlan.basedOnCount}回の、各日の行動の中央値です。`}
                        </p>
                      </div>
                    )}
                  </div>
                  ) : null
                )}

                {/* ★同じ理由。快適帯もロケーションも無ければ、見出しを出さない。 */}
                {((analysisLocks.map.envComfort.visible && analysisLocks.map.envComfort.unlocked)
                  || locationStats.confident.length > 0 || locationStats.lowN.length > 0) && (
                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderEnvironment")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderEnvironmentDesc")}
                  </p>
                </div>
                )}

                {analysisLocks.map.envComfort.visible && (
                  analysisLocks.map.envComfort.unlocked ? (
                  comfortZone1D && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="ff-display italic text-lg">環境の快適帯</h3>
                        {/* 改善タスクv2 §4-1(b): 期間セレクタが効かないカードであることを明示する */}
                        <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: C.paper, color: C.inkSoft }}>
                          {t("badgeFixedPeriodAll")}
                        </span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        相対湿度ではなく絶対湿度（空気中の実際の水分量）で見ています。気温が変わると、同じ％でも実際の水分量は変わるためです。
                      </p>
                      {comfortZone1D.range ? (
                        <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.ink }}>
                          あなたの喉の快適帯は <strong>絶対湿度 {comfortZone1D.range.low}〜{comfortZone1D.range.high} g/m³</strong>。
                          {todayEnvPosition && (
                            <>
                              　今日{todayEnvPosition.location ? `の${todayEnvPosition.location}` : ""}
                              （{todayEnvPosition.temp}℃/{todayEnvPosition.rh}%）は AH {todayEnvPosition.ah}
                              で、{todayEnvPosition.ah >= comfortZone1D.range.low && todayEnvPosition.ah <= comfortZone1D.range.high ? "ちょうど快適帯の中です。" : "快適帯から外れています。"}
                            </>
                          )}
                        </p>
                      ) : (
                        <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.inkSoft }}>
                          まだ明確な快適帯は見えていません。気温・湿度・喉の記録が増えると精度が上がります。
                        </p>
                      )}
                      <div style={{ width: "100%", height: 140 }}>
                        <ResponsiveContainer>
                          <BarChart data={comfortZone1D.binStats.map((s) => ({ bin: `${s.bin}`, avg: roundTo1(s.avg), n: s.n }))} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                            <CartesianGrid stroke={C.line} />
                            <XAxis dataKey="bin" tick={{ fontSize: 9, fill: C.inkSoft }} label={{ value: "絶対湿度 g/m³", position: "insideBottom", offset: -2, fontSize: 10, fill: C.inkSoft }} />
                            {/* ★棒グラフの縦軸は0から（描画仕様 §7-12）。
                                1から始めると、3.0 と 3.5 の差が実際の何倍にも見える。
                                線グラフは1〜5のままでよい（規則は棒グラフの話）。 */}
                            <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: C.inkSoft }} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} formatter={(v, n, entry) => [`${v}（${entry.payload.n}件）`, "喉スコア平均"]} />
                            <Bar dataKey="avg" radius={3}>
                              {comfortZone1D.binStats.map((s, i) => (
                                <Cell key={i} fill={s.n >= 2 ? C.sage : C.line} opacity={s.n >= 2 ? 0.8 : 0.4} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {comfortZone2D && (
                        <div className="mt-4">
                          <p className="text-xs font-medium mb-2">気温×湿度の2次元マップ</p>
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  <th></th>
                                  {comfortZone2D.rhBins.map((rh) => (
                                    <th key={rh} style={{ fontSize: "0.5625rem", color: C.inkSoft, padding: "2px 4px" }}>{rh}%</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {comfortZone2D.tBins.map((t) => (
                                  <tr key={t}>
                                    <td style={{ fontSize: "0.5625rem", color: C.inkSoft, padding: "2px 4px", whiteSpace: "nowrap" }}>{t}℃</td>
                                    {comfortZone2D.rhBins.map((rh) => {
                                      const cell = comfortZone2D.cells.find((c) => c.tBin === t && c.rhBin === rh);
                                      if (!cell || cell.n < 2) {
                                        return <td key={rh} style={{ padding: 2 }}><div style={{ width: 30, height: 24, borderRadius: 4, background: C.line, opacity: 0.3 }} /></td>;
                                      }
                                      const intensity = Math.max(0, Math.min(1, (cell.avg - 1) / 4));
                                      return (
                                        <td key={rh} style={{ padding: 2 }}>
                                          <div title={`平均${cell.avg.toFixed(1)}（${cell.n}件）`} style={{ width: 30, height: 24, borderRadius: 4, background: `rgba(75,122,90,${0.15 + intensity * 0.7})` }} />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                        ※ 記録数が少ないマスは灰色にしています。あくまで記録上の傾向です。
                      </p>
                    </div>
                  )
                  ) : null
                )}

                {(locationStats.confident.length > 0 || locationStats.lowN.length > 0) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleLocationTrend")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteLocationTrend")}</p>
                    {locationStats.confident.length > 0 && (
                      <div className="space-y-2">
                        {locationStats.confident.map((s) => (
                          <div key={s.location} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                            <span className="font-medium">{s.location}</span>
                            <span className="ff-mono" style={{ color: C.inkSoft }}>
                              {t("groupStatLine").replace("{throat}", s.avgThroat != null ? s.avgThroat.toFixed(1) : "-").replace("{voice}", s.avgVoice != null ? s.avgVoice.toFixed(1) : "-").replace("{ease}", s.avgEase != null ? s.avgEase.toFixed(1) : "-").replace("{n}", s.n)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {locationStats.lowN.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>まだ3件未満（記録数のみ表示。貯まると平均が出ます）</p>
                        <div className="flex flex-wrap gap-1.5">
                          {locationStats.lowN.map((s) => (
                            <span key={s.location} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.inkSoft }}>
                              {s.location}（{s.n}）
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 analysis-section-head">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderOverall")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderOverallDesc")}
                  </p>
                </div>

                {compositePatternInsight && (compositePatternInsight.sentences.length > 0 || compositePatternInsight.gateMessage) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleCompositeInsight")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      {t("noteCompositeInsight")}
                    </p>
                    {/* 統合実行ルートv4 §6-3: 条件を満たさないときは、消すのではなく
                        「あと◯で何が見えるか」に置き換える。 */}
                    {compositePatternInsight.gateMessage ? (
                      <p className="text-xs leading-relaxed rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                        {compositePatternInsight.gateMessage}
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2">
                          {compositePatternInsight.sentences.map((s, i) => (
                            <p key={i} className="text-xs leading-relaxed rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                              {s}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                          {t("noteCompositeInsightDisclaimer")}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {(restMethodStats.confident.length > 0 || restMethodStats.lowN.length > 0) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleRestMethodTrend")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteRestMethodTrend")}</p>
                    {restMethodStats.confident.length > 0 && (
                      <div className="space-y-2">
                        {restMethodStats.confident.map((s) => (
                          <div key={s.method} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                            <span className="font-medium">{REST_METHOD_KEYS[s.method] ? t(REST_METHOD_KEYS[s.method]) : s.method}</span>
                            <span className="ff-mono" style={{ color: C.inkSoft }}>
                              {t("groupStatLine").replace("{throat}", s.avgThroat != null ? s.avgThroat.toFixed(1) : "-").replace("{voice}", s.avgVoice != null ? s.avgVoice.toFixed(1) : "-").replace("{ease}", s.avgEase != null ? s.avgEase.toFixed(1) : "-").replace("{n}", s.n)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {restMethodStats.lowN.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>まだ3件未満（記録数のみ表示。貯まると平均が出ます）</p>
                        <div className="flex flex-wrap gap-1.5">
                          {restMethodStats.lowN.map((s) => (
                            <span key={s.method} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.inkSoft }}>
                              {REST_METHOD_KEYS[s.method] ? t(REST_METHOD_KEYS[s.method]) : s.method}（{s.n}）
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {cycleTrackingOn(profile) && hasCycleData && cyclePeriodRows.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">周期ごとの並び</h3>
                    {/* ★§3-G 4つに区切って平均を比べるのをやめた。区切り方が結論を
                        作ってしまうため。1周期を1行として、何日目かで並べる。
                        ★この図に解釈の文章を添えないこと。
                        並べれば、本人が自分で気づく。教えない。
                        ★位相の呼び名は書かない（周期記録の設計 §2）。 */}
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      直近{cyclePeriodRows.length}周期を、上から古い順に並べています。横は「何日目か」です。
                    </p>
                    <PeriodBands rows={cyclePeriodRows} />
                    <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                      濃い点はふつう以上、薄い点は低めに記録した日です。
                    </p>
                  </div>
                )}

                {(roleLoadStats.confident.length > 0 || roleLoadStats.lowN.length > 0) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">あなたにとって重い役</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      翌日の落ち込みが大きい順に並んでいます（その人の平常値との偏差）。計算上の負荷は横に添えているだけで、順位には使っていません。
                    </p>
                    {roleLoadStats.confident.length > 0 && (
                      <div className="space-y-3">
                        {roleLoadStats.confident.slice(0, 8).map((r, i) => {
                          const dropPct = Math.max(0, Math.min(100, (-r.avgNextDayDeviation / 2) * 100));
                          const isHeavierThanExpected = r.rankGap >= 2;
                          const isLighterThanExpected = r.rankGap <= -2;
                          return (
                            <div key={r.name} className="rounded-xl p-2.5" style={{ background: C.paper }}>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{i + 1}. {r.name}</span>
                                <span className="ff-mono text-xs" style={{ color: r.avgNextDayDeviation < 0 ? C.curtain : C.sage }}>
                                  翌日 {r.avgNextDayDeviation >= 0 ? "+" : ""}{r.avgNextDayDeviation.toFixed(1)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: C.card }}>
                                <div className="h-full rounded-full" style={{ width: `${dropPct}%`, background: C.curtain }} />
                              </div>
                              <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
                                計算上の負荷 {r.avgLoad.toFixed(0)}・{r.count}回
                                {r.record.confidence !== "entered" && "（推定値）"}
                              </p>
                              {isHeavierThanExpected && (
                                <p className="text-xs mt-1" style={{ color: C.curtain }}>⚠ 計算より重い（音域以外の要因があるかもしれません）</p>
                              )}
                              {isLighterThanExpected && (
                                <p className="text-xs mt-1" style={{ color: C.ink }}>この役はあなたに合っているのかもしれません</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {roleLoadStats.lowN.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>まだ3回未満（記録数のみ表示）</p>
                        <div className="flex flex-wrap gap-1.5">
                          {roleLoadStats.lowN.map((r) => (
                            <span key={r.name} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.inkSoft }}>
                              {r.name}（{r.count}回、あと{Math.max(0, 3 - r.count)}回でランキングに入ります）
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ あくまで記録上の傾向です。「この役は喉を痛める」といった断定ではなく、「翌日の落ち込みが大きい」という観測にとどめています。
                    </p>
                  </div>
                )}

                {effectiveHabitRanking.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">効いた習慣ランキング</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      前日の行動があった日となかった日で、翌日の声のスコア（喉・声の平均）を比べています。件数が少ない項目は★が付かず「まだ判断できません」と表示されます。
                    </p>
                    <div className="space-y-3">
                      {effectiveHabitRanking.slice(0, 8).map((r) => {
                        const inconclusive = r.stars <= 1;
                        const direction = r.g >= 0 ? "良く" : "悪く";
                        return (
                          <div key={r.key} className="rounded-xl p-3" style={{ background: C.paper }}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium">{r.label}</span>
                              <span className="text-xs flex-shrink-0" style={{ color: SERIES.axis }}>
                                {"★".repeat(r.stars)}{"☆".repeat(4 - r.stars)}
                              </span>
                            </div>
                            <div style={{ position: "relative", height: 22, marginTop: 8, marginBottom: 4 }}>
                              {(() => {
                                const scaleMin = -2, scaleMax = 2;
                                const pct = (v) => Math.max(0, Math.min(100, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));
                                return (
                                  <>
                                    <div style={{ position: "absolute", left: 0, right: 0, top: 10, height: 1, background: C.line }} />
                                    <div style={{ position: "absolute", left: `${pct(0)}%`, top: 2, width: 1, height: 18, background: C.line }} />
                                    {/* ★良い方向を緑、悪い方向を赤にしていた（§7-5・§1-4 違反）。
                                        「この習慣は悪い」と色が言い切っていた。方向は0の縦線に対する
                                        左右で読めるので、色を変える必要がない。
                                        判断できないものだけ、淡いほうで描き分ける（濃さの違いではなく、
                                        「まだ確からしくない」という別の意味を持たせている）。 */}
                                    <div style={{ position: "absolute", left: `${pct(r.ciLow)}%`, width: `${pct(r.ciHigh) - pct(r.ciLow)}%`, top: 9, height: 3, borderRadius: 2, background: inconclusive ? SERIES.grid : SERIES.pale }} />
                                    <div style={{ position: "absolute", left: `calc(${pct(r.g)}% - 5px)`, top: 5, width: 10, height: 10, borderRadius: 999, background: inconclusive ? SERIES.axis : SERIES.s1 }} />
                                  </>
                                );
                              })()}
                            </div>
                            <p className="text-xs" style={{ color: C.inkSoft }}>
                              {inconclusive
                                ? `まだ判断できません（あった日${r.n1}件・なかった日${r.n0}件。記録が増えると結論が出ます）`
                                : `この行動があった日（${r.n1}件）は、翌日の声が平均で${direction}記録されています（効果量 g=${r.g.toFixed(2)}）。`}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※「◯◯すると声が良くなる」という保証ではなく、「◯◯した日の翌日は、平均して声が良く記録されている」という記録上の傾向です。
                    </p>
                  </div>
                )}

                {lagCorrelationMap.some((c) => c.n >= 14) && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">声の時差マップ</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      生活の変化は、当日より数日後に声へ出ることがあります。行が生活の変数、列が「何日後に効くか」。色が濃いほど関係が強く、枠のついたマスは統計的にも裏付けのある関係です。
                    </p>
                    {topLagFinding && (
                      <p className="text-xs rounded-xl p-2.5 mb-3" style={{ background: C.paper, color: C.ink }}>
                        見つかりました。<strong>{topLagFinding.variableLabel}の「{topLagFinding.lag}日後」</strong>に、声への関係がいちばん強く出ています（ρ = {topLagFinding.rho.toFixed(2)}）。
                      </p>
                    )}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", fontSize: "0.6875rem", color: C.inkSoft, fontWeight: 500, padding: "2px 6px" }}></th>
                            {[0, 1, 2, 3].map((lag) => (
                              <th key={lag} style={{ fontSize: "0.6875rem", color: C.inkSoft, fontWeight: 500, padding: "2px 6px" }}>{lag}日後</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {LAG_VARIABLES.map((v) => (
                            <tr key={v.key}>
                              <td style={{ fontSize: "0.6875rem", color: C.ink, padding: "2px 6px", whiteSpace: "nowrap" }}>{v.label}</td>
                              {[0, 1, 2, 3].map((lag) => {
                                const cell = lagCorrelationMap.find((c) => c.variableKey === v.key && c.lag === lag);
                                if (!cell || cell.n < 14) {
                                  return (
                                    <td key={lag} style={{ padding: 3 }}>
                                      <div title={`記録${cell ? cell.n : 0}日分（14日で解放）`} style={{ width: 40, height: 28, borderRadius: 6, background: C.line, opacity: 0.35 }} />
                                    </td>
                                  );
                                }
                                const rho = cell.rho || 0;
                                const intensity = Math.min(1, Math.abs(rho));
                                const color = rho >= 0
                                  ? `rgba(75,122,90,${0.15 + intensity * 0.7})`
                                  : `rgba(184,49,49,${0.15 + intensity * 0.7})`;
                                return (
                                  <td key={lag} style={{ padding: 3 }}>
                                    <div
                                      title={`ρ=${rho.toFixed(2)}（n=${cell.n}）`}
                                      style={{
                                        width: 40, height: 28, borderRadius: 6, background: color,
                                        border: cell.significant ? `2px solid ${C.ink}` : "2px solid transparent",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.625rem", color: C.ink, fontFamily: "monospace"
                                      }}
                                    >
                                      {rho.toFixed(1)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ 灰色のマスはまだ記録が14日分たまっていません。枠のついた濃い色のマスだけが、複数の比較を行った上でも統計的に裏付けのある関係です（それ以外は偶然の可能性があります）。
                    </p>
                  </div>
                )}

                <div className="flex rounded-full border p-1" style={{ borderColor: C.line }}>
                  <button onClick={() => setAnalysisTarget("performance")}
                    className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                    style={{ background: analysisTarget === "performance" ? C.curtain : "transparent", color: analysisTarget === "performance" ? "#FFFDF8" : C.inkSoft }}>
                    {t("targetPerformance")}
                  </button>
                  <button onClick={() => setAnalysisTarget("throat")}
                    className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                    style={{ background: analysisTarget === "throat" ? C.curtain : "transparent", color: analysisTarget === "throat" ? "#FFFDF8" : C.inkSoft }}>
                    {t("targetThroat")}
                  </button>
                  <button onClick={() => setAnalysisTarget("ease")}
                    className="flex-1 py-2 rounded-full text-xs sm:text-sm font-medium transition-all"
                    style={{ background: analysisTarget === "ease" ? C.curtain : "transparent", color: analysisTarget === "ease" ? "#FFFDF8" : C.inkSoft }}>
                    {t("targetEase")}
                  </button>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-14 text-sm rounded-2xl border" style={{ color: C.inkSoft, borderColor: C.line }}>
                    {analysisTarget === "performance"
                      ? t("noteEmptyPerformanceCorr")
                      : t("noteEmptyGeneralCorr")}
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-2">{t("titleCorrelationStrength")}</h3>
                      <p className="text-xs mb-3 leading-relaxed rounded-xl p-2.5" style={{ color: C.inkSoft, background: C.paper }}>
                        {t("noteCorrDirection").split(/(\{right\}|\{left\})/g).map((part, i) => {
                          // ★色だけに意味を持たせない（§1-2）。「右」「左」という言葉が、すでに意味を持っている。
                          //   緑は文字に使えないので（実測 2.76）、太さで読ませる。
                          if (part === "{right}") return <span key={i} style={{ color: C.ink, fontWeight: 600 }}>{t("wordRight")}</span>;
                          if (part === "{left}") return <span key={i} style={{ color: C.ink, fontWeight: 600 }}>{t("wordLeft")}</span>;
                          return <span key={i}>{part}</span>;
                        })}
                      </p>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <CartesianGrid horizontal={false} stroke={C.line} />
                            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: C.ink }} />
                            <Tooltip formatter={(v) => [Number(v).toFixed(2), t("chartNameCorrelation")]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                            <ReferenceLine x={0} stroke={C.inkSoft} />
                            <Bar dataKey="r" radius={4} onClick={(d) => setSelectedFactorKey(d.key)} cursor="pointer">
                              {chartData.map((r) => (
                                <Cell key={r.key} fill={r.r >= 0 ? C.sage : C.curtain} opacity={r.key === selectedFactorKey ? 1 : 0.55} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* ★§3-I 選んだ項目の散布図。点のみ。回帰直線を引かない。
                          引いた瞬間に「予測」になり、3ゲートの外に出る。
                          ★探索族は「図だけ」。ρ の数値も文章も出さない（族の設計 §1）。
                          中核族のときだけ ρ を数字で添える。 */}
                      {(() => {
                        const sel = correlationResults.find((r) => r.key === selectedFactorKey && (r.pairs || []).length > 0);
                        if (!sel) return null;
                        const canState = mayStateFinding(sel.key);
                        return (
                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                            <p className="text-xs mb-1" style={{ color: C.inkSoft }}>{sel.label}</p>
                            <CorrelationScatter pairs={sel.pairs} xLabel={sel.label} yLabel={t("labelThroatCondition")} />
                            {canState ? (
                              <p className="text-xs mt-1" style={{ color: C.inkSoft }}>
                                ρ = {sel.r != null ? sel.r.toFixed(2) : "—"}（{sel.n}日）
                              </p>
                            ) : (
                              <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{EXPLORE_NOTE}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* ★周期の族は、中核とは別のカードに出します（§1-2）。
                        中核の文章に混ぜないこと。使っている人だけの分析なので、
                        全員が記録する4項目の話と並べると、読む人が取り違えます。
                        ★教師には見えません。cycle_periods は本人のRLSポリシー1本だけで、
                          教師用の SECURITY DEFINER 関数もありません。
                          get_student_entries も cycle_start を常に拒否します。
                          この画面は本人の分析タブで、本人のデータから描いています。 */}
                    {cycleFindings && (() => {
                      const labels = cycleGroupLabels();
                      const passed = gateAllows("diet.narrative", {
                        n1: cycleFindings.n1, n0: cycleFindings.n0,
                        effectSize: cycleFindings.g, fdrPass: cycleFindings.fdrPass
                      });
                      return (
                        <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                          <h3 className="ff-display italic text-lg mb-1">{cycleFindings.label}</h3>
                          <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                            記録した期間の中の日と、それ以外の日を並べています。
                          </p>
                          <GroupDotPlot values1={cycleFindings.values1} values0={cycleFindings.values0}
                            label1={labels.high} label0={labels.low} />
                          {passed ? (
                            <p className="text-xs mt-1" style={{ color: C.ink, lineHeight: 1.7 }}>
                              {labels.high}の喉のコンディションは、{labels.low}より
                              {cycleFindings.g > 0 ? "高め" : "低め"}に記録されています
                              （効果量 {Math.abs(cycleFindings.g).toFixed(2)}、
                              95%区間 {cycleFindings.ciLow.toFixed(2)}〜{cycleFindings.ciHigh.toFixed(2)}）。
                            </p>
                          ) : (
                            <p className="text-xs mt-1" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                              はっきりした関係は、まだ見えていません。
                            </p>
                          )}
                          <p className="text-xs mt-3" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                            ※ 見えたのは関係であって、原因ではありません。
                            この記録は、あなただけが見られます。
                          </p>
                        </div>
                      );
                    })()}

                    {coreFindings.length > 0 && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">中核の4項目</h3>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                          全員が毎日記録する項目だけを、少数にしぼって調べています。
                        </p>
                        <div className="space-y-4">
                          {coreFindings.map((r) => {
                            const labels = groupLabelsFor(r.key);
                            const passed = gateAllows("diet.narrative",
                              { n1: r.n1, n0: r.n0, effectSize: r.g, fdrPass: r.fdrPass });
                            return (
                              <div key={r.key} className="rounded-xl p-3" style={{ background: C.paper }}>
                                <p className="text-sm font-medium mb-1">{r.label}</p>
                                <GroupDotPlot values1={r.values1} values0={r.values0}
                                  label1={labels.high} label0={labels.low} />
                                {passed ? (
                                  <p className="text-xs mt-1" style={{ color: C.ink, lineHeight: 1.7 }}>
                                    {labels.high}の喉のコンディションは、{labels.low}より
                                    {r.g > 0 ? "高め" : "低め"}に記録されています
                                    （効果量 {Math.abs(r.g).toFixed(2)}、95%区間 {r.ciLow.toFixed(2)}〜{r.ciHigh.toFixed(2)}）。
                                  </p>
                                ) : (
                                  <p className="text-xs mt-1" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                                    はっきりした関係は、まだ見えていません。
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs mt-3" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                          ※ 見えたのは関係であって、原因ではありません。
                          はっきりした関係が出るまでには、ふつう3〜4か月かかります。
                        </p>
                      </div>
                    )}

                    {insights.length > 0 && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-2">{t("titleInsights")}</h3>
                        <div className="space-y-2">
                          {insights.map((ins) => (
                            <p key={ins.key} className="text-xs leading-relaxed rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                              {ins.text}
                            </p>
                          ))}
                        </div>
                        <p className="text-xs mt-2" style={{ color: C.inkSoft }}>{t("noteInsightsDisclaimer")}</p>
                      </div>
                    )}

                    {scatterInfo && scatterInfo.r != null && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <h3 className="ff-display italic text-lg">{scatterInfo.label}の散布図</h3>
                          <span className="text-xs ff-mono" style={{ color: C.inkSoft }}>r = {scatterInfo.r.toFixed(2)}（n={scatterInfo.n}）</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{correlationLabel(scatterInfo.r, t)}</p>
                        <p className="text-xs mb-3 leading-relaxed rounded-xl p-2.5" style={{ color: C.inkSoft, background: C.paper }}>
                          {t("noteScatterExplain")}
                        </p>
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                              <CartesianGrid stroke={C.line} />
                              <XAxis type="number" dataKey="x" name={scatterInfo.label} unit={scatterInfo.unit} tick={{ fontSize: 11, fill: C.inkSoft }} />
                              <YAxis type="number" dataKey="y" name={analysisTarget === "performance" ? t("targetPerformance") : analysisTarget === "ease" ? t("targetEase") : t("targetThroat")} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                              {/* §3-I: 点のみ。★回帰直線・近似曲線を引かない。
                                  引いた瞬間に「予測」になり、3ゲートの外に出る。
                                  ρ は上の文章に数値で添えてある（図の上に線として描かない）。 */}
                              <Scatter data={scatterInfo.pairs} fill={SERIES.s1} fillOpacity={0.45} />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
                      {t("noteCorrelationCaveat")}
                    </p>
                  </>
                )}

                {/* 記録と分析の順番設計.md §5.3 ＋ 改善タスクv2 §4-1(a)。
                    ★見出しを1つにまとめること。以前は「これから開く分析」と
                      「この分析を強くする」が縦に並んでいた。どちらも
                      「まだ見られないもの」の話で、利用者から見れば同じ話が
                      2回続く。§5.3 の図も、鍵つきのカードをこの中に置いている。
                    ★順番は「いま動けるもの」が先。待つしかないものを上に置くと、
                      できることが埋もれる。
                    判定は analysisLocks と lib/analysisBoost.js が持っている。 */}
                {(analysisBoostCandidates.length > 0 || analysisLocks.pending.length > 0) && (
                  <div className="pt-2">
                    <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>この分析を強くする</h2>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteUpcomingAnalyses")}</p>

                    {/* ①いま動けるもの（R1: 2枚まで。選定は lib/analysisBoost.js） */}
                    {analysisBoostCandidates.length > 0 && (
                      <div className="space-y-3 mb-3">
                        {/* ★ロック中のカードと同じ型を使うこと（LockedCard）。
                            以前はここだけ独自の作りで、進捗の点も日数の文も無く、
                            ボタンだけが並んでいました。ロック中のカードが2種類あると、
                            並んだときにちぐはぐに見えます。
                            R3 の「記録画面へ直行する」行き先は、型の中に足しました
                            （進捗の下に、ひかえめに置く）。
                            ★入力欄にフォーカスは当てません（キーボードが勝手に出ると、
                              かえって閉じられてしまうため）。 */}
                        {analysisBoostCandidates.map((c) => (
                          <LockedCard key={c.id}
                            title={c.title}
                            teaser={c.body}
                            current={c.current}
                            required={c.required}
                            action={{
                              label: "今日の分を入れる",
                              onClick: () => { if (c.section) jumpToRecordSection(c.section); else setActiveTab("today"); }
                            }} />
                        ))}
                      </div>
                    )}

                    {/* ②待てば開くもの。★§5.4: 灰色の「データ不足」を出さないこと。
                        ぼかし＋進捗バー＋具体的な条件の3点セットは LockedCard が持つ。 */}
                    {analysisLocks.pending.length > 0 && (
                      <div className="space-y-3">
                        {analysisLocks.pending.map((lock) => (
                          <LockedCard key={lock.key} title={lock.title} teaser={lock.teaser}
                            current={lock.current} required={lock.required} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
            {/* 職業別プロファイル設計案 §4-2「畳むのではなく切り出す」。
                ほぼ一生変わらない身体データは、毎日開く「今日の記録」から完全に外へ出す。
                判定基準は「昨日と今日で値が変わりうるか」。変わらないものはここ。 */}
            {activeTab === "profile" && (
              <div className="space-y-5 pb-32">
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h2 className="ff-display italic text-xl mb-1">{t("titleProfileSettings")}</h2>
                  <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteProfileSettings")}</p>
                </div>


                  {/* 職業別プロファイル設計案 §4-2: 恒久項目を、変更頻度の低い順に5つへまとめる。
                      「からだのこと」は受診用サマリーに載る項目をひとまとめにしてあり、
                      医師に見せる前にこのグループだけ見直せば足りる形にしている。 */}

                  {/* 4グループの入力欄は ProfileFieldGroups に集約してある。
                      オンボーディングでも同じ部品を使うため（同じ欄を2箇所に書かない）。 */}
                  <ProfileFieldGroups value={profile} t={t}
                    onChange={(patch) => setProfile((p) => ({ ...p, ...patch }))} />

                  {/* ★以前は sticky bottom-0 をこのコンテナの最後の子に置いていたが、
                      sticky は「自分より下にまだ内容があるとき」しか浮かない。最後尾では
                      滑る余地がゼロで、静的な要素と同じ挙動になっていた。fixed にする。
                      保存の結果も、以前は画面の一番上に出していたため、下までスクロールして
                      ボタンを押すユーザーには画面外で見えなかった。ボタンと同じ場所に置く。 */}
                  <div className="fixed left-0 right-0 bottom-0 z-40 px-4 sm:px-6 pt-6 pb-4"
                    style={{ background: `linear-gradient(to top, ${C.paper} 62%, rgba(246,241,231,0))` }}>
                    <div className="max-w-3xl mx-auto">
                      {profileSaveStatus === "saved" && (
                        <div className="rounded-xl px-3 py-2 mb-2 flex items-center gap-2"
                          style={{ background: "rgba(122,150,109,0.18)", color: C.ink }}>
                          <Check size={15} />
                          <span className="text-xs font-medium">{t("profileSavedBanner")}</span>
                        </div>
                      )}
                      {profileSaveStatus === "error" && (
                        <div className="rounded-xl px-3 py-2 mb-2" style={{ background: "rgba(184,49,49,0.14)", color: C.curtain }}>
                          <p className="text-xs font-medium">{t("profileSaveErrorBanner")}</p>
                        </div>
                      )}
                      <button onClick={handleSaveProfile} disabled={profileSaveStatus === "saving"}
                        className="w-full rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all"
                        style={{ background: C.curtain, color: "#FFFDF8", opacity: profileSaveStatus === "saving" ? 0.7 : 1,
                          boxShadow: "0 6px 20px rgba(36,25,20,0.18)" }}>
                        {profileSaveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                        {profileSaveStatus === "saved" && <Check size={16} />}
                        {profileSaveStatus === "saving" ? t("saveButtonSaving") : t("btnSaveProfileSettings")}
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 mt-2 border-t" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <FileText size={17} style={{ color: C.curtain }} />
                      <h3 className="ff-display italic text-lg" style={{ color: C.curtain }}>{t("groupProfileData")}</h3>
                    </div>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: C.paper }}>
                    <p className="text-sm font-medium mb-1">記録データの同意状況</p>
                    <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                      記録・分析のための取得に{profile.consent_health_data_at ? `${new Date(profile.consent_health_data_at).toLocaleDateString("ja-JP")}に同意済み` : "未同意"}です。
                    </p>
                    <label className="flex items-start gap-2" style={{ cursor: "pointer" }}>
                      <input type="checkbox" checked={!!profile.consent_stats_use_at} className="mt-0.5"
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          const supabase = createClient();
                          const value = checked ? new Date().toISOString() : null;
                          const { error } = await supabase.from("profiles").update({ consent_stats_use_at: value }).eq("id", userId);
                          if (!error) setProfile((p) => ({ ...p, consent_stats_use_at: value }));
                        }} />
                      <span className="text-xs" style={{ color: C.inkSoft }}>
                        （任意）匿名化した統計として、機能改善に役立てることに同意する
                      </span>
                    </label>
                  </div>

                  {/* ★レパートリーの整理は、そもそも身体データではない。
                      「もっと」の中に独立した「データの整理」として切り出す予定（優先度低）。 */}

                  {Object.keys(repertoireTessituraMap).length >= 2 && (
                    <div className="rounded-xl p-3 mt-2" style={{ background: C.paper }}>
                      <p className="text-sm font-medium mb-1">レパートリーの整理</p>
                      <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                        「蝶々夫人」と「蝶々夫人（第2幕）」のように、表記ゆれで別の曲として登録されてしまった場合、ここで1つに統合できます。統合すると、過去の記録もすべて書き換わります。
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>統合される曲（消える方）</label>
                          <select value={mergeSourceRepertoire} onChange={(e) => { setMergeSourceRepertoire(e.target.value); setMergeConfirming(false); }}
                            className="w-full rounded-lg border p-2 text-xs" style={{ borderColor: C.line, background: C.card }}>
                            <option value="">選択してください</option>
                            {Object.keys(repertoireTessituraMap).sort().map((name) => (
                              <option key={name} value={name} disabled={name === mergeTargetRepertoire}>{name}（{repertoireUsageCounts[normalizeTitle(name)]?.count || 0}回）</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>統合先（残る方）</label>
                          <select value={mergeTargetRepertoire} onChange={(e) => { setMergeTargetRepertoire(e.target.value); setMergeConfirming(false); }}
                            className="w-full rounded-lg border p-2 text-xs" style={{ borderColor: C.line, background: C.card }}>
                            <option value="">選択してください</option>
                            {Object.keys(repertoireTessituraMap).sort().map((name) => (
                              <option key={name} value={name} disabled={name === mergeSourceRepertoire}>{name}（{repertoireUsageCounts[normalizeTitle(name)]?.count || 0}回）</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {mergeSourceRepertoire && mergeTargetRepertoire && (
                        <>
                          <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            {findAffectedDatesForRepertoire(mergeSourceRepertoire).length}件の記録が「{mergeTargetRepertoire}」に書き換えられます。この操作は取り消せません。
                          </p>
                          {!mergeConfirming ? (
                            <button type="button" onClick={() => setMergeConfirming(true)}
                              className="mt-2 px-3.5 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                              統合する
                            </button>
                          ) : (
                            <div className="flex gap-2 mt-2">
                              <button type="button" disabled={mergeInProgress}
                                onClick={() => handleMergeRepertoire(mergeSourceRepertoire, mergeTargetRepertoire)}
                                className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8", opacity: mergeInProgress ? 0.6 : 1 }}>
                                {mergeInProgress ? "統合中…" : "本当に統合する（取り消せません）"}
                              </button>
                              <button type="button" onClick={() => setMergeConfirming(false)}
                                className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                やめる
                              </button>
                            </div>
                          )}
                        </>
                      )}
                      {mergeResult && (
                        <p className="text-xs mt-2 rounded-lg p-2" style={{ background: C.card, color: C.ink }}>{mergeResult}</p>
                      )}
                    </div>
                  )}
              </div>
            )}

            {/* 統合実行ルートv4 G3-17: アカウントの削除。3つの別ページに分ける。
                各ページが「知らせる」「取り返しをつける」ための実質を持つこと。 */}
            {activeTab === "deleteAccount1" && (
              <div className="space-y-4">
                <h2 className="ff-display italic text-xl">{t("deleteStep1Title")}</h2>
                <p className="text-sm" style={{ color: C.ink }}>{t("deleteStep1Lead")}</p>
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <ul className="text-sm space-y-1.5">
                    <li>・日々の記録　<strong className="ff-mono">{recordedDaysTotal}</strong> 日分</li>
                    <li>・質問票の回答　<strong className="ff-mono">{questionnaireResponses.length}</strong> 件</li>
                    <li>・稽古ノート・目標・羊のおうちの持ち物</li>
                    <li>・既往症・アレルギー・常用薬・月経周期の記録</li>
                  </ul>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold }}>
                  <p className="text-sm font-medium mb-1">{t("deleteStep1ExportFirst")}</p>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("deleteStep1ExportNote")}</p>
                  <button type="button" onClick={handleExportData} disabled={exportStatus === "working"}
                    className="w-full py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: C.gold, color: "#FFFDF8", opacity: exportStatus === "working" ? 0.7 : 1 }}>
                    {exportStatus === "working" && <Loader2 size={15} className="animate-spin" />}
                    {exportStatus === "working" ? t("exportWorking") : t("labelExportData")}
                  </button>
                  {exportStatus === "done" && (
                    <p className="text-xs mt-2" style={{ color: C.ink }}>{t("exportDone")}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab("more")}
                    className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                    {t("deleteBack")}
                  </button>
                  <button type="button" onClick={() => setActiveTab("deleteAccount2")}
                    className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.curtain}`, color: C.curtain }}>
                    {t("deleteNext")}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "deleteAccount2" && (
              <div className="space-y-4">
                <h2 className="ff-display italic text-xl">{t("deleteStep2Title")}</h2>
                <div className="rounded-2xl p-4 border space-y-2" style={{ background: C.card, borderColor: C.line }}>
                  {myStudentLinks.length === 0 && myTeacherLinks.length === 0 && (
                    <p className="text-sm">{t("deleteStep2NoLinks")}</p>
                  )}
                  {myStudentLinks.length > 0 && (
                    <p className="text-sm leading-relaxed">{t("deleteStep2Teacher").replace("{n}", myStudentLinks.length)}</p>
                  )}
                  {myTeacherLinks.length > 0 && (
                    <p className="text-sm leading-relaxed">{t("deleteStep2Student").replace("{n}", myTeacherLinks.length)}</p>
                  )}
                </div>
                <p className="text-sm rounded-2xl p-3" style={{ background: "rgba(184,49,49,0.08)", color: C.curtain }}>
                  {t("deleteStep2Reregister")}
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab("deleteAccount1")}
                    className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                    {t("deleteBack")}
                  </button>
                  <button type="button" onClick={() => setActiveTab("deleteAccount3")}
                    className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.curtain}`, color: C.curtain }}>
                    {t("deleteNext")}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "deleteAccount3" && (
              <div className="space-y-4">
                <h2 className="ff-display italic text-xl">{t("deleteStep3Title")}</h2>
                <p className="text-sm">{t("deleteStep3Lead")}</p>
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{userEmail}　または　「削除します」</p>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t("deleteConfirmPlaceholder")} autoComplete="off"
                    className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                </div>
                {deleteStatus === "error" && (
                  <p className="text-sm rounded-2xl p-3" style={{ background: "rgba(184,49,49,0.12)", color: C.curtain }}>{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setActiveTab("deleteAccount2")}
                    className="flex-1 py-3 rounded-full text-sm font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                    {t("deleteBack")}
                  </button>
                  <button type="button" onClick={() => handleDeleteAccount("grace")}
                    disabled={deleteStatus === "working" || !deleteConfirmOk}
                    className="flex-1 py-3 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: C.curtain, color: "#FFFDF8", opacity: (deleteStatus === "working" || !deleteConfirmOk) ? 0.4 : 1 }}>
                    {deleteStatus === "working" && <Loader2 size={15} className="animate-spin" />}
                    {deleteStatus === "working" ? t("deleteExecuting") : t("deleteWithGrace")}
                  </button>
                </div>
                {/* A-4「今すぐ完全に削除する」も選べるようにする。
                    ただし既定は猶予つき。取り返しのつかない方を既定にしない。 */}
                <p className="text-xs" style={{ color: C.inkSoft }}>{t("deleteGraceNote").replace("{days}", GRACE_PERIOD_DAYS)}</p>
                <button type="button" onClick={() => handleDeleteAccount("now")}
                  disabled={deleteStatus === "working" || !deleteConfirmOk}
                  className="w-full py-2.5 text-xs underline"
                  style={{ color: C.curtain, opacity: (deleteStatus === "working" || !deleteConfirmOk) ? 0.4 : 1 }}>
                  {t("deleteNowInstead")}
                </button>
              </div>
            )}

            {activeTab === "questionnaires" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h2 className="ff-display italic text-xl mb-1">標準化された質問票</h2>
                  <p className="text-xs" style={{ color: C.inkSoft }}>
                    自己流の5段階評価と違い、学術論文で検証された尺度の構成にもとづいています。同じものさしで記録を重ねることで、自分の変化を追いかけやすくなります。
                  </p>
                  <p className="text-xs mt-2 rounded-xl p-2.5 leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                    ※ ここに出す点数は、いずれもスクリーニング（ふるい分け）目的の参考値であり、医学的な診断ではありません。基準値を超えた場合も、診断名ではなく「受診を検討する目安」として捉えてください。項目文は各尺度の構成（項目数・因子・カットオフ値）にもとづいて作成した簡易版で、原論文（英語）の一字一句の翻訳ではないため、点数を論文の基準値と厳密に比較できることは保証できません。
                  </p>
                </div>

                {!activeQuestionnaire ? (
                  <div className="space-y-3">
                    {Object.values(QUESTIONNAIRES).map((def) => {
                      const history = questionnaireResponses
                        .filter((r) => r.questionnaire_type === def.key)
                        .sort((a, b) => a.response_date.localeCompare(b.response_date));
                      const latest = history[history.length - 1];
                      return (
                        <div key={def.key} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="ff-display italic text-lg">{def.name}</h3>
                              <p className="text-xs" style={{ color: C.inkSoft }}>{def.fullName}（{def.citation}）・{def.frequency}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setActiveQuestionnaire(def.key); setQuestionnaireAnswers({}); setQuestionnaireError(""); }}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                              style={{ background: C.curtain, color: "#FFFDF8" }}
                            >
                              回答する
                            </button>
                          </div>
                          {latest ? (
                            <div className="mt-3 rounded-xl p-3" style={{ background: C.paper }}>
                              <p className="text-xs" style={{ color: C.inkSoft }}>直近の記録（{latest.response_date}）</p>
                              <p className="text-sm mt-1">
                                合計 <span className="ff-mono font-medium">{latest.total_score}</span>点
                                {def.cutoff != null && (
                                  <span className="text-xs ml-2" style={{ color: latest.total_score >= def.cutoff ? C.curtain : C.inkSoft }}>
                                    （基準値 {def.cutoff}）
                                  </span>
                                )}
                              </p>
                              {def.cutoffNote && (
                                <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{def.cutoffNote}</p>
                              )}
                              {latest.factor_scores && (
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  {latest.factor_scores.map((f) => (
                                    <span key={f.name} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.card, color: C.ink }}>
                                      {f.name}: {f.score}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {history.length > 1 && (
                                <div style={{ width: "100%", height: 110 }} className="mt-2">
                                  <ResponsiveContainer>
                                    <LineChart data={history.map((h) => ({ date: h.response_date.slice(5), score: h.total_score }))} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                                      <YAxis hide domain={["auto", "auto"]} />
                                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                                      <Line type="monotone" dataKey="score" stroke={C.gold} strokeWidth={2} dot={{ r: 3 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs mt-3 rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>まだ記録がありません。</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (() => {
                  const def = QUESTIONNAIRES[activeQuestionnaire];
                  const answeredCount = def.items.filter((_, i) => questionnaireAnswers[i] != null).length;
                  return (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="ff-display italic text-lg">{def.name}</h3>
                        <button
                          type="button"
                          onClick={() => { setActiveQuestionnaire(null); setQuestionnaireAnswers({}); setQuestionnaireError(""); }}
                          className="text-xs" style={{ color: C.inkSoft }}
                        >
                          やめる
                        </button>
                      </div>
                      <p className="text-xs mb-4" style={{ color: C.inkSoft }}>{answeredCount}/{def.items.length}問 回答済み</p>
                      <div className="space-y-4">
                        {def.items.map((item, i) => (
                          <div key={i}>
                            <p className="text-sm mb-1.5">{i + 1}. {item}</p>
                            <div className="flex gap-1.5">
                              {Array.from({ length: def.scaleMax + 1 }).map((_, v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setQuestionnaireAnswers((a) => ({ ...a, [i]: v }))}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-medium border"
                                  style={{
                                    background: questionnaireAnswers[i] === v ? C.curtain : C.paper,
                                    color: questionnaireAnswers[i] === v ? "#FFFDF8" : C.inkSoft,
                                    borderColor: questionnaireAnswers[i] === v ? C.curtain : C.line
                                  }}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-between text-xs mt-1" style={{ color: C.inkSoft }}>
                              <span>{def.scaleLabels[0]}</span>
                              <span>{def.scaleLabels[def.scaleLabels.length - 1]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {questionnaireError && <p className="text-xs mt-3" style={{ color: C.curtain }}>{questionnaireError}</p>}
                      <button
                        type="button"
                        disabled={questionnaireSaving}
                        onClick={() => handleSubmitQuestionnaire(def.key)}
                        className="w-full mt-4 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-1.5"
                        style={{ background: C.curtain, color: "#FFFDF8" }}
                      >
                        {questionnaireSaving && <Loader2 size={14} className="animate-spin" />}
                        記録する
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
            {activeTab === "exportSummary" && (() => {
              // ★この紙に解釈を1つも書かないこと（lib/exportSummary.js の頭に理由）。
              //   「多い」「少ない」「良い」「傾向」「改善」— 1つも出しません。
              //   出してよいのは、件数・日付・ファイル名だけです。
              // ★言語はこの文書だけの4分岐（ja/zh/ko/それ以外→en）。
              //   アプリ本体の9言語とは独立しています。
              const sum = buildExportSummary({
                profile,
                entries,
                professionLabel: t(PROFESSION_LABEL_KEYS[profile.vocal_profession] || "professionSinger"),
                exportedAt: new Date().toISOString(),
                uiLanguage: language
              });
              const T = sum.text;
              const row = (label, value) => (
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <span className="text-xs" style={{ color: C.inkSoft }}>{label}</span>
                  <span className="text-sm" style={{ color: C.ink }}>{value}</span>
                </div>
              );
              return (
                <div className="space-y-5">
                  <style>{`@media print { header, nav, .no-print { display: none !important; } }`}</style>
                  <div className="rounded-2xl p-4 border no-print" style={{ background: C.card, borderColor: C.line }}>
                    <button type="button" onClick={() => setActiveTab("more")}
                      className="flex items-center gap-1 text-sm font-medium mb-2" style={{ color: C.inkSoft }}>
                      <ChevronLeft size={16} />戻る
                    </button>
                    <h2 className="ff-display italic text-xl mb-1">記録の控え</h2>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      書き出したデータに、どれだけの記録が入っているかを確かめるための紙です。
                      受診用サマリーとは別のもので、お医者さんに見せるためのものではありません。
                    </p>
                    <button type="button" onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                      印刷 / PDFで保存
                    </button>
                  </div>

                  <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                    <h1 className="ff-display italic text-xl" style={{ color: C.ink }}>{T.title}</h1>
                    <p className="text-xs mt-0.5 mb-4" style={{ color: C.inkSoft }}>{T.createdAt(sum.createdAt)}</p>

                    <p className="text-xs font-medium pt-3 mt-3 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>{T.sectionYou}</p>
                    {row(T.labelName, sum.name || T.notSet)}
                    {row(T.labelProfession, sum.professionLabel || T.notSet)}
                    {row(T.labelStarted, sum.firstDate || T.notSet)}

                    <p className="text-xs font-medium pt-3 mt-3 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>{T.sectionAmount}</p>
                    {row(T.labelDays, T.unitDays(sum.recordedDays))}
                    {row(T.labelRange, sum.firstDate ? `${sum.firstDate} 〜 ${sum.lastDate}` : T.notSet)}

                    <p className="text-xs font-medium pt-3 mt-3 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>{T.sectionItems}</p>
                    {row(T.itemVoice, T.unitDays(sum.items.voice))}
                    {row(T.itemSleep, T.unitDays(sum.items.sleep))}
                    {row(T.itemActivity, T.unitDays(sum.items.activity))}
                    {row(T.itemMeal, T.unitDays(sum.items.meal))}
                    {row(T.itemMental, T.unitDays(sum.items.mental))}
                    {row(T.itemNotes, T.unitCount(sum.items.notes))}

                    <p className="text-xs font-medium pt-3 mt-3 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>{T.sectionFiles}</p>
                    {sum.files.map((f) => (
                      <div key={f.name} className="py-1">
                        <p className="text-sm ff-mono" style={{ color: C.ink }}>{f.name}</p>
                        <p className="text-xs" style={{ color: C.inkSoft }}>{T[f.descKey]}</p>
                      </div>
                    ))}

                    <p className="text-xs leading-relaxed pt-3 mt-4 border-t" style={{ color: C.inkSoft, borderColor: C.line }}>
                      {T.footer}
                    </p>
                  </div>
                </div>
              );
            })()}
            {activeTab === "clinicSummary" && (() => {
              // §5.4: ここには絶対に載せない（あとから「便利だから」と足されがちなので明記しておく）
              // 偏差値／ACWR／ラグ相関（声の時差マップ）／効果量（効いた習慣ランキング）／CPPS／エネルギー可用性
              const { start, end } = clinicPeriodRange;
              return (
                <div className="space-y-5">
                  <style>{`@media print { header, nav, .no-print { display: none !important; } }`}</style>
                  <div className="rounded-2xl p-4 border no-print" style={{ background: C.card, borderColor: C.line }}>
                    <h2 className="ff-display italic text-xl mb-1">受診用サマリー</h2>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      耳鼻咽喉科など受診の際にお使いください。独自の指標(偏差値・発声負荷など)は含めず、記録した内容をそのまま整理しています。
                    </p>
                    <p className="text-xs font-medium mb-1.5">期間</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ["auto", clinicAutoDetectedStart ? `症状が出てから（${clinicAutoDetectedStart.slice(5)}〜）` : "症状が出てから（自動検出）"],
                        ["month", "過去1ヶ月"],
                        ["3months", "過去3ヶ月"],
                        ["custom", "期間を指定"]
                      ].map(([key, label]) => (
                        <button key={key} type="button" onClick={() => setClinicPeriodMode(key)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: clinicPeriodMode === key ? C.curtain : C.paper, color: clinicPeriodMode === key ? "#FFFDF8" : C.inkSoft, border: `1px solid ${clinicPeriodMode === key ? C.curtain : C.line}` }}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {clinicPeriodMode === "custom" && (
                      <div className="flex items-center gap-2 mt-3">
                        <input type="date" value={clinicCustomStart} onChange={(e) => setClinicCustomStart(e.target.value)}
                          className="rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        <span className="text-xs" style={{ color: C.inkSoft }}>〜</span>
                        <input type="date" value={clinicCustomEnd} onChange={(e) => setClinicCustomEnd(e.target.value)}
                          className="rounded-lg border px-2.5 py-1.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                    )}
                    <button type="button" onClick={() => window.print()}
                      className="mt-3 px-3.5 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                      印刷 / PDFで保存
                    </button>
                  </div>

                  <div id="clinic-summary-content" className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                    <p className="text-xs mb-4 rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                      本書はご本人の自己申告に基づく記録です。医学的な診断や検査結果ではありません。
                    </p>
                    <p className="text-xs mb-4" style={{ color: C.inkSoft }}>期間：{start} 〜 {end}</p>

                    <h3 className="text-sm font-medium mb-1.5">基本情報</h3>
                    <p className="text-xs mb-4" style={{ color: C.ink }}>
                      年齢：{profile.age || "未登録"}　性別：{profile.sex ? t(profile.sex === "男性" ? "sexMale" : profile.sex === "女性" ? "sexFemale" : "sexNotAnswer") : "未登録"}
                      　職業：{t(PROFESSION_LABEL_KEYS[profile.vocal_profession] || "professionSinger")}
                      {clinicWeeklyVoiceUsage.length > 0 && <>　1日あたりの平均発声時間：約{roundTo1(clinicWeeklyVoiceUsage.reduce((a, w) => a + w.hours, 0) / (clinicWeeklyVoiceUsage.length * 7))}時間</>}
                    </p>

                    <h3 className="text-sm font-medium mb-1.5">症状の経過</h3>
                    {clinicSymptomSummary.length > 0 ? (
                      <div className="mb-4 space-y-1">
                        {clinicSymptomSummary.map((s) => (
                          <p key={s.symptom} className="text-xs" style={{ color: C.ink }}>
                            {t(SYMPTOM_KEYS[s.symptom])}　{s.firstDate.slice(5)} 〜 {s.lastDate.slice(5)}（{s.count}日）
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs mb-4" style={{ color: C.inkSoft }}>この期間に記録された症状はありません。</p>
                    )}

                    <h3 className="text-sm font-medium mb-1.5">声の使用量（週あたり）</h3>
                    {clinicWeeklyVoiceUsage.length > 0 ? (
                      <div style={{ width: "100%", height: 140 }} className="mb-4">
                        <ResponsiveContainer>
                          <BarChart data={clinicWeeklyVoiceUsage} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                            <CartesianGrid stroke={C.line} />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: C.inkSoft }} />
                            <YAxis tick={{ fontSize: 10, fill: C.inkSoft }} unit="h" />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                            <Bar dataKey="hours" fill={C.gold} radius={3} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs mb-4" style={{ color: C.inkSoft }}>この期間に活動時間の記録はありません。</p>
                    )}

                    <h3 className="text-sm font-medium mb-1.5">睡眠時間の平均</h3>
                    <p className="text-xs mb-4" style={{ color: C.ink }}>
                      {clinicSleepAverage != null ? `${clinicSleepAverage}時間` : "記録なし"}
                    </p>

                    <h3 className="text-sm font-medium mb-1.5">既往・服薬</h3>
                    <p className="text-xs mb-4" style={{ color: C.ink }}>
                      {clinicMedications.length > 0 ? clinicMedications.join("・") : "この期間の登録はありません"}
                    </p>

                    <h3 className="text-sm font-medium mb-1.5">自由記入欄</h3>
                    <textarea value={clinicFreeNote} onChange={(e) => setClinicFreeNote(e.target.value)}
                      placeholder="受診時に手書きで書き足す場合は、このまま余白としてご利用いただけます。"
                      className="w-full rounded-lg border p-2 text-xs no-print" rows={4} style={{ borderColor: C.line, background: C.paper }} />
                    <div className="hidden print:block" style={{ borderBottom: `1px solid ${C.line}`, height: 80 }} />
                  </div>
                </div>
              );
            })()}
            {activeTab === "advice" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot size={18} style={{ color: C.curtain }} />
                    <h3 className="ff-display italic text-lg">{t("titleAIAdvice")}</h3>
                  </div>
                  {!AI_ADVICE_ENABLED ? (
                    <div className="rounded-xl p-4 text-sm" style={{ background: C.paper, color: C.inkSoft }}>
                      {t("labelAdviceComingSoon")}
                    </div>
                  ) : (
                    <>
                      <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
                        直近2週間の記録（食事メモ・自由メモを含む）をもとに、AIが傾向を読み取ってアドバイスします。
                      </p>
                      <button onClick={handleGenerateAdvice} disabled={adviceLoading}
                        className="rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2"
                        style={{ background: C.curtain, color: "#FFFDF8" }}>
                        {adviceLoading && <Loader2 size={14} className="animate-spin" />}
                        {adviceLoading ? t("labelAnalyzing") : t("labelGenerateAdvice")}
                      </button>
                      {adviceError && <p className="text-xs mt-3" style={{ color: C.curtain }}>{adviceError}</p>}
                      {adviceText && (
                        <div className="mt-4 rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
                          {adviceText}
                        </div>
                      )}
                      {adviceGeneratedAt && (
                        <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                          生成日時: {adviceGeneratedAt.toLocaleString("ja-JP")}
                        </p>
                      )}
                    </>
                  )}
                </div>
                {AI_ADVICE_ENABLED && (
                  <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
                    ※ このアドバイスはAIによる一般的な提案であり、医学的な診断ではありません。体調に不安がある場合は医療専門家にご相談ください。
                  </p>
                )}
              </div>
            )}

            {activeTab === "learn" && (() => {
              const currentProfession = learnProfession || profile.vocal_profession || "singer";
              // §7.4: 検索。記事タイトル・本文を職業をまたいで横断する。用語（第7章相当）は無いため、
              // タイトル・本文の部分一致だけで簡易実装する。
              // ★音楽家の商いは有料の記事。課金の線が引かれるまでは、
              //   一覧・検索・本文のすべてを1つの判定で絞る（lib/featureFlags.js）。
              //   一覧には出して本文で止める形にしないこと。読めない記事が
              //   並んでいるのは、鍵をかけられているのと同じ体験になる。
              const canSeeShobai = canSeeShobaiArticles(profile);
              const visibleArticle = (a) => canSeeShobai || !isShobaiArticle(a);
              const learnChapters = canSeeShobai ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7];
              const searchResults = learnSearchQuery.trim()
                ? ARTICLES.filter(visibleArticle).filter((a) =>
                    a.title.includes(learnSearchQuery.trim()) || a.bodyMd.includes(learnSearchQuery.trim()) || (a.terms || []).some((t) => t.includes(learnSearchQuery.trim()))
                  )
                : null;

              if (viewingArticleId) {
                // §7.2: 記事の画面
                const article = getArticleById(viewingArticleId);
                if (!article) return null;
                // ★一覧を絞っているので通常は届かないが、ここでも止める。
                //   入口が1つだと思い込んだところから漏れる、というのを何度か見ている。
                if (!visibleArticle(article)) return null;
                const notes = articleNotes[article.id] || [];
                const isRead = !!learnReadArticles[article.id];
                const professionLabel = article.professions === "all" ? "からだ" : PROFESSION_LABELS[article.professions[0]];
                return (
                  <div className="space-y-4">
                    <button type="button" onClick={() => setViewingArticleId(null)}
                      className="flex items-center gap-1 text-sm font-medium" style={{ color: C.inkSoft }}>
                      <ChevronLeft size={16} />{t("backButton")}
                    </button>
                    <div>
                      <h2 className="ff-display italic text-xl" style={{ color: C.ink }}>{article.title}</h2>
                      <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{professionLabel}・約{article.readMinutes}分</p>
                    </div>
                    {studyReadiness(article).hasPrequestion && (() => {
                      const chosen = prequestionChoice[article.id];
                      const answered = typeof chosen === "number";
                      const after = answerPrequestion();
                      return (
                        <div className="rounded-2xl p-4 border" style={{ background: C.paper, borderColor: C.line }}>
                          <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>読む前に、少しだけ考えてみてください</p>
                          <p className="text-sm mb-3" style={{ color: C.ink, lineHeight: 1.7 }}>{article.prequestion.stem}</p>
                          <div className="space-y-1.5">
                            {(article.prequestion.choices || []).map((choice, i) => (
                              <button key={i} type="button"
                                onClick={() => setPrequestionChoice((s) => ({ ...s, [article.id]: i }))}
                                className="w-full text-left rounded-xl p-2.5 text-sm border"
                                style={{
                                  background: chosen === i ? C.card : C.card,
                                  borderColor: chosen === i ? C.ink : C.line,
                                  color: C.ink,
                                  lineHeight: 1.6
                                }}>
                                {choice}
                              </button>
                            ))}
                          </div>
                          {answered && (
                            <p className="text-xs mt-2.5" style={{ color: C.inkSoft, lineHeight: 1.6 }}>{after.note}</p>
                          )}
                        </div>
                      );
                    })()}

                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <p className="text-sm font-medium mb-3" style={{ lineHeight: 1.7 }}>{article.lead}</p>
                      <div className="text-sm" style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{article.bodyMd}</div>
                    </div>

                    {article.relatedField && (
                      <button type="button" onClick={() => { setActiveTab("today"); setRecordView("day"); }}
                        className="w-full rounded-2xl p-3 border flex items-center justify-between" style={{ background: C.card, borderColor: C.line }}>
                        <span className="text-sm">{t("recordThisFieldToday")}</span>
                        <ChevronRight size={16} style={{ color: C.inkSoft }} />
                      </button>
                    )}

                    {article.sources && article.sources.length > 0 && (
                      <p className="text-xs" style={{ color: C.inkSoft }}>
                        {t("sourcesLabel")}：{article.sources.map((s) => s.label).join("、")}
                      </p>
                    )}

                    <label className="flex items-center gap-2 text-xs" style={{ color: C.inkSoft }}>
                      <input type="checkbox" checked={isRead} onChange={(e) => handleMarkArticleRead(article.id, e.target.checked)} />
                      {t("markAsReadLabel")}
                    </label>

                    {/* ★§2-2 覚えるべき1文。枠で囲むだけ。蛍光ペンのような装飾は使わない。
                        「大事なところに線を引く」のではなく「大事な1文だけを別に置く」。
                        1文が無い記事では、枠ごと出さない（空の枠を見せない）。 */}
                    {shouldShowKeySentence(article) && (
                      <div className="rounded-2xl p-4 border mb-4" style={{ background: C.paper, borderColor: C.line }}>
                        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{KEY_SENTENCE_HEADING}</p>
                        <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{article.keySentence}</p>
                      </div>
                    )}

                    {quizModeOf(article) === "reflect" && (article.prompts || []).length > 0 && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">自分の場合を書く</h3>
                        <div className="space-y-5 mt-3">
                          {article.prompts.map((prompt, pi) => {
                            const key = `${article.id}:${pi}`;
                            const history = reflectNotesFor(notes, pi);
                            const hasEarlier = hasEarlierReflectAnswer(notes, pi);
                            return (
                              <div key={pi}>
                                <p className="text-sm mb-2" style={{ color: C.ink, lineHeight: 1.7 }}>
                                  Q{pi + 1}. {prompt}
                                </p>
                                {history.length > 0 && (
                                  <div className="rounded-xl p-3 mb-2" style={{ background: C.paper }}>
                                    <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{REFLECT_REVISIT_HEADING}</p>
                                    {history.map((n) => (
                                      <div key={n.id} className="mb-2">
                                        <p className="text-xs" style={{ color: C.inkSoft }}>
                                          {String(n.created_at || "").slice(0, 10)}
                                        </p>
                                        <p className="text-sm" style={{ color: C.ink, lineHeight: 1.7 }}>{n.body}</p>
                                        <DeleteWithConfirm t={t}
                                          confirming={confirmDeleteNoteId === n.id}
                                          onAsk={() => setConfirmDeleteNoteId(n.id)}
                                          onCancel={() => setConfirmDeleteNoteId(null)}
                                          onDelete={() => { handleDeleteArticleNote(n.id, article.id); setConfirmDeleteNoteId(null); }} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <textarea rows={3} maxLength={500}
                                  value={reflectDraft[key] || ""}
                                  onChange={(e) => setReflectDraft((d) => ({ ...d, [key]: e.target.value }))}
                                  className="w-full rounded-lg border p-2 text-sm"
                                  style={{ borderColor: C.line, background: C.paper }} />
                                <div className="flex justify-end mt-1.5">
                                  <button type="button"
                                    onClick={() => {
                                      handleCreateArticleNote(article.id, REFLECT_NOTE_KIND, reflectDraft[key], reflectAnchor(pi));
                                      setReflectDraft((d) => ({ ...d, [key]: "" }));
                                    }}
                                    className="px-4 py-1.5 rounded-full text-xs font-medium"
                                    style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.line}` }}>
                                    {hasEarlier ? REFLECT_REVISIT_ACTION : t("addNoteButton")}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs mt-4" style={{ color: C.inkSoft, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                          {REFLECT_NOTE}
                        </p>
                      </div>
                    )}

                    {quizModeOf(article) === "recall" && studyReadiness(article).hasQuiz && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">読んだあとに、3問</h3>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                          答えるとすぐに正解と理由が出ます。点数は付けません。
                        </p>
                        <div className="space-y-4">
                          {article.quiz.map((question, qi) => {
                            const chosen = (quizAnswers[article.id] || {})[qi];
                            const answered = typeof chosen === "number";
                            const result = answered ? answerQuizQuestion(question, chosen) : null;
                            return (
                              <div key={qi}>
                                <p className="text-sm mb-2" style={{ color: C.ink, lineHeight: 1.7 }}>
                                  {qi + 1}. {question.stem}
                                </p>
                                <div className="space-y-1.5">
                                  {(question.choices || []).map((choice, ci) => {
                                    const isAnswer = answered && ci === result.answerIndex;
                                    const isWrongPick = answered && ci === chosen && !result.correct;
                                    return (
                                      <button key={ci} type="button" disabled={answered}
                                        onClick={() => {
                                          const prev = quizAnswers[article.id] || {};
                                          const next = { ...prev, [qi]: ci };
                                          setQuizAnswers((s) => ({ ...s, [article.id]: next }));
                                          // 3問そろったら、そこで初めて箱に入れる。
                                          // ★正誤は「次にいつ出すか」を決めるためだけに使う。
                                          if (Object.keys(next).length === article.quiz.length) {
                                            const allCorrect = article.quiz.every((qq, k) => next[k] === qq.answerIndex);
                                            handleFinishArticleQuiz(article.id, allCorrect);
                                          }
                                        }}
                                        className="w-full text-left rounded-xl p-2.5 text-sm border"
                                        style={{
                                          background: isAnswer ? C.paper : C.card,
                                          borderColor: isAnswer ? C.ink : (isWrongPick ? C.inkSoft : C.line),
                                          color: C.ink,
                                          opacity: answered && !isAnswer && !isWrongPick ? 0.55 : 1,
                                          lineHeight: 1.6
                                        }}>
                                        {choice}
                                      </button>
                                    );
                                  })}
                                </div>
                                {answered && (
                                  <p className="text-xs mt-2" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                                    {result.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ★§2-3 自分に当てはめる問い。本人に思い出させるためのもので、
                        アプリが教えるためのものではない。
                        ★ここに記録の数値を差し込まないこと（職業別 §9 の線）。 */}
                    {studyReadiness(article).hasReflection && (
                      <div className="rounded-2xl p-4 border mb-4" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">あなたの場合はどうですか</h3>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{article.reflectionPrompt}</p>
                        <textarea rows={2} maxLength={500}
                          value={reflectionDraft[article.id] || ""}
                          onChange={(e) => setReflectionDraft((d) => ({ ...d, [article.id]: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs" style={{ color: C.inkSoft }}>{REFLECTION_PRIVACY_NOTE}</p>
                          <button type="button"
                            onClick={() => { handleCreateArticleNote(article.id, "reflection", reflectionDraft[article.id], null); setReflectionDraft((d) => ({ ...d, [article.id]: "" })); }}
                            className="px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, color: C.inkSoft, border: `1px solid ${C.line}` }}>
                            {t("addNoteButton")}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">{t("yourNotesTitle")}</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("yourNotesDesc")}</p>
                      {notes.filter((n) => n.kind !== REFLECT_NOTE_KIND).map((n) => (
                        <div key={n.id} className="rounded-xl p-2.5 mb-2" style={{ background: C.paper }}>
                          {n.anchor_text && <p className="text-xs mb-1" style={{ color: C.inkSoft }}>「{n.anchor_text}」について</p>}
                          <p className="text-sm">{n.body}</p>
                          <DeleteWithConfirm t={t}
                            confirming={confirmDeleteNoteId === n.id}
                            onAsk={() => setConfirmDeleteNoteId(n.id)}
                            onCancel={() => setConfirmDeleteNoteId(null)}
                            onDelete={() => { handleDeleteArticleNote(n.id, article.id); setConfirmDeleteNoteId(null); }} />
                        </div>
                      ))}
                      <textarea value={newArticleNoteDraft} rows={2} maxLength={500}
                        onChange={(e) => setNewArticleNoteDraft(e.target.value)}
                        placeholder={t("articleNotePlaceholder")}
                        className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      {/* ★kind を self_explanation にする（§7 の SelfExplanation に当たる）。
                          新しい表は作りません。article_notes が同じ項目を持っており、
                          表を増やして中身を移すと、移し損ねと、書き出し・削除への
                          足し忘れが起きます。どちらもこのセッションで実際に踏みました。
                          ★既存のメモ（kind: "article"）は、そのまま読めます。 */}
                      <button type="button" onClick={() => handleCreateArticleNote(article.id, "self_explanation", newArticleNoteDraft, null)}
                        className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                        {t("addNoteButton")}
                      </button>
                    </div>
                  </div>
                );
              }

              // §7.1: 一覧
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="ff-display italic text-xl" style={{ color: C.ink }}>{t("tabLearn")}</h2>
                  </div>
                  <select value={currentProfession} onChange={(e) => setLearnProfession(e.target.value)}
                    className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }}>
                    {SELECTABLE_PROFESSIONS.map((p) => <option key={p} value={p}>{PROFESSION_LABELS[p] || t(PROFESSION_LABEL_KEYS[p])}</option>)}
                  </select>
                  <input type="text" value={learnSearchQuery} onChange={(e) => setLearnSearchQuery(e.target.value)}
                    placeholder={t("searchArticlesPlaceholder")}
                    className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />

                  {(() => {
                    // §3 間隔をあけて出し直す。★「学ぶ」を開いたときに出るだけ。
                    //   ホームにも通知にも出さない。催促しない。連続日数も数えない。
                    if (shouldPromptReview()) return null;   // ★常に false。催促の経路を作らない
                    const byId = {};
                    ARTICLES.filter(visibleArticle).forEach((a) => { byId[a.id] = a; });
                    const set = buildReviewSet(Object.values(articleProgress), byId, toISODate(new Date()));
                    if (set.length === 0) return null;
                    return (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <h3 className="ff-display italic text-lg mb-1">前に読んだところから</h3>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                          やらなくても、何も起きません。
                        </p>
                        <div className="space-y-4">
                          {set.map((item) => {
                            const chosen = reviewAnswers[item.articleId];
                            const answered = typeof chosen === "number";
                            const result = answered ? answerQuizQuestion(item.question, chosen) : null;
                            return (
                              <div key={item.articleId}>
                                <p className="text-xs mb-1" style={{ color: C.inkSoft }}>{item.articleTitle}</p>
                                <p className="text-sm mb-2" style={{ color: C.ink, lineHeight: 1.7 }}>{item.question.stem}</p>
                                <div className="space-y-1.5">
                                  {(item.question.choices || []).map((choice, ci) => {
                                    const isAnswer = answered && ci === result.answerIndex;
                                    const isWrongPick = answered && ci === chosen && !result.correct;
                                    return (
                                      <button key={ci} type="button" disabled={answered}
                                        onClick={() => {
                                          setReviewAnswers((s) => ({ ...s, [item.articleId]: ci }));
                                          handleAnswerReview(item.articleId, ci === item.question.answerIndex);
                                        }}
                                        className="w-full text-left rounded-xl p-2.5 text-sm border"
                                        style={{
                                          background: isAnswer ? C.paper : C.card,
                                          borderColor: isAnswer ? C.ink : (isWrongPick ? C.inkSoft : C.line),
                                          color: C.ink,
                                          opacity: answered && !isAnswer && !isWrongPick ? 0.55 : 1,
                                          lineHeight: 1.6
                                        }}>
                                        {choice}
                                      </button>
                                    );
                                  })}
                                </div>
                                {answered && (
                                  <p className="text-xs mt-2" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                                    {result.explanation}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {searchResults ? (
                    <div className="space-y-1.5">
                      {searchResults.length === 0 && <p className="text-xs" style={{ color: C.inkSoft }}>{t("noSearchResults")}</p>}
                      {searchResults.map((a) => (
                        <button key={a.id} type="button" onClick={() => { setViewingArticleId(a.id); fetchArticleNotes(a.id); }}
                          className="w-full text-left rounded-xl border p-3" style={{ background: C.card, borderColor: C.line }}>
                          <p className="text-sm font-medium">{learnReadArticles[a.id] ? "✓ " : ""}{a.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{a.professions === "all" ? "からだ" : PROFESSION_LABELS[a.professions[0]]}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      {learnChapters.map((chapter) => {
                        const articles = getArticlesForProfession(currentProfession).filter(visibleArticle).filter((a) => a.chapter === chapter);
                        const isOpen = learnOpenChapters[`${currentProfession}:${chapter}`] !== false; // 既定は開く
                        const readCount = articles.filter((a) => learnReadArticles[a.id]).length;
                        return (
                          <div key={chapter}>
                            <button type="button" onClick={() => handleToggleChapter(currentProfession, chapter)}
                              className="w-full flex items-center justify-between py-2 text-sm font-medium" style={{ color: C.ink }}>
                              <span>{isOpen ? "▾" : "▸"} {chapter}. {CHAPTER_LABELS[chapter]}</span>
                              <span className="ff-mono text-xs" style={{ color: C.inkSoft }}>
                                {articles.length > 0 ? `${readCount}/${articles.length}` : "—"}
                              </span>
                            </button>
                            {isOpen && (
                              <div className="rounded-xl border overflow-hidden ml-2" style={{ borderColor: C.line }}>
                                {articles.length === 0 && (
                                  <p className="text-xs p-3" style={{ color: C.inkSoft }}>{t("noArticlesYet")}</p>
                                )}
                                {articles.map((a) => (
                                  <button key={a.id} type="button" onClick={() => { setViewingArticleId(a.id); fetchArticleNotes(a.id); }}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
                                    <span>{learnReadArticles[a.id] ? "✓ " : ""}{a.title}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                        <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>{t("bodyChapterHeading")}</p>
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.line }}>
                          {getArticlesForProfession("body").map((a) => (
                            <button key={a.id} type="button" onClick={() => { setViewingArticleId(a.id); fetchArticleNotes(a.id); }}
                              className="w-full text-left px-3 py-2 text-sm flex items-center justify-between" style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
                              <span>{learnReadArticles[a.id] ? "✓ " : ""}{a.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="button" onClick={() => {
                        const others = SELECTABLE_PROFESSIONS.filter((p) => p !== currentProfession);
                        setLearnProfession(others[0]);
                      }} className="w-full flex items-center justify-between py-2 text-sm" style={{ color: C.inkSoft }}>
                        {t("viewOtherProfessionArticles")}
                        <ChevronRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              );
            })()}

            {activeTab === "info" && <HealthInfo language={language} />}

            {activeTab === "more" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>学ぶ</p>
                  <div className="space-y-1">
                    <button type="button" onClick={() => { setActiveTab("learn"); setLearnProfession(learnProfession || profile.vocal_profession); }}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><Music2 size={16} style={{ color: C.gold }} />{t("tabLearn")}</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab("info")}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><BookOpen size={16} style={{ color: C.gold }} />健康情報</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                  </div>
                </div>

                {/* ★名前は「見やすさ」。「シニアモード」と書かないこと（§0-②）。
                    ★年齢からは何も決めない。本人に直接、見え方を選んでもらう。 */}
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>見やすさ</p>
                  <p className="text-sm mb-2" style={{ color: C.ink }}>文字の大きさ</p>
                  {/* ★見本を実寸で出す。「大きい」という言葉では伝わらない（§1-1）。 */}
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    {SCALES.map((s) => {
                      const active = normalizeScale(profile.display_scale) === s;
                      const sampleSize = s === "normal" ? "1rem" : s === "large" ? "1.25rem" : "1.5rem";
                      return (
                        <button key={s} type="button"
                          onClick={() => handleSaveDisplayPref({ display_scale: s })}
                          className="rounded-xl border p-3 text-center"
                          style={{
                            background: active ? C.paper : C.card,
                            borderColor: active ? C.ink : C.line,
                            color: C.ink
                          }}>
                          <span className="block text-xs" style={{ color: C.inkSoft }}>{SCALE_LABELS[s]}</span>
                          <span className="block mt-1" style={{ fontSize: sampleSize, lineHeight: 1.4 }}>{SCALE_SAMPLE}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
                    お使いの端末の文字サイズ設定も、そのまま効きます。
                  </p>

                  {/* ★文字の大きさとは別の設定。片方だけ変えられること（§0-③）。 */}
                  <div className="flex items-start justify-between gap-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
                    <div style={{ minWidth: 0 }}>
                      <p className="text-sm" style={{ color: C.ink }}>かんたん表示</p>
                      <p className="text-xs mt-0.5" style={{ color: C.inkSoft, lineHeight: 1.7 }}>
                        1つの画面に出すことを減らします。機能は減りません。押した先に、これまでどおりあります。
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => handleSaveDisplayPref({ simple_display: !isSimpleDisplay(profile) })}
                      className="px-4 py-2 rounded-full text-xs font-medium flex-shrink-0"
                      style={{
                        background: isSimpleDisplay(profile) ? C.ink : C.card,
                        color: isSimpleDisplay(profile) ? C.card : C.inkSoft,
                        border: `1px solid ${isSimpleDisplay(profile) ? C.ink : C.line}`
                      }}>
                      {isSimpleDisplay(profile) ? "オン" : "オフ"}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>ツール</p>
                  <div className="space-y-1">
                    <button type="button" onClick={() => setActiveTab("questionnaires")}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><ClipboardList size={16} style={{ color: C.gold }} />質問票</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                    <button type="button" onClick={() => setActiveTab("clinicSummary")}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><FileText size={16} style={{ color: C.gold }} />受診用サマリー</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                    {canSeeBetaFeatures(profile) && (
                      <button type="button" onClick={() => setLessonMode(true)}
                        className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                        <span className="flex items-center gap-2"><GraduationCap size={16} style={{ color: C.gold }} />レッスンモード</span>
                        <span style={{ color: C.inkSoft }}>→</span>
                      </button>
                    )}
                    <button type="button" onClick={() => setActiveTab("advice")}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><Bot size={16} style={{ color: C.gold }} />AIアドバイス</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                  </div>
                </div>

                {/* ★以前は「レッスン」タブの中にあったが、そのタブ自体が
                    「レッスンの予定があるか、先生とつながっているか」の人にしか
                    表示されない。新規ユーザーはどちらも無いため、先生とつながる
                    入口に永久に到達できなかった（鶏と卵）。全員が見る「もっと」へ移す。 */}
                  {/* ★ここは常に出す（canSeeStudentTeacherLink）。
                      G2-14 の機能フラグで一緒に隠していたが、これは指導者機能ではなく
                      生徒自身の操作。隠していたせいで、レッスンタブから「もっと」へ
                      移した意味が無くなっていた（移した先ごと消えていた）。
                      ベータの先生が招待しても、生徒がコードを入れる欄に届かなかった。 */}
                  {canSeeStudentTeacherLink() && (
                  <details className="rounded-2xl border" style={{ background: C.card, borderColor: C.line }}>
                    <summary className="p-4 text-sm font-medium cursor-pointer">{t("connectWithTeacherTitle")}</summary>
                    <div className="px-4 pb-4">
                      {myTeacherLinks.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {myTeacherLinks.map((link) => (
                            <div key={link.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: C.paper }}>
                              <span className="text-xs" style={{ color: C.inkSoft }}>
                                {teacherLabel(myTeacherNames[link.teacher_id])}と連携中
                              </span>
                              <button type="button" onClick={() => handleRevokeLink(link.id, "student")}
                                className="text-xs underline" style={{ color: C.curtain }}>{t("disconnectButton")}</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {pendingInvitation ? (
                        <div className="rounded-xl p-3" style={{ background: C.paper }}>
                          <p className="text-sm font-medium mb-2">{teacherLabel(pendingInvitation.teacher)}から招待が届いています</p>
                          {/* ★名前が取れなかったことを隠さない。
                              「誰か分からない相手」と「やまだ先生」を、同じ見た目で
                              出してはいけない。分からないなら、分からないと書く。 */}
                          {!(pendingInvitation.teacher && pendingInvitation.teacher.display_name) && (
                            <p className="text-xs mb-2" style={{ color: C.curtain }}>
                              先生の名前を確認できませんでした。心当たりのない招待には、つながらないでください。
                            </p>
                          )}
                          {pendingInvitation.teacher && pendingInvitation.teacher.school && (
                            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{pendingInvitation.teacher.school}</p>
                          )}
                          <p className="text-xs mb-2" style={{ color: C.inkSoft }}>つながると、この先生は選んだ項目を見られるようになります。</p>
                          <div className="space-y-1.5 mb-3">
                            {[
                              ["voice", "声・喉の記録"], ["symptoms", "症状"], ["sleep", "睡眠"], ["activity", "活動・練習量"],
                              ["hydration", "水分・食事"], ["meal", "食事"], ["body", "体重・身体データ"], ["mental", "心の余裕・日記"], ["notes", "稽古ノート"]
                            ].map(([key, label]) => (
                              <label key={key} className="flex items-center gap-2 text-xs" style={{ color: C.ink }}>
                                <input type="checkbox" checked={!!shareScopeDraft[key]}
                                  onChange={(e) => setShareScopeDraft((s) => ({ ...s, [key]: e.target.checked }))} />
                                {label}
                              </label>
                            ))}
                          </div>
                          <p className="text-xs mb-3" style={{ color: C.inkSoft }}>あとから変更できます。つながりの解除もいつでもできます。</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={handleAcceptInvitation}
                              className="flex-1 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                              {t("connectButton")}
                            </button>
                            <button type="button" onClick={handleDeclineInvitation}
                              className="flex-1 py-2 rounded-full text-xs font-medium border" style={{ borderColor: C.line, color: C.inkSoft }}>
                              {t("notNowButton")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs mb-2" style={{ color: C.inkSoft }}>先生から受け取った招待コードを入力してください。</p>
                          <div className="flex gap-2">
                            <input type="text" value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value)}
                              placeholder="招待コード" maxLength={8}
                              className="flex-1 rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                            <button type="button" onClick={() => handleLookupInviteCode(inviteCodeInput)}
                              className="px-4 py-2 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                              {t("confirmButton")}
                            </button>
                          </div>
                          {inviteLookupError && <p className="text-xs mt-1.5" style={{ color: C.curtain }}>{inviteLookupError}</p>}
                        </>
                      )}
                    </div>
                  </details>
                  )}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>設定</p>
                  <div className="space-y-1">
                    <button type="button" onClick={() => setActiveTab("profile")}
                      className="w-full flex items-center justify-between py-2.5 px-1 text-sm" style={{ color: C.ink }}>
                      <span className="flex items-center gap-2"><Scale size={16} style={{ color: C.gold }} />プロフィール・記録項目</span>
                      <span style={{ color: C.inkSoft }}>→</span>
                    </button>
                  </div>
                </div>

                {unusedFieldGroupSuggestions.filter((s) => !dismissedFoldSuggestions.includes(s.key)).length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>使っていない項目</p>
                    <div className="space-y-3">
                      {unusedFieldGroupSuggestions.filter((s) => !dismissedFoldSuggestions.includes(s.key)).map((s) => (
                        <div key={s.key} className="rounded-xl p-3" style={{ background: C.paper }}>
                          <p className="text-sm mb-2">「{s.label}」を30日間記録していません。畳みますか？</p>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleFoldGroup(s.key)}
                              className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                              畳む
                            </button>
                            <button type="button" onClick={() => setDismissedFoldSuggestions((prev) => [...prev, s.key])}
                              className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                              続ける
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.folded_groups || []).length > 0 && (
                  <p className="text-xs px-1" style={{ color: C.inkSoft }}>
                    現在畳んでいる項目: {(profile.folded_groups || []).map((k) => FOLDABLE_GROUP_LABELS[k] || k).join("・")}
                  </p>
                )}
                <button type="button" onClick={() => setShowFieldGroupManager(true)}
                  className="w-full rounded-2xl border-2 border-dashed py-3 text-sm font-medium flex items-center justify-center gap-1.5"
                  style={{ borderColor: C.line, color: C.inkSoft }}>
                  <Plus size={14} />記録する項目を増やす
                </button>
                {showFieldGroupManager && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">記録する項目</p>
                      <button type="button" onClick={() => setShowFieldGroupManager(false)} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: C.inkSoft }}>
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>表示中</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.keys(FOLDABLE_GROUP_LABELS).filter((key) => !(profile.folded_groups || []).includes(key)).map((key) => (
                        <button key={key} type="button" onClick={() => handleFoldGroup(key)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5"
                          style={{ borderColor: C.line, color: C.ink, background: C.paper }}>
                          <Check size={12} />{FOLDABLE_GROUP_LABELS[key]}
                        </button>
                      ))}
                      {Object.keys(FOLDABLE_GROUP_LABELS).filter((key) => !(profile.folded_groups || []).includes(key)).length === 0 && (
                        <p className="text-xs" style={{ color: C.inkSoft }}>すべて畳んでいます。</p>
                      )}
                    </div>
                    <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>畳んでいる</p>
                    <div className="flex flex-wrap gap-2">
                      {(profile.folded_groups || []).map((key) => (
                        <button key={key} type="button" onClick={() => handleUnfoldGroup(key)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5"
                          style={{ borderColor: C.line, color: C.inkSoft, background: C.paper }}>
                          <Plus size={12} />{FOLDABLE_GROUP_LABELS[key]}
                        </button>
                      ))}
                      {(profile.folded_groups || []).length === 0 && (
                        <p className="text-xs" style={{ color: C.inkSoft }}>畳んでいる項目はありません。</p>
                      )}
                    </div>
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      変更は「今日の記録」タブに即座に反映されます。畳んでも、過去に入力した値が消えることはありません。
                    </p>
                  </div>
                )}

                {!isPwaInstalled && pwaInstallPrompt && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                    <p className="text-sm font-medium mb-1">アプリとしてインストール</p>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      ホーム画面に追加すると、ブラウザを開かずワンタップで記録できます。
                    </p>
                    <button type="button" onClick={handleInstallPwa}
                      className="w-full py-2.5 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                      インストールする
                    </button>
                  </div>
                )}
                {!isPwaInstalled && isIosSafari && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.gold, borderWidth: 2 }}>
                    <p className="text-sm font-medium mb-1">アプリとしてインストール</p>
                    <p className="text-xs" style={{ color: C.inkSoft }}>
                      画面下部(または上部)の共有ボタン(四角から矢印が出ているアイコン)をタップし、「ホーム画面に追加」を選んでください。
                    </p>
                  </div>
                )}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-sm font-medium mb-1">記録画面の切り替え時刻</p>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    この時刻より前は「声の記録」、以降は「一日の記録」を最初に開きます。いつでも上部のタブで行き来できます。
                  </p>
                  <select value={profile.day_record_boundary_hour ?? 21}
                    onChange={(e) => handleChangeDayRecordBoundary(Number(e.target.value))}
                    className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line, background: C.paper }}>
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>


                {/* 統合実行ルートv4 G2-14: LINE連携は、公式アカウントの運用（友だち追加の
                    導線・Webhookの設定）が固まるまで一般ユーザーに出さない。
                    設定が済んでいない環境では、入口だけあっても連携できない。 */}
                {canSeeLineLink(profile) && (
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-sm font-medium mb-1">LINE通知（毎朝のリマインド）</p>
                  {profile.line_user_id ? (
                    <>
                      <p className="text-xs mb-3" style={{ color: C.ink }}>連携済みです。{profile.line_linked_at && new Date(profile.line_linked_at).toLocaleDateString("ja-JP")}に連携しました。</p>
                      <label className="flex items-center gap-2 mb-3" style={{ cursor: "pointer" }}>
                        <input type="checkbox" checked={profile.line_notification_enabled}
                          onChange={(e) => handleToggleLineNotification(e.target.checked)} />
                        <span className="text-sm">毎朝、記録していない日にリマインドを受け取る</span>
                      </label>
                      <button type="button" onClick={handleUnlinkLine}
                        className="text-xs underline" style={{ color: C.curtain }}>
                        連携を解除する
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        LINEと連携すると、まだ記録していない日の朝に、LINEでリマインドが届きます。
                      </p>
                      {profile.line_link_code ? (
                        <div className="rounded-xl p-3 mb-2" style={{ background: C.paper }}>
                          {/* ★以前は「友だち追加」が説明文だけで、どこの公式アカウントに
                              送ればよいのか分からなかった。友だち追加の導線を実際に置く。
                              URL は環境変数で渡す（アカウントごとに違うため）。 */}
                          <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>①LINEで「La Voce」を友だち追加</p>
                          {process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL ? (
                            <a href={process.env.NEXT_PUBLIC_LINE_ADD_FRIEND_URL} target="_blank" rel="noopener noreferrer"
                              className="block w-full text-center py-2 rounded-full text-xs font-medium mb-2"
                              style={{ background: "#06C755", color: "#FFFFFF" }}>
                              LINEで友だち追加する
                            </a>
                          ) : (
                            <p className="text-xs mb-2 rounded-lg p-2" style={{ background: "rgba(184,49,49,0.10)", color: C.curtain }}>
                              友だち追加のリンクが未設定です。管理者に連絡してください（NEXT_PUBLIC_LINE_ADD_FRIEND_URL）。
                            </p>
                          )}
                          <p className="text-xs mb-2" style={{ color: C.inkSoft }}>②トーク画面に、下の連携コードをそのまま送信</p>
                          <p className="ff-mono text-center text-2xl tracking-widest py-2 rounded-lg" style={{ background: C.card, color: C.curtain }}>
                            {profile.line_link_code}
                          </p>
                          {/* ★LINE側で連携が完了しても、アプリはそれを知らない。
                              以前は画面を開き直すまで「未連携」のままで、成功したのか
                              失敗したのか分からなかった。取り直す導線を置く。 */}
                          <button type="button" onClick={handleRefreshLineStatus} disabled={lineCheckStatus === "checking"}
                            className="w-full mt-2 py-2 rounded-full text-xs font-medium border"
                            style={{ borderColor: C.line, color: C.inkSoft }}>
                            {lineCheckStatus === "checking" ? "確認しています…" : "③送信したら、ここを押して確認"}
                          </button>
                          {lineCheckStatus === "notyet" && (
                            <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                              まだ連携が確認できません。コードを送信してから、少し待ってもう一度お試しください。
                            </p>
                          )}
                        </div>
                      ) : (
                        <button type="button" onClick={handleGenerateLineLinkCode}
                          className="w-full py-2.5 rounded-full text-sm font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                          連携コードを発行する
                        </button>
                      )}
                    </>
                  )}
                </div>
                )}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>アカウント</p>
                  {/* 統合実行ルートv4 G3-16: データの書き出し。
                      ★アカウント削除（G3-17）の1ページ目から「先に書き出す」で
                        ここへ誘導するため、削除より先に用意している。 */}
                  <div className="rounded-xl p-3 mb-3" style={{ background: C.paper }}>
                    <p className="text-sm font-medium mb-1">{t("labelExportData")}</p>
                    <p className="text-xs mb-1" style={{ color: C.inkSoft }}>{t("noteExportData")}</p>
                    <p className="text-xs mb-2.5" style={{ color: C.inkSoft }}>{t("noteExportFormats")}</p>
                    {exportStatus === "done" && (
                      <p className="text-xs rounded-lg px-2.5 py-1.5 mb-2" style={{ background: "rgba(122,150,109,0.18)", color: C.ink }}>
                        {t("exportDone")}
                      </p>
                    )}
                    {exportStatus === "error" && (
                      <p className="text-xs rounded-lg px-2.5 py-1.5 mb-2" style={{ background: "rgba(184,49,49,0.14)", color: C.curtain }}>
                        {t("exportError")}
                      </p>
                    )}
                    <button type="button" onClick={handleExportData} disabled={exportStatus === "working"}
                      className="w-full py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2"
                      style={{ background: C.curtain, color: "#FFFDF8", opacity: exportStatus === "working" ? 0.7 : 1 }}>
                      {exportStatus === "working" && <Loader2 size={15} className="animate-spin" />}
                      {exportStatus === "working" ? t("exportWorking") : t("labelExportData")}
                    </button>
                    {/* ★受診用サマリーとは別物。あちらはお医者さんに見せるもの、
                        こちらは本人が「ちゃんと入っているか」を確かめるもの。
                        同じ無料の書き出しの一部で、有料機能ではない。 */}
                    <button type="button" onClick={() => setActiveTab("exportSummary")}
                      className="w-full mt-2 py-2 rounded-full text-xs font-medium"
                      style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                      記録の控えを開く（印刷・PDF）
                    </button>
                  </div>
                  <button type="button" onClick={() => { setDeleteConfirmText(""); setDeleteStatus("idle"); setActiveTab("deleteAccount1"); }}
                    className="w-full flex items-center justify-between py-2.5 px-1 text-sm mb-1" style={{ color: C.curtain }}>
                    <span className="flex items-center gap-2"><Trash2 size={16} />{t("labelDeleteAccount")}</span>
                    <span style={{ color: C.inkSoft }}>→</span>
                  </button>
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2 py-2.5 px-1 text-sm" style={{ color: C.curtain }}>
                    <LogOut size={16} />ログアウト
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

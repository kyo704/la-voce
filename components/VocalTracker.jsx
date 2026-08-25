"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Mic2, Moon, Droplets, Thermometer, Wind, MapPin, Music2, HeartHandshake,
  NotebookPen, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Trash2,
  Loader2, Check, Plus, Minus, Sparkles, Utensils, LogOut, CreditCard, Bot, MessageCircle, Home,
  Wheat, Egg, Droplet, Leaf, Dumbbell, Ruler, Scale, BookOpen, X, Sunrise, Sun, Sunset, Globe, Lock,
  Volume2, Plane, AudioWaveform, Timer, MessageSquare, ClipboardList
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine, ReferenceArea, LineChart, Line, ComposedChart, Area
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { C, LEVEL_COLORS, LEVEL_DYNAMICS, LEVEL_DYNAMIC_DESC } from "@/lib/tokens";
import { FOOD_PRESETS, DISH_GROUP_ALIASES, CATEGORY_SEARCH_ALIASES } from "@/lib/foodPresets";
import { SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES, SHOP_ITEMS, PLACEMENT_LIMITS } from "@/lib/character";
import { LANGUAGES, createTranslator } from "@/lib/translations";
import HealthInfo from "@/components/HealthInfo";
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
  { key: "today", labelKey: "tabToday", icon: Mic2 },
  { key: "garden", labelKey: "tabCharacter", icon: Home },
  { key: "history", labelKey: "tabHistory", icon: CalendarDays },
  { key: "analysis", labelKey: "tabAnalysis", icon: BarChart3 },
  { key: "questionnaires", labelKey: "tabQuestionnaires", icon: ClipboardList },
  { key: "advice", labelKey: "tabAdvice", icon: Bot },
  { key: "info", labelKey: "tabInfo", icon: BookOpen },
  { key: "voicetheory", labelKey: "tabVoiceTheory", icon: Music2, href: "/vocal-theory" }
];
// 職業ごとに専用の理論ページへ切り替える
const PROFESSION_THEORY_PAGES = {
  singer: "/vocal-theory",
  announcer: "/announcer-theory",
  voice_actor: "/voice-actor-theory",
  pop_musical: "/performer-theory"
};
const VOCAL_PROFESSIONS = ["singer", "announcer", "voice_actor", "pop_musical"];
// 「今日の負荷」の抽象スキーマ。type はログの種類、durationMin/intensity は職業共通、
// それ以外は職業ごとに意味のある追加項目（分析エンジン側は type を見て解釈する）。
const LOAD_TYPE_BY_PROFESSION = {
  singer: "sustained_singing",
  announcer: "live_broadcast",
  voice_actor: "character_switching",
  pop_musical: "loud_venue_performance"
};
const LOAD_FIELDS_BY_PROFESSION = {
  singer: [
    { key: "vocalRangeLowUsed", type: "text", labelKey: "loadVocalRangeLowUsed", placeholderKey: "placeholderNoteExample" },
    { key: "vocalRangeHighUsed", type: "text", labelKey: "loadVocalRangeHighUsed", placeholderKey: "placeholderNoteExample" },
    { key: "dynamicsRange", type: "select", labelKey: "loadDynamicsRange", options: ["pp-mp", "mp-mf", "mf-f", "f-ff", "pp-ff"] },
    { key: "passaggioCrossings", type: "number", labelKey: "loadPassaggioCrossings" }
  ],
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
// queryFn: () => Promise<{data, error}> を返す関数（クエリを毎回組み立て直せるように関数で受け取る）。
// 一時的な認証エラーが出た場合のみ、セッションを更新してから1回だけ再試行する。
// それ以外のエラー（権限不足や入力ミスなど）はそのまま返し、無限にリトライしない。
async function runQueryWithAuthRetry(supabase, queryFn, label) {
  let result = await queryFn();
  if (result.error && isTransientAuthError(result.error)) {
    console.warn(`${label || "クエリ"}で一時的な認証エラーを検知。セッションを更新して再試行します。`, result.error);
    try {
      await supabase.auth.refreshSession();
    } catch (e) {
      /* リフレッシュ自体が失敗しても、下のリトライで最終的なエラーを拾う */
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
    result = await queryFn();
  }
  return result;
}
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
function levelColor(v) {
  if (v == null) return "#D8D0BE";
  return LEVEL_COLORS[clampLevel(v) - 1];
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
// 1日分の発声負荷 L_d = 活動時間(分) × 種別重み + 運動記録の負荷（0.3 × 分 × 強度/3）
function computeDailyLoad(entry) {
  if (!entry) return 0;
  const weight = ACTIVITY_LOAD_WEIGHT[entry.activityType] ?? 0;
  const activityMinutes = typeof entry.activityDuration === "number" ? entry.activityDuration * 60 : 0;
  const baseLoad = activityMinutes * weight;
  const exerciseLoad = (entry.exercises || []).reduce((sum, x) => {
    const minutes = Number(x.minutes) || 0;
    const intensity = typeof x.intensity === "number" ? x.intensity : 3;
    return sum + 0.3 * minutes * (intensity / 3);
  }, 0);
  // lavoce-収集データ拡張案.md A-2: 話し声の使用量。歌っていない時間の声の使用も発声負荷に加算する。
  // 「話し声2（よく喋った）＝+45分相当」を基準に、レベルに比例させる。騒がしい場所では1.3倍。
  const speakingLevel = typeof entry.speakingLevel === "number" ? entry.speakingLevel : 0;
  const speakingLoad = speakingLevel * 22.5 * (entry.noisyEnvironment ? 1.3 : 1);
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
  return { g, ciLow: g - 1.96 * se, ciHigh: g + 1.96 * se, n1, n0, m1, m0 };
}
function starRatingForEffect(res) {
  if (!res) return 0;
  const { n1, n0, g, ciLow, ciHigh } = res;
  if (n1 < 3 || n0 < 3) return 0;
  let stars = 1;
  const crossesZero = ciLow <= 0 && ciHigh >= 0;
  if (!crossesZero) stars = 2;
  if (!crossesZero && Math.abs(g) >= 0.5) stars = 3;
  if (!crossesZero && Math.abs(g) >= 0.5 && n1 >= 10 && n0 >= 10) stars = 4;
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
function generateInsights(correlationResults, targetLabel, t) {
  return correlationResults
    .filter((r) => r.r != null && Math.abs(r.r) >= 0.4 && r.n >= 5)
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
// lavoce-収集データ拡張案.md C-1: 指定した日が、直近の周期開始日から何日目かを計算する。
// 周期開始日がまだ一度も記録されていなければ null を返す。
function cycleDayForDate(dateISO, entries) {
  const startDates = Object.keys(entries)
    .filter((d) => d <= dateISO && entries[d] && entries[d].cycleStart)
    .sort();
  if (startDates.length === 0) return null;
  const lastStart = startDates[startDates.length - 1];
  const diffDays = Math.round((new Date(dateISO + "T00:00:00") - new Date(lastStart + "T00:00:00")) / 86400000);
  return diffDays + 1;
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
      noisyEnvironment: existing.noisyEnvironment || false,
      cppsValue: existing.cppsValue ?? ""
    };
  }
  return {
    date,
    throatCondition: 3,
    voiceQuality: 3,
    throatSymptoms: [],
    throatSymptomsOther: "",
    voiceMemo: "",
    voiceCheckins: {},
    wakeNote: "",
    routineNote: "",
    resonanceScore: "",
    sleepHours: 7,
    sleepQuality: 3,
    bedtime: "",
    waterBySlot: {},
    mealNotes: "",
    dinnerTime: "",
    dinnerTags: [],
    location: getLastLocation(entries, date),
    weather: "",
    temperature: "",
    humidity: "",
    activityType: "自主練習",
    activityDuration: "",
    activityDetail: {},
    repertoire: "",
    performanceQuality: null,
    ease: 3,
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
    noisyEnvironment: false,
    cppsValue: ""
  };
}
function computeBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}
function healthyWeightRange(heightCm) {
  if (!heightCm) return null;
  const h = heightCm / 100;
  return { min: 18.5 * h * h, max: 24.9 * h * h };
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
function evaluateIntake(actual, target) {
  if (!target || target <= 0) return null;
  const ratio = actual / target;
  if (ratio < 0.8) return { labelKey: "evalInsufficient", color: C.curtain };
  if (ratio <= 1.1) return { labelKey: "evalAppropriate", color: C.sage };
  if (ratio <= 1.3) return { labelKey: "evalSlightlyExcess", color: C.gold };
  return { labelKey: "evalExcess", color: C.rust };
}
function newExerciseItem() {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type: "有酸素運動", minutes: "", intensity: 3, memo: "" };
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
function rowToEntry(row) {
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
    noisyEnvironment: row.noisy_environment || false,
    cppsValue: row.cpps_value
  };
}
function numOrNull(v) {
  return v === "" || v === undefined ? null : v;
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
// ---- CPPS計算用DSP ここまで ----
// 前日の記録から、声のコンディションに影響しやすい要因を抽出する。
// flagKey は「今日」タブの短い警告表示に、explainKey は分析タブの理論的な解説文に対応する。
function computeConditionFlags(y) {
  const dinnerGap = computeTimeGapHours(y.dinnerTime, y.bedtime);
  const flags = [];
  if (dinnerGap != null && dinnerGap < 3) flags.push({ flagKey: "flagDinnerGap", explainKey: "explainDinnerGap" });
  if (typeof y.sleepHours === "number" && y.sleepHours < 6) flags.push({ flagKey: "flagShortSleep", explainKey: "explainShortSleep" });
  if (y.activityType === "本番" || y.activityType === "リハーサル") flags.push({ flagKey: "flagHeavyVoiceUse", explainKey: "explainHeavyVoiceUse" });
  if ((y.dinnerTags || []).includes("アルコール")) flags.push({ flagKey: "flagAlcohol", explainKey: "explainAlcohol" });
  if ((y.dinnerTags || []).includes("カフェイン")) flags.push({ flagKey: "flagCaffeine", explainKey: "explainCaffeine" });
  return { dinnerGap, flags };
}
function entryToRow(userId, e) {
  return {
    user_id: userId,
    date: e.date,
    throat_condition: numOrNull(e.throatCondition),
    voice_quality: numOrNull(e.voiceQuality),
    throat_symptoms: e.throatSymptoms || [],
    sleep_hours: numOrNull(e.sleepHours),
    sleep_quality: numOrNull(e.sleepQuality),
    meal_notes: e.mealNotes,
    location: e.location,
    temperature: numOrNull(e.temperature),
    humidity: numOrNull(e.humidity),
    activity_type: e.activityType,
    activity_duration: numOrNull(e.activityDuration),
    repertoire: e.repertoire,
    performance_quality: numOrNull(e.performanceQuality),
    ease: numOrNull(e.ease),
    notes: e.notes,
    weight_kg: numOrNull(e.weightKg),
    water_intake: Object.values(e.waterBySlot || {}).reduce((total, v) => total + (Number(v) || 0), 0),
    carbs_g: sumMacro(e.meals, "carbs"),
    protein_g: sumMacro(e.meals, "protein"),
    fat_g: sumMacro(e.meals, "fat"),
    fiber_g: sumMacro(e.meals, "fiber"),
    exercise_minutes: (e.exercises || []).reduce((total, x) => total + (Number(x.minutes) || 0), 0),
    meals: (e.meals || []).map((m) => ({ ...m, carbs: numOrNull(m.carbs), protein: numOrNull(m.protein), fat: numOrNull(m.fat), fiber: numOrNull(m.fiber) })),
    exercises: (e.exercises || []).map((x) => ({ ...x, minutes: numOrNull(x.minutes) })),
    voice_checkins: e.voiceCheckins || {},
    water_by_slot: e.waterBySlot || {},
    weather: e.weather || null,
    mental_reason: e.mentalReason || "",
    mental_tags: e.mentalTags || [],
    throat_symptoms_other: e.throatSymptomsOther || "",
    voice_memo: e.voiceMemo || "",
    activity_detail: e.activityDetail || {},
    wake_note: e.wakeNote || "",
    routine_note: e.routineNote || "",
    resonance_score: numOrNull(e.resonanceScore),
    bedtime: e.bedtime || "",
    dinner_time: e.dinnerTime || "",
    dinner_tags: e.dinnerTags || [],
    load_detail: e.loadDetail || {},
    cycle_start: !!e.cycleStart,
    medication_tags: e.medicationTags || [],
    ambient_noise_db: numOrNull(e.ambientNoiseDb),
    flight_hours: numOrNull(e.flightHours),
    jetlag_hours: numOrNull(e.jetlagHours),
    pianissimo_high_note: e.pianissimoHighNote || "",
    pianissimo_onset_delay: !!e.pianissimoOnsetDelay,
    speaking_level: numOrNull(e.speakingLevel),
    noisy_environment: !!e.noisyEnvironment,
    cpps_value: numOrNull(e.cppsValue)
  };
}

/* ---------- small components ---------- */
function Gauge({ score, t }) {
  const cx = 100, cy = 100, r = 78, sw = 16;
  const segs = [0, 1, 2, 3, 4].map((i) => ({
    d: describeArc(cx, cy, r, 180 - i * 36, 180 - (i + 1) * 36),
    color: LEVEL_COLORS[i]
  }));
  const f = score == null ? 0.5 : Math.max(0, Math.min(1, (score - 1) / 4));
  const needleAngle = 180 * (1 - f);
  const tip = polarPoint(cx, cy, r - sw / 2 - 4, needleAngle);
  const dyn = levelDynamic(score);
  const color = score == null ? C.inkSoft : levelColor(score);
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
                background: v <= value ? levelColor(value) : C.card,
                border: `1.5px solid ${v <= value ? levelColor(value) : C.line}`
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

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 border" style={{ background: C.card, borderColor: C.line }}>
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
function LockedCard({ title, teaser, current, required }) {
  const remaining = Math.max(0, required - current);
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div className="rounded-2xl p-4 border overflow-hidden relative" style={{ background: C.card, borderColor: C.line }}>
      <div style={{ filter: "blur(3px)", opacity: 0.35, pointerEvents: "none", userSelect: "none" }}>
        <h3 className="ff-display italic text-lg mb-2">{title}</h3>
        <div className="flex items-end gap-1.5" style={{ height: 64 }}>
          {[40, 65, 30, 80, 50, 90, 60].map((h, i) => (
            <div key={i} style={{ width: 10, height: `${h}%`, background: C.gold, borderRadius: 3 }} />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center" style={{ background: "rgba(255,253,248,0.55)" }}>
        <Lock size={18} style={{ color: C.inkSoft }} />
        <p className="text-xs font-medium" style={{ color: C.ink }}>{title}</p>
        <p className="text-xs" style={{ color: C.inkSoft }}>{teaser}</p>
        <div className="w-full max-w-[220px] mt-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.gold }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: C.inkSoft }}>
            {remaining > 0 ? `あと${remaining}日で解放されます（${current}/${required}日）` : `${current}/${required}日`}
          </p>
        </div>
      </div>
    </div>
  );
}

// 音域到達マップ用の簡易ピアノ鍵盤。白鍵を等幅で並べ、黒鍵を近似位置に重ねる。
// 下段の帯で「自己ベスト（グレー）」と「選んだ期間の到達範囲（色つき）」を示す。
function PianoKeyboard({ lowMidi, highMidi, bestLow, bestHigh, currentLow, currentHigh, newRecord }) {
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
  const fields = LOAD_FIELDS_BY_PROFESSION[profession] || LOAD_FIELDS_BY_PROFESSION.singer;
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
                {f.isPreset && <span className="ff-mono mr-1" style={{ color: C.gold }}>[{t("labelPreset")}{f.unit ? `・1${f.unit}${t("labelUnitAvailable")}` : ""}]</span>}
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
  const [entries, setEntries] = useState({});
  const [activeTab, setActiveTab] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayISOUTC());
  const [formData, setFormData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
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
  const [profile, setProfile] = useState({ height_cm: "", voice_type: "", nutrition_phase: "維持", protein_coefficient: 1.6, age: "", sex: "", garden_theme: "rose", vocal_range_low: "", vocal_range_high: "", comfort_range_low: "", comfort_range_high: "", technical_goal: "", health_notes: "", vocal_profession: "singer" });
  const [ownedItemKeys, setOwnedItemKeys] = useState([]);
  const [characterEquipped, setCharacterEquipped] = useState({});
  const [characterPointsSpent, setCharacterPointsSpent] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaveStatus, setProfileSaveStatus] = useState("idle");

  // selectedDate / viewMonth は、サーバーとクライアントのハイドレーション不一致を避けるため
  // UTC基準の値で初期化している。マウント後（＝ハイドレーションが安全に完了した後）に、
  // ブラウザの現地時間で計算した正しい「今日」へ補正する。
  useEffect(() => {
    const localToday = todayISO();
    const utcToday = todayISOUTC();
    if (localToday !== utcToday) {
      setSelectedDate((prev) => (prev === utcToday ? localToday : prev));
      const d = new Date();
      setViewMonth((prev) =>
        (prev.year === d.getUTCFullYear() && prev.month === d.getUTCMonth())
          ? { year: d.getFullYear(), month: d.getMonth() }
          : prev
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (error) {
        console.error("記録データの読み込みに失敗しました:", error, "userId:", userId);
      }
      if (mounted && data) {
        const map = {};
        data.forEach((row) => { map[row.date] = rowToEntry(row); });
        setEntries(map);
      }
      if (mounted) setLoading(false);
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
            usageCount: row.usage_count || 0
          };
        });
        setRepertoireTessituraMap(map);
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
            .select("height_cm, voice_type, nutrition_phase, protein_coefficient, age, sex, garden_theme, character_points_spent, character_equipped, vocal_range_low, vocal_range_high, comfort_range_low, comfort_range_high, technical_goal, health_notes, vocal_profession, track_cycle")
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
          vocal_profession: data.vocal_profession || "singer",
          track_cycle: data.track_cycle || false
        });
        setCharacterPointsSpent(data.character_points_spent || 0);
        setCharacterEquipped(data.character_equipped || {});
      }
      const { data: inventoryRows } = await supabase.from("character_inventory").select("item_key").eq("user_id", userId);
      if (mounted && inventoryRows) {
        setOwnedItemKeys(inventoryRows.map((r) => r.item_key));
      }
      if (mounted) setProfileLoading(false);
    })();
    return () => { mounted = false; };
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
    const realToday = todayISO();
    const yDate = addDays(realToday, -1);
    const y = entries[yDate];
    if (!y) return { hasData: false, date: yDate, flags: [] };
    const { flags } = computeConditionFlags(y);
    return { hasData: true, date: yDate, flags };
  }, [entries]);
  const mealTotals = useMemo(() => {
    const meals = formData ? formData.meals || [] : [];
    return {
      carbs: sumMacro(meals, "carbs"),
      protein: sumMacro(meals, "protein"),
      fat: sumMacro(meals, "fat"),
      fiber: sumMacro(meals, "fiber")
    };
  }, [formData]);
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
  const weightRange = useMemo(
    () => healthyWeightRange(profile.height_cm ? Number(profile.height_cm) : null),
    [profile.height_cm]
  );
  const nutritionTargets = useMemo(() => {
    const w = (formData && formData.weightKg) ? Number(formData.weightKg) : getLatestWeight(entries, selectedDate);
    return computeNutritionTargets(w, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient);
  }, [formData, entries, selectedDate, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient]);
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
      const performanceDates = Object.keys(entries).filter((d) => entries[d].activityType === "本番").sort();
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

  const correlationResults = useMemo(() => {
    if (analysisTarget === "performance") {
      return getCorrelationData(filteredEntries, "performanceQuality", (e) => e.activityType === "本番" && typeof e.performanceQuality === "number", t);
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
      if (e.activityType !== "休養") return;
      const methods = (e.activityDetail && e.activityDetail.restMethods) || [];
      const otherText = (e.activityDetail && e.activityDetail.restMethodOther || "").trim();
      methods.forEach((rawM) => {
        const m = (rawM === "その他" && otherText) ? otherText : rawM;
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
    // 数字の作法: n≥3を平均表示の下限にする。それ未満は記録数だけを見せて、貯める動機にする。
    return {
      confident: all.filter((s) => s.n >= 3),
      lowN: all.filter((s) => s.n < 3).sort((a, b) => b.n - a.n)
    };
  }, [filteredEntries]);
  // 声の調子スコア（過去2週間の平均から算出する、100点満点の参考指標）。
  // 医学的な診断値ではなく、これまで記録してきた項目を独自の重み付けで統合したもの。
  // 各項目の内訳も併せて返し、ブラックボックスにしない。
  const vocalConditionScore = useMemo(() => {
    const realToday = todayISO();
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
  }, [entries]);
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
    // 数字の作法: n≥3を平均表示の下限にする。それ未満は記録数だけを見せて、貯める動機にする。
    return {
      confident: all.filter((s) => s.n >= 3).sort((a, b) => b.n - a.n),
      lowN: all.filter((s) => s.n < 3).sort((a, b) => b.n - a.n)
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
    return { low: toSorted(lowCounts), lowTotal, high: toSorted(highCounts), highTotal };
  }, [filteredEntries]);
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
  // timeSeries（体重・タンパク質・カロリー・心の余裕・響きスコアなど）に、
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
  const dietGoodBadFoodStats = useMemo(() => {
    const goodCounts = {};
    const badCounts = {};
    let goodTotal = 0;
    let badTotal = 0;
    Object.values(filteredEntries).forEach((e) => {
      if (typeof e.throatCondition !== "number") return;
      const items = (e.meals || []).map((m) => (m.name || "").trim()).filter(Boolean);
      if (e.throatCondition >= 4) {
        goodTotal += 1;
        items.forEach((name) => { goodCounts[name] = (goodCounts[name] || 0) + 1; });
      } else if (e.throatCondition <= 2) {
        badTotal += 1;
        items.forEach((name) => { badCounts[name] = (badCounts[name] || 0) + 1; });
      }
    });
    const toSorted = (counts) =>
      Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    return { good: toSorted(goodCounts), goodTotal, bad: toSorted(badCounts), badTotal };
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
  // 声の調子（喉のコンディション・声の質・響きスコア）がどう違うかを文章にする。
  // どちらかの日数が2日未満のときは、参考にできるほどのデータがまだないと判断して表示しない。
  // 現時点では日本語のみの文言（他7言語の翻訳は translations.js 側の対応が別途必要）。
  const compositePatternInsight = useMemo(() => {
    const usable = compositeConditionDaily.filter((d) => d.knownCount >= 3);
    const goodDays = usable.filter((d) => d.goodCount >= 3);
    const poorDays = usable.filter((d) => d.goodCount <= 1);
    if (goodDays.length < 2 || poorDays.length < 2) return null;

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
    const topGoodFood = dietGoodBadFoodStats.good[0] || null;
    const topBadFood = dietGoodBadFoodStats.bad[0] || null;
    if (topGoodFood) {
      sentences.push(
        t("compositeGoodFoodSentence")
          .replace("{n}", dietGoodBadFoodStats.goodTotal)
          .replace("{food}", topGoodFood.name)
          .replace("{count}", topGoodFood.count)
      );
    }
    if (topBadFood) {
      sentences.push(
        t("compositeBadFoodSentence")
          .replace("{n}", dietGoodBadFoodStats.badTotal)
          .replace("{food}", topBadFood.name)
          .replace("{count}", topBadFood.count)
      );
    }

    return sentences;
  }, [compositeConditionDaily, mentalTopGroups, dietGoodBadFoodStats, t]);
  // ---- 各グループ横断のクロス分析用データ ここまで ----

  // ---- ここから、lavoce-指標設計図.md フェーズ1の3指標用データ ----
  // 段階解放の判定に使う「これまでの総記録日数」（選んだ分析期間ではなく、全期間で数える）。
  const recordedDaysTotal = useMemo(() => Object.keys(entries).length, [entries]);

  // 03. ウォームアップ効率（起き抜け→ルーティン後の半音差）
  const warmupDaily = useMemo(() => {
    return Object.keys(filteredEntries).sort().map((date) => {
      const e = filteredEntries[date];
      const wakeMidi = noteToMidi(e.wakeNote);
      const routineMidi = noteToMidi(e.routineNote);
      const deltaST = (wakeMidi != null && routineMidi != null) ? routineMidi - wakeMidi : null;
      return { date, dateLabel: date.slice(5), wakeMidi, routineMidi, wakeNoteLabel: e.wakeNote || null, routineNoteLabel: e.routineNote || null, deltaST };
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
        if (countA >= 5 && pB > 0) {
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
        if (inter > 0 && union > 0) pairs.push({ a, b, jaccard: inter / union, count: inter });
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
    const realToday = todayISO();
    const dates = [];
    for (let i = 27; i >= 0; i--) dates.push(addDays(realToday, -i));
    return dates
      .map((d) => ({ date: d, score: computeDailyScore100(entries[d]) }))
      .filter((x) => x.score != null);
  }, [entries]);
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
    return { z, T, n, position, topPercentPct, today: Math.round(todayEntry.score) };
  }, [dailyScoreSeries]);

  // 07. 発声負荷（ACWR）の日次系列。声の予報の「前日発声負荷」predictorにも使う。
  // 記録のない日は L=0 として扱わず、前日のEWMAをそのまま引き継ぐ（休んだのか未記録なのか区別できないため）。
  const acwrSeries = useMemo(() => {
    const allDates = Object.keys(entries).sort();
    const series = {};
    if (allDates.length === 0) return series;
    const firstDate = allDates[0];
    const realToday = todayISO();
    const lambdaA = 2 / (7 + 1);
    const lambdaC = 2 / (28 + 1);
    let A = null, C = null;
    let d = firstDate;
    let guard = 0;
    while (d <= realToday && guard < 3660) { // 約10年分で打ち切る安全弁
      const entry = entries[d];
      if (entry) {
        const L = computeDailyLoad(entry);
        A = A == null ? L : lambdaA * L + (1 - lambdaA) * A;
        C = C == null ? L : lambdaC * L + (1 - lambdaC) * C;
        series[d] = { A, C, acwr: C > 0 ? A / C : null };
      } else if (A != null && C != null) {
        series[d] = { A, C, acwr: C > 0 ? A / C : null };
      }
      d = addDays(d, 1);
      guard += 1;
    }
    return series;
  }, [entries]);

  // 01. 声の予報：前夜の行動から翌朝の喉スコアを予測する。
  // 記録14日未満は一般知見（β₀）だけで予報し、14日以上たまったらリッジ回帰で
  // その人自身の係数（β̂）を推定し、経験ベイズ縮約で β₀ とブレンドする（β = n/(n+k)·β̂ + k/(n+k)·β₀、k=20）。
  const forecastTrainingSet = useMemo(() => {
    const realToday = todayISO();
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
  }, [entries, acwrSeries]);
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
  const forecastHitRate = useMemo(() => {
    const recent = forecastResiduals.slice(-30);
    if (recent.length === 0) return null;
    const hits = recent.filter((r) => Math.abs(r.residual) <= 0.5).length;
    return { rate: Math.round((hits / recent.length) * 100), n: recent.length };
  }, [forecastResiduals]);
  const todayForecast = useMemo(() => {
    const realToday = todayISO();
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
      personalizationPct: personalizedBeta.personalizationPct,
      trainN: personalizedBeta.n
    };
  }, [entries, acwrSeries, predictorMeans, throatMu, forecastResidualSD, personalizedBeta]);
  const forecastChartData = useMemo(() => {
    return forecastResiduals.slice(-14).map((r) => {
      const low = Math.max(1, r.yhat - forecastResidualSD);
      const high = Math.min(5, r.yhat + forecastResidualSD);
      return { date: r.date.slice(5), actual: r.actual, yhat: Math.round(r.yhat * 10) / 10, low, bandWidth: Math.max(0, high - low) };
    });
  }, [forecastResiduals, forecastResidualSD]);
  // ---- フェーズ2（02偏差値・01予報）用データ ここまで ----

  // ---- lavoce-収集データ拡張案.md C-1: 周期と声・メンタルの傾向 用データ ----
  // 周期日を4分割（1〜7/8〜14/15〜21/22日目以降）してグループ比較する。
  const cycleGroupStats = useMemo(() => {
    if (!profile.track_cycle) return [];
    const buckets = {
      "1〜7日目": { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 },
      "8〜14日目": { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 },
      "15〜21日目": { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 },
      "22日目以降": { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 }
    };
    Object.keys(filteredEntries).forEach((d) => {
      const day = cycleDayForDate(d, entries);
      if (day == null) return;
      const bucketKey = day <= 7 ? "1〜7日目" : day <= 14 ? "8〜14日目" : day <= 21 ? "15〜21日目" : "22日目以降";
      const e = filteredEntries[d];
      if (typeof e.throatCondition === "number") buckets[bucketKey].throatSum += e.throatCondition;
      if (typeof e.voiceQuality === "number") buckets[bucketKey].voiceSum += e.voiceQuality;
      if (typeof e.ease === "number") buckets[bucketKey].easeSum += e.ease;
      buckets[bucketKey].n += 1;
    });
    return Object.entries(buckets)
      .filter(([, s]) => s.n >= 2)
      .map(([label, s]) => ({
        label, n: s.n,
        avgThroat: s.n ? s.throatSum / s.n : null,
        avgVoice: s.n ? s.voiceSum / s.n : null,
        avgEase: s.n ? s.easeSum / s.n : null
      }));
  }, [filteredEntries, entries, profile.track_cycle]);
  const hasCycleData = useMemo(() => Object.values(entries).some((e) => e.cycleStart), [entries]);
  // ---- 周期と声・メンタルの傾向 用データ ここまで ----

  // ---- lavoce-収集データ拡張案.md E節 + レパートリー負荷パッチ.md: 曲目ごとの負荷 用データ ----
  // §1.4: 「無理なく出せる音域」（任意）があればそちらを優先し、なければ全音域を使う。
  const comfortableRangeMidi = useMemo(() => {
    const low = noteToMidi(profile.comfort_range_low) ?? noteToMidi(profile.vocal_range_low);
    const high = noteToMidi(profile.comfort_range_high) ?? noteToMidi(profile.vocal_range_high);
    const isEstimatedRange = !profile.comfort_range_low || !profile.comfort_range_high;
    if (low == null || high == null || high <= low) return null;
    return { low, high, center: (low + high) / 2, half: (high - low) / 2, isEstimatedRange };
  }, [profile.comfort_range_low, profile.comfort_range_high, profile.vocal_range_low, profile.vocal_range_high]);

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
  const overallThroatBaseline = useMemo(() => {
    const vals = Object.values(entries).map((e) => e.throatCondition).filter((v) => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [entries]);
  const roleLoadStats = useMemo(() => {
    if (!comfortableRangeMidi) return [];
    const byRole = {};
    const sortedDates = Object.keys(entries).sort();
    sortedDates.forEach((date, i) => {
      const e = entries[date];
      const name = (e.repertoire || "").trim();
      if (!name) return;
      const record = repertoireTessituraMap[name];
      if (!record) return;
      const resolved = resolveRepertoireD(record);
      if (!resolved) return;
      const songFactor = songFactorFromD(resolved.d);
      const actW = ACTIVITY_LOAD_WEIGHT[e.activityType] ?? 1.0;
      const minutes = typeof e.activityDuration === "number" ? e.activityDuration * 60 : 0;
      // §1.2: L_song = 演奏時間 × 活動係数 × songFactor（既存の発声負荷ACWRと単位が揃う）
      const load = minutes * actW * songFactor;
      if (!byRole[name]) byRole[name] = { name, record, loads: [], nextDayThroatDeviation: [] };
      byRole[name].loads.push(load);
      const nextDate = sortedDates[i + 1];
      if (nextDate && addDays(date, 1) === nextDate) {
        const nextEntry = entries[nextDate];
        // §4.3: 翌日の落ち込みは、生の平均ではなく「その人の平常値との偏差」で見る。
        if (typeof nextEntry.throatCondition === "number" && overallThroatBaseline != null) {
          byRole[name].nextDayThroatDeviation.push(nextEntry.throatCondition - overallThroatBaseline);
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
  }, [entries, repertoireTessituraMap, comfortableRangeMidi, overallThroatBaseline, personalTessituraOffset]);
  // ---- 曲目ごとの負荷 用データ ここまで ----

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
    return results.sort((a, b) => Math.abs(b.g) - Math.abs(a.g));
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
    if (value < 0.8) return { key: "low", label: "積み足りない", color: C.gold };
    if (value <= 1.3) return { key: "good", label: "ちょうどいい", color: C.sage };
    if (value <= 1.5) return { key: "caution", label: "増やしすぎ注意", color: C.gold };
    return { key: "high", label: "喉を痛めやすい急増", color: C.curtain };
  }
  const acwrChartData = useMemo(() => {
    const dates = Object.keys(acwrSeries).sort().slice(-28);
    return dates.map((d) => ({ date: d.slice(5), acwr: acwrSeries[d].acwr != null ? roundTo1(acwrSeries[d].acwr) : null }));
  }, [acwrSeries]);
  const acwrToday = useMemo(() => {
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
  }, [acwrSeries]);
  // ---- 発声負荷バランス 用データ ここまで ----

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
    const realToday = todayISO();
    const e = entries[realToday];
    if (!e) return null;
    const ah = computeAbsoluteHumidity(e.temperature, e.humidity);
    if (ah == null) return null;
    return { ah: roundTo1(ah), temp: e.temperature, rh: e.humidity, location: e.location || null };
  }, [entries]);
  // ---- 環境の快適帯 用データ ここまで ----

  // ---- lavoce-指標設計図.md 08. 本番ピーキング曲線 用データ ----
  const performanceDates = useMemo(() => Object.keys(entries).filter((d) => entries[d].activityType === "本番").sort(), [entries]);
  const nextPerformanceDate = useMemo(() => {
    const realToday = todayISO();
    return performanceDates.find((d) => d > realToday) || null;
  }, [performanceDates]);
  const pastPerformanceDates = useMemo(() => {
    const realToday = todayISO();
    return performanceDates.filter((d) => d <= realToday);
  }, [performanceDates]);
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

  // ---- lavoce-指標設計図.md「週次ボイスカルテ」用データ ----
  // 1週間ぶんを、先生・ボイストレーナー・耳鼻科に見せられる1枚にまとめる。
  const weeklyVoiceChart = useMemo(() => {
    const realToday = todayISO();
    const weekDates = [];
    for (let i = 6; i >= 0; i--) weekDates.push(addDays(realToday, -i));

    const deviationTrend = weekDates.map((d) => ({ date: d, score: computeDailyScore100(entries[d]) }));
    const symptomWeek = weekDates.map((d) => ({ date: d, symptoms: entries[d] ? (entries[d].throatSymptoms || []) : null }));
    const loadWeek = weekDates.map((d) => ({ date: d, acwr: acwrSeries[d] ? acwrSeries[d].acwr : null }));

    // 今週わかったこと1つ：声の時差マップの発見 → なければ効いた習慣ランキングの最上位 → なければ該当なし
    let keyFinding = null;
    if (topLagFinding) {
      keyFinding = `${topLagFinding.variableLabel}の「${topLagFinding.lag}日後」に、声への関係が最も強く出ています（ρ=${topLagFinding.rho.toFixed(2)}）。`;
    } else if (effectiveHabitRanking.length > 0 && effectiveHabitRanking[0].stars >= 2) {
      const top = effectiveHabitRanking[0];
      keyFinding = `${top.label}日は、翌日の声が平均で${top.g >= 0 ? "良く" : "悪く"}記録されています（効果量 g=${top.g.toFixed(2)}）。`;
    }

    const recordedCount = weekDates.filter((d) => entries[d]).length;
    return { weekDates, deviationTrend, symptomWeek, loadWeek, keyFinding, recordedCount };
  }, [entries, acwrSeries, topLagFinding, effectiveHabitRanking]);
  // ---- 週次ボイスカルテ 用データ ここまで ----


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
        vocal_profession: profile.vocal_profession || "singer",
        track_cycle: !!profile.track_cycle
      })
      .eq("id", userId);
    setProfileSaveStatus(error ? "error" : "saved");
    setTimeout(() => setProfileSaveStatus("idle"), 1800);
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

  function updateDetail(patch) {
    setFormData((f) => ({ ...f, activityDetail: { ...(f.activityDetail || {}), ...patch } }));
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
    setSaveStatus("saving");
    setSaveError("");
    const clean = { ...formData };
    if (clean.activityType !== "本番") clean.performanceQuality = null;
    const supabase = createClient();
    const { error } = await supabase
      .from("entries")
      .upsert(entryToRow(userId, clean), { onConflict: "user_id,date" });
    if (error) {
      setSaveStatus("error");
      setSaveError(error.message || t("errorUnknown"));
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    setEntries((prev) => ({ ...prev, [clean.date]: clean }));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1800);
    const msg = t(CARING_MESSAGE_KEYS[Math.floor(Math.random() * CARING_MESSAGE_KEYS.length)]);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
      <header
        className="px-4 sm:px-6 pb-4 sticky top-0 z-10"
        style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-3">
          <div>
            <h1 className="ff-display italic text-3xl sm:text-4xl" style={{ color: C.curtain }}>La Voce</h1>
            <p className="ff-mono text-xs tracking-widest uppercase mt-1" style={{ color: C.inkSoft }}>{t("appTagline")}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <div className="relative flex items-center">
              <Globe size={13} style={{ color: C.inkSoft, position: "absolute", left: 8, pointerEvents: "none" }} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label={t("languageLabel")}
                className="rounded-full border text-xs pl-7 pr-2 py-1.5 appearance-none"
                style={{ borderColor: C.line, color: C.inkSoft, background: C.card }}
              >
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
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
        <nav className="max-w-3xl mx-auto flex gap-1 mt-5 overflow-x-auto">
          {TABS.map((tab) => (
            tab.href ? (
              <a
                key={tab.key}
                href={tab.key === "voicetheory" ? (PROFESSION_THEORY_PAGES[profile.vocal_profession] || tab.href) : tab.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{ background: "transparent", color: C.inkSoft }}
              >
                <tab.icon size={15} />
                {t(tab.labelKey)}
              </a>
            ) : (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
                style={{ background: activeTab === tab.key ? C.curtain : "transparent", color: activeTab === tab.key ? "#FFFDF8" : C.inkSoft }}
              >
                <tab.icon size={15} />
                {t(tab.labelKey)}
              </button>
            )
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: C.curtain }} />
            <span className="text-sm" style={{ color: C.inkSoft }}>{t("loadingText")}</span>
          </div>
        ) : (
          <div key={activeTab} className="tab-panel">
            {activeTab === "today" && (
              <div className="space-y-5">
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

                <div className="rounded-2xl p-5 border flex justify-center" style={{ background: C.card, borderColor: C.line }}>
                  <Gauge score={currentScore} t={t} />
                </div>

                {yesterdayContext && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleYesterdayContext")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteYesterdayContext")}</p>
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
                  </div>
                )}

                {formData && (
                  <>
                    <SectionCard title={t("sectionVoiceThroat")} icon={Mic2}>
                      <DynamicsSelector t={t} label={t("labelThroatOverall")} icon={Mic2} value={formData.throatCondition}
                        onChange={(v) => setFormData((f) => ({ ...f, throatCondition: v }))} />
                      <DynamicsSelector t={t} label={t("labelVoiceOverall")} icon={Music2} value={formData.voiceQuality}
                        onChange={(v) => setFormData((f) => ({ ...f, voiceQuality: v }))} />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelWakeNote")}</label>
                          <input type="text" value={formData.wakeNote} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setFormData((f) => ({ ...f, wakeNote: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelRoutineNote")}</label>
                          <input type="text" value={formData.routineNote} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setFormData((f) => ({ ...f, routineNote: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">pp（極弱声）で出せた最高音</label>
                        <input type="text" value={formData.pianissimoHighNote} placeholder={t("placeholderNoteExample")}
                          onChange={(e) => setFormData((f) => ({ ...f, pianissimoHighNote: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.inkSoft }}>
                          <input type="checkbox" checked={!!formData.pianissimoOnsetDelay}
                            onChange={(e) => setFormData((f) => ({ ...f, pianissimoOnsetDelay: e.target.checked }))} />
                          発声の立ち上がりが遅れた（すぐに声が出なかった）
                        </label>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          「ハッピーバースデー」の出だしや5音下降を、できるだけ小さな声（囁くような弱声）で歌い、無理なく出せた最高音を記録します。大きな声より先に、むくみの兆候が出やすいとされています。
                        </p>
                      </div>
                      <p className="text-xs rounded-xl p-2.5 leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("noteNotationRule")}
                      </p>
                      <p className="text-xs rounded-xl p-2.5 leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                        {t("noteChestVoiceRule")}
                      </p>
                      <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                        <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>{t("labelRecommendedRoutineToggle")}</summary>
                        <p className="mt-2 leading-relaxed">{t("noteRecommendedRoutine")}</p>
                      </details>
                      <NumberField label={t("labelResonanceScore")} value={formData.resonanceScore} step={1} min={0} max={10}
                        onChange={(v) => setFormData((f) => ({ ...f, resonanceScore: v }))} />

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
                            <p><strong>数値が低い日</strong>：息漏れ・かすれ・声の立ち上がりの弱さなど、声帯の閉じが甘くなっている可能性を示唆します。むくみや疲労で声がかすれ始めても、自分では気づきにくいことがあります。</p>
                            <p><strong>できないこと</strong>：病名の診断はできません。あくまで「声のノイズっぽさ」を映す一つの物差しです。また、このアプリ独自の簡易計算のため、数値そのものを論文の基準値と比べることはできません。</p>
                            <p><strong>使い方のコツ</strong>：毎日同じような発声（力まず「あー」と伸ばす）で測ることで、自分自身の中での「今日は高い／低い」という変化を追いかけるのに向いています。上の「響きスコア」（自分の感覚）とズレがある日は、自覚より先に変化が出ている可能性があります。</p>
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
                          「あー」を5秒のばして録音すると、声のスペクトルの明瞭さ（CPPS）を自動で数値化します。上の「響きスコア」は自己申告、こちらは機械による客観値です。録音データ自体は保存せず、数値化した後にその場で破棄します。
                        </p>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          ※ このアプリ独自の簡易計算のため、数値そのものを医学論文の基準値と比べることはできません。あくまで「自分自身がこれまでよりCPPSが高いか低いか」という、ご自身の推移で見るための参考値です。
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium block mb-2">{t("labelSymptoms")}</span>
                        <div className="flex flex-wrap gap-2">
                          {SYMPTOM_OPTIONS.map((s) => (
                            <Chip key={s} label={t(SYMPTOM_KEYS[s])} active={(formData.throatSymptoms || []).includes(s)}
                              onClick={() => setFormData((f) => ({
                                ...f,
                                throatSymptoms: (f.throatSymptoms || []).includes(s)
                                  ? f.throatSymptoms.filter((x) => x !== s)
                                  : [...(f.throatSymptoms || []), s]
                              }))} />
                          ))}
                        </div>
                        <input type="text" value={formData.throatSymptomsOther} placeholder={t("labelSymptomsOther")}
                          onChange={(e) => setFormData((f) => ({ ...f, throatSymptomsOther: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm mt-2" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">{t("labelVoiceMemo")}</label>
                        <input type="text" value={formData.voiceMemo} placeholder={t("placeholderVoiceMemoQuick")}
                          onChange={(e) => setFormData((f) => ({ ...f, voiceMemo: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                        <p className="text-sm font-medium mb-1">{t("titleTimeSlotRecord")}</p>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteVoiceCheckinHelp")}</p>
                        <div className="space-y-4">
                          {VOICE_TIME_SLOTS.map(({ key, icon: SlotIcon, labelKey }) => (
                            <div key={key} className="rounded-xl p-3" style={{ background: C.paper }}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <SlotIcon size={14} style={{ color: C.gold }} />
                                <span className="text-sm font-medium">{t(labelKey)}</span>
                              </div>
                              <div className="space-y-3">
                                <DynamicsSelector t={t} label={t("labelThroatCondition")} icon={Mic2}
                                  value={((formData.voiceCheckins || {})[key] || {}).throat || 3}
                                  onChange={(v) => setFormData((f) => updateVoiceCheckin(f, key, "throat", v))} />
                                <DynamicsSelector t={t} label={t("labelVoiceQuality")} icon={Music2}
                                  value={((formData.voiceCheckins || {})[key] || {}).voice || 3}
                                  onChange={(v) => setFormData((f) => updateVoiceCheckin(f, key, "voice", v))} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title={t("sectionBodyData")} icon={Scale}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Ruler size={14} style={{ color: C.gold }} />
                            <label className="text-sm font-medium">{t("labelHeight")}(cm)</label>
                          </div>
                          <input
                            type="number"
                            value={profile.height_cm}
                            onChange={(e) => setProfile((p) => ({ ...p, height_cm: e.target.value === "" ? "" : Number(e.target.value) }))}
                            onWheel={(e) => e.target.blur()}
                            className="w-full rounded-lg border p-2 text-sm ff-mono"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelVoiceType")}</label>
                          <select
                            value={profile.voice_type}
                            onChange={(e) => setProfile((p) => ({ ...p, voice_type: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          >
                            <option value="">{t("labelSelectPlaceholder")}</option>
                            {VOICE_TYPES.map((v) => <option key={v} value={v}>{t(VOICE_TYPE_KEYS[v])}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelPhase")}</label>
                          <select
                            value={profile.nutrition_phase}
                            onChange={(e) => setProfile((p) => ({ ...p, nutrition_phase: e.target.value }))}
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
                            value={profile.protein_coefficient}
                            onChange={(e) => setProfile((p) => ({ ...p, protein_coefficient: e.target.value === "" ? "" : Number(e.target.value) }))}
                            onWheel={(e) => e.target.blur()}
                            className="w-full rounded-lg border p-2 text-sm ff-mono"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          />
                          <p className="text-xs mt-1" style={{ color: C.inkSoft }}>{t("noteProteinCoefficientRange")}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelAge")}</label>
                          <input
                            type="number"
                            value={profile.age}
                            onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value === "" ? "" : Number(e.target.value) }))}
                            onWheel={(e) => e.target.blur()}
                            className="w-full rounded-lg border p-2 text-sm ff-mono"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelSex")}</label>
                          <select
                            value={profile.sex}
                            onChange={(e) => setProfile((p) => ({ ...p, sex: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          >
                            <option value="">{t("sexNotAnswer")}</option>
                            <option value="男性">{t("sexMale")}</option>
                            <option value="女性">{t("sexFemale")}</option>
                          </select>
                        </div>
                      </div>

                      {profile.sex === "女性" && (
                        <div className="rounded-xl p-3 flex items-center justify-between gap-3" style={{ background: C.paper }}>
                          <div>
                            <p className="text-sm font-medium">月経周期を記録する</p>
                            <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                              周期開始日を1タップで記録し、分析タブで声・メンタルとの関連を見られるようにします。任意（オプトイン）です。
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProfile((p) => ({ ...p, track_cycle: !p.track_cycle }))}
                            className="flex-shrink-0"
                            style={{
                              width: 44, height: 26, borderRadius: 999, position: "relative",
                              background: profile.track_cycle ? C.curtain : C.line,
                              transition: "background 0.15s"
                            }}
                          >
                            <span style={{
                              position: "absolute", top: 3, left: profile.track_cycle ? 21 : 3,
                              width: 20, height: 20, borderRadius: 999, background: "#FFFDF8",
                              transition: "left 0.15s"
                            }} />
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium block mb-1.5">{t("labelVocalProfession")}</label>
                        <p className="text-xs mb-2" style={{ color: C.inkSoft }}>{t("noteVocalProfession")}</p>
                        <div className="flex gap-2 flex-wrap">
                          {VOCAL_PROFESSIONS.map((p) => (
                            <button key={p} type="button" onClick={() => setProfile((prev) => ({ ...prev, vocal_profession: p }))}
                              className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                              style={{
                                background: profile.vocal_profession === p ? C.curtain : C.paper,
                                color: profile.vocal_profession === p ? "#FFFDF8" : C.inkSoft,
                                border: `1px solid ${profile.vocal_profession === p ? C.curtain : C.line}`
                              }}>
                              {t(p === "singer" ? "professionSinger" : p === "announcer" ? "professionAnnouncer" : p === "voice_actor" ? "professionVoiceActor" : "professionPopMusical")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelVocalRangeLow")}</label>
                          <input type="text" value={profile.vocal_range_low} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setProfile((p) => ({ ...p, vocal_range_low: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelVocalRangeHigh")}</label>
                          <input type="text" value={profile.vocal_range_high} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setProfile((p) => ({ ...p, vocal_range_high: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                      </div>
                      <details className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                        <summary className="cursor-pointer font-medium" style={{ color: C.ink }}>無理なく出せる音域（任意）</summary>
                        <p className="mt-1.5 mb-2 leading-relaxed">
                          上の音域は「出せる限界」です。曲目ごとの負荷計算では、本来はもっと狭い「無理なく出せる音域」を使うのが正確です。空欄のままなら、上の音域をそのまま使います。
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <input type="text" value={profile.comfort_range_low} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setProfile((p) => ({ ...p, comfort_range_low: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.card }} />
                          <input type="text" value={profile.comfort_range_high} placeholder={t("placeholderNoteExample")}
                            onChange={(e) => setProfile((p) => ({ ...p, comfort_range_high: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm ff-mono" style={{ borderColor: C.line, background: C.card }} />
                        </div>
                      </details>
                      {(profile.vocal_profession || "singer") === "singer" && (
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
                        <input type="text" value={profile.technical_goal}
                          onChange={(e) => setProfile((p) => ({ ...p, technical_goal: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">{t("labelHealthNotes")}</label>
                        <textarea rows={2} value={profile.health_notes}
                          onChange={(e) => setProfile((p) => ({ ...p, health_notes: e.target.value }))}
                          className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>

                      <button onClick={handleSaveProfile} disabled={profileSaveStatus === "saving"}
                        className="text-xs px-4 py-2 rounded-full font-medium" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                        {profileSaveStatus === "saving" ? t("saveButtonSaving") : profileSaveStatus === "saved" ? t("saveButtonSaved") : t("btnSaveProfileSettings")}
                      </button>

                      <NumberField label={t("labelTodayWeight")} icon={Scale} value={formData.weightKg ?? ""} step={0.1} min={20} max={200} suffix="kg"
                        onChange={(v) => setFormData((f) => ({ ...f, weightKg: v }))} />

                      {profile.track_cycle && (
                        <div className="rounded-xl p-3" style={{ background: C.paper }}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">月経周期</p>
                              {(() => {
                                const day = cycleDayForDate(selectedDate, entries);
                                return (
                                  <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                                    {formData.cycleStart
                                      ? "この日を周期1日目として記録しています"
                                      : day != null
                                        ? `周期${day}日目`
                                        : "まだ周期開始日が記録されていません"}
                                  </p>
                                );
                              })()}
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData((f) => ({ ...f, cycleStart: !f.cycleStart }))}
                              className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                              style={{
                                background: formData.cycleStart ? C.curtain : C.card,
                                color: formData.cycleStart ? "#FFFDF8" : C.inkSoft,
                                border: `1px solid ${formData.cycleStart ? C.curtain : C.line}`
                              }}
                            >
                              {formData.cycleStart ? "1日目を取り消す" : "今日を1日目にする"}
                            </button>
                          </div>
                        </div>
                      )}

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

                      {profile.height_cm ? (
                        <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                          {currentBMI && <p>{t("labelCurrentBMI")}{currentBMI.toFixed(1)}</p>}
                          {weightRange && <p>{t("labelWeightRangeBasis")}{weightRange.min.toFixed(1)}kg 〜 {weightRange.max.toFixed(1)}kg</p>}
                          <p className="mt-1">{t("noteBMIDisclaimer")}</p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteRegisterHeightForRange")}</p>
                      )}
                    </SectionCard>

                    <SectionCard title={t("sectionSleepWater")} icon={Moon}>
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
                      <DotSelector label={t("labelSleepQuality")} icon={Moon} value={formData.sleepQuality} lowLabel={t("lowSleepQuality")} highLabel={t("highSleepQuality")}
                        onChange={(v) => setFormData((f) => ({ ...f, sleepQuality: v }))} />
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Droplets size={14} style={{ color: C.gold }} />
                          <label className="text-sm font-medium">{t("labelWaterBySlot")}</label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {MEAL_SLOTS.map((slot) => (
                            <div key={slot}>
                              <div className="text-xs mb-1" style={{ color: C.inkSoft }}>{t(MEAL_SLOT_KEYS[slot])}</div>
                              <MiniNumber
                                value={(formData.waterBySlot || {})[slot] ?? ""}
                                placeholder="ml"
                                onChange={(v) => setFormData((f) => ({ ...f, waterBySlot: { ...(f.waterBySlot || {}), [slot]: v } }))}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-right mt-2 ff-mono" style={{ color: C.inkSoft }}>{t("labelTotal")} {waterTotal}ml</p>
                      </div>
                    </SectionCard>

                    <SectionCard title={t("sectionMealDetail")} icon={Wheat}>
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
                                  {ev && <span className="font-medium" style={{ color: ev.color }}>{t(ev.labelKey)}</span>}
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
                    </SectionCard>

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
                      <div className="grid grid-cols-2 gap-4">
                        <NumberField label={t("labelTemperature")} icon={Thermometer} value={formData.temperature ?? ""} step={1} min={-30} max={50} suffix="℃"
                          onChange={(v) => setFormData((f) => ({ ...f, temperature: v }))} />
                        <NumberField label={t("labelHumidity")} icon={Wind} value={formData.humidity ?? ""} step={5} min={0} max={100} suffix="%"
                          onChange={(v) => setFormData((f) => ({ ...f, humidity: v }))} />
                      </div>
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
                    </SectionCard>

                    <SectionCard title={t("sectionPractice")} icon={Music2}>
                      <div>
                        <span className="text-sm font-medium block mb-2">{t("labelTodayActivity")}</span>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {ACTIVITY_OPTIONS.map((a) => {
                            const active = formData.activityType === a.key;
                            return (
                              <button key={a.key} type="button"
                                onClick={() => setFormData((f) => ({
                                  ...f,
                                  activityType: a.key,
                                  performanceQuality: a.key === "本番" ? (f.performanceQuality ?? 3) : f.performanceQuality
                                }))}
                                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                                style={{ background: active ? C.curtain : C.paper, color: active ? "#FFFDF8" : C.inkSoft, borderColor: active ? C.curtain : C.line }}
                              >
                                <a.icon size={16} />
                                {t(a.labelKey)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <NumberField label={t("labelActivityDuration")} value={formData.activityDuration ?? ""} step={0.5} min={0} max={24} suffix={t("unitHours")}
                          onChange={(v) => setFormData((f) => ({ ...f, activityDuration: v }))} />
                        <div>
                          <label className="text-sm font-medium block mb-1.5">{t("labelRepertoire")}</label>
                          <input type="text" value={formData.repertoire} placeholder={t("placeholderRepertoireExample")}
                            onChange={(e) => { setFormData((f) => ({ ...f, repertoire: e.target.value })); setDuplicateWarning(null); }}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          {formData.repertoire && !repertoireTessituraMap[formData.repertoire] && (() => {
                            const norm = normalizeTitle(formData.repertoire);
                            const suggestions = Object.entries(repertoireTessituraMap)
                              .filter(([name]) => name !== formData.repertoire && normalizeTitle(name).includes(norm))
                              .sort((a, b) => (repertoireUsageCounts[normalizeTitle(b[0])]?.count || 0) - (repertoireUsageCounts[normalizeTitle(a[0])]?.count || 0))
                              .slice(0, 4);
                            if (suggestions.length === 0) return null;
                            return (
                              <div className="mt-1.5 rounded-lg border overflow-hidden" style={{ borderColor: C.line }}>
                                {suggestions.map(([name, record]) => (
                                  <button key={name} type="button"
                                    onClick={() => { setFormData((f) => ({ ...f, repertoire: name })); setDuplicateWarning(null); }}
                                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between"
                                    style={{ background: C.card, borderBottom: `1px solid ${C.line}` }}>
                                    <span>{name}</span>
                                    <span className="ff-mono flex-shrink-0 ml-2" style={{ color: C.inkSoft }}>
                                      {record.topNote || record.tessituraNote || ""}・{repertoireUsageCounts[normalizeTitle(name)]?.count || 0}回
                                    </span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {formData.repertoire && repertoireTessituraMap[formData.repertoire] && (
                        <p className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.inkSoft }}>
                          「{formData.repertoire}」は登録済みです：
                          {repertoireTessituraMap[formData.repertoire].topNote && <> 最高音 <span className="ff-mono">{repertoireTessituraMap[formData.repertoire].topNote}</span></>}
                          {repertoireTessituraMap[formData.repertoire].tessituraNote && <> ・テッシトゥーラ <span className="ff-mono">{repertoireTessituraMap[formData.repertoire].tessituraNote}</span></>}
                        </p>
                      )}

                      {formData.repertoire && !repertoireTessituraMap[formData.repertoire] && (() => {
                        const norm = normalizeTitle(formData.repertoire);
                        const usageSoFar = (repertoireUsageCounts[norm] && repertoireUsageCounts[norm].count) || 0;
                        // §3.4-③: 一度スキップした曲に繰り返し登録を促さない（1回目・3回目の使用時だけ提示）
                        const shouldPrompt = usageSoFar === 0 || usageSoFar === 2;
                        if (!shouldPrompt || repertoireSkipped[norm]) return null;

                        if (duplicateWarning && duplicateWarning.forName === formData.repertoire) {
                          return (
                            <div className="rounded-xl p-3" style={{ background: C.paper }}>
                              <p className="text-xs font-medium mb-2">似た曲目が登録されています</p>
                              <p className="text-xs mb-2" style={{ color: C.ink }}>
                                「{duplicateWarning.existingName}」（{duplicateWarning.existingRecord.topNote || duplicateWarning.existingRecord.tessituraNote}・{repertoireUsageCounts[normalizeTitle(duplicateWarning.existingName)]?.count || 0}回）
                              </p>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setFormData((f) => ({ ...f, repertoire: duplicateWarning.existingName })); setDuplicateWarning(null); }}
                                  className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>
                                  同じ曲です
                                </button>
                                <button type="button" onClick={() => setDuplicateWarning({ ...duplicateWarning, confirmed: true })}
                                  className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                  別の曲です
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="rounded-xl p-3" style={{ background: C.paper }}>
                            <p className="text-xs font-medium mb-1">「{formData.repertoire}」を登録（1回だけ。あとから変えられます）</p>
                            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>
                              この曲の最高音は？（登録すると、次回から自動で「重い役ランキング」に使われます）
                            </p>
                            <input type="text" value={topNoteInput} placeholder={t("placeholderNoteExample")}
                              onChange={(e) => setTopNoteInput(e.target.value)}
                              className="w-full rounded-lg border p-2 text-sm mb-2" style={{ borderColor: C.line, background: C.card }} />

                            <details className="text-xs mb-2" open={showTessituraAccordion} onToggle={(e) => setShowTessituraAccordion(e.target.open)}>
                              <summary className="cursor-pointer" style={{ color: C.inkSoft }}>テッシトゥーラも入力する（任意）</summary>
                              <p className="mt-1.5 mb-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                                最高音とは別のものです。一瞬だけ出る高い音ではなく、<strong>曲全体を通して「だいたいこの高さで歌い続ける」中心の音域</strong>を指します。分かる場合だけで大丈夫です（空欄なら最高音から自動で推定します）。
                              </p>
                              <input type="text" value={tessituraOptionalInput} placeholder={t("placeholderNoteExample")}
                                onChange={(e) => setTessituraOptionalInput(e.target.value)}
                                className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.card }} />
                            </details>

                            {dOverrideChoice === null && !topNoteInput && (
                              <button type="button" onClick={() => setDOverrideChoice(0)} className="text-xs underline mb-2" style={{ color: C.inkSoft }}>
                                音名で答えられない場合はこちら
                              </button>
                            )}
                            {dOverrideChoice !== null && !topNoteInput && (
                              <div className="mb-2">
                                <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>自分の音域の中で、この曲はどのあたり？</p>
                                <div className="flex gap-2">
                                  {[["低め", -0.5], ["真ん中", 0], ["高め", 0.5]].map(([label, val]) => (
                                    <button key={label} type="button" onClick={() => setDOverrideChoice(val)}
                                      className="flex-1 py-1.5 rounded-full text-xs font-medium"
                                      style={{ background: dOverrideChoice === val ? C.curtain : C.card, color: dOverrideChoice === val ? "#FFFDF8" : C.inkSoft, border: `1px solid ${dOverrideChoice === val ? C.curtain : C.line}` }}>
                                      {label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button type="button" disabled={tessituraSaving || (!topNoteInput && dOverrideChoice == null)}
                                onClick={() => {
                                  const norm2 = normalizeTitle(formData.repertoire);
                                  if (!duplicateWarning || !duplicateWarning.confirmed) {
                                    const nearMatch = Object.keys(repertoireTessituraMap).find((existingName) => {
                                      if (existingName === formData.repertoire) return false;
                                      const existingNorm = normalizeTitle(existingName);
                                      return existingNorm.includes(norm2) || norm2.includes(existingNorm) || levenshteinDistance(existingNorm, norm2) <= 2;
                                    });
                                    if (nearMatch) {
                                      setDuplicateWarning({ forName: formData.repertoire, existingName: nearMatch, existingRecord: repertoireTessituraMap[nearMatch], confirmed: false });
                                      return;
                                    }
                                  }
                                  handleSaveRepertoire(formData.repertoire, {
                                    topNote: topNoteInput || null,
                                    tessituraNote: tessituraOptionalInput || null,
                                    dOverride: !topNoteInput && dOverrideChoice != null ? dOverrideChoice : null
                                  });
                                }}
                                className="flex-1 py-1.5 rounded-full text-xs font-medium"
                                style={{ background: C.curtain, color: "#FFFDF8", opacity: tessituraSaving || (!topNoteInput && dOverrideChoice == null) ? 0.5 : 1 }}>
                                登録する
                              </button>
                              <button type="button" onClick={() => setRepertoireSkipped((prev) => ({ ...prev, [norm]: true }))}
                                className="flex-1 py-1.5 rounded-full text-xs font-medium" style={{ background: C.card, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                                あとで
                              </button>
                            </div>
                          </div>
                        );
                      })()}


                      <div>
                        <span className="text-sm font-medium block mb-2">話し声の使用量（歌以外でどれだけ喋ったか）</span>
                        <div className="flex gap-2">
                          {[
                            { v: 0, label: "ほとんど喋っていない" },
                            { v: 1, label: "ふつう" },
                            { v: 2, label: "よく喋った" }
                          ].map((opt) => (
                            <button key={opt.v} type="button" onClick={() => setFormData((f) => ({ ...f, speakingLevel: opt.v }))}
                              className="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
                              style={{
                                background: formData.speakingLevel === opt.v ? C.curtain : C.paper,
                                color: formData.speakingLevel === opt.v ? "#FFFDF8" : C.inkSoft,
                                borderColor: formData.speakingLevel === opt.v ? C.curtain : C.line
                              }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-2 mt-2 text-xs" style={{ color: C.inkSoft }}>
                          <input type="checkbox" checked={!!formData.noisyEnvironment}
                            onChange={(e) => setFormData((f) => ({ ...f, noisyEnvironment: e.target.checked }))} />
                          騒がしい場所での会話が多かった（無意識に声が大きくなりやすい環境）
                        </label>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.inkSoft }}>
                          レッスンで喋る・騒がしい店での会話・電話など、歌っていない時間の声の使用も、発声負荷として発声負荷（ACWR）の計算に反映されます。
                        </p>
                      </div>

                      {formData.activityType === "休養" && (
                        <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                          <p className="text-sm font-medium mb-2">{t("labelRestMethodsHeader")}</p>
                          <div className="flex flex-wrap gap-2">
                            {REST_METHODS.map((m) => (
                              <Chip key={m} label={t(REST_METHOD_KEYS[m])} active={((formData.activityDetail || {}).restMethods || []).includes(m)}
                                onClick={() => {
                                  const current = (formData.activityDetail || {}).restMethods || [];
                                  updateDetail({ restMethods: current.includes(m) ? current.filter((x) => x !== m) : [...current, m] });
                                }} />
                            ))}
                          </div>
                          {((formData.activityDetail || {}).restMethods || []).includes("その他") && (
                            <input
                              type="text"
                              value={(formData.activityDetail || {}).restMethodOther || ""}
                              placeholder={t("placeholderRestOtherExample")}
                              onChange={(e) => updateDetail({ restMethodOther: e.target.value })}
                              className="w-full rounded-lg border p-2 text-sm mt-2"
                              style={{ borderColor: C.line, background: C.paper }}
                            />
                          )}
                          <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                            {t("noteRestMethodsFull")}
                          </p>
                        </div>
                      )}

                      {formData.activityType === "自主練習" && (
                        <div className="pt-2 border-t space-y-3" style={{ borderColor: C.line }}>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelPracticeMenu")}</label>
                            <textarea value={(formData.activityDetail || {}).practiceMenu || ""} rows={2}
                              placeholder={t("placeholderPracticeMenuExample")}
                              onChange={(e) => updateDetail({ practiceMenu: e.target.value })}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelPracticeResult")}</label>
                            <textarea value={(formData.activityDetail || {}).practiceResult || ""} rows={2}
                              placeholder={t("placeholderPracticeResult")}
                              onChange={(e) => updateDetail({ practiceResult: e.target.value })}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                        </div>
                      )}

                      {formData.activityType === "レッスン" && (
                        <div className="pt-2 border-t space-y-3" style={{ borderColor: C.line }}>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelTeacherNotes")}</label>
                            <textarea value={(formData.activityDetail || {}).teacherNotes || ""} rows={3}
                              placeholder={t("placeholderTeacherNotes")}
                              onChange={(e) => updateDetail({ teacherNotes: e.target.value })}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelLessonSummary")}</label>
                            <textarea value={(formData.activityDetail || {}).lessonSummary || ""} rows={3}
                              placeholder={t("placeholderLessonSummary")}
                              onChange={(e) => updateDetail({ lessonSummary: e.target.value })}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                        </div>
                      )}

                      {formData.activityType === "リハーサル" && (
                        <p className="text-xs pt-2 border-t" style={{ borderColor: C.line, color: C.inkSoft }}>
                          {t("noteRehearsalHint")}
                        </p>
                      )}

                      {formData.activityType === "本番" && (
                        <div className="pt-2 border-t space-y-4" style={{ borderColor: C.line }}>
                          <DynamicsSelector t={t} label={t("targetPerformance")} icon={Sparkles} value={formData.performanceQuality || 3}
                            onChange={(v) => setFormData((f) => ({ ...f, performanceQuality: v }))} />
                          <DynamicsSelector t={t} label={t("labelTalk")} icon={Sparkles} value={(formData.activityDetail || {}).talkQuality || 3}
                            onChange={(v) => updateDetail({ talkQuality: v })} />
                          <DynamicsSelector t={t} label={t("labelStageManner")} icon={Sparkles} value={(formData.activityDetail || {}).stageManner || 3}
                            onChange={(v) => updateDetail({ stageManner: v })} />
                          <div>
                            <label className="text-sm font-medium block mb-1.5">{t("labelComment")}</label>
                            <textarea value={(formData.activityDetail || {}).performanceComment || ""} rows={3}
                              placeholder={t("placeholderPerformanceComment")}
                              onChange={(e) => updateDetail({ performanceComment: e.target.value })}
                              className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                          </div>
                        </div>
                      )}
                    </SectionCard>

                    <SectionCard title={t("sectionExercise")} icon={Dumbbell}>
                      <p className="text-xs" style={{ color: C.inkSoft }}>{t("noteExerciseHelp")}</p>
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
                      <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                        <p className="font-medium mb-1" style={{ color: C.ink }}>{t("labelRecommendedExercise")}</p>
                        <p>・{t("exerciseTipBreath")}</p>
                        <p>・{t("exerciseTipPosture")}</p>
                        <p>・{t("exerciseTipEndurance")}</p>
                        <p className="mt-1">{t("noteSeeHealthInfo")}</p>
                      </div>
                    </SectionCard>

                    <SectionCard title={t("sectionMental")} icon={HeartHandshake}>
                      <DotSelector label={t("labelMentalEase")} icon={HeartHandshake} value={formData.ease} lowLabel={t("lowTension")} highLabel={t("highCalm")}
                        onChange={(v) => setFormData((f) => ({ ...f, ease: v }))} />
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
                    </SectionCard>

                    <SectionCard title={t("sectionMemo")} icon={NotebookPen}>
                      <textarea value={formData.notes} rows={3} placeholder={t("placeholderGeneralNotes")}
                        onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </SectionCard>

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
              </div>
            )}

            {activeTab === "garden" && (
              <CharacterHome
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

            {activeTab === "history" && (
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
                          className="aspect-square rounded-lg flex items-center justify-center text-xs ff-mono"
                          style={{
                            background: c.entry ? levelColor(c.entry.throatCondition) : C.paper,
                            color: c.entry ? "#FFFDF8" : C.inkSoft,
                            border: c.iso === todayISO() ? `2px solid ${C.gold}` : `1px solid ${C.line}`,
                            opacity: c.iso > todayISO() ? 0.4 : 1
                          }}>
                          {c.day}
                        </button>
                      )
                    )}
                  </div>
                </div>

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
                              style={{ background: levelColor(e.throatCondition), color: "#FFFDF8" }}>
                              {levelDynamic(e.throatCondition)}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedDate(date); setActiveTab("today"); }}>
                              <div className="text-sm font-medium">{formatDateLabel(date, language)}</div>
                              <div className="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap" style={{ color: C.inkSoft }}>
                                <ActIcon size={12} />
                                <span>{t((ACTIVITY_OPTIONS.find((a) => a.key === e.activityType) || {}).labelKey) || e.activityType}</span>
                                {e.activityType === "本番" && e.performanceQuality && <span>・{t("targetPerformance")} {levelDynamic(e.performanceQuality)}</span>}
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

            {activeTab === "analysis" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleVocalScore")}</h3>
                  <p className="text-xs mb-4" style={{ color: C.inkSoft }}>{t("noteVocalScore")}</p>
                  {!vocalConditionScore.hasEnoughData ? (
                    <p className="text-xs rounded-xl p-3" style={{ background: C.paper, color: C.inkSoft }}>
                      {t("noteVocalScoreNotEnough").replace("{count}", vocalConditionScore.daysCount)}
                    </p>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="ff-display italic" style={{ fontSize: "3.4rem", lineHeight: 1, color: levelColor(vocalConditionScore.total / 20) }}>
                          {vocalConditionScore.total}
                        </span>
                        <span className="text-sm mb-1.5" style={{ color: C.inkSoft }}>/ 100</span>
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

                {recordedDaysTotal >= 7 ? (
                  deviationScore && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">コンディション偏差値</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        100点満点の絶対評価だと、良い日も悪い日も似た点数に集まりがちです。自分の直近{deviationScore.n}日の分布の中で、今日がどこにいるかで見ます。
                      </p>
                      <div className="flex items-center gap-5">
                        <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
                          <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="50" cy="50" r="42" fill="none" stroke={C.paper} strokeWidth="10" />
                            <circle
                              cx="50" cy="50" r="42" fill="none"
                              stroke={deviationScore.T >= 60 ? C.sage : deviationScore.T <= 40 ? C.curtain : C.gold}
                              strokeWidth="10" strokeLinecap="round"
                              strokeDasharray={`${(Math.min(100, Math.max(0, (deviationScore.T - 20) / 60 * 100)) / 100) * 264} 264`}
                            />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span className="ff-display italic" style={{ fontSize: "1.7rem", color: C.ink }}>{deviationScore.T}</span>
                            <span className="text-xs" style={{ color: C.inkSoft }}>偏差値</span>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: C.ink }}>
                          今日は<strong>偏差値{deviationScore.T}</strong>。この{deviationScore.n}日間で上から{deviationScore.topPercentPct}%、
                          <strong>{deviationScore.position}番目に良い日</strong>です。
                        </p>
                      </div>
                      <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                        ※ 絶対値ではなく、自分自身の記録の中での相対的な位置を示す参考値です。
                      </p>
                    </div>
                  )
                ) : (
                  <LockedCard
                    title="コンディション偏差値"
                    teaser="今日が「自分比でどのくらい良い日か」を偏差値で見られます"
                    current={recordedDaysTotal}
                    required={7}
                  />
                )}

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
                    {Object.values(entries).some((e) => e.activityType === "本番") && (
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
                <div className="pt-2">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderVoice")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderVoiceDesc")}
                  </p>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleVoicePrediction")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteVoicePrediction")}</p>
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
                        <p className="text-xs rounded-xl p-3" style={{ background: "rgba(122,150,109,0.12)", color: C.sage }}>
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

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">声の予報</h3>
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
                            <span className="ff-display italic" style={{ fontSize: "2.4rem", color: levelColor(Math.round(todayForecast.yhat)) }}>
                              {todayForecast.yhat.toFixed(1)}
                            </span>
                            <span className="text-sm" style={{ color: C.inkSoft }}>/ 5</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: C.inkSoft }}>
                            予測区間 {todayForecast.low.toFixed(1)}〜{todayForecast.high.toFixed(1)}
                          </p>
                        </div>
                        {forecastHitRate && (
                          <div className="text-right">
                            <div className="ff-mono" style={{ fontSize: "1.2rem", color: C.ink }}>{forecastHitRate.rate}%</div>
                            <p className="text-xs" style={{ color: C.inkSoft }}>直近{forecastHitRate.n}日の的中率</p>
                          </div>
                        )}
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
                  </p>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleTimeOfDayTrend")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteTimeOfDayTrend")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {timeOfDayStats.map(({ key, icon: SlotIcon, labelKey, avgThroat, avgVoice, n }) => {
                      const best = timeOfDayStats
                        .filter((s) => s.avgThroat != null)
                        .reduce((a, b) => (a && a.avgThroat >= b.avgThroat ? a : b), null);
                      const isBest = best && best.key === key && n > 0;
                      return (
                        <div key={key} className="rounded-xl p-3 text-center" style={{ background: C.paper, border: isBest ? `1.5px solid ${C.gold}` : "none" }}>
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <SlotIcon size={13} style={{ color: C.gold }} />
                            <span className="text-xs font-medium">{t(labelKey)}</span>
                          </div>
                          <div className="ff-display italic text-xl" style={{ color: avgThroat != null ? levelColor(avgThroat) : C.inkSoft }}>
                            {levelDynamic(avgThroat)}
                          </div>
                          <div className="text-xs ff-mono mt-0.5" style={{ color: C.inkSoft }}>
                            {n > 0 ? t("timeOfDayStatLine").replace("{voice}", avgVoice != null ? avgVoice.toFixed(1) : "-").replace("{throat}", avgThroat != null ? avgThroat.toFixed(1) : "-") : t("labelNoRecordShort")}
                          </div>
                          {isBest && <div className="text-xs mt-1" style={{ color: C.gold }}>{t("labelGoodTrend")}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {voiceMemoEntries.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleVoiceMemoReview")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteVoiceMemoReview")}</p>
                    <div className="space-y-2">
                      {voiceMemoEntries.map((e) => (
                        <div key={e.date} className="rounded-xl p-2.5" style={{ background: C.paper }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs ff-mono" style={{ color: C.inkSoft }}>{e.date}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: levelColor(e.throatCondition), color: "#FFFDF8" }}>
                              喉{levelDynamic(e.throatCondition)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: levelColor(e.voiceQuality), color: "#FFFDF8" }}>
                              声{levelDynamic(e.voiceQuality)}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: C.ink }}>{e.voiceMemo}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                            <Cell key={i} fill={levelColor(d.sleepQuality)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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
                        <Line type="monotone" dataKey="resonanceScore" name={t("labelResonanceScore")} stroke={C.gold} strokeWidth={2} dot={{ r: 3 }} connectNulls />
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
                    点線（pp最高音）が下がり始めた日は、自覚より早く声帯のむくみが出ているサインかもしれません。
                  </p>
                </div>

                {recordedDaysTotal >= 3 ? (
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
                                <span className="text-xs ff-mono" style={{ width: 44, color: C.inkSoft }}>{d.dateLabel}</span>
                                <div style={{ position: "relative", flex: 1, height: 14 }}>
                                  <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 2, background: C.line }} />
                                  <div style={{ position: "absolute", top: 5, left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%`, height: 4, borderRadius: 2, background: barColor }} />
                                  <div style={{ position: "absolute", top: 2, left: `calc(${pct(d.wakeMidi)}% - 5px)`, width: 10, height: 10, borderRadius: 999, background: C.gold, border: `1.5px solid ${C.card}` }} />
                                  <div style={{ position: "absolute", top: 2, left: `calc(${pct(d.routineMidi)}% - 5px)`, width: 10, height: 10, borderRadius: 999, background: C.sage, border: `1.5px solid ${C.card}` }} />
                                </div>
                                <span className="text-xs ff-mono" style={{ width: 36, textAlign: "right", color: C.ink }}>{d.deltaST >= 0 ? "+" : ""}{d.deltaST}</span>
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
                ) : (
                  <LockedCard
                    title="ウォームアップ効率"
                    teaser="起き抜けとルーティン後の声の差を、半音数で毎朝チェックできます"
                    current={recordedDaysTotal}
                    required={3}
                  />
                )}

                {recordedDaysTotal >= 3 ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">音域到達マップ</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      記録した地声の音を鍵盤の上に置いています。下段のグレーが自己ベスト、色つきが選んだ期間の到達範囲です。
                    </p>
                    {personalBestRange && rangeThisPeriod ? (
                      <>
                        <PianoKeyboard
                          lowMidi={Math.min(personalBestRange.low, rangeThisPeriod.low) - 1}
                          highMidi={Math.max(personalBestRange.high, rangeThisPeriod.high) + 1}
                          bestLow={personalBestRange.low}
                          bestHigh={personalBestRange.high}
                          currentLow={rangeThisPeriod.low}
                          currentHigh={rangeThisPeriod.high}
                          newRecord={isNewRecord}
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
                        </div>
                        <p className="text-xs mt-3" style={{ color: C.ink }}>
                          {isNewRecord
                            ? "自己ベストを更新する記録が出ています。"
                            : rangeFullnessPct != null
                              ? <>選んだ期間の音域は、自己ベストの<span className="ff-mono" style={{ fontWeight: 600 }}> {rangeFullnessPct}%</span>まで戻ってきています。</>
                              : null}
                        </p>
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
                ) : (
                  <LockedCard
                    title="音域到達マップ"
                    teaser="記録した声の高さを鍵盤の上で確認できます"
                    current={recordedDaysTotal}
                    required={3}
                  />
                )}

                {recordedDaysTotal >= 3 ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">症状カレンダーと連鎖</h3>
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
                                <div className="text-xs" style={{ width: 80, flexShrink: 0, color: C.inkSoft }}>{t(SYMPTOM_KEYS[symptom])}</div>
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
                ) : (
                  <LockedCard
                    title="症状カレンダーと連鎖"
                    teaser="8種類の症状を、日付×症状の格子で振り返れます"
                    current={recordedDaysTotal}
                    required={3}
                  />
                )}

                <div className="pt-2">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderBody")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderBodyDesc")}
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
                        <Line type="monotone" dataKey="weightKg" name={t("chartNameWeight")} stroke={C.curtain} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleProteinTrend")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteProteinTrendTarget")}</p>
                  <div style={{ width: "100%", height: 200 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: C.inkSoft }} unit="g/kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <ReferenceLine y={Number(profile.protein_coefficient) || 1.6} stroke={C.gold} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="proteinPerKg" name={t("chartNameActualCoefficient")} stroke={C.sage} strokeWidth={2} dot={{ r: 3 }} connectNulls />
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
                        <Line type="monotone" dataKey="calorieTarget" name={t("chartNameCalorieTarget")} stroke={C.curtain} strokeDasharray="4 4" dot={false} connectNulls />
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
                        <Line type="monotone" dataKey="weightKg" name={t("chartNameWeight")} stroke={C.sage} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: "100%", height: 110, marginTop: 8 }}>
                    <ResponsiveContainer>
                      <LineChart data={timeSeries} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.inkSoft }} />
                        <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: C.inkSoft }} unit="g/kg" />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                        <ReferenceLine y={Number(profile.protein_coefficient) || 1.6} stroke={C.gold} strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="proteinPerKg" name={t("chartNameActualCoefficient")} stroke={C.curtain} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                    3つの指標を、それぞれ実際のスケールのまま、x軸だけ揃えて上下に並べています。1枚のグラフに複数の軸を重ねると、交点の位置が軸の取り方次第で変わってしまうため、この形にしています。
                  </p>
                </div>
                <div className="pt-2">
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
                                  <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: C.paper, color: C.ink, fontSize: 11 }}>
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
                {(mentalTagStats.low.length > 0 || mentalTagStats.high.length > 0) && (
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
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <h2 className="ff-display italic text-xl mb-1" style={{ color: C.ink }}>{t("groupHeaderOverall")}</h2>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {t("groupHeaderOverallDesc")}
                  </p>
                </div>
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
                {profile.track_cycle && hasCycleData && cycleGroupStats.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">周期と声・メンタルの傾向</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      記録した周期開始日をもとに、周期を4つに区切って声・メンタルの平均を比べています。
                    </p>
                    <div className="space-y-2">
                      {cycleGroupStats.map((s) => (
                        <div key={s.label} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                          <span className="font-medium">{s.label}</span>
                          <span className="ff-mono" style={{ color: C.inkSoft }}>
                            {t("groupStatLine").replace("{throat}", s.avgThroat != null ? s.avgThroat.toFixed(1) : "-").replace("{voice}", s.avgVoice != null ? s.avgVoice.toFixed(1) : "-").replace("{ease}", s.avgEase != null ? s.avgEase.toFixed(1) : "-").replace("{n}", s.n)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      ※ あくまで記録上の傾向であり、医学的な診断ではありません。件数が少ないうちは参考程度にご覧ください。
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
                                <p className="text-xs mt-1" style={{ color: C.sage }}>この役はあなたに合っているのかもしれません</p>
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
                              <span className="text-xs flex-shrink-0" style={{ color: C.gold }}>
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
                                    <div style={{ position: "absolute", left: `${pct(r.ciLow)}%`, width: `${pct(r.ciHigh) - pct(r.ciLow)}%`, top: 9, height: 3, borderRadius: 2, background: inconclusive ? C.line : (r.g >= 0 ? C.sage : C.curtain) }} />
                                    <div style={{ position: "absolute", left: `calc(${pct(r.g)}% - 5px)`, top: 5, width: 10, height: 10, borderRadius: 999, background: inconclusive ? C.inkSoft : (r.g >= 0 ? C.sage : C.curtain) }} />
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
                            <th style={{ textAlign: "left", fontSize: 11, color: C.inkSoft, fontWeight: 500, padding: "2px 6px" }}></th>
                            {[0, 1, 2, 3].map((lag) => (
                              <th key={lag} style={{ fontSize: 11, color: C.inkSoft, fontWeight: 500, padding: "2px 6px" }}>{lag}日後</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {LAG_VARIABLES.map((v) => (
                            <tr key={v.key}>
                              <td style={{ fontSize: 11, color: C.ink, padding: "2px 6px", whiteSpace: "nowrap" }}>{v.label}</td>
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
                                        fontSize: 10, color: C.ink, fontFamily: "monospace"
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
                {recordedDaysTotal >= 28 ? (
                  acwrToday && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">発声負荷バランス（ACWR）</h3>
                      <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                        直近1週間の発声負荷が、この1か月の平均に対して何倍かを見ます。歌い込みすぎと、積み足りない状態の両方を1つの数字で管理できます。
                      </p>
                      <div className="flex items-end gap-4 mb-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="ff-display italic" style={{ fontSize: "2.6rem", color: acwrToday.zone ? acwrToday.zone.color : C.ink }}>
                            {acwrToday.value}
                          </span>
                          {acwrToday.zone && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: C.paper, color: acwrToday.zone.color }}>
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
                              <Line type="monotone" dataKey="acwr" stroke={C.ink} strokeWidth={2} dot={{ r: 2 }} connectNulls />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <p className="text-xs mt-2" style={{ color: C.inkSoft }}>
                        帯は目安のゾーン（下から積み足りない・ちょうどいい・増やしすぎ注意・急増）です。1.5を超える急な増やし方は、喉のトラブルと結びつくことが知られています。
                      </p>
                    </div>
                  )
                ) : (
                  <LockedCard
                    title="発声負荷バランス（ACWR）"
                    teaser="歌い込みすぎ・積み足りないを1つの数字で管理できます"
                    current={recordedDaysTotal}
                    required={28}
                  />
                )}
                {recordedDaysTotal >= 7 ? (
                  comfortZone1D && (
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-1">環境の快適帯</h3>
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
                            <YAxis domain={[1, 5]} tick={{ fontSize: 10, fill: C.inkSoft }} />
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
                                    <th key={rh} style={{ fontSize: 9, color: C.inkSoft, padding: "2px 4px" }}>{rh}%</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {comfortZone2D.tBins.map((t) => (
                                  <tr key={t}>
                                    <td style={{ fontSize: 9, color: C.inkSoft, padding: "2px 4px", whiteSpace: "nowrap" }}>{t}℃</td>
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
                ) : (
                  <LockedCard
                    title="環境の快適帯"
                    teaser="自分の喉が快適な気温・湿度のゾーンが分かります"
                    current={recordedDaysTotal}
                    required={7}
                  />
                )}
                {peakingCurve ? (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">本番ピーキング曲線</h3>
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
                ) : (
                  <LockedCard
                    title="本番ピーキング曲線"
                    teaser="本番前後の仕上がり方の、あなた固有の型が分かります"
                    current={pastPerformanceDates.length}
                    required={3}
                  />
                )}

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }} id="weekly-voice-chart">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="ff-display italic text-lg">週次ボイスカルテ</h3>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0"
                      style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}
                    >
                      印刷・PDF保存
                    </button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    直近1週間ぶんを1枚にまとめています。先生・ボイストレーナー・耳鼻咽喉科に見せる時にお使いください。
                  </p>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                    {weeklyVoiceChart.weekDates[0].slice(5)} 〜 {weeklyVoiceChart.weekDates[6].slice(5)}（記録{weeklyVoiceChart.recordedCount}/7日）
                  </p>

                  <p className="text-xs font-medium mb-1.5">コンディションの推移</p>
                  <div style={{ width: "100%", height: 100 }}>
                    <ResponsiveContainer>
                      <LineChart data={weeklyVoiceChart.deviationTrend.map((d) => ({ date: d.date.slice(5), score: d.score != null ? Math.round(d.score) : null }))} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: C.inkSoft }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                        <Line type="monotone" dataKey="score" stroke={C.gold} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-xs font-medium mb-1.5 mt-4">症状カレンダー</p>
                  <div className="space-y-1">
                    {SYMPTOM_OPTIONS.map((symptom) => (
                      <div key={symptom} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="text-xs" style={{ width: 76, flexShrink: 0, color: C.inkSoft }}>{t(SYMPTOM_KEYS[symptom])}</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {weeklyVoiceChart.symptomWeek.map((d) => {
                            const has = d.symptoms && d.symptoms.includes(symptom);
                            return <div key={d.date} title={d.date} style={{ width: 14, height: 14, borderRadius: 3, background: has ? C.curtain : C.paper, flexShrink: 0 }} />;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs font-medium mb-1.5 mt-4">発声負荷（ACWR）</p>
                  <div style={{ width: "100%", height: 90 }}>
                    <ResponsiveContainer>
                      <LineChart data={weeklyVoiceChart.loadWeek.map((d) => ({ date: d.date.slice(5), acwr: d.acwr != null ? roundTo1(d.acwr) : null }))} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                        <CartesianGrid stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: C.inkSoft }} />
                        <YAxis domain={[0, "auto"]} tick={{ fontSize: 9, fill: C.inkSoft }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: C.line }} />
                        <Line type="monotone" dataKey="acwr" stroke={C.sage} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-xs font-medium mb-1.5 mt-4">今週わかったこと</p>
                  <p className="text-xs rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                    {weeklyVoiceChart.keyFinding || "まだ十分な記録がなく、確かな発見は出ていません。記録が増えると、ここに自動で表示されます。"}
                  </p>

                  <p className="text-xs mt-4" style={{ color: C.inkSoft }}>
                    ※ ここに書かれている内容は記録にもとづく参考情報であり、医学的な診断ではありません。「印刷・PDF保存」はブラウザの印刷機能を使った簡易的なものです。
                  </p>
                </div>

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
                          if (part === "{right}") return <span key={i} style={{ color: C.sage, fontWeight: 500 }}>{t("wordRight")}</span>;
                          if (part === "{left}") return <span key={i} style={{ color: C.curtain, fontWeight: 500 }}>{t("wordLeft")}</span>;
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
                    </div>

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
                              <Scatter data={scatterInfo.pairs} fill={C.gold} />
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
                {compositePatternInsight && compositePatternInsight.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleCompositeInsight")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>
                      {t("noteCompositeInsight")}
                    </p>
                    <div className="space-y-2">
                      {compositePatternInsight.map((s, i) => (
                        <p key={i} className="text-xs leading-relaxed rounded-xl p-2.5" style={{ background: C.paper, color: C.ink }}>
                          {s}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs mt-3" style={{ color: C.inkSoft }}>
                      {t("noteCompositeInsightDisclaimer")}
                    </p>
                  </div>
                )}

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

            {activeTab === "info" && <HealthInfo language={language} />}
          </div>
        )}
      </main>
    </div>
  );
}

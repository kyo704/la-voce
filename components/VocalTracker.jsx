"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Mic2, Moon, Droplets, Thermometer, Wind, MapPin, Music2, HeartHandshake,
  NotebookPen, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Trash2,
  Loader2, Check, Plus, Minus, Sparkles, Utensils, LogOut, CreditCard, Bot, MessageCircle, Home,
  Wheat, Egg, Droplet, Leaf, Dumbbell, Ruler, Scale, BookOpen, X, Sunrise, Sun, Sunset, Globe
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine, LineChart, Line, ComposedChart
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { C, LEVEL_COLORS, LEVEL_DYNAMICS, LEVEL_DYNAMIC_DESC } from "@/lib/tokens";
import { FOOD_PRESETS } from "@/lib/foodPresets";
import { SINGLE_SLOT_CATEGORIES, MULTI_SLOT_CATEGORIES, SHOP_ITEMS, PLACEMENT_LIMITS } from "@/lib/character";
import { LANGUAGES, createTranslator } from "@/lib/translations";
import HealthInfo from "@/components/HealthInfo";
import CharacterHome from "@/components/CharacterHome";

/* ---------- constants ---------- */
const SYMPTOM_OPTIONS = ["乾燥", "嗄れ", "痛み", "違和感", "鼻づまり", "咳", "裏返り", "喉の張り感"];
const SYMPTOM_KEYS = { "乾燥": "symptomDry", "嗄れ": "symptomHoarse", "痛み": "symptomPain", "違和感": "symptomDiscomfort", "鼻づまり": "symptomStuffyNose", "咳": "symptomCough", "裏返り": "symptomBreak", "喉の張り感": "symptomTightness" };
const DINNER_TAGS = ["揚げ物", "あっさり", "炭酸", "トマト系", "カフェイン", "アルコール"];
const DINNER_TAG_KEYS = { "揚げ物": "dinnerFried", "あっさり": "dinnerLight", "炭酸": "dinnerCarbonated", "トマト系": "dinnerTomato", "カフェイン": "dinnerCaffeine", "アルコール": "dinnerAlcohol" };

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
  { key: "advice", labelKey: "tabAdvice", icon: Bot },
  { key: "info", labelKey: "tabInfo", icon: BookOpen },
  { key: "voicetheory", labelKey: "tabVoiceTheory", icon: Music2, href: "/vocal-theory" }
];

/* ---------- helpers ---------- */
function toISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function todayISO() {
  return toISODate(new Date());
}
function addDays(iso, delta) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}
const LOCALE_MAP = { ja: "ja-JP", en: "en-US", zh: "zh-CN", it: "it-IT", de: "de-DE", fr: "fr-FR", es: "es-ES", ko: "ko-KR" };
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
      dinnerTags: existing.dinnerTags || []
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
    notes: "",
    weightKg: "",
    meals: [],
    exercises: []
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
    map.set(f.name, { name: f.name, reading: f.reading || null, i18n: f.i18n || null, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber, isPreset: true, unit: f.unit || null, unitWeight: f.unitWeight || null, date: "0000-00-00" });
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
    throatSymptomsOther: row.throat_symptoms_other || "",
    voiceMemo: row.voice_memo || "",
    activityDetail: row.activity_detail || {},
    wakeNote: row.wake_note || "",
    routineNote: row.routine_note || "",
    resonanceScore: row.resonance_score,
    bedtime: row.bedtime || "",
    dinnerTime: row.dinner_time || "",
    dinnerTags: row.dinner_tags || []
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
    throat_symptoms_other: e.throatSymptomsOther || "",
    voice_memo: e.voiceMemo || "",
    activity_detail: e.activityDetail || {},
    wake_note: e.wakeNote || "",
    routine_note: e.routineNote || "",
    resonance_score: numOrNull(e.resonanceScore),
    bedtime: e.bedtime || "",
    dinner_time: e.dinnerTime || "",
    dinner_tags: e.dinnerTags || []
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
// MIDI ノート番号を音名表記（国際式）に戻す。
function midiToNoteLabel(midi) {
  if (midi == null || Number.isNaN(midi)) return "-";
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const name = names[((midi % 12) + 12) % 12];
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
  const matches = q
    ? (foodLibrary || []).filter((f) => {
        const nameNorm = normalizeForSearch(f.name);
        const readingNorm = f.reading ? normalizeForSearch(f.reading) : "";
        return nameNorm.includes(q) || (readingNorm && readingNorm.includes(q));
      }).slice(0, 6)
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
                    ? `（100gあたり 炭${f.carbs}・蛋${f.protein}・脂${f.fat}・繊${f.fiber}g）`
                    : `（炭${f.carbs || 0}・蛋${f.protein || 0}・脂${f.fat || 0}・繊${f.fiber || 0}g）`}
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
            <p className="text-xs mb-2" style={{ color: C.inkSoft }}>1{item.presetUnit}あたり約{item.presetUnitWeight}g換算・合計{item.grams}g</p>
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
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [formData, setFormData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [language, setLanguage] = useState("ja");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null);
  const [selectedFactorKey, setSelectedFactorKey] = useState(null);
  const [analysisTarget, setAnalysisTarget] = useState("performance");
  const [adviceText, setAdviceText] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [adviceGeneratedAt, setAdviceGeneratedAt] = useState(null);
  const [profile, setProfile] = useState({ height_cm: "", voice_type: "", nutrition_phase: "維持", protein_coefficient: 1.6, age: "", sex: "", garden_theme: "rose", vocal_range_low: "", vocal_range_high: "", technical_goal: "", health_notes: "" });
  const [ownedItemKeys, setOwnedItemKeys] = useState([]);
  const [characterEquipped, setCharacterEquipped] = useState({});
  const [characterPointsSpent, setCharacterPointsSpent] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaveStatus, setProfileSaveStatus] = useState("idle");

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
      const { data, error } = await supabase.from("entries").select("*").eq("user_id", userId);
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
      const { data } = await supabase.from("profiles").select("height_cm, voice_type, nutrition_phase, protein_coefficient, age, sex, garden_theme, character_points_spent, character_equipped, vocal_range_low, vocal_range_high, technical_goal, health_notes").eq("id", userId).single();
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
          technical_goal: data.technical_goal || "",
          health_notes: data.health_notes || ""
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
    const dinnerGap = computeTimeGapHours(y.dinnerTime, y.bedtime);
    const flags = [];
    if (dinnerGap != null && dinnerGap < 3) flags.push("flagDinnerGap");
    if (typeof y.sleepHours === "number" && y.sleepHours < 6) flags.push("flagShortSleep");
    if (y.activityType === "本番" || y.activityType === "リハーサル") flags.push("flagHeavyVoiceUse");
    if ((y.dinnerTags || []).includes("アルコール")) flags.push("flagAlcohol");
    if ((y.dinnerTags || []).includes("カフェイン")) flags.push("flagCaffeine");
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
      flags
    };
  }, [entries, selectedDate]);
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
  const correlationResults = useMemo(() => {
    if (analysisTarget === "performance") {
      return getCorrelationData(entries, "performanceQuality", (e) => e.activityType === "本番" && typeof e.performanceQuality === "number", t);
    }
    if (analysisTarget === "ease") {
      return getCorrelationData(entries, "ease", (e) => typeof e.ease === "number", t);
    }
    return getCorrelationData(entries, "throatCondition", (e) => typeof e.throatCondition === "number", t);
  }, [entries, analysisTarget, t]);
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
    return Object.keys(entries)
      .filter((d) => (entries[d].voiceMemo || "").trim())
      .sort()
      .reverse()
      .slice(0, 10)
      .map((d) => ({ date: d, ...entries[d] }));
  }, [entries]);
  const timeOfDayStats = useMemo(() => {
    const sums = {};
    VOICE_TIME_SLOTS.forEach(({ key }) => { sums[key] = { throatSum: 0, throatN: 0, voiceSum: 0, voiceN: 0 }; });
    Object.values(entries).forEach((e) => {
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
  }, [entries]);
  const restMethodStats = useMemo(() => {
    const byMethod = {};
    Object.values(entries).forEach((e) => {
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
    return Object.entries(byMethod)
      .map(([method, s]) => ({
        method, n: s.n,
        avgThroat: s.n ? s.throatSum / s.n : null,
        avgVoice: s.n ? s.voiceSum / s.n : null,
        avgEase: s.n ? s.easeSum / s.n : null
      }))
      .sort((a, b) => (b.avgVoice || 0) - (a.avgVoice || 0));
  }, [entries]);
  const timeSeries = useMemo(() => {
    const dates = Object.keys(entries).sort().slice(-30);
    return dates.map((date) => {
      const e = entries[date];
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
        wakeNoteLabel: e.wakeNote || null,
        routineNoteLabel: e.routineNote || null,
        activityType: e.activityType || null,
        activityColor: ACTIVITY_CHART_COLORS[e.activityType] || C.line
      };
    });
  }, [entries, profile.height_cm, profile.age, profile.sex, profile.nutrition_phase, profile.protein_coefficient]);
  const locationStats = useMemo(() => {
    const byLoc = {};
    Object.values(entries).forEach((e) => {
      const loc = (e.location || "").trim();
      if (!loc) return;
      if (!byLoc[loc]) byLoc[loc] = { throatSum: 0, voiceSum: 0, easeSum: 0, n: 0 };
      if (typeof e.throatCondition === "number") byLoc[loc].throatSum += e.throatCondition;
      if (typeof e.voiceQuality === "number") byLoc[loc].voiceSum += e.voiceQuality;
      if (typeof e.ease === "number") byLoc[loc].easeSum += e.ease;
      byLoc[loc].n += 1;
    });
    return Object.entries(byLoc)
      .filter(([, s]) => s.n >= 2)
      .map(([location, s]) => ({
        location, n: s.n,
        avgThroat: s.n ? s.throatSum / s.n : null,
        avgVoice: s.n ? s.voiceSum / s.n : null,
        avgEase: s.n ? s.easeSum / s.n : null
      }))
      .sort((a, b) => b.n - a.n);
  }, [entries]);

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
    const { error } = await supabase.from("profiles").update({ character_equipped: characterEquipped }).eq("id", userId);
    if (error) {
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
    await supabase.from("profiles").update({ character_points_spent: newSpent }).eq("id", userId);
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
        technical_goal: profile.technical_goal || null,
        health_notes: profile.health_notes || null
      })
      .eq("id", userId);
    setProfileSaveStatus(error ? "error" : "saved");
    setTimeout(() => setProfileSaveStatus("idle"), 1800);
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
                href={tab.href}
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
                                  <span className="ff-mono">{actual.toFixed(0)}g / 目安{target.toFixed(0)}g</span>
                                  {ev && <span className="font-medium" style={{ color: ev.color }}>{t(ev.labelKey)}</span>}
                                </div>
                              );
                            })}
                            <div className="flex items-center justify-between text-xs pt-1 border-t" style={{ borderColor: C.line }}>
                              <span style={{ color: C.inkSoft }}>{t("labelEstimatedCalorie")}</span>
                              <span className="ff-mono">
                                {(mealTotals.carbs * 4 + mealTotals.protein * 4 + mealTotals.fat * 9).toFixed(0)}kcal / 目安{nutritionTargets.calorieTarget.toFixed(0)}kcal
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
                            onChange={(e) => setFormData((f) => ({ ...f, repertoire: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
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
                        <label className="text-sm font-medium block mb-1.5">{t("labelMentalReason")}</label>
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
                    <span className="ff-display italic text-lg">{viewMonth.year}年 {viewMonth.month + 1}月</span>
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

                {restMethodStats.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleRestMethodTrend")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteRestMethodTrend")}</p>
                    <div className="space-y-2">
                      {restMethodStats.map((s) => (
                        <div key={s.method} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                          <span className="font-medium">{REST_METHOD_KEYS[s.method] ? t(REST_METHOD_KEYS[s.method]) : s.method}</span>
                          <span className="ff-mono" style={{ color: C.inkSoft }}>
                            {t("groupStatLine").replace("{throat}", s.avgThroat != null ? s.avgThroat.toFixed(1) : "-").replace("{voice}", s.avgVoice != null ? s.avgVoice.toFixed(1) : "-").replace("{ease}", s.avgEase != null ? s.avgEase.toFixed(1) : "-").replace("{n}", s.n)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {locationStats.length > 0 && (
                  <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                    <h3 className="ff-display italic text-lg mb-1">{t("titleLocationTrend")}</h3>
                    <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteLocationTrend")}</p>
                    <div className="space-y-2">
                      {locationStats.map((s) => (
                        <div key={s.location} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ background: C.paper }}>
                          <span className="font-medium">{s.location}</span>
                          <span className="ff-mono" style={{ color: C.inkSoft }}>
                            {t("groupStatLine").replace("{throat}", s.avgThroat != null ? s.avgThroat.toFixed(1) : "-").replace("{voice}", s.avgVoice != null ? s.avgVoice.toFixed(1) : "-").replace("{ease}", s.avgEase != null ? s.avgEase.toFixed(1) : "-").replace("{n}", s.n)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                            const label = isWake ? entry.payload.wakeNoteLabel : entry.payload.routineNoteLabel;
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
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                  <h3 className="ff-display italic text-lg mb-1">{t("titleNutritionWeightChart")}</h3>
                  <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{t("noteNutritionWeightChart")}</p>
                  <div style={{ width: "100%", height: 170 }}>
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
                  <div style={{ width: "100%", height: 130, marginTop: 8 }}>
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

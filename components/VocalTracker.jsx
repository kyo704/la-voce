"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Mic2, Moon, Droplets, Thermometer, Wind, MapPin, Music2, HeartHandshake,
  NotebookPen, CalendarDays, BarChart3, ChevronLeft, ChevronRight, Trash2,
  Loader2, Check, Plus, Minus, Sparkles, Utensils, LogOut, CreditCard, Bot,
  Wheat, Egg, Droplet, Leaf, Dumbbell, Ruler, Scale, BookOpen, X, Sunrise, Sun, Sunset
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ReferenceLine
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { C, LEVEL_COLORS, LEVEL_DYNAMICS, LEVEL_DYNAMIC_DESC } from "@/lib/tokens";
import HealthInfo from "@/components/HealthInfo";

/* ---------- constants ---------- */
const SYMPTOM_OPTIONS = ["乾燥", "嗄れ", "痛み", "違和感", "鼻づまり", "咳"];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const ACTIVITY_OPTIONS = [
  { key: "休養", icon: Moon },
  { key: "自主練習", icon: Music2 },
  { key: "レッスン", icon: NotebookPen },
  { key: "リハーサル", icon: Mic2 },
  { key: "本番", icon: Sparkles }
];

const VOICE_TYPES = ["ソプラノ", "メゾソプラノ", "アルト", "カウンターテナー", "テノール", "バリトン", "バス", "その他"];
const MEAL_SLOTS = ["朝食", "昼食", "夕食", "間食"];
const EXERCISE_TYPES = ["有酸素運動", "筋力トレーニング", "ストレッチ", "ウォーキング", "ヨガ", "その他"];
const VOICE_TIME_SLOTS = [
  { key: "朝", icon: Sunrise },
  { key: "昼", icon: Sun },
  { key: "晩", icon: Sunset }
];

const FACTORS = [
  { key: "sleepHours", label: "睡眠時間", unit: "時間" },
  { key: "sleepQuality", label: "睡眠の質", unit: "" },
  { key: "waterIntake", label: "水分摂取量", unit: "ml" },
  { key: "temperature", label: "気温", unit: "℃" },
  { key: "humidity", label: "湿度", unit: "%" },
  { key: "ease", label: "心の余裕", unit: "" },
  { key: "throatCondition", label: "喉の状態", unit: "" },
  { key: "voiceQuality", label: "声の調子", unit: "" },
  { key: "weightKg", label: "体重", unit: "kg" },
  { key: "carbs", label: "炭水化物", unit: "g" },
  { key: "protein", label: "タンパク質", unit: "g" },
  { key: "fat", label: "脂質", unit: "g" },
  { key: "fiber", label: "食物繊維", unit: "g" },
  { key: "exerciseMinutes", label: "運動時間", unit: "分" }
];

const TABS = [
  { key: "today", label: "今日の記録", icon: Mic2 },
  { key: "history", label: "履歴", icon: CalendarDays },
  { key: "analysis", label: "分析", icon: BarChart3 },
  { key: "advice", label: "AIアドバイス", icon: Bot },
  { key: "info", label: "健康情報", icon: BookOpen }
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
function formatDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`;
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
function getCorrelationData(entries, targetKey, targetFilter) {
  const list = Object.values(entries).filter(targetFilter);
  return FACTORS.filter((f) => f.key !== targetKey).map((f) => {
    const pairs = list
      .map((e) => ({ x: e[f.key], y: e[targetKey] }))
      .filter((p) => typeof p.x === "number" && typeof p.y === "number");
    const r = pairs.length >= 3 ? pearson(pairs.map((p) => p.x), pairs.map((p) => p.y)) : null;
    return { key: f.key, label: f.label, unit: f.unit, r, n: pairs.length, pairs };
  });
}
function correlationLabel(r) {
  const abs = Math.abs(r);
  const dir = r >= 0 ? "正の" : "負の";
  if (abs >= 0.7) return `強い${dir}相関があります。`;
  if (abs >= 0.4) return `中程度の${dir}相関があります。`;
  if (abs >= 0.2) return `弱い${dir}相関があります。`;
  return "ほとんど相関は見られません。";
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
      meals: existing.meals || [],
      exercises: existing.exercises || [],
      voiceCheckins: existing.voiceCheckins || {},
      waterBySlot: existing.waterBySlot || {}
    };
  }
  return {
    date,
    throatCondition: 3,
    voiceQuality: 3,
    throatSymptoms: [],
    voiceCheckins: {},
    sleepHours: 7,
    sleepQuality: 3,
    waterBySlot: {},
    mealNotes: "",
    location: getLastLocation(entries, date),
    temperature: "",
    humidity: "",
    activityType: "自主練習",
    activityDuration: "",
    repertoire: "",
    performanceQuality: null,
    ease: 3,
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
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, slot, name: "", carbs: "", protein: "", fat: "", fiber: "" };
}
function buildFoodLibrary(entries, currentMeals) {
  const map = new Map();
  const consider = (meals, date) => {
    (meals || []).forEach((m) => {
      const key = (m.name || "").trim();
      if (!key) return;
      const existing = map.get(key);
      if (!existing || date >= existing.date) {
        map.set(key, { name: key, carbs: m.carbs, protein: m.protein, fat: m.fat, fiber: m.fiber, date: date || "9999-99-99" });
      }
    });
  };
  Object.entries(entries || {}).forEach(([date, e]) => consider(e.meals, date));
  consider(currentMeals, "9999-99-99");
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
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
    waterBySlot: row.water_by_slot || {}
  };
}
function numOrNull(v) {
  return v === "" || v === undefined ? null : v;
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
    water_by_slot: e.waterBySlot || {}
  };
}

/* ---------- small components ---------- */
function Gauge({ score }) {
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
          {score == null ? "記録なし" : `総合コンディション ${score.toFixed(1)} / 5`}
        </div>
      </div>
    </div>
  );
}

function DynamicsSelector({ label, icon: Icon, value, onChange }) {
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
      <div className="text-xs mt-1 text-right ff-mono" style={{ color: C.inkSoft }}>{LEVEL_DYNAMIC_DESC[value - 1]}</div>
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
          className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
          <Minus size={14} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={(e) => { if (e.target.value !== "") onChange(clamp(Number(e.target.value))); }}
          className="w-full text-center rounded-lg border py-1.5 ff-mono"
          style={{ borderColor: C.line, background: C.paper, color: C.ink }}
        />
        <button type="button" onClick={() => onChange(clamp((Number(value) || 0) + step))}
          className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: C.line }}>
          <Plus size={14} />
        </button>
        {suffix && <span className="text-xs ff-mono shrink-0 w-8" style={{ color: C.inkSoft }}>{suffix}</span>}
      </div>
    </div>
  );
}

function MiniSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border text-xs px-2 py-1.5"
      style={{ borderColor: C.line, background: C.paper, color: C.ink }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
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
      className="w-full rounded-lg border text-xs px-2 py-1.5 ff-mono text-center"
      style={{ borderColor: C.line, background: C.paper, color: C.ink }}
    />
  );
}

function FoodNameAutocomplete({ value, foodLibrary, onNameChange, onSelectFood }) {
  const [open, setOpen] = useState(false);
  const q = (value || "").trim().toLowerCase();
  const matches = q
    ? (foodLibrary || []).filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6)
    : [];
  return (
    <div className="relative flex-1">
      <input
        type="text"
        value={value}
        placeholder="食品名（入力すると過去の記録から候補が出ます）"
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
          className="absolute left-0 right-0 mt-1 rounded-lg border overflow-hidden"
          style={{ background: C.card, borderColor: C.line, zIndex: 20, boxShadow: "0 6px 16px rgba(36,25,20,0.15)" }}
        >
          {matches.map((f, i) => (
            <button
              key={f.name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelectFood(f); setOpen(false); }}
              className="w-full text-left px-2.5 py-2 text-xs"
              style={{ color: C.ink, borderTop: i > 0 ? `1px solid ${C.line}` : "none" }}
            >
              {f.name}
              <span className="ml-1.5" style={{ color: C.inkSoft }}>
                （炭{f.carbs || 0}・蛋{f.protein || 0}・脂{f.fat || 0}・繊{f.fiber || 0}g）
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MealItemRow({ item, onChange, onRemove, foodLibrary }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.paper }}>
      <div className="flex items-center gap-2 mb-2">
        <FoodNameAutocomplete
          value={item.name}
          foodLibrary={foodLibrary}
          onNameChange={(name) => onChange({ ...item, name })}
          onSelectFood={(f) => onChange({ ...item, name: f.name, carbs: f.carbs, protein: f.protein, fat: f.fat, fiber: f.fiber })}
        />
        <button type="button" onClick={onRemove} className="shrink-0" style={{ color: C.inkSoft }}>
          <X size={15} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Wheat size={11} />炭水化物g</div>
          <MiniNumber value={item.carbs} onChange={(v) => onChange({ ...item, carbs: v })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Egg size={11} />タンパク質g</div>
          <MiniNumber value={item.protein} onChange={(v) => onChange({ ...item, protein: v })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Droplet size={11} />脂質g</div>
          <MiniNumber value={item.fat} onChange={(v) => onChange({ ...item, fat: v })} />
        </div>
        <div>
          <div className="text-xs mb-1 flex items-center gap-1" style={{ color: C.inkSoft }}><Leaf size={11} />食物繊維g</div>
          <MiniNumber value={item.fiber} onChange={(v) => onChange({ ...item, fiber: v })} />
        </div>
      </div>
    </div>
  );
}

function ExerciseItemRow({ item, onChange, onRemove }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: C.line, background: C.paper }}>
      <div className="flex items-center gap-2 mb-2">
        <MiniSelect value={item.type} onChange={(v) => onChange({ ...item, type: v })} options={EXERCISE_TYPES} />
        <div className="flex items-center gap-1 flex-1">
          <MiniNumber value={item.minutes} placeholder="時間(分)" onChange={(v) => onChange({ ...item, minutes: v })} />
          <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>分</span>
        </div>
        <button type="button" onClick={onRemove} className="shrink-0" style={{ color: C.inkSoft }}>
          <X size={15} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs shrink-0" style={{ color: C.inkSoft }}>強度</span>
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
  const [profile, setProfile] = useState({ height_cm: "", voice_type: "" });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaveStatus, setProfileSaveStatus] = useState("idle");

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
      const { data } = await supabase.from("profiles").select("height_cm, voice_type").eq("id", userId).single();
      if (mounted && data) {
        setProfile({ height_cm: data.height_cm ?? "", voice_type: data.voice_type ?? "" });
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

  const currentScore = useMemo(() => computeOverallScore(formData), [formData]);
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
      return getCorrelationData(entries, "performanceQuality", (e) => e.activityType === "本番" && typeof e.performanceQuality === "number");
    }
    return getCorrelationData(entries, "throatCondition", (e) => typeof e.throatCondition === "number");
  }, [entries, analysisTarget]);
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

  async function handleSaveProfile() {
    setProfileSaveStatus("saving");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        height_cm: profile.height_cm === "" ? null : Number(profile.height_cm),
        voice_type: profile.voice_type || null
      })
      .eq("id", userId);
    setProfileSaveStatus(error ? "error" : "saved");
    setTimeout(() => setProfileSaveStatus("idle"), 1800);
  }

  function addMeal(slot) {
    setFormData((f) => ({ ...f, meals: [...(f.meals || []), newMealItem(slot)] }));
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
      setSaveError(error.message || "不明なエラー");
      setTimeout(() => setSaveStatus("idle"), 4000);
      return;
    }
    setEntries((prev) => ({ ...prev, [clean.date]: clean }));
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 1800);
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
        setAdviceError(data.error || "アドバイスの生成に失敗しました。");
      } else {
        setAdviceText(data.advice);
        setAdviceGeneratedAt(new Date());
      }
    } catch (e) {
      setAdviceError("アドバイスの生成に失敗しました。");
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
      <header className="px-4 sm:px-6 pt-6 pb-4 sticky top-0 z-10" style={{ background: C.paper, borderBottom: `1px solid ${C.line}` }}>
        <div className="max-w-3xl mx-auto flex items-start justify-between gap-3">
          <div>
            <h1 className="ff-display italic text-3xl sm:text-4xl" style={{ color: C.curtain }}>La Voce</h1>
            <p className="ff-mono text-xs tracking-widest uppercase mt-1" style={{ color: C.inkSoft }}>声楽家のための体調記録</p>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-1">
            <a href="/billing" title="ご利用プラン" className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.line, color: C.inkSoft }}>
              <CreditCard size={14} />
            </a>
            <button onClick={handleSignOut} title="ログアウト" className="w-8 h-8 rounded-full border flex items-center justify-center" style={{ borderColor: C.line, color: C.inkSoft }}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
        <nav className="max-w-3xl mx-auto flex gap-1 mt-5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
              style={{ background: activeTab === t.key ? C.curtain : "transparent", color: activeTab === t.key ? "#FFFDF8" : C.inkSoft }}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={22} className="animate-spin" style={{ color: C.curtain }} />
            <span className="text-sm" style={{ color: C.inkSoft }}>読み込み中…</span>
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
                    <div className="font-medium text-sm">{formatDateLabel(selectedDate)}</div>
                    <input type="date" value={selectedDate} max={todayISO()} onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-xs ff-mono mt-1 bg-transparent border-none" style={{ color: C.inkSoft }} />
                  </div>
                  <button onClick={() => setSelectedDate((d) => addDays(d, 1))} disabled={selectedDate >= todayISO()}
                    className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30" style={{ borderColor: C.line }}>
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="rounded-2xl p-5 border flex justify-center" style={{ background: C.card, borderColor: C.line }}>
                  <Gauge score={currentScore} />
                </div>

                {formData && (
                  <>
                    <SectionCard title="声・喉" icon={Mic2}>
                      <DynamicsSelector label="喉の状態（総合）" icon={Mic2} value={formData.throatCondition}
                        onChange={(v) => setFormData((f) => ({ ...f, throatCondition: v }))} />
                      <DynamicsSelector label="声の調子（総合）" icon={Music2} value={formData.voiceQuality}
                        onChange={(v) => setFormData((f) => ({ ...f, voiceQuality: v }))} />
                      <div>
                        <span className="text-sm font-medium block mb-2">症状</span>
                        <div className="flex flex-wrap gap-2">
                          {SYMPTOM_OPTIONS.map((s) => (
                            <Chip key={s} label={s} active={(formData.throatSymptoms || []).includes(s)}
                              onClick={() => setFormData((f) => ({
                                ...f,
                                throatSymptoms: (f.throatSymptoms || []).includes(s)
                                  ? f.throatSymptoms.filter((x) => x !== s)
                                  : [...(f.throatSymptoms || []), s]
                              }))} />
                          ))}
                        </div>
                      </div>
                      <div className="pt-2 border-t" style={{ borderColor: C.line }}>
                        <p className="text-sm font-medium mb-1">時間帯別に記録（任意）</p>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>入力すると「総合」の欄は自動的に平均値へ更新されます。</p>
                        <div className="space-y-4">
                          {VOICE_TIME_SLOTS.map(({ key, icon: SlotIcon }) => (
                            <div key={key} className="rounded-xl p-3" style={{ background: C.paper }}>
                              <div className="flex items-center gap-1.5 mb-2">
                                <SlotIcon size={14} style={{ color: C.gold }} />
                                <span className="text-sm font-medium">{key}</span>
                              </div>
                              <div className="space-y-3">
                                <DynamicsSelector label="喉の状態" icon={Mic2}
                                  value={((formData.voiceCheckins || {})[key] || {}).throat || 3}
                                  onChange={(v) => setFormData((f) => updateVoiceCheckin(f, key, "throat", v))} />
                                <DynamicsSelector label="声の調子" icon={Music2}
                                  value={((formData.voiceCheckins || {})[key] || {}).voice || 3}
                                  onChange={(v) => setFormData((f) => updateVoiceCheckin(f, key, "voice", v))} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="身体データ" icon={Scale}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Ruler size={14} style={{ color: C.gold }} />
                            <label className="text-sm font-medium">身長(cm)</label>
                          </div>
                          <input
                            type="number"
                            value={profile.height_cm}
                            onChange={(e) => setProfile((p) => ({ ...p, height_cm: e.target.value === "" ? "" : Number(e.target.value) }))}
                            className="w-full rounded-lg border p-2 text-sm ff-mono"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium block mb-1.5">声種</label>
                          <select
                            value={profile.voice_type}
                            onChange={(e) => setProfile((p) => ({ ...p, voice_type: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm"
                            style={{ borderColor: C.line, background: C.paper, color: C.ink }}
                          >
                            <option value="">選択してください</option>
                            {VOICE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>
                      <button onClick={handleSaveProfile} disabled={profileSaveStatus === "saving"}
                        className="text-xs px-4 py-2 rounded-full font-medium" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.inkSoft }}>
                        {profileSaveStatus === "saving" ? "保存中…" : profileSaveStatus === "saved" ? "保存しました" : "身長・声種を保存"}
                      </button>

                      <NumberField label="今日の体重" icon={Scale} value={formData.weightKg ?? ""} step={0.1} min={20} max={200} suffix="kg"
                        onChange={(v) => setFormData((f) => ({ ...f, weightKg: v }))} />

                      {profile.height_cm ? (
                        <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.paper, color: C.inkSoft }}>
                          {currentBMI && <p>現在のBMI：{currentBMI.toFixed(1)}</p>}
                          {weightRange && <p>参考体重レンジ（一般的なBMI 18.5〜24.9基準）：{weightRange.min.toFixed(1)}kg 〜 {weightRange.max.toFixed(1)}kg</p>}
                          <p className="mt-1">※ 声楽家専用の計算式ではなく、一般的な健康指標に基づく参考値です。詳しくは「健康情報」タブをご覧ください。</p>
                        </div>
                      ) : (
                        <p className="text-xs" style={{ color: C.inkSoft }}>身長を登録すると、参考体重レンジが表示されます。</p>
                      )}
                    </SectionCard>

                    <SectionCard title="睡眠・水分" icon={Moon}>
                      <NumberField label="睡眠時間" icon={Moon} value={formData.sleepHours} step={0.5} min={0} max={16} suffix="時間"
                        onChange={(v) => setFormData((f) => ({ ...f, sleepHours: v }))} />
                      <DotSelector label="睡眠の質" icon={Moon} value={formData.sleepQuality} lowLabel="悪い" highLabel="良い"
                        onChange={(v) => setFormData((f) => ({ ...f, sleepQuality: v }))} />
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Droplets size={14} style={{ color: C.gold }} />
                          <label className="text-sm font-medium">水分補給（時間帯別）</label>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {MEAL_SLOTS.map((slot) => (
                            <div key={slot}>
                              <div className="text-xs mb-1" style={{ color: C.inkSoft }}>{slot}</div>
                              <MiniNumber
                                value={(formData.waterBySlot || {})[slot] ?? ""}
                                placeholder="ml"
                                onChange={(v) => setFormData((f) => ({ ...f, waterBySlot: { ...(f.waterBySlot || {}), [slot]: v } }))}
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-right mt-2 ff-mono" style={{ color: C.inkSoft }}>合計 {waterTotal}ml</p>
                      </div>
                    </SectionCard>

                    <SectionCard title="食事の詳細記録" icon={Wheat}>
                      <p className="text-xs" style={{ color: C.inkSoft }}>時間帯ごとに食品を追加すると、下に1日の合計が自動計算されます。</p>
                      {MEAL_SLOTS.map((slot) => (
                        <div key={slot}>
                          <p className="text-xs font-medium mb-2" style={{ color: C.inkSoft }}>{slot}</p>
                          <div className="space-y-2">
                            {(formData.meals || []).filter((m) => m.slot === slot).map((m) => (
                              <MealItemRow key={m.id} item={m} foodLibrary={foodLibrary} onChange={(next) => updateMeal(m.id, next)} onRemove={() => removeMeal(m.id)} />
                            ))}
                          </div>
                          <button type="button" onClick={() => addMeal(slot)}
                            className="w-full rounded-xl border py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 mt-2"
                            style={{ borderColor: C.line, color: C.inkSoft }}>
                            <Plus size={12} />{slot}に食品を追加
                          </button>
                        </div>
                      ))}
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                          <Utensils size={14} style={{ color: C.gold }} />
                          <label className="text-sm font-medium">食事メモ</label>
                        </div>
                        <textarea value={formData.mealNotes} rows={2} placeholder="例：消化に良いものを中心に、公演前は控えめに"
                          onChange={(e) => setFormData((f) => ({ ...f, mealNotes: e.target.value }))}
                          className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>炭水化物</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.carbs.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>タンパク質</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.protein.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>脂質</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.fat.toFixed(0)}g</div>
                        </div>
                        <div className="rounded-xl p-2.5 text-center" style={{ background: C.paper }}>
                          <div className="text-xs" style={{ color: C.inkSoft }}>食物繊維</div>
                          <div className="ff-mono text-sm font-medium">{mealTotals.fiber.toFixed(0)}g</div>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="気候・滞在地" icon={Thermometer}>
                      <div>
                        <label className="text-sm font-medium block mb-1.5">滞在地・公演地</label>
                        <div className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.line, background: C.paper }}>
                          <MapPin size={16} style={{ color: C.inkSoft }} />
                          <input type="text" value={formData.location} placeholder="例：ミラノ"
                            onChange={(e) => setFormData((f) => ({ ...f, location: e.target.value }))}
                            className="w-full text-sm bg-transparent border-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <NumberField label="気温" icon={Thermometer} value={formData.temperature ?? ""} step={1} min={-30} max={50} suffix="℃"
                          onChange={(v) => setFormData((f) => ({ ...f, temperature: v }))} />
                        <NumberField label="湿度" icon={Wind} value={formData.humidity ?? ""} step={5} min={0} max={100} suffix="%"
                          onChange={(v) => setFormData((f) => ({ ...f, humidity: v }))} />
                      </div>
                    </SectionCard>

                    <SectionCard title="練習・公演" icon={Music2}>
                      <div>
                        <span className="text-sm font-medium block mb-2">今日の活動</span>
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
                                {a.key}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <NumberField label="活動時間" value={formData.activityDuration ?? ""} step={0.5} min={0} max={24} suffix="時間"
                          onChange={(v) => setFormData((f) => ({ ...f, activityDuration: v }))} />
                        <div>
                          <label className="text-sm font-medium block mb-1.5">曲目・演目(任意)</label>
                          <input type="text" value={formData.repertoire} placeholder="例：椿姫"
                            onChange={(e) => setFormData((f) => ({ ...f, repertoire: e.target.value }))}
                            className="w-full rounded-lg border p-2 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                        </div>
                      </div>
                      {formData.activityType === "本番" && (
                        <DynamicsSelector label="公演の出来" icon={Sparkles} value={formData.performanceQuality || 3}
                          onChange={(v) => setFormData((f) => ({ ...f, performanceQuality: v }))} />
                      )}
                    </SectionCard>

                    <SectionCard title="運動記録" icon={Dumbbell}>
                      <p className="text-xs" style={{ color: C.inkSoft }}>その日行った運動を追加してください。合計時間は自動計算され、分析にも反映されます。</p>
                      <div className="space-y-2">
                        {(formData.exercises || []).map((x) => (
                          <ExerciseItemRow key={x.id} item={x} onChange={(next) => updateExercise(x.id, next)} onRemove={() => removeExercise(x.id)} />
                        ))}
                      </div>
                      <button type="button" onClick={addExercise}
                        className="w-full rounded-xl border py-2 text-xs font-medium flex items-center justify-center gap-1.5"
                        style={{ borderColor: C.line, color: C.inkSoft }}>
                        <Plus size={13} />運動を追加
                      </button>
                      {exerciseTotalMinutes > 0 && (
                        <p className="text-xs text-right ff-mono" style={{ color: C.inkSoft }}>合計 {exerciseTotalMinutes}分</p>
                      )}
                    </SectionCard>

                    <SectionCard title="メンタル" icon={HeartHandshake}>
                      <DotSelector label="心の余裕" icon={HeartHandshake} value={formData.ease} lowLabel="緊張" highLabel="穏やか"
                        onChange={(v) => setFormData((f) => ({ ...f, ease: v }))} />
                    </SectionCard>

                    <SectionCard title="メモ" icon={NotebookPen}>
                      <textarea value={formData.notes} rows={3} placeholder="自由に記録を残せます"
                        onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                        className="w-full rounded-lg border p-2.5 text-sm" style={{ borderColor: C.line, background: C.paper }} />
                    </SectionCard>

                    <button onClick={handleSave} disabled={saveStatus === "saving"}
                      className="w-full rounded-2xl py-3.5 font-medium flex items-center justify-center gap-2 transition-all"
                      style={{ background: C.curtain, color: "#FFFDF8" }}>
                      {saveStatus === "saving" && <Loader2 size={16} className="animate-spin" />}
                      {saveStatus === "saved" && <Check size={16} />}
                      {saveStatus === "saving" ? "保存中…" : saveStatus === "saved" ? "保存しました" : saveStatus === "error" ? "保存に失敗しました" : "この日の記録を保存"}
                    </button>
                    {saveStatus === "error" && saveError && (
                      <p className="text-xs text-center" style={{ color: C.curtain }}>{saveError}</p>
                    )}
                  </>
                )}
              </div>
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
                    {WEEKDAYS.map((w) => (
                      <div key={w} className="text-xs ff-mono py-1" style={{ color: C.inkSoft }}>{w}</div>
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
                            <span className="text-sm">この記録を削除しますか？</span>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleDelete(date)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: C.curtain, color: "#FFFDF8" }}>削除する</button>
                              <button onClick={() => setConfirmDeleteDate(null)} className="px-3 py-1.5 rounded-full text-xs font-medium border" style={{ borderColor: C.line }}>キャンセル</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full flex items-center justify-center ff-display italic text-base shrink-0"
                              style={{ background: levelColor(e.throatCondition), color: "#FFFDF8" }}>
                              {levelDynamic(e.throatCondition)}
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setSelectedDate(date); setActiveTab("today"); }}>
                              <div className="text-sm font-medium">{formatDateLabel(date)}</div>
                              <div className="flex items-center gap-1.5 text-xs mt-0.5 flex-wrap" style={{ color: C.inkSoft }}>
                                <ActIcon size={12} />
                                <span>{e.activityType}</span>
                                {e.activityType === "本番" && e.performanceQuality && <span>・公演の出来 {levelDynamic(e.performanceQuality)}</span>}
                                {e.location && <span>・{e.location}</span>}
                              </div>
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
                <div className="flex rounded-full border p-1" style={{ borderColor: C.line }}>
                  <button onClick={() => setAnalysisTarget("performance")}
                    className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
                    style={{ background: analysisTarget === "performance" ? C.curtain : "transparent", color: analysisTarget === "performance" ? "#FFFDF8" : C.inkSoft }}>
                    公演の出来との相関
                  </button>
                  <button onClick={() => setAnalysisTarget("throat")}
                    className="flex-1 py-2 rounded-full text-sm font-medium transition-all"
                    style={{ background: analysisTarget === "throat" ? C.curtain : "transparent", color: analysisTarget === "throat" ? "#FFFDF8" : C.inkSoft }}>
                    喉のコンディションとの相関
                  </button>
                </div>

                {chartData.length === 0 ? (
                  <div className="text-center py-14 text-sm rounded-2xl border" style={{ color: C.inkSoft, borderColor: C.line }}>
                    {analysisTarget === "performance"
                      ? "「本番」の記録が3件以上たまると、相関分析が表示されます。"
                      : "記録が3件以上たまると、相関分析が表示されます。"}
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                      <h3 className="ff-display italic text-lg mb-3">相関の強さ</h3>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer>
                          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                            <CartesianGrid horizontal={false} stroke={C.line} />
                            <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12, fill: C.ink }} />
                            <Tooltip formatter={(v) => [Number(v).toFixed(2), "相関係数"]} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
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

                    {scatterInfo && scatterInfo.r != null && (
                      <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <h3 className="ff-display italic text-lg">{scatterInfo.label}の散布図</h3>
                          <span className="text-xs ff-mono" style={{ color: C.inkSoft }}>r = {scatterInfo.r.toFixed(2)}（n={scatterInfo.n}）</span>
                        </div>
                        <p className="text-xs mb-3" style={{ color: C.inkSoft }}>{correlationLabel(scatterInfo.r)}</p>
                        <div style={{ width: "100%", height: 220 }}>
                          <ResponsiveContainer>
                            <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                              <CartesianGrid stroke={C.line} />
                              <XAxis type="number" dataKey="x" name={scatterInfo.label} unit={scatterInfo.unit} tick={{ fontSize: 11, fill: C.inkSoft }} />
                              <YAxis type="number" dataKey="y" name={analysisTarget === "performance" ? "公演の出来" : "喉の状態"} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: C.inkSoft }} />
                              <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: C.line }} />
                              <Scatter data={scatterInfo.pairs} fill={C.gold} />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
                      ※ 相関は関連の強さを示すものであり、因果関係を証明するものではありません。記録件数が少ないうちは参考程度にご覧ください。
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
                    <h3 className="ff-display italic text-lg">AIアドバイス</h3>
                  </div>
                  <p className="text-xs mb-4" style={{ color: C.inkSoft }}>
                    直近2週間の記録（食事メモ・自由メモを含む）をもとに、AIが傾向を読み取ってアドバイスします。
                  </p>
                  <button onClick={handleGenerateAdvice} disabled={adviceLoading}
                    className="rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2"
                    style={{ background: C.curtain, color: "#FFFDF8" }}>
                    {adviceLoading && <Loader2 size={14} className="animate-spin" />}
                    {adviceLoading ? "分析中…" : "アドバイスを生成する"}
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
                </div>
                <p className="text-xs leading-relaxed px-1" style={{ color: C.inkSoft }}>
                  ※ このアドバイスはAIによる一般的な提案であり、医学的な診断ではありません。体調に不安がある場合は医療専門家にご相談ください。
                </p>
              </div>
            )}

            {activeTab === "info" && <HealthInfo />}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 統合実行ルートv4 §6: 表示ゲートの共通レイヤー
//
// ★このファイルが、「その指標を文章で語ってよいか」「その数値を出してよいか」を
//   決める唯一の場所です。画面ごとに条件を書かないでください（§6-2）。
//   個別に直すと、指標が増えるたびに同じ不整合（ACWRで起きたこと）が再発します。
//
// なぜ件数だけでは足りないのか（§6-1）:
//   「良い日にも悪い日にも白米」は、件数の問題ではありません。効果量がゼロなのに
//   文章を出したことが問題です。n が100あっても出してはいけません。
//   文章で語るものは、①件数 ②効果量 ③多重比較 の3つを全部通ったときだけ出します。
//
// 消すのではなく、置き換える（§6-3）:
//   条件を満たさないとき、このレイヤーは必ず「あと◯で何が見えるか」を返します。
//   呼び出し側は、何も表示しないのではなく、この message を出してください。
//   （既存の段階的アンロックと同じトーンに揃えるため）
// ============================================================================

import { createTranslator } from "@/lib/translations";

// 文章で語るときの3条件（§6-1）。数値は本書で確定したもので、勝手に緩めないこと。
export const NARRATIVE_MIN_N_PER_GROUP = 10;   // ① 各群 n ≥ 10、かつ両群が揃っている
export const NARRATIVE_MIN_EFFECT_SIZE = 0.4;  // ② |Hedges' g| ≥ 0.4
export const NARRATIVE_MIN_RHO = 0.3;          // ② （相関で語る場合）|ρ| ≥ 0.3
export const NARRATIVE_FDR_Q = 0.10;           // ③ BH-FDR で q < 0.10

// 段階的アンロックの日数（指標設計図.md の Lv 表と一致させること）。
export const UNLOCK_DAYS = { LV2: 3, LV3: 7, LV4: 14, LV5: 28 };

// 文章で語るゲートの共通部分。個別のゲートはこれを展開して使う。
const NARRATIVE = {
  minNPerGroup: NARRATIVE_MIN_N_PER_GROUP,
  minEffectSize: NARRATIVE_MIN_EFFECT_SIZE,
  minRho: NARRATIVE_MIN_RHO,
  requiresFdrPass: true
};

// ---------------------------------------------------------------------------
// ★ゲートの一覧（1ファイルに集約する。§6-2）
//
//   key            … 画面から参照する識別子
//   labelKey       … 「あと◯で◯◯が始まります」の◯◯にあたる翻訳キー
//   minDays        … 記録日数の下限
//   minNPerGroup   … 比較する各群の件数の下限
//   minEffectSize  … |Hedges' g| の下限
//   minRho         … |スピアマンρ| の下限（effectSize の代わりに使ってよい）
//   requiresFdrPass… BH-FDR を通っていることを要求するか
//   narrative      … 文章を生成するゲートかどうか（記録用。判定には使わない）
// ---------------------------------------------------------------------------
export const GATES = [
  // ---- 文章で語るもの（3条件すべてを要求する） ----
  { key: "diet.narrative", labelKey: "gateLabelDietNarrative", narrative: true, ...NARRATIVE },
  { key: "combo.narrative", labelKey: "gateLabelComboNarrative", narrative: true, ...NARRATIVE },
  { key: "habit.narrative", labelKey: "gateLabelHabitNarrative", narrative: true, minDays: UNLOCK_DAYS.LV4, ...NARRATIVE },
  { key: "lag.narrative", labelKey: "gateLabelLagNarrative", narrative: true, minDays: UNLOCK_DAYS.LV4, minNPerGroup: NARRATIVE_MIN_N_PER_GROUP, minRho: NARRATIVE_MIN_RHO, requiresFdrPass: true },
  { key: "reflux.narrative", labelKey: "gateLabelRefluxNarrative", narrative: true, ...NARRATIVE },
  { key: "role.narrative", labelKey: "gateLabelRoleNarrative", narrative: true, ...NARRATIVE },
  { key: "correlation.narrative", labelKey: "gateLabelDietNarrative", narrative: true, ...NARRATIVE },

  // ---- 平均・件数を並べるもの（統計的な主張はしないので、件数の下限だけ） ----
  // 指標設計図.md「休養方法／滞在地の傾向」: n ≥ 3 を平均表示の下限にする。
  { key: "rest.average", labelKey: "gateLabelRestAverage", minNPerGroup: 3 },
  { key: "location.average", labelKey: "gateLabelLocationAverage", minNPerGroup: 3 },
  { key: "symptom.cooccurrence", labelKey: "gateLabelSymptomCooccurrence", minDays: UNLOCK_DAYS.LV4, minNPerGroup: 3 },
  { key: "mentalTag.trend", labelKey: "gateLabelMentalTagTrend", minNPerGroup: 5 },
  { key: "timeOfDay.badge", labelKey: "gateLabelTimeOfDayBadge", minNPerGroup: 5 },

  // ---- 数値そのものの表示条件 ----
  // 偏差値: カードはLv.3（7日）で開くが、数値は件数30未満では出さず順位のみ（§6-4）。
  { key: "deviation.card", labelKey: "gateLabelDeviationCard", minDays: UNLOCK_DAYS.LV3 },
  { key: "deviation.tScore", labelKey: "gateLabelDeviationCard", minNPerGroup: 30 },
  // 声の予報の的中率: 14件未満は非表示（§6-4）。
  { key: "forecast.hitRate", labelKey: "gateLabelForecastHitRate", minNPerGroup: 14 },
  // ACWR: 28日。★パネルのロックと「今日の一言」の警告は、必ずこの同一フラグを見ること。
  { key: "acwr", labelKey: "gateLabelAcwr", minDays: UNLOCK_DAYS.LV5 },
  { key: "env.comfortZone", labelKey: "gateLabelEnvComfort", minNPerGroup: 5 },
  // エネルギー可用性の警告も「今日の一言」に出るため、同じレイヤーを通す（§6-4）。
  { key: "energyAvailability", labelKey: "gateLabelEnergyAvailability", minNPerGroup: 14 }
];

const GATE_BY_KEY = GATES.reduce((acc, g) => { acc[g.key] = g; return acc; }, {});

export function getGate(key) {
  return GATE_BY_KEY[key] || null;
}

const jaTranslator = createTranslator("ja");

function num(v) {
  return typeof v === "number" && isFinite(v) ? v : null;
}

// 比較する群のうち、いちばん小さい件数を取り出す。
// 「両群が揃っている」（§6-1 ①）を満たすため、片方でも欠けていたら null を返す。
function smallestGroupN(ctx) {
  if (ctx.n1 != null || ctx.n0 != null) {
    const a = num(ctx.n1);
    const b = num(ctx.n0);
    if (a == null || b == null) return null;
    return Math.min(a, b);
  }
  if (ctx.nPerGroup != null) return num(ctx.nPerGroup);
  return num(ctx.n);
}

// 効果量の判定。|g| ≥ 0.4 または |ρ| ≥ 0.3 のどちらかを満たせばよい（§6-1 ②）。
// どちらの値も渡されていない場合は「判定できない」＝通さない（fail closed）。
function effectPasses(gate, ctx) {
  const wantsG = gate.minEffectSize != null;
  const wantsRho = gate.minRho != null;
  if (!wantsG && !wantsRho) return true;
  const g = num(ctx.effectSize);
  const rho = num(ctx.rho);
  if (g == null && rho == null) return null; // 判定不能
  if (wantsG && g != null && Math.abs(g) >= gate.minEffectSize) return true;
  if (wantsRho && rho != null && Math.abs(rho) >= gate.minRho) return true;
  return false;
}

/**
 * ゲートを評価する。
 *
 * @param {string} key   GATES の key
 * @param {object} ctx   { days, n, n1, n0, nPerGroup, effectSize, rho, fdrPass }
 * @param {function} [t] 翻訳関数（省略時は日本語）
 * @returns {{ key, passed, reason, remaining, message, label }}
 *          reason: null | 'days' | 'count' | 'effect' | 'fdr' | 'unknownGate'
 *          message: 通らなかったときに画面へ出す文章（§6-3）。通ったときは null。
 */
export function evaluateGate(key, ctx = {}, t) {
  const tr = t || jaTranslator;
  const gate = getGate(key);
  if (!gate) {
    // 定義されていないキーは通さない。画面ごとに条件を書き足すのを防ぐため、
    // ここで気づけるように警告を出す。
    if (typeof console !== "undefined") console.warn(`displayGates: 未定義のゲート「${key}」が参照されました。`);
    return { key, passed: false, reason: "unknownGate", remaining: null, message: null, label: key };
  }
  const label = tr(gate.labelKey);
  const fail = (reason, remaining, message) => ({ key, passed: false, reason, remaining, message, label });

  if (gate.minDays != null) {
    const days = num(ctx.days);
    if (days == null) return fail("days", null, tr("gateNoClearTrend").replace("{label}", label));
    if (days < gate.minDays) {
      const remaining = gate.minDays - days;
      return fail("days", remaining, tr("gateNeedDays").replace("{n}", remaining).replace("{label}", label));
    }
  }

  if (gate.minNPerGroup != null) {
    const n = smallestGroupN(ctx);
    if (n == null) return fail("count", null, tr("gateNoClearTrend").replace("{label}", label));
    if (n < gate.minNPerGroup) {
      const remaining = gate.minNPerGroup - n;
      return fail("count", remaining, tr("gateNeedRecords").replace("{n}", remaining).replace("{label}", label));
    }
  }

  const effect = effectPasses(gate, ctx);
  if (effect !== true) {
    // 件数は足りているのに効果量が立たない場合。「あと◯日」では解決しないので、
    // 「まだはっきりした傾向が出ていません」と正直に返す（白米の例がここに落ちる）。
    return fail("effect", null, tr("gateNoClearTrend").replace("{label}", label));
  }

  if (gate.requiresFdrPass && ctx.fdrPass !== true) {
    return fail("fdr", null, tr("gateNoClearTrend").replace("{label}", label));
  }

  return { key, passed: true, reason: null, remaining: null, message: null, label };
}

/** 通ったかどうかだけが欲しいとき用の短縮形。 */
export function gateAllows(key, ctx = {}) {
  return evaluateGate(key, ctx).passed;
}

/** 通らなかったときに画面へ出す文章。通っていれば null。 */
export function gateMessage(key, ctx = {}, t) {
  return evaluateGate(key, ctx, t).message;
}

/**
 * 配列の各要素をゲートに通す。通らなかった要素は落とす。
 * @param {string} key
 * @param {Array} items
 * @param {function} toCtx  要素 → ctx への変換
 */
export function filterByGate(key, items, toCtx) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => gateAllows(key, toCtx(item)));
}

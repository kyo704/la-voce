// ============================================================================
// 栄養の合計を、出す（2026-09-08・Opus の再点検 2b）
//
//   ★★Opus の再点検で、★2b（栄養素の合計）は「行きすぎ」とされました。
//     ★9月7日に、★目安との比べと一緒に、★合計そのものも外していました。
//     ★★合計は、★お客さまご自身が書いたものの、★足し算です。
//       ★惹句「あなたが測ったこと、書いたことを、あとで、あなたに返します」
//       ★に、まっすぐ当たります。
//
//   ★★ただし、★戻すのは「合計」だけです。★次のものは、戻しません。
//     ・★目標線　　　「目安 97g」
//     ・★基準線　　　文献の値
//     ・★判定　　　　「不足」「足りています」
//     ・★色分け　　　赤・黄・緑
//     ★★これらは、★表示規約 §7-6「文献の基準線・目標線を引かない」に当たります。
//
//   ★★並べてよいのは、★「あなたのふだん（中央値）」だけです。
//     ★その方ご自身の記録から出します。
//     ★★ほかの方の数は、★1つも混ぜません。
//       ★平均も、順位も、比べも、作りません（★この製品の決めです）。
//
//   ★見張り components/tests/nutrition-totals.test.js
// ============================================================================

/**
 * ★出す栄養素。★この順に並べます。
 *
 *   ★エネルギーは、★足し算で出します（★4/4/9）。★列にはありません。
 */
export const MACRO_ROWS = Object.freeze([
  { key: "carbs", labelKey: "macroCarbs", unit: "g" },
  { key: "protein", labelKey: "macroProtein", unit: "g" },
  { key: "fat", labelKey: "macroFat", unit: "g" },
  { key: "fiber", labelKey: "macroFiber", unit: "g" },
  { key: "energy", labelKey: null, label: "エネルギー", unit: "kcal" }
]);

/** ★エネルギーの係数。★Atwater の一般値です。★1か所で持ちます。 */
export const KCAL_PER_G = Object.freeze({ carbs: 4, protein: 4, fat: 9 });

export function energyKcal(t) {
  if (!t) return null;
  const c = num(t.carbs), p = num(t.protein), f = num(t.fat);
  if (c == null && p == null && f == null) return null;
  return (c || 0) * KCAL_PER_G.carbs + (p || 0) * KCAL_PER_G.protein + (f || 0) * KCAL_PER_G.fat;
}

function num(v) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * ★その日の合計。
 *
 *   ★★実際に書かれた食べもの だけを足します。
 *     ★★3択（少なめ／いつも通り／多め）からの推し量りは、★足しません。
 *       ★あれは、★目標の式から逆に出した数です。★基準線と同じものです。
 *       ★「16g」と出ていて、★それが推し量りだと分からないのが、いけません。
 *   ★★1つも書かれていないときは、★null を返します。★0 を返さないこと。
 *     ★「0g 食べた」と「書いていない」は、★違うことです。
 */
export function mealMacroTotals(meals) {
  const list = Array.isArray(meals) ? meals : [];
  if (list.length === 0) return null;
  const out = {};
  ["carbs", "protein", "fat", "fiber"].forEach((k) => {
    const vals = list.map((m) => num(m && m[k])).filter((v) => v != null);
    out[k] = vals.length ? vals.reduce((a, b) => a + b, 0) : null;
  });
  if (["carbs", "protein", "fat", "fiber"].every((k) => out[k] == null)) return null;
  out.energy = energyKcal(out);
  return out;
}

/** ★中央値。★平らな並びの、まん中です。 */
export function median(xs) {
  const s = (xs || []).filter((v) => typeof v === "number" && Number.isFinite(v)).sort((a, b) => a - b);
  if (s.length === 0) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * ★その方の「ふだん」。★ご自身の記録の、中央値です。
 *
 *   ★★ほかの方の数は、★1つも混ぜません。
 *     ★引数は、★その方ご自身の記録だけです。
 *     ★★平均ではなく中央値にします。★1日の食べすぎで動かないためです。
 *
 *   ★★少なすぎるときは、★出しません。
 *     ★2〜3日の中央値を「ふだん」と呼ぶのは、★言い過ぎです。
 *
 *   @param entries  ご自身の記録（★日付をつけた入れ物、または並び）
 *   @param todayISO 今日（★今日は、ふだんに入れません）
 */
export const USUAL_MIN_DAYS = 7;

export function usualTotals(entries, todayISO) {
  const list = Array.isArray(entries) ? entries : Object.values(entries || {});
  const days = list
    // ★★今日は入れません。★書いている途中のものと比べても、意味がありません。
    .filter((e) => e && (!todayISO || e.date !== todayISO))
    .map((e) => mealMacroTotals(e.meals))
    .filter(Boolean);
  if (days.length < USUAL_MIN_DAYS) return null;
  const out = {};
  ["carbs", "protein", "fat", "fiber", "energy"].forEach((k) => {
    out[k] = median(days.map((d) => d[k]).filter((v) => v != null));
  });
  out.days = days.length;
  return out;
}

/**
 * ★出す1行ぶん。
 *
 *   ★★判定を、返しません。★「不足」「多い」を作らないこと。
 *   ★★色を、返しません。★色分けは、判定と同じことです。
 *   ★並べてよいのは、★ご自身のふだん（中央値）だけです。
 */
export function macroRows(totals, usual) {
  if (!totals) return [];
  return MACRO_ROWS.map((r) => ({
    key: r.key,
    labelKey: r.labelKey,
    label: r.label || null,
    unit: r.unit,
    value: totals[r.key] != null ? totals[r.key] : null,
    // ★★ふだんが出せないときは、null。★「―」とも書きません。★行ごと出しません。
    usual: usual && usual[r.key] != null ? usual[r.key] : null
  })).filter((r) => r.value != null);
}

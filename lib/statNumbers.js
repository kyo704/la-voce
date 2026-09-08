// ============================================================================
// ρ／r／n／q を、どこに出してよいか（2026-09-08・Opus の再点検 6）
//
//   ★★坂本さんの決め
//     ・★画面には、★出しません。
//     ・★書き出し（CSV）には、★残します。
//     ★★どちらも無料です。★数が要る方から、取り上げてはいません。
//
//   ★★なぜ画面から外すのか。
//     ★「r=0.42」と出ていると、★その数の意味を知らない方には、
//     ★「0.42 という強さがある」という★確かなものに見えます。
//     ★★ですが、この数は、★ご自身の記録の並べ方ひとつで動きます。
//       ★確からしさの幅（信頼区間）を出していません。
//       ★出さずに数だけ見せるのは、★確かさを偽ることになります。
//     ★★言えるのは「一緒に出ている」までです。★それは、文で言えます。
//
//   ★★なぜ書き出しには残すのか。
//     ★数そのものを消してしまうと、★お調べになりたい方が、確かめられません。
//     ★★ご自身の記録から出た数を、★ご自身が受け取れないのは、おかしなことです。
//     ★惹句「あなたが測ったこと、書いたことを、あとで、あなたに返します」。
//
//   ★★受診用サマリーには、★足しません（★2026-09-08・坂本さんの決め・確定）。
//     ★あちらは §5.4 で「ラグ相関・効果量は絶対に載せない」と決めてあり、
//     ★禁止語にも「傾向」が入っています。★その決めを、そのまま守ります。
//   ★★だから、★係数が出るのは★2か所だけです。
//     ① 分析の画面 … ★数は出しません。★文だけです。
//     ② 書き出しの CSV … ★数を、そのまま入れます。
//     ★★受診用サマリーは、★3か所目には なりません。
//       ★あの紙は「独自の指標を含めず、記録した内容をそのまま整理」する紙です。
//       ★係数を足すと、★あの紙が、あの紙でなくなります。
//
//   ★見張り components/tests/stat-numbers.test.js
// ============================================================================

/** ★画面に、係数と件数を出してよいか。★出しません。 */
export const STATS_ON_SCREEN = false;

/** ★書き出しに、係数と件数を入れてよいか。★入れます。 */
export const STATS_IN_EXPORT = true;

/**
 * ★書き出しに入れる列。
 *
 *   ★★ここに「判定」を入れないこと。★「強い」「弱い」を書きません。
 *     ★数と、その出どころだけを渡します。★読み方は、ご本人のものです。
 */
export const CORRELATION_CSV_COLUMNS = Object.freeze([
  "key",        // ★項目の鍵
  "label",      // ★項目の名前
  "target",     // ★何と比べたか
  "n",          // ★何日ぶんか
  "rho",        // ★スピアマンの順位相関 ρ
  "p_value",    // ★p 値
  "q_value",    // ★FDR で直した q 値
  "gate_passed" // ★3つの門を通ったか（★true/false。★「強い」とは書きません）
]);

function cell(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * ★係数の一覧を、CSV にします。
 *
 *   ★★門を通らなかったものも、★入れます。
 *     ★画面には出しませんが、★書き出しは「ご自身の記録から出た数」の控えです。
 *     ★通ったかどうかは、gate_passed の列で分かります。
 */
export function correlationsToCsv(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const head = CORRELATION_CSV_COLUMNS.join(",");
  const body = list.map((r) => CORRELATION_CSV_COLUMNS.map((c) => cell(r ? r[c] : null)).join(",")).join("\n");
  return body ? head + "\n" + body : head;
}

/** ★書き出しに使う形へ、そろえます。★画面の形とは、別です。 */
export function toCorrelationRow(r, targetLabel, qValue, gatePassed) {
  if (!r) return null;
  return {
    key: r.key,
    label: r.label,
    target: targetLabel || "",
    n: r.n,
    rho: typeof r.r === "number" ? Number(r.r.toFixed(4)) : null,
    p_value: typeof r.pValue === "number" ? Number(r.pValue.toFixed(6)) : null,
    q_value: typeof qValue === "number" ? Number(qValue.toFixed(6)) : null,
    gate_passed: gatePassed === true
  };
}

/**
 * ★BH で直した q 値。
 *
 *   ★★通ったかどうか（true/false）だけでは、★どれくらい際どいのかが分かりません。
 *     ★書き出しは、★お調べになりたい方のためのものです。★数を出します。
 *
 *   ★★手順（Benjamini–Hochberg の step-up）。
 *     ① p を小さい順に並べる
 *     ② q_i = p_i × m / i
 *     ③ うしろから前へ、★小さいほうで上書きする（単調にする）
 *     ④ 1 を超えたら 1 にする
 *   ★★null（検定していないもの）は、★数に入れません。★入れると全体が緩みます。
 */
export function bhQValues(pValues) {
  const list = Array.isArray(pValues) ? pValues : [];
  const idx = list.map((p, i) => ({ p, i }))
    .filter((x) => typeof x.p === "number" && Number.isFinite(x.p));
  const m = idx.length;
  const out = list.map(() => null);
  if (m === 0) return out;
  idx.sort((a, b) => a.p - b.p);
  let prev = 1;
  for (let k = m - 1; k >= 0; k--) {
    const q = Math.min(1, idx[k].p * m / (k + 1), prev);
    out[idx[k].i] = q;
    prev = q;
  }
  return out;
}

export function correlationsFileName(stamp) {
  return `la-voce-correlations-${stamp}.csv`;
}

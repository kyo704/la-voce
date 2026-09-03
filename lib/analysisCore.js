// ============================================================================
// 統計の計算（2026-09-03 に components/VocalTracker.jsx から切り出しました）
//
//   ★中身は、1文字も変えていません。★export を付けただけです。
//     ★切り出す前の値を控えてから移し、★同じ値が出ることを確かめました
//     （components/tests/analysis-core.test.js）。
//
//   ★なぜ切り出したか
//     「見つかるまでの日数」を測るために、★画面の外から呼ぶ必要がありました。
//     ★書き写すことも考えましたが、★やめました。
//       ★同じ判断が2か所にあると、片方だけが古くなります。
//       ★このリポジトリで、いちばん多く繰り返してきた失敗です。
//     ★測る道具と、画面が、★同じコードを見ます。
//
//   ★ここに、しきい値を書かないこと。
//     n や |g| や q の線は、★lib/displayGates.js が持ちます。
//     ★ここは「計算するだけ」の場所です。「言ってよいか」は決めません。
//
//   ★このファイルは、ほかの lib を読み込みません。
//     検査が1本ずつ切り離して読み込むためです。
// ============================================================================

export function pearson(xs, ys) {
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
export function rankArray(arr) {
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
export function spearman(xs, ys) {
  if (xs.length < 3) return null;
  return pearson(rankArray(xs), rankArray(ys));
}
// 正則化不完全ベータ関数（連分数展開、Numerical Recipes準拠の実装）。t分布のp値の計算に使う。
export function incompleteBeta(x, a, b) {
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
export function logGamma(x) {
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
export function tDistPValue(t, df) {
  if (!Number.isFinite(t) || df <= 0) return 1;
  const x = df / (df + t * t);
  return incompleteBeta(x, df / 2, 0.5);
}
// Benjamini–Hochberg法によるFDR補正。複数の相関を同時に見るときに、偶然の「有意」を抑える。
// 戻り値は、入力と同じ順序の boolean 配列（true = 補正後も有意）。
export function benjaminiHochberg(pValues, fdr) {
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
export function computeHedgesG(group1, group0) {
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
// ★4段階の星（★☆☆☆〜★★★★）は、もう作りません（設計憲章 §3-4）。
//   §3-4 の表示状態は3つだけです。星は「だんだん確からしくなる」という
//   4段階の目盛りで、①待機／②通過／③不通過 のどれとも一致しません。
//
//   ★2026-08-30 まで、これは n≥3 で★2つを付け、そのカードが
//     「この行動があった日（3件）は…（効果量 g=0.62）」という断定の文と
//     数字を出していました。古い lavoce-指標設計図.md のしきい値が、
//     この関数の中にだけ残っていたためです。
//
//   ★判定は lib/displayGates.js の effectStateOf() が持ちます。
//     ここに n や |g| のしきい値を書き戻さないでください。
//   ★この関数は、並び順のための内部の重みだけを返します。画面に出さないこと。
export function effectSortWeight(res) {
  if (!res) return 0;
  return Math.min(1, Math.abs(res.g || 0));
}

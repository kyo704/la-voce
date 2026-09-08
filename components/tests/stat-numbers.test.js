// ============================================================================
// ρ／r／n／q は、画面に出さない。書き出しには残す（2026-09-08・再点検 6）
//
//   ★★坂本さんの決め
//     ・★画面には、出しません。
//     ・★書き出し（CSV）には、残します。★どちらも無料です。
//
//   ★★受診用サマリーには、★足しません（★2026-09-08・坂本さんの決め・確定）。
//     ★あちらは §5.4 で「ラグ相関・効果量は絶対に載せない」と決めてあります。
//     ★★係数が出るのは、★分析の画面（文だけ）と、★書き出しの CSV の2か所です。
//       ★受診用サマリーは、3か所目には なりません。
//
//   node components/tests/stat-numbers.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const S = await load("lib/statNumbers.js");
  const T = await load("lib/translations.js");

  console.log("① 決め");
  ok(S.STATS_ON_SCREEN === false, "★画面には、出さない");
  ok(S.STATS_IN_EXPORT === true, "★書き出しには、入れる");

  console.log("② ★画面の文から、r と n が消えているか（9言語）");
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
  const v = T.TRANSLATIONS.insightLineNoStats;
  ok(!!v, "新しい文がある");
  const missing = LANGS.filter((l) => !v[l]);
  ok(missing.length === 0, "★9言語すべてある" + (missing.length ? "：" + missing.join(",") : ""));
  const leaked = LANGS.filter((l) => /\{r\}|\{n\}/.test(v[l] || ""));
  ok(leaked.length === 0, "★どの言語にも {r} と {n} が無い" + (leaked.length ? "：" + leaked.join(",") : ""));
  const noFactor = LANGS.filter((l) => !/\{factor\}/.test(v[l] || ""));
  ok(noFactor.length === 0, "★{factor} は、9言語すべてに残っている");
  // ★★元の文は、消していません。★そう出していた事実の記録です。
  ok(!!T.TRANSLATIONS.insightLine, "★元の文を、消していない");

  console.log("③ ★画面が、新しい文を呼んでいるか");
  const vt = readRaw("components/VocalTracker.jsx");
  ok(/t\("insightLineNoStats"\)/.test(vt), "新しい文を、呼んでいる");
  ok(!/t\("insightLine"\)/.test(vt), "★古い文（r と n の入ったもの）を、呼んでいない");
  const code = readCode("components", "VocalTracker.jsx");
  ok(!/\.replace\(\/\\\{r\\\}\/g/.test(code), "★{r} を、埋めていない");
  ok(!/\.replace\(\/\\\{n\\\}\/g/.test(code), "★{n} を、埋めていない");

  console.log("④ 書き出しの CSV");
  const rows = [
    { key: "sleep", label: "睡眠", target: "喉の調子", n: 21, rho: 0.42, p_value: 0.03, q_value: 0.08, gate_passed: true },
    { key: "water", label: "水分, 量", target: "喉の調子", n: 12, rho: -0.18, p_value: 0.4, q_value: 0.4, gate_passed: false }
  ];
  const csv = S.correlationsToCsv(rows);
  const lines = csv.split("\n");
  ok(lines[0] === S.CORRELATION_CSV_COLUMNS.join(","), "見出しの行がある");
  ok(lines.length === 3, "2行 入っている");
  ok(/0\.42/.test(csv) && /21/.test(csv), "★ρ も n も、入っている");
  ok(/0\.08/.test(csv), "★q も、入っている");
  ok(lines[2].includes('"水分, 量"'), "カンマの入る名前を、囲んでいる");
  ok(/gate_passed/.test(csv) && /false/.test(csv), "★門を通らなかったものも、入っている");
  ok(S.correlationsToCsv([]).indexOf("key,label") === 0, "空でも、見出しだけ出る");
  ok(S.correlationsToCsv(null).split("\n").length === 1, "null でも、落ちない");

  console.log("⑤ ★判定の語を、返していない");
  const cols = S.CORRELATION_CSV_COLUMNS.join(" ");
  ["strong", "weak", "強", "弱", "良", "悪", "judgement", "status"].forEach((w) => {
    ok(!cols.includes(w), "★列に「" + w + "」が無い");
  });

  console.log("⑥ q 値（BH）");
  const q = S.bhQValues([0.01, 0.02, 0.03, 0.04, 0.05]);
  ok(q.every((x) => x >= 0 && x <= 1), "0〜1 のあいだ");
  for (let i = 1; i < q.length; i++) ok(q[i] >= q[i - 1] - 1e-12, "小さい p ほど、q も小さい（" + i + "）");
  ok(Math.abs(q[0] - 0.05) < 1e-9, "いちばん小さい p の q（★" + q[0].toFixed(4) + "）");
  ok(S.bhQValues([]).length === 0, "空でも、落ちない");
  const withNull = S.bhQValues([0.01, null, 0.5]);
  ok(withNull[1] === null, "★検定していないものは、null のまま");
  ok(withNull.filter((x) => x != null).length === 2, "★null は、数に入れない");
  ok(S.bhQValues([0.9, 0.95]).every((x) => x <= 1), "1 を超えない");

  console.log("⑦ 書き出しに、つながっているか");
  ok(/correlationExportRows\(correlationResults/.test(vt), "係数の一覧を、作っている");
  ok(/correlationsFileName\(stamp\)/.test(vt), "別のファイルとして、落としている");
  ok(/bhQValues/.test(vt), "q も、渡している");
  // ★★計算が2か所に分かれていないこと。
  ok((vt.match(/tDistPValue\(tStat, r\.n - 2\)/g) || []).length === 1,
    "★p の計算は、1か所だけ");
  ok(/const \{ withP, fdrByKey \} = correlationStats\(correlationResults\);/.test(vt),
    "文も書き出しも、同じ計算を見ている");

  console.log("⑧ ★受診用サマリーには、足さない（★2026-09-08・確定）");
  const clinic = vt.slice(vt.indexOf("受診用サマリー") - 3000, vt.indexOf("受診用サマリー") + 3000);
  ok(!/correlationExportRows|bhQValues|q_value|correlationsToCsv/.test(clinic),
    "★受診用サマリーに、係数を足していない");
  // ★★§5.4 の「絶対に載せない」の一覧が、消えていないこと。
  ok(/ラグ相関/.test(vt) && /効果量/.test(vt), "★§5.4 の一覧が、コードに残っている");
  // ★★係数が出るのは、2か所だけ。
  const sn = readCode("lib", "statNumbers.js");
  ok(/受診用サマリー/.test(readRaw("lib/statNumbers.js")),
    "★どこに出さないかを、決めの側に書いてある");
  ok(sn.includes("STATS_ON_SCREEN") && sn.includes("STATS_IN_EXPORT"),
    "★出す先の決めが、1か所にある");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();

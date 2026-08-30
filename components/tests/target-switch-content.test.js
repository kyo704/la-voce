#!/usr/bin/env node
/**
 * 対象を切り替えたとき、★中身が変わること（見た目だけでなく）
 *
 * ★なぜ要るか
 *   「ボタンの色は変わるのに、出ている内容が変わらない」は、
 *   目で見ても気づきにくい不具合です。押した本人は、
 *   切り替わったと思ったまま、古い数字を読み続けます。
 *
 * ★このテストは「押した状態」を見ません。
 *   ・切り替えの値が、計算のもとに入っているか
 *   ・useMemo の依存配列に、その値が入っているか
 *   を見ます。依存配列から漏れると、値を変えても再計算されません。
 *
 * ★これから対象を切り替える機能を足すときは、必ずここに1件足してください。
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

// ★必ず、実際に描画されるファイルを読むこと。
//   2026-08-31 まで、リポジトリ直下に import されない写しが残っていました。
//   そちらを直しても画面は変わりません。
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const LIVE = "components/VocalTracker.jsx";

// このテストが見ているファイルが、本当に描画される側かを先に確かめる。
const page = fs.readFileSync(path.join(ROOT, "app", "dashboard", "page.js"), "utf8");
if (!/from\s+"@\/components\/VocalTracker"/.test(page)) {
  console.log("  ✗ ★app/dashboard/page.js が components/VocalTracker を読んでいない");
  process.exit(1);
}
if (fs.existsSync(path.join(ROOT, "VocalTracker.jsx"))) {
  console.log("  ✗ ★リポジトリ直下に、使われない VocalTracker.jsx の写しがある");
  process.exit(1);
}
console.log(`（読んでいるファイル: ${LIVE} ＝ app/dashboard/page.js が import する側）\n`);

const vt = readCode("components", "VocalTracker.jsx");

/** const NAME = useMemo(() => { ... }, [deps]); を、括弧を数えて取り出す。 */
function memoBlock(name) {
  const head = `const ${name} = useMemo(`;
  const i = vt.indexOf(head);
  if (i < 0) return null;
  let depth = 0, end = -1;
  for (let k = i + head.length - 1; k < vt.length; k++) {
    if (vt[k] === "(") depth++;
    else if (vt[k] === ")") { depth--; if (depth === 0) { end = k; break; } }
  }
  const body = vt.slice(i, end + 1);
  const dep = /\}?,\s*(\[[^\]]*\])\s*\)$/.exec(body);
  return { body, deps: dep ? dep[1] : null };
}

// ---------------------------------------------------------------------------
// 対象を切り替える機能の一覧。★足したらここに1行足すこと。
// ---------------------------------------------------------------------------
const SWITCHERS = [
  {
    label: "相関の強さ（喉／心の余裕／公演の出来）",
    state: "analysisTarget",
    memo: "correlationResults",
    // 対象ごとに、実際に違う列を見ていること
    columns: ["performanceQuality", "ease", "throatCondition"]
  }
];

SWITCHERS.forEach(({ label, state, memo, columns }) => {
  console.log(`=== ${label} ===`);
  assertTrue(new RegExp(`const \\[${state}, set`).test(vt), `${state} の状態がある`);

  const m = memoBlock(memo);
  assertTrue(!!m, `${memo} が useMemo で作られている`);
  if (!m) return;

  // ★中身が切り替わること：対象ごとに違う列を見ている
  columns.forEach((col) => {
    assertTrue(m.body.includes(col), `★${memo} が ${col} を見ている（対象ごとに中身が変わる）`);
  });
  assertTrue(m.body.includes(state), `★${memo} の中で ${state} を分岐に使っている`);

  // ★依存配列に入っていること：入っていないと、押しても再計算されない
  assertTrue(!!m.deps, `${memo} の依存配列を読み取れる`);
  assertTrue(m.deps && m.deps.includes(state),
    `★${memo} の依存配列に ${state} が入っている（漏れると、押しても中身が変わらない）`);

  // ★ボタンの状態だけを変えて終わっていないこと
  const setterCalls = (vt.match(new RegExp(`set${state[0].toUpperCase()}${state.slice(1)}\\(`, "g")) || []).length;
  assertTrue(setterCalls >= 3, `切り替えのボタンが3つ以上ある（見つかった数: ${setterCalls}）`);
});

console.log("\n=== ★固定の対象で出しているカードは、そう書いてある ===");
// 効いた習慣ランキングは、切り替えに追随しません。対象を見出しの下に明示しています。
const habit = memoBlock("effectiveHabitRanking");
assertTrue(!!habit, "effectiveHabitRanking がある");
if (habit) {
  assertTrue(!habit.body.includes("analysisTarget"),
    "★効いた習慣ランキングは、切り替えに追随しない（固定の対象）");
  assertTrue(habit.body.includes("throatCondition") && habit.body.includes("voiceQuality"),
    "喉と声の両方を見ている");
  // ★画面の説明と、計算が一致していること
  assertTrue(/翌日の声のスコア（喉・声の平均）を比べています/.test(vt),
    "★何と比べているかを、画面に書いてある（喉・声の平均）");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);

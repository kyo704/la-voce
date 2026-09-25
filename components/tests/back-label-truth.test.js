// ============================================================================
// ★戻る の 札は 嘘を つかない（★2026-09-25・Opus の 最優先）
//
// STRIP: A   ★動き（★どこへ 行くか）を 見ます。
//
//   ★★★Opus の ご報告（2026-09-25）──
//     「★`bk('もっと')` と 表記されて いるのに、★実際の 中身は `pop()`
//       （履歴を 1つ 戻るだけ）。★全ての 見本に 影響。
//       ★別の 経路から 来た 人だけが 問題に 気づく、★発見しにくい 不具合」
//
//   ★★★これは **見本**の 不具合 です。★実装は どうか を 数えました（2026-09-25）──
//     ★`router.back()` ／ `history.back()` ／ `history.go(-1)` ／ `.goBack()`
//       …… ★品の 中に **1つも ありません**。
//     ★`<Back>` の 使い所 40件 ── ★どれも 名指しの 行き先 か、
//       ★親から 来る `onBack` ／ `onClose` です。
//   ★★★つまり いまは 嘘を ついて いません。★この 見張りは **入り込ませない** ため です。
//
//   ★★見る もの 3つ ──
//     ① 履歴を 1つ 戻る 形を 使って いない こと。
//     ② 札が 画面の 名 の とき、★行き先が 名指し（`set…` か `onBack`）である こと。
//     ③ 札が「もどる」「戻る」の とき だけ、★行き先を 問わない こと。
//
//   ★★★③の わけ ── ★「もどる」は どこへ 行くかを 約束して いません。
//     ★画面の 名を 書いた ときだけ、★そこへ 行く 約束に なります。
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const 根 = path.join(__dirname, "..", "..");

// ── ★① 履歴を 1つ 戻る 形を 使って いない ────────────────────
const 履歴 = /router\.back\(\)|history\.back\(\)|history\.go\(-1\)|\.goBack\(\)/;
const 見た = [];
function 歩く(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (f !== "tests" && f !== "node_modules") 歩く(p); continue; }
    if (!/\.(js|jsx)$/.test(f)) continue;
    const rel = path.relative(根, p).split(path.sep);
    const s = readCode(...rel);
    見た.push(rel.join("/"));
    よし(!履歴.test(s),
         "★" + rel.join("/") + " が 履歴を 1つ 戻って います ── "
         + "★札に 画面の 名を 書いて いる 場合、★嘘に なります");
  }
}
for (const d of ["components", "lib", "app"]) 歩く(path.join(根, d));

// ── ★②③ 札と 行き先 ──────────────────────────────────
const 汎用 = ["もどる", "戻る", "もどす"];
const 使い所 = [];
for (const f of fs.readdirSync(path.join(根, "components"))) {
  if (!f.endsWith(".jsx")) continue;
  const s = fs.readFileSync(path.join(根, "components", f), "utf8");
  for (const m of s.matchAll(/<Back\s+onClick=\{([^}]{0,80})\}\s*>\s*([^<]{0,60})<\/Back>/g)) {
    const cb = m[1].trim(), lab = m[2].trim();
    使い所.push({ f, cb, lab });
    if (汎用.some((g) => lab.includes(g))) continue;    // ★③ 問いません
    // ★★★`\w` は 日本語に 当たりません。★`set開いた(` が 見つかりません でした
    //   （★2026-09-25、★1件 赤く なって 気づきました）。★名前に かなを 使う 品が あります。
    const 名指し = /set[A-Z぀-ヿ一-鿿][\w぀-ヿ一-鿿]*\(/.test(cb)
      || cb === "onBack" || cb === "onClose";
    よし(名指し,
         "★" + f + " の 戻る（札「" + lab.slice(0, 20) + "」）が 名指しで ありません …… " + cb);
  }
}
よし(使い所.length > 0, "★`<Back>` の 使い所が 見つかりません（★探し方が 壊れて います）");

// ── ★目盛り合わせ ──────────────────────────────────────
function わざと() {
  return [
    ["①履歴戻りを 入れる", 履歴.test('onClick={() => router.back()}')],
    ["②札に 名前・行き先は 履歴",
     !(/set[A-Z぀-ヿ一-鿿][\w぀-ヿ一-鿿]*\(/.test("() => window.history.back()"))],
    ["②かなの setter を 見つける",
     /set[A-Z぀-ヿ一-鿿][\w぀-ヿ一-鿿]*\(/.test("() => set開いた(null)")],
    ["★探し方が 生きて いる", 使い所.length >= 20]
  ];
}

console.log("BACK_LABEL_TRUTH");
console.log("  ★見た 品 …… " + 見た.length);
console.log("  ★`<Back>` の 使い所 …… " + 使い所.length);
console.log("  ★札が「もどる／戻る」の もの …… "
            + 使い所.filter((x) => 汎用.some((g) => x.lab.includes(g))).length);
console.log("\n★目盛り合わせ");
let 目悪 = [];
for (const [n, ok] of わざと()) {
  console.log("  " + (ok ? "○" : "×") + " " + n);
  if (!ok) 目悪.push(n);
}
if (目悪.length) {
  console.log("\n★★止まりました ── " + 目悪.join("／"));
  console.log("RESULT: NG");
  process.exit(1);
}
console.log("\n★見た …… " + 済 + "件");
if (悪.length) {
  for (const m of 悪) console.log("  NG   " + m);
  console.log("RESULT: NG（" + 悪.length + "件）");
  process.exit(1);
}
console.log("RESULT: OK");

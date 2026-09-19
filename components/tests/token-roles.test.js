// ============================================================================
// ★色の 役の 見張り（★裁定 その84・2026-09-18 ／ ★裁定 その81 §1-7）
//
//   ★★★なぜ 要る か ── ★名前が 用途を 伝えて いませんでした。
//     ★★`--ink4` …… ★「いちばん 薄い」→ ★部品だ と 思い、★3.0 で 通しました
//     ★★`inkFaint` … ★押せない 字 用 を、★ふつうの 字に 使って いました（3か所）
//     ★★`line` …… ★線の 色 を、★字に 使って いました（4か所・1.21）
//   ★★★どれも 目では 気づけません。★測って はじめて 出ました。
//
//   ★★見る の は 4つ（★裁定 その84 GUARD）。
//     ★① `C.line` が `color:` に 使われて いない こと
//     ★② `inkFaint` が 押せない 字 以外に 使われて いない こと
//     ★③ `--ink4` の 比が `--ink3` より 低い こと（★4段の 順）
//     ★④ 測った 値が、★色の 決めと 合って いる こと
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw, loadLib, ROOT, readPack } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

// ---------------------------------------------------------------------------
// ★比（★覚えません。★その場で 測ります）
// ---------------------------------------------------------------------------
function 明るさ(hex) {
  let h = String(hex).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function 比(a, b) {
  const x = 明るさ(a), y = 明るさ(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// ---------------------------------------------------------------------------
// ★本文を 集めます（★行の 数を 変えません）
// ---------------------------------------------------------------------------
function こめんとを外す(t0) {
  // ★★`^\s*` を 使いません。★`\s` は 改行も 含み、★行が 1本 減ります。
  const 改行だけ = (m) => "\n".repeat((m.match(/\n/g) || []).length);
  return String(t0)
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, 改行だけ)
    .replace(/\/\*[\s\S]*?\*\//g, 改行だけ);
}

function 画面たち() {
  const 出 = [];
  ["components", "lib", "app"].forEach((d) => {
    const p = path.join(ROOT, d);
    if (!fs.existsSync(p)) throw new Error("見る 先が ありません: " + d);
    (function 歩く(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { if (e.name !== "tests") 歩く(full); return; }
        if (/\.(js|jsx)$/.test(e.name)) 出.push(full);
      });
    })(p);
  });
  return 出;
}

/** ★その 行の `C.x` が、★字・地・線の どれか。 */
function 役を見る(一行, k) {
  const 出 = { 字: 0, 地: 0, 線: 0 };
  const re = new RegExp("C\\." + k + "\\b", "g");
  let m;
  while ((m = re.exec(一行)) !== null) {
    const 直前 = 一行.slice(0, m.index).split(",").pop();
    if (/background(?:Color)?\s*:/.test(直前)) 出.地 += 1;
    else if (/border[A-Za-z]*\s*:/.test(直前)) 出.線 += 1;
    else if (/\bcolor\s*:/.test(直前)) 出.字 += 1;
  }
  return 出;
}

(async () => {
  const T = await loadLib("lib", "tokens.js");
  const V = await loadLib("lib", "visualTokens.js");

  // ★★★道具の 較正 ── ★わざと 1件 作って、★見つけられる こと。
  console.log("【〇】道具の 較正");
  t(役を見る("color: allowed ? C.ink : C.line", "line").字 === 1,
    "★三項の 中の 字を 数えられる");
  t(役を見る("background: C.line", "line").地 === 1, "★地を 字と 取りちがえない");
  t(役を見る("border: `1px solid ${C.line}`", "line").線 === 1, "★線を 字と 取りちがえない");
  t(こめんとを外す("a\n  // x\n{/* 1\n2 */}\nb\n").split("\n").length === 6,
    "★コメントを 外しても 行が ずれない");

  const 束 = 画面たち().map((f) => ({
    名: path.relative(ROOT, f),
    中: こめんとを外す(fs.readFileSync(f, "utf8"))
  }));
  t(束.length > 30, "画面を " + 束.length + " 本 読んだ");

  // -------------------------------------------------------------------------
  // 【一】★`C.line` を 字に 使わない
  // -------------------------------------------------------------------------
  console.log("【一】線の 色を 字に 使わない（★1.21）");
  const ゆるし = JSON.parse(readRaw("tools", "token_color_uses.json"));
  ゆるし.ゆるす.forEach((g) => {
    t(!!g.わけ && !!g.引き金, "ゆるしに わけと 引き金が ある ── " + g.ファイル);
  });
  const ゆるす名 = ゆるし.ゆるす.map((g) => g.ファイル);
  const 違反 = [];
  束.forEach((f) => {
    f.中.split("\n").forEach((一行, i) => {
      if (役を見る(一行, "line").字 > 0 && !ゆるす名.includes(f.名)) {
        違反.push(f.名 + ":" + (i + 1));
      }
    });
  });
  t(違反.length === 0, "★字に 使って いない（★いま: " + (違反.join(" ") || "なし") + "）");
  // ★★ゆるして ある ところが、★本当に まだ 残って いる こと。
  //   ★★直したのに ゆるしが 残ると、★次の 誤用を 通して しまいます。
  ゆるす名.forEach((名) => {
    const f = 束.find((x) => x.名 === 名);
    t(!!f, "ゆるし先の 画面が ある ── " + 名);
    if (!f) return;
    const 使って = f.中.split("\n").some((一行) => 役を見る(一行, "line").字 > 0);
    t(使って, "★ゆるしが まだ 効いて いる（★直したら この 行を 消して ください）── " + 名);
  });

  // -------------------------------------------------------------------------
  // 【二】★`inkFaint` は 押せない 字 だけ
  // -------------------------------------------------------------------------
  console.log("【二】`inkFaint` は 押せない 字 だけ（★2.72）");
  const 薄い場所 = [];
  束.forEach((f) => {
    f.中.split("\n").forEach((一行, i) => {
      if (役を見る(一行, "inkFaint").字 > 0) 薄い場所.push({ 名: f.名, 行: i + 1, 文: 一行 });
    });
  });
  // ★★★押せない ことを 示す 言葉が 同じ 行に ある こと。
  //   ★★`disabled` ／ `allowed` ／ `mayTouch` ／ `can` ── ★門の 名 です。
  薄い場所.forEach((x) => {
    t(/disabled|allowed|may[A-Z]|can[A-Z]|!can|ロック|押せ/.test(x.文),
      "押せない ところ で 使って いる ── " + x.名 + ":" + x.行);
  });
  // ★★★いま 1つも 無い なら、★それを そのまま 言います。
  //   ★★「通った」では ありません。★読む 人が 居ない、という こと です。
  console.log("  ── `inkFaint` を 字に 使って いる ところ: " + 薄い場所.length + "件");
  t(T.C.inkFaint === "#A0917F", "`inkFaint` の 値は 変えて いない（★裁定 その84 KEEP）");

  // -------------------------------------------------------------------------
  // 【三】★4段の 順（★--ink4 は --ink3 より 薄い）
  // -------------------------------------------------------------------------
  console.log("【三】4段の 順");
  t(T.C.ink4 === V.TOKENS_LIGHT.ink4, "`C.ink4` は `visualTokens` から 引いて いる");
  const 地 = [T.C.paper, T.C.card];
  const 低 = (c) => Math.min(...地.map((g) => 比(c, g)));
  t(低(T.C.ink4) >= V.CONTRAST_AIM_FAINT,
    `--ink4 は 4.7 を 越える（${低(T.C.ink4).toFixed(2)}）`);
  t(低(T.C.ink4) < 低(T.C.inkSoft),
    `--ink4 は ink2 より 薄い（${低(T.C.ink4).toFixed(2)} < ${低(T.C.inkSoft).toFixed(2)}）`);
  t(低(T.C.inkFaint) < 低(T.C.ink4),
    `inkFaint は ink4 より 薄い（${低(T.C.inkFaint).toFixed(2)} < ${低(T.C.ink4).toFixed(2)}）`);

  // -------------------------------------------------------------------------
  // 【四】★測った 値が 決めと 合って いる
  // -------------------------------------------------------------------------
  console.log("【四】測った 値が 決めと 合って いる");
  t(比("#000000", "#FFFFFF").toFixed(0) === "21", "★比の 式が 正しい（黒と 白は 21）");
  t(V.CONTRAST_FLOOR === 4.5 && V.CONTRAST_AIM === 5.0 && V.CONTRAST_AIM_FAINT === 4.7,
    "床 4.5 ／ 狙い 5.0 ／ 薄い字 4.7");
  // ★★裁定の 紙と 合って いる こと。
  const 裁定 = readPack(
    "ruling-81-visual-design.md");
  t(裁定.includes("CONTRAST_FLOOR") && 裁定.includes("4.7"), "裁定 §1-5 に 書いて ある");
  t(裁定.includes(V.TOKENS_LIGHT.ink4), "裁定の --ink4 と 同じ 値（" + V.TOKENS_LIGHT.ink4 + "）");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();

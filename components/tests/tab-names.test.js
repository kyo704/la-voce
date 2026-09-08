// ============================================================================
// 下タブの名前と数（★第1便・2026-09-08）
//
//   ★出どころ docs/opus/woolsong-裁定-全体レイアウトと教室機能・Sonnetへの引き継ぎ（9月8日）.md
//            §1-2（名前）・§9（第1便）
//
//   ★★同じ言葉が、★2つのものを指していました。
//     「ホーム」＝毎朝ひらく画面／「おうち」＝羊の部屋。★どちらも Home でした。
//   ★★だから、★名前を分けます。★きょう ／ ひつじ。
//
//   ★★ルーティングは、★変えません。★表示名だけです。
//
//   node components/tests/tab-names.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const T = (await load("lib/translations.js")).TRANSLATIONS;

  console.log("① ★名前（★§1-2）");
  ok(T.tabHome.ja === "きょう", "ホーム → きょう");
  ok(T.tabCharacter.ja === "ひつじ", "おうち → ひつじ");
  ok(T.tabAnalysis.ja === "ふりかえる", "分析 → ふりかえる");
  ok(T.tabToday.ja === "記録", "今日の記録 → 記録");
  ok(T.tabNotes.ja === "ノート", "ノートは、そのまま");
  // ★★同じ言葉が、2つのものを指していないこと。
  const names = ["tabHome", "tabCharacter", "tabAnalysis", "tabToday", "tabNotes"].map((k) => T[k].ja);
  ok(new Set(names).size === names.length, "★日本語の名前が、1つも重なっていない");

  console.log("② ★9言語、欠けていないか");
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
  ["tabHome", "tabCharacter", "tabAnalysis", "tabToday"].forEach((k) => {
    const miss = LANGS.filter((l) => !T[k][l]);
    ok(miss.length === 0, k + " が9言語ある" + (miss.length ? "：" + miss.join(",") : ""));
  });

  console.log("③ ★下タブ");
  const vt = readRaw("components/VocalTracker.jsx");
  const blk = vt.slice(vt.indexOf("const TABS = ["), vt.indexOf("// 職業ごとに専用の理論ページ"));
  const keys = (blk.match(/key: "(\w+)"/g) || []).map((x) => x.slice(6, -1));
  console.log("   （いまの下タブ：" + keys.join("・") + "）");
  ok(!keys.includes("more"), "★「もっと」を、下タブから外した");
  // ★★外した先が、必ず在ること。★出口のない画面を作らないこと。
  ok(/setActiveTab\("more"\)/.test(vt), "★「もっと」を開く道が、残っている");
  ok(/aria-label=\{`\$\{t\("tabMore"\)\}を開く`\}/.test(vt), "★歯車から開ける");

  console.log("④ ★レッスンは、まだ外していない（★第1便では外せません）");
  ok(keys.includes("lesson"), "★レッスンタブが、残っている");
  // ★★ホームのレッスンの入口は、教室に入っている方にしか出ません。
  //   ★いま外すと、★入っていない方から入口が無くなります。
  ok(/myEnrollments\.length > 0 && \(/.test(vt),
    "★ホームの入口は、教室に入っている方にだけ出る（★だから、まだ外せない）");

  console.log("⑤ ★ルーティングを、変えていない（★§9「表示名だけ」）");
  ok(keys.includes("home") && keys.includes("garden") && keys.includes("analysis"),
    "★鍵（home / garden / analysis）は、そのまま");
  ok(/activeTab === "home"/.test(vt) && /activeTab === "garden"/.test(vt),
    "★画面の出し分けも、そのまま");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();

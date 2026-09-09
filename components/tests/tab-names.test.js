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

  console.log("④ ★レッスンを、下タブから外した（★2026-09-09・第1便・§9）");
  // ★★2026-09-09、★レッスンを 下タブから 外しました（★第1便・§9）。
  //   ★★タブは 5つです。★きょう／記録／ふりかえる／ノート／ひつじ。
  //   ★★画面は 消えていません。★入口は ホームに 2つ 残っています。
  //     ★教室に 入っている方は、★これまでどおり 行けます。
  //   ★★入っていない方には 出なくなります。★§9 の 決めどおりです。
  // ★★2026-09-09、★新しい帯（5つ）は、★名簿の方だけです（★お指図）。
  //   ★★一般の 38人には、★これまでどおり 6つ 出ます。★1つも 変えません。
  //   ★見るのは、★一般の方の TABS です（★TABS_V2 では ありません）。
  ok(keys.includes("lesson"), "★★一般の方には、レッスンが 残っている");
  ok(keys.length === 6, `★一般の方は 6つ（いま ${keys.length}）`);
  ok(/const TABS_V2 = TABS\.filter\(\(tb\) => tb\.key !== "lesson"\);/.test(vt),
    "★名簿の方は 5つ（★TABS_V2）");
  // ★★外した先が、必ず在ること。★出口のない画面を 作らないこと。
  ok(/setActiveTab\("lesson"\)/.test(vt), "★レッスンを開く道が、残っている");
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

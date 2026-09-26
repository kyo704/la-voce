// ============================================================================
// ★見張り ── ★もっとの パンくずを 2つ 並べない（★2026-09-26・坂本さんの お決め）
//
//   ★★★決めごと ── ★「1つの 画面に 戻る 道は 1つ です。」
//     ★★見本に パンくずは ありません（★坂本さんの お決め・2026-09-26）。
//     ★★だから **自分の 戻る 札を 持つ 画面の あいだは パンくずを 出さない**。
//
//   ★★★この 見張りが 見つけられる もの ──
//     ★`lib/moreCrumb.js` の 一覧に **足し忘れた** 新しい 画面
//       （★自分の 札を 持つ 部品を 出して いるのに、★一覧に 無い）。
//     ★一覧に **残って いる** 名（★部品が 札を 捨てたのに 一覧に 居る）。
//     ★`VocalTracker.jsx` が `showCrumb(...)` を 通さず 自分で 数え直す ように
//       戻って しまった こと（★決めが 2か所に 分かれる 形）。
//
//   ★★★この 見張りが 見つけられない もの ──
//     ★札が **画面に 出て いるか**（★`<Back` が 条件の 中に 居て、
//       いつも 出ない かも しれない）── ★それは 実機と 見比べで 見ます。
//     ★札の **位置・見た目**（★上か 下か、★字の 大きさ）。
//     ★もっと 以外の 道（★`attendingOrgId` 側の 画面）の パンくず。
//
//   ★★★数えて 決めます（★覚えません）──
//     ★`moreSection === "…"` で 出す 部品を 毎回 数え、
//     ★その 部品の 紙に `<Back` が あるかを 毎回 読みます。
//
// STRIP: A
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let 落ちた = 0;
function たしかめる(名, 条件, 言い分) {
  if (条件) { console.log("  ○ " + 名); return; }
  落ちた += 1;
  console.log("  × " + 名 + "  …… " + 言い分);
}

const 蔵 = path.join(__dirname, "..", "..");
const vt = readRaw("components", "VocalTracker.jsx");
const 紙 = readRaw("lib", "moreCrumb.js");

// ★★一覧を 読み出します（★`SELF_BACK` の 中身）。
const m = 紙.match(/export const SELF_BACK = Object\.freeze\(\[([\s\S]*?)\]\);/);
if (!m) { console.log("  × SELF_BACK が 読めません"); process.exit(1); }
const 一覧 = (m[1].match(/"([^"]+)"/g) || []).map((s) => s.slice(1, -1));

// ★★★実際に 数えます ── ★`moreSection === "X" … <部品`。
const 実際 = [];
const 節 = new Set((vt.match(/moreSection === "([^"]+)"/g) || [])
  .map((s) => s.replace(/^moreSection === "/, "").replace(/"$/, "")));
for (const 名 of 節) {
  const 当 = new RegExp('moreSection === "' + 名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    + '"[^\\n]*\\?\\s*\\(?\\s*\\n?\\s*<([A-Z][A-Za-z0-9]*)');
  const g = vt.match(当);
  if (!g) continue;
  const 部品 = path.join(蔵, "components", g[1] + ".jsx");
  if (!fs.existsSync(部品)) continue;
  if (fs.readFileSync(部品, "utf-8").includes("<Back")) 実際.push(名);
}

たしかめる("★自分の 札を 持つ 画面を 数えられた", 実際.length > 0,
  "★1つも 見つかりません ── ★数え方が 壊れて います");

const 足し忘れ = 実際.filter((n) => !一覧.includes(n));
たしかめる("★一覧に 足し忘れが ない", 足し忘れ.length === 0,
  "★自分の 札を 持つのに 一覧に 無い …… " + 足し忘れ.join("・")
  + "  ★`lib/moreCrumb.js` の `SELF_BACK` に 足してください");

const 残り = 一覧.filter((n) => !実際.includes(n));
たしかめる("★一覧に 余りが ない", 残り.length === 0,
  "★一覧に 居るのに 自分の 札が 無い …… " + 残り.join("・")
  + "  ★部品から 札が 消えた のなら 一覧からも 外してください");

// ★★★決めが 2か所に 分かれて いない こと。
たしかめる("★パンくずの 条件は `showCrumb` を 通る",
  /showCrumb\(moreSection\)/.test(vt),
  "★`VocalTracker.jsx` が 自分で 数え直して います");
// ★★★パンくずの 一節に 名が 混ざって いない こと。
//   ★★条件の 行だけを 切り出して 見ます（★読み込みの `useEffect` は 別 です）。
const 一節 = (() => {
  const i = vt.indexOf("showCrumb(moreSection)");
  return i < 0 ? "" : vt.slice(i, vt.indexOf("<Back", i) + 200);
})();
たしかめる("★パンくずの 一節に 名が 混ざって いない",
  一節.length > 0 && !/moreSection (!==|===) "/.test(一節),
  "★条件に 名が 書かれて います ── ★`lib/moreCrumb.js` の `NO_CRUMB` に 寄せてください");
たしかめる("★「合言葉で入る」は 紙の 側で 外して いる",
  /NO_CRUMB = Object\.freeze\(\["合言葉で入る"\]\)/.test(紙),
  "★`NO_CRUMB` から 消えて います ── ★入る 前の 画面に 戻る 道を 出して しまいます");

console.log(落ちた === 0 ? "RESULT: OK" : "RESULT: NG (" + 落ちた + ")");
process.exit(落ちた === 0 ? 0 : 1);

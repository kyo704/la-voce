// ============================================================================
// A10「もっと」の 見張り（★2026-09-11）
//
//   ★出どころ docs/design/pack/screens/A10-歯車もっと.html（★HTML が 正）
//            坂本さんの お決め（2026-09-11）
//
//   ★★確かめること
//     ① 題が「もっと」で あること。★規約が この語で 書かれています。
//     ② シートに していないこと（★1画面の まま）。
//     ③ まだ 置かない 行が、★置かれていないこと。
//        ★「同意を とりけす」… ★押した先が まだ ありません。
//        ★「毎日、聞いてほしいこと」… ★調べて ご報告してから。
//     ④ 中身を 1つも 消していないこと（★隠すだけ）。
//     ⑤ 門の外（38人）は、★これまでどおり ぜんぶ 縦に 並ぶこと。
//     ⑥ 出口が あること（★戻る 道）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "moreMenu.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { MORE_ROWS, moreSections, mayShowMoreRow } = m;
  const v = readRaw("components", "VocalTracker.jsx");
  const vCode = readCode("components", "VocalTracker.jsx");

  console.log("① 題は「もっと」");
  ok(/<ScreenHead title="もっと"/.test(v), "★題が「もっと」");
  // ★★規約が この語で 書かれています。★変えると 規約の ほうが 間違いに なります。
  ok(/もっと ＞ 設定/.test(vCode), "★規約の 案内が「もっと ＞ 設定」の まま");
  ok(MORE_ROWS.some((r) => r.label === "設定"), "★「設定」の 行が ある");

  console.log("② シートに していない");
  // ★★見本は 下から出る シートですが、★1画面の ままに する お決めです。
  //   ★同意の 撤回と 退会が、★重なりの 中に 埋もれないためです。
  const at = v.indexOf('activeTab === "more" && (');
  let i = v.lastIndexOf("{", at), d = 0, end = -1;
  for (; i < v.length; i++) {
    if (v[i] === "{") d++;
    else if (v[i] === "}") { d--; if (d === 0) { end = i; break; } }
  }
  const more = v.slice(at, end + 1);
  ok(!/sheetmod|position: "fixed"[\s\S]{0,120}bottom: 0/.test(more), "★下から出る シートに していない");

  console.log("③ まだ 置かない 行");
  ok(!MORE_ROWS.some((r) => /同意|とりけす|撤回/.test(r.label)),
    "★「同意を とりけす」は まだ 置いていない");
  ok(!MORE_ROWS.some((r) => /聞いてほしい/.test(r.label)),
    "★「毎日、聞いてほしいこと」も まだ 置いていない");
  // ★★置かない 理由が、★どこかに 書いてあること。★黙って 落とさないため。
  ok(/押せない 行を 置くのは/.test(src), "★置かない 理由が 書いてある");

  console.log("④ 中身を 1つも 消していない");
  // ★★display で 隠すだけです。★枠を 動かしていません。
  ok(/return moreSection === section \? undefined : "none";/.test(v),
    "★隠すだけ（★消さない・動かさない）");
  const tagged = (v.match(/display: inMore\("/g) || []).length;
  ok(tagged === 16, "★16の枠 ぜんぶに 印が ついている（いま " + tagged + "）");
  // ★★書きかけも 残ります。★display なので、★中の 状態が 消えません。
  ok(!/moreSection === section && </.test(v), "★条件で 外していない（★状態が 消えない）");

  console.log("⑤ 門の外（38人）は これまでどおり");
  ok(/if \(!layoutV2\) return undefined;/.test(v), "★門の外では、★出し分けを しない");
  ok(/layoutV2 && moreSection === null \?/.test(v), "★一覧は 門の中だけ");

  console.log("⑥ 出口が ある");
  ok(/layoutV2 && moreSection !== null \?/.test(v), "★開いている あいだ、★戻る 道が 出る");
  ok(/setMoreSection\(null\)/.test(v), "★押すと 一覧へ 戻る");

  console.log("⑦ 教室の 行は、★入れる方だけ");
  ok(mayShowMoreRow("運営", { hasOrgRole: true }) === true, "★役職が あれば 出る");
  ok(mayShowMoreRow("運営", { hasOrgRole: false }) === false, "★無ければ 出ない");
  ok(mayShowMoreRow("設定", {}) === true, "★ほかの 行は いつも 出る");
  const secs = moreSections({ hasOrgRole: false });
  ok(!secs.some((x) => x.group === "教室"), "★役職が 無ければ、★小見出しごと 出ない");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();

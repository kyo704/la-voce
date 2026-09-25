// ============================================================================
// ★買えない 品を 値段の 画面に 出さない ── ★見張り（★2026-09-25・Opus の 注意）
//
// STRIP: A   ★何が 画面に 出るか（★動き）を 見ます。★コメントは 落とします。
//
//   ★★Opus の ことば（★2026-09-25）
//     「単品4品の販売開始は後回しで問題ないが、『料金ページに4品表示したまま、
//       3品が実際には買えない』状態が最も危険。開放するまでは4品を表示しない
//       （『準備中』とも書かない）方針が望ましい」
//
//   ★★裁定176 §3 と 同じ 形 です ── ★鍵が 閉まって いる なら、
//     ★**入口 その ものを** 出しません。★「もうすぐ」も 書きません。
//
//   ★★確かめること
//     ① 値段を 出す 画面が 出す 品の 数 ＝ `PLANS` の 品の 数。
//     ② `YEARLY_PRICE_155`（★5品の 年額）が、★画面から 呼ばれて いない こと。
//     ③ 買えない 品の 名前（つたえる・よそおい・ぜんぶ）が 画面に 出ない こと。
//     ④「準備中」「もうすぐ」「近日」が 値段の 画面に 無い こと。
//
//   ★★★`PLANS` に 品を 足した 日は、★この 見張りが ①で 赤く なります。
//     ★★それで いい ── ★足した なら、★買える ように なって いる はず です。
//     ★そのとき 特商法の ページ（§3）も 同じ 日に 直して ください
//     （`docs/ledgers/08-保留している決め.md`）。
// ============================================================================
const { readCode } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const plans = readCode("lib", "plans.js");

// ── ★`PLANS` の 品を、★その場で 数えます（★覚えません）────────────
function plansKeys(src) {
  const i = src.indexOf("export const PLANS = [");
  if (i < 0) throw new Error("★lib/plans.js に PLANS が ありません");
  const j = src.indexOf("];", i);
  return [...src.slice(i, j).matchAll(/key:\s*"(\w+)"/g)].map((m) => m[1]);
}
const 品 = plansKeys(plans);
よし(品.length > 0, "★PLANS が 空 です");

// ── ★値段を 出す 画面 ──────────────────────────────────
//   ★★どちらも `PLANS` から 引きます。★直書きは `price-shown-once` が 見ます。
const 画面 = [["app", "billing", "page.js"], ["components", "VocalTracker.jsx"]];
for (const 道 of 画面) {
  const src = readCode(...道);
  const 名 = 道.join("/");
  // ★① 5品の 表を 画面から 呼んで いない こと
  よし(!src.includes("YEARLY_PRICE_155") && !src.includes("YEARLY_PRICE"),
       "★" + 名 + " が 5品の 年額の 表を 呼んで います");
  // ★③ 買えない 品の 名前が 出て いない こと
  for (const 買えない of ["つたえる", "よそおい", "ぜんぶ"]) {
    // ★★字の 中（`"…"` `'…'` `>…<`）に 出て いないか を 見ます。
    //   ★`readCode` は コメントと 字の かたまりを 落として います ──
    //     ★だから ここに 残って いれば、★JSX の 地の 文 です。
    よし(!new RegExp("[>}]\\s*" + 買えない).test(src),
         "★" + 名 + " に、★まだ 買えない 品「" + 買えない + "」が 出て います");
  }
  // ★④「準備中」を 書かない
  for (const 待 of ["準備中", "もうすぐ", "近日", "近々", "coming soon", "Coming Soon"]) {
    よし(!src.includes(待),
         "★" + 名 + " に「" + 待 + "」が あります（★裁定176 §3）");
  }
}

// ── ★② 5品の 表は、★お金の 計算だけに 使う ──────────────────
//   ★★`lib/yearlyRefund.js` は 戻す 額を 出す ところ です。★画面では ありません。
const refund = readCode("lib", "yearlyRefund.js");
よし(refund.includes("YEARLY_PRICE_155"),
     "★lib/yearlyRefund.js が 5品の 表を 使って いません（★置き場が 変わった？）");

// ── ★目盛り合わせ ──────────────────────────────────────
function わざと() {
  const 出 = [];
  const b1 = readCode("app", "billing", "page.js") + '\n<p>{YEARLY_PRICE_155.tsutaeru}</p>';
  出.push(["①5品の 表を 画面で 呼ぶ", b1.includes("YEARLY_PRICE_155")]);
  const b2 = readCode("app", "billing", "page.js") + '\n<p>つたえる 年6,000円</p>';
  出.push(["②買えない 品を 出す", /[>}]\s*つたえる/.test(b2)]);
  const b3 = readCode("app", "billing", "page.js") + '\n<p>準備中</p>';
  出.push(["③準備中と 書く", b3.includes("準備中")]);
  const p2 = plans.replace(/export const PLANS = \[/, "export const XPLANS = [");
  let 落ちた = false;
  try { plansKeys(p2); } catch (e) { 落ちた = true; }
  出.push(["④PLANS を 消す", 落ちた]);
  return 出;
}

console.log("ONLY_BUYABLE_SHOWN");
console.log("  ★いま 買える 品 …… " + 品.length + "（" + 品.join("／") + "）");
console.log("  ★値段を 出す 画面 …… " + 画面.map((d) => d.join("/")).join("　"));
console.log("\n★目盛り合わせ（★わざと 壊して 赤く なるか）");
let 目悪 = [];
for (const [名, 赤] of わざと()) {
  console.log("  " + (赤 ? "○" : "×") + " " + 名);
  if (!赤) 目悪.push(名);
}
if (目悪.length) {
  console.log("\n★★止まりました ── ★見張りが 赤く なりません: " + 目悪.join("／"));
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

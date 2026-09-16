#!/usr/bin/env node

// ============================================================================
// ★戻る 道は、★1つの 部品で
//
//   ★★出どころ　坂本さん（★2026-09-16・最優先）──
//     「★見本には 左上に 戻る 導線が あるが、★実機では 多くの 画面で 欠けて いる。
//       ★存在する 画面でも 色・大きさが 見本と 一致して いない。
//       ★共通の 原因を 先に 特定してから、★個別修正に 進む こと」
//
//   ★★共通の 原因は 1つ でした ──
//     ★`components/UiV2.jsx` の `Back` は、★見本どおりに 作られて いて、
//     ★★**どこからも 呼ばれて いません** でした（★0か所）。
//     ★★代わりに、★形が 4つ ありました ──
//       ★パンくず（13px・灰色）／丸い ‹／ChevronLeft 戻る／下線の ← もどる
//     ★★見本は 1つ です ── `bk(t)`、★12.5px・えんじ。
//
//   ★★だから この 見張りは、★「部品が 在る」では なく
//     ★**「部品が 使われて いる」**を 見ます。
//     ★★作った 関数は、必ず どこかから 呼ばれて いるか。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ROOT = path.join(__dirname, "..", "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
for (const f of ["components/UiV2.jsx", "components/VocalTracker.jsx", "lib/tokens.js"]) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.log("★★ありません: " + f);
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
}
const ui = readRaw("components", "UiV2.jsx");
const vt = readRaw("components", "VocalTracker.jsx");
const vtCode = readCode("components", "VocalTracker.jsx");
const tok = readRaw("lib", "tokens.js");

console.log("① 部品が 見本と 同じ 数を 持つこと");
// ★★見本の `.back` を、★その場で 読みます。★書き写しません。
if (!fs.existsSync(MIHON)) {
  console.log("★★見本が ありません。★止まります。");
  process.exit(1);
}
const mk = fs.readFileSync(MIHON, "utf8");
const back = (mk.match(/\.back\{([^}]*)\}/) || [])[1] || "";
const size = (back.match(/font-size:\s*([\d.]+)px/) || [])[1];
const enji = (mk.match(/--enji:\s*(#[0-9A-Fa-f]{6})/) || [])[1];
t(!!size, "見本の .back の 大きさを 読めた（" + size + "px）");
t(/color:\s*var\(--enji\)/.test(back), "見本の .back は えんじ");
const curtain = (tok.match(/curtain:\s*"(#[0-9A-Fa-f]{6})"/) || [])[1];
t(curtain && enji && curtain.toUpperCase() === enji.toUpperCase(),
  "C.curtain と --enji が 同じ（" + curtain + " / " + enji + "）");

const bk = ui.slice(ui.indexOf("export function Back("),
  ui.indexOf("export function Back(") + 700);
t(new RegExp("fontSize: rem\\(" + size.replace(".", "\\.") + "\\)").test(bk),
  "★Back の 大きさが 見本と 同じ");
t(/color: C\.curtain/.test(bk), "★Back の 色が えんじ");

console.log("\n② ★部品が 使われて いること（★在るだけでは 足りない）");
const used = (vt.match(/<Back[\s>]/g) || []).length;
t(used > 0, "★`<Back>` が 使われている（" + used + " か所）");

console.log("\n③ もっとの先の 画面に、戻る 道が あること");
// ★★`activeTab` を 立てて 飛ぶ 画面は、★パンくずが 一緒に 消えます。
//   ★★パンくずは「もっと」の タブの 中に 書かれて いる ため です。
//   ★★下の 帯は 出るので 行き止まりでは ありません。
//     ★けれど「もっとへ 戻る」道が 無く なります。
// ★★★窓の 幅を 決め打ちに しません（★2026-09-16）。
//   ★★はじめ「印の あと 2600字」を 見て いました。
//     ★★覚え書きが 長い 画面では、★`<Back>` が その 外に 出ます。
//     ★★2つを「戻る 道が 無い」と 出しました。★在りました。
//   ★★だから、★**次の 画面が 始まる ところ**まで を 見ます。
const blockOf = (needle) => {
  const at = vt.indexOf(needle + " && (");
  if (at < 0) return "";
  const nx = vt.indexOf("{activeTab === ", at + 10);
  return vt.slice(at, nx > 0 ? nx : at + 6000);
};
[
  ['activeTab === "learn"', "学ぶ本体"],
  ['activeTab === "info"', "健康情報"],
  ['activeTab === "profile"', "プロフィール"],
  ['activeTab === "withdrawConsent"', "同意を とりけす"]
].forEach(([needle, name]) => {
  const blk = blockOf(needle);
  t(blk.length > 0, name + " の かたまりを 読めた");
  t(/<Back[\s>]/.test(blk), "★" + name + " に 戻る 道が ある");
});

console.log("\n④ 古い 形が 残って いないこと");
// ★★形が 4つ ある と、★次に 画面を 足す 人が どれを 真似るか 分かりません。
t(!/‹　もっと　／　\{moreSection\}/.test(vtCode),
  "★手で 書いた パンくずが もう ない");
// ★★もっとの 先の 画面だけ を 見ます。★ほかの 画面には 別の 事情が あります。
//   ★★はじめ ファイル 全体を 見て、★質問票の 戻るまで 拾いました。
//     ★あれは もっとの 先では ありません。★直す 相手が ちがいます。
t(!/<ChevronLeft size=\{16\} \/>戻る/.test(vtCode),
  "★もっとの 先に `<ChevronLeft/>戻る` が もう ない");
t(!/← もどる/.test(vtCode), "★`← もどる` が もう ない");

console.log("\n⑤ 行き先が「来た ところ」で あること");
// ★★「同意を とりけす」は、★プロフィールへ 帰って いました。
//   ★★もっとから 直に 来られる ように なった のに、★戻るは 昔の まま でした。
//   ★★在っても、★来た ところへ 帰らない なら 道では ありません。
{
  const at = vtCode.indexOf('activeTab === "withdrawConsent"');
  const blk = at < 0 ? "" : vtCode.slice(at, at + 900);
  t(at > 0 && !/setActiveTab\("profile"\)/.test(blk),
    "★同意の 戻るが プロフィールへ 行っていない");
  t(/setActiveTab\("more"\)/.test(blk), "★もっとへ 帰る");
}


console.log("\n⑥ ★戻る 道が「左上」に あること");
// ★★★「在るか」だけ を 見て いて、★2つ 見落としました（★2026-09-16）。
//   ★★`もっているもの` …… `ScreenHead` の **右**に 丸い ‹（★x=348・右端）。
//   ★★`毎日、聞いてほしいこと` …… パンくずが **画面の いちばん 下**。
//     ★★節は `display` で 出し入れして いるので、★書いた 順が 画面の 順です。
//     ★★設定では 上に 見えて いた ので、★字を 読むだけ では 気づけません でした。
//   ★★坂本さんの 実機の ご指摘で 分かりました。
//   ★★だから ここでは「★どう 書いて あるか」を 見ます ──
//     ★① 戻る 道は、★その かたまりの **先頭**に 在ること
//     ★② `ScreenHead` の `right` に 戻る 道を 置かないこと
//   ★★位置そのものは `tools/back_position_audit.py` が 絵から 測ります。
{
  // ★★もっと の かたまりの 先頭に、★パンくずが 在ること。
  const at = vt.indexOf('{activeTab === "more" && (');
  const head = at < 0 ? "" : vt.slice(at, at + 1800);
  t(at > 0 && /<Back onClick=\{\(\) => setMoreSection\(null\)\}/.test(head),
    "★もっとの かたまりの 先頭に パンくずが ある");
  // ★★節より 前に 在ること。★うしろだと、★節の 下に 出ます。
  const iBack = vt.indexOf("<Back onClick={() => setMoreSection(null)}");
  const iSec = vt.indexOf('moreSection === "聞く"');
  t(iBack > 0 && iSec > 0 && iBack < iSec,
    "★パンくずが「聞く」の 節より 前に ある");

  // ★★`ScreenHead` の `right` に、★戻る 道を 置いて いないこと。
  const ol = fs.existsSync(path.join(ROOT, "components/OwnedLedger.jsx"))
    ? readRaw("components", "OwnedLedger.jsx") : "";
  t(!/right=\{<HeadRound mark="‹"/.test(ol),
    "★もっているもの の ‹ が 右上に ない");
  t(/<Back onClick=\{onClose\}/.test(ol), "★もっているもの が Back を 使っている");
}


console.log("\n⑦ もっと 自身の 戻る 道（★見本 `bk('戻る')`）");
// ★★見本の もっと には 戻る 道が あります ── ★`bk('戻る')`。
//   ★★実装の もっと は 帯の タブ なので、★来た ところを 覚えて 帰します。
//   ★★2026-09-16 まで ありません でした。★坂本さんの お決めで 足しました。
{
  const at = vt.indexOf('{activeTab === "more" && (');
  const head = at < 0 ? "" : vt.slice(at, at + 3000);
  t(/<Back onClick=\{\(\) => setActiveTab\(moreCameFrom/.test(head),
    "★もっと 自身に 戻る 道が ある");
  // ★★覚える のは 1か所だけ。★呼び手が 増えても ずれません。
  t(/function openMore\(\)/.test(vt), "★開く 手が 1つに なっている（openMore）");
  t(/setMoreCameFrom\(/.test(vt), "★来た ところを 覚えている");
  // ★★節を 開いて いる ときは、★パンくずの ほう だけ。★2つ 並べません。
  t(/moreSection === null \? \(\s*\n\s*<Back onClick=\{\(\) => setActiveTab\(moreCameFrom/.test(vt),
    "★節を 開いて いる ときは 出さない（戻る 道は 1つ）");
}

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

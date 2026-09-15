#!/usr/bin/env node

// ============================================================================
// もっと 画面 ── ★見本に そろって いること（★2026-09-15）
//
//   ★出どころ 見本 `SC['もっと']`（★動く見本・全画面）
//   ★坂本さんの お決め（2026-09-15）── ㋐ 右の 字 ／ 注記 4行
//
//   ★★㋑「通っている ところ」は **入って いません**。
//     ★新しい 機能 なので、★今回の 範囲の 外、と お決めに なりました。
//     ★★だから、★この 見張りも 求めません。
//     ★★求めると、★「わざと 入れて いない もの」で 毎回 落ちます。
//
//   ★★注記は **4行 ひと続き** です。★3行だけ 入れる 形に しません。
//     ★1度 3・4行目 だけ の ご指示 でしたが、★1つの 塊 です、と
//     ★お伝えして、★4行 ぜんぶに なりました。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const MI = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const mihon = fs.readFileSync(MI, "utf8");
const i = mihon.indexOf("SC['もっと']=function()");
const seg = mihon.slice(i, mihon.indexOf("\nSC['設定']", i));
const flat = seg.replace(/<[^>]*>/g, "");

const lib = readCode("lib", "moreMenu.js");
const ui = readCode("components", "VocalTracker.jsx");

console.log("① ★注記 4行 ── ★見本の 字の まま");

const NOTE = [
  "法律の 行き先を、この 1か所に 集めています。",
  "退会を 隠しません。引き止めを 2回以上 出しません。",
  "この画面の 題は「もっと」です（規約が この語で 書かれています）。",
  "運営モードは、役割の ある方にだけ 出ます。"
];
NOTE.forEach((line) => {
  // ★★まず、★見本に ある こと。★私の 造語で ないこと。
  t(flat.includes(line), "★見本に ある「" + line.slice(0, 20) + "」");
  t(lib.includes(line), "★lib に ある「" + line.slice(0, 20) + "」");
});
// ★★4行 ぜんぶ。★3行に しない。
t(/MORE_NOTE = Object\.freeze\(\[/.test(lib), "★MORE_NOTE が ある");
{
  const m = lib.match(/MORE_NOTE = Object\.freeze\(\[([\s\S]*?)\]\)/);
  const n = m ? (m[1].match(/"/g) || []).length / 2 : 0;
  t(n === 4, "★注記は 4行（★実際 " + n + "）");
}

console.log("\n② ★右の 字 ── ★数と 矢印の 両方");

t(/export function rightOf/.test(lib), "★rightOf が lib に ある");
t(/rightOf\(r\)/.test(ui), "★画面は rightOf を 通す");
t(!/r\.right \|\| "›"/.test(ui), "★`r.right || \"›\"` が 残って いない");
// ★★見本の 字 そのもの。
t(flat.includes("5つまで ›") || seg.includes("5つまで ›"),
  "★見本に「5つまで ›」が ある");

console.log("\n③ ★決めは lib が 持つ（★画面で 書かない）");

t(!/\+ " ›"/.test(ui), "★画面で 矢印を つないで いない");
t(/MORE_NOTE_BOLD/.test(lib), "★どこを 太くするかも lib が 持つ");
t(/MORE_NOTE_BOLD/.test(ui) && !/<b>役割の/.test(ui),
  "★画面に 太字の 字を 書き写して いない");

console.log("\n④ ★門の 外（38人）の もっとを 変えて いないこと");

// ★★注記も 右の 字も、★`layoutV2` の 中だけ に あること。
{
  // ★★2026-09-15、★ここを 1度 まちがえました。
  //   ★`ui.indexOf("<Note>")` は、★**ファイルの いちばん はじめ**の
  //     `<Note>` を 拾います。★私が 置いた ものでは ありません。
  //   ★★探すのは `MORE_NOTE.map` です。★1つ しか ありません。
  const at = ui.indexOf("MORE_NOTE.map");
  t(at > 0, "★注記を 描く ところが ある");
  const head = ui.slice(Math.max(0, at - 3000), at);
  t(/layoutV2 && moreSection === null/.test(head),
    "★注記は 門の 中（layoutV2）だけ");
}

console.log("\n④-2 ★同意の とりけしは、★もっとから 1段 で 行ける こと");

// ★★2026-09-15、★足しました（★お決め）。
//   ★★画面は 前から ありました。★入口が プロフィールの 中で、★3段 奥 でした。
//   ★★きょう 足した 注記「★法律の 行き先を、この 1か所に 集めています。」と
//     ★食い違って いました。★約束の ほうに 合わせます。
t(/key: "同意", label: "同意を とりけす"/.test(readCode("lib", "moreMenu.js")),
  "★「同意を とりけす」の 行が lib に ある");
t(/if \(r\.key === "同意"\) \{ setActiveTab\("withdrawConsent"\); return; \}/.test(ui),
  "★押すと withdrawConsent へ 直に 行く");
// ★★プロフィールの 中の 入口も 残す こと。★2つ あって 困る ものでは ありません。
t(/setActiveTab\("withdrawConsent"\)/.test(ui)
  && (ui.match(/setActiveTab\("withdrawConsent"\)/g) || []).length >= 2,
  "★プロフィールの 中の 入口も 残って いる（★2か所 以上）");
t(/activeTab === "withdrawConsent"/.test(ui), "★行き先の 画面が ある");

console.log("\n⑤ ★入れて いない もの（★わざと）");

// ★★㋑ は 範囲の 外。★入って いない ことを、★はっきり 残します。
t(!/通っている ところ/.test(lib) && !/通っている ところ/.test(ui),
  "★「通っている ところ」は ★入れて いない（★新しい 機能・範囲の 外）");
console.log("　★★これは 落ちでは ありません。★お決めです（★2026-09-15）。");

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★字が あるか だけ です。★並び・色・大きさは 見て いません。");
console.log("　★★行の 順番も 見て いません。★実機で お確かめ ください。");

(async () => {
  // ★★2026-09-15、★ここが 抜けて いました。
  //   ★★字が ある ことだけ 見て、★**何を 返すか** を 見て いません でした。
  //   ★★校正で 分かりました ── `rightOf` を 元に 戻しても、★落ちません でした。
  //     ★★1度も 落ちない 見張りは、★働くか 分かりません。
  console.log("\n★★中身を 動かして 確かめます");
  const src = readRaw("lib", "moreMenu.js");
  const m = await import("data:text/javascript;base64," +
    Buffer.from(src).toString("base64"));
  t(m.rightOf({ right: "5つまで" }) === "5つまで ›",
    "★rightOf({right:'5つまで'}) が「5つまで ›」（★得た値: "
    + JSON.stringify(m.rightOf({ right: "5つまで" })) + "）");
  t(m.rightOf({ right: null }) === "›", "★right が 無ければ 矢印だけ");
  t(m.rightOf(null) === "›", "★行が 無くても 落ちない");
  t(m.MORE_NOTE.length === 4, "★注記は 4行（★動かして 確かめ）");
  t(m.MORE_NOTE.some((x) => x.includes(m.MORE_NOTE_BOLD)),
    "★太字の 字が、★注記の どれかに 入って いる");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();

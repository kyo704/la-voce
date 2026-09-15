#!/usr/bin/env node

// ============================================================================
// ★台帳の「何で 手に入ったか」
//
//   ★出どころ 見本 `SC['台帳']` ── 品の 名前の 下の `.usu`
//     「記録が 50日に なった日」「はじめの 贈りもの」…
//   ★出どころ 見本の 入口 `SH['motteru']`
//     「台帳（★いつ・**何で** 手に入ったか）」
//   ★裁定 2026-09-15・坂本さん
//     「㋐ 追加する。買ったもの＝『買いました』、贈りもの＝『贈りもの』」
//     「㋑ 『連続日数を出しません。』の1行を画面に追加」
//     「㋖ UNLOCK_CONDITIONS の labelKey 5つを translations.js に追加し、
//        ★実際に 読まれる 状態に する」
//
//   ★★㋖ が この見張りの 芯です。
//     ★★2026-09-15 まで、★UNLOCK_CONDITIONS を 読むのは
//       `unlock-reachable.test.js` **だけ** でした。
//       ★見張りの ためだけに 在る、★死んだ 書き出し でした。
//     ★★labelKey 5つは `lib/translations.js` に **1つも** ありません でした。
//       ★出そうと すれば、★鍵の 文字が そのまま 画面に 出ます。
//     ★★だから「言葉が ある」だけでは 足りません。
//       ★★「その 言葉を 引ける」ことを 見ます。
//
//   ★★見えたか どうかは、★これでは 分かりません。実機で お確かめください。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

// ★★読む はずの ものが 無ければ、★数えずに 止まります（★2026-09-14 の 決め）。
const NEED = [
  ["lib", "itemLedger.js"], ["lib", "translations.js"],
  ["lib", "sheepWardrobe.js"], ["lib", "character.js"],
  ["components", "OwnedLedger.jsx"], ["components", "VocalTracker.jsx"]
];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const src = (...p) => readCode(...p);
const b64 = (...p) => "data:text/javascript;base64," + Buffer.from(
  fs.readFileSync(path.join(__dirname, "..", "..", ...p), "utf8")).toString("base64");

(async () => {
  const ward = await import(b64("lib", "sheepWardrobe.js"));
  const tr = await import(b64("lib", "translations.js"));
  const T = tr.TRANSLATIONS;
  // ★★`@/` を 解けないので、★character.js は 本文から 読み取ります。
  const chr = src("lib", "character.js");
  const led = src("lib", "itemLedger.js");
  const ui = src("components", "OwnedLedger.jsx");
  const vt = src("components", "VocalTracker.jsx");

  // ★9言語（★lib/translations.js の 決め）。
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];

  console.log("① 条件の 鍵 5つが、★言葉に つながること（★㋖）");
  const condBlock = chr.slice(chr.indexOf("UNLOCK_CONDITIONS"), chr.indexOf("};", chr.indexOf("UNLOCK_CONDITIONS")));
  const labelKeys = [...condBlock.matchAll(/labelKey:\s*"([^"]+)"/g)].map((m) => m[1]);
  t(labelKeys.length === 5, "条件は 5つ（いま " + labelKeys.length + "）");
  labelKeys.forEach((k) => {
    const row = T[k];
    t(!!row, k + " の 言葉が ある");
    if (row) t(LANGS.every((l) => row[l]), k + " が 9言語 そろっている");
  });

  console.log("\n② 買った もの・贈りもの の 言葉（★㋐）");
  ["acquiredByShop", "acquiredByGift"].forEach((k) => {
    t(!!T[k], k + " の 言葉が ある");
    if (T[k]) t(LANGS.every((l) => T[k][l]), k + " が 9言語 そろっている");
  });
  t(T.acquiredByShop && T.acquiredByShop.ja === "買いました", "買った もの =「買いました」");
  t(T.acquiredByGift && T.acquiredByGift.ja === "贈りもの", "贈りもの =「贈りもの」");

  console.log("\n③ 品から 条件を 逆に 引けること");
  // ★★台帳が 持って いるのは 品の 鍵 です。★条件は 残って いません。
  //   ★★だから UNLOCKS を 逆に 引きます。★5つ とも 引けること。
  const back = {};
  Object.keys(ward.UNLOCKS).forEach((c) => (ward.UNLOCKS[c] || []).forEach((k) => { back[k] = c; }));
  t(Object.keys(back).length === 5, "品 → 条件 が 5件（いま " + Object.keys(back).length + "）");
  Object.keys(ward.UNLOCKS).forEach((c) => {
    t(Object.values(back).includes(c), c + " に 品が ある");
  });

  console.log("\n④ 台帳の 決めが、★itemLedger.js に 1つだけ あること");
  t(/export function acquisitionReason/.test(led), "acquisitionReason() が ある");
  t(/CONDITION_OF_ITEM/.test(led), "逆引きを 1度だけ 作っている");
  // ★★言葉を 書き写して いないこと。★9言語は translations.js の 持ち物 です。
  t(!led.includes("買いました"), "言葉を itemLedger.js に 書き写していない");
  t(!led.includes("はじめての 本番"), "同上（条件の 言葉）");
  // ★★引けない ときに 作り話を しないこと。
  t(/return\s+""/.test(led), "分からない ときは 空文字を 返す");

  console.log("\n⑤ 画面が それを 読んでいること");
  t(/import\s*{[^}]*acquisitionReason[^}]*}\s*from\s*"@\/lib\/itemLedger"/.test(ui),
    "OwnedLedger が acquisitionReason を 読み込んでいる");
  t(/acquisitionReason\(r,\s*t\)/.test(ui), "1行ごとに 呼んでいる");
  t(/\{why\s*\?/.test(ui), "空の ときは 出さない");
  t(/\bt,\n/.test(ui) || /\bt,\s*$/m.test(ui), "t を 受け取っている");
  // ★★2026-09-15、★この 1本が 較正で 落ちませんでした。
  //   ★★`t={t}` は VocalTracker の 中に 何十も あります。
  //     ★★どこかに 有る か では なく、★**この 呼び出しに** 有るかを 見ます。
  //   ★★同じ 形の 取り違えを、★前にも しました
  //     （`ui.indexOf("<Note>")` が 私の ではなく 先頭の を 拾った）。
  const callAt = vt.indexOf("<OwnedLedger");
  const call = callAt < 0 ? "" : vt.slice(callAt, vt.indexOf("/>", callAt));
  t(callAt >= 0, "VocalTracker が OwnedLedger を 呼んでいる");
  t(/\bt=\{t\}/.test(call), "その 呼び出しで t を 渡している");

  console.log("\n⑥ 下の 注記 ──「連続日数を 出しません。」（★㋑）");
  t(/export const LEDGER_NOTE/.test(led), "LEDGER_NOTE が itemLedger.js に ある");
  t(led.includes("いつ・何で 手に入ったかを 残します。"), "見本の 1行目");
  t(led.includes("記録を 消しても 減りません。連続日数を 出しません。"), "見本の 2行目");
  t(/LEDGER_NOTE\.map\(/.test(ui), "画面が それを 描いている");
  t(!ui.includes("連続日数を 出しません。"), "画面側に 直書きしていない");

  console.log("\n⑦ 消した ものが 戻って いないこと");
  // ★★2026-09-11 の お決め。★㋒㋓ は 現状維持・変更禁止 です。
  t(!led.includes("UNSEEN_TILES"), "「まだ」の 伏せ札が 戻っていない");
  t(!/まだ 見えていないもの/.test(ui), "「まだ 見えていないもの」の 画面が 戻っていない");
  t(led.includes("持っているものだけを 並べます"), "「ぜんぶ」は 持っているものだけ");

  console.log("\n⑧ ★実際に 動かして みる");
  // ★★ここまでは 字を 読んだ だけ です。★字は 動きでは ありません。
  //   ★★`@/` を 解けないので、★読み込みの 道を 本物の 中身に すり替えます。
  //     ★中身は そのまま です。★道の 書き方だけを 変えます。
  const inline = (...p) => b64(...p);
  const ledSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "itemLedger.js"), "utf8")
    .replace('"@/lib/systemAlert"', JSON.stringify(inline("lib", "systemAlert.js")))
    .replace('"@/lib/sheepWardrobe"', JSON.stringify(inline("lib", "sheepWardrobe.js")))
    .replace('"@/lib/character"', JSON.stringify(inline("lib", "character.js")));
  const L = await import("data:text/javascript;base64," + Buffer.from(ledSrc).toString("base64"));

  // ★本物の 言葉引き（★ja）。
  const tja = (k) => (T[k] && T[k].ja) || k;

  t(L.acquisitionReason({ acquired_by: "shop", item_key: "hat_knit" }, tja) === "買いました",
    "買った もの →「買いました」");
  t(L.acquisitionReason({ acquired_by: "gift", item_key: "hat_knit" }, tja) === "贈りもの",
    "贈りもの →「贈りもの」");
  t(L.acquisitionReason({ acquired_by: "unlock", item_key: "propBouquet" }, tja) === "はじめての 本番",
    "花束 →「はじめての 本番」");
  t(L.acquisitionReason({ acquired_by: "unlock", item_key: "hatCamellia" }, tja) === "稽古の 目標と 振り返りを 書いた",
    "椿の髪かざり →「稽古の 目標と 振り返りを 書いた」");

  // ★★無い ほうを 見ます（★「有る」だけ 試すと、★無い日が 落ちます）。
  t(L.acquisitionReason({ acquired_by: "unlock", item_key: "hat_knit" }, tja) === "",
    "条件の 無い 品を unlock で 渡しても、★作り話を しない");
  t(L.acquisitionReason({ acquired_by: "shop" }, null) === "",
    "言葉引きが 無ければ、★何も 返さない");
  t(L.acquisitionReason(null, tja) === "", "行が 無ければ、★何も 返さない");
  t(L.acquisitionReason({ acquired_by: "zzz", item_key: "propBouquet" }, tja) === "",
    "知らない 道なら、★何も 返さない");

  // ★★言葉が 見つからない ときに、★鍵の 文字を 出さないこと。
  //   ★★2026-09-15 まで、★5つ とも この 状態 でした。
  const bare = (k) => k;   // ★訳が 1つも 無い 世界
  t(L.acquisitionReason({ acquired_by: "unlock", item_key: "propBouquet" }, bare) === "",
    "言葉が 無ければ、★鍵の 文字を 画面に 出さない");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();

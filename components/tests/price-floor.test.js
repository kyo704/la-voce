#!/usr/bin/env node

// ============================================================================
// ★名簿の 月額の 下限は 9,800円。★12,800円に 戻さない こと
//
//   ★★2026年9月13日、★坂本さんが 12,800円 → **9,800円** に 改めました（★案A）。
//     ★`lib/orgRoster.js` に、★いつ どう 変わったかまで 書いて あります。
//
//   ★★2026-09-16、★新しい 見本（正式版）が 届きました。
//     ★★その 中の 料金が、★**12,800円に 戻って いました**。
//       ★新しい 版は、★9月13日の お決めより **前**の 土台から 作られて います。
//     ★★見本の 側は それで かまいません。★見本は 見本 です。
//       ★★けれど、★次に 突き合わせる 人が
//         ★「見本が 12,800 だから、★コードも 直そう」と するかも しれません。
//       ★★それは **お決めを 巻き戻す** ことに なります。
//
//   ★★この 見張りは、★その 手を 止めます。
//     ★★戻す ときは、★坂本さんの 新しい お決めと 日付を 添えて、
//       ★この 見張りを 書き換えて ください。★黙って 通さない ため の 1枚です。
//
//   ★★おなじ 形が もう 1つ あります ── 個人の 年額。
//     ★5,800円 → **4,800円**（★新しい 見本も 4,800円 です。★一致して います）。
// ============================================================================

const fs = require("fs");
const path = require("path");

const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

// ★★`readCode` は **リポジトリからの 道のり**を 受けます。★絶対の 道では ありません。
//   ★★はじめ 絶対の 道を 渡して、★道が 二重に 繋がりました。
const L = path.join(__dirname, "..", "..", "lib");

function code(name) {
  if (!fs.existsSync(path.join(L, name))) {
    console.log("★★ありません: lib/" + name);
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
  return readCode("lib", name);
}

console.log("① 名簿の 月額の 下限（★2026-09-13・案A）");
const roster = code("orgRoster.js");
// ★★字ではなく、★**使われて いる 数**を 見ます。
//   ★★覚え書きには 12800 が 出て きます（★いつ どう 変わったかの 記録）。
//     ★だから `readCode` で 覚え書きを 落としてから 数えます。
t(/\b9800\b/.test(roster), "9800 が コードに ある");
t(!/\b12800\b/.test(roster), "★12800 は コードに ない（★覚え書きを 除いて）");

console.log("\n② 個人の 年額（★5,800 → 4,800）");
let found4800 = false, found5800 = [];
for (const f of fs.readdirSync(L).filter((x) => x.endsWith(".js"))) {
  const s = readCode("lib", f);
  if (/\b4800\b/.test(s)) found4800 = true;
  if (/\b5800\b/.test(s)) found5800.push(f);
}
t(found4800, "4800 が lib の どこかに ある");
t(found5800.length === 0, "★5800 は どこにも ない"
  + (found5800.length ? "　★★見つかりました: " + found5800.join(", ") : ""));

console.log("\n③ 見本と 食い違う ことを、忘れない ため の 覚え");
// ★★見本は 12,800 に 戻って います。★こちらは 戻しません。
//   ★★この 1行が 落ちたら、★どちらかが 動いた しるし です。
const MIHON = path.join(__dirname, "..", "..", "docs", "design", "pack-final",
  "00-動く見本-PC・iPad（運営）.html");
if (fs.existsSync(MIHON)) {
  const m = fs.readFileSync(MIHON, "utf8");
  const mi12 = /下限 12,800円/.test(m);
  const mi9 = /下限 9,800円/.test(m);
  console.log("  ・見本は " + (mi12 ? "12,800円" : mi9 ? "9,800円" : "（読めません）"));
  if (mi9) {
    console.log("  ★★見本が 9,800円に なりました。★食い違いは 解けて います。");
    console.log("  ★★この 節を 消して かまいません。");
  }
  t(true, "見本を 読めました（★合否には しません）");
} else {
  console.log("  ★見本が ありません。★この 節は 飛ばします。");
}

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

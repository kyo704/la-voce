#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★公演の 運営（まとめ役）── ★見本 `P_koen`
//   ★出どころ 裁定141 ／ 裁定176 ／ 裁定178
//     ／ woolsong-2026-09-21_4.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★守る こと
//     ① 7つの 画面が、★ここから 開ける
//     ② 鍵の 判じは `featureOn` だけ。★閉じて いれば null
//     ③ ★まだ 無い 行き先を 出して いない（★押せない 札を 置かない）
//     ④ ★体の ことを 1つも 読んで いない（★裁定141）
//     ⑤ ★言葉を 画面に 写して いない（★台帳から）
//     ⑥ 但し書きが 見本の まま
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 画 = readCode("components", "KoenArea.jsx");
  const 生 = readRaw("components", "KoenArea.jsx");
  // ★★`@/` を 結び直します（★`lib/koenArea.js` が `lib/featureOn` を 読むように なりました）。
  //   ★ほかの 見張りと 同じ 形 です（`contrast.test.js` の いきさつ）。
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenArea.js"), "utf8")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) =>
      `from "${"file://" + path.join(ROOT, "lib", n + ".js")}"`);
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 7つの 画面が 開ける");
  // ★★★`Understudy` は ここから 開きません（★2026-09-24）。
  //   ★画面は できて いますが、★**稽古の 1回**（`koen_sessions`）が 無いと
  //     ★中身が 出ません（`koen_understudy_needed(p_session)`）。
  //   ★★押せる のに 空、は「押せない 札」より たちが 悪い です。
  //   ★★`lib/koenArea.js` の `NOT_MADE_YET` と `tools/not_wired_yet.json` に 書いて あります。
  ["KoenCast", "KoenInvite", "KoenSheet", "KoenInfo", "KoenExport", "KoenCopyFrame", "KoenPay"]
    .forEach((n) => t(new RegExp("<" + n + "\\b").test(画), "★" + n + " を 開く"));
  t(!/<Understudy\b/.test(画), "★★`Understudy` は 開かない（★稽古が まだ）");
  t(L.NOT_MADE_YET.includes("代役を立てる"), "★その わけが 書いて ある");

  console.log("\n② 鍵の 判じ");
  t(/featureOn\(features, KOEN_KEY\)/.test(画), "★`featureOn` で 判じる");
  t(L.KOEN_KEY === "koen", "★鍵は koen");
  // ★★★`from("koen")` は **表の 名前** です。★鍵の 字では ありません。
  //   ★先に 落として から 見ます（★2026-09-23 に 同じ 形で 2度 赤に なりました）。
  t(!/featureOn\s*\([^)]*"koen"/.test(画), "★鍵の 字を 画面に 書いて いない");
  const 戻 = 画.indexOf("if (!開) return null;");
  t(戻 > 0, "★閉じて いれば null");
  t(戻 < 画.indexOf("<KoenCast"), "★null は 画面を 組み立てる 前");

  console.log("\n③ まだ 無い 行き先を 出さない");
  t(L.NOT_MADE_YET.length >= 5, "★まだの ものを 数えて いる（" + L.NOT_MADE_YET.length + "）");
  L.NOT_MADE_YET.forEach((w) =>
    t(!画.includes(w), "★「" + w + "」を 出して いない"));
  // ★★★2026-09-24 ── ★「まだ」の 一覧が **古びて いない** こと。
  //   ★★「公演を作る」が ここに 残って いました。★けれど 画面は あり、
  //     ★呼ばれても いました。★記録が 嘘に なり、★入口を 置けなく して いました。
  //   ★★だから、★品の 中に その 画面が 在る ものは、★ここに 置けません。
  const 品 = ["components/KoenNew.jsx", "components/KoenCast.jsx",
    "components/KoenSheet.jsx", "components/KoenInvite.jsx",
    "components/KoenInfo.jsx", "components/KoenExport.jsx",
    "components/KoenDayFlow.jsx", "components/KoenMySchedule.jsx",
    "components/Understudy.jsx"];
  const 名 = { "公演を作る": "components/KoenNew.jsx" };
  Object.keys(名).forEach((w) => {
    const 在 = fs.existsSync(path.join(ROOT, 名[w]));
    const 呼 = readCode("components", "VocalTracker.jsx")
      .includes("<" + path.basename(名[w], ".jsx"));
    if (在 && 呼) t(!L.NOT_MADE_YET.includes(w),
      "★「" + w + "」は 作って あり 呼ばれて います。★まだの 一覧から 外して ください");
  });
  t(品.filter((f) => fs.existsSync(path.join(ROOT, f))).length >= 8,
    "★較正 ── ★公演の 画面が 読めて いる");
  // ★★`tabs()` と `nextSteps()` の 行き先が、★ぜんぶ 開ける こと
  const 先 = L.tabs({}).map((x) => x.key).concat(L.nextSteps({}).map((x) => x.key));
  先.forEach((k) => t(new RegExp('"' + k + '":').test(画) || new RegExp("\\b" + k + ":").test(画),
    "★行き先 " + k + " に 中身が ある"));

  console.log("\n④ 体の ことを 読んで いない");
  ["entries", "体調", "throat", "voice_quality", "condition"].forEach((w) =>
    t(!new RegExp(w, "i").test(画.replace(/出演者の 体調は、どの 画面からも 見られません/g, "")),
      "★「" + w + "」が ない"));
  t(/出演者の 体調は、どの 画面からも 見られません。/.test(L.KOEN_NOTE[0]), "★★約束の 字が ある");

  console.log("\n⑤ 言葉を 写して いない");
  t(/koen_kind_words/.test(画), "★台帳から 引く");
  ["香盤表", "乗り番表", "出番表", "配役"].forEach((w) =>
    t(!画.includes(w), "★「" + w + "」を 画面に 書いて いない"));

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  L.KOEN_NOTE.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));

  console.log("\n⑦ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();

/**
 * ★舞台の 式は 1本（★裁定 その71・2026-09-17）。
 *
 *   ★★2本 ありました ──
 *     `CharacterHome.jsx:2276`  `fullBleed ? stageFit(…) : stageSize(…)`
 *     `roomStage.js:153`        `stageStyle` は いつも `stageSize`
 *   ★★ながめるでは **幅は fit、★横の ずらしは size**。★食い違って いました。
 *   ★★いまの 端末では 2つが 同じ 値を 返すので、★害が 出て いません でした。
 *     ★★比の ちがう 箱（★iPad よこ）では、★合わない ぶん 横に ずれます。
 *
 *   ★★正は `stageFit`（収める）── ★坂本さんの お決め
 *     「置く 画面は 必ず 全体が 見える」に 合う ほう です。
 */
const fs = require("fs");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const stageCode = readCode("lib", "roomStage.js");
  const stageRaw = readRaw("lib", "roomStage.js");
  const ch = readCode("components/CharacterHome.jsx");
  const lib = await loadLib("lib", "roomStage.js");

  console.log("\n=== ① 式は 1本 ===");
  t("★★`stageSize` は もう ない", typeof lib.stageSize === "undefined");
  t("★`stageSize` を 呼んで いない", !/stageSize\s*\(/.test(stageCode));
  t("★画面も 呼んで いない", !/stageSize/.test(ch));
  t("★消した ことを 書き残して いる", /stageSize/.test(stageRaw));

  console.log("\n=== ② どちらでも 同じ 式 ===");
  t("★`fullBleed` で 枝分かれして いない",
    !/fullBleed\s*\n?\s*\?\s*stageFit/.test(ch));
  t("★いつも `stageFit`", /const stage = stageFit\(roomBoxW, roomBoxH, STAGE_ASPECT\);/.test(ch));
  t("★`stageStyle` も `stageFit`", /const s = stageFit\(boxW, boxH, aspect\);/.test(stageCode));

  console.log("\n=== ③ 収める ── ★箱から はみ出さない ===");
  // ★★較正 ── ★比の ちがう 箱を 3つ 通します。
  //   ★★「収める」なら、★どの 箱でも はみ出しません。
  //   ★★はみ出す ものが 1つでも あれば、★覆う 式に 戻って います。
  const 箱 = [
    { w: 390, h: 634, 名: "たて（iPhone）" },
    { w: 1024, h: 768, 名: "よこ（iPad）" },
    { w: 390, h: 278.56, 名: "ぴったり（したく）" }
  ];
  箱.forEach((b) => {
    const s = lib.stageFit(b.w, b.h, lib.STAGE_ASPECT);
    t(`★${b.名} … 箱に 収まる`, s.w <= b.w + 0.01 && s.h <= b.h + 0.01);
    t(`★${b.名} … 比が 7:5`, Math.abs(s.w / s.h - lib.STAGE_ASPECT) < 0.001);
  });

  console.log("\n=== ★較正 ── ★覆う 式なら 落ちる ===");
  // ★★わざと 覆う 式を 書いて、★上の 見張りが 当たる ことを 確かめます。
  const 覆う = (w, h, a) => (w / h >= a ? { w: w, h: w / a } : { w: h * a, h: h });
  const c = 覆う(1024, 768, 7 / 5);
  t("★★覆う 式は はみ出す（★較正）", c.w > 1024 + 0.01 || c.h > 768 + 0.01);
  const f = lib.stageFit(1024, 768, 7 / 5);
  t("★★収める 式は はみ出さない（★較正）", f.w <= 1024.01 && f.h <= 768.01);
  t("★★2つは 別の 値（★較正）", Math.abs(c.w - f.w) > 1 || Math.abs(c.h - f.h) > 1);

  console.log("\n=== ④ ほかの 手は 消して いない ===");
  ["stageFit", "stageStyle", "stageBleed", "stageOffsetY", "stageShiftX", "stageShiftY"]
    .forEach((k) => t(`★${k} が ある`, typeof lib[k] === "function"));
  t("★STAGE_ASPECT が ある", typeof lib.STAGE_ASPECT === "number");
  t("★STAGE_BLEED_TOP_RATIO が ある", typeof lib.STAGE_BLEED_TOP_RATIO === "number");

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();

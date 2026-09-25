#!/usr/bin/env node
// ============================================================================
// ★1つの 部品が、★2つの 大きさを 持つ ところ（★2026-09-19・お決め D66(a)）
//
//   ★★坂本さんの お決め ──
//     ★「同じ 部品が 古い 画面・新しい 画面の 両方で 使われる 場合、
//       ★置き所（呼び出し箇所）ごとに 個別対応してください」。
//     ★★部品に 門（`layoutV2`）を 足しません。★UiV2 の ような 増やし方を しません。
//
//   ★★★確かめる こと
//     ①`六段` を 受け取り、★既定は 渡されない こと（＝ いまの まま）
//     ②中に 2つの 大きさが ある こと（★大きい ほうは 6段の 中）
//     ③門の 中の 置き所 だけ が `六段` を 渡して いる こと
//     ④古い 画面の 置き所は 渡して いない こと
//
//   ★★較正 ── ★無い 名では 落ちる こと。
// ============================================================================

const assert = require("assert");
const { readRaw } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const 段 = [12, 12.5, 13, 13.5, 14.5, 15.5];

// ★部品 ／ 門の 中の 置き所 ／ 古い 画面の 置き所
//
//   ★★★2026-09-25 ── ★`PeriodMarkerButton` を 外しました。
//     ★★門の 中の 区切りが、★1日ぶんの 札 から **一覧の 1枚**（`Kugiri`）に
//       ★変わりました（★design-v76・置き所は「しらべる」の 束）。
//     ★★だから 門の 中に この 部品の 置き所は もう ありません。
//       ★★残って いるのは 古い 画面（`!layoutV2`）の 1か所 だけ です。
//     ★★★部品も `六段` の 口も **消して いません**。★38人の 画面は そのまま です。
//       ★★また 門の 中に 置く 日が 来たら、★この 行を 戻します。
//   ★★下の ⑤が、★その「まだ 消して いない」ことを 見張ります。
const 組 = [
  { 部品: "TodayBand", 中: "HomeV2.jsx", 外: "VocalTracker.jsx" },
  { 部品: "RangeCalendar", 中: "NotesV2.jsx", 外: "VocalTracker.jsx" }
];

組.forEach(({ 部品, 中 }) => {
  const 本 = readRaw("components", 部品 + ".jsx");

  見る(部品 + " ── ★`六段` を 受け取り、★既定は いまの まま", () => {
    assert.ok(new RegExp("function " + 部品 + "\\(\\{ 六段 = false,").test(本),
      "★`六段 = false` で 受けて いません");
  });

  見る(部品 + " ── ★2つの 大きさを 持つ", () => {
    const 三項 = 本.match(/六段 \? ([^:]+) : ([^)}\n,]+)/g) || [];
    assert.ok(三項.length > 0, "★三項が ありません");
    三項.forEach((s) => {
      const 数字 = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      assert.strictEqual(数字.length, 2, "★2つの 数で ない: " + s);
      const [大, 小] = 数字;
      assert.ok(大 > 小, "★6段の ほうが 小さい: " + s);
      const px = 大 < 3 ? Math.round(大 * 16 * 1000) / 1000 : 大;
      assert.ok(段.includes(px) || px >= 16, "★6段の 外: " + s);
    });
  });

  見る(部品 + " ── ★門の 中の 置き所 だけ が 渡す", () => {
    const 置 = readRaw("components", 中);
    const 渡し = new RegExp("<" + 部品 + "[^>]*六段");
    assert.ok(渡し.test(置), "★" + 中 + " が 渡して いません");
  });
});

// ── ★⑤ 区切りの 引っ越し（★2026-09-25）────────────────────────
見る("PeriodMarkerButton ── ★古い 画面の 置き所が 残って いる", () => {
  const vt = readRaw("components", "VocalTracker.jsx");
  assert.ok(/\{!layoutV2 && \(\s*<PeriodMarkerButton/.test(vt),
    "★38人の 画面から 札が 消えて います");
  // ★★門の 中は 一覧の 1枚 です。
  assert.ok(/moreSection === "区切り" \?\s*\(\s*<Kugiri/.test(vt),
    "★門の 中の 区切りが `Kugiri` で ありません");
  // ★★`六段` の 口は 消して いません（★また 置く 日の ため）。
  const 本 = readRaw("components", "PeriodMarkerButton.jsx");
  assert.ok(/function PeriodMarkerButton\(\{ 六段 = false,/.test(本),
    "★`六段` の 口が 消えて います");
  assert.ok(/六段 \?/.test(本), "★2つの 大きさが 消えて います");
});

見る("★較正 ── ★無い 名は 見つからない", () => {
  assert.throws(() => readRaw("components", "アリマセン.jsx"));
});

console.log("\n★" + 数 + "つ 通りました。");

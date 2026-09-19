#!/usr/bin/env node
// ============================================================================
// ★VocalTracker ── ★門の 中の 字は 6段（★2026-09-19・お決め D63(b)）
//
//   ★★坂本さんの お指図 ──
//     ★「今の 個人画面と 開発中の 個人画面は 別。★開発中の 画面だけ 変える」。
//
//   ★★★見るのは 門の 中 だけ です。
//     ★★古い 画面（`!layoutV2` ／ 門を 通らない ところ）は 数えません。
//     ★★★ここで 古い 画面まで 見ると、★見張りが「38人の 字も 直せ」と 言い出します。
//
//   ★★囲いは **字下げ** で たどります。★「上へ N行」では 決めません
//     （★2026-09-19、★200行の 窓で 14か所を 取り違えました）。
//
//   ★★較正 ── ★当たり・外れ・閉じた節。
// ============================================================================

const assert = require("assert");
const { readRaw } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const 註 = /^\s*(\/\/|\*|\/\*)/;
const 門の外 = /!layoutV2/;
const 門の中 = /layoutV2\s*(&&|\?)/;
const 段 = [12, 12.5, 13, 13.5, 14.5, 15.5];

function 深さ(l) { return l.length - l.replace(/^\s*/, "").length; }

function 門(行, i) {
  let d = 深さ(行[i]);
  for (let j = i - 1; j >= 0; j--) {
    const l = 行[j];
    if (註.test(l) || !l.trim()) continue;
    if (深さ(l) < d) {
      d = 深さ(l);
      if (門の外.test(l)) return "門の外";
      if (門の中.test(l)) return "門の中";
      if (d === 0) break;
    }
  }
  return "門を通らない";
}

function 大きさ(l) {
  const 出 = [];
  const r = /fontSize:\s*(?:rem\(([0-9.]+)\)|["']([0-9.]+)(rem|px)["'])/g;
  let m;
  while ((m = r.exec(l)) !== null) {
    出.push(m[1] ? Number(m[1]) : Number(m[2]) * (m[3] === "rem" ? 16 : 1));
  }
  return 出.map((x) => Math.round(x * 1000) / 1000);
}

見る("道具の 較正", () => {
  assert.strictEqual(門(["if (layoutV2 && a) {", "  <A />"], 1), "門の中");
  assert.strictEqual(門(["if (!layoutV2) {", "  <A />"], 1), "門の外");
  const 閉じた = ["{layoutV2 && (", "  <A />", ")}", '{activeTab === "info" && (', "  <B />"];
  assert.strictEqual(門(閉じた, 4), "門を通らない", "★閉じた 節を 拾って います");
  assert.deepStrictEqual(大きさ('fontSize: rem(11.5)'), [11.5]);
  assert.deepStrictEqual(大きさ('padding: rem(4)'), []);
});

const 行 = readRaw("components", "VocalTracker.jsx").split("\n");
const 中 = [];
行.forEach((l, i) => {
  if (註.test(l)) return;
  大きさ(l).forEach((v) => { if (門(行, i) === "門の中") 中.push([i + 1, v]); });
});

見る("★門の 中に、★12より 小さい 字が ない", () => {
  const 小 = 中.filter(([, v]) => v < 12);
  assert.strictEqual(小.length, 0,
    "★12未満: " + 小.map(([n, v]) => n + "行=" + v).join(" "));
});

見る("★門の 中は 6段の 中 か、★16以上", () => {
  const 外 = 中.filter(([, v]) => v < 16 && !段.includes(v));
  assert.strictEqual(外.length, 0,
    "★6段の 外: " + 外.map(([n, v]) => n + "行=" + v).join(" "));
});

見る("★門の 中を 数えられて いる（★0件では ない）", () => {
  assert.ok(中.length >= 10, "★数えられて いません: " + 中.length);
});

console.log("\n★" + 数 + "つ 通りました。");

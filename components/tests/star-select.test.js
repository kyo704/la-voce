#!/usr/bin/env node
// ============================================================================
// ★`select("*")` が **落ちる** 表に 当たって いない ことの 見張り（★裁定 その113 §5-1）
//
//   ★★★列ごとの 渡し（column grant）の ある 表では、★`*` は 要求ごと 落ちます。
//     ★★0行では ありません。★`data` が null に なり、★画面は 黙って 空に なります。
//   ★★★2026-09-20、★2件 起きました ──
//     ★`lessons`（★place_id / kind を 足した 日から。★日程の 表が 丸1日 空）
//     ★`org_events`（★`created_by` を 渡して いない。★行事が 出ません）
//
//   ★★★この 見張りは **台帳に 尋ねません**（★走る たびに 遅く なる ため）。
//     ★★危ない 表の 名を ここに 置き、★`tools/star_select_check.py` が
//       ★★台帳から 数え直します。★食い違ったら、★そちらが 教えます。
//
//   ★★較正 ── ★`*` の 例で 当たり、★列を 並べた 例で 外れる こと。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
// ★★列ごとの 渡しの ある 表（★2026-09-20 に 台帳で 数えました）。
const ABUNAI = ["lessons", "org_events"];
const HOSHI = /\.from\("(\w+)"\)\s*\n?\s*\.select\("\*"/g;

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

function みな() {
  const 出 = [];
  const 歩く = (d) => {
    for (const n of fs.readdirSync(d)) {
      const p = path.join(d, n);
      if (fs.statSync(p).isDirectory()) {
        if (n !== "tests" && n !== "node_modules") 歩く(p);
        continue;
      }
      if (/\.jsx?$/.test(n)) 出.push(p);
    }
  };
  ["app", "components", "lib"].forEach((d) => 歩く(path.join(ROOT, d)));
  return 出;
}

見る("★落ちる 表に `*` を 当てて いない", () => {
  const 当 = [];
  みな().forEach((p) => {
    const s = fs.readFileSync(p, "utf8");
    let m;
    HOSHI.lastIndex = 0;
    while ((m = HOSHI.exec(s)) !== null) {
      if (ABUNAI.includes(m[1])) {
        当.push(path.relative(ROOT, p) + " … " + m[1]);
      }
    }
  });
  assert.deepStrictEqual(当, [], "★落ちます: " + 当.join(" / "));
});

見る("★較正 ── ★見分けられる", () => {
  const わるい = '.from("lessons").select("*").eq("id", x)';
  const よい = '.from("lessons").select(OPS_LESSON_COLUMNS).eq("id", x)';
  HOSHI.lastIndex = 0;
  assert.ok(HOSHI.test(わるい));
  HOSHI.lastIndex = 0;
  assert.ok(!HOSHI.test(よい));
});

見る("★危ない 表の 名が、★道具と 同じ", () => {
  const 道具 = fs.readFileSync(path.join(ROOT, "tools", "star_select_check.py"), "utf8");
  ABUNAI.forEach((t) => assert.ok(道具.includes(t), "★道具に ありません: " + t));
});

console.log("\n★" + 数 + "つ 通りました。");

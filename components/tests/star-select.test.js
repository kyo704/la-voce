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
// ★★★列ごとの 渡しの ある 表（★裁定 その124・2026-09-21）。
//   ★★★手で 並べて いました ── `["lessons", "org_events"]`。
//     ★★2026-09-21 の 時点で **5つ 増えて いました**（さがすの 5表）。
//     ★★手で 足す 一覧は、★足し忘れた ぶん を 黙って 見逃します。
//   ★★★いまは 台帳の 紙（`supabase/*.sql`）から 数えます。
//     ★★`grant select (…) on public.X` ── ★列を 名指しして 渡して いる 表 です。
//     ★★足し忘れる ところが ありません。
function 危ない表() {
  const dir = path.join(ROOT, "supabase");
  const 出 = new Set();
  fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).forEach((f) => {
    const s = fs.readFileSync(path.join(dir, f), "utf8");
    const re = /grant\s+select\s*\([^)]*\)\s*\n?\s*on\s+public\.(\w+)/gi;
    let m;
    while ((m = re.exec(s)) !== null) 出.add(m[1]);
  });
  return [...出].sort();
}
const ABUNAI = 危ない表();
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

見る("★危ない 表を、★数えられて いる", () => {
  // ★★1つも 見つからない なら、★世の中では なく 道具が 壊れて います。
  assert.ok(ABUNAI.length >= 2, "★紙から 数えられません: " + ABUNAI.join(","));
  console.log("    ★列ごとの 渡し: " + ABUNAI.length + "表 … " + ABUNAI.join(", "));
});

見る("★較正 ── ★列ごとの 渡しを 見分ける", () => {
  const 数え = (s) => {
    const re = /grant\s+select\s*\([^)]*\)\s*\n?\s*on\s+public\.(\w+)/gi;
    const 出 = []; let m;
    while ((m = re.exec(s)) !== null) 出.push(m[1]);
    return 出;
  };
  assert.deepStrictEqual(数え("grant select (id, name) on public.karibo to authenticated;"),
    ["karibo"], "★列を 名指しした 渡しを 拾う");
  assert.deepStrictEqual(数え("grant select on public.karibo to authenticated;"),
    [], "★表ごとの 渡しは 拾わない");
});

見る("★道具は 台帳に 尋ねて いる（★紙の 記憶では ない）", () => {
  const 道具 = fs.readFileSync(path.join(ROOT, "tools", "star_select_check.py"), "utf8");
  assert.ok(/information_schema\.column_privileges/.test(道具),
    "★道具が 台帳に 尋ねて いません");
  assert.ok(/ask_ledger\.py/.test(道具), "★道具が 台帳へ 行って いません");
});

console.log("\n★" + 数 + "つ 通りました。");

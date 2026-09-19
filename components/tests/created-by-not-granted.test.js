#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★`created_by` を 渡さない（★裁定 その93 の 横断・2026-09-19）
//
//   ★★★これは **紙**の 見張り です。★SQL の 字を 読みます。
//     ★★台帳そのものの 確かめは `tools/column_exposure_audit.py` です。
//
//   ★★守る こと ──
//     ★① 取り上げ（`revoke`）が 先、★渡し（`grant`）が あと
//     ★② 渡す 列の 中に `created_by` が **無い**
//     ★③ 表ぜんぶ の `grant select on` に 戻して いない
// ============================================================================

const fs = require("fs");
const path = require("path");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ROOT = path.join(__dirname, "..", "..");
const 道 = path.join(ROOT, "supabase", "migration_hide_created_by.sql");
if (!fs.existsSync(道)) {
  console.log("★★ありません: supabase/migration_hide_created_by.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const 素 = fs.readFileSync(道, "utf8")
  .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

for (const 表 of ["lessons", "org_events"]) {
  const r = 素.indexOf(`revoke select on public.${表}`);
  const g = 素.indexOf(`grant select (`, r);
  t(r >= 0, `★${表} ── ★取り上げが ある`);
  t(g > r, `★${表} ── ★渡すのは そのあと`);
  // ★★★列の `grant` は、★表の `grant` を 狭めません。★広い ほうが 勝ちます。
  //   ★★だから 取り上げが 先 です（★2026-09-15 の 覚え）。
  const 枠 = 素.slice(g, 素.indexOf(";", g));
  t(!/\bcreated_by\b/.test(枠), `★★${表} ── ★渡す 列に \`created_by\` が **無い**`);
  t(/\bid\b/.test(枠) && /\borg_id\b/.test(枠), `★${表} ── ★要る 列は 渡して いる`);
}

// ★★表ぜんぶ を 渡し直して いない こと。
t(!/grant select on public\.(lessons|org_events) to/.test(素),
  "★★表ぜんぶ の 読む 権を 渡し直して いない");

// ★★画面が 頼んで いない こと（★頼めば 誤りに なります）。
const 蔵 = ["lib/classroomShell.js", "components/VocalTracker.jsx"]
  .map((f) => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n");
const 並び = [];
for (const m of 蔵.matchAll(/_COLUMNS\s*=\s*\n?\s*"([^"]+)"/g)) 並び.push(m[1]);
for (const m of 蔵.matchAll(/\.select\("([^"]+)"/g)) 並び.push(m[1]);
t(並び.length > 0, "★列の 並びを 読めた");
const 頼む = new Set(並び.join(",").split(",").map((x) => x.trim()));
t(頼む.has("scheduled_at"), "★道具の 較正（★必ず 頼む 列が 見つかる）");
t(!頼む.has("created_by"), "★★画面が `created_by` を 頼んで いない");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

#!/usr/bin/env node

// ============================================================================
// ★管理画面が、★記録の 中身を 取り直さない こと
//
//   ★出どころ [ACTION] Opus → Code（★2026-09-15）
//     「delete app/admin/page.js:139-145 (the old path) once the call is
//       confirmed working. a fallback to a path we removed for privacy
//       reasons is not a safety net」
//   ★出どころ docs/records/修正の記録-No.019.5-数えるために値を運ばない.md
//
//   ★★消した 道は これ です ──
//     `entries` から 12列。★うち 3つは 自由記述と お薬の 記録 ──
//       `mental_reason`（★自由記述）
//       `voice_memo`（★自由記述）
//       `medication_tags`（★お薬）
//   ★★値は 1つも 使われて いません でした。★`typeof` と `.length` だけ。
//     ★それでも 毎回 米国の 関数へ 運ばれて、★数えられて、捨てられて いました
//       （★x-vercel-id = hnd1::iad1）。
//
//   ★★逃げ道が あると、★消した はずの 道が 静かに 生き返ります。
//     ★★`if (!entryStats)` の 下に 置いて あったので、
//       ★関数が 呼べない ときに **毎回** 走りました。
//     ★★そして 誰も 気づきません ── ★画面は 同じ 数字を 出すから です。
//
//   ★★この 見張りは、★戻って きたら 落ちます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const P = ["app", "admin", "page.js"];
if (!fs.existsSync(path.join(__dirname, "..", "..", ...P))) {
  console.log("★★ありません: " + P.join("/"));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const src = readCode(...P);
const raw = readRaw(...P);

console.log("① ★記録の 中身の 列を、★1つも **取って** いないこと");
// ★★コメントを 外した 本文で 数えます。★説明を 数えない ため。
//   ★★2026-09-15、★同じ 罠を 2度 踏みました
//     （★道具が 私の コメントを「実装」と 数えた）。
//
// ★★★はじめ、★ただ 語が 在るかを 見て いました。★それは 誤りです。
//   ★★`countOf("meals")` の "meals" は、★**取って いる** のでは ありません。
//     ★台帳が 返した 数の、★どれを 読むか の 鍵 です。
//   ★★見るべきは「どこに 付いて いるか」── ★`.select(...)` の 中だけ です。
//     ★★語を 数えると、★正しい コードが 落ちます。★落ちない ものは 直されません。
const selectArgs = (src.match(/\.select\(\s*(["'`])[\s\S]*?\1/g) || []).join("\n");
console.log("    ★見た `.select(...)`: " + (src.match(/\.select\(/g) || []).length + " 件");

const FORBIDDEN_COLUMNS = [
  ["mental_reason", "自由記述"],
  ["voice_memo", "自由記述"],
  ["medication_tags", "お薬の 記録"],
  ["mental_tags", "こころの 様子"],
  ["cpps_value", "止めて いる 測り"],
  ["weight_kg", "からだの 数"],
  ["body_fat_pct", "からだの 数"],
  ["temperature", "まわり"],
  ["humidity", "まわり"],
  ["meals", "食べたもの"],
  ["exercises", "した 運動"]
];
FORBIDDEN_COLUMNS.forEach(([col, why]) => {
  t(!selectArgs.includes(col), "「" + col + "」を 取って いない ── " + why);
});

console.log("\n② ★`entries` を 直に 引いて いないこと");
// ★★数えるのは 台帳の 中 です。★画面へ 運びません。
t(!/\.from\(\s*["']entries["']\s*\)/.test(src), "entries を from して いない");
t(!/entryRows/.test(src), "古い 逃げ道の 覚え（entryRows）が 無い");

console.log("\n③ 台帳の 関数を 呼んで いること");
// ★★2026-09-15、★引数が 増えました（★No.024・裁定 ㋐）。
//   ★★`admin_entry_stats()` → `admin_entry_stats(p_user_id)`。
//   ★★門を 経路の 外へ 出す ため です。★関数の 中でも is_admin を 見ます。
//   ★★渡す id は、★:49 で 既に 確かめた **その 人の id** です。
t(/admin\.rpc\("admin_entry_stats", \{ p_user_id: user\.id \}\)/.test(src),
  "admin_entry_stats を、★本人の id を 渡して 呼んで いる");
// ★★呼ぶ 鍵は service_role です。★関数は service_role にしか 渡して いません。
t(/createAdminClient\(\)/.test(src), "service_role の 鍵で 呼んで いる");

console.log("\n④ 取れなかった ときに、★0% と 出さないこと");
// ★★「数えられなかった」と「0件」は、★別の こと です。
//   ★★0% と 出すと、★「誰も 書いて いない」と 読めます。
t(/statsOk/.test(src), "取れたか どうかを 持って いる");
t(/statsOk \? /.test(src), "取れた ときだけ 数を 出す");
t(raw.includes("入力率を 数えられませんでした"), "取れなかった と 画面に 書く");
t(raw.includes("古い 取り方には 戻しません"), "戻らない と 書いて ある");

console.log("\n⑤ 門が、★経路の 中に しか ないこと（★まだ 直って いません）");
// ★★これは「通す」ための 1本では ありません。★**いまの 姿を 書き留める** ための 1本です。
//   ★★`app/admin/page.js` の 早い return が、★唯一の 門 です。
//     ★★`auth.uid()` は service_role の 下では null なので、
//       ★関数の 中には 門を 置けません（★いまの 形 では）。
//     ★★`get_student_entries` と 同じ 形 ── ★経路が 変われば 門も 外れます。
//   ★★関数の 中に 門が 入ったら、★この 1本は 落ちます。★落ちて 正しい です。
//     ★そのとき、★ここを 書き直して ください。
t(/profiles[\s\S]{0,200}is_admin/.test(src), "門は いまも 経路の 中に ある（★Opus の 判断待ち）");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

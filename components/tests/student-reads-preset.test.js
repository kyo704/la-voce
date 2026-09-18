#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★学生は 型を 読める。★型の 割り当ては 読めない（★裁定 その92）
//
//   ★★★これは **紙**の 見張り です。★SQL の 字を 読みます。
//     ★★台帳そのものは 見ません。★実地の 確かめは
//       ★`tools/ruling92_verify.py` と
//       ★`docs/reports/2026-09-19-裁定その92-確かめ.md` です。
//     ★★★紙だけ を 見て「できて いる」と 言いません（★蔵の 決め）。
//
//   ★★この 見張りが 守るのは 2つ です。
//     ★① `lesson_presets` に 在籍の 枝が ある（★`active` を 求める）
//     ★② `lesson_preset_targets` に 在籍の 枝が **ない**
// ============================================================================

const fs = require("fs");
const path = require("path");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ROOT = path.join(__dirname, "..", "..");
const 道 = path.join(ROOT, "supabase", "migration_student_reads_preset.sql");
if (!fs.existsSync(道)) {
  console.log("★★ありません: supabase/migration_student_reads_preset.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const sql = fs.readFileSync(道, "utf8");

// ★★註を 外します。★禁じた 字は、★註の 中に 何度も 出て きます。
const 素 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

function 決まりの中(名) {
  const i = 素.indexOf("create policy " + 名);
  if (i < 0) return "";
  const j = 素.indexOf(";", i);
  return 素.slice(i, j < 0 ? 素.length : j);
}

const 型 = 決まりの中("lesson_presets_select");
const 割 = 決まりの中("lesson_preset_targets_select");

t(型.length > 0, "★型を 読む 決まりが ある");
t(割.length > 0, "★割り当てを 読む 決まりが ある");

// ★① ★学生の 枝
t(/enrollments/.test(型), "★型 ── ★在籍を 見て いる");
t(/student_id\s*=\s*auth\.uid\(\)/.test(型), "★型 ── ★ご本人の 行を 見て いる");
t(/status\s*=\s*'active'/.test(型), "★型 ── ★いま 在る 方 だけ（★やめた方は 読めない）");
t(/has_can\(org_id,\s*'meibo'\)/.test(型), "★型 ── ★事務は これまで どおり");
t(/has_can\(org_id,\s*'monka_write'\)/.test(型), "★型 ── ★先生は これまで どおり");

// ★② ★割り当ては 学生に 見せない
t(!/enrollments/.test(割), "★★割り当て ── ★在籍の 枝が **ない**");
t(!/student_id/.test(割), "★★割り当て ── ★生徒を 見て いない");
t(/has_can\(org_id,\s*'meibo'\)/.test(割), "★割り当て ── ★事務 だけ");
t(/has_can\(org_id,\s*'monka_write'\)/.test(割), "★割り当て ── ★先生 だけ");

// ★★書く 決まりを 触って いない こと。★学生は 書けません。
t(!/create policy lesson_presets_write/.test(素), "★書く 決まりを 触って いない");

// ★★★列の 名は 台帳に 合わせます（★裁定の 文は `user_id` でした）。
t(!/e\.user_id/.test(素), "★★`user_id` と 書いて いない（★この 蔵は `student_id`）");

// ★★★較正 ── ★わざと 1つ 該当させて、★この 見張りが 動く ことを 確かめます。
const 偽 = "create policy x on t for select using (exists (select 1 from enrollments))";
t(/enrollments/.test(偽), "★道具の 較正（★在籍の 枝を 見つけられる）");

// ★★★何度 流しても 同じに なる こと。
t(/drop policy if exists lesson_presets_select/.test(素), "★先に 落として いる");
t(/drop policy if exists lesson_preset_targets_select/.test(素), "★割り当ても 先に 落として いる");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

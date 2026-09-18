#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★学生は 型を **読み道 から** 読む（★裁定 その93・2026-09-19）
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
const 道 = path.join(ROOT, "supabase", "migration_preset_for_student_rpc.sql");
if (!fs.existsSync(道)) {
  console.log("★★ありません: supabase/migration_preset_for_student_rpc.sql");
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

// ★① ★決まりは 事務と 門下 だけ に 戻って いる（★裁定 その93）
//   ★★★決まり（RLS）は **行** を 選びます。★**列** は 選びません。
//     ★★裁定 その92 の 在籍の 枝を 入れると、★`note` も `need_count` も 渡ります。
//     ★★★行が 0 の いま 取り消しました。★入って からでは 移し替えが 要ります。
t(!/enrollments/.test(型), "★★型の 決まりに 在籍の 枝が **ない**（★その92を 取り消した）");
t(/has_can\(org_id,\s*'meibo'\)/.test(型), "★型 ── ★事務");
t(/has_can\(org_id,\s*'monka_write'\)/.test(型), "★型 ── ★門下");

// ★② ★読み道 ── ★2つの 列 しか 返さない
const 関数 = 素.slice(素.indexOf("create or replace function"));
t(/get_lesson_preset_for_student/.test(関数), "★読み道が ある");
t(/returns table\(name text, total_count int\)/.test(関数), "★★返すのは 2つ だけ");
t(!/\bnote\b/.test(関数), "★★`note` を 返して いない");
t(!/need_count/.test(関数), "★★`need_count` を 返して いない");
t(!/created_by/.test(関数), "★★`created_by` を 返して いない");
t(/security definer/.test(関数), "★決まりを 越えて 読む（★だから 中で 門を 立てる）");
t(/set search_path = ''/.test(関数), "★★綴りの 道を 空に して いる");
t(/enrollments/.test(関数) && /status\s*=\s*'active'/.test(関数),
  "★★門が 中に ある（★いま 在る 方 だけ）");
t(/student_id\s*=\s*auth\.uid\(\)/.test(関数), "★ご本人の 行 だけ");

// ★③ ★先に 取り上げて から、★要る 方に だけ 渡す
const 取上 = 素.indexOf("revoke all on function");
const 渡す = 素.indexOf("grant execute on function");
t(取上 > 0 && 渡す > 取上, "★★取り上げが 先、★渡すのが あと");
t(/from anon/.test(素), "★名無しから 取り上げて いる");

// ★④ ★割り当ては これまで どおり 学生に 見せない
t(!/lesson_preset_targets/.test(素) || !/enrollments/.test(割),
  "★★割り当てに 在籍の 枝が ない");

// ★★書く 決まりを 触って いない こと。★学生は 書けません。
t(!/create policy lesson_presets_write/.test(素), "★書く 決まりを 触って いない");

// ★★★列の 名は 台帳に 合わせます（★裁定の 文は `user_id` でした）。
t(!/e\.user_id/.test(素), "★★`user_id` と 書いて いない（★この 蔵は `student_id`）");

// ★★★較正 ── ★わざと 1つ 該当させて、★この 見張りが 動く ことを 確かめます。
const 偽 = "returns table(name text, total_count int, note text)";
t(/\bnote\b/.test(偽), "★道具の 較正（★`note` 入りを 見つけられる）");

// ★★★何度 流しても 同じに なる こと。
t(/drop policy if exists lesson_presets_select/.test(素), "★先に 落として いる");
t(/create or replace function/.test(素), "★何度 流しても 同じ（★関数）");

// ★⑤ ★画面が 表を 直に 読んで いない こと
const 画面 = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf8");
t(/rpc\("get_lesson_preset_for_student"/.test(画面), "★画面が 読み道を 通して いる");
// ★★★事務の 画面は、★表を 直に 読みます。★あちらは `meibo` を 持つ 方 です。
//   ★★見るのは **学生の 殻** だけ です。★`attendingPresets` の ところ。
//   ★★はじめ、★蔵ぜんぶで 探して 落ちました（★2026-09-19）。
//     ★★事務の 読みを、★学生の 読みと 見分けて いません でした。
const 殻頭 = 画面.indexOf("const [attendingPresets");
t(殻頭 > 0, "★学生の 殻が ある");
const 殻 = 画面.slice(殻頭, 画面.indexOf("[layoutV2, attendingOrgId]", 殻頭) + 30);
t(!/from\("lesson_presets"\)/.test(殻), "★★学生の 殻が 表を 直に 読んで いない");
t(!/lesson_preset_targets/.test(殻), "★★学生の 殻が 割り当てを 読んで いない");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

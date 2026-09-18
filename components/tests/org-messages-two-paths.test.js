// ============================================================================
// ★見張り ── ★org_messages の 読む 道は 2本（★裁定 その76 追補・2026-09-18）
//
//   ★平常 … ★担当の 先生／その 門下の 生徒。★`assignments.ended_at is null` で 絞る。
//   ★調査 … ★`monka_read` を 持つ 方。★`org_id` **だけ** で 絞る。
//          ★★やめた 方の ぶんも 読めます。
//          ★★「ハラスメントは やめた あとに 表面化する」（★裁定の 言葉）。
//
//   ★★★なぜ 分けるか ── ★1つの 条件に 足すと、★読み分けが できなく なります。
//     ★★あとで 平常の 側を 直す とき、★調査の 側を 一緒に 壊します。
//
//   ★★測る のは 4つ です。
//     ★一 ★調査の 道が 別の 決まりとして 書かれて いる
//     ★二 ★調査の 道が `ended_at` で 絞って いない
//     ★三 ★調査の 道で **書けない**（`monka_read` は 読む できこと）
//     ★四 ★★平常の 道に `monka_read` を 混ぜて いない
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const 紙の道 = path.join(ROOT, "supabase/migration_org_messages_monka_read.sql");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

if (!fs.existsSync(紙の道)) {
  console.error("★止まりました ── 紙が ありません: " + 紙の道);
  process.exit(1);
}

// ★★注を 落として から 見ます。★注に `ended_at` も `monka_read` も 書いて あります。
const 字 = stripComments(fs.readFileSync(紙の道, "utf8"), ".sql");

// ★一 ★別の 決まりとして 書かれて いる
ok(/create policy\s+org_messages_select_monka_read/i.test(字),
  "調査の 道が、★別の 決まりとして ある");
ok(/for select/i.test(字), "読む ための 決まり");

// ★二 ★`ended_at` で 絞って いない
// ★★★はじめ、★名が 出る ところ から **紙の 終わり まで** を 見て いました。
//   ★★下の「確かめ」の 問いに `like '%ended_at%'` と 書いて あります。
//   ★★自分の 確かめの 字に 当たって 落ちました。★3度目の 同じ 形 です。
//   ★★★見るのは **その 決まりの 1文** だけ です。`create policy` から `;` まで。
const 始 = 字.indexOf("create policy org_messages_select_monka_read");
assert.ok(始 > 0, "★止まりました ── 調査の 決まりを 読めません。");
const 本体 = 字.slice(始, 字.indexOf(";", 始) + 1);
ok(!/ended_at/.test(本体), "やめた 方の ぶんも 読める（ended_at で 絞って いない）");
ok(!/status\s*=\s*'active'/.test(本体), "やめた 在籍も 外して いない");
ok(/has_can\(\s*org_id\s*,\s*'monka_read'\s*\)/.test(本体),
  "monka_read を 持つ 方だけ");

// ★三 ★書けない
ok(!/for\s+(insert|update|delete|all)/i.test(字),
  "★書く 決まりを 足して いない（monka_read は 読む できこと）");
ok(!/with check/i.test(字), "書く ための 条件が 無い");

// ★四 ★平常の 道を 触って いない
ok(!/drop policy|alter policy/i.test(字),
  "平常の 決まりに 手を 入れて いない（消さない・書き換えない）");
ok(!/org_messages_select\b(?!_monka_read)/.test(本体),
  "平常の 決まりの 名が、★調査の 決まりの 中に 出て こない");

// ★★★決まりは「読んで よいか」しか 見ません。★読んだ ことは 数えません。
//   ★★記録（monka_read_log）を 書く のは 画面の 仕事 です。
//   ★★その ことが、★紙に 書いて ある か。
const 生 = fs.readFileSync(紙の道, "utf8");
ok(/monka_read_log/.test(生),
  "記録は 決まりでは 縛れない、と 紙に 書いて ある");

ok(!/\bbegin\b\s*;|\brollback\b/i.test(字), "BEGIN / ROLLBACK を 使って いない");

console.log("\n★" + 数 + "件 通りました ── 読む 道は 2本");

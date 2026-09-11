#!/usr/bin/env node

// ============================================================================
// ★できことの 鍵は、★どこかで 読まれて いるか（★N-1 の 決まり）
//
//   ★出どころ Opus の 決まり（★9月11日・そのまま）
//     「★規則：書き込んでいる値は、必ずどこかで読まれているか。
//      ★規則：作った関数は、必ずどこかから呼ばれているか。」
//
//   ★★2026-09-11、★§3の 総当たりの 下ごしらえ中に 見つけました。
//     ★★13ある できことの 鍵の うち、★止める 力を 持って いるのは わずかです。
//       ★★多くは「どの 札を 出すか」（★TAB_RULES）だけに 使われて います。
//       ★★札を 出さない ことは、★書けない ことでは ありません。
//
//   ★★この見張りは 落としません。★数えて 並べるだけ です。
//     ★★直すのは 設計の 仕事で、★見張りの 仕事では ありません。
//     ★★けれど「知らないまま」には しません。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const KEYS = ["bill", "bill_pay", "meibo", "sched_all", "sched_mine", "gyoji",
  "renraku_all", "shukketsu", "koma", "koma_mine", "master", "post", "monka_write"];

// ★★見張りと、★鍵の 一覧そのものは 数えません（★自分を 数えない）。
function usedIn(key) {
  let out = "";
  try {
    out = execSync(
      `grep -rl "[\\"']${key}[\\"']" components lib app 2>/dev/null || true`,
      { cwd: ROOT, encoding: "utf8" });
  } catch (e) { out = ""; }
  return out.split("\n").filter(Boolean)
    .filter((f) => !f.startsWith("components/tests/"))
    .filter((f) => f !== "lib/opsPerms.js");
}

// ★台帳の 決まりが その鍵を 見て いるか（★has_can）
const sqlAll = fs.readdirSync(path.join(ROOT, "supabase"))
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(ROOT, "supabase", f), "utf8")).join("\n");

console.log("★できことの 鍵 " + KEYS.length + " 本");
console.log("──────────────────────────────────────────────────────────");
console.log("  鍵           画面／API で 読む            SQL に 書いて ある");
console.log("──────────────────────────────────────────────────────────");

let onlyTab = 0, nowhere = 0, inDb = 0;
KEYS.forEach((k) => {
  const files = usedIn(k);
  const db = new RegExp("has_can\\([^)]*'" + k + "'").test(sqlAll);
  if (db) inDb++;
  let where;
  if (files.length === 0) { where = "★どこにも（★札の 一覧だけ）"; nowhere++; }
  else where = files.join(" ");
  if (files.length === 0) onlyTab++;
  console.log("  " + k.padEnd(13) + where.padEnd(30) + (db ? "★見る" : "★見ない"));
});

console.log("──────────────────────────────────────────────────────────");
console.log("★SQL の どれかに has_can で 書いて ある 鍵 …… " + inDb + " / " + KEYS.length);
console.log("　★★これは supabase/*.sql の 文字を 読んだ 数です。");
console.log("　★★実際に 台帳へ 入って いるか どうかでは ありません。");
console.log("　★★流して いない ファイルの ぶんも 数えます（★多めに 出ます）。");
console.log("　★本当の 数は pg_policies で しか 分かりません ──");
console.log("　★supabase/2026-09-11-§3-50通り-台帳の側（読むだけ）.sql の ②。");
console.log("★画面の 札を 出すか どうか だけの 鍵 …… " + nowhere + " / " + KEYS.length);
console.log("");
console.log("★★札を 出さない ことは、★書けない ことでは ありません。");
console.log("　★★ブラウザは 表に 直に 書けます。★札は 通り道では ありません。");
console.log("");
console.log("★★出席（lessons.attendance）と 日程（lessons の 時刻）は 同じ 表です。");
console.log("　★★行の 決まりは 列を 隠せません。");
console.log("　★★日程を 直せる 方は、★いまの ところ 出席も 付けられます。");

// ★★落としません。★数えて 並べるだけ です。
process.exit(0);

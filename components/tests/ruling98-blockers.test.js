#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★裁定 その98 の 3つ（★2026-09-19）
//
//   ★① 空いて いる ところ …… ★2値 だけ。★決まりを 緩めない
//   ★② 学校の 形 …… ★`parent_id` で つなぐ。★`using (true)` を 書かない
//   ★③ 門下に 招く …… ★`teacher_invitations.monka_teacher_id`
//
//   ★★これは **紙**の 見張り です。★SQL の 字を 読みます。
//     ★★台帳そのものの 確かめは `tools/ask_ledger.py` で しました。
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
function 読む(名) {
  const p = path.join(ROOT, "supabase", 名);
  if (!fs.existsSync(p)) {
    console.log("★★ありません: supabase/" + 名);
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
  return fs.readFileSync(p, "utf8")
    .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
}

const 空き = 読む("migration_free_slots_bulk.sql");
const 形 = 読む("migration_org_divisions.sql");
const 招く = 読む("migration_invitation_monka.sql");

見る("道具の 較正", () => {
  assert.ok(/using \(true\)/.test("create policy x using (true)"), "★道具が 壊れて います");
});

見る("① 返すのは 2値 だけ", () => {
  assert.ok(/returns table \(user_id uuid, slot_key text, is_free boolean\)/.test(空き),
    "★返す ものが ちがいます");
  for (const 語 of ["title", "room", "memo", "unavailable", "teacher"]) {
    const 中 = 空き.slice(空き.indexOf("create or replace function"));
    assert.ok(!new RegExp("\\b" + 語 + "\\b").test(中.split("$$")[1] || ""),
      "★中身を 返して います: " + 語);
  }
});

見る("① 決まりを 緩めて いない", () => {
  assert.ok(!/my_timetable/.test(形), "★別の ところで 触って います");
  assert.ok(!/alter table public\.my_timetable/.test(空き), "★表の 決まりを 触って います");
  assert.ok(!/create policy .*my_timetable/.test(空き), "★時間割に 決まりを 足して います");
  assert.ok(/security definer/.test(空き), "★読み道に なって いません");
});

見る("① 門は 2つ（★学校全部 ／ 担当の 先生）", () => {
  const 中 = 空き.slice(空き.indexOf("create or replace function"));
  assert.ok(/has_can\(p_org_id, 'sched_all'\)/.test(中), "★学校全部の 枝が ありません");
  assert.ok(/a\.teacher_id = auth\.uid\(\)/.test(中), "★担当の 先生の 枝が ありません");
  assert.ok(/e\.status = 'active'/.test(中), "★いま 在る 方 だけ に なって いません");
});

見る("① 重なり（overload）を 作って いない", () => {
  assert.ok(/drop function if exists public\.get_student_free_slots\(uuid\)/.test(空き),
    "★古い 1人ぶんを 落として いません");
});

見る("② 形は `parent_id` で つなぐ", () => {
  assert.ok(/parent_id\s+uuid references public\.org_divisions\(id\)/.test(形),
    "★つなぎが ありません");
  assert.ok(/kind in \('faculty', 'department', 'field'\)/.test(形), "★種が ちがいます");
  // ★★列の 名に「学部」「学科」を 埋め込んで いない こと。
  assert.ok(!/faculty_name|department_name|gakubu|gakka/.test(形),
    "★形を 列の 名に 埋め込んで います");
});

見る("② `using (true)` を 書いて いない", () => {
  assert.ok(!/using \(true\)/.test(形), "★`using (true)` が あります");
  const 書く = 形.slice(形.indexOf("create policy org_divisions_write"));
  assert.ok(/using \(has_can\(org_id, 'meibo'\)\)/.test(書く), "★`using` が ありません");
  assert.ok(/with check \(has_can\(org_id, 'meibo'\)\)/.test(書く), "★`with check` が ありません");
});

見る("② 取り上げが 先、★渡すのが あと", () => {
  const r = 形.indexOf("revoke all on public.org_divisions");
  const g = 形.indexOf("grant select, insert, update, delete on public.org_divisions");
  assert.ok(r > 0 && g > r, "★渡しが 先に なって います");
  assert.ok(!/truncate/i.test(形), "★`truncate` を 渡して います");
});

見る("③ 門下に 招く ── ★列が ある", () => {
  assert.ok(/monka_teacher_id uuid references auth\.users\(id\)/.test(招く),
    "★列が ありません");
});

console.log("\n★" + 数 + "つ 通りました。");

#!/usr/bin/env node
/**
 * ★募集を 出す の 見張り（★裁定 その94 §4g・その130・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 時間・会場・合わせの 場所の 入れ口が 無い（★§4g never_show）
 *     ★② 学校を 画面で 選ばせない（★L1 の 抜けを 作らない）
 *     ★③ 期限を 強いない。「決めない」を 選べる（★裁定 その130）
 *     ★④ 期限が 来ても 消さない。★一覧から 外れる だけ
 *
 *   ★★較正 ── ★故意に 1件 該当を 作り、★見つける ことを 確かめます。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★出しては いけない ものの 入れ口が あるか。 */
function 出さないものの入れ口(src) {
  return /(start_?time|end_?time|venue|会場|合わせの 場所|時間を 選|type="time")/i.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "postingForm.js"), "utf-8");
  const lib = stripComments(libRaw);
  const jsx = stripComments(readRaw("components", "PostingForm.jsx"));
  const sql = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_posting_expires.sql"), "utf-8"));
  const 門 = stripComments(fs.readFileSync(path.join(ROOT, "supabase", "migration_postings_insert_guard.sql"), "utf-8"));
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));

  console.log("=== 一 ★出さない ものの 入れ口が 無い（★§4g） ===");
  t(!出さないものの入れ口(jsx), "★画面に 時間・会場・場所の 入れ口が 無い");
  t(!出さないものの入れ口(lib), "★lib にも 無い");
  t(/type="date"/.test(jsx), "★日にちは 選ぶ 形（★自由記述では ない・裁定 その130 Q2）");
  t(!/希望の 時期.*input/s.test(jsx), "★「希望の 時期」の 入れ口を 作って いない");

  console.log("=== 二 ★何のために は 4つ（★裁定 その130 Q1） ===");
  t(m.KINDS.length === 4, `★4つ ちょうど（いま ${m.KINDS.length}）`);
  ["実技試験", "コンクール", "演奏会", "録音"].forEach((k) =>
    t(m.KINDS.includes(k), `★${k} が ある`));
  t(!m.KINDS.includes("レッスン") && !m.KINDS.includes("決めていない"),
    "★見本の 6つの ままに して いない");

  console.log("=== 三 ★学校を 画面で 選ばせない ===");
  t(!/org_id/.test(jsx), "★画面に org_id が 出て こない");
  t(!/org_id/.test(lib), "★lib にも 無い");
  const vt = stripComments(readRaw("components", "VocalTracker.jsx"));
  t(/org_id: orgId, owner_user_id: userId/.test(vt), "★呼ぶ側が 入れて いる");
  t(/enrollments/.test(門) && /postings_insert_own/.test(門),
    "★台帳の 門も 在籍を 見て いる（★二重に 守る）");

  console.log("=== 四 ★期限（★裁定 その130） ===");
  t(m.EXPIRES.length === 3, "★3つ（1か月・3か月・決めない）");
  t(m.EXPIRES.some((x) => x.months === null), "★「決めない」が 選べる");
  t(m.expiresAt("none") === null, "★「決めない」は 期限 なし");
  // ★★月末の ずれ。★1月31日 ＋ 1か月 は 3月3日 では ありません。
  const d = new Date("2026-01-31T09:00:00+09:00");
  t(m.expiresAt("1m", d).slice(0, 7) === "2026-02", `★1/31 ＋1か月 が 2月に なる（${m.expiresAt("1m", d).slice(0, 10)}）`);
  t(m.expiresAt("3m", new Date("2026-09-21T09:00:00+09:00")).slice(0, 10) === "2026-12-21",
    "★9/21 ＋3か月 が 12/21");
  t(/EXPIRE_NOTE/.test(lib) && /消えません/.test(lib), "★消えない と 言って いる");
  t(/ENDED_LABEL/.test(lib) && /もう一度 出せます/.test(lib), "★もう一度 出せる と 言って いる");

  console.log("=== 五 ★台帳（★出さなく なる だけ・消さない） ===");
  t(/add column if not exists expires_at/.test(sql), "★列を 足して いる");
  t(/expires_at is null or p\.expires_at > now\(\)/.test(sql), "★一覧から 外して いる");
  t((sql.match(/expires_at is null or p\.expires_at > now\(\)/g) || []).length === 2,
    "★一覧と 1件、★同じ 条件（★片方だけ 開けて いない）");
  t(!/delete from public\.postings/.test(sql), "★消す 式が どこにも 無い");
  t(/p\.expires_at is not null and p\.expires_at <= now\(\)/.test(sql),
    "★自分の 画面には 残り、★終わった ことが 判る");
  // ★★お知らせを 送りません（★裁定 その87）。
  t(!/notice|notify|user_notices/.test(sql), "★お知らせを 送る 仕掛けが 無い");

  console.log("=== 六 ★出せない ときは わけを 言う ===");
  t(m.canSubmit({ days: [], kind: "演奏会" }) === false, "★日にちが 無ければ 出せない");
  t(m.whyNot({ days: [], kind: "演奏会" }).length > 0, "★わけが 出る");
  t(m.canSubmit({ days: ["2026-10-18"], kind: "演奏会", feeAmount: "" }) === true,
    "★お礼が 空でも 出せる");
  t(m.canSubmit({ days: ["2026-10-18"], kind: "レッスン" }) === false, "★4つ 以外は 出せない");

  console.log("=== 七 ★較正（★故意に 1件 作る） ===");
  t(出さないものの入れ口('<input type="time" />'), "★時間の 入れ口を 見つける");
  t(出さないものの入れ口("venue: form.venue"), "★会場を 見つける");
  t(!出さないものの入れ口('<input type="date" />'), "★日にちでは 当たらない");
  t(!出さないものの入れ口("days: f.days"), "★日の 並びでは 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();

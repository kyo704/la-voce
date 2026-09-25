// ============================================================================
// ★読んだ印が 台帳に 残って いないか ── ★見張り（★2026-09-25）
//
// STRIP: A   ★動き（★どこに 書くか）を 見ます。★コメントは 落とします。
//
//   ★★見本の 約束 ──「読んだ印（✓）は、ご自分の 端末にだけ 残ります。
//     ★誰が 読んだかは 記録しません（数だけ 数えます）。」
//   ★坂本さんの お決め（★2026-09-25）──「誰が読んだかを記録しない形に」
//
//   ★★確かめること
//     ① `read_at`・`first_read_at`・`bookmarked` を、★どこも 書いて いない こと。
//     ② `COLS_ARTICLE_PROGRESS` が その 3列を 引いて いない こと。
//     ③ 読んだ印を 取るのが `lib/articleRead.js` である こと（★台帳では ない）。
//     ④ 数える 関数に、★人の 番号を 渡して いない こと。
//     ⑤ `lib/articleRead.js` が 時刻を 持たない こと（★印だけ）。
//     ⑥ 移行の 紙が、★3列を 外して いる こと。
//
//   ★★移行の 紙を 見ます。★台帳そのものは 見張りから 引けません ──
//     ★だから「紙が そう 書いて ある」ことまで です。
//     ★★台帳の ほうは 当てた あとに 直に 数えました（★報告に 残して います）。
// ============================================================================
const { readCode, readRaw } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const vt = readCode("components", "VocalTracker.jsx");
const cols = readCode("lib", "dbColumns.js");
const mod = readCode("lib", "articleRead.js");
const mig = readRaw("supabase", "migration_article_read_off_ledger.sql");

// ── ★① 3列を どこも 書いて いない ───────────────────────────
for (const 列 of ["read_at", "first_read_at", "bookmarked"]) {
  // ★★`last_answered_at` などに 引っかからない ように、★前後を 見ます。
  const re = new RegExp("(?<![a-z_])" + 列 + "(?![a-z_])");
  よし(!re.test(vt), "★VocalTracker が まだ「" + 列 + "」に 触って います");
}

// ── ★② 引く 列の 一覧に 入って いない ────────────────────────
const i = cols.indexOf("COLS_ARTICLE_PROGRESS");
よし(i >= 0, "★COLS_ARTICLE_PROGRESS が ありません");
if (i >= 0) {
  const blk = cols.slice(i, cols.indexOf(";", i));
  for (const 列 of ["read_at", "first_read_at", "bookmarked"]) {
    よし(!new RegExp("(?<![a-z_])" + 列 + "(?![a-z_])").test(blk),
         "★COLS_ARTICLE_PROGRESS が まだ「" + 列 + "」を 引いて います");
  }
  よし(/\bbox\b/.test(blk) && /next_due_at/.test(blk) && /last_answered_at/.test(blk),
       "★出し直す 予定の 3列が 消えて います（★消して は いけません）");
}

// ── ★③ 印は 端末から ────────────────────────────────────
よし(vt.includes("readMarks()"), "★端末から 読んで いません（readMarks）");
よし(vt.includes("writeMark("), "★端末へ 書いて いません（writeMark）");
よし(/from\s+"@\/lib\/articleRead"/.test(vt), "★lib/articleRead.js を 呼んで いません");

// ── ★④ 数える ときに 人の 番号を 渡して いない ────────────────
const j = vt.indexOf("BUMP_FN");
よし(j > 0, "★数える 関数を 呼んで いません");
if (j > 0) {
  const 呼 = vt.slice(vt.indexOf("rpc(BUMP_FN"), vt.indexOf("rpc(BUMP_FN") + 200);
  よし(!/user_id|userId|auth/.test(呼),
       "★数える ときに 人の 番号を 渡して います …… " + 呼.slice(0, 80));
}
よし(!mod.includes("auth.uid"), "★lib/articleRead.js が auth.uid を 持って います");

// ── ★⑤ 印は 時刻を 持たない ──────────────────────────────
よし(!/toISOString|Date\.now|new Date\(/.test(mod),
     "★lib/articleRead.js が 時刻を 作って います（★印だけで 足ります）");
よし(mod.includes("localStorage"), "★端末の 覚え場所を 使って いません");

// ── ★⑥ 移行の 紙が 3列を 外して いる ───────────────────────
for (const 列 of ["read_at", "first_read_at", "bookmarked"]) {
  よし(new RegExp("drop column if exists\\s+" + 列).test(mig),
       "★移行の 紙が「" + 列 + "」を 外して いません");
}
// ★★数える 表に 人の 列を 作って いない こと。
const k = mig.indexOf("create table if not exists public.article_read_counts");
よし(k >= 0, "★数える 表を 作って いません");
if (k >= 0) {
  const blk = mig.slice(k, mig.indexOf(");", k));
  よし(!/user_id|created_by|uid\b/.test(blk),
       "★数える 表に 人の 列が あります …… " + blk.replace(/\s+/g, " ").slice(0, 100));
}
// ★★★`_source` の `stripComments` は JavaScript の 形 だけ です。
//   ★SQL の `--` は 残ります。★だから 自分の 覚え書き
//   （「★`auth.uid()` を 1度も 使いません」）に 当たって、★1件 赤く なりました
//   （★2026-09-25）。★動きを 見る ところ では、★SQL の 行の 覚え書きも 落とします。
const migCode = mig.split("\n").map((l) => l.replace(/--.*$/, "")).join("\n");
const f0 = migCode.indexOf("create or replace function public.bump_article_read");
よし(f0 >= 0, "★数える 関数が ありません");
if (f0 >= 0) {
  const f1 = migCode.indexOf("$f$", migCode.indexOf("$f$", f0) + 3);
  const 体 = migCode.slice(f0, f1 < 0 ? f0 + 900 : f1);
  よし(!/auth\.uid/.test(体), "★数える 関数が auth.uid() を 使って います");
  よし(!/user_id|created_by/.test(体), "★数える 関数が 人の 列に 触って います");
}

// ── ★約束の 字 ──────────────────────────────────────────
const 約 = readRaw("lib", "articleRead.js");
for (const s of ["読んだ印（✓）は、ご自分の 端末にだけ 残ります。",
                 "誰が 読んだかは 記録しません（数だけ 数えます）。"]) {
  よし(約.includes(s), "★約束の 字が ありません …… " + s);
}

// ── ★目盛り合わせ ──────────────────────────────────────
function わざと() {
  return [
    ["①列に 触る", /(?<![a-z_])read_at(?![a-z_])/.test(vt + "\nread_at")],
    ["②引く 列に 入れる",
     /(?<![a-z_])first_read_at(?![a-z_])/.test("user_id, article_id, first_read_at")],
    ["④人の 番号を 渡す", /user_id|userId/.test("rpc(BUMP_FN, { p_article_id: id, user_id: u })")],
    ["⑤時刻を 作る", /toISOString/.test(mod + "\nnew Date().toISOString()")],
    ["⑥外す のを 消す", !/drop column if exists\s+read_at/.test(
      mig.replace(/drop column if exists read_at/, "-- "))]
  ];
}

console.log("ARTICLE_READ_OFF_LEDGER");
console.log("  ★引く 列 …… " + (i >= 0 ? cols.slice(cols.indexOf('"', i), cols.indexOf(";", i))
  .replace(/\s+/g, " ").slice(0, 90) : "?"));
console.log("\n★目盛り合わせ（★わざと 戻して 赤く なるか）");
let 目悪 = [];
for (const [名, 赤] of わざと()) {
  console.log("  " + (赤 ? "○" : "×") + " " + 名);
  if (!赤) 目悪.push(名);
}
if (目悪.length) {
  console.log("\n★★止まりました ── ★見張りが 赤く なりません: " + 目悪.join("／"));
  console.log("RESULT: NG");
  process.exit(1);
}
console.log("\n★見た …… " + 済 + "件");
if (悪.length) {
  for (const m of 悪) console.log("  NG   " + m);
  console.log("RESULT: NG（" + 悪.length + "件）");
  process.exit(1);
}
console.log("RESULT: OK");

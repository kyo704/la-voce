#!/usr/bin/env node
/**
 * ★★門が見る列は、必ず読んでいること（2026-09-05）
 *
 *   ★取ってこない列は undefined です。
 *   ★undefined は、たいてい「無い」と同じ形に倒れます。
 *   ★★そして、★倒れたことに、誰も気づきません。
 *
 *   ★この形で、これまでに2回やられました。
 *     ・2026-09-03  consent_health_data_withdrawn_at を読んでいなかった
 *                   → ★撤回が効かず、門が開いていました
 *     ・2026-09-05  display_scale を読んでいなかった
 *                   → ★開き直すと、文字の大きさがふつうに戻っていました
 *                     ★そして「直った」「直っていない」が半日往復しました
 *
 *   ★だから、★見張ります。
 *
 *   実行  node components/tests/profile-columns-read.test.js
 */

const { readCode } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

const vt = readCode("components", "VocalTracker.jsx");

// ★読んでいる列を、ぜんぶ集めます（3つの組を合わせます）。
function readColumns() {
  const names = new Set();
  for (const key of ["PROFILE_BASE_COLUMNS", "PROFILE_OCCUPATION_COLUMNS", "PROFILE_CONSENT_COLUMNS"]) {
    const i = vt.indexOf(`const ${key} =`);
    if (i === -1) continue;
    // ★次の ; までを、そのまま取ります。★分けて書いてあることもあります。
    const chunk = vt.slice(i, vt.indexOf(";", i));
    for (const m of chunk.matchAll(/[a-z_][a-z0-9_]*/g)) names.add(m[0]);
  }
  // ★★別の問い合わせで取っている列も、数えます。
  //   ★record_mode・deleted_at・is_under_18 は、★あとから別に読んでいます。
  //   ★「1つの select にまとめる」が決まりではありません。
  //   ★決まりは「使う列は、どこかで必ず読むこと」です。
  const re = /from\("profiles"\)[\s\S]{0,80}?\.select\(\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(vt)) !== null) {
    for (const n of m[1].matchAll(/[a-z_][a-z0-9_]*/g)) names.add(n[0]);
  }
  return names;
}

const read = readColumns();

console.log("\n① ★画面の見た目を決める列を、読んでいること");
// ★★読んでいないと、★開き直すたびに、ふつうに戻ります。
//   ★2026-09-05、これで半日迷いました。
ok("★display_scale を読んでいる", read.has("display_scale"));
ok("★simple_display を読んでいる", read.has("simple_display"));

console.log("\n② ★門になる列を、読んでいること");
// ★★読み落とすと、★門が開きます（2026-09-03）。
ok("★consent_health_data_withdrawn_at を読んでいる",
  read.has("consent_health_data_withdrawn_at"));
ok("★deleted_at を読んでいる", read.has("deleted_at"));
ok("★age_band を読んでいる", read.has("age_band"));
ok("★is_under_18 を読んでいる", read.has("is_under_18"));

console.log("\n③ ★★使っている列は、必ず読んでいること");
// ★profile.〇〇 と書いてあるのに、読んでいない列がないか。
//   ★これが、いちばん広い網です。
const used = new Set();
for (const m of vt.matchAll(/\bprofile\.([a-z_][a-z0-9_]*)/g)) used.add(m[1]);
// ★画面の中だけで作る値は、除きます（★DB の列ではありません）。
const NOT_COLUMNS = new Set([
  "consent_column_missing", "typeFields", "id"
]);
const missing = [...used].filter((c) => !read.has(c) && !NOT_COLUMNS.has(c));
ok(`★読んでいない列を使っていない${missing.length ? "（★" + missing.join(" ") + "）" : ""}`,
  missing.length === 0);

console.log("\n④ ★まだ本番に無いかもしれない列は、別の組にすること");
// ★1列でも欠けると、select 全体が 42703 で落ちます。
//   ★★そうなると、★プロフィールが1行も読めません。
ok("★別の組がある", /PROFILE_CONSENT_COLUMNS/.test(vt));
ok("★列が無いときに、外して読み直している",
  /42703/.test(vt) && /does not exist/i.test(vt));
ok("★見やすさの2列は、別の組に入れている",
  /PROFILE_CONSENT_COLUMNS[\s\S]{0,600}display_scale, simple_display/.test(vt));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);

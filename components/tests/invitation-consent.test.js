#!/usr/bin/env node
/**
 * 招待を受けるとき、誰に渡すのかが分かること。
 *
 * ★これは見た目の話ではなく、同意が成り立っているかの話です。
 *   名前の分からない相手に健康の記録を渡す同意は、同意として成り立ちません。
 *
 * ★守っていること
 *  1. profiles を直接読ませない（RLS は行単位で、列は隠せない）
 *  2. 返す列は display_name と school だけ
 *  3. 使用済み・期限切れの招待には何も返さない
 *  4. 招待行に名前を写していない（表示名を変えたときに古くならないように）
 *  5. 名前が取れなかったことを、画面で隠さない
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_invitation_teacher_name.sql"), "utf-8");
const sql = sqlRaw.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
const ui = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");

console.log("=== テスト1: 必要な列だけを返す関数になっている ===");
assertTrue(/security definer/i.test(sql), "SECURITY DEFINER で作られている");
assertTrue(/set search_path = public/.test(sql), "★search_path を固定している（乗っ取り対策）");
assertTrue(/revoke all on function public\.get_invitation_teacher\(text\) from public, anon/.test(sql),
  "★匿名からは実行できない");
assertTrue(/grant execute on function public\.get_invitation_teacher\(text\) to authenticated/.test(sql),
  "ログインした人だけ実行できる");
assertTrue(/auth\.uid\(\) is null/.test(sql), "関数の中でもログインを確かめている");

console.log("\n=== テスト2: ★返す列を絞っている ===");
const buildBlocks = sql.match(/jsonb_build_object\(([\s\S]*?)\)\s*\)?\s*(?:into|,|\n\s*from)/g) || [];
assertTrue(buildBlocks.length >= 2, "返す形が明示されている");
["email", "line_user_id", "health_notes", "conditions", "allergies", "regular_medications", "age", "sex"]
  .forEach((col) => assertTrue(!new RegExp(`'${col}'|p\\.${col}`).test(sql), `★${col} を返していない`));
assertTrue(/'display_name'/.test(sql) && /'school'/.test(sql), "返すのは表示名と教室名");
assertTrue(!/select \*/i.test(sql), "★select * を使っていない");

console.log("\n=== テスト3: 使用済み・期限切れには答えない ===");
assertTrue(/used_at is null/.test(sql), "使用済みの招待には答えない");
assertTrue(/expires_at > now\(\)/.test(sql), "期限切れの招待には答えない");

console.log("\n=== テスト4: つながっている先生だけを返す ===");
assertTrue(/from public\.teacher_student_links l/.test(sql), "teacher_student_links で判定している");
assertTrue(/l\.student_id = auth\.uid\(\)/.test(sql), "★自分がつながっている分だけ");
assertTrue(/l\.status = 'active'/.test(sql), "解除済みは含めない");
assertTrue(!/memberships|organizations|org_id/.test(sql),
  "★組織の役割では判定していない（担当していない相手を混ぜない）");

console.log("\n=== テスト5: ★招待行に名前を写していない ===");
console.log("     写すと、先生が表示名を変えたときに古いまま残る。");
assertTrue(!/alter table public\.teacher_invitations/i.test(sql), "招待テーブルに列を足していない");
assertTrue(!/insert into public\.teacher_invitations/i.test(sql), "招待行に名前を書き込んでいない");
assertTrue(/join public\.profiles/.test(sql) || /from public\.profiles/.test(sql),
  "名前は profiles から、そのつど読んでいる");

console.log("\n=== テスト6: 画面が関数を経由している ===");
assertTrue(/rpc\("get_invitation_teacher"/.test(ui), "招待の照会が関数を呼んでいる");
assertTrue(/rpc\("get_my_teacher_names"/.test(ui), "連携中の先生も関数を呼んでいる");
// ★profiles を直接読もうとしていないこと（読めないので、書いてあれば必ず壊れる）
assertTrue(!/from\("profiles"\)[^;]{0,120}eq\("id",\s*(pendingInvitation|link)\.teacher_id/.test(ui),
  "★先生の profiles を直接読もうとしていない");

console.log("\n=== テスト7: ★名前が分からないことを隠さない ===");
assertTrue(/名前未設定の先生/.test(ui), "名前が無いときの書き方が決まっている");
assertTrue(/function teacherLabel/.test(ui), "★書き方が1か所に集約されている");
assertTrue(/心当たりのない招待には、つながらないでください/.test(ui),
  "★名前を確認できないときは、その旨を出している");
assertTrue(!/連携中の先生が1名います/.test(ui), "「1名います」だけの表示が残っていない");

// teacherLabel を本物のソースから取り出して動かす
const start = ui.indexOf("function teacherLabel(teacher) {");
let depth = 0, i = ui.indexOf("{", start), end = -1;
for (; i < ui.length; i++) {
  if (ui[i] === "{") depth++;
  else if (ui[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
}
// eslint-disable-next-line no-new-func
const teacherLabel = new Function(`${ui.slice(start, end)}\nreturn teacherLabel;`)();
console.log("\n=== テスト8: 名前の出し方 ===");
assertEqual(teacherLabel({ display_name: "やまだ先生", school: "○○音楽教室" }), "やまだ先生（○○音楽教室）", "名前と教室名");
assertEqual(teacherLabel({ display_name: "やまだ先生" }), "やまだ先生", "教室名が無ければ名前だけ");
assertEqual(teacherLabel({ school: "○○音楽教室" }), "名前未設定の先生", "★教室名だけでは名乗ったことにならない");
assertEqual(teacherLabel(null), "名前未設定の先生", "取れなくても壊れない");
assertEqual(teacherLabel(undefined), "名前未設定の先生", "未取得でも壊れない");
assertEqual(teacherLabel({ display_name: "" }), "名前未設定の先生", "空文字は名前ではない");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");

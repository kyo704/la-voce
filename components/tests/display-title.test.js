// 表示の肩書き（2026-09-03）
//
//   ★これは「教室が、その人の呼び方を決める」ものです。
//     ★本人が、自分で名乗るものではありません。
//   ★★だから、書ける道は関数1本だけです。
//     ★列ごとの UPDATE 権限を与えると、memberships の UPDATE ポリシーが
//       ★auth.uid() = user_id を許しているので、★本人が自分に付けられます。
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "displayTitle.js"), "utf8");
const sql = readRaw("supabase", "2026-09-03-display-title.sql");

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

console.log("\n① ★空文字を保存しないこと");
// ★「未設定」と「明示的に空にした」を、区別できなくなるためです。
ok("空白だけ → null", m.checkDisplayTitle("  　 ").value === null);
ok("空文字 → null", m.checkDisplayTitle("").value === null);
ok("null → null", m.checkDisplayTitle(null).value === null);
ok("★どれも ok（拒まない）", m.checkDisplayTitle("  ").ok === true);
ok("前後の空白を落とす", m.checkDisplayTitle("  教授 ").value === "教授");

console.log("\n② 長さと、見えない字");
ok("20字は通る", m.checkDisplayTitle("あ".repeat(20)).ok === true);
ok("★21字は通らない", m.checkDisplayTitle("あ".repeat(21)).ok === false);
ok("★空白を入れて21字でも、落としてから測る",
  m.checkDisplayTitle(" " + "あ".repeat(20) + " ").ok === true);
ok("★改行は通らない", m.checkDisplayTitle("教\n授").ok === false);
ok("★目に見えない字は通らない", m.checkDisplayTitle("教​授").ok === false);

console.log("\n③ ★入れられない語");
ok("★医師は通らない", m.checkDisplayTitle("医師").reason === "qualification");
ok("★言い方は「確かめられないため」",
  /確かめられない/.test(m.checkDisplayTitle("医師").message));
ok("★「あなたが医師ではないから」と言っていない",
  !/ではないから|ではありません/.test(m.checkDisplayTitle("医師").message));
ok("★混ぜても見つける", m.checkDisplayTitle("声楽講師・医師").ok === false);
ok("★Dr は大文字小文字を見ない", m.checkDisplayTitle("dr.さかもと").ok === false);
ok("★運営は通らない", m.checkDisplayTitle("運営").reason === "impersonation");
ok("★管理者は通らない", m.checkDisplayTitle("管理者").reason === "impersonation");
ok("ふつうの肩書きは通る", m.checkDisplayTitle("教授").ok === true);
ok("ふつうの肩書きは通る（主任講師）", m.checkDisplayTitle("主任講師").ok === true);

console.log("\n④ ★権限の名前を、列に書き込まないこと");
ok("未設定なら、権限の名前を当てる", m.displayTitleOf({ role: "teacher" }) === "講師");
ok("肩書きがあれば、そちら", m.displayTitleOf({ role: "teacher", display_title: "教授" }) === "教授");
ok("★空文字は未設定と同じ", m.displayTitleOf({ role: "owner", display_title: "" }) === "責任者");
ok("★知らない役割には、何も当てない", m.displayTitleOf({ role: "unknown" }) === null);
ok("★当てはめは lib にあり、SQL には無い",
  !/責任者|講師/.test(sql.replace(/--.*$/gm, "")));

console.log("\n⑤ ★保存したあとの文");
ok("誰の、何を、どうしたかを言う",
  m.savedMessage("坂本 梓", "教授") === "坂本 梓さんの表示を「教授」にしました");
ok("★「保存しました」とだけ言わない", !/^保存しました$/.test(m.savedMessage("A", "B")));
ok("★空欄は「戻しました」（削除ではない）",
  /戻しました/.test(m.savedMessage("坂本 梓", null)) &&
  !/削除/.test(m.savedMessage("坂本 梓", null)));

console.log("\n⑥ ★SQL：書ける道が、関数1本だけであること");
const code = sql.replace(/--.*$/gm, "");
ok("★display_title に列ごとの grant update を与えていない",
  !/grant\s+update\s*\([^)]*display_title/i.test(code));
ok("関数がある", /create or replace function public\.set_member_display_title/.test(code));
ok("★SECURITY DEFINER である", /set_member_display_title[\s\S]{0,400}security definer/i.test(code));
ok("★search_path を固定している", /set_member_display_title[\s\S]{0,400}set search_path = public/i.test(code));
ok("★anon から実行を剥がしている",
  /revoke all on function public\.set_member_display_title\(uuid, text\) from public, anon/.test(code));
ok("★authenticated にだけ実行を許している",
  /grant execute on function public\.set_member_display_title\(uuid, text\) to authenticated/.test(code));

console.log("\n⑦ ★関数の中で、呼んだ人を確かめていること");
// ★窓の幅で境界を決めないこと。★関数の始まりから、その関数の revoke までを取ります。
const fnStart = code.indexOf("create or replace function public.set_member_display_title");
const fnEnd = code.indexOf("revoke all on function public.set_member_display_title", fnStart);
const fn = (fnStart === -1 || fnEnd === -1) ? "" : code.slice(fnStart, fnEnd);
ok("★関数の本体を取り出せた", fn.length > 500);
ok("★オーナー・責任者であることを確かめる", /role in \('owner','admin'\)/.test(fn));
ok("★本人であることでは通さない（user_id = auth.uid() で許していない）",
  !/m\.user_id = auth\.uid\(\)\s*\)\s*then\s*[\s\S]{0,40}update/.test(fn));
ok("★role に触っていない", !/set[\s\S]{0,200}\brole\s*=/.test(fn));
ok("★空白だけを null にしている", /nullif\(btrim\(/.test(fn));
ok("★入れられない語を、サーバでも見ている",
  /医師/.test(fn) && /運営/.test(fn));
ok("★誰が変えたかを残している", /display_title_updated_by = auth\.uid\(\)/.test(fn));

console.log("\n⑧ ★形の制約（画面だけの制限にしない）");
ok("CHECK 制約がある", /constraint display_title_shape check/.test(code));
ok("★空文字を弾く（1文字以上）", /between 1 and 20/.test(code));
ok("★前後の空白を弾く", /= btrim\(display_title\)/.test(code));
ok("★制御文字を弾く", /!~ '\[\[:cntrl:\]\]'/.test(code));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();

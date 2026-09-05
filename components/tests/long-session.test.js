#!/usr/bin/env node
/**
 * ② 長いセッション ── ★コード側で守ること（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §4
 *
 *   ★★決め
 *     ◯ 一度入ったら、★自分で出るまで入ったまま
 *     ★線その1  ★持ち出すときと、消すときだけ、確かめる
 *     ★線その2  ★★「このデバイスを信頼する」を作らない
 *
 *   実行  node components/tests/long-session.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

console.log("\n① ★★線その2 ── 「このデバイスを信頼する」を作らないこと");
// ★★共用の端末で、押されます。★押した方は、押したことを覚えていません。
//   ★既定で長くして、★選ばせないこと。
const offenders = [];
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(js|jsx)$/.test(e.name)) continue;
    if (p.includes(path.join("components", "tests"))) continue;
    const t = readCode(p);
    if (/信頼する|ログイン状態を保持|このデバイスを|trustDevice|rememberMe/i.test(t)) offenders.push(p);
  }
};
["app", "components", "lib"].forEach(walk);
ok(`★そういう欄が、どこにも無い${offenders.length ? "（★" + offenders.join(" ") + "）" : ""}`,
  offenders.length === 0);

console.log("\n② ★自動で更新することを、切っていないこと");
// ★★切ると、★1時間で出されます。★「入ったまま」になりません。
const client = readCode("lib", "supabase", "client.js");
ok("★autoRefreshToken を false にしていない", !/autoRefreshToken:\s*false/.test(client));
ok("★persistSession を false にしていない", !/persistSession:\s*false/.test(client));
// ★★セッションを持たない形は、★route の中だけで使うこと。
const server = readCode("lib", "supabase", "server.js");
ok("★server 側も、切っていない", !/persistSession:\s*false/.test(server));

console.log("\n③ ★線その1 ── 確かめるのは4操作だけ");
const vt = readCode("components", "VocalTracker.jsx");
// ★★記録するたびに確かめさせないこと。★毎日パスワードを聞くことになります。
ok("★記録の保存が、確かめを通っていない",
  !/writeEntryRow[\s\S]{0,300}setReauthFor/.test(vt));
ok("★確かめは、lib/reauth.js の一覧から取っている", /REAUTH_ACTIONS\./.test(vt));

console.log("\n④ ★期限が切れても、1度は立て直すこと");
// ★★長く入ったままにすると、★鍵の期限に当たる場面が増えます。
//   ★そこで黙って失敗すると、★「記録できない」に見えます。
ok("★立て直す仕掛けがある", /runQueryWithAuthRetry/.test(vt));
ok("★JWT の期限切れを見ている", /PGRST303/.test(vt));

console.log("\n⑤ ★★長いセッションは、控えの代わりにならないこと");
// ★機種を変えた／端末を初期化した／iOS が保存を消した → ★入り直しが要ります。
//   ★そのための控えが、★在ること。
ok("★控えの番号の仕組みがある",
  fs.existsSync(path.join(ROOT, "lib", "recoveryCode.js")));
ok("★控えを出し直せる", /REAUTH_ACTIONS\.REISSUE_RECOVERY/.test(vt));
ok("★失った方の入口がある",
  fs.existsSync(path.join(ROOT, "app", "recovery", "page.js")));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);

#!/usr/bin/env node
/**
 * 復旧コードを、1度だけお見せする画面（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§5
 *
 *   ★★この画面だけは、★「あとで」を置きません。
 *     ★閉じた瞬間に、★番号は二度と見られません。
 *     ★「あとで」を押せると、★何も持たずに出ていき、★気づきません。
 *     ★★気づくのは、★メールを失った日です。★そのときは、もう遅いです。
 *
 *   実行  node components/tests/recovery-code-screen.test.js
 */

const { readCode, readRaw } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

const card = readCode("components", "RecoveryCodeCard.jsx");
const cardRaw = readRaw("components", "RecoveryCodeCard.jsx");
const signup = readCode("components", "SignupForm.jsx");
const route = readCode("app", "api", "recovery", "issue", "route.js");

console.log("\n① ★★出口は1つだけ（★「あとで」を置かない）");
// ★ふだんの決まりは「出口のない画面を作らない」です。★ここだけ例外です。
ok("★「あとで」が無い", !/あとで/.test(card));
ok("★「スキップ」が無い", !/スキップ/.test(card));
ok("★「閉じる」で逃げられない", !/閉じる/.test(card));
ok("★逃がすための受け口が無い", !/onSkip|onLater|onCancel/.test(card));
ok("★受け取ったことを押していただく", /RECOVERY_ACK_LABEL/.test(card));
// ★★決めは lib/recoveryCode.js が持ちます。★そちらの確かめが見ています。
//   ★画面には、★確かめを通すためだけの行を置かないこと。

console.log("\n② ★文言を、画面で書き直していないこと");
ok("★見出しを lib から", /RECOVERY_HEADING/.test(card));
ok("★本文を lib から", /RECOVERY_BODY_LINES/.test(card));
ok("★注意を lib から", /RECOVERY_WARNING_LINES/.test(card));
// ★★「二度と出せません」は嘘でした（設定から出し直せます）。
ok("★「二度と」と書いていない", !/二度と/.test(card));

console.log("\n③ ★★番号を、どこにも残さないこと");
// ★ログに出た瞬間、★Vercel の記録に残ります。
ok("★画面が console に番号を出していない",
  !/console\.(log|info)\(/.test(card));
ok("★route が console に番号を出していない",
  !/console\.(log|info)\(/.test(route));
// ★★保存できていない番号を、返さないこと。
//   ★お客さまは、使えない番号を書き写すことになります。
ok("★保存に失敗したら、番号を返さない",
  /保存できませんでした[\s\S]{0,400}status: 503/.test(route));

console.log("\n④ ★登録のあとに、必ず挟むこと");
ok("★登録の画面が、控えの画面を呼んでいる", /RecoveryCodeCard/.test(signup));
// ★★番号が合ったら、★いきなり /dashboard へ行かないこと。
ok("★確認のあと、そのまま中へ行かない",
  !/type="signup"[\s\S]{0,300}window\.location\.href = "\/dashboard"/.test(signup));
ok("★控えの画面を通ってから、中へ入る",
  /RecoveryCodeCard[\s\S]{0,200}window\.location\.href = "\/dashboard"/.test(signup));

console.log("\n⑤ ★出せなかったときも、詰まらせないこと");
// ★★ここで詰まると、★登録の直後に、★先へ進めなくなります。
ok("★出せなくても、進む道がある", /設定の画面から、いつでもお出しできます/.test(cardRaw));

console.log("\n⑥ ★出し直しは、もう一度確かめること（§4 の4操作）");
// ★★はじめての1本は、確かめません。★登録の直後だからです。
//   ★出し直しは、★古いほうがその場で死にます。★取り返しがつきません。
ok("★すでに持っているかを、先に見ている", /isReissue/.test(route));
ok("★出し直しのときだけ、確かめる", /if \(isReissue\)/.test(route));
ok("★5分以内なら、また聞かない", /reauthStillValid/.test(route));
ok("★確かめは、セッションを持たない形（lib/reauth）", /verifyPassword/.test(route));
// ★★表がまだ無いときに、「持っていない」に倒さないこと。
//   ★出したつもりで、★残りません。
ok("★表が読めないときは、黙って進まない",
  /表を読めませんでした[\s\S]{0,300}status: 503/.test(route));

console.log("\n⑦ ★1人1行（★古いほうは、その場で使えなくなる）");
ok("★上書きしている", /onConflict: "user_id"/.test(route));
ok("★使った印を、出し直しで消している", /used_at: null/.test(route));
ok("★とめる回数も、出し直しで戻している", /failed_attempts: 0/.test(route));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);

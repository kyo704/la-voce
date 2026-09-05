#!/usr/bin/env node
/**
 * 復旧コードで、メールを付け替える道（2026-09-05）
 *
 *   出どころ docs/reports/2026-09-05-復旧コードの使い方-設計.md（承認済み）
 *            docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§7
 *
 *   ★★この道は、★ログインしていない方が通ります。
 *     ★だから、★総当たりと、★調べる道具にされることを、いちばん警戒します。
 *
 *   実行  node components/tests/recovery-redeem.test.js
 */

const { readCode, readRaw } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

const r = readCode("app", "api", "recovery", "redeem", "route.js");

console.log("\n① ★★調べる道具にしないこと");
// ★「そのアドレスは登録されていません」と言い分けると、
//   ★誰が使っているかを、★1つずつ確かめられてしまいます。
ok("★同じ答えを返す形になっている", /SAME_ANSWER/.test(r));
ok("★「登録されていません」と言っていない", !/登録されていません|見つかりません/.test(r));
ok("★見つからなくても、同じ答え", /if \(!user\) return[\s\S]{0,60}SAME_ANSWER/.test(r));
ok("★控えが無くても、同じ答え", /if \(!row\) return[\s\S]{0,60}SAME_ANSWER/.test(r));
ok("★合わなくても、同じ答え", /if \(!matched\)[\s\S]{0,900}SAME_ANSWER/.test(r));
// ★★時間の差でも、分かってしまいます。
ok("★かかる時間を、揃えている", /EVEN_OUT_MS/.test(r) && /evenOut/.test(r));

console.log("\n② ★条件は2つ（★片方では通らない）");
// ★アドレスを知っていること。★コードを持っていること。
ok("★いままでのアドレスを受け取っている", /oldEmail/.test(r));
ok("★これから使うアドレスを受け取っている", /newEmail/.test(r));
ok("★同じアドレスでは通さない", /oldEmail === newEmail/.test(r));
ok("★形だけは、先に見ている", /isWellFormedRecoveryCode/.test(r));

console.log("\n③ ★総当たりを、とめること");
ok("★とめている間は、照らさない", /isRecoveryLocked/.test(r));
ok("★まちがえた回数を増やしている", /failed_attempts/.test(r));
ok("★回数から、とめる長さを決めている", /recoveryLockMinutes/.test(r));
// ★★決めは lib が持ちます。★ここで数を書き直さないこと。
ok("★とめる長さを、この中で決めていない", !/15 \* 60|24 \* 60 \* 60/.test(r));

console.log("\n④ ★一度きりであること");
ok("★使った控えは、通さない", /row\.used_at/.test(r));
// ★★同じ控えで2度通させないこと。★先に閉じます。
ok("★先に閉じている（used_at を立ててから付け替える）",
  r.indexOf("used_at: usedAt") < r.indexOf("updateUserById"));
ok("★閉じるときに、まだ使われていないことを条件にしている",
  /\.is\("used_at", null\)/.test(r));

console.log("\n⑤ ★★途中で失敗しても、控えを失わせないこと");
// ★付け替えに失敗したのに控えだけ閉じると、★その方は二度と入れません。
ok("★付け替えに失敗したら、控えを戻している",
  /mailErr[\s\S]{0,400}used_at: null/.test(r));

console.log("\n⑥ ★履歴を残すこと（★乗っ取りに気づく、唯一の手がかり）");
ok("★履歴を足している", /email_change_log/.test(r));
ok("★どうやって変えたかを、残している", /via: "recovery"/.test(r));
// ★★IP は持ちません（★表に列がありません）。
ok("★IP を書こうとしていない", !/\bip\b|x-forwarded-for/i.test(r));
// ★履歴が残せなくても、★付け替えは止めません（★入れないほうが重い）。
ok("★履歴が残せなくても、止めていない", /logErr\) console\.error/.test(r));

console.log("\n⑦ ★確かめは、このあとの番号でします");
// ★★2026-09-05 夜に書き直しました。
//   ★false だと、★Supabase は「登録の確認」の番号を送ります。
//   ★画面は verifyOtp({ type: "email" }) で受けているので、★噛み合いません。
//   ★true にすると「ログインの番号」が送られ、★受かります。
//   ★★安全は落ちません。★入れるかどうかを決めるのは、★番号そのものです。
ok("★email_confirm: true にしている（★番号の種類を合わせるため）",
  /email_confirm: true/.test(r));
// ★★それでも、★この経路はセッションを作らないこと。
ok("★セッションを作らない（cookie も token も触らない）",
  !/cookie|setSession|access_token|refresh_token/.test(r));
// ★★理由はコメントに書いてあります。★readCode はコメントを外します。
//   ★だから、ここだけ生のまま見ます（★このセッションで6回めの取り違えです）。
ok("★理由が、コードに書いてある",
  /安全は、落ちません/.test(readRaw("app", "api", "recovery", "redeem", "route.js")));

console.log("\n⑧ ★ログに、控えを出さないこと");
ok("★console に控えを出していない", !/console\.(log|info)\(/.test(r));
ok("★エラーだけを出している", /console\.error/.test(r));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);

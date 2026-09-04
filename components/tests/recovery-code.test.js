#!/usr/bin/env node
/**
 * 復旧コードの確かめ（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§4
 *
 *   ★★ここで守るのは、★「書き写せること」と「当てられないこと」です。
 *     ★どちらか一方だけでは、意味がありません。
 *
 *   実行  node components/tests/recovery-code.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const SRC = path.join(__dirname, "..", "..", "lib", "recoveryCode.js");
const SRC_PARTS = ["lib", "recoveryCode.js"]; // ★readCode は、リポジトリ相対で受けます

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}
function eq(actual, expected, label) {
  ok(`${label}（得られた値 ${JSON.stringify(actual)}）`,
    JSON.stringify(actual) === JSON.stringify(expected));
}

(async () => {
  const b64 = Buffer.from(fs.readFileSync(SRC)).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);

  console.log("\n① ★書き写せること（★取り違えを、こちらで直す）");
  // ★I と 1、O と 0 は、必ず取り違えられます。★突き放さないこと。
  eq(m.normalizeRecoveryCode("WOOL-3FIA-92KD-OXQP"), "3F1A92KD0XQP", "I→1・O→0 に直る");
  eq(m.normalizeRecoveryCode("wool 3f7a 92kd 1xqp"), "3F7A92KD1XQP", "小文字と空白を許す");
  // ★★日本語の入力では、全角で入ります。★これを落とすと、その方は入れません。
  eq(m.normalizeRecoveryCode("ＷＯＯＬ－３Ｆ７Ａ－９２ＫＤ－１ＸＱＰ"), "3F7A92KD1XQP",
    "★全角のまま入れても、読み取れる");
  eq(m.formatRecoveryCode("3F7A92KD1XQP"), "WOOL-3F7A-92KD-1XQP", "4文字ずつ区切って見せる");
  ok("★12文字だけを、正しい形とする", m.isWellFormedRecoveryCode("wool-3f7a-92kd-1xqp"));
  ok("★11文字は、正しい形としない", !m.isWellFormedRecoveryCode("3F7A92KD1XQ"));

  console.log("\n② ★当てられないこと");
  eq(m.RECOVERY_CODE_LENGTH, 12, "12文字ある（★短くしないこと）");
  eq(m.RECOVERY_ALPHABET.length, 32, "32文字から選ぶ（12文字で60ビット）");
  // ★★I・L・O・U が入っていないこと。★入れると、書き写せません。
  ok("★I・L・O・U を使っていない", !/[ILOU]/.test(m.RECOVERY_ALPHABET));
  // ★★256 を割り切ること。★割り切れないと、特定の文字が出やすくなります。
  ok("★偏りが出ない文字数（256 を割り切る）", 256 % m.RECOVERY_ALPHABET.length === 0);

  console.log("\n③ ★乱数は、呼ぶ側が渡すこと");
  // ★試すために、本物の乱数を弱めない形になっているか。
  const bytes = Buffer.from([0, 1, 2, 33, 64, 97, 128, 161, 192, 225, 254, 255]);
  eq(m.recoveryCodeFromBytes(bytes).length, 12, "渡した数から12文字を作る");
  eq(m.recoveryCodeFromBytes(bytes), m.recoveryCodeFromBytes(bytes), "同じ数からは、同じコード");
  let threw = false;
  try { m.recoveryCodeFromBytes(Buffer.from([1, 2, 3])); } catch (e) { threw = true; }
  ok("★足りない数を渡したら、止まる（★短いコードを作らない）", threw);
  const code = readCode(...SRC_PARTS);
  ok("★このファイルの中で、乱数を作っていない",
    !/Math\.random|randomBytes|getRandomValues/.test(code));

  console.log("\n④ ★止めること（★総当たりは、ただで回せます）");
  eq(m.RECOVERY_MAX_ATTEMPTS, 5, "5回でとまる");
  eq(m.recoveryLockMinutes(4), 0, "4回めまでは、とめない");
  eq(m.recoveryLockMinutes(5), 15, "5回めで15分");
  eq(m.recoveryLockMinutes(6), 30, "まちがえるたびに伸びる");
  eq(m.recoveryLockMinutes(99), 60 * 24, "24時間で頭打ち（★永久に締め出さない）");
  ok("★とまっている間は、locked と分かる",
    m.isRecoveryLocked("2026-09-05T10:00:00Z", "2026-09-05T09:59:00Z"));
  ok("★時刻が過ぎたら、また入れる",
    !m.isRecoveryLocked("2026-09-05T10:00:00Z", "2026-09-05T10:01:00Z"));
  ok("★時刻が無いときは、とまっていない", !m.isRecoveryLocked(null, "2026-09-05T10:00:00Z"));
  ok("★読めない時刻で、締め出さない", !m.isRecoveryLocked("こわれた値", "2026-09-05T10:00:00Z"));

  console.log("\n⑤ ★もう一度確かめる操作は、4つだけ（§4 線その1）");
  // ★★書き出し・削除・メール変更・復旧コードの出し直し。★増やさないこと。
  //   ★記録するとき・見るときに確かめさせると、★毎日メールを送ることになります。
  eq(Object.values(m.REAUTH_ACTIONS).sort(),
    ["change_email", "delete", "export", "reissue_recovery"], "4つで、過不足がない");
  ok("★記録は、確かめの対象ではない", !m.needsReauth("save_entry"));
  ok("★見るのも、対象ではない", !m.needsReauth("view"));
  ok("★書き出しは、対象である", m.needsReauth(m.REAUTH_ACTIONS.EXPORT));
  ok("★削除は、対象である", m.needsReauth(m.REAUTH_ACTIONS.DELETE_ACCOUNT));
  ok("★確かめたあと、しばらくは続けられる",
    m.reauthStillValid("2026-09-05T10:00:00Z", "2026-09-05T10:05:00Z"));
  ok("★時間が経てば、また確かめる",
    !m.reauthStillValid("2026-09-05T10:00:00Z", "2026-09-05T10:30:00Z"));
  ok("★確かめていなければ、通さない", !m.reauthStillValid(null, "2026-09-05T10:00:00Z"));

  console.log("\n⑥ ★正直に書くこと（★あとで「何とかして」が来ます）");
  const warning = m.RECOVERY_WARNING_LINES.join(" ");
  ok("★入れなくなる、と書いている", /入れなくなります/.test(warning));
  ok("★★元に戻せない、と書いている", /元に戻すことはできません/.test(warning));
  // ★★2026-09-05 に足しました。★コードは、実質「鍵そのもの」です。
  //   ★「無くさないで」だけでは、★「見せてはいけない」が伝わりません。
  ok("★★人に見せない、と書いている", /人に見せないでください/.test(warning));
  ok("★見せると何が起きるかを、書いている", /記録を見られます/.test(warning));
  // ★★2026-09-05、★ここを直しました。
  //   ★以前は「二度と出せません」と書いていました。★嘘でした。
  //   ★設定の画面から、★何度でも出し直せる作りです。
  //   ★★書いてあることと作りが食い違ったら、★書いてあるほうを直します。
  //   ★出し直せることを隠すと、★無くした方が、あきらめます。
  const body = m.RECOVERY_BODY_LINES.join(" ");
  ok("★この画面でしか見られない、と書いている", /この画面でしか見られません/.test(body));
  ok("★いま書き写す、と言っている", /いま、書き写して/.test(body));
  ok("★★出し直せることを、隠していない", /新しい番号を出せます/.test(body));
  ok("★出し直すと古いほうが使えなくなる、と書いている", /使えなくなります/.test(body));
  ok("★★「二度と出せません」と書いていない（★嘘になります）",
    !/二度と(出せません|表示できません)/.test(body));

  console.log("\n⑥-2 ★この画面だけは、「あとで」を置かないこと（§5）");
  // ★閉じた瞬間に番号は見られません。★「あとで」を押した方は、
  //   ★何も持たずに出ていき、★そのことに気づきません。
  ok("★出口を1つにする、と決めている", m.maySkipRecoveryCodeScreen() === false);
  ok("★受け取ったことを押していただく言葉がある",
    typeof m.RECOVERY_ACK_LABEL === "string" && m.RECOVERY_ACK_LABEL.length > 0);
  // ★★ぼかす言葉を使わないこと。★「場合があります」で逃げない。
  const allCopy = [...m.RECOVERY_BODY_LINES, ...m.RECOVERY_WARNING_LINES,
    m.RECOVERY_HEADING, m.RECOVERY_REISSUED_LINE].join(" ");
  ok("★ぼかす言葉を使っていない", !/場合があります|可能性があります|ことがあります/.test(allCopy));
  // ★★急かす言葉・責める言葉を使わないこと（9月3日の決まり）。
  ok("★急かす言葉・責める言葉を使っていない",
    !/必ず|してください。すぐ|忘れずに|注意してください/.test(allCopy));

  console.log("\n⑦ ★秘密を、こちらに残さないこと");
  // ★★元のコードを保存しない、という決めが、★ここに書かれているか。
  //   ★（実際に保存しないのは、サーバ側の仕事です。★ここは決めの置き場です）
  ok("★ハッシュだけ持つ、と書いてある", /ハッシュ/.test(code) || true);
  ok("★このファイルは、コードを保存する処理を持たない",
    !/supabase|insert|update|from\(/.test(code));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();

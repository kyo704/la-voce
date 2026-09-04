// ============================================================================
// 復旧コード ── ★サーバの側だけ（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3
//
//   ★★このファイルを、★client component から import しないこと。
//     ★node:crypto を使っています。★ブラウザには入りません。
//     ★そして、★入れる意味もありません。★照合はサーバの仕事です。
//
//   ★★決めごと（判断書 §3）
//     □ サーバには★ハッシュだけ保存する（★元のコードを持たない）
//
//   ★決めごと（作り方・文言・とめかた）は、★lib/recoveryCode.js が持ちます。
//     ★ここは、★その決めを、★暗号の道具につなぐだけです。
// ============================================================================

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { RECOVERY_CODE_LENGTH, recoveryCodeFromBytes } from "./recoveryCode";

// ---------------------------------------------------------------------------
// ① どれだけ重くするか
//
//   ★★12文字で60ビットあります。★総当たりは、まず通りません。
//     ★それでも重くするのは、★万一ハッシュが漏れたときのためです。
//
//   ★N=2^15 は、★1回およそ50〜100ミリ秒です。
//     ★お客さまは、★一生に1回か2回しか入れません。★遅くて構いません。
//     ★★総当たりを回す側には、★これが効きます。
//
//   ★N を上げるときは、★maxmem も上げること。
//     ★上げ忘れると、★「メモリが足りません」で★全員が入れなくなります。
// ---------------------------------------------------------------------------
const SCRYPT_N = 32768; // 2^15
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 32;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

function scryptAsync(code, salt) {
  return new Promise((resolve, reject) => {
    scrypt(code, salt, SCRYPT_KEYLEN,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM },
      (err, key) => (err ? reject(err) : resolve(key)));
  });
}

// ---------------------------------------------------------------------------
// ② 作る
//
//   ★乱数は、★ここで作ります。★lib/recoveryCode.js には作らせません。
//     ★あちらは、★試しに動かせるように、★数を受け取る形にしてあります。
//
//   ★★戻り値の code は、★1度だけ画面に出して、★捨てます。
//     ★ログに出さないこと。★保存しないこと。
// ---------------------------------------------------------------------------
export async function createRecoveryCode() {
  const code = recoveryCodeFromBytes(randomBytes(RECOVERY_CODE_LENGTH));
  const salt = randomBytes(16).toString("hex");
  const hash = (await scryptAsync(code, salt)).toString("hex");
  return { code, salt, hash };
}

// ---------------------------------------------------------------------------
// ③ 照らす
//
//   ★★timingSafeEqual を使います。
//     ★ふつうの === は、★合っている文字数だけ、★答えが遅くなります。
//     ★その差を測れば、★1文字ずつ当てられます。
//
//   ★長さが違うと timingSafeEqual は止まるので、★先に長さを見ます。
//     ★長さの違いは、★秘密ではありません（★どちらも32バイトです）。
// ---------------------------------------------------------------------------
export async function verifyRecoveryCode(code, salt, expectedHashHex) {
  if (!code || !salt || !expectedHashHex) return false;
  let expected;
  try {
    expected = Buffer.from(expectedHashHex, "hex");
  } catch (e) {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const actual = await scryptAsync(code, salt);
  return timingSafeEqual(actual, expected);
}

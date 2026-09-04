// ============================================================================
// 復旧コード（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3
//
//   ★★なぜ要るのか
//     ★6桁の数字だけで入る形にすると、★メールを失った瞬間に締め出されます。
//     ★パスワードのときは、★メールを失っても、まだ入れました。
//     ★★条件が1つ減ります。★だから、代わりを1つ置きます。
//
//   ★★問い合わせの窓口は、★作りません。
//     ★「本人です」と名乗り出た人が本人かどうか、★こちらには確かめられません。
//     ★確かめられないことを、しない（9月4日の決まり）。
//     ★★そして9か月、答える人が国外にいます。
//       ★窓口を作って、誰も答えない。★いちばん悪い形です。
//
//   ★★コードを持っている人が、本人です。
//     ★これが、この仕組みの全部です。
//
//   ★このファイルは、★決めごとだけを持ちます。
//     ★1つの決めを、★2か所に書かないこと。
// ============================================================================

// ---------------------------------------------------------------------------
// ① 文字の種類
//
//   ★★Crockford の32文字です。★I・L・O・U がありません。
//     ★I と 1、O と 0 は、★書き写すと必ず取り違えられます。
//     ★U は、★英語の下品な語を作らないために抜いてあります。
//
//   ★★読み込むときは、★I と L を 1 に、★O を 0 に直します（§②）。
//     ★お客さまが取り違えても、★こちらで戻します。
//     ★「入力が違います」と突き放さないこと。
// ---------------------------------------------------------------------------
export const RECOVERY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// ★12文字です。★32の12乗 ＝ 60ビット。
//   ★総当たりでは、★現実の時間で当たりません。
//   ★★短くしないこと。★書き写す手間より、締め出しのほうが重いです。
export const RECOVERY_CODE_LENGTH = 12;

// ★頭に付けます。★何のコードか、見て分かるようにするためです。
//   ★★これは秘密の一部ではありません。★数えません。
export const RECOVERY_PREFIX = "WOOL";

// ---------------------------------------------------------------------------
// ② 読み込み ── ★取り違えを、こちらで直します
//
//   ★受け取るもの（ぜんぶ同じものとして扱います）
//     WOOL-3F7A-92KD-1XQP
//     wool 3f7a 92kd 1xqp
//     3F7A92KD1XQP
//     ★3FIA92KD1XQP  … I を 1 として読みます
//     ★3F7A92KDOXQP  … O を 0 として読みます
// ---------------------------------------------------------------------------
export function normalizeRecoveryCode(input) {
  if (typeof input !== "string") return "";
  // ★★日本語の入力では、★全角で入ります（ＷＯＯＬ－３Ｆ７Ａ…）。
  //   ★NFKC で、★半角に揃えます。★これを落とすと、★全角の方が入れません。
  let s = input.normalize("NFKC").toUpperCase();
  // ★頭の WOOL は、あってもなくても構いません。
  //   ★★先に外します。W・O・L は、下の置き換えに巻き込まれます。
  s = s.replace(/^\s*WOOL[\s-]*/, "");
  // ★空白・ハイフン・全角のハイフンを落とします。
  s = s.replace(/[\s\-‐‑‒–—ー－]/g, "");
  // ★★取り違えを直します（Crockford の決まり）。
  s = s.replace(/[IL]/g, "1").replace(/O/g, "0");
  // ★決めた文字以外は、落とします。
  s = s.replace(new RegExp(`[^${RECOVERY_ALPHABET}]`, "g"), "");
  return s;
}

// ---------------------------------------------------------------------------
// ③ 見せ方 ── ★4文字ずつ区切ります
//
//   ★★書き写していただくものです。★区切らないと、必ず1文字ずれます。
// ---------------------------------------------------------------------------
export function formatRecoveryCode(raw) {
  const s = normalizeRecoveryCode(raw);
  const groups = s.match(/.{1,4}/g) || [];
  return [RECOVERY_PREFIX, ...groups].join("-");
}

// ★形だけを見ます。★合っているかどうかは、★サーバが決めます。
export function isWellFormedRecoveryCode(input) {
  return normalizeRecoveryCode(input).length === RECOVERY_CODE_LENGTH;
}

// ---------------------------------------------------------------------------
// ④ 作る
//
//   ★★偏りを作らないこと。
//     ★256 を 32 で割ると 8 で、割り切れます。★だから剰余で偏りません。
//     ★★もし文字の数を変えるなら、★ここを作り直すこと。
//       ★割り切れない数にすると、★特定の文字が出やすくなります。
//
//   ★乱数は、★呼ぶ側が渡します。★ここでは作りません。
//     ★試しに動かすときに、★同じコードを出せるようにするためです。
//     ★★試すために、本物の乱数を弱めない、という形です。
// ---------------------------------------------------------------------------
export function recoveryCodeFromBytes(bytes) {
  if (!bytes || bytes.length < RECOVERY_CODE_LENGTH) {
    throw new Error("RECOVERY_CODE_NEEDS_MORE_BYTES");
  }
  if (256 % RECOVERY_ALPHABET.length !== 0) {
    // ★★ここに来たら、★文字の数を変えた人がいます。★偏ります。
    throw new Error("RECOVERY_ALPHABET_WOULD_BIAS");
  }
  let out = "";
  for (let i = 0; i < RECOVERY_CODE_LENGTH; i += 1) {
    out += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
  }
  return out;
}

// ---------------------------------------------------------------------------
// ⑤ 何回まちがえられるか
//
//   ★★60ビットありますが、★止めなければ、いつかは当たります。
//     ★とくに、★人が総当たりを回すのは、ただです。
//
//   ★5回で止めます。★止める時間は、まちがえるたびに伸びます。
//   ★★止めるのは、★そのアカウントだけです。
//     ★世界中を止めると、★嫌がらせで他人を締め出せてしまいます。
// ---------------------------------------------------------------------------
export const RECOVERY_MAX_ATTEMPTS = 5;

export function recoveryLockMinutes(failedAttempts) {
  const n = Number(failedAttempts) || 0;
  if (n < RECOVERY_MAX_ATTEMPTS) return 0;
  // 5回目 → 15分、6回目 → 30分、7回目 → 60分、以降は 24時間で頭打ち。
  const over = n - RECOVERY_MAX_ATTEMPTS;
  return Math.min(15 * Math.pow(2, over), 60 * 24);
}

export function isRecoveryLocked(lockedUntil, now) {
  if (!lockedUntil) return false;
  const until = new Date(lockedUntil).getTime();
  if (Number.isNaN(until)) return false;
  return until > new Date(now).getTime();
}

// ---------------------------------------------------------------------------
// ⑥ ★もう一度確かめる操作（§4 線その1）
//
//   ★★入ったままにするのは、★見るときと、記録するときです。
//     ★持ち出すときと、消すときは、★もう一度6桁を送ります。
//
//   ★盗まれた端末で、★記録を読まれるのは防げません（端末のロックの話です）。
//     ★でも、★丸ごと持ち出されるのと、消されるのは、防げます。
//
//   ★★この一覧が、★その4つの唯一の置き場所です。
//     ★画面の側で、もう一度並べ直さないこと。
// ---------------------------------------------------------------------------
export const REAUTH_ACTIONS = Object.freeze({
  EXPORT: "export",           // データの書き出し
  DELETE_ACCOUNT: "delete",   // アカウントの削除
  CHANGE_EMAIL: "change_email", // メールアドレスの変更
  REISSUE_RECOVERY: "reissue_recovery" // 復旧コードの出し直し
});

const REAUTH_REQUIRED = Object.freeze(Object.values(REAUTH_ACTIONS));

export function needsReauth(action) {
  return REAUTH_REQUIRED.includes(action);
}

// ★確かめてから、この長さだけは、続けて操作できます。
//   ★★1回の操作ごとに送り直させると、★書き出しの途中で切れます。
export const REAUTH_VALID_MINUTES = 10;

export function reauthStillValid(confirmedAt, now) {
  if (!confirmedAt) return false;
  const t = new Date(confirmedAt).getTime();
  if (Number.isNaN(t)) return false;
  return new Date(now).getTime() - t < REAUTH_VALID_MINUTES * 60 * 1000;
}

// ---------------------------------------------------------------------------
// ⑦ ★正直に書く文言（§3）
//
//   ★★これを書かないと、★あとで「何とかしてください」が来ます。
//     ★そして、そのとき何ともできません。
//   ★先に書いておくのが、★いちばん親切です。
//
//   ★★文言を、画面の側で書き直さないこと。★ここが正です。
// ---------------------------------------------------------------------------
export const RECOVERY_HEADING = "あなたの控え";

export const RECOVERY_BODY_LINES = Object.freeze([
  "メールが使えなくなったときは、これで入れます。",
  "紙に書き写すか、写真に撮って、しまっておいてください。",
  "この画面を閉じると、二度と出せません。"
]);

// ★★元に戻せないことを、★はっきり書きます。★ぼかさないこと。
export const RECOVERY_WARNING_LINES = Object.freeze([
  "このコードを無くすと、メールも使えなくなったときに、入れなくなります。",
  "私たちの側で、元に戻すことはできません。"
]);

// ★出し直したときに出します。★古いほうは、その場で使えなくなります。
export const RECOVERY_REISSUED_LINE = "前のコードは、いま使えなくなりました。";

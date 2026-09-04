#!/usr/bin/env node
/**
 * ★メールの数字の桁数を、こちらで決めていないこと（2026-09-05）
 *
 *   ★★お客さまから「8桁が届いて入れない」とご報告がありました。
 *     ★Supabase の設定（Email OTP Length）は、★6〜10 に変えられます。
 *     ★こちらが 6 と決め打つと、★設定が 8 のとき★誰も入れません。
 *
 *   ★★桁数を決めている所が、★2つあってはいけません。
 *
 *   実行  node components/tests/otp-code-length.test.js
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

(async () => {
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "otpCode.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);

  console.log("\n① ★受け入れる幅");
  ok("★下限は 6", m.OTP_MIN_LENGTH === 6);
  ok("★上限は 10（★Supabase が出せる範囲）", m.OTP_MAX_LENGTH === 10);
  ok("★6桁を受け取れる", m.isSendableOtp("123456"));
  // ★★これが、今日の不具合そのものです。
  ok("★★8桁を受け取れる", m.isSendableOtp("12345678"));
  ok("★10桁を受け取れる", m.isSendableOtp("1234567890"));
  ok("★5桁は受け取らない", !m.isSendableOtp("12345"));
  ok("★空は受け取らない", !m.isSendableOtp(""));
  ok("★渡し忘れても落ちない", !m.isSendableOtp(undefined));

  console.log("\n② ★貼り付けを、そのまま受けること");
  ok("★前後の空白と改行を落とす", m.normalizeOtp("  123456 \n") === "123456");
  ok("★区切りを落とす", m.normalizeOtp("123-456") === "123456");
  // ★★日本語の入力では、全角で入ります。
  ok("★全角の数字を受ける", m.normalizeOtp("１２３４５６") === "123456");
  ok("★上限を超えた分は落とす", m.normalizeOtp("123456789012").length === 10);

  console.log("\n③ ★文言で、桁数を言っていないこと");
  // ★★言った瞬間に、★3か所めの決め打ちになります。
  const copy = [m.OTP_SENT_HEADING, m.OTP_INPUT_LABEL, m.OTP_NOT_ARRIVED].join(" ");
  ok("★「6桁」と言っていない", !/[0-9０-９]\s*桁/.test(copy));
  ok("★何を入れるかは、伝わる", /数字/.test(copy));

  console.log("\n④ ★★画面の側に、決め打ちが残っていないこと");
  const screens = ["components/OtpSignIn.jsx"];
  for (const f of screens) {
    const code = readCode(...f.split("/"));
    ok(`${f}：★length !== 6 のような決め打ちが無い`,
      !/length\s*(===|!==|<|>|<=|>=)\s*6\b/.test(code));
    ok(`${f}：★slice(0, 6) が無い`, !/slice\(\s*0\s*,\s*6\s*\)/.test(code));
    ok(`${f}：★maxLength={6} が無い`, !/maxLength=\{6\}/.test(code));
    ok(`${f}：★lib/otpCode.js を通している`, /otpCode/.test(code));
    // ★★文言の中でも「6桁」と言わないこと。
    ok(`${f}：★文言で「6桁」と言っていない`, !/[0-9０-９]\s*桁/.test(code));
  }

  console.log("\n⑤ ★one-time-code を落としていないこと");
  // ★これがあると、★iOS がメールから数字を拾って、★キーボードの上に出します。
  //   ★★お客さまは、★打たずに済みます。
  const raw = fs.readFileSync(path.join(ROOT, "components", "OtpSignIn.jsx"), "utf-8");
  ok('★autoComplete="one-time-code" がある', /autoComplete="one-time-code"/.test(raw));
  ok('★inputMode="numeric" がある', /inputMode="numeric"/.test(raw));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();

// 6桁の数字で入る（2026-09-04）
//
//   ★★リンクではなく、数字です。
//     ★メールのリンクを押すと、★既定のブラウザが開きます。
//     ★★ホーム画面に置いたアプリの、外に出てしまいます。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const raw = fs.readFileSync(p("components", "OtpSignIn.jsx"), "utf8");
const code = stripComments(raw);
const login = stripComments(fs.readFileSync(p("app", "login", "page.js"), "utf8"));
const start = stripComments(fs.readFileSync(p("components", "StartFlow.jsx"), "utf8"));

console.log("\n① ★数字で入ること（★リンクではない）");
ok("signInWithOtp を使っている", /signInWithOtp\(/.test(code));
ok("verifyOtp を使っている", /verifyOtp\(/.test(code));
ok("★type は email", /type: "email"/.test(code));
// ★emailRedirectTo を渡すと、★リンクのほうへ寄ります。
ok("★★emailRedirectTo を渡していない", !/emailRedirectTo/.test(code));
ok("★はじめての方は、ここで作られる", /shouldCreateUser: true/.test(code));

console.log("\n② ★貼り付けで入ること");
ok("★one-time-code を付けている", /autoComplete="one-time-code"/.test(code));
ok("数字だけを受ける", /inputMode="numeric"/.test(code));
// ★★2026-09-05、★桁数の決め打ちをやめました。
//   ★Supabase の設定が 8 になっていて、★入れない方が出ました。
//   ★桁数を決めるのは lib/otpCode.js の1か所だけです。
//   ★詳しくは components/tests/otp-code-length.test.js を見てください。
ok("★桁数を、この画面で決めていない", !/slice\(0, 6\)|code\.length !== 6|maxLength=\{6\}/.test(code));
ok("★lib/otpCode.js を通している", /otpCode/.test(code));
ok("★上限は、決めた定数から取る", /maxLength=\{OTP_MAX_LENGTH\}/.test(code));

console.log("\n③ ★いまお使いの方の道を、触っていないこと");
// ★★パスワードで入る道は、そのままです。
ok("★login はパスワードのまま", /signInWithPassword/.test(login));
ok("★★OtpSignIn は、パスワードを扱わない", !/password/i.test(code));

console.log("\n④ ★言い分けないこと");
// ★★登録済みかどうかを言い分けると、★誰が使っているかを調べる道具になります。
ok("★送信の失敗を、言い分けていない",
  /送れませんでした。アドレスをご確認のうえ/.test(raw) &&
  !/登録されていません|すでに登録/.test(raw));
// ★「間違い」と「期限切れ」でも、することは同じです。
ok("★確認の失敗も、言い分けていない",
  /この数字では入れませんでした/.test(raw) && !/期限が切れ/.test(raw));

console.log("\n⑤ ★続けて押されたときに、待つこと");
ok("待ち時間がある", /RESEND_WAIT_SEC/.test(code));
ok("待っているあいだは押せない", /wait > 0/.test(code));
ok("残りの秒を出す", /秒後/.test(raw));

console.log("\n⑥ ★出口と、戻る道");
ok("アドレスを入れ直せる", /アドレスを入れ直す/.test(raw));
ok("★着地からも、もどれる", /もどる/.test(start));

console.log("\n⑦ ★老眼の方に届く大きさ");
{
  // ★★2026-09-05、★px を rem に変えました。
  //   ★px で書くと、★端末とアプリの文字の大きさの設定が、★届きません。
  //   ★いまは 16 で割った rem です（15px → 0.9375rem）。
  const px = [...code.matchAll(/fontSize: (\d+)\b/g)].map((m) => Number(m[1]));
  const remv = [...code.matchAll(/fontSize: "([0-9.]+)rem"/g)].map((m) => Number(m[1]) * 16);
  const 小さい = [...px, ...remv].filter((n) => n < 15);
  ok(`★★15px 相当より小さいものが無い（いま ${小さい.join(", ") || "なし"}）`, 小さい.length === 0);
  // ★★16px より小さい入力欄は、★iOS で画面が勝手に拡大します。
  //   ★拡大されると、★戻し方が分からない方がいらっしゃいます。
  //   ★max( ) にしてあります。★大きくはなれて、★小さくはなりません。
  ok("★入力欄に、16px の下限がある",
    /fontSize: "max\(16px, [0-9.]+rem\)", marginBottom: 14/.test(code));
  ok("★px の決め打ちが、本文に残っていない（★大きい飾りは除く）",
    px.filter((n) => n <= 17).length === 0);
  const taps = [...code.matchAll(/minHeight: (\d+)/g)].map((m) => Number(m[1]));
  ok("★押せるものに高さがある", taps.length >= 3 && taps.every((n) => n >= 48));
}

console.log("\n⑧ ★数えること");
ok("★登録を始めたを数える", /countStep\("register_started"\)/.test(code));
ok("★登録を終えたを数える", /countStep\("register_completed"\)/.test(code));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);

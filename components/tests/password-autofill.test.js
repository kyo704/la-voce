#!/usr/bin/env node
/**
 * ★パスワードを、端末に覚えさせること（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-パスワードを主にする（9月4日・訂正2）.md §4
 *
 *   ★★「パスワードを主にする」の意味は、★ここにしかありません。
 *
 *     パスワード   Face ID を1回 → 自動入力 → 入る
 *     6桁         メールを開く → 探す → 覚える → 戻る → 6文字打つ
 *
 *   ★自動入力が出るかどうかは、★HTML の書き方で決まります。
 *   ★★autocomplete を外すと、★パスワードのほうが6桁より遅くなります。
 *     ★そのとき、この判断の意味が、全部消えます。
 *
 *   ★だから、★見張ります。
 *
 *   実行  node components/tests/password-autofill.test.js
 */

const { readRaw } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

// ★input の1つ分を、属性ごと取り出します。
//   ★★中身を「type=password の input」に絞ってから見ます。
//     ★ファイル全体で grep すると、★別の input の属性を拾います。
function inputsIn(src) {
  const out = [];
  const re = /<input\b/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    // ★JSX の { } の中に > が入ることがあるので、深さを数えます。
    let depth = 0;
    let end = -1;
    for (let i = m.index; i < src.length; i += 1) {
      const c = src[i];
      if (c === "{") depth += 1;
      else if (c === "}") depth -= 1;
      else if (c === ">" && depth === 0) { end = i; break; }
    }
    if (end !== -1) out.push(src.slice(m.index, end + 1));
  }
  return out;
}

function passwordInputs(src) {
  return inputsIn(src).filter((t) => /type="password"/.test(t));
}
function emailInputs(src) {
  return inputsIn(src).filter((t) => /type="email"/.test(t));
}

// ---------------------------------------------------------------------------
console.log("\n① ★ログイン ── ★端末が覚えて、次から自動入力すること");
const login = readRaw("app", "login", "page.js");
// ★★本物の form であること。★div にボタンを置くだけでは、保存されません。
ok("★本物の <form> である", /<form\b/.test(login));
ok("★submit のボタンである", /type="submit"/.test(login));
const loginPw = passwordInputs(login);
const loginMail = emailInputs(login);
ok(`★パスワードの欄がある（${loginPw.length}）`, loginPw.length >= 1);
// ★★current-password です。★new-password ではありません。
//   ★取り違えると、★「新しいパスワードを作りますか」と聞かれます。
ok('★パスワードに autocomplete="current-password" がある',
  loginPw.every((t) => /autoComplete="current-password"/.test(t)));
// ★★メールの欄は username です。★email ではありません。
//   ★email だと、★パスワードと組にして覚えてくれません。
ok('★メールに autocomplete="username" がある',
  loginMail.length >= 1 && loginMail.every((t) => /autoComplete="username"/.test(t)));
ok("★name が付いている（★古い端末は、これも見ます）",
  loginPw.every((t) => /name="/.test(t)) && loginMail.every((t) => /name="/.test(t)));

// ---------------------------------------------------------------------------
console.log("\n② ★新規登録 ── ★ここで覚えてもらえないと、次に入れません");
const signup = readRaw("components", "SignupForm.jsx");
ok("★本物の <form> である", /<form\b/.test(signup));
ok("★submit のボタンである", /type="submit"/.test(signup));
const signupPw = passwordInputs(signup);
const signupMail = emailInputs(signup);
// ★★new-password です。★これで「作りますか」が出ます。
ok('★パスワードに autocomplete="new-password" がある',
  signupPw.length >= 1 && signupPw.every((t) => /autoComplete="new-password"/.test(t)));
ok('★メールに autocomplete="username" がある',
  signupMail.length >= 1 && signupMail.every((t) => /autoComplete="username"/.test(t)));

// ---------------------------------------------------------------------------
console.log("\n③ ★パスワードの再設定 ── ★新しいほうを、覚え直してもらうこと");
const reset = readRaw("app", "reset-password", "page.js");
ok("★本物の <form> である", /<form\b/.test(reset));
ok("★submit のボタンである", /type="submit"/.test(reset));
const resetPw = passwordInputs(reset);
ok(`★パスワードの欄がある（${resetPw.length}）`, resetPw.length >= 1);
ok('★すべて autocomplete="new-password" である',
  resetPw.every((t) => /autoComplete="new-password"/.test(t)));
// ★★current-password が混じっていないこと。★混じると、古いほうを入れられます。
ok("★current-password が混じっていない", !/autoComplete="current-password"/.test(reset));

// ---------------------------------------------------------------------------
console.log("\n④ ★★autocomplete の付いていないパスワード欄が、どこにも無いこと");
// ★これが、★この確かめの本体です。
//   ★新しい画面を作った人が、★付け忘れたときに落ちます。
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const missing = [];
const walk = (d) => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(js|jsx)$/.test(e.name)) continue;
    if (p.includes(path.join("components", "tests"))) continue;
    const src = fs.readFileSync(path.join(ROOT, p), "utf-8");
    for (const t of passwordInputs(src)) {
      if (!/autoComplete="(current|new)-password"/.test(t)) missing.push(p);
    }
  }
};
["app", "components"].forEach(walk);
ok(`★付け忘れが無い${missing.length ? "（★" + [...new Set(missing)].join(" ") + "）" : ""}`,
  missing.length === 0);

console.log("\n⑤ ★パスキーを、いまは使っていないこと（訂正2 §5）");
// ★★Supabase の実装は実験的で、「APIは予告なく変わることがある」と書かれています。
//   ★9か月、直せる人が国外にいます。★予告なく変わるものの上に、ログインを置かないこと。
const { readCode } = require("./_source");
const passkeyUsers = [];
const walk2 = (d) => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { walk2(p); continue; }
    if (!/\.(js|jsx)$/.test(e.name)) continue;
    if (p.includes(path.join("components", "tests"))) continue;
    if (/webauthn|navigator\.credentials|enrollWebAuthn|passkey/i.test(readCode(p))) passkeyUsers.push(p);
  }
};
["app", "components", "lib"].forEach(walk2);
ok(`★パスキーを使っていない${passkeyUsers.length ? "（" + passkeyUsers.join(" ") + "）" : ""}`,
  passkeyUsers.length === 0);

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);

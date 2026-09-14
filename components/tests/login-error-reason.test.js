#!/usr/bin/env node

// ============================================================================
// ★入れなかった わけを、★正しく 言うこと
//
//   ★出どころ 2026-09-14、★修正の記録 No.015
//
//   ★★2026-09-14 まで、★どんな わけでも 同じ 一文でした ──
//     「メールアドレスまたはパスワードが正しくありません。」
//   ★★確認メールを まだ 押していない方にも、★これが 出ます。
//     ★★その方は パスワードを 変えます。★それでも 入れません。
//       ★直しようの ない ことを、★直せと 言っていた ことに なります。
//
//   ★★実際に 動かして 見ました（★試し用の 企画）──
//     ★台帳の 返り … {"error_code":"email_not_confirmed"}
//     ★画面の 字　 …「メールアドレスまたはパスワードが正しくありません。」
//
//   ★★言わない ことも 決めて います。
//     ★★「そのメールは 登録されていません」とは 書きません。
//       ★誰が 使っているかを 教える ことに なるからです。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const p = path.join(__dirname, "..", "..", "app", "login", "page.js");
const raw = fs.readFileSync(p, "utf8");
const code = require("./_source").stripComments(raw);

console.log("① わけを 見分ける ところが ある");
t(/function loginErrorKey\(/.test(code), "★わけから 一文を 決める 関数");
t(/email_not_confirmed/.test(code), "★確認まちを 見分ける");
t(/over_request_rate_limit/.test(code) || /429/.test(code), "★回数が 多い ときも 見分ける");
t(/loginErrorKey\(error\)/.test(code), "★実際に 呼んで いる");

console.log("\n② 一文が 9つの 言葉で ある");
const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
["errorLogin", "errorNotConfirmed", "errorTooMany"].forEach((key) => {
  const m = raw.match(new RegExp(key + ":\\s*\\{([^}]*)\\}"));
  if (!m) { t(false, key + " が ある"); return; }
  const missing = LANGS.filter((l) => !new RegExp("\\b" + l + ":").test(m[1]));
  t(missing.length === 0, key + " が 9つ そろって いる"
    + (missing.length ? "（足りない: " + missing.join(",") + "）" : ""));
});

console.log("\n③ 言っては いけない こと");
// ★★「登録されていません」は、★誰が 使っているかを 教えます。
t(!/登録されていません/.test(code), "★「登録されていません」と 書いて いない");
t(!/user not found/i.test(code), "★英語でも 同じ");
// ★★台帳の 生の 言葉を、★そのまま 画面に 出さない こと。
t(!/setError\(error\.message\)/.test(code), "★台帳の 言葉を そのまま 出して いない");

console.log("\n④ 分からない わけは、★これまでどおり");
t(/return "errorLogin";/.test(code), "★既定は もとの 一文");

console.log("\n⑤ 直す 手がかりを 残す");
t(/console\.error\("ログインできませんでした/.test(code), "★言づてに 残して いる");

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★実際に 出る 字は 見て いません。");
console.log("　★どの 合図を Supabase が 返すかは、★向こう側の 決めです。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);

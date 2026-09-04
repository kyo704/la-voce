#!/usr/bin/env node
/**
 * 復旧コード（サーバ側）の確かめ（2026-09-05）
 *
 *   ★★ここで守るのは、★「元のコードを、こちらに残さないこと」です。
 *
 *   実行  node components/tests/recovery-code-server.test.js
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

// ★★import の別名（@/lib/...）は Next のビルドが解きます。
//   ★ここでは相対に直してから読みます。★中身はコピーしません。
async function loadServerModule() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "recoveryCodeServer.js"), "utf-8")
    .replace('from "./recoveryCode"',
      'from "data:text/javascript;base64,' +
      Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "recoveryCode.js"))).toString("base64") + '"');
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const m = await loadServerModule();

  console.log("\n① ★作る");
  const a = await m.createRecoveryCode();
  ok("★コードが12文字ある", a.code.length === 12);
  ok("★塩がある", typeof a.salt === "string" && a.salt.length >= 32);
  ok("★ハッシュが32バイト（16進で64文字）", a.hash.length === 64);
  const b = await m.createRecoveryCode();
  ok("★★毎回ちがうコードが出る", a.code !== b.code);
  ok("★塩も毎回ちがう", a.salt !== b.salt);

  console.log("\n② ★照らす");
  ok("★正しいコードは、とおる", await m.verifyRecoveryCode(a.code, a.salt, a.hash));
  ok("★ちがうコードは、とおらない", !(await m.verifyRecoveryCode(b.code, a.salt, a.hash)));
  ok("★塩がちがえば、とおらない", !(await m.verifyRecoveryCode(a.code, b.salt, a.hash)));
  ok("★空のコードで、とおらない", !(await m.verifyRecoveryCode("", a.salt, a.hash)));
  ok("★ハッシュが無いとき、とおらない", !(await m.verifyRecoveryCode(a.code, a.salt, null)));
  // ★★長さが違うハッシュを渡されても、★落ちないこと（★落ちると 500 になります）。
  ok("★こわれたハッシュでも、落ちずに false",
    !(await m.verifyRecoveryCode(a.code, a.salt, "00ff")));
  ok("★16進でない文字でも、落ちずに false",
    !(await m.verifyRecoveryCode(a.code, a.salt, "これは16進ではありません")));

  console.log("\n③ ★★元のコードを、こちらに残さないこと");
  const code = readCode("lib", "recoveryCodeServer.js");
  // ★★Buffer.from に引っかからないよう、★DB の言葉だけを見ます。
  //   ★このファイルは、★照らすだけです。★保存はしません（route の仕事）。
  ok("★このファイルは、保存する処理を持たない",
    !/supabase|\.insert\(|\.upsert\(|\.update\(|createAdminClient/.test(code));
  // ★★ログに出さないこと。★出た瞬間に、Vercel の記録に残ります。
  ok("★console に出していない", !/console\./.test(code));

  console.log("\n④ ★時間の差で当てられないこと");
  ok("★timingSafeEqual を使っている", /timingSafeEqual/.test(code));
  ok("★=== で照らしていない", !/hash\s*===|===\s*expectedHash/.test(code));

  console.log("\n⑤ ★重さの決めごと");
  ok("★scrypt を使っている（★平の SHA だけにしない）", /scrypt/.test(code));
  ok("★N を上げたときに、maxmem も見ていること（★書いてある）",
    /maxmem/i.test(fs.readFileSync(path.join(ROOT, "lib", "recoveryCodeServer.js"), "utf-8")));

  console.log("\n⑥ ★ブラウザに入れないこと");
  const raw = fs.readFileSync(path.join(ROOT, "lib", "recoveryCodeServer.js"), "utf-8");
  ok('★"use client" が付いていない', !/"use client"/.test(raw));
  ok("★node:crypto を使っている（★サーバ専用だと分かる）", /node:crypto/.test(raw));
  // ★★client component から読まれていないこと。
  const offenders = [];
  for (const dir of ["components", "app"]) {
    const walk = (d) => {
      for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { walk(p); continue; }
        if (!/\.(js|jsx)$/.test(e.name)) continue;
        const t = fs.readFileSync(path.join(ROOT, p), "utf-8");
        if (/recoveryCodeServer/.test(t) && /^["']use client["']/m.test(t)) offenders.push(p);
      }
    };
    walk(dir);
  }
  ok(`★client component から読まれていない${offenders.length ? "（" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();

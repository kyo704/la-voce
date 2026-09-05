#!/usr/bin/env node
/**
 * 大事な操作の前の、もう一度の確かめ（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §4
 *
 *   実行  node components/tests/reauth.test.js
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
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "reauth.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);

  console.log("\n① ★確かめる操作は、4つだけ");
  // ★★記録するたびに確かめさせると、★毎日パスワードを聞くことになります。
  ok("★4つで、過不足がない",
    JSON.stringify(Object.values(m.REAUTH_ACTIONS).sort())
      === JSON.stringify(["change_email", "delete", "export", "reissue_recovery"]));
  ok("★記録は、確かめない", !m.needsReauth("save_entry"));
  ok("★見るのも、確かめない", !m.needsReauth("view"));
  ok("★装いを変えるのも、確かめない", !m.needsReauth("equip"));
  ok("★書き出しは、確かめる", m.needsReauth(m.REAUTH_ACTIONS.EXPORT));
  ok("★削除は、確かめる", m.needsReauth(m.REAUTH_ACTIONS.DELETE_ACCOUNT));
  ok("★メールの変更は、確かめる", m.needsReauth(m.REAUTH_ACTIONS.CHANGE_EMAIL));
  ok("★復旧コードの出し直しも、確かめる", m.needsReauth(m.REAUTH_ACTIONS.REISSUE_RECOVERY));

  console.log("\n② ★確かめが効いている間");
  // ★★5分です（Opus の指定）。★書き出してすぐ削除するときに、二度聞かないため。
  ok("★通ってすぐは、続けられる",
    m.reauthStillValid("2026-09-05T10:00:00Z", "2026-09-05T10:02:00Z"));
  ok("★時間が経てば、また確かめる",
    !m.reauthStillValid("2026-09-05T10:00:00Z", "2026-09-05T10:30:00Z"));
  ok("★ちょうど5分を過ぎたら、確かめ直す",
    !m.reauthStillValid("2026-09-05T10:00:00Z", "2026-09-05T10:05:01Z"));
  ok("★決めは5分", m.REAUTH_VALID_MINUTES === 5);
  ok("★確かめていなければ、通さない", !m.reauthStillValid(null, "2026-09-05T10:00:00Z"));
  ok("★読めない時刻で、通さない", !m.reauthStillValid("こわれた値", "2026-09-05T10:00:00Z"));
  // ★★端末の時計は、ずれます。★ずらされることもあります。
  ok("★★先の時刻を渡されても、通さない",
    !m.reauthStillValid("2026-09-05T11:00:00Z", "2026-09-05T10:00:00Z"));
  // ★★10分は、まだ試していません（2026-09-05）。実機で計ってから直します。
  ok("★長さが、1か所で決まっている", typeof m.REAUTH_VALID_MINUTES === "number");

  console.log("\n③ ★★確かめるのは、サーバ。★いまのセッションを動かさないこと");
  // ★★入ったままで signInWithPassword を呼ぶと、★いまのセッションが書き換わります。
  //   ★だから、★セッションを持たないクライアントで確かめます。
  //   ★（app/api/account/delete/route.js:80 に、先に書いてありました）
  let opts = null;
  const fake = (url, key, o) => { opts = o; return {
    auth: { signInWithPassword: async ({ password }) =>
      (password === "ただしい" ? { error: null } : { error: { message: "no" } }) }
  }; };
  ok("★正しければ true", await m.verifyPassword({
    createPlainClient: fake, url: "u", anonKey: "k", email: "a@b.c", password: "ただしい" }) === true);
  ok("★ちがえば false", await m.verifyPassword({
    createPlainClient: fake, url: "u", anonKey: "k", email: "a@b.c", password: "ちがう" }) === false);
  ok("★空なら false", await m.verifyPassword({
    createPlainClient: fake, url: "u", anonKey: "k", email: "a@b.c", password: "" }) === false);
  // ★★ここが、いちばん大事な確かめです。
  ok("★★セッションを持たない形で作っている（persistSession: false）",
    opts && opts.auth && opts.auth.persistSession === false);
  ok("★勝手に更新しない（autoRefreshToken: false）",
    opts && opts.auth && opts.auth.autoRefreshToken === false);

  console.log("\n③-2 ★画面は、自分で確かめないこと");
  const gate = readCode("components", "ReauthGate.jsx");
  // ★★画面が signInWithPassword を呼ぶと、★いまのセッションが飛びます。
  ok("★ReauthGate が signInWithPassword を呼んでいない",
    !/signInWithPassword/.test(gate));
  ok("★ReauthGate が supabase を触っていない", !/supabase/.test(gate));
  // ★★通っても通らなくても、★パスワードを手元に残さないこと。
  ok("★終わったら、パスワードを消している", /setPassword\(""\)/.test(gate));
  ok("★本物の <form> である（★端末が差し出してくれます）", /<form/.test(gate));
  ok('★autocomplete="current-password" がある',
    /autoComplete="current-password"/.test(gate));
  ok("★入力欄に 16px の下限がある", /fontSize: "max\(16px, [0-9.]+rem\)"/.test(gate));

  console.log("\n④ ★文言");
  const copy = [m.REAUTH_HEADING, m.REAUTH_NOTE, m.REAUTH_FAILED,
    ...Object.values(m.REAUTH_REASON)].join(" ");
  // ★★「本人確認」と書かないこと。★役所の言葉です。
  ok("★「本人確認」と書いていない", !/本人確認/.test(copy));
  // ★何のために聞いているかを、★先に書きます。
  ok("★4つとも、理由が書いてある",
    Object.values(m.REAUTH_ACTIONS).every((a) => m.reauthReason(a).length > 0));
  ok("★どうして聞くのかが、1行ある", m.REAUTH_NOTE.length > 0);
  // ★★「間違っています」と決めつけないこと。
  ok("★断るときに、決めつけていない", !/間違って(います|いる)/.test(m.REAUTH_FAILED));
  ok("★急かす言葉・責める言葉が無い", !/必ず|忘れずに|注意してください/.test(copy));

  console.log("\n⑤ ★この決めが、1か所にあること");
  // ★★復旧コードの側に、同じものが残っていないこと。
  const rc = readCode("lib", "recoveryCode.js");
  ok("★recoveryCode に、同じ決めが残っていない",
    !/REAUTH_ACTIONS|reauthStillValid|REAUTH_VALID_MINUTES/.test(rc));
  // ★画面の側で、4つを並べ直していないこと。
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      // ★★持ち主そのものは、除きます。★ここが並べている場所です。
      if (p === path.join("lib", "reauth.js")) continue;
      const t = readCode(p);
      if (/"reissue_recovery"/.test(t) && !/lib\/reauth|from "@\/lib\/reauth"/.test(t)) offenders.push(p);
    }
  };
  ["app", "components", "lib"].forEach(walk);
  ok(`★よそで並べ直していない${offenders.length ? "（★" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();

#!/usr/bin/env node
/**
 * 6桁への移行の、出し方の確かめ（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §5
 *
 *   実行  node components/tests/otp-migration.test.js
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
  const b64 = Buffer.from(
    fs.readFileSync(path.join(ROOT, "lib", "otpMigration.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);

  console.log("\n① ★★いまは、誰にも出さないこと");
  // ★★文言が決まっておらず、運営者の端末で通しで試していただいていません。
  //   ★この確かめは、★勝手に出はじめたときに落ちます。
  //   ★出すと決めたときに、★ここも一緒に直してください。
  ok("★出す仕掛けが、切ってある", m.OTP_MIGRATION_ROLLOUT_ENABLED === false);
  ok("★切ってあるあいだは、条件がそろっても出ない",
    m.mayShowMigrationPrompt({ hasPassword: true, declinedAt: null, completedAt: null }) === false);

  console.log("\n② ★出す条件（★切り替えたあとの話）");
  const on = { rolloutEnabled: true };
  ok("★パスワードをお持ちの方には、出る",
    m.mayShowMigrationPrompt({ ...on, hasPassword: true }) === true);
  ok("★パスワードをお持ちでない方には、出ない（★移る先がありません）",
    m.mayShowMigrationPrompt({ ...on, hasPassword: false }) === false);
  // ★★一度断られたら、二度と出しません。★催促しないこと。
  ok("★★一度断られたら、二度と出さない",
    m.mayShowMigrationPrompt({ ...on, hasPassword: true, declinedAt: "2026-09-05T00:00:00Z" }) === false);
  ok("★もう移られた方には、出さない",
    m.mayShowMigrationPrompt({ ...on, hasPassword: true, completedAt: "2026-09-05T00:00:00Z" }) === false);
  ok("★何も渡さなくても、落ちない", m.mayShowMigrationPrompt() === false);

  console.log("\n③ ★片道であること");
  ok("★パスワードには戻れない", m.mayReturnToPassword() === false);

  console.log("\n④ ★★順番 ── 復旧コードが先、パスワードを外すのが後");
  const steps = m.MIGRATION_STEPS;
  ok("★復旧コードが、パスワードを外すより前にある",
    steps.indexOf("recovery_code") < steps.indexOf("drop_password"));
  ok("★6桁で入ってみるのが、パスワードを外すより前にある",
    steps.indexOf("verify_otp") < steps.indexOf("drop_password"));
  ok("★説明が、いちばん最初", steps[0] === "explain");
  ok("★何もしていなければ、説明から", m.nextMigrationStep([]) === "explain");
  ok("★説明が済んだら、復旧コード", m.nextMigrationStep(["explain"]) === "recovery_code");
  ok("★ぜんぶ済んだら、null", m.nextMigrationStep([...steps]) === null);
  ok("★渡し忘れても、落ちない", m.nextMigrationStep(undefined) === "explain");

  console.log("\n⑤ ★★逃げ道の無い形にしないこと");
  // ★「パスワードを外した」だけが残ると、その方は復旧コードを持っていません。
  //   ★そこでメールを失うと、★もう誰も助けられません。
  ok("★復旧コード無しでパスワードだけ外れた状態を、危険と分かる",
    m.migrationLeftUnsafe(["explain", "drop_password"]) === true);
  ok("★順番どおりなら、危険ではない",
    m.migrationLeftUnsafe([...m.MIGRATION_STEPS]) === false);
  ok("★まだ何もしていなければ、危険ではない", m.migrationLeftUnsafe([]) === false);

  console.log("\n⑥ ★この判断が、1か所にあること");
  // ★★画面の側で、同じ条件をもう一度組み立てていないこと。
  //   ★このリポジトリで、いちばん多い不具合の形です。
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      const t = readCode(p);
      // ★otp_migration の列を見ているのに、この module を通していない所。
      if (/otp_migration_(declined|completed)_at/.test(t) && !/otpMigration/.test(t)) {
        offenders.push(p);
      }
    }
  };
  ["components", "app", "lib"].forEach(walk);
  ok(`★同じ判断を、よそで組み立てていない${offenders.length ? "（" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();

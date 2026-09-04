// 導線の数（2026-09-04）
//
//   ★★外部の解析サービスを入れません。★経路が増えます。
//   ★★個人を特定しません。★user_id も IP も端末の識別子も持ちません。
//   ★人数ではありません。★回数です。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const read = (...a) => fs.readFileSync(p(...a), "utf8");

const funnelSrc = read("lib", "onboardingFunnel.js");
const client = stripComments(read("lib", "countStep.js"));
const route = stripComments(read("app", "api", "onboarding", "count", "route.js"));
// ★★stripComments は JS の // と /* */ を落とします。
//   ★SQL の -- は落としません。★ここで落とします。
//   ★落とさないと、★理由を書いたコメントに引っかかります
//     （★このリポジトリで、今日3度やった形です）。
const sql = read("supabase", "2026-09-04-onboarding-counts.sql").replace(/--.*$/gm, "");
const android = stripComments(read("components", "AndroidInstallPrompt.jsx"));

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(funnelSrc).toString("base64"));

console.log("\n① ★渡せるのは、段の名前だけであること");
ok("知っている段を受ける", m.isFunnelStep("landing") === true);
ok("★知らない段は受けない", m.isFunnelStep("なにか") === false);
const payload = m.buildCountPayload("landing");
ok("★中身は step だけ", Object.keys(payload).length === 1 && payload.step === "landing");
ok("★知らない段は null", m.buildCountPayload("なにか") === null);
// ★★「入れないでください」ではなく、★入れられない形にします。
ok("★★user_id を渡す口がない", !/user_id|userId/.test(stripComments(funnelSrc)));
ok("★★体調の値を渡す口がない", !/throat|sleep|health/i.test(stripComments(funnelSrc)));

console.log("\n② ★サーバが、日付を決めること");
// ★端末の時計を信じると、★過去や未来に積まれます。
ok("★サーバで日付を作っている", /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(route));
ok("★★受け取った日付を使っていない", !/body\.day|body\.date/.test(route));
ok("★知らない段は 400", /isFunnelStep\(step\)/.test(route) && /status: 400/.test(route));

console.log("\n③ ★数のために、画面を止めないこと");
ok("★待っていない（await していない）", !/await fetch/.test(client));
ok("★失敗を握って捨てている", /\.catch\(\(\) => \{\}\)/.test(client));
ok("★画面が切り替わっても送りきる", /keepalive: true/.test(client));
ok("★知らない段は、送らない", /if \(!body\) return/.test(client));

console.log("\n④ ★外部の解析サービスを入れないこと");
[client, route, android].forEach((src, i) => {
  ok(`★${["画面側","サーバ側","Android"][i]}に、外部の解析サービスが無い`,
    !/google-analytics|gtag|mixpanel|amplitude|posthog|segment|plausible/i.test(src));
});

console.log("\n⑤ ★表が、個人を持たないこと");
ok("★列は day / step / n の3つ", /day date not null,\s*step text not null,\s*n integer/.test(sql));
// ★見るのは★列の定義だけです。
//   ★COMMENT ON の説明文にも「user_id を持たない」と書いてあるので、
//     ★全文で探すと、★説明のほうに当たります。
const 表の定義 = sql.slice(sql.indexOf("create table if not exists public.onboarding_counts"),
                          sql.indexOf(");", sql.indexOf("create table if not exists public.onboarding_counts")));
ok("★表の定義を取り出せた", 表の定義.length > 30);
ok("★★user_id の列が無い", !/user_id/.test(表の定義));
ok("★★IP の列が無い", !/\bip\b|ip_address/.test(表の定義));
ok("★★端末の識別子の列が無い", !/device|fingerprint|session/i.test(表の定義));
// ★ポリシーを1本も作りません。★権限も剥がして2枚にします。
ok("★ポリシーを作っていない", !/create policy/.test(sql));
ok("★anon から剥がしている", /revoke all on public\.onboarding_counts from anon/.test(sql));
ok("★authenticated からも剥がしている",
  /revoke all on public\.onboarding_counts from authenticated/.test(sql));
ok("★関数も、利用者から呼べない",
  /revoke all on function public\.bump_onboarding_count\(date, text\) from public, anon, authenticated/.test(sql));

console.log("\n⑥ ★数が飛ばないこと");
// ★読んでから書く形にすると、同じ瞬間に2人が開いたとき★片方が消えます。
ok("★1文で増やしている", /on conflict \(day, step\) do update set n = public\.onboarding_counts\.n \+ 1/.test(sql));
ok("★★関数の側でも、知らない段を弾く", /UNKNOWN_STEP/.test(sql));

console.log("\n⑦ ★Android の案内");
ok("★beforeinstallprompt を待つ", /addEventListener\("beforeinstallprompt"/.test(android));
ok("★既定の案内を止める", /e\.preventDefault\(\)/.test(android));
ok("★★来ていなければ出さない", /hasDeferredPrompt: !!deferred/.test(android));
ok("★記録を1つ入れたあと", /enteredFirstRecord/.test(android));
ok("★★断られたら、覚えて二度と出さない", /localStorage\.setItem\(DISMISS_KEY/.test(android));
ok("★覚えられなくても落ちない", /catch \(e\) \{/.test(android));
ok("★出口がある", /あとで/.test(read("components", "AndroidInstallPrompt.jsx")));
// ★「インストール」と書くと、ストアを探されます。
ok("★★「インストール」と書いていない", !/インストール/.test(android));
ok("★「ホーム画面に置いておくと」と言っている",
  /ホーム画面に置いておくと/.test(read("components", "AndroidInstallPrompt.jsx")));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();

// メール制限（2026-09-12）
//
//   ★実行権限を、特定の2つのメールアドレスだけに絞ります。
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "emailRestrictions.js"), "utf8");

(async () => {
const G = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

const 元ENV = process.env.NODE_ENV;
process.env.NODE_ENV = "production";

console.log("\n① isAllowedEmail");
ok("許可メール1（kyo0703opera@gmail.com）を許可する", G.isAllowedEmail("kyo0703opera@gmail.com") === true);
ok("許可メール2（+forcode）を許可する", G.isAllowedEmail("kyo0703opera+forcode@gmail.com") === true);
ok("大文字でも許可する", G.isAllowedEmail("KYO0703OPERA@GMAIL.COM") === true);
ok("前後の空白を無視する", G.isAllowedEmail("  kyo0703opera@gmail.com  ") === true);
ok("許可されていないメールを拒否する", G.isAllowedEmail("other@gmail.com") === false);
ok("空文字列を拒否する", G.isAllowedEmail("") === false);
ok("nullを拒否する", G.isAllowedEmail(null) === false);
ok("undefinedを拒否する", G.isAllowedEmail(undefined) === false);

console.log("\n② development環境");
process.env.NODE_ENV = "development";
ok("development環境では、どのメールも許可する", G.isAllowedEmail("any@email.com") === true);
process.env.NODE_ENV = "production";

console.log("\n③ getEmailRestrictionError");
const msg = G.getEmailRestrictionError("test@example.com");
ok("エラーメッセージに『実行権限がありません』を含む", msg.includes("実行権限がありません"));
ok("エラーメッセージに許可メール1を含む", msg.includes("kyo0703opera@gmail.com"));
ok("エラーメッセージに許可メール2を含む", msg.includes("kyo0703opera+forcode@gmail.com"));
ok("エラーメッセージに受け取ったメールを含む", msg.includes("test@example.com"));

console.log("\n④ getAllowedEmails");
const list = G.getAllowedEmails();
ok("許可メールのリストを2件返す", list.length === 2);
ok("リストに許可メール1を含む", list.includes("kyo0703opera@gmail.com"));
ok("リストに許可メール2を含む", list.includes("kyo0703opera+forcode@gmail.com"));
list.push("dummy@example.com");
ok("返すリストは元の配列と独立している", G.getAllowedEmails().length === 2);

console.log("\n⑤ isDevelopmentMode");
process.env.NODE_ENV = "development";
ok("development環境でtrueを返す", G.isDevelopmentMode() === true);
process.env.NODE_ENV = "production";
ok("production環境でfalseを返す", G.isDevelopmentMode() === false);
process.env.NODE_ENV = "test";
ok("test環境でfalseを返す", G.isDevelopmentMode() === false);

process.env.NODE_ENV = 元ENV;

console.log(`\n${通}件 通過 / ${否}件 不合格`);
if (否 > 0) process.exit(1);
})();

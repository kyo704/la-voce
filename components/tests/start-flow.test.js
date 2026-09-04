// 着地の画面（2026-09-04）
//
//   ★★iOS では、ここでブラウザの登録画面を出しません。
//     ★出すと、ホーム画面から開いたとき★ログアウトしています。
//   ★アプリの中のブラウザでは、★置く道がありません。
//     ★★押せないものを、見せないこと。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const raw = fs.readFileSync(p("components", "StartFlow.jsx"), "utf8");
const code = stripComments(raw);
const page = stripComments(fs.readFileSync(p("app", "hajimeru", "page.js"), "utf8"));

console.log("\n① ★判定を、1か所から引くこと");
ok("★lib/platform.js を使っている", /from "@\/lib\/platform"/.test(code));
ok("★nextStep を使っている", /nextStep\(\{/.test(code));
// ★画面の中で、自前の見分けを書かないこと。★2か所になります。
ok("★★自前で UserAgent を見分けていない",
  !/iPhone\|iPad|test\(navigator\.userAgent\)/.test(code));
ok("★★自前で standalone を見ていない", !/display-mode: standalone/.test(code));

console.log("\n② ★★iOS では、登録を先に出さないこと");
// ★ここを間違えると、★いちばん嬉しい瞬間に、いちばん冷たいことが起きます。
const iAdd = code.indexOf("STEP.IOS_ADD_TO_HOME");
const iSignup = code.indexOf('href="/signup"');
ok("★案内へ分岐している", iAdd > 0);
ok("★★案内の分岐が、登録のリンクより先にある", iAdd > 0 && iSignup > 0 && iAdd < iSignup);
ok("★案内の部品を使っている", /<AddToHomeGuide/.test(code));
// ★2026-09-04、数える呼び出しを足したので、書き方が変わりました。
//   ★見たいのは「あとで を受け取って、skipped にすること」です。
//   ★★書き方ではありません。
ok("★「あとで」を受け取っている", /onSkip=\{[^}]*setSkipped\(true\)/.test(code));
ok("★「あとで」も数えている", /countStep\("add_to_home_skipped"\)/.test(code));

console.log("\n③ ★アプリの中のブラウザ");
ok("★見分けている", /shouldAskToOpenInBrowser\(/.test(code));
ok("★開き直しを伝えている", /ブラウザで開いてください/.test(raw));
// ★開き方は、アプリの版で変わります。★手順を細かく書かないこと。
ok("★★手順を細かく書いていない", !/右上の\.\.\.を押して|3点リーダー/.test(raw));
ok("★アプリの名前を出せる", /inAppBrowserLabel\(/.test(code));

console.log("\n④ ★「あとで」を押した方に、先に伝えること");
// ★★不利なことを、先に書きます。★あとで驚かせません。
ok("★もう一度数字を入れることを、先に伝える",
  /もう一度だけ、数字を入れていただきます/.test(raw));
ok("★置く道も残している", /ホーム画面に置く/.test(raw));

console.log("\n⑤ ★着地の画面の決まり");
// ★値段だけ見せると止まります。★「無料で使える」を必ず書きます。
ok("★★「無料でお使いいただけます」がある", /無料でお使いいただけます/.test(raw));
ok("★金額を出している", /priceYen/.test(code));
ok("★★金額を直書きしていない", !/580|5,800|5800/.test(code));
ok("★すでにお使いの方への道がある", /すでにお使いの方/.test(raw));
ok("★はじめるボタンがある", /はじめる/.test(raw));

console.log("\n⑥ ★言葉の決まり");
ok("★★「インストール」と書いていない", !/インストール/.test(code));
ok("★★「ありがとう」と書いていない", !/ありがとう/.test(code));

console.log("\n⑦ ★描き分けを、サーバでしないこと");
// ★サーバには navigator がありません。★描き分けると食い違います。
ok("★描いたあとに見分けている", /useEffect\(\(\) => \{[\s\S]{0,120}readPlatform\(\)/.test(code));
ok("★最初は、どちらでもない形を出す", /読み込んでいます/.test(raw));
ok("★ページ自体は判定を持たない", !/readPlatform|navigator/.test(page));

console.log("\n⑧ ★長い中身を、真ん中に寄せないこと");
// ★真ん中に寄せるのは、★中身が画面より短いときだけです。
//   ★長い中身を寄せると、★上下が画面の外へ出ます。
ok("★寄せるかどうかを、呼ぶ側が決められる", /function Shell\(\{ children, center = true \}\)/.test(code));
ok("★★案内のときは、寄せない", /<Shell center=\{false\}>/.test(code));
ok("★中身が短い画面は、寄せたまま", /<Shell>/.test(code));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);

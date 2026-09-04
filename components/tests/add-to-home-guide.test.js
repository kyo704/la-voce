// ホーム画面に置く案内（2026-09-04）
//
//   ★★iOS では、ホーム画面版と Safari で保存場所が別です。
//   ★だから、置いてから登録します。
//   ★★この画面は、自動で次に進めません。
//     ★追加したかどうかを、アプリは知りません。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const raw = fs.readFileSync(p("components", "AddToHomeGuide.jsx"), "utf8");
const code = stripComments(raw);

console.log("\n① ★実物のスクリーンショットを使うこと");
["ios-1.png", "ios-2.png", "ios-3.png"].forEach((n) => {
  ok(`★${n} がある`, fs.existsSync(p("public", "onboarding", n)));
  ok(`★${n} を使っている`, code.includes(`/onboarding/${n}`));
});
// ★重いと、案内の画面が遅くなります。★1枚 500KB を超えないこと。
["ios-1.png", "ios-2.png", "ios-3.png"].forEach((n) => {
  const size = fs.statSync(p("public", "onboarding", n)).size;
  ok(`★${n} が重すぎない（${Math.round(size / 1024)}KB）`, size < 500 * 1024);
});

console.log("\n② ★言葉の決まり");
// ★「インストール」と書くと、ストアを探されます。
ok("★★「インストール」と書いていない", !/インストール/.test(code));
// ★追加したかどうかを、アプリは知りません。
ok("★★「ありがとう」と書いていない", !/ありがとう/.test(code));
ok("★「ホーム画面に置く」と言っている", /ホーム画面に置き/.test(code));
// ★共有ボタンの位置は、Safari の設定で上にも下にもなります。
//   ★だから、言葉では場所を断定しません。
ok("★★「画面の下の」と言い切っていない", !/画面の下の/.test(code));

console.log("\n③ ★出口があること");
ok("★「あとで」がある", /あとで/.test(code));
ok("★onSkip を呼んでいる", /onClick=\{onSkip\}/.test(code));
ok("★「もどる」がある", /もどる/.test(code));
// ★★自動で次に進めないこと。★追加したかは分かりません。
ok("★★自動で進む仕掛けが無い", !/setTimeout|setInterval|router\.push/.test(code));

console.log("\n④ ★段の数を見せること");
ok("★段の印を出している", /STEPS\.map/.test(code));
ok("★3段ある", (code.match(/src: "\/onboarding\/ios-/g) || []).length === 3);

console.log("\n⑤ ★アイコンの絵を出すこと（★探せない人がいます）");
ok("★アイコンを出している", /icon-120\.png/.test(code));
ok("★アイコンのファイルがある", fs.existsSync(p("public", "icon-120.png")));

console.log("\n⑥ ★目の見えない方にも届くこと");
const alts = raw.match(/alt: "([^"]+)"/g) || [];
ok("★3枚とも alt がある", alts.length === 3);
ok("★alt が中身を言っている（★「画像」だけにしない）",
  alts.every((a) => a.length > 20));
ok("★アイコンにも alt がある", /alt="Woolsong のアイコン/.test(raw));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
